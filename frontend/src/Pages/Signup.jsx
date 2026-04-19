// src/Pages/Signup.jsx

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import aiImage from "../assets/deepfake-ai-image.jpg"; 
// Replace with your downloaded AI deepfake image inside src/assets/

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();

  // Google Sign Up Demo
  const handleGoogleSignup = () => {
    alert("Google Sign-Up can be connected using Firebase later.");

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("currentUser", "googleuser@gmail.com");

    navigate("/");
  };

  // Email Signup
  const handleSignup = (e) => {
    e.preventDefault();

    if (password !== confirm) {
      alert("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters!");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const userExists = users.find((user) => user.email === email);

    if (userExists) {
      alert("Account already exists! Please login.");
      navigate("/login");
      return;
    }

    const newUser = {
      email,
      password,
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    alert("Account created successfully!");
    navigate("/login");
  };

  return (
    <div style={mainContainer}>
      {/* LEFT SIDE SIGNUP */}
      <div style={leftSection}>
        <div style={cardStyle}>
          <h2 style={titleStyle}>Create Account</h2>

          <p style={subTitle}>
            Join Deepfake Detection System and secure your digital media
          </p>

          {/* Google Sign Up */}
          <button style={googleButton} onClick={handleGoogleSignup}>
            <span style={googleIcon}>G</span>
            Sign up with Google
          </button>

          {/* Email Button */}
          <button style={emailButton}>
            <span style={emailIcon}>✉</span>
            Sign up with Email
          </button>

          {/* Divider */}
          <div style={dividerContainer}>
            <div style={line}></div>
            <span style={dividerText}>or continue with email</span>
            <div style={line}></div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSignup}>
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
              placeholder="Create Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              style={inputStyle}
            />

            <button type="submit" style={buttonStyle}>
              Create Account
            </button>
          </form>

          <p style={bottomText}>
            Already have an account?{" "}
            <Link to="/login" style={linkStyle}>
              Login Here
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
  marginBottom: "10px",
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
  border: "1px solid #dbeafe",
  borderRadius: "12px",
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: "600",
  color: "#0f172a",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  marginBottom: "15px",
  boxSizing: "border-box",
};

const googleIcon = {
  width: "32px",
  height: "32px",
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
  border: "1px solid #dbeafe",
  borderRadius: "12px",
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: "600",
  color: "#0f172a",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  marginBottom: "20px",
  boxSizing: "border-box",
};

const emailIcon = {
  width: "32px",
  height: "32px",
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
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  outline: "none",
  fontSize: "14px",
  background: "#f8fafc",
  color: "#0f172a",
  boxSizing: "border-box",
};

const buttonStyle = {
  width: "100%",
  padding: "14px",
  background: "#1565c0",
  color: "#ffffff",
  border: "none",
  borderRadius: "12px",
  fontSize: "16px",
  fontWeight: "700",
  cursor: "pointer",
  marginTop: "5px",
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

export default Signup;