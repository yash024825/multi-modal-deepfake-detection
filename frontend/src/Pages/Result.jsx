import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const CYAN   = "#00D4FF";
const BLUE   = "#1565C0";
const BG     = "#050D1A";
const CARD   = "#0C1929";
const BORDER = "#1A2840";
const WHITE  = "#FFFFFF";
const MUTED  = "#8899AA";
const RED    = "#FF3B3B";
const GREEN  = "#00C851";

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const file   = location.state?.file;
  const result = location.state?.result || "";

  const currentUser   = localStorage.getItem("currentUser");
  const profileLetter = currentUser ? currentUser.charAt(0).toUpperCase() : "T";

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  // Parse "fake 84.8" or "real 94.3"
  const parts      = result.trim().toLowerCase().split(" ");
  const label      = parts[0];
  const confidence = parts[1] ? parseFloat(parts[1]) : null;
  const isFake     = label === "fake";
  const isError    = label === "error" || result.toLowerCase().includes("error");

  // Modality from extension
  const getModality = () => {
    if (!file) return "file";
    const ext = file.name.split(".").pop().toLowerCase();
    if (["wav","mp3","flac","ogg","m4a"].includes(ext)) return "audio";
    if (["mp4","avi","mov","mkv","webm"].includes(ext)) return "video";
    return "image";
  };
  const modality = getModality();
  const modalityIcon = { image:"🖼️", video:"🎬", audio:"🎵" };

  const getDescription = () => {
    if (!file) return "";
    if (modality === "audio")
      return isFake
        ? "AI detected synthetic speech patterns inconsistent with natural human voice."
        : "No synthetic audio patterns detected. The audio appears authentic.";
    if (modality === "video")
      return isFake
        ? "AI detected visual inconsistencies across video frames suggesting face manipulation."
        : "No visual manipulation detected across video frames. The video appears authentic.";
    return isFake
      ? "AI detected facial inconsistencies suggesting digital manipulation."
      : "No facial manipulation detected. The image appears authentic.";
  };

  // Analysis breakdown items shown in the detail panel
  const analysisItems = {
    audio: [
      { label:"Feature Extraction", value:"MFCC Spectrogram (40 coefficients)" },
      { label:"Model",              value:"AudioCNN — 3 conv layers" },
      { label:"Dataset",            value:"FoR dataset · 13,956 clips" },
      { label:"Test F1",            value:"86.4%" },
    ],
    video: [
      { label:"Feature Extraction", value:"Haar cascade face detection" },
      { label:"Model",              value:"ResNet18 — frame aggregation" },
      { label:"Dataset",            value:"FaceForensics++ · 2,000 videos" },
      { label:"Test F1",            value:"96.2%" },
    ],
    image: [
      { label:"Feature Extraction", value:"Haar cascade face crop · 224×224" },
      { label:"Model",              value:"ResNet18 — partial fine-tuning" },
      { label:"Dataset",            value:"FaceForensics++ · 40,103 frames" },
      { label:"Test F1",            value:"83.4%" },
    ],
  };

  return (
    <div style={s.page}>

      {/* ── NAVBAR ────────────────────────────────────────────────── */}
      <nav style={s.nav}>
        <div style={s.navBrand}>
          <span style={s.navDot}></span>
          <span style={s.navTitle}>DeepFake<span style={s.navAI}> AI</span></span>
        </div>
        <div style={s.navLinks}>
          <span style={s.navLink} onClick={() => navigate("/")}>Home</span>
          <span style={s.navLink} onClick={() => navigate("/upload")}>Upload</span>
        </div>
        <div style={s.navActions}>
          <button style={s.loginBtn} onClick={handleLogout}>Logout</button>
          <div style={s.avatar} onClick={() => navigate("/profile")}>{profileLetter}</div>
        </div>
      </nav>

      {/* ── BODY ──────────────────────────────────────────────────── */}
      <div style={s.body}>

        {/* ── NO FILE ─────────────────────────────────────────────── */}
        {!file && (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>📂</div>
            <h2 style={s.emptyTitle}>No file detected</h2>
            <p style={s.emptyDesc}>Session may have expired or no file was uploaded.</p>
            <button style={s.ctaBtn} onClick={() => navigate("/upload")}>Go to Upload →</button>
          </div>
        )}

        {/* ── ERROR ───────────────────────────────────────────────── */}
        {file && isError && (
          <div style={s.emptyState}>
            <div style={s.emptyIcon}>⚠️</div>
            <h2 style={s.emptyTitle}>Detection Failed</h2>
            <p style={s.emptyDesc}>Something went wrong while processing <strong style={{color:WHITE}}>{file.name}</strong>. Please try again.</p>
            <button style={s.ctaBtn} onClick={() => navigate("/upload")}>Try Again →</button>
          </div>
        )}

        {/* ── RESULT ──────────────────────────────────────────────── */}
        {file && !isError && (
          <div style={s.resultLayout}>

            {/* LEFT — verdict panel */}
            <div style={s.verdictPanel}>

              {/* File info */}
              <div style={s.fileInfo}>
                <span style={s.fileModalityBadge(modality)}>
                  {modalityIcon[modality]}  {modality.toUpperCase()}
                </span>
                <div style={s.fileName}>{file.name}</div>
                <div style={s.fileMeta}>{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
              </div>

              {/* Verdict hero */}
              <div style={s.verdictHero(isFake)}>
                <div style={s.verdictGlow(isFake)}></div>
                <div style={s.verdictIcon}>{isFake ? "⚠" : "✓"}</div>
                <div style={s.verdictLabel(isFake)}>
                  {isFake ? "DEEPFAKE DETECTED" : "AUTHENTIC MEDIA"}
                </div>
                <div style={s.verdictSub}>{getDescription()}</div>
              </div>

              {/* Confidence meter */}
              {confidence !== null && (
                <div style={s.meterCard}>
                  <div style={s.meterHeader}>
                    <span style={s.meterLabel}>AI Confidence Score</span>
                    <span style={s.meterValue(isFake)}>{confidence}%</span>
                  </div>
                  <div style={s.meterTrack}>
                    <div style={s.meterFill(confidence, isFake)}></div>
                  </div>
                  <div style={s.meterFooter}>
                    <span style={{color: MUTED, fontSize: 12}}>0%</span>
                    <span style={{color: MUTED, fontSize: 12}}>50%</span>
                    <span style={{color: MUTED, fontSize: 12}}>100%</span>
                  </div>
                </div>
              )}

              {/* Verdict badge + action */}
              <div style={s.actions}>
                <div style={s.verdictBadge(isFake)}>
                  <span style={s.badgePulse(isFake)}></span>
                  {isFake ? "🔴  MANIPULATED" : "🟢  AUTHENTIC"}
                </div>
                <button style={s.ctaBtn} onClick={() => navigate("/upload")}>
                  Analyze Another File →
                </button>
              </div>
            </div>

            {/* RIGHT — analysis detail panel */}
            <div style={s.detailPanel}>

              {/* Eyebrow */}
              <div style={s.detailEyebrow}>ANALYSIS REPORT</div>
              <h3 style={s.detailTitle}>Detection Details</h3>

              {/* Model info */}
              <div style={s.detailCard}>
                <div style={s.detailCardTitle}>Model Pipeline</div>
                {(analysisItems[modality] || []).map(item => (
                  <div key={item.label} style={s.detailRow}>
                    <span style={s.detailKey}>{item.label}</span>
                    <span style={s.detailVal}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Signal breakdown */}
              <div style={s.detailCard}>
                <div style={s.detailCardTitle}>Signal Analysis</div>
                <div style={s.signalRow}>
                  <span style={s.signalLabel}>Manipulation Signal</span>
                  <div style={s.signalBar}>
                    <div style={s.signalFill(isFake ? confidence : 100 - (confidence || 50), isFake)}></div>
                  </div>
                  <span style={s.signalPct(isFake)}>
                    {isFake ? confidence : (100 - (confidence || 50)).toFixed(1)}%
                  </span>
                </div>
                <div style={s.signalRow}>
                  <span style={s.signalLabel}>Authenticity Signal</span>
                  <div style={s.signalBar}>
                    <div style={s.signalFill(!isFake ? confidence : 100 - (confidence || 50), false)}></div>
                  </div>
                  <span style={s.signalPct(false)}>
                    {!isFake ? confidence : (100 - (confidence || 50)).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Verdict summary */}
              <div style={s.summaryCard(isFake)}>
                <div style={s.summaryIcon}>{isFake ? "🚨" : "✅"}</div>
                <div>
                  <div style={s.summaryTitle(isFake)}>
                    {isFake ? "High Risk Content" : "Content Verified"}
                  </div>
                  <div style={s.summaryDesc}>
                    {isFake
                      ? `This ${modality} shows strong indicators of AI-generated manipulation. Confidence: ${confidence}%.`
                      : `This ${modality} passed all authenticity checks. Confidence: ${confidence}%.`}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
const s = {
  page: {
    minHeight: "100vh", background: BG,
    fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
    color: WHITE, display: "flex", flexDirection: "column",
  },

  /* NAV */
  nav: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 60px", borderBottom:`1px solid ${BORDER}`, background:"rgba(5,13,26,0.95)", backdropFilter:"blur(12px)", position:"sticky", top:0, zIndex:100 },
  navBrand:  { display:"flex", alignItems:"center", gap:10 },
  navDot:    { width:10, height:10, borderRadius:"50%", background:CYAN, boxShadow:`0 0 8px ${CYAN}`, display:"inline-block" },
  navTitle:  { fontSize:20, fontWeight:800, color:WHITE, letterSpacing:-0.5 },
  navAI:     { color:CYAN },
  navLinks:  { display:"flex", gap:36 },
  navLink:   { color:MUTED, fontSize:14, fontWeight:500, cursor:"pointer" },
  navActions:{ display:"flex", alignItems:"center", gap:14 },
  loginBtn:  { padding:"8px 20px", borderRadius:8, border:`1px solid ${BORDER}`, background:"transparent", color:WHITE, fontSize:14, fontWeight:600, cursor:"pointer" },
  avatar:    { width:36, height:36, borderRadius:"50%", background:BLUE, color:WHITE, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, cursor:"pointer", fontSize:15 },

  /* BODY */
  body: { flex:1, padding:"60px", maxWidth:1280, margin:"0 auto", width:"100%", boxSizing:"border-box" },

  /* EMPTY / ERROR STATE */
  emptyState: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh", gap:16, textAlign:"center" },
  emptyIcon:  { fontSize:56 },
  emptyTitle: { fontSize:28, fontWeight:800, color:WHITE, margin:0 },
  emptyDesc:  { fontSize:15, color:MUTED, maxWidth:400, lineHeight:1.6, margin:0 },

  /* RESULT LAYOUT */
  resultLayout: { display:"flex", gap:32, alignItems:"flex-start", flexWrap:"wrap" },

  /* LEFT — VERDICT */
  verdictPanel: { flex:"0 0 420px", display:"flex", flexDirection:"column", gap:20 },

  fileInfo: { display:"flex", flexDirection:"column", gap:6 },
  fileModalityBadge: (mod) => ({
    display:"inline-flex", alignItems:"center", gap:6,
    padding:"4px 12px", borderRadius:999, width:"fit-content",
    fontSize:11, fontWeight:700, letterSpacing:1,
    background: mod==="audio" ? `${CYAN}11` : mod==="video" ? `${BLUE}22` : "#7c3aed22",
    border: `1px solid ${mod==="audio" ? CYAN : mod==="video" ? BLUE : "#7c3aed"}44`,
    color: mod==="audio" ? CYAN : mod==="video" ? "#60a5fa" : "#c084fc",
  }),
  fileName: { fontSize:14, fontWeight:700, color:WHITE, wordBreak:"break-all", lineHeight:1.4 },
  fileMeta: { fontSize:12, color:MUTED },

  verdictHero: (isFake) => ({
    background: CARD, border:`1px solid ${isFake ? RED : GREEN}44`,
    borderRadius:16, padding:"32px 28px", textAlign:"center",
    position:"relative", overflow:"hidden",
    boxShadow: isFake ? `0 0 40px ${RED}18` : `0 0 40px ${GREEN}18`,
  }),
  verdictGlow: (isFake) => ({
    position:"absolute", top:-60, left:"50%", transform:"translateX(-50%)",
    width:200, height:200, borderRadius:"50%",
    background: isFake ? `${RED}18` : `${GREEN}18`,
    filter:"blur(40px)", pointerEvents:"none",
  }),
  verdictIcon: { fontSize:48, marginBottom:12, position:"relative", zIndex:1 },
  verdictLabel: (isFake) => ({
    fontSize:22, fontWeight:900, letterSpacing:1,
    color: isFake ? RED : GREEN,
    marginBottom:12, position:"relative", zIndex:1,
  }),
  verdictSub: { fontSize:14, color:MUTED, lineHeight:1.6, position:"relative", zIndex:1 },

  meterCard: { background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:"20px 22px" },
  meterHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 },
  meterLabel:  { fontSize:13, color:MUTED, fontWeight:600 },
  meterValue:  (isFake) => ({ fontSize:26, fontWeight:900, color: isFake ? RED : GREEN }),
  meterTrack:  { width:"100%", height:10, background:BORDER, borderRadius:999, overflow:"hidden", marginBottom:6 },
  meterFill:   (conf, isFake) => ({
    height:"100%", width:`${conf}%`,
    background: isFake
      ? `linear-gradient(90deg, #f87171, ${RED})`
      : `linear-gradient(90deg, #4ade80, ${GREEN})`,
    borderRadius:999, transition:"width 0.8s ease",
  }),
  meterFooter: { display:"flex", justifyContent:"space-between" },

  actions: { display:"flex", flexDirection:"column", gap:12 },
  verdictBadge: (isFake) => ({
    display:"flex", alignItems:"center", gap:10,
    padding:"12px 20px", borderRadius:10,
    background: isFake ? `${RED}18` : `${GREEN}18`,
    border: `1px solid ${isFake ? RED : GREEN}44`,
    fontSize:14, fontWeight:800, letterSpacing:1,
    color: isFake ? RED : GREEN,
  }),
  badgePulse: (isFake) => ({
    width:10, height:10, borderRadius:"50%",
    background: isFake ? RED : GREEN,
    boxShadow: `0 0 8px ${isFake ? RED : GREEN}`,
    display:"inline-block", flexShrink:0,
  }),
  ctaBtn: {
    padding:"13px 24px", borderRadius:10,
    background:`linear-gradient(135deg, ${CYAN}, ${BLUE})`,
    border:"none", color:WHITE, fontSize:15, fontWeight:700,
    cursor:"pointer", boxShadow:`0 0 20px ${CYAN}33`,
    textAlign:"center",
  },

  /* RIGHT — DETAIL PANEL */
  detailPanel: { flex:1, minWidth:300, display:"flex", flexDirection:"column", gap:20 },
  detailEyebrow: { fontSize:11, fontWeight:700, letterSpacing:3, color:CYAN },
  detailTitle:   { fontSize:24, fontWeight:900, letterSpacing:-0.5, color:WHITE, margin:0 },

  detailCard:      { background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:"20px 22px", display:"flex", flexDirection:"column", gap:0 },
  detailCardTitle: { fontSize:11, fontWeight:700, color:CYAN, letterSpacing:2, textTransform:"uppercase", marginBottom:14 },
  detailRow:    { display:"grid", gridTemplateColumns:"160px 1fr", gap:12, padding:"10px 0", borderBottom:`1px solid ${BORDER}`, fontSize:13 },
  detailKey:    { color:MUTED, fontWeight:600 },
  detailVal:    { color:WHITE },

  signalRow:   { display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:`1px solid ${BORDER}` },
  signalLabel: { fontSize:12, color:MUTED, width:140, flexShrink:0 },
  signalBar:   { flex:1, height:8, background:BORDER, borderRadius:999, overflow:"hidden" },
  signalFill:  (pct, isFake) => ({
    height:"100%", width:`${pct}%`,
    background: isFake
      ? `linear-gradient(90deg,#f87171,${RED})`
      : `linear-gradient(90deg,#4ade80,${GREEN})`,
    borderRadius:999,
  }),
  signalPct: (isFake) => ({ fontSize:13, fontWeight:700, color: isFake ? RED : GREEN, width:40, textAlign:"right", flexShrink:0 }),

  summaryCard: (isFake) => ({
    display:"flex", alignItems:"flex-start", gap:16,
    background: isFake ? `${RED}0A` : `${GREEN}0A`,
    border:`1px solid ${isFake ? RED : GREEN}33`,
    borderRadius:14, padding:"20px 22px",
  }),
  summaryIcon:  { fontSize:28, flexShrink:0 },
  summaryTitle: (isFake) => ({ fontSize:15, fontWeight:700, color: isFake ? RED : GREEN, marginBottom:6 }),
  summaryDesc:  { fontSize:13, color:MUTED, lineHeight:1.6 },
};

export default Result;