import { parseHtml } from "./_parseHtml.js";

export const config = { api: { bodyParser: false } };

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
    const html = Buffer.concat(chunks).toString("utf-8");

    if (!html || html.length < 10) {
      return res.status(400).json({ error: "No HTML content provided" });
    }

    const content = parseHtml(html);
    return res.status(200).json(content);
  } catch (err) {
    console.error("Parse artifact error:", err);
    return res.status(500).json({ error: "Failed to parse artifact HTML" });
  }
}
