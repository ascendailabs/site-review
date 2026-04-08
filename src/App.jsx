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
  Checkbox,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
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
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RestoreIcon from "@mui/icons-material/Restore";

import { STATUSES, STATUS_KEYS } from "./data/statuses";
import { SITE_SECTIONS } from "./data/siteSections";
import { OUTREACH_SECTIONS } from "./data/outreachSections";
import AnnotationsPanel from "./AnnotationsPanel";
import PageDetailView from "./PageDetailView";

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

// --- To-do categories ---
const TODO_CATEGORIES = {
  now:    { label: "Now",    color: "#D32F2F", bgColor: "#FFEBEE" },
  future: { label: "Future", color: "#7B1FA2", bgColor: "#F3E5F5" },
};

// --- ReviewerRow ---
function ReviewerRow({ reviewer, onChange, onRemove }) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const rs = REVIEWER_STATUSES[reviewer.status] || REVIEWER_STATUSES.pending;

  return (
    <Box sx={{ mb: 1, pl: 1, borderLeft: `3px solid ${rs.color}`, borderRadius: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        <Box
          onClick={() => setNotesOpen(!notesOpen)}
          sx={{ display: "flex", alignItems: "center", gap: 0.75, flex: 1, cursor: "pointer", borderRadius: 0.5, "&:hover": { bgcolor: "action.hover" } }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{reviewer.name}</Typography>
          <Typography variant="caption" color="text.secondary">{reviewer.date}</Typography>
          <Box sx={{ flex: 1 }} />
          <NotesIcon sx={{ fontSize: 16, color: reviewer.note ? "primary.main" : "text.secondary" }} />
        </Box>
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
function PageCard({ page, pageState, onUpdate, onMoveUp, onMoveDown, isFirst, isLast, onRemove, showThumbnail, onAnnotate, onDetail }) {
  const [editingMarkup, setEditingMarkup] = useState(false);
  const [markupDraft, setMarkupDraft] = useState("");
  const [editingPurpose, setEditingPurpose] = useState(false);
  const [purposeDraft, setPurposeDraft] = useState("");
  const [addingReviewer, setAddingReviewer] = useState(false);
  const [reviewerName, setReviewerName] = useState("");
  const [addingTodo, setAddingTodo] = useState(false);
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoCategory, setNewTodoCategory] = useState("now");
  const [todoFilter, setTodoFilter] = useState("all");
  const [thumbKey, setThumbKey] = useState(0);
  const markupUrl = pageState?.markupUrl || "";
  const reviewers = pageState?.reviewers || [];
  const priority = pageState?.priority || "none";
  const finished = pageState?.finished || false;
  const borderColor = finished ? "#2E7D32" : (PRIORITIES[priority]?.color || "#9E9E9E");
  const todos = pageState?.todos || [];
  const filteredTodos = todoFilter === "all" ? todos : todos.filter((t) => t.category === todoFilter);

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

  const addTodo = () => {
    if (!newTodoText.trim()) return;
    const newItem = { id: `todo-${Date.now()}`, text: newTodoText.trim(), done: false, category: newTodoCategory };
    onUpdate({ ...pageState, todos: [...todos, newItem] });
    setNewTodoText("");
  };

  const toggleTodo = (todoId) => {
    const updated = todos.map((t) => (t.id === todoId ? { ...t, done: !t.done } : t));
    onUpdate({ ...pageState, todos: updated });
  };

  const removeTodo = (todoId) => {
    onUpdate({ ...pageState, todos: todos.filter((t) => t.id !== todoId) });
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
      <Box sx={{ p: 1.5, display: "flex", gap: 1.5 }}>
        {/* Thumbnail */}
        {showThumbnail && (
          <Box
            sx={{
              flexShrink: 0,
              width: 200,
              height: 130,
              borderRadius: 1,
              overflow: "hidden",
              border: "1px solid #E0E0E0",
              position: "relative",
              bgcolor: "#FAFAFA",
              "&:hover .thumb-reload": { opacity: 1 },
            }}
          >
            <Box
              component="a"
              href={page.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: "block", width: "100%", height: "100%", cursor: "pointer" }}
            >
              <iframe
                key={thumbKey}
                src={page.url}
                title={`Preview of ${page.name}`}
                loading="lazy"
                sandbox="allow-same-origin"
                style={{
                  width: 1600,
                  height: 1040,
                  transform: "scale(0.125)",
                  transformOrigin: "top left",
                  border: "none",
                  pointerEvents: "none",
                }}
              />
            </Box>
            <Tooltip title="Reload thumbnail">
              <IconButton
                className="thumb-reload"
                size="small"
                onClick={() => setThumbKey((k) => k + 1)}
                sx={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  bgcolor: "rgba(255,255,255,0.85)",
                  opacity: 0,
                  transition: "opacity 0.2s",
                  p: 0.5,
                  "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                }}
              >
                <SyncIcon sx={{ fontSize: 16, color: "#1976D2" }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
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
          <Chip
            label={finished ? "Finished" : "Active"}
            size="small"
            onClick={() => onUpdate({ ...pageState, finished: !finished })}
            sx={{
              bgcolor: finished ? "#E8F5E9" : "transparent",
              color: finished ? "#2E7D32" : "text.secondary",
              fontWeight: 600,
              fontSize: 11,
              height: 24,
              border: `1px solid ${finished ? "#2E7D32" : "#E0E0E0"}`,
              cursor: "pointer",
              "&:hover": { opacity: 0.85 },
            }}
          />
          <Typography
            variant="body1"
            onClick={onDetail}
            sx={{
              fontWeight: 600,
              mr: 0.5,
              cursor: onDetail ? "pointer" : "default",
              "&:hover": onDetail ? { color: "#3498DC" } : {},
              transition: "color 0.15s",
            }}
          >
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
          {onRemove && (
            <Tooltip title="Delete page">
              <IconButton size="small" onClick={onRemove} sx={{ p: 0.25, color: "text.secondary", "&:hover": { color: "#D32F2F" } }}>
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
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

          {/* Annotation indicator */}
          {(() => {
            const ann = pageState?.annotationSummary;
            if (!ann || (ann.open === 0 && ann.resolved === 0)) return null;
            const hasOpen = ann.open > 0;
            return (
              <Chip
                label={`${ann.open} open / ${ann.resolved} resolved`}
                size="small"
                onClick={onAnnotate}
                sx={{
                  bgcolor: hasOpen ? "#FFEBEE" : "#E8F5E9",
                  color: hasOpen ? "#D32F2F" : "#2E7D32",
                  fontWeight: 600,
                  fontSize: 11,
                  height: 24,
                  border: `1px solid ${hasOpen ? "#D32F2F" : "#2E7D32"}`,
                  cursor: "pointer",
                  "&:hover": { opacity: 0.85 },
                }}
              />
            );
          })()}
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

        {/* To-Dos */}
        <Divider sx={{ mt: 1.5, ml: 6.5 }} />
        <Box sx={{ mt: 1, ml: 6.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
            <PlaylistAddCheckIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
              To-Dos
            </Typography>
            {todos.length > 0 && (
              <Chip
                label={`${todos.filter((t) => t.done).length}/${todos.length}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: 11, height: 20 }}
              />
            )}
            <Box sx={{ flex: 1 }} />
            {todos.length > 0 && (
              <Box sx={{ display: "flex", gap: 0.5 }}>
                {["all", "now", "future"].map((cat) => (
                  <Chip
                    key={cat}
                    label={cat === "all" ? "All" : TODO_CATEGORIES[cat].label}
                    size="small"
                    variant={todoFilter === cat ? "filled" : "outlined"}
                    onClick={() => setTodoFilter(cat)}
                    sx={{
                      fontSize: 10,
                      height: 20,
                      cursor: "pointer",
                      fontWeight: todoFilter === cat ? 600 : 400,
                      ...(todoFilter === cat && cat !== "all"
                        ? {
                            bgcolor: TODO_CATEGORIES[cat].bgColor,
                            color: TODO_CATEGORIES[cat].color,
                            border: `1px solid ${TODO_CATEGORIES[cat].color}`,
                          }
                        : {}),
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* Todo items */}
          {filteredTodos.map((todo) => (
            <Box
              key={todo.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                py: 0.25,
                pl: 0.5,
                borderRadius: 1,
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Checkbox
                checked={todo.done}
                onChange={() => toggleTodo(todo.id)}
                size="small"
                sx={{ p: 0.25, color: TODO_CATEGORIES[todo.category]?.color || "#9E9E9E" }}
              />
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  fontSize: 13,
                  textDecoration: todo.done ? "line-through" : "none",
                  color: todo.done ? "text.disabled" : "text.primary",
                }}
              >
                {todo.text}
              </Typography>
              <Chip
                label={TODO_CATEGORIES[todo.category]?.label || "Now"}
                size="small"
                sx={{
                  fontSize: 10,
                  height: 20,
                  bgcolor: TODO_CATEGORIES[todo.category]?.bgColor || "#FFEBEE",
                  color: TODO_CATEGORIES[todo.category]?.color || "#D32F2F",
                  fontWeight: 600,
                }}
              />
              <IconButton size="small" onClick={() => removeTodo(todo.id)} sx={{ p: 0.25 }}>
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          ))}

          {/* Add todo form */}
          {addingTodo ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
              <TextField
                size="small"
                placeholder="To-do item..."
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addTodo();
                  if (e.key === "Escape") {
                    setAddingTodo(false);
                    setNewTodoText("");
                  }
                }}
                autoFocus
                sx={{ flex: 1, "& .MuiInputBase-input": { fontSize: 13, py: 0.5 } }}
              />
              <Chip
                label={TODO_CATEGORIES[newTodoCategory].label}
                size="small"
                onClick={() => setNewTodoCategory(newTodoCategory === "now" ? "future" : "now")}
                sx={{
                  cursor: "pointer",
                  fontSize: 11,
                  height: 24,
                  fontWeight: 600,
                  bgcolor: TODO_CATEGORIES[newTodoCategory].bgColor,
                  color: TODO_CATEGORIES[newTodoCategory].color,
                  border: `1px solid ${TODO_CATEGORIES[newTodoCategory].color}`,
                  "&:hover": { opacity: 0.85 },
                }}
              />
              <Button size="small" variant="contained" onClick={addTodo} disabled={!newTodoText.trim()}>
                Add
              </Button>
              <Button size="small" onClick={() => { setAddingTodo(false); setNewTodoText(""); }}>
                Cancel
              </Button>
            </Box>
          ) : (
            <Chip
              icon={<AddIcon sx={{ fontSize: 14 }} />}
              label="Add To-Do"
              size="small"
              variant="outlined"
              onClick={() => setAddingTodo(true)}
              sx={{ mt: 0.5, cursor: "pointer", fontSize: 12, borderStyle: "dashed" }}
            />
          )}
        </Box>
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
  onAddPage,
  onRemovePage,
  onRemoveSection,
  onSortByPriority,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  searchTerm,
  statusFilter,
  hideFinished,
  hideDeferred,
  showThumbnails,
  onAnnotate,
  onDetail,
}) {
  const [expanded, setExpanded] = useState(section.collapsed !== true);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");
  const [addingPage, setAddingPage] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [newPageUrl, setNewPageUrl] = useState("");
  const IconComponent = ICON_MAP[section.icon] || BoltIcon;
  const allPages = getSectionPages(section);

  const reviewedCount = allPages.filter((p) => {
    const revs = pageStates[p.id]?.reviewers || [];
    return revs.length > 0 && revs.every((r) => r.status === "approved" || r.status === "updated");
  }).length;

  // Filter pages
  const filterPage = useCallback(
    (page) => {
      const ps = pageStates[page.id];
      // Hide finished pages
      if (hideFinished && ps?.finished) return false;
      // Hide deferred priority pages
      if (hideDeferred && (ps?.priority === "deferred")) return false;
      // Reviewer status filter
      if (statusFilter && statusFilter !== "all") {
        const revs = ps?.reviewers || [];
        if (statusFilter === "no_reviewers") {
          if (revs.length > 0) return false;
        } else {
          if (!revs.some((r) => r.status === statusFilter)) return false;
        }
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const note = ps?.note || "";
        const purpose = ps?.purpose || "";
        const todoTexts = (ps?.todos || []).map((t) => t.text.toLowerCase()).join(" ");
        if (
          !page.name.toLowerCase().includes(term) &&
          !page.url.toLowerCase().includes(term) &&
          !note.toLowerCase().includes(term) &&
          !purpose.toLowerCase().includes(term) &&
          !todoTexts.includes(term)
        )
          return false;
      }
      return true;
    },
    [pageStates, statusFilter, searchTerm, hideFinished, hideDeferred]
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

  if (visiblePages.length === 0 && (searchTerm || statusFilter !== "all" || hideFinished || hideDeferred)) return null;

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
        {onRemoveSection && (
          <Tooltip title="Delete section">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveSection();
              }}
              sx={{ p: 0.5, color: "text.secondary", "&:hover": { color: "#D32F2F" } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
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
                        onRemove={page.id.startsWith("custom-pg-") ? () => onRemovePage(page.id) : undefined}
                        showThumbnail={showThumbnails}
                        onAnnotate={onAnnotate ? () => onAnnotate(page.id) : undefined}
                        onDetail={onDetail ? () => onDetail(page.id) : undefined}
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
                  onRemove={page.id.startsWith("custom-pg-") ? () => onRemovePage(page.id) : undefined}
                  showThumbnail={showThumbnails}
                  onAnnotate={onAnnotate ? () => onAnnotate(page.id) : undefined}
                  onDetail={onDetail ? () => onDetail(page.id) : undefined}
                />
              ))}
          {/* Add Page */}
          {addingPage ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
              <TextField
                size="small"
                placeholder="Page name..."
                value={newPageName}
                onChange={(e) => setNewPageName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") { setAddingPage(false); setNewPageName(""); setNewPageUrl(""); }
                }}
                autoFocus
                sx={{ flex: 1, "& .MuiInputBase-input": { fontSize: 13, py: 0.5 } }}
              />
              <TextField
                size="small"
                placeholder="URL..."
                value={newPageUrl}
                onChange={(e) => setNewPageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newPageName.trim() && newPageUrl.trim()) {
                    onAddPage(newPageName.trim(), newPageUrl.trim());
                    setNewPageName(""); setNewPageUrl(""); setAddingPage(false);
                  }
                  if (e.key === "Escape") { setAddingPage(false); setNewPageName(""); setNewPageUrl(""); }
                }}
                sx={{ flex: 1, "& .MuiInputBase-input": { fontSize: 13, py: 0.5 } }}
              />
              <Button
                size="small"
                variant="contained"
                disabled={!newPageName.trim() || !newPageUrl.trim()}
                onClick={() => {
                  onAddPage(newPageName.trim(), newPageUrl.trim());
                  setNewPageName(""); setNewPageUrl(""); setAddingPage(false);
                }}
              >
                Add
              </Button>
              <Button size="small" onClick={() => { setAddingPage(false); setNewPageName(""); setNewPageUrl(""); }}>
                Cancel
              </Button>
            </Box>
          ) : (
            <Chip
              icon={<AddIcon sx={{ fontSize: 14 }} />}
              label="Add Page"
              size="small"
              variant="outlined"
              onClick={() => setAddingPage(true)}
              sx={{ mt: 1, cursor: "pointer", fontSize: 12, borderStyle: "dashed" }}
            />
          )}
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
  const [customSections, setCustomSections] = useState({ site: [], outreach: [] });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hideFinished, setHideFinished] = useState(false);
  const [hideDeferred, setHideDeferred] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null); // { message, detail, hasMirror } | null — blocks editing when set
  const [viewingMirror, setViewingMirror] = useState(false); // true when user opted to view localStorage backup; saves stay blocked, dialog hidden
  const [saveBlockError, setSaveBlockError] = useState(null); // { existingScore, newScore } | null — 30% data-loss guard 409
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionIcon, setNewSectionIcon] = useState("Bolt");
  const [annotationPageId, setAnnotationPageId] = useState(null);
  const [detailPageId, setDetailPageId] = useState(null);

  const navigateToAnnotation = useCallback((pageId) => {
    setAnnotationPageId(pageId);
    setTab(2);
  }, []);

  const navigateToDetail = useCallback((pageId) => {
    setDetailPageId(pageId);
  }, []);

  const saveTimer = useRef(null);
  const skipNextSave = useRef(false);
  const fileInputRef = useRef(null);

  // Write a snapshot of state to localStorage as a read-only fallback for the
  // case where KV is unreachable on a future load. Wrapped to handle quota errors.
  const mirrorToLocalStorage = useCallback((snapshot) => {
    try {
      // Strip nothing — if this throws QuotaExceededError, we log once and move on.
      // The mirror is a best-effort backup, not a hard requirement.
      localStorage.setItem(
        "review-state-mirror",
        JSON.stringify({ ...snapshot, mirroredAt: new Date().toISOString() })
      );
    } catch (err) {
      console.warn("localStorage mirror failed (quota or disabled):", err?.message || err);
    }
  }, []);

  // Helper: apply a loaded state object to all the local state setters.
  // Always sets skipNextSave so the immediate echo from setState doesn't trigger a save-back.
  const applyLoadedState = useCallback((data) => {
    skipNextSave.current = true;
    setPageStates(data.pageStates || {});
    setSectionOrder(data.sectionOrder || { site: [], outreach: [] });
    setPageOrder(data.pageOrder || {});
    setSectionMeta(data.sectionMeta || {});
    setCustomSections(data.customSections || { site: [], outreach: [] });
  }, []);

  // --- Load state from KV on mount ---
  // SAFETY: If anything goes wrong loading (network, non-OK status, malformed body),
  // we set loadError and REFUSE to set `loaded = true`. The auto-save effect is gated
  // on `loaded`, so a failed load can never overwrite KV with the empty initial state.
  // This is the fix for the previous data-loss incident.
  useEffect(() => {
    function failWith(message, detail) {
      const hasMirror = (() => {
        try {
          return !!localStorage.getItem("review-state-mirror");
        } catch {
          return false;
        }
      })();
      setLoadError({ message, detail, hasMirror });
    }

    async function load() {
      let res;
      try {
        res = await fetch("/api/state");
      } catch (err) {
        console.error("Load failed (network):", err);
        failWith(
          "Could not reach the server to load your review data.",
          String(err?.message || err)
        );
        return;
      }

      if (!res.ok) {
        console.error("Load failed (HTTP):", res.status);
        failWith(
          `Server returned ${res.status} when loading your review data.`,
          "Editing is disabled until this resolves to prevent overwriting existing data."
        );
        return;
      }

      let data;
      try {
        data = await res.json();
      } catch (err) {
        console.error("Load failed (bad JSON):", err);
        failWith(
          "The server returned an invalid response when loading review data.",
          "This usually means API routes aren't running locally. Use `vercel dev` instead of `npm run dev` for full-stack dev."
        );
        return;
      }

      // Empty KV ({ pageStates: null, ... }) is a valid first-run state — no error.
      applyLoadedState(data);

      // Only mirror if we actually have data (avoid writing an empty-shell mirror on first run).
      if (data.pageStates && Object.keys(data.pageStates).length > 0) {
        mirrorToLocalStorage({
          pageStates: data.pageStates,
          sectionOrder: data.sectionOrder,
          pageOrder: data.pageOrder,
          sectionMeta: data.sectionMeta,
          customSections: data.customSections,
        });
      }

      setLoaded(true);
    }
    load();
    // applyLoadedState and mirrorToLocalStorage are stable (empty-dep useCallbacks),
    // so this effect runs exactly once on mount. Listed in deps to satisfy exhaustive-deps,
    // but if either ever gains state-dependent deps this becomes a re-load footgun —
    // applyLoadedState's internal skipNextSave guard mitigates but doesn't eliminate that.
  }, [applyLoadedState, mirrorToLocalStorage]);

  // --- Auto-save with debounce ---
  const saveToKV = useCallback(async (ps, so, po, sm, cs) => {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageStates: ps,
          sectionOrder: so,
          pageOrder: po,
          sectionMeta: sm,
          customSections: cs,
        }),
      });

      if (res.ok) {
        setSaveStatus("saved");
        // Mirror successful save to localStorage as a read-only fallback for next load.
        mirrorToLocalStorage({
          pageStates: ps,
          sectionOrder: so,
          pageOrder: po,
          sectionMeta: sm,
          customSections: cs,
        });
      } else if (res.status === 409) {
        // Server-side data-loss guard — last line of defense against catastrophic shrinkage.
        const body = await res.json().catch(() => ({}));
        console.error("Save blocked: data_loss_guard", body);
        setSaveStatus("error");
        setSaveBlockError({
          kind: "data_loss",
          existingScore: body.existingScore ?? null,
          newScore: body.newScore ?? null,
        });
      } else if (res.status === 413) {
        // Payload too large — Upstash KV cap. Block auto-save and surface a modal so the
        // user knows further keystrokes won't help. Same dialog plumbing as the 409 path.
        const body = await res.json().catch(() => ({}));
        console.error("Save blocked: payload_too_large", body);
        setSaveStatus("error");
        setSaveBlockError({
          kind: "payload_too_large",
          message: body.message || "Your review data exceeds the server's size limit.",
        });
      } else if (res.status === 400) {
        // Validation failure — most likely a client bug shipping a malformed body. Block
        // auto-save and show the validation message so we don't hammer the API.
        const body = await res.json().catch(() => ({}));
        console.error("Save blocked: invalid_body", body);
        setSaveStatus("error");
        setSaveBlockError({
          kind: "invalid_body",
          message: body.message || "The server rejected the request body as invalid.",
        });
      } else {
        // 500 / network — surface as the chip; auto-save will retry on next change. We
        // intentionally don't modal-block here because the user can usually recover by
        // waiting (transient KV outage) or clicking the manual Save button.
        setSaveStatus("error");
      }
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus("error");
    }
  }, [mirrorToLocalStorage]);

  useEffect(() => {
    // Always cancel any pending debounced save on dependency change. This prevents
    // a queued save from firing after a guard transitions us into an error state.
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (!loaded) return;
    if (loadError) return; // Never save while load is broken.
    if (saveBlockError) return; // Never save while the data-loss guard is active — user must resolve.
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    saveTimer.current = setTimeout(() => {
      saveToKV(pageStates, sectionOrder, pageOrder, sectionMeta, customSections);
    }, 2000);
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [pageStates, sectionOrder, pageOrder, sectionMeta, customSections, loaded, loadError, saveBlockError, saveToKV]);

  // Restore from the localStorage mirror when KV is unreachable. Read-only:
  // applies the state and hides the load-error dialog, but loadError stays set
  // so the auto-save effect remains blocked. A persistent banner shows so the
  // user understands they're viewing a local copy and can't edit.
  const loadFromMirror = useCallback(() => {
    try {
      const raw = localStorage.getItem("review-state-mirror");
      if (!raw) return;
      const data = JSON.parse(raw);
      applyLoadedState(data);
      setViewingMirror(true);
      setLoaded(true); // render the app shell with mirrored data
    } catch (err) {
      console.error("Failed to read localStorage mirror:", err);
    }
  }, [applyLoadedState]);

  // --- Update section metadata ---
  const updateSectionMeta = useCallback((sectionId, meta) => {
    setSectionMeta((prev) => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], ...meta },
    }));
  }, []);

  // --- Custom section CRUD ---
  const addCustomSection = useCallback(
    (tk, name, icon) => {
      const newSection = {
        id: `custom-sec-${Date.now()}`,
        group: name,
        icon: icon || "Bolt",
        description: "",
        pages: [],
      };
      setCustomSections((prev) => ({
        ...prev,
        [tk]: [...(prev[tk] || []), newSection],
      }));
    },
    []
  );

  const removeCustomSection = useCallback(
    (tk, sectionId) => {
      setCustomSections((prev) => ({
        ...prev,
        [tk]: (prev[tk] || []).filter((s) => s.id !== sectionId),
      }));
    },
    []
  );

  // --- Custom page CRUD ---
  const addCustomPage = useCallback(
    (sectionId, name, url) => {
      const newPage = {
        id: `custom-pg-${Date.now()}`,
        name,
        url,
      };
      setSectionMeta((prev) => ({
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          customPages: [...(prev[sectionId]?.customPages || []), newPage],
        },
      }));
    },
    []
  );

  const removeCustomPage = useCallback(
    (sectionId, pageId) => {
      setSectionMeta((prev) => ({
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          customPages: (prev[sectionId]?.customPages || []).filter((p) => p.id !== pageId),
        },
      }));
    },
    []
  );

  // --- Update a page's state ---
  const updatePageState = useCallback((pageId, stateOrUpdater) => {
    setPageStates((prev) => {
      const prevPage = prev[pageId] || {};
      const patch =
        typeof stateOrUpdater === "function" ? stateOrUpdater(prevPage) : stateOrUpdater;
      return {
        ...prev,
        [pageId]: { ...prevPage, ...patch },
      };
    });
  }, []);

  // --- Reorder sections ---
  const reorderSection = useCallback(
    (tabKey, sectionId, direction) => {
      const staticSections = tabKey === "site" ? SITE_SECTIONS : OUTREACH_SECTIONS;
      const custom = customSections[tabKey] || [];
      const sections = [...staticSections, ...custom];
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
    [sectionOrder, customSections]
  );

  // --- Reorder pages within a section ---
  const reorderPage = useCallback(
    (sectionKey, pageId, direction) => {
      // Get current page list from the section data
      let defaultPages = [];
      const allSections = [...SITE_SECTIONS, ...OUTREACH_SECTIONS, ...(customSections.site || []), ...(customSections.outreach || [])];
      for (const s of allSections) {
        if (s.id === sectionKey) {
          const staticIds = s.pages?.map((p) => p.id) || [];
          const customIds = (sectionMeta[s.id]?.customPages || []).map((p) => p.id);
          defaultPages = [...staticIds, ...customIds];
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
    [pageOrder, customSections, sectionMeta]
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
      const staticSections = tabKey === "site" ? SITE_SECTIONS : OUTREACH_SECTIONS;
      const custom = customSections[tabKey] || [];
      const sections = [...staticSections, ...custom];
      const order = sectionOrder[tabKey];
      if (!order || order.length === 0) return sections;
      const sectionMap = Object.fromEntries(sections.map((s) => [s.id, s]));
      const ordered = order.filter((id) => sectionMap[id]).map((id) => sectionMap[id]);
      const remaining = sections.filter((s) => !order.includes(s.id));
      return [...ordered, ...remaining];
    },
    [sectionOrder, customSections]
  );

  // --- Manual save ---
  const handleManualSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveToKV(pageStates, sectionOrder, pageOrder, sectionMeta, customSections);
  }, [pageStates, sectionOrder, pageOrder, sectionMeta, customSections, saveToKV]);

  // --- Backup / Restore ---
  const handleBackup = () => {
    window.open("/api/backup", "_blank");
  };

  // Validate the shape of an uploaded backup file. Mirrors the server-side validateBody —
  // we want to catch corrupt or wrong-shape JSON BEFORE it reaches React state and gets
  // auto-saved to KV. Returns null if valid, or an error string.
  const validateBackupShape = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return "Backup file is not a JSON object.";
    }
    const fields = ["pageStates", "sectionOrder", "pageOrder", "sectionMeta", "customSections"];
    for (const f of fields) {
      const v = data[f];
      if (v == null) continue;
      if (typeof v !== "object" || Array.isArray(v)) {
        return `Backup field "${f}" must be an object.`;
      }
    }
    if (data.pageStates) {
      for (const [pid, ps] of Object.entries(data.pageStates)) {
        if (!ps || typeof ps !== "object" || Array.isArray(ps)) {
          return `Backup pageStates["${pid}"] is not an object.`;
        }
      }
    }
    return null;
  };

  const handleRestore = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      let data;
      try {
        data = JSON.parse(ev.target.result);
      } catch (err) {
        console.error("Restore failed (invalid JSON):", err);
        alert("Restore failed: the file is not valid JSON.");
        return;
      }
      const validationError = validateBackupShape(data);
      if (validationError) {
        console.error("Restore failed (invalid shape):", validationError);
        alert(`Restore failed: ${validationError}`);
        return;
      }
      // Use applyLoadedState so defaults and skipNextSave are handled centrally.
      applyLoadedState(data);
      // Force the next dependency-change save to fire so the user sees the restore reach KV.
      skipNextSave.current = false;
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleRestoreAutoBackup = useCallback(async () => {
    if (!window.confirm("Restore from the last auto-backup? This will replace all current data with the previously saved version.")) return;
    try {
      setSaveStatus("saving");
      const res = await fetch("/api/backup?action=restore-auto", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Restore failed");
        setSaveStatus("error");
        return;
      }
      // Reload state from KV via applyLoadedState — handles defaults and skipNextSave.
      const fresh = await fetch("/api/state");
      if (!fresh.ok) {
        console.error("Auto-restore: fresh fetch returned", fresh.status);
        alert(`Restore succeeded server-side but reload failed (HTTP ${fresh.status}). Reload the page manually.`);
        setSaveStatus("error");
        return;
      }
      const freshData = await fresh.json();
      applyLoadedState(freshData);
      setSaveStatus("saved");
    } catch (err) {
      console.error("Auto-restore failed:", err);
      setSaveStatus("error");
    }
  }, [applyLoadedState]);

  // --- Compute active sections and pages (merge custom pages into section objects) ---
  const tabKey = ["site", "outreach", "annotations"][tab] || "site";
  const orderedSections = useMemo(() => {
    const base = getOrderedSections(tabKey);
    return base.map((s) => {
      const cp = sectionMeta[s.id]?.customPages;
      if (!cp || cp.length === 0 || s.subgroups) return s;
      return { ...s, pages: [...(s.pages || []), ...cp] };
    });
  }, [getOrderedSections, tabKey, sectionMeta]);

  const allPages = useMemo(
    () => orderedSections.flatMap((s) => getSectionPages(s)),
    [orderedSections]
  );

  // --- Find page object by ID across all sections ---
  const detailPage = useMemo(() => {
    if (!detailPageId) return null;
    const allSections = [...SITE_SECTIONS, ...OUTREACH_SECTIONS, ...(customSections.site || []), ...(customSections.outreach || [])];
    for (const section of allSections) {
      const pages = getSectionPages(section);
      const found = pages.find((p) => p.id === detailPageId);
      if (found) return found;
      // Check custom pages in sectionMeta
      const cp = sectionMeta[section.id]?.customPages || [];
      const foundCustom = cp.find((p) => p.id === detailPageId);
      if (foundCustom) return foundCustom;
    }
    return null;
  }, [detailPageId, customSections, sectionMeta]);

  // --- Page counts per tab (including custom sections + pages) ---
  const totalPages = useCallback(
    (tk) => {
      const staticSections = tk === "site" ? SITE_SECTIONS : OUTREACH_SECTIONS;
      const custom = customSections[tk] || [];
      return [...staticSections, ...custom].reduce(
        (count, s) => count + getSectionPages(s).length + (sectionMeta[s.id]?.customPages?.length || 0),
        0
      );
    },
    [customSections, sectionMeta]
  );

  // --- Save status indicator ---
  // Darker hex values chosen to meet WCAG AA on light chip backgrounds.
  const saveIndicator = useMemo(() => {
    switch (saveStatus) {
      case "saving":
        return <Chip icon={<SyncIcon sx={{ fontSize: 16 }} />} label="Saving..." size="small" sx={{ bgcolor: "#FFF3E0", color: "#BF360A" }} />;
      case "saved":
        return <Chip icon={<CheckCircleIcon sx={{ fontSize: 16 }} />} label="Saved" size="small" sx={{ bgcolor: "#E8F5E9", color: "#1B5E20" }} />;
      case "error":
        return <Chip icon={<ErrorIcon sx={{ fontSize: 16 }} />} label="Save failed" size="small" sx={{ bgcolor: "#FFEBEE", color: "#B71C1C" }} />;
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

      {viewingMirror && (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          }
          sx={{ mb: 2 }}
        >
          <strong>Read-only mode.</strong> You're viewing a local backup because the server is unreachable. All controls below are disabled and edits will not save.
        </Alert>
      )}

      {/* All interactive content is wrapped so we can disable it via the `inert` attribute
          when viewingMirror is true. inert disables pointer events, removes the subtree
          from the tab order, and excludes it from the accessibility tree — the correct
          way to enforce a read-only mode without scattering disabled props everywhere.
          We use a ref-based DOM attribute set because React's prop handling for `inert`
          varies across versions and we want a guaranteed-rendered attribute. */}
      <Box
        ref={(el) => {
          if (!el) return;
          if (viewingMirror) el.setAttribute("inert", "");
          else el.removeAttribute("inert");
        }}
        sx={{
          opacity: viewingMirror ? 0.55 : 1,
          transition: "opacity 0.2s",
          // Belt-and-suspenders: even if a browser ignores `inert`, kill pointer events.
          pointerEvents: viewingMirror ? "none" : "auto",
          userSelect: viewingMirror ? "text" : "auto",
        }}
      >
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
            <InputLabel>Reviewer Status</InputLabel>
            <Select
              value={statusFilter}
              label="Reviewer Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="no_reviewers">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#BDBDBD" }} />
                  No Reviewers
                </Box>
              </MenuItem>
              {REVIEWER_STATUS_KEYS.map((key) => (
                <MenuItem key={key} value={key}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: REVIEWER_STATUSES[key].color }} />
                    {REVIEWER_STATUSES[key].label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Chip
            label="Hide Finished"
            size="small"
            variant={hideFinished ? "filled" : "outlined"}
            onClick={() => setHideFinished(!hideFinished)}
            sx={{
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 12,
              bgcolor: hideFinished ? "#E8F5E9" : "transparent",
              color: hideFinished ? "#2E7D32" : "text.secondary",
              border: `1px solid ${hideFinished ? "#2E7D32" : "#E0E0E0"}`,
            }}
          />
          <Chip
            label="Hide Deferred"
            size="small"
            variant={hideDeferred ? "filled" : "outlined"}
            onClick={() => setHideDeferred(!hideDeferred)}
            sx={{
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 12,
              bgcolor: hideDeferred ? "#ECEFF1" : "transparent",
              color: hideDeferred ? "#78909C" : "text.secondary",
              border: `1px solid ${hideDeferred ? "#78909C" : "#E0E0E0"}`,
            }}
          />
          <Chip
            icon={<VisibilityIcon sx={{ fontSize: 16 }} />}
            label="Thumbnails"
            size="small"
            variant={showThumbnails ? "filled" : "outlined"}
            onClick={() => setShowThumbnails(!showThumbnails)}
            sx={{
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 12,
              bgcolor: showThumbnails ? "#E3F2FD" : "transparent",
              color: showThumbnails ? "#1976D2" : "text.secondary",
              border: `1px solid ${showThumbnails ? "#1976D2" : "#E0E0E0"}`,
            }}
          />
          {saveIndicator}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<SaveIcon />}
              onClick={handleManualSave}
              disabled={saveStatus === "saving"}
            >
              Save
            </Button>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Button
                variant="text"
                size="small"
                startIcon={<CloudDownload />}
                onClick={handleBackup}
                sx={{ fontSize: 11, py: 0, px: 0.75, minWidth: 0, color: "text.secondary", textTransform: "none" }}
              >
                Backup
              </Button>
              <Button
                variant="text"
                size="small"
                startIcon={<CloudUpload />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ fontSize: 11, py: 0, px: 0.75, minWidth: 0, color: "text.secondary", textTransform: "none" }}
              >
                Restore
              </Button>
              <Button
                variant="text"
                size="small"
                startIcon={<RestoreIcon />}
                onClick={handleRestoreAutoBackup}
                sx={{ fontSize: 11, py: 0, px: 0.75, minWidth: 0, color: "#6A1B9A", textTransform: "none" }}
              >
                Undo Last Save
              </Button>
            </Box>
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

      {/* Detail View OR Tabs */}
      {detailPageId && detailPage ? (
        <PageDetailView
          page={detailPage}
          pageState={pageStates[detailPageId] || {}}
          onUpdate={(state) => updatePageState(detailPageId, state)}
          onBack={() => setDetailPageId(null)}
          pageStates={pageStates}
          updatePageState={updatePageState}
          siteSections={SITE_SECTIONS}
          outreachSections={OUTREACH_SECTIONS}
          customSections={customSections}
          sectionMeta={sectionMeta}
        />
      ) : (
      <>
      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2 }}
      >
        <Tab label={`Website Pages (${totalPages("site")})`} />
        <Tab label={`Pages for Outreach (${totalPages("outreach")})`} />
        <Tab label="Annotations" />
      </Tabs>

      {tab === 2 ? (
        <AnnotationsPanel
          pageStates={pageStates}
          updatePageState={updatePageState}
          siteSections={SITE_SECTIONS}
          outreachSections={OUTREACH_SECTIONS}
          customSections={customSections}
          sectionMeta={sectionMeta}
          initialPageId={annotationPageId}
        />
      ) : (
      <>
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
          onAddPage={(name, url) => addCustomPage(section.id, name, url)}
          onRemovePage={(pageId) => removeCustomPage(section.id, pageId)}
          onRemoveSection={section.id.startsWith("custom-sec-") ? () => removeCustomSection(tabKey, section.id) : undefined}
          onSortByPriority={sortByPriority}
          onMoveUp={() => reorderSection(tabKey, section.id, -1)}
          onMoveDown={() => reorderSection(tabKey, section.id, 1)}
          isFirst={idx === 0}
          isLast={idx === orderedSections.length - 1}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          hideFinished={hideFinished}
          hideDeferred={hideDeferred}
          showThumbnails={showThumbnails}
          onAnnotate={navigateToAnnotation}
          onDetail={navigateToDetail}
        />
      ))}

      {/* Add Section */}
      {addingSection ? (
        <Paper variant="outlined" sx={{ mb: 2, p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Add New Section</Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Icon</InputLabel>
              <Select value={newSectionIcon} label="Icon" onChange={(e) => setNewSectionIcon(e.target.value)}>
                {Object.keys(ICON_MAP).map((key) => (
                  <MenuItem key={key} value={key}>{key}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder="Section name..."
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newSectionName.trim()) {
                  addCustomSection(tabKey, newSectionName.trim(), newSectionIcon);
                  setNewSectionName(""); setNewSectionIcon("Bolt"); setAddingSection(false);
                }
                if (e.key === "Escape") { setAddingSection(false); setNewSectionName(""); }
              }}
              autoFocus
              sx={{ flex: 1, minWidth: 200 }}
            />
            <Button
              variant="contained"
              size="small"
              disabled={!newSectionName.trim()}
              onClick={() => {
                addCustomSection(tabKey, newSectionName.trim(), newSectionIcon);
                setNewSectionName(""); setNewSectionIcon("Bolt"); setAddingSection(false);
              }}
            >
              Add
            </Button>
            <Button size="small" onClick={() => { setAddingSection(false); setNewSectionName(""); }}>
              Cancel
            </Button>
          </Box>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <Chip
            icon={<AddIcon sx={{ fontSize: 14 }} />}
            label="Add Section"
            variant="outlined"
            onClick={() => setAddingSection(true)}
            sx={{ cursor: "pointer", borderStyle: "dashed" }}
          />
        </Box>
      )}
      </>
      )}

      {/* Footer */}
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 4, mb: 2 }}>
        Ascend Labs Website Review Tracker
      </Typography>
      </>
      )}
      </Box>{/* end inert wrapper */}

      {/* Load-error blocking dialog — editing is gated behind this until the user reloads */}
      <Dialog
        open={!!loadError && !viewingMirror}
        disableEscapeKeyDown
        maxWidth="sm"
        fullWidth
        aria-labelledby="load-error-title"
        aria-describedby="load-error-description"
      >
        <DialogTitle id="load-error-title" sx={{ fontWeight: 700, color: "error.dark" }}>
          Could not load review data
        </DialogTitle>
        <DialogContent id="load-error-description">
          <Alert severity="error" sx={{ mb: 2 }}>
            Editing is disabled to protect your existing data from being overwritten.
          </Alert>
          <DialogContentText sx={{ mb: 1, color: "text.primary" }}>
            {loadError?.message}
          </DialogContentText>
          {loadError?.detail && (
            <DialogContentText sx={{ fontSize: 13, color: "text.primary", opacity: 0.8 }}>
              {loadError.detail}
            </DialogContentText>
          )}
          {loadError?.hasMirror ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              A local backup from your last successful save exists. You can view it in
              read-only mode while the server is unreachable.
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mt: 2 }}>
              No local backup is available on this device. Reload the page to retry — if
              the problem persists, check the server status or contact your admin before
              making any edits.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          {loadError?.hasMirror && (
            <Button onClick={loadFromMirror}>
              View local backup (read-only)
            </Button>
          )}
          <Button onClick={() => window.location.reload()} variant="contained" autoFocus>
            Reload page
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save-blocked dialog — covers all unrecoverable save failures (409 data-loss guard,
          413 payload too large, 400 invalid body). Auto-save is paused via the saveBlockError
          gate in the auto-save effect until the user reloads. */}
      <Dialog
        open={!!saveBlockError && !loadError}
        disableEscapeKeyDown
        maxWidth="sm"
        fullWidth
        aria-labelledby="save-block-title"
        aria-describedby="save-block-description"
      >
        <DialogTitle id="save-block-title" sx={{ fontWeight: 700, color: "error.dark" }}>
          {saveBlockError?.kind === "payload_too_large"
            ? "Save blocked — data too large"
            : saveBlockError?.kind === "invalid_body"
            ? "Save blocked — invalid request"
            : "Save blocked — possible data loss detected"}
        </DialogTitle>
        <DialogContent id="save-block-description">
          <Alert severity="error" sx={{ mb: 2 }}>
            {saveBlockError?.kind === "payload_too_large"
              ? "Your review data exceeds the server's size limit. Auto-save is paused so you don't lose work."
              : saveBlockError?.kind === "invalid_body"
              ? "The server rejected the request as invalid. This usually means a client bug. Auto-save is paused."
              : "The server refused to save because the new data is dramatically smaller than what's already stored. Auto-save is paused."}
          </Alert>
          {saveBlockError?.kind === "data_loss" || !saveBlockError?.kind ? (
            <>
              <DialogContentText sx={{ mb: 1, color: "text.primary" }}>
                {saveBlockError?.existingScore != null && saveBlockError?.newScore != null && (
                  <>Existing data score: <strong>{saveBlockError.existingScore}</strong> · New data score: <strong>{saveBlockError.newScore}</strong></>
                )}
              </DialogContentText>
              <DialogContentText sx={{ fontSize: 13, color: "text.primary", opacity: 0.8 }}>
                Reload the page to pull the latest saved data from the server. If that looks right, you can resume editing. If something looks wrong, use "Undo Last Save" or "Restore" from the toolbar.
              </DialogContentText>
            </>
          ) : (
            <DialogContentText sx={{ fontSize: 13, color: "text.primary", opacity: 0.8 }}>
              {saveBlockError?.message} Use "Backup" to download your current state, then reload the page and contact your admin.
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => window.location.reload()} variant="contained" autoFocus>
            Reload page
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
