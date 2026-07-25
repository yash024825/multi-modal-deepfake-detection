import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signOutUser } from "../firebase";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ACCEPTED_TYPES = {
  image: ["jpg", "jpeg", "png", "webp", "bmp"],
  video: ["mp4", "avi", "mov", "mkv", "webm"],
  audio: ["wav", "mp3", "flac", "ogg", "m4a"],
};
const ALL_ACCEPTED = Object.values(ACCEPTED_TYPES).flat();

const CYAN   = "#00D4FF";
const BLUE   = "#1565C0";
const BG     = "#050D1A";
const CARD   = "#0C1929";
const BORDER = "#1A2840";
const WHITE  = "#FFFFFF";
const MUTED  = "#8899AA";
const RED    = "#FF3B3B";
const GREEN  = "#00C851";

const UploadMediaPage = () => {
  const [file, setFile]                   = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [validationError, setValidationError] = useState("");
  const [dragOver, setDragOver]           = useState(false);
  const navigate = useNavigate();

  const profileLetter =
    localStorage.getItem("currentUser")?.charAt(0).toUpperCase() || "T";

  const handleLogout = async () => { await signOutUser(); navigate("/login"); };

  const validateFile = (f) => {
    if (!f) return null;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!ALL_ACCEPTED.includes(ext))
      return `Unsupported file type (.${ext}). Accepted: JPG, PNG, MP4, AVI, MOV, WAV, MP3 and more.`;
    if (f.size > 200 * 1024 * 1024)
      return "File too large. Maximum size is 200MB.";
    return null;
  };

  const applyFile = (f) => {
    setFile(f);
    setError("");
    setValidationError(f ? (validateFile(f) || "") : "");
  };

  const getFileType = (f) => {
    if (!f) return null;
    const ext = f.name.split(".").pop().toLowerCase();
    if (ACCEPTED_TYPES.image.includes(ext)) return "image";
    if (ACCEPTED_TYPES.video.includes(ext)) return "video";
    if (ACCEPTED_TYPES.audio.includes(ext)) return "audio";
    return null;
  };

  const fileType = getFileType(file);
  const typeIcon = { image: "🖼️", video: "🎬", audio: "🎵" };
  const _typeColor = { image: "#7c3aed", video: BLUE, audio: "#0891b2" };
  const _typeBg    = { image: "#f3e8ff", video: "#dbeafe", audio: "#e0f2fe" };

  const isSubmitDisabled = loading || !!validationError || !file;
  const displayError  = validationError || error;
  const isFetchError  = !validationError && !!error;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    const vErr = validateFile(file);
    if (vErr) { setValidationError(vErr); return; }
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API_BASE_URL}/api/detect`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || "Server error");
      navigate("/result", { state: { file, result: data.result } });
    } catch (err) {
      setError(err.message || "Failed to connect to backend. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  const loadingSteps = {
    video: ["Extracting frames…", "Detecting faces…", "Running AI model…", "Aggregating results…"],
    audio: ["Loading audio…", "Extracting MFCC features…", "Running AI model…"],
    image: ["Detecting face…", "Running AI model…"],
  };

  return (
    <div style={s.page}>

      {/* ── NAVBAR ──────────────────────────────────────────────── */}
      <nav style={s.nav}>
        <div style={s.navBrand}>
          <span style={s.navDot}></span>
          <span style={s.navTitle}>DeepFake<span style={s.navAI}> AI</span></span>
        </div>
        <div style={s.navLinks}>
          <Link style={s.navLink} to="/">Home</Link>
          <Link style={s.navLink} to="/result">Result</Link>
        </div>
        <div style={s.navActions}>
          <button style={s.loginBtn} onClick={handleLogout}>Logout</button>
          <div style={s.avatar} onClick={() => navigate("/profile")}>{profileLetter}</div>
        </div>
      </nav>

      {/* ── PAGE BODY ───────────────────────────────────────────── */}
      <div style={s.body}>

        {/* Left — info panel */}
        <div style={s.infoPanel}>
          <div style={s.infoBadge}>
            <span style={s.infoBadgeDot}></span>
            Multi-Modal Detection
          </div>
          <h2 style={s.infoTitle}>Upload &amp; Analyze</h2>
          <p style={s.infoDesc}>
            Our AI examines your file across three independent modalities — visual frames,
            facial geometry, and audio waveforms — and returns a forensic-level verdict
            with a confidence score.
          </p>

          {/* Modality chips */}
          <div style={s.chips}>
            {[
              { icon:"🎬", label:"Video",  note:"ResNet18 · frame aggregation" },
              { icon:"🖼️", label:"Image",  note:"Face crop · CNN" },
              { icon:"🎵", label:"Audio",  note:"MFCC-CNN · 86.4% F1" },
            ].map(c => (
              <div key={c.label} style={s.chip}>
                <span style={s.chipIcon}>{c.icon}</span>
                <div>
                  <div style={s.chipLabel}>{c.label}</div>
                  <div style={s.chipNote}>{c.note}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Accepted formats table */}
          <div style={s.formatsBox}>
            <div style={s.formatsTitle}>Accepted Formats</div>
            {[
              ["Images", "JPG, PNG, WEBP, BMP"],
              ["Video",  "MP4, AVI, MOV, MKV, WEBM"],
              ["Audio",  "WAV, MP3, FLAC, OGG, M4A"],
            ].map(([k, v]) => (
              <div key={k} style={s.formatRow}>
                <span style={s.formatKey}>{k}</span>
                <span style={s.formatVal}>{v}</span>
              </div>
            ))}
            <div style={s.formatRow}>
              <span style={s.formatKey}>Max size</span>
              <span style={s.formatVal}>200 MB</span>
            </div>
          </div>
        </div>

        {/* Right — upload card */}
        <div style={s.uploadPanel}>

          {/* Drop zone — wide rectangle */}
          <div
            style={s.dropZone(dragOver, !!file, !!validationError)}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); applyFile(e.dataTransfer.files?.[0] || null); }}
            onClick={() => !loading && document.getElementById("fileInput").click()}
          >
            {file ? (
              <div style={s.filePreview}>
                {/* File card — styled like image 2 reference */}
                <div style={s.fileCard}>
                  <div style={s.fileCardIcon}>{typeIcon[fileType] || "📄"}</div>
                  <div style={s.fileCardInfo}>
                    <div style={s.fileCardName}>{file.name}</div>
                    <div style={s.fileCardMeta}>
                      {fileType?.toUpperCase()}  ·  {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                    <div style={s.fileCardType(fileType)}>{fileType} file</div>
                  </div>
                  <button
                    style={s.removeBtn}
                    onClick={(e) => { e.stopPropagation(); applyFile(null); }}
                  >✕</button>
                </div>
                <p style={s.changeHint}>Click anywhere to change file</p>
              </div>
            ) : (
              <div style={s.dropEmpty}>
                <div style={s.dropIconRing}>
                  <span style={s.dropIcon}>↑</span>
                </div>
                <p style={s.dropMain}>Drag and drop files, or select from below</p>
                <button
                  type="button"
                  style={s.browseBtn}
                  onClick={(e) => { e.stopPropagation(); document.getElementById("fileInput").click(); }}
                >
                  📂 Choose file
                </button>
              </div>
            )}
          </div>

          <input
            id="fileInput"
            type="file"
            accept="image/*,video/*,audio/*"
            onChange={(e) => applyFile(e.target.files?.[0] || null)}
            style={{ display: "none" }}
          />

          {/* File type badge */}
          {file && !displayError && (
            <div style={s.badge(fileType)}>
              {typeIcon[fileType]}  Detected as <strong>{fileType}</strong> — using {fileType} detection model
            </div>
          )}

          {/* Error */}
          {displayError && (
            <div style={s.errorBox}>
              <span>⚠️</span>
              <div style={s.errorContent}>
                <span style={s.errorText}>{displayError}</span>
                {isFetchError && (
                  <button style={s.dismissBtn} onClick={() => setError("")}>Dismiss &amp; Retry</button>
                )}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            style={s.submitBtn(isSubmitDisabled)}
            disabled={isSubmitDisabled}
          >
            {loading ? "⏳  Analyzing… please wait"
              : isFetchError ? "🔄  Try Again"
              : "Upload & Detect"}
          </button>

          {/* Loading panel */}
          {loading && (
            <div style={s.loadingPanel}>
              <p style={s.loadingTitle}>🔍 Analyzing your {fileType || "file"}…</p>
              <p style={s.loadingEta}>
                {fileType === "video" ? "⏱ Videos may take 15–60 seconds."
                  : fileType === "audio" ? "⏱ Audio typically takes 5–15 seconds."
                  : "⏱ Images typically take under 5 seconds."}
              </p>
              <div style={s.steps}>
                {(loadingSteps[fileType] || []).map((step, i) => (
                  <div key={i} style={s.stepRow}>
                    <span style={s.stepDot}>›</span>
                    <span style={s.stepLabel}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
/* STYLES                                                                     */
/* ══════════════════════════════════════════════════════════════════════════ */
const s = {
  page: {
    minHeight: "100vh", background: BG,
    fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
    color: WHITE, display: "flex", flexDirection: "column",
  },

  /* NAV */
  nav: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "18px 60px", borderBottom: `1px solid ${BORDER}`,
    background: "rgba(5,13,26,0.95)", backdropFilter: "blur(12px)",
    position: "sticky", top: 0, zIndex: 100,
  },
  navBrand:  { display: "flex", alignItems: "center", gap: 10 },
  navDot:    { width: 10, height: 10, borderRadius: "50%", background: CYAN, boxShadow: `0 0 8px ${CYAN}`, display: "inline-block" },
  navTitle:  { fontSize: 20, fontWeight: 800, color: WHITE, letterSpacing: -0.5 },
  navAI:     { color: CYAN },
  navLinks:  { display: "flex", gap: 36 },
  navLink:   { color: MUTED, textDecoration: "none", fontSize: 14, fontWeight: 500 },
  navActions:{ display: "flex", alignItems: "center", gap: 14 },
  loginBtn:  { padding: "8px 20px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: WHITE, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  avatar:    { width: 36, height: 36, borderRadius: "50%", background: BLUE, color: WHITE, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, cursor: "pointer", fontSize: 15 },

  /* BODY — two column */
  body: {
    flex: 1, display: "flex",
    maxWidth: 1280, margin: "0 auto", width: "100%",
    padding: "60px 60px",
    alignItems: "flex-start",
    gap: 60,
  },

  /* LEFT INFO PANEL */
  infoPanel: { flex: "0 0 340px", display: "flex", flexDirection: "column", gap: 24 },
  infoBadge: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "6px 14px", borderRadius: 999,
    border: `1px solid ${CYAN}22`, background: `${CYAN}11`,
    color: CYAN, fontSize: 12, fontWeight: 600, letterSpacing: 0.5,
    width: "fit-content",
  },
  infoBadgeDot: { width: 7, height: 7, borderRadius: "50%", background: CYAN, display: "inline-block" },
  infoTitle: { fontSize: 32, fontWeight: 900, letterSpacing: -1, color: WHITE, margin: 0 },
  infoDesc:  { fontSize: 14, color: MUTED, lineHeight: 1.7, margin: 0 },

  chips: { display: "flex", flexDirection: "column", gap: 10 },
  chip:  { display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12 },
  chipIcon:  { fontSize: 24, flexShrink: 0 },
  chipLabel: { fontSize: 14, fontWeight: 700, color: WHITE },
  chipNote:  { fontSize: 12, color: MUTED },

  formatsBox:   { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 0 },
  formatsTitle: { fontSize: 11, fontWeight: 700, color: CYAN, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 },
  formatRow:    { display: "grid", gridTemplateColumns: "70px 1fr", gap: 12, padding: "8px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 13 },
  formatKey:    { color: MUTED, fontWeight: 600 },
  formatVal:    { color: WHITE },

  /* RIGHT UPLOAD PANEL */
  uploadPanel: { flex: 1, display: "flex", flexDirection: "column", gap: 16 },

  /* DROP ZONE — wide rectangle matching image 2 reference */
  dropZone: (active, hasFile, hasErr) => ({
    border: `2px dashed ${hasErr ? RED : active ? CYAN : hasFile ? GREEN : BORDER}`,
    borderRadius: 16,
    padding: hasFile ? "24px" : "48px 32px",
    background: hasErr ? `${RED}08` : active ? `${CYAN}08` : hasFile ? `${GREEN}08` : CARD,
    cursor: "pointer",
    transition: "all 0.2s ease",
    minHeight: 160,
    display: "flex", alignItems: "center", justifyContent: "center",
  }),

  /* Empty drop state */
  dropEmpty: { display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" },
  dropIconRing: {
    width: 56, height: 56, borderRadius: "50%",
    border: `2px dashed ${BORDER}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: `${CYAN}11`,
  },
  dropIcon:  { fontSize: 22, color: CYAN },
  dropMain:  { fontSize: 15, color: MUTED, margin: 0 },
  browseBtn: {
    padding: "10px 24px", borderRadius: 8,
    border: `1.5px dashed ${CYAN}`, background: `${CYAN}11`,
    color: CYAN, fontSize: 14, fontWeight: 700, cursor: "pointer",
    letterSpacing: 0.3,
  },

  /* File preview — rectangle card like image 2 */
  filePreview: { width: "100%", display: "flex", flexDirection: "column", gap: 12 },
  fileCard: {
    display: "flex", alignItems: "center", gap: 16,
    padding: "18px 20px", borderRadius: 12,
    background: "#0A1525", border: `1px solid ${BORDER}`,
    position: "relative",
  },
  fileCardIcon: { fontSize: 36, flexShrink: 0 },
  fileCardInfo: { flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 },
  fileCardName: { fontSize: 14, fontWeight: 700, color: WHITE, wordBreak: "break-all" },
  fileCardMeta: { fontSize: 12, color: MUTED },
  fileCardType: (type) => ({
    display: "inline-block", padding: "2px 10px", borderRadius: 999,
    fontSize: 11, fontWeight: 700,
    background: type === "audio" ? "#e0f2fe22" : type === "video" ? "#dbeafe22" : "#f3e8ff22",
    color: type === "audio" ? "#38bdf8" : type === "video" ? "#60a5fa" : "#c084fc",
    width: "fit-content",
  }),
  removeBtn: {
    position: "absolute", top: 12, right: 12,
    background: `${RED}22`, border: `1px solid ${RED}44`,
    borderRadius: "50%", width: 24, height: 24,
    color: RED, fontSize: 12, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700,
  },
  changeHint: { fontSize: 12, color: MUTED, textAlign: "center", margin: 0 },

  /* Badge */
  badge: (type) => ({
    padding: "8px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600,
    background: type === "audio" ? `${CYAN}11` : type === "video" ? `${BLUE}22` : "#7c3aed22",
    color: type === "audio" ? CYAN : type === "video" ? "#60a5fa" : "#c084fc",
    border: `1px solid ${type === "audio" ? CYAN : type === "video" ? BLUE : "#7c3aed"}44`,
    display: "inline-block",
  }),

  /* Error */
  errorBox: {
    display: "flex", alignItems: "flex-start", gap: 10,
    background: `${RED}11`, border: `1px solid ${RED}44`,
    borderRadius: 10, padding: "12px 16px",
  },
  errorContent: { display: "flex", flexDirection: "column", gap: 6, flex: 1 },
  errorText:    { color: RED, fontSize: 13, fontWeight: 600, lineHeight: 1.5 },
  dismissBtn:   { alignSelf: "flex-start", background: "none", border: `1px solid ${RED}66`, borderRadius: 6, color: RED, cursor: "pointer", fontSize: 12, fontWeight: 700, padding: "4px 10px" },

  /* Submit */
  submitBtn: (disabled) => ({
    width: "100%", padding: "16px",
    background: disabled ? BORDER : `linear-gradient(135deg, ${CYAN}, ${BLUE})`,
    color: disabled ? MUTED : WHITE,
    border: "none", borderRadius: 10,
    fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 16, transition: "all 0.2s",
    boxShadow: disabled ? "none" : `0 0 24px ${CYAN}33`,
  }),

  /* Loading panel */
  loadingPanel: {
    padding: "18px 20px", background: `${CYAN}0A`,
    border: `1px solid ${CYAN}33`, borderRadius: 12,
  },
  loadingTitle: { color: CYAN, fontWeight: 700, margin: "0 0 6px", fontSize: 15 },
  loadingEta:   { color: MUTED, fontSize: 13, margin: "0 0 12px" },
  steps:        { display: "flex", flexDirection: "column", gap: 4 },
  stepRow:      { display: "flex", alignItems: "center", gap: 8 },
  stepDot:      { color: CYAN, fontSize: 16, lineHeight: 1 },
  stepLabel:    { color: MUTED, fontSize: 13 },
};

export default UploadMediaPage;