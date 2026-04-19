// src/Pages/Login.jsx

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import aiImage from "../assets/deepfake-ai-image.jpg"; 
// Replace this image with the deepfake-related AI image downloaded from:
// https://cyberdeepakyadav.com/deepfake-detection-and-multimedia-forensics

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Google Sign In Demo
  const handleGoogleLogin = () => {
    alert("Google Sign-In can be connected using Firebase later.");

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("currentUser", "googleuser@gmail.com");

    navigate("/");
  };

  // Email Sign In
  const handleEmailLogin = (e) => {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const user = users.find((u) => u.email === email);

    if (!user) {
      alert("Account not found! Please create an account.");
      return;
    }

    if (user.password !== password) {
      alert("Incorrect password!");
      return;
    }

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("currentUser", email);

    alert("Login successful!");
    navigate("/");
  };

  return (
    <div style={mainContainer}>
      {/* LEFT SIDE LOGIN */}
      <div style={leftSection}>
        <div style={cardStyle}>
          <h2 style={titleStyle}>Login</h2>
          <p style={subTitle}>
            Sign in to continue to Deepfake Detection System
          </p>

          {/* Google Sign In */}
          <button style={googleButton} onClick={handleGoogleLogin}>
            <span style={googleIcon}>G</span>
            Sign in with Google
          </button>

          {/* Email Button */}
          <button style={emailButton}>
            <span style={emailIcon}>✉</span>
            Sign in with Email
          </button>

          {/* Divider */}
          <div style={dividerContainer}>
            <div style={line}></div>
            <span style={dividerText}>or continue with email</span>
            <div style={line}></div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleEmailLogin}>
            <input
              type="email"
              placeholder="Enter Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />

            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />

            <button type="submit" style={buttonStyle}>
              Sign In
            </button>
          </form>

          <p style={forgotText}>
            <Link to="/forgot-password" style={linkStyle}>
              Forgot Password?
            </Link>
          </p>

          <p style={bottomText}>
            Don’t have an account?{" "}
            <Link to="/signup" style={linkStyle}>
              Create an Account
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE IMAGE ONLY */}
      <div style={rightSection}>
        <img
          src={aiImage}
          alt="Deepfake Detection AI"
          style={rightImage}
        />
      </div>
    </div>
  );
};

/* ---------------- STYLES ---------------- */

const mainContainer = {
  display: "flex",
  minHeight: "100vh",
  width: "100%",
  fontFamily: "Arial, sans-serif",
};

/* LEFT SIDE */

const leftSection = {
  flex: 1,
  background: "#ffffff",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "40px",
};

const cardStyle = {
  width: "100%",
  maxWidth: "430px",
  background: "#ffffff",
  padding: "2.8rem",
  borderRadius: "20px",
  boxShadow: "0 15px 40px rgba(0,0,0,0.08)",
  border: "1px solid #e2e8f0",
};

const titleStyle = {
  marginBottom: "8px",
  color: "#1565c0",
  fontSize: "32px",
  fontWeight: "700",
};

const subTitle = {
  color: "#475569",
  fontSize: "14px",
  marginBottom: "28px",
  lineHeight: "1.7",
};

/* BUTTONS */

const googleButton = {
  width: "100%",
  padding: "14px",
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: "600",
  color: "#0f172a",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  marginBottom: "15px",
};

const googleIcon = {
  width: "30px",
  height: "30px",
  borderRadius: "50%",
  background: "#ea4335",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "700",
};

const emailButton = {
  width: "100%",
  padding: "14px",
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: "600",
  color: "#0f172a",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  marginBottom: "20px",
};

const emailIcon = {
  width: "30px",
  height: "30px",
  borderRadius: "50%",
  background: "#1565c0",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "700",
};

const dividerContainer = {
  display: "flex",
  alignItems: "center",
  marginBottom: "22px",
  gap: "10px",
};

const line = {
  flex: 1,
  height: "1px",
  background: "#cbd5e1",
};

const dividerText = {
  fontSize: "13px",
  color: "#64748b",
  fontWeight: "500",
};

/* FORM */

const inputStyle = {
  width: "100%",
  padding: "14px",
  marginBottom: "16px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

const buttonStyle = {
  width: "100%",
  padding: "14px",
  background: "#1565c0",
  color: "#ffffff",
  border: "none",
  borderRadius: "10px",
  fontSize: "16px",
  fontWeight: "700",
  cursor: "pointer",
};

const forgotText = {
  marginTop: "16px",
  fontSize: "14px",
};

const bottomText = {
  marginTop: "22px",
  fontSize: "14px",
  color: "#334155",
};

const linkStyle = {
  color: "#1565c0",
  fontWeight: "600",
  textDecoration: "none",
};

/* RIGHT SIDE */

const rightSection = {
  flex: 1,
  background: "linear-gradient(135deg, #031b34, #0b3b74, #124e96)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "50px",
};

const rightImage = {
  width: "100%",
  maxWidth: "550px",
  borderRadius: "20px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
  objectFit: "cover",
};

export default Login;