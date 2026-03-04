import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Chip,
  IconButton,
  Button,
  Popover,
  Collapse,
  InputAdornment,
  Divider,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReplayIcon from "@mui/icons-material/Replay";
import SendIcon from "@mui/icons-material/Send";
import ImageIcon from "@mui/icons-material/Image";

// ─── helpers ───────────────────────────────────────────────
function getAllPages(siteSections, outreachSections, customSections, sectionMeta) {
  const collect = (sections, customList) => {
    const base = [...sections, ...(customList || [])];
    return base.map((s) => {
      const cp = sectionMeta[s.id]?.customPages || [];
      const pages = s.subgroups
        ? s.subgroups.flatMap((sg) => sg.pages)
        : [...(s.pages || []), ...cp];
      return { id: s.id, group: s.group, pages };
    });
  };
  return [
    ...collect(siteSections, customSections.site),
    ...collect(outreachSections, customSections.outreach),
  ];
}

function getAnnotationCounts(screenshots) {
  let open = 0, resolved = 0;
  (screenshots || []).forEach((s) =>
    (s.pins || []).forEach((p) => (p.status === "resolved" ? resolved++ : open++))
  );
  return { open, resolved };
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function fmtDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} at ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

// ─── Pin Marker ────────────────────────────────────────────
function PinMarker({ pin, index, isSelected, onClick }) {
  const isOpen = pin.status === "open";
  return (
    <Box
      onClick={(e) => { e.stopPropagation(); onClick(pin); }}
      sx={{
        position: "absolute",
        left: `${pin.x}%`,
        top: `${pin.y}%`,
        transform: "translate(-50%, -50%)",
        width: 28, height: 28, borderRadius: "50%",
        bgcolor: isOpen ? "#D32F2F" : "#9E9E9E",
        color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, cursor: "pointer",
        opacity: isOpen ? 1 : 0.6,
        boxShadow: isSelected ? "0 0 0 3px #3498DC" : "0 2px 4px rgba(0,0,0,0.3)",
        transition: "all 0.15s",
        zIndex: isSelected ? 10 : 5,
        "&:hover": { transform: "translate(-50%, -50%) scale(1.2)", zIndex: 10 },
      }}
    >
      {index + 1}
    </Box>
  );
}

// ─── New Pin Popover ───────────────────────────────────────
function NewPinPopover({ open, anchorPos, containerRef, onSubmit, onClose }) {
  const [author, setAuthor] = useState(() => localStorage.getItem("annotation-author") || "");
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim() || !author.trim()) return;
    localStorage.setItem("annotation-author", author.trim());
    onSubmit(author.trim(), text.trim());
    setText("");
  };

  if (!open) return null;

  return (
    <Paper
      elevation={8}
      sx={{
        position: "absolute",
        left: `${anchorPos.x}%`,
        top: `${anchorPos.y}%`,
        transform: "translate(-50%, 16px)",
        zIndex: 20, p: 2, width: 300,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Add Annotation</Typography>
      <TextField
        size="small" fullWidth placeholder="Your name"
        value={author} onChange={(e) => setAuthor(e.target.value)}
        sx={{ mb: 1 }}
      />
      <TextField
        size="small" fullWidth multiline minRows={2} maxRows={4}
        placeholder="Describe the issue..."
        value={text} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
        autoFocus
      />
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5, mt: 1 }}>
        <Button size="small" onClick={onClose}>Cancel</Button>
        <Button size="small" variant="contained" disabled={!text.trim() || !author.trim()} onClick={handleSubmit}>
          Add Pin
        </Button>
      </Box>
    </Paper>
  );
}

// ─── Pin Detail Popover ────────────────────────────────────
function PinDetailPopover({ pin, index, anchorPos, onResolve, onReopen, onReply, onClose }) {
  const [replyText, setReplyText] = useState("");
  const [replyAuthor, setReplyAuthor] = useState(() => localStorage.getItem("annotation-author") || "");
  const isOpen = pin.status === "open";

  const handleReply = () => {
    if (!replyText.trim() || !replyAuthor.trim()) return;
    localStorage.setItem("annotation-author", replyAuthor.trim());
    onReply(replyAuthor.trim(), replyText.trim());
    setReplyText("");
  };

  return (
    <Paper
      elevation={8}
      sx={{
        position: "absolute",
        left: `${pin.x}%`,
        top: `${pin.y}%`,
        transform: "translate(-50%, 20px)",
        zIndex: 20, width: 320, maxHeight: 420, overflow: "auto",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5, pb: 1 }}>
        <Chip
          label={isOpen ? "Open" : "Resolved"}
          size="small"
          sx={{
            bgcolor: isOpen ? "#FFEBEE" : "#F5F5F5",
            color: isOpen ? "#D32F2F" : "#9E9E9E",
            fontWeight: 600, fontSize: 11,
            border: `1px solid ${isOpen ? "#D32F2F" : "#9E9E9E"}`,
          }}
        />
        <Typography variant="subtitle2">Pin #{index + 1}</Typography>
        <Box sx={{ flex: 1 }} />
        <IconButton size="small" onClick={onClose} sx={{ p: 0.25 }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      <Divider />

      {/* Original comment */}
      <Box sx={{ p: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{pin.author}</Typography>
          <Typography variant="caption" color="text.secondary">{fmtDate(pin.createdAt)}</Typography>
        </Box>
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{pin.text}</Typography>
      </Box>

      {/* Replies */}
      {pin.replies?.length > 0 && (
        <>
          <Divider />
          <Box sx={{ p: 1.5 }}>
            {pin.replies.map((r, i) => (
              <Box key={i} sx={{ mb: i < pin.replies.length - 1 ? 1 : 0 }}>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 0.25 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{r.author}</Typography>
                  <Typography variant="caption" color="text.secondary">{fmtDateTime(r.timestamp)}</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{r.text}</Typography>
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* Resolution info */}
      {pin.status === "resolved" && pin.resolvedBy && (
        <>
          <Divider />
          <Box sx={{ px: 1.5, py: 1, bgcolor: "#F5F5F5" }}>
            <Typography variant="caption" color="text.secondary">
              Resolved by <b>{pin.resolvedBy}</b> &middot; {fmtDateTime(pin.resolvedAt)}
            </Typography>
          </Box>
        </>
      )}

      <Divider />

      {/* Reply input */}
      <Box sx={{ p: 1.5 }}>
        <TextField
          size="small" fullWidth placeholder="Your name"
          value={replyAuthor} onChange={(e) => setReplyAuthor(e.target.value)}
          sx={{ mb: 0.5, "& .MuiInputBase-input": { fontSize: 13 } }}
        />
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <TextField
            size="small" fullWidth placeholder="Reply..."
            value={replyText} onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
            sx={{ "& .MuiInputBase-input": { fontSize: 13 } }}
          />
          <IconButton size="small" onClick={handleReply} disabled={!replyText.trim() || !replyAuthor.trim()}>
            <SendIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>

      <Divider />

      {/* Resolve / Reopen */}
      <Box sx={{ p: 1, display: "flex", justifyContent: "center" }}>
        {isOpen ? (
          <Button
            size="small"
            startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
            onClick={() => onResolve(replyAuthor || localStorage.getItem("annotation-author") || "Unknown")}
            sx={{ color: "#2E7D32", fontSize: 12 }}
          >
            Mark Resolved
          </Button>
        ) : (
          <Button
            size="small"
            startIcon={<ReplayIcon sx={{ fontSize: 16 }} />}
            onClick={onReopen}
            sx={{ color: "#D32F2F", fontSize: 12 }}
          >
            Reopen
          </Button>
        )}
      </Box>
    </Paper>
  );
}

// ─── Upload Zone ───────────────────────────────────────────
function UploadZone({ pageId, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const resp = await fetch(
        `/api/screenshot?pageId=${encodeURIComponent(pageId)}&filename=${encodeURIComponent(file.name)}`,
        { method: "POST", body: file, headers: { "content-type": file.type } }
      );
      if (!resp.ok) throw new Error("Upload failed");
      const data = await resp.json();
      onUploaded(data);
    } catch (err) {
      console.error("Screenshot upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
      onClick={() => inputRef.current?.click()}
      sx={{
        border: `2px dashed ${dragOver ? "#3498DC" : "#E0E0E0"}`,
        borderRadius: 2,
        p: 6,
        textAlign: "center",
        cursor: "pointer",
        bgcolor: dragOver ? "#E3F2FD" : "#FAFAFA",
        transition: "all 0.15s",
        "&:hover": { borderColor: "#3498DC", bgcolor: "#F0F8FF" },
      }}
    >
      <ImageIcon sx={{ fontSize: 48, color: "#BDBDBD", mb: 1 }} />
      <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
        {uploading ? "Uploading..." : "Upload a full-page screenshot"}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Drag and drop or click to browse
      </Typography>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: "none" }}
        onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ""; }}
      />
    </Box>
  );
}

// ─── Screenshot Viewer ─────────────────────────────────────
function ScreenshotViewer({ screenshots, selectedVersion, onSelectVersion, onCreatePin, onUpdatePin, onUpload, pageId }) {
  const [newPin, setNewPin] = useState(null); // { x, y }
  const [selectedPinId, setSelectedPinId] = useState(null);
  const [pinFilter, setPinFilter] = useState("all");
  const imgRef = useRef(null);

  const ss = screenshots[selectedVersion];
  if (!ss) return null;

  const allPins = ss.pins || [];
  const openCount = allPins.filter((p) => p.status === "open").length;
  const resolvedCount = allPins.filter((p) => p.status === "resolved").length;
  const visiblePins = allPins.filter((p) => {
    if (pinFilter === "open") return p.status === "open";
    if (pinFilter === "resolved") return p.status === "resolved";
    return true;
  });

  const handleImageClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSelectedPinId(null);
    setNewPin({ x, y });
  };

  const handleCreatePin = (author, text) => {
    const pin = {
      id: `pin-${Date.now()}`,
      x: newPin.x,
      y: newPin.y,
      status: "open",
      author,
      createdAt: new Date().toISOString(),
      text,
      replies: [],
      resolvedBy: null,
      resolvedAt: null,
    };
    const updated = { ...ss, pins: [...allPins, pin] };
    onUpdatePin(selectedVersion, updated);
    setNewPin(null);
  };

  const handleResolve = (pin, resolvedBy) => {
    const updatedPins = allPins.map((p) =>
      p.id === pin.id ? { ...p, status: "resolved", resolvedBy, resolvedAt: new Date().toISOString() } : p
    );
    onUpdatePin(selectedVersion, { ...ss, pins: updatedPins });
  };

  const handleReopen = (pin) => {
    const updatedPins = allPins.map((p) =>
      p.id === pin.id ? { ...p, status: "open", resolvedBy: null, resolvedAt: null } : p
    );
    onUpdatePin(selectedVersion, { ...ss, pins: updatedPins });
  };

  const handleReply = (pin, author, text) => {
    const updatedPins = allPins.map((p) =>
      p.id === pin.id
        ? { ...p, replies: [...(p.replies || []), { author, text, timestamp: new Date().toISOString() }] }
        : p
    );
    onUpdatePin(selectedVersion, { ...ss, pins: updatedPins });
  };

  const selectedPin = selectedPinId ? allPins.find((p) => p.id === selectedPinId) : null;
  const selectedPinIndex = selectedPin ? allPins.indexOf(selectedPin) : -1;

  return (
    <Box>
      {/* Version bar */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
        <Typography variant="body2" color="text.secondary">
          Version {screenshots.length - selectedVersion} of {screenshots.length}
        </Typography>
        <IconButton
          size="small"
          disabled={selectedVersion >= screenshots.length - 1}
          onClick={() => onSelectVersion(selectedVersion + 1)}
        >
          <ChevronLeftIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <IconButton
          size="small"
          disabled={selectedVersion <= 0}
          onClick={() => onSelectVersion(selectedVersion - 1)}
        >
          <ChevronRightIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <Typography variant="caption" color="text.secondary">
          {fmtDate(ss.uploadedAt)}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          size="small"
          startIcon={<CloudUploadIcon sx={{ fontSize: 16 }} />}
          onClick={() => onUpload()}
          sx={{ fontSize: 12 }}
        >
          Upload New Version
        </Button>
      </Box>

      {/* Filter bar */}
      <Box sx={{ display: "flex", gap: 0.5, mb: 1 }}>
        {[
          { key: "all", label: `All (${allPins.length})` },
          { key: "open", label: `Open (${openCount})`, activeColor: "#D32F2F", activeBg: "#FFEBEE" },
          { key: "resolved", label: `Resolved (${resolvedCount})`, activeColor: "#9E9E9E", activeBg: "#F5F5F5" },
        ].map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            size="small"
            variant={pinFilter === f.key ? "filled" : "outlined"}
            onClick={() => setPinFilter(f.key)}
            sx={{
              cursor: "pointer",
              fontWeight: pinFilter === f.key ? 600 : 400,
              fontSize: 11,
              ...(pinFilter === f.key && f.activeColor
                ? { bgcolor: f.activeBg, color: f.activeColor, border: `1px solid ${f.activeColor}` }
                : {}),
            }}
          />
        ))}
      </Box>

      {/* Screenshot + pins */}
      <Box
        sx={{
          maxHeight: "calc(100vh - 240px)",
          overflow: "auto",
          border: "1px solid #E0E0E0",
          borderRadius: 2,
          bgcolor: "#FAFAFA",
        }}
      >
        <Box sx={{ position: "relative", display: "inline-block", width: "100%" }}>
          <img
            ref={imgRef}
            src={ss.blobUrl}
            alt="Page screenshot"
            style={{ width: "100%", display: "block", cursor: "crosshair" }}
            loading="lazy"
            onClick={handleImageClick}
          />
          {visiblePins.map((pin, i) => (
            <PinMarker
              key={pin.id}
              pin={pin}
              index={allPins.indexOf(pin)}
              isSelected={selectedPinId === pin.id}
              onClick={(p) => { setNewPin(null); setSelectedPinId(p.id === selectedPinId ? null : p.id); }}
            />
          ))}
          {newPin && (
            <NewPinPopover
              open
              anchorPos={newPin}
              onSubmit={handleCreatePin}
              onClose={() => setNewPin(null)}
            />
          )}
          {selectedPin && (
            <PinDetailPopover
              pin={selectedPin}
              index={selectedPinIndex}
              anchorPos={{ x: selectedPin.x, y: selectedPin.y }}
              onResolve={(by) => handleResolve(selectedPin, by)}
              onReopen={() => handleReopen(selectedPin)}
              onReply={(author, text) => handleReply(selectedPin, author, text)}
              onClose={() => setSelectedPinId(null)}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ─── Annotations Panel (main export) ──────────────────────
export default function AnnotationsPanel({ pageStates, updatePageState, siteSections, outreachSections, customSections, sectionMeta, initialPageId }) {
  const [selectedPageId, setSelectedPageId] = useState(initialPageId || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [screenshots, setScreenshots] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});
  const saveTimer = useRef(null);
  const uploadInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // Navigate to page when coming from PageCard annotation chip
  useEffect(() => {
    if (initialPageId) setSelectedPageId(initialPageId);
  }, [initialPageId]);

  // Build grouped page list
  const sections = getAllPages(siteSections, outreachSections, customSections, sectionMeta);

  // Load annotations when page selected
  useEffect(() => {
    if (!selectedPageId) { setScreenshots([]); return; }
    setLoading(true);
    fetch(`/api/annotations?pageId=${encodeURIComponent(selectedPageId)}`)
      .then((r) => r.json())
      .then((data) => { setScreenshots(data.screenshots || []); setSelectedVersion(0); })
      .catch((err) => console.error("Failed to load annotations:", err))
      .finally(() => setLoading(false));
  }, [selectedPageId]);

  // Auto-save annotations (debounced)
  const saveAnnotations = useCallback((ss) => {
    if (!selectedPageId) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch(`/api/annotations?pageId=${encodeURIComponent(selectedPageId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenshots: ss }),
      }).catch((err) => console.error("Failed to save annotations:", err));

      // Update summary in main pageStates
      const counts = getAnnotationCounts(ss);
      const prev = pageStates[selectedPageId] || {};
      const prevCounts = prev.annotationSummary || {};
      if (prevCounts.open !== counts.open || prevCounts.resolved !== counts.resolved) {
        updatePageState(selectedPageId, { ...prev, annotationSummary: counts });
      }
    }, 1500);
  }, [selectedPageId, pageStates, updatePageState]);

  const handleUpdateScreenshot = (versionIdx, updatedSS) => {
    const next = [...screenshots];
    next[versionIdx] = updatedSS;
    setScreenshots(next);
    saveAnnotations(next);
  };

  const handleUploaded = (data) => {
    const newSS = {
      id: `ss-${Date.now()}`,
      blobUrl: data.url,
      uploadedAt: data.uploadedAt,
      pins: [],
    };
    const next = [newSS, ...screenshots];
    setScreenshots(next);
    setSelectedVersion(0);
    saveAnnotations(next);
  };

  const handleUploadNew = () => uploadInputRef.current?.click();

  const handleUploadFile = async (file) => {
    if (!file || !file.type.startsWith("image/") || !selectedPageId) return;
    setUploading(true);
    try {
      const resp = await fetch(
        `/api/screenshot?pageId=${encodeURIComponent(selectedPageId)}&filename=${encodeURIComponent(file.name)}`,
        { method: "POST", body: file, headers: { "content-type": file.type } }
      );
      if (!resp.ok) throw new Error("Upload failed");
      const data = await resp.json();
      handleUploaded(data);
    } catch (err) {
      console.error("Screenshot upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const toggleSection = (sId) => setCollapsedSections((p) => ({ ...p, [sId]: !p[sId] }));

  // Find selected page name
  const selectedPage = sections.flatMap((s) => s.pages).find((p) => p.id === selectedPageId);

  return (
    <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
      {/* ── Sidebar ── */}
      <Paper
        variant="outlined"
        sx={{
          width: 280, minWidth: 280, maxHeight: "calc(100vh - 200px)",
          overflow: "auto", flexShrink: 0,
        }}
      >
        <Box sx={{ p: 1.5, position: "sticky", top: 0, bgcolor: "background.paper", zIndex: 2, borderBottom: "1px solid #E0E0E0" }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search pages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
            sx={{ "& .MuiInputBase-input": { fontSize: 13 } }}
          />
        </Box>

        {sections.map((section) => {
          const filteredPages = section.pages.filter((p) =>
            !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
          if (filteredPages.length === 0) return null;
          const collapsed = collapsedSections[section.id];

          return (
            <Box key={section.id}>
              <Box
                onClick={() => toggleSection(section.id)}
                sx={{
                  display: "flex", alignItems: "center", gap: 0.5,
                  px: 1.5, py: 0.75, cursor: "pointer",
                  bgcolor: "#FAFAFA", borderBottom: "1px solid #F0F0F0",
                  "&:hover": { bgcolor: "#F0F0F0" },
                }}
              >
                {collapsed ? <ExpandMoreIcon sx={{ fontSize: 16 }} /> : <ExpandLessIcon sx={{ fontSize: 16 }} />}
                <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, flex: 1 }}>
                  {section.group}
                </Typography>
              </Box>

              {!collapsed && filteredPages.map((page) => {
                const counts = pageStates[page.id]?.annotationSummary || getAnnotationCounts([]);
                const isSelected = selectedPageId === page.id;

                return (
                  <Box
                    key={page.id}
                    onClick={() => setSelectedPageId(page.id)}
                    sx={{
                      display: "flex", alignItems: "center", gap: 0.5,
                      px: 1.5, py: 0.75, cursor: "pointer",
                      bgcolor: isSelected ? "#E3F2FD" : "transparent",
                      borderLeft: isSelected ? "3px solid #3498DC" : "3px solid transparent",
                      "&:hover": { bgcolor: isSelected ? "#E3F2FD" : "#F5F5F5" },
                    }}
                  >
                    <Typography variant="body2" sx={{ fontSize: 13, flex: 1, fontWeight: isSelected ? 600 : 400 }} noWrap>
                      {page.name}
                    </Typography>
                    {counts.open > 0 && (
                      <Chip label={counts.open} size="small" sx={{ bgcolor: "#FFEBEE", color: "#D32F2F", fontSize: 10, height: 18, fontWeight: 600, minWidth: 24 }} />
                    )}
                    {counts.resolved > 0 && (
                      <Chip label={counts.resolved} size="small" sx={{ bgcolor: "#F5F5F5", color: "#9E9E9E", fontSize: 10, height: 18, minWidth: 24 }} />
                    )}
                  </Box>
                );
              })}
            </Box>
          );
        })}
      </Paper>

      {/* ── Main viewer ── */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {!selectedPageId ? (
          <Paper variant="outlined" sx={{ p: 6, textAlign: "center" }}>
            <ImageIcon sx={{ fontSize: 48, color: "#BDBDBD", mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              Select a page from the sidebar to view or upload annotations
            </Typography>
          </Paper>
        ) : loading ? (
          <Paper variant="outlined" sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">Loading annotations...</Typography>
          </Paper>
        ) : (
          <>
            {/* Page header */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 16 }}>
                {selectedPage?.name || selectedPageId}
              </Typography>
              {selectedPage?.url && (
                <Chip
                  label={selectedPage.url.replace(/^https?:\/\//, "")}
                  size="small"
                  component="a"
                  href={selectedPage.url}
                  target="_blank"
                  clickable
                  sx={{ fontSize: 11, maxWidth: 300 }}
                />
              )}
            </Box>

            {screenshots.length === 0 ? (
              <UploadZone pageId={selectedPageId} onUploaded={handleUploaded} />
            ) : (
              <ScreenshotViewer
                screenshots={screenshots}
                selectedVersion={selectedVersion}
                onSelectVersion={setSelectedVersion}
                onCreatePin={() => {}}
                onUpdatePin={handleUpdateScreenshot}
                onUpload={handleUploadNew}
                pageId={selectedPageId}
              />
            )}

            {/* Hidden upload input for "Upload New Version" */}
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ display: "none" }}
              onChange={(e) => { handleUploadFile(e.target.files[0]); e.target.value = ""; }}
            />
          </>
        )}
      </Box>
    </Box>
  );
}
