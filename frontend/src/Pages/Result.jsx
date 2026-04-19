import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const file = location.state?.file;
  const result = location.state?.result;

  const currentUser = localStorage.getItem("currentUser");

  const profileLetter = currentUser
    ? currentUser.charAt(0).toUpperCase()
    : "T";

  /* ---------------- NAVIGATION HANDLER ---------------- */
  const handleNav = (path) => {
    navigate(path);
  };

  /* ---------------- LOGOUT ---------------- */
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  /* ---------------- RESULT LOGIC ---------------- */
  const normalizedResult = (result || "").toLowerCase();

  const isFake =
    normalizedResult.includes("fake") ||
    normalizedResult.includes("deepfake");

  const isError =
    normalizedResult.includes("error") ||
    normalizedResult.includes("failed");

  return (
    <div style={containerStyle}>
      {/* ---------------- NAVBAR ---------------- */}
      <div style={navBar}>
        <div style={navCenter}>
          <span style={navLink} onClick={() => handleNav("/home")}>
            Home
          </span>

          <span style={navLink} onClick={() => handleNav("/upload")}>
            Upload
          </span>
        </div>

        <div style={navRight}>
          <button style={logoutBtn} onClick={handleLogout}>
            Logout
          </button>

          <div
            style={profileIcon}
            onClick={() => handleNav("/profile")}
          >
            {profileLetter}
          </div>
        </div>
      </div>

      {/* ---------------- CONTENT ---------------- */}
      <div style={centerWrapper}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>AI Detection Result</h1>

          {/* NO FILE */}
          {!file && (
            <>
              <p style={noFileText}>No file uploaded or session expired</p>

              <button
                onClick={() => handleNav("/upload")}
                style={buttonStyle}
              >
                Go to Upload
              </button>
            </>
          )}

          {/* ERROR */}
          {file && isError && (
            <>
              <p style={fileText}>
                File: <strong>{file.name}</strong>
              </p>

              <div style={errorBox}>
                <h2 style={resultTitle}>⚠️ Detection Failed</h2>
                <p style={resultDesc}>
                  Something went wrong while processing the file.
                </p>
              </div>

              <button
                onClick={() => handleNav("/upload")}
                style={buttonStyle}
              >
                Try Again
              </button>
            </>
          )}

          {/* RESULT */}
          {file && !isError && (
            <>
              <p style={fileText}>
                File: <strong>{file.name}</strong>
              </p>

              <div style={resultBox(isFake)}>
                <h2 style={resultTitle}>
                  {isFake ? "❌ Deepfake Detected" : "✅ Real Media"}
                </h2>

                <p style={resultDesc}>
                  {isFake
                    ? "AI detected inconsistencies in facial, audio, or visual patterns."
                    : "No manipulation detected. The media appears authentic."}
                </p>
              </div>

              <button
                onClick={() => handleNav("/upload")}
                style={buttonStyle}
              >
                Analyze Another File
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------------- STYLES ---------------- */

const containerStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #031b34, #0b3b74, #124e96)",
  fontFamily: "Arial",
};

/* NAVBAR */
const navBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "15px 40px",
  background: "rgba(0,0,0,0.3)",
  backdropFilter: "blur(10px)",
};

const navCenter = {
  display: "flex",
  gap: "30px",
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
};

const navRight = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const navLink = {
  color: "#fff",
  fontSize: "18px",
  fontWeight: "600",
  cursor: "pointer",
};

const logoutBtn = {
  padding: "6px 12px",
  borderRadius: "8px",
  border: "none",
  background: "#ffffff",
  color: "#1565c0",
  fontWeight: "bold",
  cursor: "pointer",
};

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

/* CONTENT */
const centerWrapper = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "85vh",
};

const cardStyle = {
  width: "480px",
  background: "#ffffff",
  padding: "40px",
  borderRadius: "18px",
  textAlign: "center",
  boxShadow: "0 15px 35px rgba(0,0,0,0.2)",
};

const titleStyle = {
  color: "#1565c0",
  marginBottom: "20px",
  fontSize: "26px",
  fontWeight: "700",
};

const fileText = {
  fontSize: "15px",
  marginBottom: "20px",
  color: "#333",
};

const noFileText = {
  color: "red",
  fontWeight: "bold",
  marginBottom: "15px",
};

const resultBox = (isFake) => ({
  padding: "22px",
  borderRadius: "12px",
  background: isFake ? "#fee2e2" : "#dcfce7",
  marginBottom: "25px",
  border: isFake ? "1px solid #fca5a5" : "1px solid #86efac",
});

const errorBox = {
  padding: "22px",
  borderRadius: "12px",
  background: "#fff3cd",
  border: "1px solid #ffeeba",
  marginBottom: "25px",
};

const resultTitle = {
  fontSize: "22px",
  marginBottom: "10px",
};

const resultDesc = {
  fontSize: "14px",
  color: "#444",
};

const buttonStyle = {
  display: "inline-block",
  padding: "12px 20px",
  background: "#1565c0",
  color: "#ffffff",
  borderRadius: "10px",
  fontWeight: "700",
  border: "none",
  cursor: "pointer",
};

export default Result;