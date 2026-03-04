import { useState, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Chip,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import UndoIcon from "@mui/icons-material/Undo";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { duplicateSlot, createCustomSlot } from "./data/slotTemplates";

const STATUS_CONFIG = {
  untouched: { label: "Untouched", color: "#9E9E9E", bgColor: "#F5F5F5" },
  approved: { label: "Approved", color: "#2E7D32", bgColor: "#E8F5E9" },
  revised: { label: "Revised", color: "#1565C0", bgColor: "#E3F2FD" },
};

function CompoundField({ subFields, value, onChange, disabled, strikethrough }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
      {subFields.map((field) => (
        <TextField
          key={field}
          size="small"
          fullWidth
          placeholder={field.charAt(0).toUpperCase() + field.slice(1) + "..."}
          label={field.charAt(0).toUpperCase() + field.slice(1)}
          value={(value && value[field]) || ""}
          onChange={(e) => onChange({ ...value, [field]: e.target.value })}
          disabled={disabled}
          multiline
          minRows={1}
          maxRows={4}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{
            "& .MuiInputBase-input": {
              fontSize: 13,
              textDecoration: strikethrough ? "line-through" : "none",
              opacity: strikethrough ? 0.5 : 1,
            },
          }}
        />
      ))}
    </Box>
  );
}

function SlotRow({ slot, index, onUpdate, onDuplicate, onDelete, totalSlots }) {
  const isCompound = Boolean(slot.subFields);
  const status = slot.status || "untouched";
  const cfg = STATUS_CONFIG[status];

  const handleCurrentChange = useCallback(
    (val) => {
      onUpdate(index, { ...slot, currentCopy: val });
    },
    [slot, index, onUpdate]
  );

  const handleRevisedChange = useCallback(
    (val) => {
      onUpdate(index, { ...slot, revisedCopy: val });
    },
    [slot, index, onUpdate]
  );

  const handleApprove = useCallback(() => {
    onUpdate(index, { ...slot, status: "approved" });
  }, [slot, index, onUpdate]);

  const handleRevise = useCallback(() => {
    onUpdate(index, { ...slot, status: "revised" });
  }, [slot, index, onUpdate]);

  const handleUndo = useCallback(() => {
    onUpdate(index, { ...slot, status: "untouched" });
  }, [slot, index, onUpdate]);

  const isApproved = status === "approved";
  const isRevised = status === "revised";
  const showStrikethrough = isApproved || isRevised;

  // Check if revised copy has content
  const hasRevisedContent = isCompound
    ? slot.subFields.some((f) => (slot.revisedCopy?.[f] || "").trim())
    : (slot.revisedCopy || "").trim();

  return (
    <Box
      sx={{
        py: 1.5,
        px: 2,
        borderRadius: 2,
        bgcolor: status !== "untouched" ? cfg.bgColor + "40" : "transparent",
        border: `1px solid ${status !== "untouched" ? cfg.color + "30" : "#E0E0E0"}`,
        mb: 1,
        transition: "all 0.2s",
      }}
    >
      {/* Header row */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 600, fontSize: 13, flex: 1, color: "text.primary" }}
        >
          {slot.label}
        </Typography>

        {slot.isCustom && (
          <Chip label="Custom" size="small" sx={{ fontSize: 10, height: 20, bgcolor: "#F3E5F5", color: "#7B1FA2" }} />
        )}

        {/* Status chip */}
        {status !== "untouched" && (
          <Chip
            label={cfg.label}
            size="small"
            sx={{
              bgcolor: cfg.bgColor,
              color: cfg.color,
              fontWeight: 600,
              fontSize: 11,
              height: 22,
              border: `1px solid ${cfg.color}`,
            }}
          />
        )}

        {/* Action buttons */}
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {status === "untouched" && (
            <>
              <Tooltip title="Approve current copy">
                <IconButton
                  size="small"
                  onClick={handleApprove}
                  sx={{ color: "#2E7D32", "&:hover": { bgcolor: "#E8F5E9" } }}
                >
                  <CheckCircleIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              {hasRevisedContent && (
                <Tooltip title="Mark as revised">
                  <IconButton
                    size="small"
                    onClick={handleRevise}
                    sx={{ color: "#1565C0", "&:hover": { bgcolor: "#E3F2FD" } }}
                  >
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}

          {(isApproved || isRevised) && (
            <Tooltip title="Undo">
              <IconButton
                size="small"
                onClick={handleUndo}
                sx={{ color: "#757575", "&:hover": { bgcolor: "#F5F5F5" } }}
              >
                <UndoIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}

          {slot.isRepeatable && (
            <Tooltip title="Add another">
              <IconButton
                size="small"
                onClick={() => onDuplicate(index)}
                sx={{ color: "#757575", "&:hover": { bgcolor: "#F5F5F5" } }}
              >
                <ContentCopyIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}

          {slot.isCustom && (
            <Tooltip title="Delete custom slot">
              <IconButton
                size="small"
                onClick={() => onDelete(index)}
                sx={{ color: "#757575", "&:hover": { color: "#D32F2F", bgcolor: "#FFEBEE" } }}
              >
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Fields */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: { xs: "wrap", md: "nowrap" } }}>
        {/* Current copy */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: "text.secondary", mb: 0.5, display: "block", fontWeight: 600 }}>
            Current Copy
          </Typography>
          {isCompound ? (
            <CompoundField
              subFields={slot.subFields}
              value={slot.currentCopy}
              onChange={handleCurrentChange}
              disabled={isApproved || isRevised}
              strikethrough={showStrikethrough}
            />
          ) : (
            <TextField
              size="small"
              fullWidth
              multiline
              minRows={1}
              maxRows={6}
              placeholder="Enter current copy..."
              value={slot.currentCopy || ""}
              onChange={(e) => handleCurrentChange(e.target.value)}
              disabled={isApproved || isRevised}
              sx={{
                "& .MuiInputBase-input": {
                  fontSize: 13,
                  textDecoration: showStrikethrough ? "line-through" : "none",
                  opacity: showStrikethrough ? 0.5 : 1,
                },
              }}
            />
          )}
        </Box>

        {/* Revised copy — only show when not approved */}
        {!isApproved && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", mb: 0.5, display: "block", fontWeight: 600 }}>
              Revised Copy
            </Typography>
            {isCompound ? (
              <CompoundField
                subFields={slot.subFields}
                value={slot.revisedCopy}
                onChange={handleRevisedChange}
                disabled={isRevised}
                strikethrough={false}
              />
            ) : (
              <TextField
                size="small"
                fullWidth
                multiline
                minRows={1}
                maxRows={6}
                placeholder="Enter revised copy..."
                value={slot.revisedCopy || ""}
                onChange={(e) => handleRevisedChange(e.target.value)}
                disabled={isRevised}
                sx={{ "& .MuiInputBase-input": { fontSize: 13 } }}
              />
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function ContentAudit({ slots, onUpdateSlots }) {
  const [addingCustom, setAddingCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState("");

  const { completed, total, pct } = useMemo(() => {
    const t = slots.length;
    const c = slots.filter((s) => s.status === "approved" || s.status === "revised").length;
    return { completed: c, total: t, pct: t > 0 ? Math.round((c / t) * 100) : 0 };
  }, [slots]);

  const updateSlot = useCallback(
    (idx, updated) => {
      const next = [...slots];
      next[idx] = updated;
      onUpdateSlots(next);
    },
    [slots, onUpdateSlots]
  );

  const handleDuplicate = useCallback(
    (idx) => {
      const slot = slots[idx];
      const newSlot = duplicateSlot(slot, slots);
      const next = [...slots];
      // Insert after the last slot with the same base id
      const baseId = slot.id.replace(/-copy-\d+$/, "");
      let insertIdx = idx;
      for (let i = idx + 1; i < next.length; i++) {
        if (next[i].id === baseId || next[i].id.startsWith(baseId + "-copy-")) {
          insertIdx = i;
        } else {
          break;
        }
      }
      next.splice(insertIdx + 1, 0, newSlot);
      onUpdateSlots(next);
    },
    [slots, onUpdateSlots]
  );

  const handleDelete = useCallback(
    (idx) => {
      const next = slots.filter((_, i) => i !== idx);
      onUpdateSlots(next);
    },
    [slots, onUpdateSlots]
  );

  const handleAddCustom = useCallback(() => {
    if (!customLabel.trim()) return;
    const newSlot = createCustomSlot(customLabel.trim());
    onUpdateSlots([...slots, newSlot]);
    setCustomLabel("");
    setAddingCustom(false);
  }, [customLabel, slots, onUpdateSlots]);

  return (
    <Box>
      {/* Progress bar */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>
            Content Audit Progress
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>
            {completed} of {total} slots completed ({pct}%)
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: "#E0E0E0",
            "& .MuiLinearProgress-bar": {
              borderRadius: 4,
              bgcolor: pct === 100 ? "#2E7D32" : "#3498DC",
            },
          }}
        />
      </Box>

      {/* Legend */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: cfg.color }} />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {cfg.label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Slot rows */}
      {slots.map((slot, idx) => (
        <SlotRow
          key={slot.id}
          slot={slot}
          index={idx}
          onUpdate={updateSlot}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          totalSlots={slots.length}
        />
      ))}

      {/* Add Custom Slot */}
      <Box sx={{ mt: 2 }}>
        {addingCustom ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              size="small"
              placeholder="Custom slot label..."
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCustom();
                if (e.key === "Escape") { setAddingCustom(false); setCustomLabel(""); }
              }}
              autoFocus
              sx={{ flex: 1, maxWidth: 400, "& .MuiInputBase-input": { fontSize: 13 } }}
            />
            <Button size="small" variant="contained" disabled={!customLabel.trim()} onClick={handleAddCustom}>
              Add
            </Button>
            <Button size="small" onClick={() => { setAddingCustom(false); setCustomLabel(""); }}>
              Cancel
            </Button>
          </Box>
        ) : (
          <Chip
            icon={<AddIcon sx={{ fontSize: 14 }} />}
            label="Add Custom Slot"
            size="small"
            variant="outlined"
            onClick={() => setAddingCustom(true)}
            sx={{ cursor: "pointer", fontSize: 12, borderStyle: "dashed" }}
          />
        )}
      </Box>
    </Box>
  );
}
