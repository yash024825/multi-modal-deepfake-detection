import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const UploadMediaPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const profileLetter =
    localStorage.getItem("userName")?.charAt(0).toUpperCase() || "T";

  const handleProfileClick = () => {
    navigate("/profile");
  };

  /* ✅ LOGOUT FUNCTION */
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/detect", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Server error");
      }

      navigate("/result", {
        state: {
          file,
          result: data.result,
        },
      });
    } catch (error) {
      setError(error.message || "Failed to upload file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      {/* Background circles */}
      <div style={circle1}></div>
      <div style={circle2}></div>
      <div style={circle3}></div>

      {/* Navbar */}
      <div style={navBar}>
        <div style={navSide}></div>

        {/* Center Links */}
        <div style={navCenter}>
          <Link style={navLink} to="/">Home</Link>
          <Link style={navLink} to="/result">Result</Link>
        </div>

        {/* Right side (Logout + Profile) */}
        <div style={navRight}>
          {/* Logout button */}
          <button style={logoutBtn} onClick={handleLogout}>
            Logout
          </button>

          {/* Profile icon */}
          <div style={profileIcon} onClick={handleProfileClick}>
            {profileLetter}
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={centerBox}>
        <div style={card}>
          <form onSubmit={handleSubmit}>
            <input
              type="file"
              accept="image/*,video/*,audio/*"
              onChange={handleFileChange}
              style={input}
            />

            <button type="submit" style={button} disabled={loading}>
              {loading ? "Analyzing..." : "Upload & Detect"}
            </button>
          </form>

          {file && (
            <p style={fileText}>
              Selected: <strong>{file.name}</strong>
            </p>
          )}

          {error && <p style={errorText}>{error}</p>}
        </div>
      </div>
    </div>
  );
};

/* ---------------- STYLES ---------------- */

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #031b34, #0b3b74, #124e96)",
  fontFamily: "Arial",
  position: "relative",
  overflow: "hidden",
};

const circle1 = {
  position: "absolute",
  width: "280px",
  height: "280px",
  borderRadius: "50%",
  background: "rgba(255,255,255,0.05)",
  top: "80px",
  left: "-100px",
};

const circle2 = {
  position: "absolute",
  width: "220px",
  height: "220px",
  borderRadius: "50%",
  background: "rgba(255,255,255,0.04)",
  bottom: "80px",
  right: "-80px",
};

const circle3 = {
  position: "absolute",
  width: "180px",
  height: "180px",
  borderRadius: "50%",
  background: "rgba(255,255,255,0.03)",
  top: "50%",
  left: "40%",
};

/* Navbar */
const navBar = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px 40px",
  background: "rgba(0,0,0,0.3)",
  backdropFilter: "blur(10px)",
};

const navSide = {
  width: "50px",
};

const navCenter = {
  display: "flex",
  gap: "30px",
  justifyContent: "center",
  alignItems: "center",
  flex: 1,
};

const navRight = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const navLink = {
  color: "#fff",
  textDecoration: "none",
  fontSize: "18px",
  fontWeight: "600",
};

/* Logout button */
const logoutBtn = {
  padding: "6px 12px",
  borderRadius: "8px",
  border: "none",
  background: "#ffffff",
  color: "#1565c0",
  fontWeight: "bold",
  cursor: "pointer",
};

/* Profile */
const profileIcon = {
  width: "38px",
  height: "38px",
  borderRadius: "50%",
  background: "#ffffff",
  color: "#1565c0",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "18px",
  fontWeight: "bold",
  cursor: "pointer",
};

const centerBox = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "80vh",
};

const card = {
  width: "450px",
  background: "#ffffff",
  padding: "40px",
  borderRadius: "18px",
  textAlign: "center",
  boxShadow: "0 15px 35px rgba(0,0,0,0.2)",
};

const input = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  border: "1px solid #ccc",
  borderRadius: "10px",
};

const button = {
  width: "100%",
  padding: "14px",
  background: "#1565c0",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontWeight: "bold",
  cursor: "pointer",
};

const fileText = {
  marginTop: "15px",
  color: "#333",
};

const errorText = {
  marginTop: "10px",
  color: "red",
  fontWeight: "bold",
};

export default UploadMediaPage;