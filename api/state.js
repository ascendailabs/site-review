import { kv } from "@vercel/kv";

// Rough "how much data is in this state" score — used by the data-loss guard.
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
    if (ps.qualityChecklist) {
      score += Object.values(ps.qualityChecklist).filter(Boolean).length;
    }
  }
  return score;
}

// True for plain objects only — rejects arrays, null, primitives. typeof [] === "object"
// so a naive typeof check would let arrays through and corrupt downstream code that
// expects keyed-by-id maps.
function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

// Validate the shape of a POST body. Returns an error message string if invalid, or null if OK.
function validateBody(body) {
  if (!isPlainObject(body)) return "Body must be a plain object";
  const { pageStates, sectionOrder, pageOrder, sectionMeta, customSections } = body;
  if (pageStates != null && !isPlainObject(pageStates)) return "pageStates must be a plain object";
  if (sectionOrder != null && !isPlainObject(sectionOrder)) return "sectionOrder must be a plain object";
  if (pageOrder != null && !isPlainObject(pageOrder)) return "pageOrder must be a plain object";
  if (sectionMeta != null && !isPlainObject(sectionMeta)) return "sectionMeta must be a plain object";
  if (customSections != null && !isPlainObject(customSections)) return "customSections must be a plain object";
  // Each pageStates value should itself be an object (not an array, not a primitive).
  if (pageStates) {
    for (const [pid, ps] of Object.entries(pageStates)) {
      if (!isPlainObject(ps)) return `pageStates["${pid}"] must be a plain object`;
    }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const state = await kv.get("review-state");
      if (!state) {
        return res.status(200).json({
          pageStates: null,
          sectionOrder: null,
          pageOrder: null,
        });
      }
      return res.status(200).json(state);
    } catch (err) {
      console.error("KV GET error:", err);
      return res.status(500).json({ error: "Failed to load state" });
    }
  }

  if (req.method === "POST") {
    try {
      // --- Boundary validation ---
      const validationError = validateBody(req.body);
      if (validationError) {
        return res.status(400).json({ error: "invalid_body", message: validationError });
      }

      // Reject obviously oversized payloads before sending to KV (Upstash has a ~1MB cap).
      const bodySize = JSON.stringify(req.body).length;
      if (bodySize > 900_000) {
        return res.status(413).json({
          error: "payload_too_large",
          message: `Request body is ${bodySize} bytes, exceeds the 900KB safety limit.`,
        });
      }

      const { pageStates, sectionOrder, pageOrder, sectionMeta, customSections } = req.body;

      const existing = await kv.get("review-state");

      // --- Data-loss guard (last line of defense) ---
      // If the existing state has substantial data and the new state has dramatically less,
      // refuse the save. This prevents the empty-state-overwrite class of bugs from destroying data.
      if (existing) {
        const existingScore = countPageData(existing.pageStates);
        const newScore = countPageData(pageStates);
        if (existingScore > 5 && newScore < existingScore * 0.3) {
          console.error(
            `DATA LOSS PREVENTED: existing score ${existingScore}, new score ${newScore}`
          );
          return res.status(409).json({
            error: "data_loss_guard",
            message:
              "Save blocked: new state has significantly less data than existing state. This may indicate data loss.",
            existingScore,
            newScore,
          });
        }

        // Backup current state before overwriting.
        await kv.set("review-state-backup", {
          ...existing,
          backedUpAt: new Date().toISOString(),
        });
      }

      const newState = {
        pageStates,
        sectionOrder,
        pageOrder,
        sectionMeta,
        customSections,
        savedAt: new Date().toISOString(),
      };

      await kv.set("review-state", newState);
      return res.status(200).json({ success: true, savedAt: newState.savedAt });
    } catch (err) {
      console.error("KV POST error:", err);
      return res.status(500).json({ error: "Failed to save state" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
