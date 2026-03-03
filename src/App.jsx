import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Collapse,
  Card,
  Stack,
  Tooltip,
  Button,
  InputAdornment,
  ClickAwayListener,
  Popover,
} from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import MemoryIcon from "@mui/icons-material/Memory";
import BusinessIcon from "@mui/icons-material/Business";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import VideocamIcon from "@mui/icons-material/Videocam";
import SchoolIcon from "@mui/icons-material/School";
import CampaignIcon from "@mui/icons-material/Campaign";
import LinkIcon from "@mui/icons-material/Link";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloudUpload from "@mui/icons-material/CloudUpload";
import CloudDownload from "@mui/icons-material/CloudDownload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SyncIcon from "@mui/icons-material/Sync";
import ErrorIcon from "@mui/icons-material/Error";
import NotesIcon from "@mui/icons-material/Notes";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CloseIcon from "@mui/icons-material/Close";
import SortIcon from "@mui/icons-material/Sort";

import { STATUSES, STATUS_KEYS } from "./data/statuses";
import { SITE_SECTIONS } from "./data/siteSections";
import { OUTREACH_SECTIONS } from "./data/outreachSections";

const ICON_MAP = {
  Bolt: BoltIcon,
  Memory: MemoryIcon,
  Business: BusinessIcon,
  MenuBook: MenuBookIcon,
  Videocam: VideocamIcon,
  School: SchoolIcon,
  Campaign: CampaignIcon,
  Link: LinkIcon,
};

const PRIORITIES = {
  none:     { label: "No Priority", color: "#9E9E9E", bgColor: "#F5F5F5", sort: 4 },
  high:     { label: "High",        color: "#D32F2F", bgColor: "#FFEBEE", sort: 0 },
  medium:   { label: "Medium",      color: "#F57C00", bgColor: "#FFF3E0", sort: 1 },
  low:      { label: "Low",         color: "#1976D2", bgColor: "#E3F2FD", sort: 2 },
  deferred: { label: "Deferred",    color: "#78909C", bgColor: "#ECEFF1", sort: 3 },
};
const PRIORITY_KEYS = Object.keys(PRIORITIES);

// --- Helper: get all pages from a section (handles subgroups) ---
function getSectionPages(section) {
  if (section.subgroups) {
    return section.subgroups.flatMap((sg) => sg.pages);
  }
  return section.pages || [];
}

// --- Helper: get all page IDs from sections ---
function getAllPageIds(sections) {
  return sections.flatMap((s) => getSectionPages(s).map((p) => p.id));
}

// --- ProgressBar: colored segments ---
function ProgressBar({ pages, pageStates, height = 6 }) {
  const counts = {};
  STATUS_KEYS.forEach((k) => (counts[k] = 0));
  pages.forEach((p) => {
    const status = pageStates[p.id]?.status || "unreviewed";
    counts[status] = (counts[status] || 0) + 1;
  });
  const total = pages.length;
  if (total === 0) return null;

  return (
    <Box sx={{ display: "flex", width: "100%", height, borderRadius: 1, overflow: "hidden", bgcolor: "#eee" }}>
      {STATUS_KEYS.map((key) => {
        const pct = (counts[key] / total) * 100;
        if (pct === 0) return null;
        return (
          <Tooltip key={key} title={`${STATUSES[key].label}: ${counts[key]}`}>
            <Box sx={{ width: `${pct}%`, bgcolor: STATUSES[key].color, transition: "width 0.3s" }} />
          </Tooltip>
        );
      })}
    </Box>
  );
}

// --- StatusBadge + StatusPicker ---
function StatusBadge({ status, onChange }) {
  const [open, setOpen] = useState(false);
  const s = STATUSES[status] || STATUSES.unreviewed;

  return (
    <Box sx={{ position: "relative", display: "inline-block" }}>
      <Chip
        label={s.label}
        size="small"
        onClick={() => setOpen(!open)}
        sx={{
          bgcolor: s.bgColor,
          color: s.color,
          fontWeight: 600,
          border: `1px solid ${s.color}`,
          cursor: "pointer",
          "&:hover": { opacity: 0.85 },
        }}
      />
      {open && (
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Paper
            elevation={4}
            sx={{
              position: "absolute",
              right: 0,
              top: "100%",
              mt: 0.5,
              zIndex: 10,
              minWidth: 160,
              p: 0.5,
            }}
          >
            {STATUS_KEYS.map((key) => (
              <Box
                key={key}
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1,
                  cursor: "pointer",
                  bgcolor: status === key ? STATUSES[key].bgColor : "transparent",
                  "&:hover": { bgcolor: STATUSES[key].bgColor },
                }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: STATUSES[key].color,
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: status === key ? 600 : 400 }}>
                  {STATUSES[key].label}
                </Typography>
              </Box>
            ))}
          </Paper>
        </ClickAwayListener>
      )}
    </Box>
  );
}

// --- PriorityBadge ---
function PriorityBadge({ priority, onChange }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const p = PRIORITIES[priority] || PRIORITIES.none;

  return (
    <>
      <Chip
        label={p.label}
        size="small"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          bgcolor: p.bgColor,
          color: p.color,
          fontWeight: 600,
          border: `1px solid ${p.color}`,
          cursor: "pointer",
          fontSize: 11,
          height: 24,
          "&:hover": { opacity: 0.85 },
        }}
      />
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { minWidth: 140, p: 0.5, mt: 0.5 } } }}
      >
        {PRIORITY_KEYS.map((key) => (
          <Box
            key={key}
            onClick={() => {
              onChange(key);
              setAnchorEl(null);
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              py: 0.75,
              borderRadius: 1,
              cursor: "pointer",
              bgcolor: priority === key ? PRIORITIES[key].bgColor : "transparent",
              "&:hover": { bgcolor: PRIORITIES[key].bgColor },
            }}
          >
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: PRIORITIES[key].color }} />
            <Typography variant="body2" sx={{ fontWeight: priority === key ? 600 : 400 }}>
              {PRIORITIES[key].label}
            </Typography>
          </Box>
        ))}
      </Popover>
    </>
  );
}

// --- Reviewer statuses (subset used per-reviewer) ---
const REVIEWER_STATUSES = {
  pending:    { label: "Pending",    color: "#9E9E9E", bgColor: "#F5F5F5" },
  critical:   { label: "Critical",   color: "#D32F2F", bgColor: "#FFEBEE" },
  needs_work: { label: "Needs Work", color: "#F57C00", bgColor: "#FFF3E0" },
  updated:    { label: "Updated",    color: "#1976D2", bgColor: "#E3F2FD" },
  approved:   { label: "Approved",   color: "#2E7D32", bgColor: "#E8F5E9" },
};
const REVIEWER_STATUS_KEYS = Object.keys(REVIEWER_STATUSES);

// --- ReviewerRow ---
function ReviewerRow({ reviewer, onChange, onRemove }) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const rs = REVIEWER_STATUSES[reviewer.status] || REVIEWER_STATUSES.pending;

  return (
    <Box sx={{ mb: 1, pl: 1, borderLeft: `3px solid ${rs.color}`, borderRadius: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{reviewer.name}</Typography>
        <Typography variant="caption" color="text.secondary">{reviewer.date}</Typography>
        <Box sx={{ flex: 1 }} />
        <IconButton size="small" onClick={() => setNotesOpen(!notesOpen)} sx={{ p: 0.25, color: reviewer.note ? "primary.main" : "text.secondary" }}>
          <NotesIcon sx={{ fontSize: 16 }} />
        </IconButton>
        {/* Status picker */}
        <Chip
          label={rs.label}
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            bgcolor: rs.bgColor,
            color: rs.color,
            fontWeight: 600,
            border: `1px solid ${rs.color}`,
            cursor: "pointer",
            fontSize: 11,
            height: 24,
            "&:hover": { opacity: 0.85 },
          }}
        />
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{ paper: { sx: { minWidth: 150, p: 0.5, mt: 0.5 } } }}
        >
          {REVIEWER_STATUS_KEYS.map((key) => (
            <Box
              key={key}
              onClick={() => { onChange({ ...reviewer, status: key }); setAnchorEl(null); }}
              sx={{
                display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, borderRadius: 1, cursor: "pointer",
                bgcolor: reviewer.status === key ? REVIEWER_STATUSES[key].bgColor : "transparent",
                "&:hover": { bgcolor: REVIEWER_STATUSES[key].bgColor },
              }}
            >
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: REVIEWER_STATUSES[key].color }} />
              <Typography variant="body2" sx={{ fontWeight: reviewer.status === key ? 600 : 400 }}>{REVIEWER_STATUSES[key].label}</Typography>
            </Box>
          ))}
        </Popover>
        <IconButton size="small" onClick={onRemove} sx={{ p: 0.25 }}>
          <CloseIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>
      <Collapse in={notesOpen}>
        <TextField
          multiline
          minRows={1}
          maxRows={4}
          fullWidth
          placeholder={`${reviewer.name}'s notes...`}
          value={reviewer.note || ""}
          onChange={(e) => onChange({ ...reviewer, note: e.target.value })}
          sx={{ mt: 0.5, "& .MuiInputBase-input": { fontSize: 13 } }}
        />
      </Collapse>
    </Box>
  );
}

// --- PageCard ---
function PageCard({ page, pageState, onUpdate, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [editingMarkup, setEditingMarkup] = useState(false);
  const [markupDraft, setMarkupDraft] = useState("");
  const [editingPurpose, setEditingPurpose] = useState(false);
  const [purposeDraft, setPurposeDraft] = useState("");
  const [addingReviewer, setAddingReviewer] = useState(false);
  const [reviewerName, setReviewerName] = useState("");
  const markupUrl = pageState?.markupUrl || "";
  const reviewers = pageState?.reviewers || [];
  const priority = pageState?.priority || "none";
  const borderColor = PRIORITIES[priority]?.color || "#9E9E9E";

  const addReviewer = () => {
    if (!reviewerName.trim()) return;
    const newReviewer = { name: reviewerName.trim(), date: new Date().toISOString().slice(0, 10), status: "pending", note: "" };
    onUpdate({ ...pageState, reviewers: [...reviewers, newReviewer] });
    setReviewerName("");
    setAddingReviewer(false);
  };

  const updateReviewer = (idx, updated) => {
    const newReviewers = reviewers.map((r, i) => (i === idx ? updated : r));
    onUpdate({ ...pageState, reviewers: newReviewers });
  };

  const removeReviewer = (idx) => {
    onUpdate({ ...pageState, reviewers: reviewers.filter((_, i) => i !== idx) });
  };

  return (
    <Card
      variant="outlined"
      sx={{
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 2,
        mb: 1,
        transition: "border-color 0.2s",
      }}
    >
      <Box sx={{ p: 1.5 }}>
        {/* Top row */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton size="small" disabled={isFirst} onClick={onMoveUp} sx={{ p: 0.25 }}>
              <KeyboardArrowUp fontSize="small" />
            </IconButton>
            <IconButton size="small" disabled={isLast} onClick={onMoveDown} sx={{ p: 0.25 }}>
              <KeyboardArrowDown fontSize="small" />
            </IconButton>
          </Box>
          <PriorityBadge
            priority={priority}
            onChange={(p) => onUpdate({ ...pageState, priority: p })}
          />
          <Typography variant="body1" sx={{ fontWeight: 600, mr: 0.5 }}>
            {page.name}
          </Typography>
          <Chip
            label={page.url.replace("https://ascendlabs.ai", "")}
            size="small"
            component="a"
            href={page.url}
            target="_blank"
            rel="noopener noreferrer"
            clickable
            icon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
            variant="outlined"
            sx={{ fontSize: 12, maxWidth: 260, "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" } }}
          />
          {page.handoff && (
            <Tooltip title={page.handoff} arrow>
              <Chip label="Handoff" size="small" sx={{ bgcolor: "#F3E5F5", color: "#7B1FA2", fontWeight: 600 }} />
            </Tooltip>
          )}
        </Box>

        {/* Purpose field */}
        <Box sx={{ ml: 6.5, mt: 0.5 }}>
          {editingPurpose ? (
            <TextField
              size="small"
              fullWidth
              placeholder="What is this page's purpose?"
              value={purposeDraft}
              onChange={(e) => setPurposeDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onUpdate({ ...pageState, purpose: purposeDraft });
                  setEditingPurpose(false);
                }
                if (e.key === "Escape") setEditingPurpose(false);
              }}
              onBlur={() => {
                onUpdate({ ...pageState, purpose: purposeDraft });
                setEditingPurpose(false);
              }}
              autoFocus
              sx={{ "& .MuiInputBase-input": { fontSize: 13, py: 0.5 } }}
            />
          ) : (
            <Typography
              variant="body2"
              onClick={() => {
                setPurposeDraft(pageState?.purpose || "");
                setEditingPurpose(true);
              }}
              sx={{
                color: pageState?.purpose ? "text.secondary" : "text.disabled",
                fontStyle: pageState?.purpose ? "normal" : "italic",
                cursor: "pointer",
                fontSize: 13,
                "&:hover": { color: "text.primary" },
              }}
            >
              {pageState?.purpose || "Add purpose..."}
            </Typography>
          )}
        </Box>

        {/* Markup.io row */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.75, ml: 6.5 }}>
          {markupUrl && !editingMarkup && (
            <>
              <Chip
                label="Markup"
                size="small"
                component="a"
                href={markupUrl}
                target="_blank"
                rel="noopener noreferrer"
                clickable
                sx={{ bgcolor: "#FFF3E0", color: "#E65100", fontWeight: 600, fontSize: 12 }}
              />
              <IconButton
                size="small"
                onClick={() => {
                  setMarkupDraft(markupUrl);
                  setEditingMarkup(true);
                }}
                sx={{ p: 0.25 }}
              >
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </>
          )}
          {!markupUrl && !editingMarkup && (
            <Chip
              label="+ Markup"
              size="small"
              variant="outlined"
              onClick={() => {
                setMarkupDraft("");
                setEditingMarkup(true);
              }}
              sx={{ borderStyle: "dashed", color: "text.secondary", fontSize: 12, cursor: "pointer" }}
            />
          )}
          {editingMarkup && (
            <TextField
              size="small"
              placeholder="Paste Markup.io link..."
              value={markupDraft}
              onChange={(e) => setMarkupDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onUpdate({ ...pageState, markupUrl: markupDraft });
                  setEditingMarkup(false);
                }
                if (e.key === "Escape") setEditingMarkup(false);
              }}
              onBlur={() => {
                onUpdate({ ...pageState, markupUrl: markupDraft });
                setEditingMarkup(false);
              }}
              autoFocus
              sx={{ width: 300, "& .MuiInputBase-input": { fontSize: 13, py: 0.5 } }}
            />
          )}
        </Box>

        {/* Reviewers */}
        <Box sx={{ mt: 1.5, ml: 6.5 }}>
          {reviewers.map((r, idx) => (
            <ReviewerRow
              key={idx}
              reviewer={r}
              onChange={(updated) => updateReviewer(idx, updated)}
              onRemove={() => removeReviewer(idx)}
            />
          ))}
          {addingReviewer ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
              <TextField
                size="small"
                placeholder="Your name..."
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addReviewer();
                  if (e.key === "Escape") { setAddingReviewer(false); setReviewerName(""); }
                }}
                autoFocus
                sx={{ width: 160, "& .MuiInputBase-input": { fontSize: 13, py: 0.5 } }}
              />
              <Button size="small" variant="contained" onClick={addReviewer} disabled={!reviewerName.trim()}>
                Add
              </Button>
              <Button size="small" onClick={() => { setAddingReviewer(false); setReviewerName(""); }}>
                Cancel
              </Button>
            </Box>
          ) : (
            <Chip
              icon={<PersonAddIcon sx={{ fontSize: 14 }} />}
              label="Add Reviewer"
              size="small"
              variant="outlined"
              onClick={() => setAddingReviewer(true)}
              sx={{ mt: 0.5, cursor: "pointer", fontSize: 12 }}
            />
          )}
        </Box>
      </Box>
    </Card>
  );
}

// --- SectionGroup ---
function SectionGroup({
  section,
  pageStates,
  onUpdatePage,
  pageOrder,
  onReorderPage,
  sectionMeta,
  onUpdateSectionMeta,
  onSortByPriority,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  searchTerm,
  statusFilter,
}) {
  const [expanded, setExpanded] = useState(section.collapsed !== true);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");
  const IconComponent = ICON_MAP[section.icon] || BoltIcon;
  const allPages = getSectionPages(section);

  const reviewedCount = allPages.filter((p) => {
    const revs = pageStates[p.id]?.reviewers || [];
    return revs.length > 0 && revs.every((r) => r.status === "approved" || r.status === "updated");
  }).length;

  // Filter pages
  const filterPage = useCallback(
    (page) => {
      if (statusFilter && statusFilter !== "all") {
        const s = pageStates[page.id]?.status || "unreviewed";
        if (s !== statusFilter) return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const note = pageStates[page.id]?.note || "";
        if (
          !page.name.toLowerCase().includes(term) &&
          !page.url.toLowerCase().includes(term) &&
          !note.toLowerCase().includes(term)
        )
          return false;
      }
      return true;
    },
    [pageStates, statusFilter, searchTerm]
  );

  // Get ordered pages for a section or subgroup
  const getOrderedPages = useCallback(
    (pages, orderKey) => {
      const order = pageOrder[orderKey];
      if (!order) return pages.filter(filterPage);
      const pageMap = Object.fromEntries(pages.map((p) => [p.id, p]));
      const ordered = order.filter((id) => pageMap[id]).map((id) => pageMap[id]);
      // Add any pages not in the order
      const remaining = pages.filter((p) => !order.includes(p.id));
      return [...ordered, ...remaining].filter(filterPage);
    },
    [pageOrder, filterPage]
  );

  const hasSubgroups = !!section.subgroups;

  const visiblePages = hasSubgroups
    ? section.subgroups.flatMap((sg) => getOrderedPages(sg.pages, sg.id))
    : getOrderedPages(section.pages, section.id);

  if (visiblePages.length === 0 && (searchTerm || statusFilter !== "all")) return null;

  return (
    <Paper variant="outlined" sx={{ mb: 2, overflow: "hidden" }}>
      {/* Header */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1.5,
          cursor: "pointer",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton
            size="small"
            disabled={isFirst}
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            sx={{ p: 0.25 }}
          >
            <KeyboardArrowUp fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            disabled={isLast}
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            sx={{ p: 0.25 }}
          >
            <KeyboardArrowDown fontSize="small" />
          </IconButton>
        </Box>
        <IconComponent sx={{ color: "primary.main" }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
          {section.group}
        </Typography>
        {editingDesc ? (
          <TextField
            size="small"
            placeholder="Section goals / description..."
            value={descDraft}
            onChange={(e) => setDescDraft(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onUpdateSectionMeta({ description: descDraft });
                setEditingDesc(false);
              }
              if (e.key === "Escape") setEditingDesc(false);
            }}
            onBlur={() => {
              onUpdateSectionMeta({ description: descDraft });
              setEditingDesc(false);
            }}
            autoFocus
            sx={{ flex: 1, display: { xs: "none", sm: "flex" }, "& .MuiInputBase-input": { fontSize: 13, py: 0.5 } }}
          />
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            onClick={(e) => {
              e.stopPropagation();
              setDescDraft(sectionMeta?.description || section.description);
              setEditingDesc(true);
            }}
            sx={{
              display: { xs: "none", sm: "block" },
              cursor: "pointer",
              flex: 1,
              "&:hover": { color: "text.primary" },
            }}
          >
            {sectionMeta?.description || section.description}
          </Typography>
        )}
        <Chip label={`${reviewedCount}/${allPages.length}`} size="small" variant="outlined" />
        <Tooltip title="Sort by priority">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onSortByPriority(section);
            }}
            sx={{ p: 0.5 }}
          >
            <SortIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </Box>

      {/* Section progress bar */}
      <Box sx={{ px: 2, pb: expanded ? 0 : 1 }}>
        <ProgressBar pages={allPages} pageStates={pageStates} height={4} />
      </Box>

      {/* Pages */}
      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2, pt: 1 }}>
          {hasSubgroups
            ? section.subgroups.map((sg) => {
                const orderedPages = getOrderedPages(sg.pages, sg.id);
                if (orderedPages.length === 0) return null;
                return (
                  <Box key={sg.id} sx={{ mb: 2 }}>
                    <Typography variant="overline" sx={{ color: "text.secondary", mb: 0.5, display: "block" }}>
                      {sg.label}
                    </Typography>
                    {orderedPages.map((page, idx) => (
                      <PageCard
                        key={page.id}
                        page={page}
                        pageState={pageStates[page.id] || {}}
                        onUpdate={(state) => onUpdatePage(page.id, state)}
                        onMoveUp={() => onReorderPage(sg.id, page.id, -1)}
                        onMoveDown={() => onReorderPage(sg.id, page.id, 1)}
                        isFirst={idx === 0}
                        isLast={idx === orderedPages.length - 1}
                      />
                    ))}
                  </Box>
                );
              })
            : visiblePages.map((page, idx) => (
                <PageCard
                  key={page.id}
                  page={page}
                  pageState={pageStates[page.id] || {}}
                  onUpdate={(state) => onUpdatePage(page.id, state)}
                  onMoveUp={() => onReorderPage(section.id, page.id, -1)}
                  onMoveDown={() => onReorderPage(section.id, page.id, 1)}
                  isFirst={idx === 0}
                  isLast={idx === visiblePages.length - 1}
                />
              ))}
        </Box>
      </Collapse>
    </Paper>
  );
}

// --- Main App ---
export default function App() {
  const [tab, setTab] = useState(0);
  const [pageStates, setPageStates] = useState({});
  const [sectionOrder, setSectionOrder] = useState({ site: [], outreach: [] });
  const [pageOrder, setPageOrder] = useState({});
  const [sectionMeta, setSectionMeta] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [loaded, setLoaded] = useState(false);

  const saveTimer = useRef(null);
  const skipNextSave = useRef(false);
  const fileInputRef = useRef(null);

  // --- Load state from KV on mount ---
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/state");
        const data = await res.json();
        if (data.pageStates) {
          setPageStates(data.pageStates);
        }
        if (data.sectionOrder) {
          setSectionOrder(data.sectionOrder);
        }
        if (data.pageOrder) {
          setPageOrder(data.pageOrder);
        }
        if (data.sectionMeta) {
          setSectionMeta(data.sectionMeta);
        }
        skipNextSave.current = true;
      } catch (err) {
        console.error("Failed to load state:", err);
      }
      setLoaded(true);
    }
    load();
  }, []);

  // --- Auto-save with debounce ---
  const saveToKV = useCallback(async (ps, so, po, sm) => {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageStates: ps, sectionOrder: so, pageOrder: po, sectionMeta: sm }),
      });
      if (res.ok) {
        setSaveStatus("saved");
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveToKV(pageStates, sectionOrder, pageOrder, sectionMeta);
    }, 2000);
    return () => clearTimeout(saveTimer.current);
  }, [pageStates, sectionOrder, pageOrder, sectionMeta, loaded, saveToKV]);

  // --- Update section metadata ---
  const updateSectionMeta = useCallback((sectionId, meta) => {
    setSectionMeta((prev) => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], ...meta },
    }));
  }, []);

  // --- Update a page's state ---
  const updatePageState = useCallback((pageId, state) => {
    setPageStates((prev) => ({
      ...prev,
      [pageId]: { ...prev[pageId], ...state },
    }));
  }, []);

  // --- Reorder sections ---
  const reorderSection = useCallback(
    (tabKey, sectionId, direction) => {
      const sections = tabKey === "site" ? SITE_SECTIONS : OUTREACH_SECTIONS;
      const currentOrder = sectionOrder[tabKey]?.length
        ? sectionOrder[tabKey]
        : sections.map((s) => s.id);
      const idx = currentOrder.indexOf(sectionId);
      if (idx < 0) return;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= currentOrder.length) return;
      const newOrder = [...currentOrder];
      [newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]];
      setSectionOrder((prev) => ({ ...prev, [tabKey]: newOrder }));
    },
    [sectionOrder]
  );

  // --- Reorder pages within a section ---
  const reorderPage = useCallback(
    (sectionKey, pageId, direction) => {
      // Get current page list from the section data
      let defaultPages = [];
      const allSections = [...SITE_SECTIONS, ...OUTREACH_SECTIONS];
      for (const s of allSections) {
        if (s.id === sectionKey) {
          defaultPages = s.pages?.map((p) => p.id) || [];
          break;
        }
        if (s.subgroups) {
          for (const sg of s.subgroups) {
            if (sg.id === sectionKey) {
              defaultPages = sg.pages.map((p) => p.id);
              break;
            }
          }
        }
      }

      const currentOrder = pageOrder[sectionKey]?.length ? pageOrder[sectionKey] : defaultPages;
      const idx = currentOrder.indexOf(pageId);
      if (idx < 0) return;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= currentOrder.length) return;
      const newOrder = [...currentOrder];
      [newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]];
      setPageOrder((prev) => ({ ...prev, [sectionKey]: newOrder }));
    },
    [pageOrder]
  );

  // --- Sort pages by priority within a section ---
  const sortByPriority = useCallback(
    (section) => {
      const sortGroup = (pages, orderKey) => {
        const ids = pages.map((p) => p.id);
        const sorted = [...ids].sort((a, b) => {
          const pa = PRIORITIES[pageStates[a]?.priority || "none"]?.sort ?? 4;
          const pb = PRIORITIES[pageStates[b]?.priority || "none"]?.sort ?? 4;
          return pa - pb;
        });
        setPageOrder((prev) => ({ ...prev, [orderKey]: sorted }));
      };

      if (section.subgroups) {
        section.subgroups.forEach((sg) => sortGroup(sg.pages, sg.id));
      } else {
        sortGroup(section.pages, section.id);
      }
    },
    [pageStates]
  );

  // --- Get ordered sections for a tab ---
  const getOrderedSections = useCallback(
    (tabKey) => {
      const sections = tabKey === "site" ? SITE_SECTIONS : OUTREACH_SECTIONS;
      const order = sectionOrder[tabKey];
      if (!order || order.length === 0) return sections;
      const sectionMap = Object.fromEntries(sections.map((s) => [s.id, s]));
      const ordered = order.filter((id) => sectionMap[id]).map((id) => sectionMap[id]);
      const remaining = sections.filter((s) => !order.includes(s.id));
      return [...ordered, ...remaining];
    },
    [sectionOrder]
  );

  // --- Manual save ---
  const handleManualSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveToKV(pageStates, sectionOrder, pageOrder, sectionMeta);
  }, [pageStates, sectionOrder, pageOrder, sectionMeta, saveToKV]);

  // --- Backup / Restore ---
  const handleBackup = () => {
    window.open("/api/backup", "_blank");
  };

  const handleRestore = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.pageStates) setPageStates(data.pageStates);
        if (data.sectionOrder) setSectionOrder(data.sectionOrder);
        if (data.pageOrder) setPageOrder(data.pageOrder);
        if (data.sectionMeta) setSectionMeta(data.sectionMeta);
      } catch (err) {
        console.error("Invalid backup file:", err);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // --- Compute active sections and pages ---
  const tabKey = tab === 0 ? "site" : "outreach";
  const orderedSections = getOrderedSections(tabKey);
  const allPages = useMemo(
    () => orderedSections.flatMap((s) => getSectionPages(s)),
    [orderedSections]
  );

  // --- Save status indicator ---
  const saveIndicator = useMemo(() => {
    switch (saveStatus) {
      case "saving":
        return <Chip icon={<SyncIcon sx={{ fontSize: 16 }} />} label="Saving..." size="small" sx={{ bgcolor: "#FFF3E0", color: "#E65100" }} />;
      case "saved":
        return <Chip icon={<CheckCircleIcon sx={{ fontSize: 16 }} />} label="Saved" size="small" sx={{ bgcolor: "#E8F5E9", color: "#2E7D32" }} />;
      case "error":
        return <Chip icon={<ErrorIcon sx={{ fontSize: 16 }} />} label="Save failed" size="small" sx={{ bgcolor: "#FFEBEE", color: "#D32F2F" }} />;
      default:
        return null;
    }
  }, [saveStatus]);

  return (
    <Box sx={{ maxWidth: 960, mx: "auto", px: { xs: 2, sm: 3 }, py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary" }}>
          Ascend Labs Website Review
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Track review status for all pages across the ascendlabs.ai website
        </Typography>
      </Box>

      {/* Toolbar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <TextField
            size="small"
            placeholder="Search pages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              {STATUS_KEYS.map((key) => (
                <MenuItem key={key} value={key}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: STATUSES[key].color }} />
                    {STATUSES[key].label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {saveIndicator}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<SaveIcon />}
              onClick={handleManualSave}
              disabled={saveStatus === "saving"}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CloudDownload />}
              onClick={handleBackup}
            >
              Backup
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CloudUpload />}
              onClick={() => fileInputRef.current?.click()}
            >
              Restore
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleRestore}
              style={{ display: "none" }}
            />
          </Box>
        </Stack>
      </Paper>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2 }}
      >
        <Tab label={`Website Pages (${getAllPageIds(SITE_SECTIONS).length})`} />
        <Tab label={`Pages for Outreach (${getAllPageIds(OUTREACH_SECTIONS).length})`} />
      </Tabs>

      {/* Overall progress bar */}
      <Box sx={{ mb: 3 }}>
        <ProgressBar pages={allPages} pageStates={pageStates} height={8} />
      </Box>

      {/* Sections */}
      {orderedSections.map((section, idx) => (
        <SectionGroup
          key={section.id}
          section={section}
          pageStates={pageStates}
          onUpdatePage={updatePageState}
          pageOrder={pageOrder}
          onReorderPage={reorderPage}
          sectionMeta={sectionMeta[section.id] || {}}
          onUpdateSectionMeta={(meta) => updateSectionMeta(section.id, meta)}
          onSortByPriority={sortByPriority}
          onMoveUp={() => reorderSection(tabKey, section.id, -1)}
          onMoveDown={() => reorderSection(tabKey, section.id, 1)}
          isFirst={idx === 0}
          isLast={idx === orderedSections.length - 1}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
        />
      ))}

      {/* Footer */}
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 4, mb: 2 }}>
        Ascend Labs Website Review Tracker
      </Typography>
    </Box>
  );
}
