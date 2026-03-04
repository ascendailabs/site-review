import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  const { pageId } = req.query;
  if (!pageId) return res.status(400).json({ error: "pageId required" });

  const key = `annotations-${pageId}`;

  if (req.method === "GET") {
    try {
      const data = await kv.get(key);
      return res.status(200).json(data || { screenshots: [] });
    } catch (err) {
      console.error("Annotations GET error:", err);
      return res.status(500).json({ error: "Failed to load annotations" });
    }
  }

  if (req.method === "POST") {
    try {
      const { screenshots } = req.body;
      await kv.set(key, { screenshots, savedAt: new Date().toISOString() });
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Annotations POST error:", err);
      return res.status(500).json({ error: "Failed to save annotations" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
