// src/Pages/Profile.jsx

import React from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();

  // Get current logged-in user
  const currentUser = localStorage.getItem("currentUser") || "User";

  // First letter for profile icon
  const firstLetter = currentUser.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");

    alert("Logged out successfully!");
    navigate("/login");
  };

  const handleBackHome = () => {
    navigate("/");
  };

  return (
    <div style={containerStyle}>
      {/* Background Circles */}
      <div style={circleOne}></div>
      <div style={circleTwo}></div>
      <div style={circleThree}></div>

      <div style={profileCard}>
        {/* Dynamic Profile Icon */}
        <div style={profileIcon}>{firstLetter}</div>

        <h1 style={titleStyle}>My Profile</h1>

        <p style={subTitle}>
          Welcome to your Deepfake Detection dashboard
        </p>

        <div style={infoBox}>
          <div style={infoItem}>
            <p style={labelStyle}>Registered Email</p>
            <p style={valueStyle}>{currentUser}</p>
          </div>

          <div style={infoItem}>
            <p style={labelStyle}>Project</p>
            <p style={valueStyle}>Multi-Modal Deepfake Detection</p>
          </div>

          <div style={infoItem}>
            <p style={labelStyle}>Account Status</p>
            <p style={valueStyle}>Active</p>
          </div>
        </div>

        <div style={buttonContainer}>
          <button style={homeButton} onClick={handleBackHome}>
            Back to Home
          </button>

          <button style={logoutButton} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Styles ---------------- */

const containerStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #031b34, #0b3b74, #124e96)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
  overflow: "hidden",
  fontFamily: "Arial, sans-serif",
  padding: "20px",
};

/* Background Animation */

const circleOne = {
  position: "absolute",
  width: "300px",
  height: "300px",
  borderRadius: "50%",
  background: "rgba(255,255,255,0.05)",
  top: "80px",
  left: "-100px",
};

const circleTwo = {
  position: "absolute",
  width: "250px",
  height: "250px",
  borderRadius: "50%",
  background: "rgba(255,255,255,0.04)",
  bottom: "80px",
  right: "-80px",
};

const circleThree = {
  position: "absolute",
  width: "200px",
  height: "200px",
  borderRadius: "50%",
  background: "rgba(255,255,255,0.03)",
  bottom: "150px",
  left: "10%",
};

/* Profile Card */

const profileCard = {
  width: "90%",
  maxWidth: "520px",
  backgroundColor: "rgba(255,255,255,0.97)",
  borderRadius: "24px",
  padding: "45px",
  boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
  textAlign: "center",
  position: "relative",
  zIndex: 2,
};

const profileIcon = {
  width: "95px",
  height: "95px",
  borderRadius: "50%",
  backgroundColor: "#1565c0",
  color: "#fff",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  margin: "0 auto 20px auto",
  fontSize: "38px",
  fontWeight: "700",
};

const titleStyle = {
  fontSize: "32px",
  color: "#1565c0",
  marginBottom: "10px",
  fontWeight: "700",
};

const subTitle = {
  color: "#64748b",
  fontSize: "14px",
  marginBottom: "30px",
};

const infoBox = {
  background: "#f8fafc",
  border: "1px solid #dbeafe",
  borderRadius: "16px",
  padding: "24px",
  marginBottom: "30px",
  textAlign: "left",
};

const infoItem = {
  marginBottom: "18px",
};

const labelStyle = {
  fontSize: "13px",
  color: "#64748b",
  marginBottom: "5px",
};

const valueStyle = {
  fontSize: "16px",
  color: "#0f172a",
  fontWeight: "600",
};

const buttonContainer = {
  display: "flex",
  justifyContent: "space-between",
  gap: "15px",
  flexWrap: "wrap",
};

const homeButton = {
  flex: 1,
  padding: "14px",
  backgroundColor: "#1565c0",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  fontSize: "16px",
  fontWeight: "700",
  cursor: "pointer",
};

const logoutButton = {
  flex: 1,
  padding: "14px",
  backgroundColor: "#fff",
  color: "#dc2626",
  border: "1px solid #fecaca",
  borderRadius: "12px",
  fontSize: "16px",
  fontWeight: "700",
  cursor: "pointer",
};

export default Profile;