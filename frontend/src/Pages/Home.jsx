import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import projectImage from "../assets/project-image.jpg";

const Home = () => {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const currentUser = localStorage.getItem("currentUser");
  const profileLetter = currentUser ? currentUser.charAt(0).toUpperCase() : "?";

  const [scanPos, setScanPos] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setScanPos(p => (p >= 100 ? 0 : p + 0.6));
    }, 16);
    return () => clearInterval(id);
  }, []);

  const handleStart = () => navigate(isLoggedIn ? "/upload" : "/login");
  const handleLogin = () => {
    if (isLoggedIn) {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("currentUser");
    }
    navigate("/login");
  };

  return (
    <div style={s.page}>

      {/* ── NAVBAR ─────────────────────────────────────────────────── */}
      <nav style={s.nav}>
        <div style={s.navBrand}>
          <span style={s.navDot}></span>
          <span style={s.navTitle}>DeepFake<span style={s.navAI}> AI</span></span>
        </div>
        <div style={s.navLinks}>
          <a href="#about" style={s.navLink}>About</a>
          <a href="#how" style={s.navLink}>How It Works</a>
          <a href="#contact" style={s.navLink}>Contact</a>
        </div>
        <div style={s.navActions}>
          <button style={s.loginBtn} onClick={handleLogin}>
            {isLoggedIn ? "Logout" : "Login"}
          </button>
          {isLoggedIn && (
            <div style={s.avatar} onClick={() => navigate("/profile")}>{profileLetter}</div>
          )}
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section style={s.hero}>
        <div style={s.heroGrid}></div>

        <div style={s.heroLeft}>
          <div style={s.heroBadge}>
            <span style={s.badgeDot}></span>
            AI-Powered Detection System
          </div>

          <h1 style={s.heroH1}>
            Detect Deepfakes<br />
            <span style={s.heroAccent}>Before They Spread</span>
          </h1>

          <p style={s.heroDesc}>
            Multi-modal AI that analyzes videos, images, and audio to identify
            synthetic manipulation with forensic-level precision. Built on
            FaceForensics++ and FoR benchmark datasets.
          </p>

          {/* ── STATS — all 4 metrics ── */}
          <div style={s.heroStats}>
            <div style={s.stat}>
              <span style={s.statNum}>96.2<span style={s.statPct}>%</span></span>
              <span style={s.statLabel}>Video Accuracy</span>
            </div>
            <div style={s.statDivider}></div>
            <div style={s.stat}>
              <span style={s.statNum}>83.4<span style={s.statPct}>%</span></span>
              <span style={s.statLabel}>Image Accuracy</span>
            </div>
            <div style={s.statDivider}></div>
            <div style={s.stat}>
              <span style={s.statNum}>86.4<span style={s.statPct}>%</span></span>
              <span style={s.statLabel}>Audio Accuracy</span>
            </div>
            <div style={s.statDivider}></div>
            <div style={s.stat}>
              <span style={s.statNum}>3</span>
              <span style={s.statLabel}>Modalities</span>
            </div>
          </div>

          <div style={s.heroButtons}>
            <button style={s.ctaBtn} onClick={handleStart}>Start Detection →</button>
            <a href="#how" style={s.ghostBtn}>How It Works</a>
          </div>
        </div>

        {/* ── SCAN VISUAL ─────────────────────────────────────────── */}
        <div style={s.heroRight}>
          <div style={s.scanCard}>
            <div style={s.scanHeader}>
              <div style={s.scanHeaderDots}>
                <span style={{...s.dot, background:"#FF5F57"}}></span>
                <span style={{...s.dot, background:"#FEBC2E"}}></span>
                <span style={{...s.dot, background:"#28C840"}}></span>
              </div>
              <span style={s.scanHeaderTitle}>deepguard_analyzer.py</span>
            </div>

            <div style={s.faceContainer}>
              <img src={projectImage} alt="Detection" style={s.faceImg} />
              <div style={{...s.scanLine, top:`${scanPos}%`}}></div>
              <div style={s.fakeOverlay}>
                <span style={s.fakeLabel}>⚠ FAKE</span>
                <div style={s.fakeGrid}></div>
              </div>
              <div style={s.realOverlay}>
                <span style={s.realLabel}>✓ REAL</span>
              </div>
              <div style={{...s.corner, top:8, left:8, borderTop:"2px solid #00D4FF", borderLeft:"2px solid #00D4FF"}}></div>
              <div style={{...s.corner, top:8, right:8, borderTop:"2px solid #00D4FF", borderRight:"2px solid #00D4FF"}}></div>
              <div style={{...s.corner, bottom:8, left:8, borderBottom:"2px solid #00D4FF", borderLeft:"2px solid #00D4FF"}}></div>
              <div style={{...s.corner, bottom:8, right:8, borderBottom:"2px solid #00D4FF", borderRight:"2px solid #00D4FF"}}></div>
            </div>

            <div style={s.readout}>
              <div style={s.readoutRow}>
                <span style={s.readoutKey}>model</span>
                <span style={s.readoutVal}>ResNet18 + AudioCNN</span>
              </div>
              <div style={s.readoutRow}>
                <span style={s.readoutKey}>confidence</span>
                <span style={{...s.readoutVal, color:"#FF3B3B"}}>96.2% FAKE</span>
              </div>
              <div style={s.readoutRow}>
                <span style={s.readoutKey}>modality</span>
                <span style={s.readoutVal}>video · image · audio</span>
              </div>
              <div style={s.readoutRow}>
                <span style={s.readoutKey}>status</span>
                <span style={{...s.readoutVal, color:"#00D4FF"}}>● scanning</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MODALITY BAR ───────────────────────────────────────────── */}
      <section style={s.modalityBar}>
        {[
          { icon:"🎬", label:"Video",  acc:"96.2%", desc:"Frame-level ResNet18 + aggregation" },
          { icon:"🖼️", label:"Image",  acc:"83.4%", desc:"Face-crop + CNN classification" },
          { icon:"🎵", label:"Audio",  acc:"86.4%", desc:"MFCC-CNN deepfake detection" },
        ].map(m => (
          <div key={m.label} style={s.modalityCard}>
            <div style={s.modalityIcon}>{m.icon}</div>
            <div style={s.modalityInfo}>
              <div style={s.modalityLabel}>{m.label} Detection</div>
              <div style={s.modalityAcc}>{m.acc} F1</div>
              <div style={s.modalityDesc}>{m.desc}</div>
            </div>
          </div>
        ))}
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
      <section id="how" style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.sectionEyebrow}>PIPELINE</div>
          <h2 style={s.sectionH2}>How Detection Works</h2>
          <p style={s.sectionSub}>From upload to verdict in seconds — powered by trained deep learning models</p>

          {/* FIX 2: grid layout so all cards are exactly equal height */}
          <div style={s.pipeline}>
            {[
              { n:"01", title:"Upload Media",             desc:"Drop any video, image, or audio file. The system auto-detects the modality and routes it to the correct model.", icon:"📁" },
              { n:"02", title:"Face / Feature Extraction",desc:"OpenCV Haar cascade isolates faces from frames. librosa extracts MFCC spectrograms from audio.", icon:"🔍" },
              { n:"03", title:"AI Model Inference",       desc:"ResNet18 scores each frame. AudioCNN processes MFCC maps. Softmax probabilities are aggregated across all frames.", icon:"🧠" },
              { n:"04", title:"Verdict + Confidence",     desc:"The system outputs a real/fake verdict with a confidence percentage and modality-specific explanation.", icon:"✅" },
            ].map((step, i) => (
              <React.Fragment key={step.n}>
                <div style={s.pipeStep}>
                  <div style={s.pipeIcon}>{step.icon}</div>
                  <div style={s.pipeNum}>{step.n}</div>
                  <div style={s.pipeTitle}>{step.title}</div>
                  <div style={s.pipeDesc}>{step.desc}</div>
                </div>
                {i < 3 && <div style={s.pipeArrow}>→</div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ──────────────────────────────────────────────────── */}
      <section id="about" style={{...s.section, background:"#070F1E"}}>
        <div style={s.sectionInner}>
          <div style={s.sectionEyebrow}>ABOUT</div>
          <h2 style={s.sectionH2}>Why Multi-Modal?</h2>

          <div style={s.aboutGrid}>
            <div style={s.aboutText}>
              <p style={s.aboutP}>
                A single-modal detector can be fooled — fake a face but keep real audio,
                and a video-only system passes it. <span style={s.cyan}>DeepFake AI</span> cross-examines
                three independent signals simultaneously.
              </p>
              <p style={s.aboutP}>
                Trained on <strong style={s.white}>FaceForensics++</strong> (1,000 real + 1,000 Deepfakes,
                c40 compression) and the <strong style={s.white}>FoR dataset</strong> (13,956 audio clips),
                the models generalize across compression artifacts, voice synthesizers, and
                facial reenactment techniques.
              </p>
              <p style={s.aboutP}>
                Real-world applications: social media content verification, digital forensics,
                newsroom fact-checking, and enterprise security screening.
              </p>
            </div>

            {/* FIX 3: grid layout for straight alignment */}
            <div style={s.techStack}>
              <div style={s.techTitle}>Tech Stack</div>
              {[
                ["Model",    "ResNet18 (video/image) · AudioCNN (audio)"],
                ["Training", "PyTorch · GroupKFold CV · Early Stopping"],
                ["Backend",  "Node.js · Express · Python spawn"],
                ["Frontend", "React.js · Drag-drop upload"],
                ["Database", "MongoDB · JWT Auth"],
              ].map(([k, v]) => (
                <div key={k} style={s.techRow}>
                  <span style={s.techKey}>{k}</span>
                  <span style={s.techVal}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ────────────────────────────────────────────────── */}
      <section id="contact" style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.sectionEyebrow}>CONTACT</div>
          <h2 style={s.sectionH2}>Get In Touch</h2>

          <div style={s.contactCard}>
            {[
              { label:"Name",     value:"Tatikonda Yeshwanth",        icon:"👤" },
              { label:"Email",    value:"tatikonda2228@gmail.com",     icon:"✉️" },
              { label:"Location", value:"Hyderabad, India",            icon:"📍" },
            ].map((c, i, arr) => (
              <div key={c.label} style={{
                ...s.contactRow,
                borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none",
              }}>
                <span style={s.contactIcon}>{c.icon}</span>
                <div style={s.contactInfo}>
                  <div style={s.contactLabel}>{c.label}</div>
                  <div style={s.contactValue}>{c.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer style={s.footer}>
        <span style={s.footerBrand}>DeepFake AI</span>
        <span style={s.footerMid}>© 2026 Multi-Modal Deepfake Detection Project</span>
        <span style={s.footerRight}>Built with PyTorch · React · Node.js</span>
      </footer>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
/* STYLES                                                                     */
/* ══════════════════════════════════════════════════════════════════════════ */
const CYAN   = "#00D4FF";
const RED    = "#FF3B3B";
const BLUE   = "#1565C0";
const BG     = "#050D1A";
const BG2    = "#070F1E";
const CARD   = "#0C1929";
const BORDER = "#1A2840";
const WHITE  = "#FFFFFF";
const MUTED  = "#8899AA";

const s = {
  page: {
    background: BG, color: WHITE,
    fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
    minHeight: "100vh", overflowX: "hidden",
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

  /* HERO */
  hero: { display: "flex", alignItems: "center", gap: 60, padding: "80px 60px", maxWidth: 1280, margin: "0 auto", position: "relative" },
  heroGrid: { position: "absolute", inset: 0, zIndex: 0, backgroundImage: `linear-gradient(${BORDER} 1px,transparent 1px),linear-gradient(90deg,${BORDER} 1px,transparent 1px)`, backgroundSize: "60px 60px", opacity: 0.3, pointerEvents: "none" },
  heroLeft:  { flex: 1, position: "relative", zIndex: 1 },
  heroBadge: { display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, border: `1px solid ${CYAN}22`, background: `${CYAN}11`, color: CYAN, fontSize: 12, fontWeight: 600, marginBottom: 24, letterSpacing: 0.5 },
  badgeDot:  { width: 7, height: 7, borderRadius: "50%", background: CYAN, display: "inline-block" },
  heroH1:    { fontSize: 54, fontWeight: 900, lineHeight: 1.1, margin: "0 0 20px", letterSpacing: -2, color: WHITE },
  heroAccent:{ background: `linear-gradient(90deg,${CYAN},${BLUE})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  heroDesc:  { fontSize: 17, color: MUTED, lineHeight: 1.7, maxWidth: 500, marginBottom: 36 },

  /* STATS */
  heroStats:   { display: "flex", alignItems: "center", gap: 24, marginBottom: 40, flexWrap: "wrap" },
  stat:        { display: "flex", flexDirection: "column", gap: 4 },
  statNum:     { fontSize: 28, fontWeight: 900, color: WHITE, letterSpacing: -1 },
  statPct:     { fontSize: 16, color: CYAN },
  statLabel:   { fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: 1 },
  statDivider: { width: 1, height: 36, background: BORDER, flexShrink: 0 },

  heroButtons: { display: "flex", gap: 16, alignItems: "center" },
  ctaBtn:  { padding: "14px 32px", borderRadius: 10, background: `linear-gradient(135deg,${CYAN},${BLUE})`, border: "none", color: WHITE, fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: `0 0 24px ${CYAN}44` },
  ghostBtn:{ padding: "14px 28px", borderRadius: 10, border: `1px solid ${BORDER}`, color: MUTED, fontSize: 15, fontWeight: 600, textDecoration: "none" },

  /* SCAN CARD */
  heroRight:      { flex: 1, position: "relative", zIndex: 1 },
  scanCard:       { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", boxShadow: `0 0 60px ${CYAN}18` },
  scanHeader:     { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#0A1525", borderBottom: `1px solid ${BORDER}` },
  scanHeaderDots: { display: "flex", gap: 6 },
  dot:            { width: 12, height: 12, borderRadius: "50%", display: "inline-block" },
  scanHeaderTitle:{ fontSize: 12, color: MUTED, fontFamily: "monospace" },
  faceContainer:  { position: "relative", overflow: "hidden", lineHeight: 0 },
  faceImg:        { width: "100%", display: "block", filter: "brightness(0.85)" },
  scanLine:       { position: "absolute", left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${CYAN},transparent)`, boxShadow: `0 0 12px ${CYAN}` },
  fakeOverlay:    { position: "absolute", top: 0, left: 0, width: "50%", height: "100%", background: `${RED}18`, borderRight: `1px solid ${RED}44`, display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", padding: 10 },
  fakeLabel:      { background: RED, color: WHITE, fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 4, letterSpacing: 1 },
  fakeGrid:       { position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(0deg,${RED}11 0px,${RED}11 1px,transparent 1px,transparent 20px)` },
  realOverlay:    { position: "absolute", top: 0, right: 0, width: "50%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-end", padding: 10 },
  realLabel:      { background: "#00C851", color: WHITE, fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 4, letterSpacing: 1 },
  corner:         { position: "absolute", width: 16, height: 16 },
  readout:        { padding: "14px 16px", fontFamily: "monospace", display: "flex", flexDirection: "column", gap: 6 },
  readoutRow:     { display: "flex", justifyContent: "space-between", alignItems: "center" },
  readoutKey:     { fontSize: 11, color: MUTED },
  readoutVal:     { fontSize: 12, color: CYAN, fontWeight: 600 },

  /* MODALITY BAR */
  modalityBar:  { display: "flex", gap: 1, background: BORDER, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` },
  modalityCard: { flex: 1, display: "flex", alignItems: "center", gap: 16, padding: "28px 40px", background: CARD },
  modalityIcon: { fontSize: 32 },
  modalityInfo: { display: "flex", flexDirection: "column", gap: 2 },
  modalityLabel:{ fontSize: 14, fontWeight: 700, color: WHITE },
  modalityAcc:  { fontSize: 22, fontWeight: 900, color: CYAN, letterSpacing: -0.5 },
  modalityDesc: { fontSize: 12, color: MUTED },

  /* SECTIONS */
  section:       { padding: "80px 60px", background: BG },
  sectionInner:  { maxWidth: 1160, margin: "0 auto" },
  sectionEyebrow:{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: CYAN, marginBottom: 12 },
  sectionH2:     { fontSize: 38, fontWeight: 900, letterSpacing: -1, marginBottom: 12, color: WHITE },
  sectionSub:    { fontSize: 16, color: MUTED, marginBottom: 56 },

  /* PIPELINE — FIX 2: CSS grid so all cards are exactly equal height */
  pipeline: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr auto 1fr auto 1fr",
    alignItems: "stretch",
    gap: 0,
  },
  pipeStep: {
    background: CARD, border: `1px solid ${BORDER}`,
    borderRadius: 14, padding: "28px 24px",
    display: "flex", flexDirection: "column", gap: 10,
  },
  pipeIcon:  { fontSize: 28 },
  pipeNum:   { fontSize: 11, fontWeight: 700, color: CYAN, letterSpacing: 2 },
  pipeTitle: { fontSize: 16, fontWeight: 700, color: WHITE },
  pipeDesc:  { fontSize: 13, color: MUTED, lineHeight: 1.6 },
  pipeArrow: { color: BORDER, fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px" },

  /* ABOUT */
  aboutGrid: { display: "flex", gap: 60, alignItems: "flex-start", flexWrap: "wrap" },
  aboutText: { flex: 1, minWidth: 280 },
  aboutP:    { fontSize: 15, color: MUTED, lineHeight: 1.8, marginBottom: 18 },
  cyan:      { color: CYAN, fontWeight: 600 },
  white:     { color: WHITE },

  /* TECH STACK — FIX 3: fixed-width left column for straight alignment */
  techStack: { flex: 1, minWidth: 280, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 28 },
  techTitle: { fontSize: 13, fontWeight: 700, color: CYAN, letterSpacing: 2, marginBottom: 18, textTransform: "uppercase" },
  techRow: {
    display: "grid",
    gridTemplateColumns: "90px 1fr",   /* fixed label column — all values start at same X */
    alignItems: "center",
    gap: 16,
    padding: "10px 0",
    borderBottom: `1px solid ${BORDER}`,
    fontSize: 13,
  },
  techKey: { color: MUTED, fontWeight: 600 },
  techVal: { color: WHITE },           /* left-aligned, not space-between */

  /* CONTACT */
  contactCard:  { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", maxWidth: 520 },
  contactRow:   { display: "flex", alignItems: "center", gap: 20, padding: "24px 28px" },
  contactIcon:  { fontSize: 22, flexShrink: 0 },
  contactInfo:  { display: "flex", flexDirection: "column", gap: 4 },
  contactLabel: { fontSize: 11, color: CYAN, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" },
  contactValue: { fontSize: 16, color: WHITE, fontWeight: 600 },

  /* FOOTER */
  footer:      { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 60px", borderTop: `1px solid ${BORDER}`, background: BG2, flexWrap: "wrap", gap: 12 },
  footerBrand: { fontSize: 15, fontWeight: 800, color: CYAN },
  footerMid:   { fontSize: 13, color: MUTED },
  footerRight: { fontSize: 12, color: MUTED },
};

export default Home;