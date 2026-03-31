import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  CircularProgress,
  Alert,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import UndoIcon from "@mui/icons-material/Undo";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SyncIcon from "@mui/icons-material/Sync";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import PublishIcon from "@mui/icons-material/Publish";
import { duplicateSlot, createCustomSlot } from "./data/slotTemplates";

const STATUS_CONFIG = {
  untouched: { label: "Untouched", color: "#9E9E9E", bgColor: "#F5F5F5" },
  approved: { label: "Approved", color: "#2E7D32", bgColor: "#E8F5E9" },
  revised: { label: "Revised", color: "#1565C0", bgColor: "#E3F2FD" },
  revised_approved: { label: "Revision Approved", color: "#6A1B9A", bgColor: "#F3E5F5" },
  published: { label: "Published", color: "#00695C", bgColor: "#E0F2F1" },
};

function similarity(a, b) {
  if (!a || !b) return 0;
  const la = a.toLowerCase().trim();
  const lb = b.toLowerCase().trim();
  if (la === lb) return 1;
  if (la.includes(lb) || lb.includes(la)) return 0.8;

  const wordsA = la.split(/\s+/);
  const wordsB = lb.split(/\s+/);
  const n = Math.min(5, Math.min(wordsA.length, wordsB.length));
  if (n >= 2) {
    const prefixA = wordsA.slice(0, n).join(" ");
    const prefixB = wordsB.slice(0, n).join(" ");
    if (prefixA === prefixB) return 0.7;
  }

  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  const intersection = new Set([...setA].filter(w => setB.has(w)));
  const union = new Set([...setA, ...setB]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

function generateLabel(el, sectionTagCounts) {
  const sectionName = el.section.charAt(0).toUpperCase() + el.section.slice(1).replace(/-/g, " ");
  const tagLabels = {
    h1: "Heading", h2: "Heading", h3: "Heading", h4: "Heading", h5: "Heading", h6: "Heading",
    p: "Paragraph", a: "Link", button: "Button", li: "List Item",
    blockquote: "Quote", figcaption: "Caption", dt: "Term", dd: "Definition",
  };
  const typeLabel = tagLabels[el.tag] || "Text";
  const key = `${el.section}-${typeLabel}`;
  sectionTagCounts[key].seen++;
  const count = sectionTagCounts[key].seen;
  const total = sectionTagCounts[key].total;
  if (total > 1) return `${sectionName} — ${typeLabel} ${count}`;
  return `${sectionName} — ${typeLabel}`;
}

function generateSlotsFromElements(elements, metaTitle, metaDescription) {
  const slots = [];

  if (metaTitle) {
    slots.push({
      id: "meta-title", label: "Meta Title", currentCopy: metaTitle,
      revisedCopy: "", status: "untouched", tag: "title", section: "meta", isGenerated: true,
    });
  }
  if (metaDescription) {
    slots.push({
      id: "meta-description", label: "Meta Description", currentCopy: metaDescription,
      revisedCopy: "", status: "untouched", tag: "meta", section: "meta", isGenerated: true,
    });
  }

  // Pre-count section+type totals for numbering
  const sectionTagCounts = {};
  for (const el of elements) {
    const tagLabels = {
      h1: "Heading", h2: "Heading", h3: "Heading", h4: "Heading", h5: "Heading", h6: "Heading",
      p: "Paragraph", a: "Link", button: "Button", li: "List Item",
      blockquote: "Quote", figcaption: "Caption", dt: "Term", dd: "Definition",
    };
    const typeLabel = tagLabels[el.tag] || "Text";
    const key = `${el.section}-${typeLabel}`;
    if (!sectionTagCounts[key]) sectionTagCounts[key] = { total: 0, seen: 0 };
    sectionTagCounts[key].total++;
  }

  for (const el of elements) {
    const isNavLink = (el.section === "nav" || el.section === "footer") &&
                      el.tag === "a" && el.text.split(/\s+/).length <= 2;
    slots.push({
      id: el.id, label: generateLabel(el, sectionTagCounts), currentCopy: el.text,
      revisedCopy: "", status: "untouched", tag: el.tag, section: el.section,
      isGenerated: true, isNavLink, duplicateCount: el.duplicateCount || null,
    });
  }

  return slots;
}

function matchArtifactToSlots(artifactElements, artifactMeta, currentSlots) {
  if (!artifactElements?.length) {
    return { updatedSlots: currentSlots, matched: [], skipped: [], unmatched: [] };
  }

  const matched = [];
  const skipped = [];
  const unmatched = [];
  const usedSlotIds = new Set();

  const artifactItems = [];
  if (artifactMeta?.metaTitle) {
    artifactItems.push({ id: "art-meta-title", tag: "title", section: "meta", text: artifactMeta.metaTitle, context: "meta title" });
  }
  if (artifactMeta?.metaDescription) {
    artifactItems.push({ id: "art-meta-desc", tag: "meta", section: "meta", text: artifactMeta.metaDescription, context: "meta description" });
  }
  for (const el of artifactElements) artifactItems.push(el);

  for (const artEl of artifactItems) {
    let bestMatch = null;
    let bestScore = 0;

    for (const slot of currentSlots) {
      if (usedSlotIds.has(slot.id)) continue;
      if ((slot.revisedCopy || "").trim()) continue;

      let score = similarity(artEl.text, slot.currentCopy);
      if (artEl.section && slot.section && artEl.section === slot.section) score += 0.2;
      if (artEl.tag && slot.tag && artEl.tag === slot.tag) score += 0.1;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = slot;
      }
    }

    if (bestMatch && bestScore > 0.3) {
      matched.push({ slotId: bestMatch.id, slotLabel: bestMatch.label, artifactText: artEl.text, score: bestScore });
      usedSlotIds.add(bestMatch.id);
    } else {
      unmatched.push(artEl);
    }
  }

  for (const slot of currentSlots) {
    if ((slot.revisedCopy || "").trim() && !usedSlotIds.has(slot.id)) {
      skipped.push({ id: slot.id, label: slot.label });
    }
  }

  const updatedSlots = currentSlots.map((slot) => {
    const match = matched.find((m) => m.slotId === slot.id);
    if (!match) return slot;
    if (similarity(match.artifactText, slot.currentCopy) >= 0.95) return slot;
    return { ...slot, revisedCopy: match.artifactText, status: slot.status === "untouched" ? "revised" : slot.status };
  });

  const actuallyRevised = matched.filter((m) => {
    const slot = updatedSlots.find((s) => s.id === m.slotId);
    return slot && (slot.revisedCopy || "").trim();
  });

  return { updatedSlots, matched: actuallyRevised, skipped, unmatched };
}

// --- Map scraped page content to slot currentCopy values ---
function mapScrapedToSlots(scraped, slots) {
  if (!scraped) return slots;

  const updated = slots.map((slot) => {
    // Skip slots that already have content or are approved/revised
    if (slot.status !== "untouched") return slot;
    const hasContent = slot.subFields
      ? slot.subFields.some((f) => (slot.currentCopy?.[f] || "").trim())
      : (slot.currentCopy || "").trim();
    if (hasContent) return slot;

    const baseId = slot.id.replace(/-copy-\d+$/, "");
    let value = null;

    switch (baseId) {
      case "slot-meta-title":
        value = scraped.metaTitle || null;
        break;
      case "slot-meta-description":
        value = scraped.metaDescription || null;
        break;
      case "slot-hero-headline":
        value = scraped.h1s?.[0] || null;
        break;
      case "slot-hero-subheadline":
        value = scraped.paragraphs?.[0] || null;
        break;
      case "slot-hero-cta":
        value = scraped.buttons?.[0] || null;
        break;
      case "slot-intro-paragraph":
        value = scraped.paragraphs?.[1] || scraped.paragraphs?.[0] || null;
        break;
      case "slot-course-overview":
        value = scraped.paragraphs?.[1] || scraped.paragraphs?.[0] || null;
        break;
      case "slot-target-audience":
        value = findContentByKeyword(scraped, ["audience", "who", "designed for"]);
        break;
      case "slot-instructor-bio":
        value = findContentByKeyword(scraped, ["instructor", "taught by", "facilitator"]);
        break;
      case "slot-mission-statement":
        value = findContentByKeyword(scraped, ["mission", "purpose", "believe"]);
        break;
      case "slot-team-intro":
        value = findContentByKeyword(scraped, ["team", "people", "leadership"]);
        break;
      case "slot-pricing-headline":
        value = findHeadingByKeyword(scraped, ["pricing", "price", "cost", "invest"]);
        break;
      case "slot-pricing-description":
        value = findContentByKeyword(scraped, ["pricing", "price", "cost", "invest", "per month", "per year"]);
        break;
      case "slot-features-headline": {
        value = findHeadingByKeyword(scraped, ["feature", "what you get", "capabilities", "includes"]);
        break;
      }
      case "slot-process-headline": {
        value = findHeadingByKeyword(scraped, ["process", "how it works", "how we", "steps", "approach"]);
        break;
      }
      case "slot-bottom-cta-headline": {
        // Last h2 is often the bottom CTA section
        value = scraped.h2s?.[scraped.h2s.length - 1] || null;
        break;
      }
      case "slot-bottom-cta-subtext": {
        // Last paragraph often accompanies the bottom CTA
        value = scraped.paragraphs?.[scraped.paragraphs.length - 1] || null;
        break;
      }
      case "slot-bottom-cta-button": {
        // Last button is often the bottom CTA
        value = scraped.buttons?.[scraped.buttons.length - 1] || scraped.buttons?.[0] || null;
        break;
      }
      default:
        break;
    }

    // Handle compound slots from sections
    if (!value && slot.subFields && scraped.sections?.length > 0) {
      const sectionMapping = mapCompoundSlot(baseId, slot, scraped);
      if (sectionMapping) return { ...slot, currentCopy: sectionMapping };
    }

    // Handle repeatable simple slots
    if (!value && slot.isRepeatable && !slot.subFields) {
      const repeatable = mapRepeatableSlot(baseId, slot, scraped);
      if (repeatable) value = repeatable;
    }

    if (value && !slot.subFields) {
      return { ...slot, currentCopy: value };
    }

    return slot;
  });

  return updated;
}

function findContentByKeyword(scraped, keywords) {
  // Search paragraphs for keyword matches
  for (const p of scraped.paragraphs || []) {
    const lower = p.toLowerCase();
    if (keywords.some((k) => lower.includes(k))) return p;
  }
  // Search sections
  for (const s of scraped.sections || []) {
    const headLower = (s.heading || "").toLowerCase();
    if (keywords.some((k) => headLower.includes(k))) {
      return s.paragraphs?.[0] || null;
    }
  }
  return null;
}

function findHeadingByKeyword(scraped, keywords) {
  for (const h of scraped.h2s || []) {
    const lower = h.toLowerCase();
    if (keywords.some((k) => lower.includes(k))) return h;
  }
  return null;
}

function mapCompoundSlot(baseId, slot, scraped) {
  const sections = scraped.sections || [];
  const slotKeywords = {
    "slot-value-prop": ["value", "benefit", "why", "advantage"],
    "slot-feature": ["feature", "capability", "what you get", "includes"],
    "slot-process-step": ["process", "step", "how", "approach"],
    "slot-faq": ["faq", "question", "asked"],
    "slot-body-section": [],
    "slot-module": ["module", "curriculum", "lesson", "unit", "week"],
    "slot-learning-outcome": ["learn", "outcome", "objective", "skill"],
  };

  const keywords = slotKeywords[baseId];
  if (!keywords) return null;

  // For FAQ slots, look for Q&A patterns
  if (baseId === "slot-faq" && slot.subFields?.includes("question")) {
    const faqSection = sections.find((s) =>
      (s.heading || "").toLowerCase().includes("faq") ||
      (s.heading || "").toLowerCase().includes("question")
    );
    if (faqSection && faqSection.paragraphs?.length >= 2) {
      return { question: faqSection.paragraphs[0], answer: faqSection.paragraphs[1] };
    }
    return null;
  }

  // For compound slots with headline + description, map from sections
  if (slot.subFields?.includes("headline") && slot.subFields?.includes("description")) {
    // Find a matching section
    let matchedSection = null;
    if (keywords.length > 0) {
      matchedSection = sections.find((s) => {
        const headLower = (s.heading || "").toLowerCase();
        return keywords.some((k) => headLower.includes(k));
      });
    }
    // Fallback: use sections in order (skip first which is often hero)
    if (!matchedSection && baseId === "slot-body-section") {
      matchedSection = sections[1] || sections[0];
    }
    if (matchedSection) {
      return {
        headline: matchedSection.heading || "",
        description: matchedSection.paragraphs?.[0] || "",
      };
    }
  }

  return null;
}

function mapRepeatableSlot(baseId, slot, scraped) {
  if (baseId === "slot-social-proof") {
    return findContentByKeyword(scraped, ["testimonial", "review", "said", "client", "customer"]);
  }
  if (baseId === "slot-learning-outcome") {
    return findContentByKeyword(scraped, ["learn", "outcome", "by the end", "able to"]);
  }
  return null;
}

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

  const handleApproveRevision = useCallback(() => {
    onUpdate(index, { ...slot, status: "revised_approved" });
  }, [slot, index, onUpdate]);

  const handleMarkPublished = useCallback(() => {
    onUpdate(index, { ...slot, status: "published" });
  }, [slot, index, onUpdate]);

  const handleUndo = useCallback(() => {
    // Step back one status level
    if (status === "published") {
      onUpdate(index, { ...slot, status: "revised_approved" });
    } else if (status === "revised_approved") {
      onUpdate(index, { ...slot, status: "revised" });
    } else {
      onUpdate(index, { ...slot, status: "untouched" });
    }
  }, [slot, index, onUpdate, status]);

  const isApproved = status === "approved";
  const isRevised = status === "revised";
  const isRevisedApproved = status === "revised_approved";
  const isPublished = status === "published";
  const showStrikethrough = isApproved || isRevised || isRevisedApproved || isPublished;

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

          {isRevised && (
            <Tooltip title="Approve revision">
              <IconButton
                size="small"
                onClick={handleApproveRevision}
                sx={{ color: "#6A1B9A", "&:hover": { bgcolor: "#F3E5F5" } }}
              >
                <ThumbUpAltIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}

          {isRevisedApproved && (
            <Tooltip title="Mark as published on site">
              <IconButton
                size="small"
                onClick={handleMarkPublished}
                sx={{ color: "#00695C", "&:hover": { bgcolor: "#E0F2F1" } }}
              >
                <PublishIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}

          {(isApproved || isRevised || isRevisedApproved || isPublished) && (
            <Tooltip title={isPublished ? "Undo to revision approved" : isRevisedApproved ? "Undo to revised" : "Undo"}>
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
              disabled={isApproved || isRevised || isRevisedApproved || isPublished}
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
              disabled={isApproved || isRevised || isRevisedApproved || isPublished}
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

        {/* Revised copy — show when not approved (current copy approved = no revision needed) */}
        {!isApproved && (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", mb: 0.5, display: "block", fontWeight: 600 }}>
              Revised Copy
              {isRevisedApproved && (
                <Chip
                  label="Approved"
                  size="small"
                  sx={{ ml: 1, fontSize: 9, height: 16, bgcolor: "#F3E5F5", color: "#6A1B9A", fontWeight: 700 }}
                />
              )}
              {isPublished && (
                <Chip
                  label="Live on Site"
                  size="small"
                  sx={{ ml: 1, fontSize: 9, height: 16, bgcolor: "#E0F2F1", color: "#00695C", fontWeight: 700 }}
                />
              )}
            </Typography>
            {isCompound ? (
              <CompoundField
                subFields={slot.subFields}
                value={slot.revisedCopy}
                onChange={handleRevisedChange}
                disabled={isRevised || isRevisedApproved || isPublished}
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
                disabled={isRevised || isRevisedApproved || isPublished}
                sx={{
                  "& .MuiInputBase-input": { fontSize: 13 },
                  ...(isRevisedApproved && {
                    "& .MuiOutlinedInput-root": {
                      borderColor: "#6A1B9A",
                      bgcolor: "#F3E5F520",
                    },
                  }),
                  ...(isPublished && {
                    "& .MuiOutlinedInput-root": {
                      borderColor: "#00695C",
                      bgcolor: "#E0F2F120",
                    },
                  }),
                }}
              />
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function ContentAudit({ slots, onUpdateSlots, pageUrl }) {
  const [addingCustom, setAddingCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [fetched, setFetched] = useState(false);
  const autoFetchDone = useRef(false);
  const artifactInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null); // { matched, skipped, unmatched }
  const [showUnmatched, setShowUnmatched] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(null); // null or { scraped, elementCount }
  const [slotFilter, setSlotFilter] = useState("all"); // "all" | "revised" | "unchanged"
  const [collapsedSections, setCollapsedSections] = useState(new Set());

  // Auto-fetch current copy on first mount when all slots are empty
  useEffect(() => {
    if (autoFetchDone.current || !pageUrl || !slots || slots.length === 0) return;
    // Check if any slot already has currentCopy content
    const hasAnyContent = slots.some((s) => {
      if (s.subFields) return s.subFields.some((f) => (s.currentCopy?.[f] || "").trim());
      return (s.currentCopy || "").trim();
    });
    if (hasAnyContent) {
      autoFetchDone.current = true;
      return;
    }
    autoFetchDone.current = true;
    fetchCurrentCopy();
  }, [pageUrl, slots]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyDynamicSlots = useCallback((scraped) => {
    const newSlots = generateSlotsFromElements(scraped.elements, scraped.metaTitle, scraped.metaDescription);

    // Carry over revisedCopy from old slots via text matching
    const oldSlotsWithRevised = slots.filter((s) => (s.revisedCopy || "").trim());
    for (const oldSlot of oldSlotsWithRevised) {
      let bestMatch = null;
      let bestScore = 0;
      for (const newSlot of newSlots) {
        if ((newSlot.revisedCopy || "").trim()) continue;
        const score = similarity(oldSlot.currentCopy || "", newSlot.currentCopy || "");
        if (score > bestScore) {
          bestScore = score;
          bestMatch = newSlot;
        }
      }
      if (bestMatch && bestScore > 0.5) {
        bestMatch.revisedCopy = oldSlot.revisedCopy;
        bestMatch.status = oldSlot.status;
      }
    }

    // Preserve custom slots
    const customSlots = slots.filter((s) => s.isCustom);
    onUpdateSlots([...newSlots, ...customSlots]);
  }, [slots, onUpdateSlots]);

  const handleConfirmReplace = useCallback(() => {
    if (!confirmReplace) return;
    applyDynamicSlots(confirmReplace.scraped);
    setConfirmReplace(null);
    setFetched(true);
  }, [confirmReplace, applyDynamicSlots]);

  const fetchCurrentCopy = useCallback(async () => {
    if (!pageUrl) return;
    setFetching(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/scrape?url=${encodeURIComponent(pageUrl)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed (${res.status})`);
      }
      const scraped = await res.json();

      if (scraped.elements?.length > 0) {
        // Dynamic slot generation path
        const hasExistingWork = slots.some((s) => s.status !== "untouched" || (s.revisedCopy || "").trim());
        if (hasExistingWork && !slots[0]?.isGenerated) {
          // Old template-based slots with work — confirm before replacing
          setConfirmReplace({ scraped, elementCount: scraped.elements.length });
          return;
        }
        applyDynamicSlots(scraped);
      } else {
        // Fallback to old mapping for backward compat
        const mapped = mapScrapedToSlots(scraped, slots);
        onUpdateSlots(mapped);
      }
      setFetched(true);
    } catch (err) {
      console.error("Fetch current copy error:", err);
      setFetchError(err.message);
    } finally {
      setFetching(false);
    }
  }, [pageUrl, slots, onUpdateSlots, applyDynamicSlots]);

  const handleArtifactImport = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setImporting(true);
    setImportResult(null);
    try {
      const html = await file.text();
      const res = await fetch("/api/parse-artifact", {
        method: "POST",
        headers: { "Content-Type": "text/html" },
        body: html,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed (${res.status})`);
      }
      const parsed = await res.json();

      if (parsed.elements?.length > 0) {
        const { updatedSlots, matched, skipped, unmatched } = matchArtifactToSlots(
          parsed.elements,
          { metaTitle: parsed.metaTitle, metaDescription: parsed.metaDescription },
          slots
        );
        onUpdateSlots(updatedSlots);
        setImportResult({
          matched: matched.map((m) => m.slotLabel),
          skipped: skipped.map((s) => s.label),
          unmatched: unmatched.map((u) => `${u.context}: ${u.text.slice(0, 80)}${u.text.length > 80 ? "..." : ""}`),
          totalArtifact: parsed.elements.length + (parsed.metaTitle ? 1 : 0) + (parsed.metaDescription ? 1 : 0),
          totalSlots: slots.length,
        });
      } else {
        // Legacy fallback with old-style parsed data - just show warning
        setImportResult({ error: "Artifact parsing returned no elements. Try re-saving the artifact as clean HTML." });
      }
    } catch (err) {
      console.error("Artifact import error:", err);
      setImportResult({ error: err.message });
    } finally {
      setImporting(false);
    }
  }, [slots, onUpdateSlots]);

  const { completed, total, pct, pendingPublish, published } = useMemo(() => {
    const t = slots.length;
    const c = slots.filter((s) =>
      s.status === "approved" || s.status === "revised" || s.status === "revised_approved" || s.status === "published"
    ).length;
    const pp = slots.filter((s) => s.status === "revised_approved").length;
    const pub = slots.filter((s) => s.status === "published").length;
    return { completed: c, total: t, pct: t > 0 ? Math.round((c / t) * 100) : 0, pendingPublish: pp, published: pub };
  }, [slots]);

  const { groupedSlots, sectionNames } = useMemo(() => {
    let filtered = slots;
    if (slotFilter === "revised") {
      filtered = slots.filter((s) => (s.revisedCopy || "").trim());
    } else if (slotFilter === "unchanged") {
      filtered = slots.filter((s) => !(s.revisedCopy || "").trim());
    }

    const groups = new Map();
    const names = [];
    for (const slot of filtered) {
      const section = slot.section || "other";
      if (!groups.has(section)) {
        groups.set(section, []);
        names.push(section);
      }
      groups.get(section).push(slot);
    }

    return { groupedSlots: groups, sectionNames: names };
  }, [slots, slotFilter]);

  const toggleSection = useCallback((section) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }, []);

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
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>
            Content Audit Progress
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>
              {completed} of {total} slots completed ({pct}%)
            </Typography>
            {pendingPublish > 0 && (
              <Chip
                label={`${pendingPublish} to publish`}
                size="small"
                sx={{ fontSize: 11, height: 20, bgcolor: "#F3E5F5", color: "#6A1B9A", fontWeight: 600 }}
              />
            )}
            {published > 0 && (
              <Chip
                label={`${published} published`}
                size="small"
                sx={{ fontSize: 11, height: 20, bgcolor: "#E0F2F1", color: "#00695C", fontWeight: 600 }}
              />
            )}
            {pageUrl && (
              <Tooltip title="Fetch current copy from live page">
                <span>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={fetching ? <CircularProgress size={14} /> : <SyncIcon sx={{ fontSize: 16 }} />}
                    onClick={fetchCurrentCopy}
                    disabled={fetching}
                    sx={{ fontSize: 11, py: 0.25, textTransform: "none" }}
                  >
                    {fetching ? "Fetching..." : "Fetch Current Copy"}
                  </Button>
                </span>
              </Tooltip>
            )}
            <Tooltip title="Import revised copy from an HTML artifact file">
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={importing ? <CircularProgress size={14} /> : <UploadFileIcon sx={{ fontSize: 16 }} />}
                  onClick={() => artifactInputRef.current?.click()}
                  disabled={importing}
                  sx={{ fontSize: 11, py: 0.25, textTransform: "none", borderColor: "#1565C0", color: "#1565C0" }}
                >
                  {importing ? "Importing..." : "Import Artifact"}
                </Button>
              </span>
            </Tooltip>
            <input
              ref={artifactInputRef}
              type="file"
              accept=".html,.htm,.mhtml"
              style={{ display: "none" }}
              onChange={handleArtifactImport}
            />
          </Box>
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

      {/* Fetch status messages */}
      {fetchError && (
        <Alert severity="warning" sx={{ mb: 2, fontSize: 13 }} onClose={() => setFetchError(null)}>
          Could not fetch page content: {fetchError}. You can enter current copy manually.
        </Alert>
      )}
      {fetched && !fetchError && (
        <Alert severity="success" sx={{ mb: 2, fontSize: 13 }} onClose={() => setFetched(false)}>
          Current copy populated from live page. Review and adjust as needed.
        </Alert>
      )}

      {/* Artifact import results */}
      {importResult && !importResult.error && (
        <Alert
          severity="info"
          sx={{ mb: 2, fontSize: 13 }}
          onClose={() => { setImportResult(null); setShowUnmatched(false); }}
        >
          <strong>Artifact imported.</strong>{" "}
          {importResult.totalArtifact
            ? `Matched ${importResult.matched.length} of ${importResult.totalArtifact} artifact elements to current page slots.`
            : `${importResult.matched.length} slot${importResult.matched.length !== 1 ? "s" : ""} populated.`
          }
          {importResult.skipped.length > 0 && (
            <> {importResult.skipped.length} skipped (already had revised copy).</>
          )}
          {importResult.unmatched.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Button
                size="small"
                onClick={() => setShowUnmatched((p) => !p)}
                endIcon={<ExpandMoreIcon sx={{ transform: showUnmatched ? "rotate(180deg)" : "none", transition: "0.2s" }} />}
                sx={{ fontSize: 11, textTransform: "none", p: 0, minWidth: 0, color: "inherit" }}
              >
                {importResult.unmatched.length} new content item{importResult.unmatched.length !== 1 ? "s" : ""} not on current page
              </Button>
              <Collapse in={showUnmatched}>
                <Box sx={{ mt: 1, pl: 1, fontSize: 12, color: "text.secondary", maxHeight: 200, overflow: "auto" }}>
                  {importResult.unmatched.map((item, i) => (
                    <Typography key={i} variant="caption" sx={{ display: "block", mb: 0.5, color: "text.secondary" }}>
                      {typeof item === "string" ? item : `${item}`}
                    </Typography>
                  ))}
                </Box>
              </Collapse>
            </Box>
          )}
        </Alert>
      )}
      {importResult?.error && (
        <Alert severity="error" sx={{ mb: 2, fontSize: 13 }} onClose={() => setImportResult(null)}>
          Artifact import failed: {importResult.error}
        </Alert>
      )}

      {/* Importing overlay */}
      {importing && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, p: 1.5, bgcolor: "#E3F2FD", borderRadius: 2 }}>
          <CircularProgress size={18} sx={{ color: "#1565C0" }} />
          <Typography variant="body2" sx={{ color: "#1565C0", fontWeight: 500 }}>
            Parsing artifact and mapping to slots...
          </Typography>
        </Box>
      )}

      {/* Loading overlay */}
      {fetching && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, p: 1.5, bgcolor: "#FFF3E0", borderRadius: 2 }}>
          <CircularProgress size={18} sx={{ color: "#E65100" }} />
          <Typography variant="body2" sx={{ color: "#E65100", fontWeight: 500 }}>
            Fetching content from {pageUrl}...
          </Typography>
        </Box>
      )}

      {/* Filter toggles — only show when we have generated slots */}
      {slots.some((s) => s.isGenerated) && (
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          {["all", "revised", "unchanged"].map((f) => (
            <Chip
              key={f}
              label={f === "all" ? `All (${slots.length})` : f === "revised" ? `Revised (${slots.filter(s => (s.revisedCopy || "").trim()).length})` : `Unchanged (${slots.filter(s => !(s.revisedCopy || "").trim()).length})`}
              size="small"
              variant={slotFilter === f ? "filled" : "outlined"}
              onClick={() => setSlotFilter(f)}
              sx={{
                cursor: "pointer",
                fontSize: 12,
                fontWeight: slotFilter === f ? 700 : 400,
                bgcolor: slotFilter === f ? "#3498DC" : undefined,
                color: slotFilter === f ? "#fff" : undefined,
                "&:hover": { bgcolor: slotFilter === f ? "#2980B9" : "#F5F5F5" },
              }}
            />
          ))}
        </Box>
      )}

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

      {/* Slot rows — grouped by section if generated */}
      {slots.some((s) => s.isGenerated) ? (
        sectionNames.map((section) => {
          const sectionSlots = groupedSlots.get(section) || [];
          const isCollapsed = collapsedSections.has(section);
          const sectionCompleted = sectionSlots.filter((s) =>
            s.status === "approved" || s.status === "revised" || s.status === "revised_approved" || s.status === "published"
          ).length;
          const sectionLabel = section.charAt(0).toUpperCase() + section.slice(1).replace(/-/g, " ");
          const allNavLinks = sectionSlots.every((s) => s.isNavLink);

          return (
            <Box key={section} sx={{ mb: 2 }}>
              <Box
                onClick={() => toggleSection(section)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  py: 1,
                  px: 1.5,
                  bgcolor: "#F5F5F5",
                  borderRadius: 2,
                  cursor: "pointer",
                  userSelect: "none",
                  "&:hover": { bgcolor: "#EEEEEE" },
                  mb: isCollapsed ? 0 : 1,
                }}
              >
                <ExpandMoreIcon
                  sx={{
                    fontSize: 20,
                    color: "text.secondary",
                    transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 13, flex: 1 }}>
                  {sectionLabel}
                  {allNavLinks && " (Nav/Footer Links)"}
                </Typography>
                <Chip
                  label={`${sectionCompleted}/${sectionSlots.length}`}
                  size="small"
                  sx={{
                    fontSize: 11,
                    height: 20,
                    bgcolor: sectionCompleted === sectionSlots.length && sectionSlots.length > 0 ? "#E8F5E9" : "#E0E0E0",
                  }}
                />
              </Box>
              <Collapse in={!isCollapsed}>
                {sectionSlots.map((slot) => {
                  const realIdx = slots.findIndex((s) => s.id === slot.id);
                  return (
                    <SlotRow
                      key={slot.id}
                      slot={slot}
                      index={realIdx}
                      onUpdate={updateSlot}
                      onDuplicate={handleDuplicate}
                      onDelete={handleDelete}
                      totalSlots={slots.length}
                    />
                  );
                })}
              </Collapse>
            </Box>
          );
        })
      ) : (
        slots.map((slot, idx) => (
          <SlotRow
            key={slot.id}
            slot={slot}
            index={idx}
            onUpdate={updateSlot}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            totalSlots={slots.length}
          />
        ))
      )}

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

      {/* Migration confirmation dialog */}
      {confirmReplace && (
        <Dialog open onClose={() => { setConfirmReplace(null); setFetching(false); }}>
          <DialogTitle>Replace Content Slots?</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontSize: 14 }}>
              This will replace your current {slots.length} slots with a full page inventory
              (~{confirmReplace.elementCount} slots). Any revised copy in existing slots will be
              preserved where possible by matching against the new slots.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setConfirmReplace(null); setFetching(false); }}>Cancel</Button>
            <Button onClick={handleConfirmReplace} variant="contained">Replace Slots</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
