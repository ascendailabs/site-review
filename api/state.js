import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const state = await kv.get("review-state");
      if (!state) return res.status(200).json({ pageStates: null, sectionOrder: null, pageOrder: null });
      return res.status(200).json(state);
    } catch (err) {
      console.error("KV GET error:", err);
      return res.status(500).json({ error: "Failed to load state" });
    }
  }

  if (req.method === "POST") {
    try {
      const { pageStates, sectionOrder, pageOrder } = req.body;
      const state = { pageStates, sectionOrder, pageOrder, savedAt: new Date().toISOString(), version: 2 };
      await kv.set("review-state", state);
      return res.status(200).json({ success: true, savedAt: state.savedAt });
    } catch (err) {
      console.error("KV POST error:", err);
      return res.status(500).json({ error: "Failed to save state" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
