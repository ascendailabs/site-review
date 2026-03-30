import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  // GET — download current state or auto-backup as JSON file
  if (req.method === "GET") {
    try {
      const source = req.query.source === "auto" ? "review-state-backup" : "review-state";
      const state = await kv.get(source);
      if (!state) {
        if (source === "review-state-backup") {
          return res.status(404).json({ error: "No auto-backup found" });
        }
        return res.status(200).json({});
      }
      const filename = `ascendlabs-review-${source === "review-state-backup" ? "autobackup-" : ""}${new Date().toISOString().slice(0, 10)}.json`;
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", "application/json");
      return res.status(200).json(state);
    } catch (err) {
      console.error("KV backup error:", err);
      return res.status(500).json({ error: "Failed to create backup" });
    }
  }

  // POST — restore from auto-backup key into review-state
  if (req.method === "POST" && req.query.action === "restore-auto") {
    try {
      const backup = await kv.get("review-state-backup");
      if (!backup) {
        return res.status(404).json({ error: "No auto-backup found to restore" });
      }
      // Save current state as a safety net before restoring
      const current = await kv.get("review-state");
      if (current) {
        await kv.set("review-state-pre-restore", { ...current, preRestoreAt: new Date().toISOString() });
      }
      // Restore backup into main state
      const restored = { ...backup, restoredAt: new Date().toISOString() };
      delete restored.backedUpAt;
      await kv.set("review-state", restored);
      return res.status(200).json({ success: true, restoredAt: restored.restoredAt, savedAt: backup.savedAt });
    } catch (err) {
      console.error("KV restore error:", err);
      return res.status(500).json({ error: "Failed to restore from backup" });
    }
  }

  // POST — check if auto-backup exists (for UI)
  if (req.method === "POST" && req.query.action === "check-auto") {
    try {
      const backup = await kv.get("review-state-backup");
      if (!backup) {
        return res.status(200).json({ exists: false });
      }
      const pageCount = backup.pageStates ? Object.keys(backup.pageStates).length : 0;
      return res.status(200).json({
        exists: true,
        savedAt: backup.savedAt,
        backedUpAt: backup.backedUpAt,
        pageCount,
      });
    } catch (err) {
      return res.status(500).json({ error: "Failed to check backup" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
