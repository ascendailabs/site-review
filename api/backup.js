import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const state = await kv.get("review-state");
    const filename = `ascendlabs-review-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json(state || {});
  } catch (err) {
    console.error("KV backup error:", err);
    return res.status(500).json({ error: "Failed to create backup" });
  }
}
