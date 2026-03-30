import { parseHtml } from "./_parseHtml.js";

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
    const content = parseHtml(html);

    return res.status(200).json(content);
  } catch (err) {
    console.error("Scrape error:", err);
    return res.status(500).json({ error: "Failed to fetch page content" });
  }
}
