import { kv } from "@vercel/kv";

function countPageData(pageStates) {
  if (!pageStates || typeof pageStates !== "object") return 0;
  let score = 0;
  for (const [, ps] of Object.entries(pageStates)) {
    if (ps.status && ps.status !== "unreviewed") score++;
    if (ps.priority && ps.priority !== "none") score++;
    if (ps.note) score++;
    if (ps.markupUrl) score++;
    if (ps.reviewers?.length) score += ps.reviewers.length;
    if (ps.contentSlots?.length) score++;
    if (ps.todos?.length) score += ps.todos.length;
    if (ps.finished) score++;
  }
  return score;
}

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
      const { pageStates, sectionOrder, pageOrder, sectionMeta, customSections } = req.body;
      const newState = { pageStates, sectionOrder, pageOrder, sectionMeta, customSections, savedAt: new Date().toISOString(), version: 3 };

      // --- Data-loss prevention ---
      const existing = await kv.get("review-state");
      if (existing) {
        const existingScore = countPageData(existing.pageStates);
        const newScore = countPageData(pageStates);

        // Block saving if new state has dramatically less data than existing
        if (existingScore > 5 && newScore < existingScore * 0.3) {
          console.error(`DATA LOSS PREVENTED: existing score ${existingScore}, new score ${newScore}`);
          return res.status(409).json({
            error: "Save blocked: new state has significantly less data than existing state. This may indicate data loss.",
            existingScore,
            newScore,
          });
        }

        // Backup current state before overwriting
        await kv.set("review-state-backup", { ...existing, backedUpAt: new Date().toISOString() });
      }

      await kv.set("review-state", newState);
      return res.status(200).json({ success: true, savedAt: newState.savedAt });
    } catch (err) {
      console.error("KV POST error:", err);
      return res.status(500).json({ error: "Failed to save state" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
