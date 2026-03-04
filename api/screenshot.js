import { put, del } from "@vercel/blob";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { pageId, filename } = req.query;
    if (!pageId || !filename) {
      return res.status(400).json({ error: "pageId and filename required" });
    }
    try {
      const blob = await put(`screenshots/${pageId}/${Date.now()}-${filename}`, req, {
        access: "public",
        contentType: req.headers["content-type"] || "image/png",
      });
      return res.status(200).json({ url: blob.url, uploadedAt: new Date().toISOString() });
    } catch (err) {
      console.error("Blob upload error:", err);
      return res.status(500).json({ error: "Failed to upload screenshot" });
    }
  }

  if (req.method === "DELETE") {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "url required" });
    try {
      await del(url);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Blob delete error:", err);
      return res.status(500).json({ error: "Failed to delete screenshot" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
