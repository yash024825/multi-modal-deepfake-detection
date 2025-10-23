import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./UploadForm.css";

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] ?? null);
    setError(""); // clear previous errors on new selection
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

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      navigate("/result", { state: { file, result: data.result } });
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Error uploading file. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <nav className="navbar">
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/upload">Upload</Link></li>
        </ul>
      </nav>

      <div className="center-container">
        <div className="form-box">
          <h2>Upload File for Deepfake Detection</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="file"
              accept="image/*,video/*,audio/*"
              onChange={handleFileChange}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Upload"}
            </button>
          </form>

          {file && (
            <p>
              Selected file: <strong>{file.name}</strong>
            </p>
          )}

          {error && <p className="error">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default UploadForm;
