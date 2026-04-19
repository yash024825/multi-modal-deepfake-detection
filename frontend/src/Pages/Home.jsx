// src/Pages/Home.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import projectImage from "../assets/project-image.jpg";

const Home = () => {
  const navigate = useNavigate();

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const currentUser = localStorage.getItem("currentUser");

  const profileLetter = currentUser
    ? currentUser.charAt(0).toUpperCase()
    : "👤";

  const handleStartDetection = () => {
    if (!isLoggedIn) return navigate("/login");
    navigate("/upload");
  };

  const handleProfileClick = () => {
    if (!isLoggedIn) return navigate("/login");
    navigate("/profile");
  };

  const handleLoginClick = () => {
    if (isLoggedIn) {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("currentUser");
    }
    navigate("/login");
  };

  return (
    <div style={containerStyle}>
      {/* Background */}
      <div style={circleOne}></div>
      <div style={circleTwo}></div>
      <div style={circleThree}></div>

      {/* TOP BAR */}
      <div style={topRightContainer}>
        <button style={loginButton} onClick={handleLoginClick}>
          {isLoggedIn ? "Logout" : "Login"}
        </button>

        <div style={profileIcon} onClick={handleProfileClick}>
          {profileLetter}
        </div>
      </div>

      {/* HERO */}
      <section style={heroSection}>
        <div style={heroContent}>
          <p style={smallTitle}>Deepfake Detection System</p>

          <h1 style={heroTitle}>
            Multi-Modal Deepfake
            <br />
            Detection AI
          </h1>

          <p style={heroSubtitle}>
            Detect manipulated videos, images, and audio using advanced AI
            models with high accuracy and forensic-level reliability.
          </p>

          <button style={heroButton} onClick={handleStartDetection}>
            Start Detection
          </button>
        </div>

        <div style={heroImageWrapper}>
          <img src={projectImage} alt="AI" style={heroImage} />
        </div>
      </section>

      {/* ABOUT (UPGRADED) */}
      <section style={cardStyle}>
        <h2 style={sectionTitle}>About This Project</h2>

        <p style={textStyle}>
          The Multi-Modal Deepfake Detection System is an AI-powered
          cybersecurity application designed to detect synthetic or
          manipulated digital content across multiple formats including
          images, videos, and audio streams.With the rapid rise of generative AI tools, 
          deepfakes have become a major threat in areas like misinformation, 
          identity fraud,political manipulation, and cybercrime. This system aims 
          to address these challenges by combining deep learning and computer 
          vision techniques.The model analyzes facial expressions, lip-sync 
          accuracy, voice patterns, frame inconsistencies, and temporal 
          anomalies to detect tampering. It uses a multi-modal approach, 
          meaning it combines visual + audio + behavioral signals for higher 
          accuracy than traditional single-model systems.This project can be 
          applied in real-world scenarios such as: Social media content verification,  
          Cybersecurity threat detection, Digital forensics investigations and Fake 
          news prevention systems.  
        </p>
      </section>

      {/* HOW IT WORKS (UPDATED COLORS) */}
      <section style={cardStyle}>
        <h2 style={sectionTitle}>How It Works</h2>

        <div style={flowContainer}>
          <div style={flowStep}>
            <div style={stepCircle}>01</div>
            <h4 style={stepTitle}>Upload Media</h4>
            <p style={stepText}>Upload image, video, or audio file for analysis</p>
          </div>

          <div style={arrow}>→</div>

          <div style={flowStep}>
            <div style={stepCircle}>02</div>
            <h4 style={stepTitle}>AI Analysis</h4>
            <p style={stepText}>AI model scans and analyzes uploaded content</p>
          </div>

          <div style={arrow}>→</div>

          <div style={flowStep}>
            <div style={stepCircle}>03</div>
            <h4 style={stepTitle}>Forgery Detection</h4>
            <p style={stepText}>Detects facial and audio inconsistencies</p>
          </div>

          <div style={arrow}>→</div>

          <div style={flowStep}>
            <div style={stepCircle}>04</div>
            <h4 style={stepTitle}>Report Generation</h4>
            <p style={stepText}>Generates authenticity verification report</p>
          </div>

          <div style={arrow}>→</div>

          <div style={flowStep}>
            <div style={stepCircle}>05</div>
            <h4 style={stepTitle}>Final Result</h4>
            <p style={stepText}>Displays deepfake detection final result</p>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section style={cardStyle}>
        <h2 style={sectionTitle}>Contact</h2>

        <div style={contactGrid}>
          <div style={contactCard}>
            <h4 style={contactTitle}>Name</h4>
            <p style={contactText}>Tatikonda Yeshwanth</p>
          </div>

          <div style={contactCard}>
            <h4 style={contactTitle}>Email</h4>
            <p style={contactText}>tatikonda2228@gmail.com</p>
          </div>

          <div style={contactCard}>
            <h4 style={contactTitle}>Mobile</h4>
            <p style={contactText}>+91 9010102210</p>
          </div>

          <div style={contactCard}>
            <h4 style={contactTitle}>Location</h4>
            <p style={contactText}>Hyderabad, India</p>
          </div>
        </div>
      </section>

      <footer style={footerStyle}>
        © 2026 Multi-Modal Deepfake Detection Project
      </footer>
    </div>
  );
};

/* ---------------- STYLES ---------------- */

const containerStyle = {
  fontFamily: "Arial",
  minHeight: "100vh",
  padding: "30px 20px",
  background: "linear-gradient(135deg, #031b34, #0b3b74, #124e96)",
  position: "relative",
  overflow: "hidden",
};

const circleOne = { position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.05)", top: 100, left: -100 };
const circleTwo = { position: "absolute", width: 250, height: 250, borderRadius: "50%", background: "rgba(255,255,255,0.04)", top: 500, right: -80 };
const circleThree = { position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.03)", bottom: 100, left: "10%" };

const topRightContainer = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "15px",
  marginBottom: "30px",
};

const loginButton = {
  padding: "12px 24px",
  background: "#fff",
  border: "none",
  borderRadius: "10px",
  fontWeight: "700",
  cursor: "pointer",
  color: "#1565c0",
};

const profileIcon = {
  width: "45px",
  height: "45px",
  borderRadius: "50%",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "700",
  cursor: "pointer",
  color: "#1565c0",
};

const heroSection = {
  display: "flex",
  justifyContent: "space-between",
  flexWrap: "wrap",
  maxWidth: 1200,
  margin: "0 auto 50px",
};

const heroContent = { flex: 1, minWidth: 300 };

const smallTitle = { color: "#dbeafe", fontSize: 18 };
const heroTitle = { fontSize: 54, color: "#fff", fontWeight: "700" };
const heroSubtitle = { fontSize: 18, color: "#dbeafe" };

const heroButton = {
  padding: "14px 30px",
  background: "#0952d1",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontWeight: "700",
};

const heroImageWrapper = { flex: 1, textAlign: "center" };
const heroImage = { width: "100%", maxWidth: 500, borderRadius: 20 };

const cardStyle = {
  maxWidth: 1100,
  margin: "0 auto 35px",
  background: "#fff",
  padding: 40,
  borderRadius: 20,
};

const sectionTitle = {
  textAlign: "center",
  color: "#1565c0",
  fontSize: 34,
  marginBottom: 20,
};

const textStyle = {
  fontSize: 16,
  lineHeight: 2,
  color: "#333",
};

/* FLOW */
const flowContainer = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 10,
};

const flowStep = {
  width: "75%",
  background: "#f9f9f9",
  padding: 20,
  borderRadius: 15,
  textAlign: "center",
};

/* 🔥 UPDATED STEP TITLE COLOR */
const stepTitle = {
  fontSize: 18,
  fontWeight: "700",
  background: "linear-gradient(90deg, #1565c0, #00bcd4)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const stepCircle = {
  width: 50,
  height: 50,
  borderRadius: "50%",
  background: "#1565c0",
  color: "#fff",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  margin: "0 auto 10px",
};

const arrow = {
  fontSize: 26,
  color: "#1565c0",
  fontWeight: "700",
};

const stepText = { fontSize: 14, color: "#555" };

const contactGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2,1fr)",
  gap: 20,
};

const contactCard = {
  background: "#fff",
  padding: 25,
  borderRadius: 15,
};

const contactTitle = { color: "#1565c0" };
const contactText = { color: "#333" };

const footerStyle = {
  textAlign: "center",
  color: "#fff",
};

export default Home;