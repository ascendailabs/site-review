import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Chip,
  IconButton,
  Button,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  LinearProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import EditIcon from "@mui/icons-material/Edit";
import LinkIcon from "@mui/icons-material/Link";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentAudit from "./ContentAudit";
import AnnotationsPanel from "./AnnotationsPanel";
import { generateContentSlots } from "./data/slotTemplates";
import { QUALITY_CHECKLIST_ITEMS, countChecked } from "./data/qualityChecklist";

export default function PageDetailView({
  page,
  pageState,
  onUpdate,
  onBack,
  // Props for AnnotationsPanel
  pageStates,
  updatePageState,
  siteSections,
  outreachSections,
  customSections,
  sectionMeta,
}) {
  const [subTab, setSubTab] = useState(0);
  const [editingMarkup, setEditingMarkup] = useState(false);
  const [markupDraft, setMarkupDraft] = useState("");

  const markupUrl = pageState?.markupUrl || "";
  const note = pageState?.note || "";
  const contentSlots = pageState?.contentSlots || null;
  const qualityChecklist = pageState?.qualityChecklist || {};
  const qualityCheckedCount = countChecked(qualityChecklist);
  const qualityTotal = QUALITY_CHECKLIST_ITEMS.length;
  const qualityAllDone = qualityCheckedCount === qualityTotal;

  const handleToggleQualityItem = useCallback(
    (itemId) => {
      // Use a functional updater so two rapid toggles in the same tick can't lose the second.
      onUpdate((prev) => ({
        qualityChecklist: {
          ...(prev?.qualityChecklist || {}),
          [itemId]: !prev?.qualityChecklist?.[itemId],
        },
      }));
    },
    [onUpdate]
  );

  // Lazy-initialize content slots from template when Content Audit tab first opened.
  // Uses a functional updater so a concurrent edit (e.g. note typing during a render)
  // can't be clobbered by a stale-closure spread of pageState.
  useEffect(() => {
    if (subTab === 0 && !contentSlots) {
      const pageType = page.pageType || "generic";
      const slots = generateContentSlots(pageType);
      onUpdate({ contentSlots: slots });
    }
  }, [subTab, contentSlots, page.pageType, onUpdate]);

  // All update handlers use partial-patch updates (not full pageState spreads) so the
  // updatePageState reducer in App.jsx merges them onto the freshest prev state. This
  // mirrors the C12 fix already applied to handleToggleQualityItem.
  const handleUpdateSlots = useCallback(
    (newSlots) => {
      onUpdate({ contentSlots: newSlots });
    },
    [onUpdate]
  );

  const handleNoteChange = useCallback(
    (e) => {
      onUpdate({ note: e.target.value });
    },
    [onUpdate]
  );

  const handleSaveMarkup = useCallback(
    (url) => {
      onUpdate({ markupUrl: url });
      setEditingMarkup(false);
    },
    [onUpdate]
  );

  // Content audit slot summary for the tab label
  const auditSummary = useMemo(() => {
    if (!contentSlots) return "";
    const completed = contentSlots.filter((s) =>
      s.status === "approved" || s.status === "revised" || s.status === "revised_approved" || s.status === "published"
    ).length;
    return `${completed}/${contentSlots.length}`;
  }, [contentSlots]);

  return (
    <Box>
      {/* Header */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",
        }}
      >
        <IconButton onClick={onBack} size="small" sx={{ mr: 0.5 }}>
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 18 }}>
          {page.name}
        </Typography>

        <Chip
          label={page.url.replace("https://ascendlabs.ai", "") || "/"}
          size="small"
          component="a"
          href={page.url}
          target="_blank"
          rel="noopener noreferrer"
          clickable
          icon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
          variant="outlined"
          sx={{ fontSize: 12, maxWidth: 300, "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" } }}
        />

        {page.pageType && (
          <Chip
            label={page.pageType}
            size="small"
            sx={{
              fontSize: 11,
              height: 22,
              bgcolor: "#F5F5F5",
              color: "#757575",
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          />
        )}
      </Paper>

      {/* Quality Checklist Accordion */}
      <Accordion
        disableGutters
        elevation={0}
        sx={{
          mb: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          "&:before": { display: "none" },
          "&:first-of-type": { borderRadius: 2 },
          "&:last-of-type": { borderRadius: 2 },
          overflow: "hidden",
        }}
      >
        <AccordionSummary
          id="quality-checklist-header"
          aria-controls="quality-checklist-content"
          expandIcon={<ExpandMoreIcon aria-hidden="true" />}
          sx={{
            px: 2,
            minHeight: 56,
            "& .MuiAccordionSummary-content": {
              alignItems: "center",
              gap: 1.5,
              my: 1,
              flexWrap: "wrap",
            },
          }}
        >
          <CheckCircleIcon
            aria-hidden="true"
            sx={(theme) => ({
              fontSize: 20,
              color: qualityAllDone ? theme.palette.success.dark : theme.palette.grey[500],
            })}
          />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Quality Checklist
          </Typography>
          <Chip
            label={`${qualityCheckedCount}/${qualityTotal}`}
            size="small"
            sx={(theme) => ({
              fontSize: 11,
              height: 22,
              fontWeight: 700,
              bgcolor: qualityAllDone ? theme.palette.success.light : theme.palette.primary.light,
              color: qualityAllDone ? theme.palette.success.dark : theme.palette.primary.dark,
            })}
          />
          {/* Progress bar wrapper has pointerEvents:none so clicks pass through to the accordion toggle. */}
          <Box sx={{ flex: 1, ml: 1, minWidth: 120, maxWidth: 240, pointerEvents: "none" }}>
            <LinearProgress
              variant="determinate"
              value={qualityTotal > 0 ? (qualityCheckedCount / qualityTotal) * 100 : 0}
              aria-label={`Quality checklist progress: ${qualityCheckedCount} of ${qualityTotal} complete`}
              sx={(theme) => ({
                height: 6,
                borderRadius: 3,
                bgcolor: theme.palette.grey[100],
                "& .MuiLinearProgress-bar": {
                  bgcolor: qualityAllDone ? theme.palette.success.dark : theme.palette.primary.main,
                },
              })}
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails id="quality-checklist-content" sx={(theme) => ({ pt: 0, pb: 1.5, px: 2, bgcolor: theme.palette.grey[50] })}>
          {qualityTotal === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              No checklist items configured.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {QUALITY_CHECKLIST_ITEMS.map((item) => {
                const checked = !!qualityChecklist[item.id];
                return (
                  <FormControlLabel
                    key={item.id}
                    control={
                      <Checkbox
                        checked={checked}
                        onChange={() => handleToggleQualityItem(item.id)}
                        inputProps={{
                          "aria-label": checked
                            ? `Completed: ${item.label}`
                            : item.label,
                        }}
                        sx={(theme) => ({
                          color: theme.palette.grey[500],
                          "&.Mui-checked": { color: theme.palette.primary.main },
                        })}
                      />
                    }
                    label={
                      <Typography
                        sx={{
                          fontSize: 14,
                          lineHeight: 1.5,
                          color: "text.primary",
                          opacity: checked ? 0.75 : 1,
                          textDecoration: checked ? "line-through" : "none",
                        }}
                      >
                        {item.label}
                      </Typography>
                    }
                    sx={{
                      alignItems: "center",
                      m: 0,
                      minHeight: 44,
                      py: 0.5,
                    }}
                  />
                );
              })}
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Sub-tabs */}
      <Tabs
        value={subTab}
        onChange={(_, v) => setSubTab(v)}
        sx={{ mb: 2 }}
      >
        <Tab label={`Content Audit${auditSummary ? ` (${auditSummary})` : ""}`} />
        <Tab label="Annotations" />
        <Tab label="Notes" />
        <Tab label="Markup.io" />
      </Tabs>

      {/* Tab panels */}
      {subTab === 0 && (
        <Box>
          {contentSlots ? (
            <ContentAudit slots={contentSlots} onUpdateSlots={handleUpdateSlots} pageUrl={page.url} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              Loading content slots...
            </Typography>
          )}
        </Box>
      )}

      {subTab === 1 && (
        <AnnotationsPanel
          pageStates={pageStates}
          updatePageState={updatePageState}
          siteSections={siteSections}
          outreachSections={outreachSections}
          customSections={customSections}
          sectionMeta={sectionMeta}
          initialPageId={page.id}
        />
      )}

      {subTab === 2 && (
        <Box sx={{ mt: 1 }}>
          <TextField
            fullWidth
            multiline
            minRows={10}
            maxRows={30}
            placeholder="Add notes about this page..."
            value={note}
            onChange={handleNoteChange}
            sx={{
              "& .MuiInputBase-root": { fontSize: 14, lineHeight: 1.6 },
            }}
          />
        </Box>
      )}

      {subTab === 3 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ mb: 1.5, color: "text.secondary" }}>
            Link to Markup.io project for visual annotations
          </Typography>
          {editingMarkup ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="https://app.markup.io/..."
                value={markupDraft}
                onChange={(e) => setMarkupDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveMarkup(markupDraft);
                  if (e.key === "Escape") setEditingMarkup(false);
                }}
                autoFocus
                sx={{ maxWidth: 500 }}
              />
              <Button
                size="small"
                variant="contained"
                onClick={() => handleSaveMarkup(markupDraft)}
              >
                Save
              </Button>
              <Button size="small" onClick={() => setEditingMarkup(false)}>
                Cancel
              </Button>
            </Box>
          ) : markupUrl ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LinkIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              <Chip
                label={markupUrl}
                size="small"
                component="a"
                href={markupUrl}
                target="_blank"
                rel="noopener noreferrer"
                clickable
                icon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                variant="outlined"
                sx={{ fontSize: 12, maxWidth: 400, "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" } }}
              />
              <IconButton
                size="small"
                onClick={() => { setMarkupDraft(markupUrl); setEditingMarkup(true); }}
              >
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          ) : (
            <Button
              variant="outlined"
              size="small"
              startIcon={<LinkIcon />}
              onClick={() => { setMarkupDraft(""); setEditingMarkup(true); }}
            >
              Add Markup.io Link
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
