import * as cheerio from "cheerio";

const GENERIC_CLASSES = new Set([
  "container", "wrapper", "section", "row", "col", "flex", "grid", "block",
  "relative", "overflow",
]);

const TEXT_SELECTORS = [
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "a", "button",
  "[role='button']", "blockquote", "figcaption", "dt", "dd",
].join(", ");

/**
 * Derive a section name from the nearest landmark parent element.
 */
function deriveSection($, el) {
  const $el = $(el);

  // Walk up to find nearest landmark
  const nav = $el.closest("nav");
  if (nav.length) return "nav";

  const footer = $el.closest("footer");
  if (footer.length) return "footer";

  const header = $el.closest("header");
  if (header.length) return "header";

  const section = $el.closest("section");
  if (section.length) {
    // Try to derive a meaningful name from class or id
    const id = section.attr("id") || "";
    const classes = (section.attr("class") || "").split(/\s+/);

    // Check id first
    if (id) {
      const cleaned = id.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
      if (cleaned && !GENERIC_CLASSES.has(cleaned)) return cleaned;
    }

    // Check classes
    for (const cls of classes) {
      const cleaned = cls.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
      if (cleaned && !GENERIC_CLASSES.has(cleaned)) return cleaned;
    }
  }

  return "global";
}

/**
 * Build a human-readable context string like "hero heading" or "nav link".
 */
function buildContext(section, tagName) {
  const tagLabels = {
    h1: "heading", h2: "heading", h3: "heading", h4: "heading", h5: "heading", h6: "heading",
    p: "paragraph", li: "list item", a: "link", button: "button",
    blockquote: "quote", figcaption: "caption", dt: "term", dd: "definition",
  };
  const label = tagLabels[tagName] || tagName;
  return `${section} ${label}`;
}

/**
 * Walk the full DOM and return a flat array of every text element
 * with section context and stable IDs.
 */
export function extractElements(html) {
  const $ = cheerio.load(html);

  const metaTitle = $("title").first().text().trim();
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    "";

  // Remove noise elements
  $("script, style, noscript, svg, iframe").remove();

  const elements = [];
  const seenText = new Map(); // text -> index in elements array
  const sectionTagCounters = {}; // "section-tag" -> count
  const sectionOrder = []; // track order of first appearance
  const sectionOrderSet = new Set();

  $(TEXT_SELECTORS).each((_, el) => {
    const $el = $(el);

    // Get the actual tag name (role="button" elements use their real tag)
    let tagName = el.tagName?.toLowerCase() || el.name?.toLowerCase();
    // Skip label and option
    if (tagName === "label" || tagName === "option") return;

    // For [role='button'] that aren't actual buttons, normalize to "button"
    if (tagName !== "button" && $el.attr("role") === "button") {
      tagName = "button";
    }

    const text = $el.text().trim();
    if (!text || text.length < 4) return;

    // Duplicate check
    if (seenText.has(text)) {
      const existingIdx = seenText.get(text);
      elements[existingIdx].duplicateCount =
        (elements[existingIdx].duplicateCount || 1) + 1;
      return;
    }

    const section = deriveSection($, el);

    // Track section order
    if (!sectionOrderSet.has(section)) {
      sectionOrderSet.add(section);
      sectionOrder.push(section);
    }

    // Generate stable id: section-tag-index
    const counterKey = `${section}-${tagName}`;
    sectionTagCounters[counterKey] = (sectionTagCounters[counterKey] || 0) + 1;
    const index = sectionTagCounters[counterKey];
    const id = `${section}-${tagName}-${index}`;

    const sectionIndex = sectionOrder.indexOf(section);
    const context = buildContext(section, tagName);

    const element = {
      id,
      tag: tagName,
      text,
      section,
      sectionIndex,
      context,
    };

    seenText.set(text, elements.length);
    elements.push(element);
  });

  return { elements, metaTitle, metaDescription };
}

/**
 * Parse HTML and extract structured content.
 * Shared by /api/scrape (live page fetch) and /api/parse-artifact (uploaded HTML).
 */
export function parseHtml(html) {
  const $ = cheerio.load(html);

  // Remove script, style, nav, footer, header elements to focus on main content
  $("script, style, noscript, svg, iframe").remove();

  const content = {
    metaTitle: $("title").first().text().trim(),
    metaDescription:
      $('meta[name="description"]').attr("content")?.trim() ||
      $('meta[property="og:description"]').attr("content")?.trim() ||
      "",
    h1s: [],
    h2s: [],
    h3s: [],
    paragraphs: [],
    buttons: [],
    sections: [],
  };

  // Extract headings
  $("h1").each((_, el) => {
    const text = $(el).text().trim();
    if (text) content.h1s.push(text);
  });
  $("h2").each((_, el) => {
    const text = $(el).text().trim();
    if (text) content.h2s.push(text);
  });
  $("h3").each((_, el) => {
    const text = $(el).text().trim();
    if (text) content.h3s.push(text);
  });

  // Extract paragraphs (non-trivial length)
  $("p").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 15) content.paragraphs.push(text);
  });

  // Extract buttons and CTA-like elements
  $(
    'button, a[class*="btn"], a[class*="cta"], a[class*="button"], [role="button"], a[class*="Btn"], a[class*="CTA"]'
  ).each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 1 && text.length < 80) {
      content.buttons.push(text);
    }
  });

  // Build ordered sections by walking major content areas
  const mainContent = $("main, [role='main'], article, .content, #content, body");
  mainContent.first().find("section, [class*='section'], [class*='Section']").each((_, section) => {
    const $sec = $(section);
    const heading = $sec.find("h2, h3").first().text().trim();
    const paras = [];
    $sec.find("p").each((_, p) => {
      const t = $(p).text().trim();
      if (t.length > 15) paras.push(t);
    });
    const btns = [];
    $sec.find('button, a[class*="btn"], a[class*="cta"], a[class*="button"], [role="button"]').each((_, b) => {
      const t = $(b).text().trim();
      if (t && t.length > 1 && t.length < 80) btns.push(t);
    });
    if (heading || paras.length > 0) {
      content.sections.push({ heading, paragraphs: paras, buttons: btns });
    }
  });

  // Deduplicate buttons
  content.buttons = [...new Set(content.buttons)];

  // Add full element extraction
  const extracted = extractElements(html);
  content.elements = extracted.elements;

  return content;
}
