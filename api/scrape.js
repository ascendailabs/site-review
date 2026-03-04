import * as cheerio from "cheerio";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "url required" });

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Page returned ${response.status}` });
    }

    const html = await response.text();
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
      sections: [], // ordered content sections: { type, text, children? }
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
    // Look for section-like containers
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

    return res.status(200).json(content);
  } catch (err) {
    console.error("Scrape error:", err);
    return res.status(500).json({ error: "Failed to fetch page content" });
  }
}
