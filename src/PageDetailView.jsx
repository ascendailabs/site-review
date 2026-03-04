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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import EditIcon from "@mui/icons-material/Edit";
import LinkIcon from "@mui/icons-material/Link";
import ContentAudit from "./ContentAudit";
import AnnotationsPanel from "./AnnotationsPanel";
import { generateContentSlots } from "./data/slotTemplates";

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

  // Lazy-initialize content slots from template when Content Audit tab first opened
  useEffect(() => {
    if (subTab === 0 && !contentSlots) {
      const pageType = page.pageType || "generic";
      const slots = generateContentSlots(pageType);
      onUpdate({ ...pageState, contentSlots: slots });
    }
  }, [subTab, contentSlots, page.pageType, pageState, onUpdate]);

  const handleUpdateSlots = useCallback(
    (newSlots) => {
      onUpdate({ ...pageState, contentSlots: newSlots });
    },
    [pageState, onUpdate]
  );

  const handleNoteChange = useCallback(
    (e) => {
      onUpdate({ ...pageState, note: e.target.value });
    },
    [pageState, onUpdate]
  );

  const handleSaveMarkup = useCallback(
    (url) => {
      onUpdate({ ...pageState, markupUrl: url });
      setEditingMarkup(false);
    },
    [pageState, onUpdate]
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
