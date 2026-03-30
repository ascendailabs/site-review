import * as cheerio from "cheerio";

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

  return content;
}
