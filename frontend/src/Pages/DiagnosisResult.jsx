import React from "react";
import { useLocation, Link } from "react-router-dom";

const DiagnosisResult = () => {
  const location = useLocation();
  const file = location.state?.file;
  const result = location.state?.result;

  const getResultText = () => {
    if (!result) return "Processing...";
    return result === "fake" ? "❌ Deepfake Detected" : "✅ Real Media";
  };

  return (
    <div className="page">
      {/* Navbar */}
      <nav className="navbar">
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/upload">Upload</Link></li>
          <li><Link to="/result">Result</Link></li>
        </ul>
      </nav>

      {/* Content */}
      <div className="center-container">
        <div className="form-box">
          <h1>Diagnosis Result</h1>

          {file ? (
            <>
              <p>File analyzed: <strong>{file.name}</strong></p>

              <div className="result-card">
                <h2>Analysis Outcome</h2>
                <p className="result-text">{getResultText()}</p>
              </div>
            </>
          ) : (
            <p>No file was uploaded.</p>
          )}

          <div style={{ marginTop: "1.5rem" }}>
            <Link to="/upload" className="button">
              Upload Another File
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisResult;
