import { parseHtml } from "./_parseHtml.js";

export const config = { api: { bodyParser: false } };

const CLAUDE_WRAPPER_ERROR =
  "This looks like the Claude page wrapper, not the artifact content. To save the artifact: right-click inside the artifact preview → View Frame Source → Save As.";

/**
 * Detect input type and extract the actual artifact HTML.
 * Returns { html, format } or { error }.
 */
function extractHtml(raw) {
  // 1. MHTML detection — starts with "From:" or has MIME multipart markers
  const isMhtml =
    raw.trimStart().startsWith("From:") ||
    (raw.includes("MIME-Version:") && /Content-Type:\s*multipart/i.test(raw));

  if (isMhtml) {
    const result = extractFromMhtml(raw);
    if (result.error) return result;
    return { html: result.html, format: "mhtml" };
  }

  // 2. Clean artifact HTML — has semantic page content
  const hasSemanticContent =
    raw.includes("artifacts-component-root-html") ||
    (/<body[\s>]/i.test(raw) &&
      (/<section[\s>]/i.test(raw) || /<h1[\s>]/i.test(raw) || /<nav[\s>]/i.test(raw) || /<footer[\s>]/i.test(raw)));

  if (hasSemanticContent && !isClaudeWrapper(raw)) {
    return { html: raw, format: "clean" };
  }

  // 3. Claude wrapper detection
  if (isClaudeWrapper(raw)) {
    // Try to extract embedded content (e.g. from an iframe srcdoc)
    const embedded = extractEmbeddedFromWrapper(raw);
    if (embedded) return { html: embedded, format: "wrapper-extracted" };
    return { error: CLAUDE_WRAPPER_ERROR };
  }

  // 4. Fallback — treat as HTML if it has any HTML-like content
  if (/<[a-z][\s\S]*>/i.test(raw)) {
    return { html: raw, format: "fallback" };
  }

  return { error: "Could not detect valid HTML content in the uploaded file." };
}

function isClaudeWrapper(raw) {
  return (
    raw.includes("Content is user-generated") ||
    raw.includes("claudeusercontent.com") ||
    (raw.includes("claude.ai") && !/<section[\s>]/i.test(raw))
  );
}

function extractEmbeddedFromWrapper(raw) {
  // Look for srcdoc attribute content
  const srcdocMatch = raw.match(/srcdoc="([\s\S]*?)"/);
  if (srcdocMatch) {
    const decoded = srcdocMatch[1]
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    if (/<section[\s>]/i.test(decoded) || /<h1[\s>]/i.test(decoded)) {
      return decoded;
    }
  }
  return null;
}

/**
 * Parse MHTML (MIME-encoded HTML archive).
 * Splits on MIME boundaries, decodes parts, finds the best HTML part.
 */
function extractFromMhtml(raw) {
  // Find the boundary string
  const boundaryMatch = raw.match(/boundary="?([^\s"]+)"?/i);
  if (!boundaryMatch) {
    return { error: "MHTML file has no MIME boundary. The file may be corrupted." };
  }

  const boundary = boundaryMatch[1];
  const parts = raw.split("--" + boundary);

  // Parse each MIME part
  const htmlParts = [];
  for (const part of parts) {
    if (part.trim() === "--" || part.trim() === "") continue;

    // Split headers from body (blank line separates them)
    const headerEnd = part.indexOf("\r\n\r\n");
    const headerEndAlt = part.indexOf("\n\n");
    const splitIdx = headerEnd !== -1 ? headerEnd : headerEndAlt;
    if (splitIdx === -1) continue;

    const headerSection = part.substring(0, splitIdx);
    const bodyStart = headerEnd !== -1 ? splitIdx + 4 : splitIdx + 2;
    let body = part.substring(bodyStart);

    // Check Content-Type
    const ctMatch = headerSection.match(/Content-Type:\s*([^\s;]+)/i);
    if (!ctMatch || !ctMatch[1].toLowerCase().includes("text/html")) continue;

    // Get Content-Location
    const locMatch = headerSection.match(/Content-Location:\s*(.+)/i);
    const location = locMatch ? locMatch[1].trim() : "";

    // Decode content transfer encoding
    const encMatch = headerSection.match(/Content-Transfer-Encoding:\s*(\S+)/i);
    const encoding = encMatch ? encMatch[1].toLowerCase() : "7bit";

    if (encoding === "quoted-printable") {
      body = decodeQuotedPrintable(body);
    } else if (encoding === "base64") {
      body = Buffer.from(body.replace(/\s/g, ""), "base64").toString("utf-8");
    }

    htmlParts.push({ body, location, size: body.length });
  }

  if (htmlParts.length === 0) {
    return { error: "No HTML content found in MHTML file." };
  }

  // Prefer parts that aren't the Claude wrapper and have semantic content
  const semanticParts = htmlParts.filter(
    (p) =>
      !p.location.includes("claude.ai") &&
      (/<section[\s>]/i.test(p.body) || /<nav[\s>]/i.test(p.body) || /<footer[\s>]/i.test(p.body))
  );

  if (semanticParts.length > 0) {
    // Pick the largest semantic part
    semanticParts.sort((a, b) => b.size - a.size);
    return { html: semanticParts[0].body };
  }

  // Fallback: pick the largest non-Claude HTML part
  const nonClaude = htmlParts.filter(
    (p) => !p.location.includes("claude.ai") && !p.body.includes("claudeusercontent.com")
  );

  if (nonClaude.length > 0) {
    nonClaude.sort((a, b) => b.size - a.size);
    return { html: nonClaude[0].body };
  }

  // All parts are Claude wrapper
  return { error: CLAUDE_WRAPPER_ERROR };
}

function decodeQuotedPrintable(str) {
  return str
    .replace(/=\r?\n/g, "") // soft line breaks
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Read raw body from request stream
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const raw = Buffer.concat(chunks).toString("utf-8");

    if (!raw || raw.length < 10) {
      return res.status(400).json({ error: "No content provided" });
    }

    const extracted = extractHtml(raw);
    if (extracted.error) {
      return res.status(422).json({ error: extracted.error });
    }

    const content = parseHtml(extracted.html);
    content.detectedFormat = extracted.format;
    return res.status(200).json(content);
  } catch (err) {
    console.error("Parse artifact error:", err);
    return res.status(500).json({ error: "Failed to parse artifact HTML" });
  }
}
