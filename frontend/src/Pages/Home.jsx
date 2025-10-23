// src/pages/Home.jsx
import React from "react";
import projectImage from "../assets/project-image.jpg"; // Add your image in the assets folder
import "./UploadForm.css";

const Home = () => {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", textAlign: "center", padding: "3rem 2rem" }}>
      {/* Project Image */}
      <img
        src="../../src/assets/project-image.jpg"
        //alt = "Multi-Modal-Deepfake-Detection"
        style={{ width: "40%", maxWidth: "400px", marginTop: "2rem", borderRadius: "5px", boxShadow: "0 2px 4px rgba(12, 6, 184, 0.2)" }}
      />
      {/* Image Name / Caption */}
      <p style={{ marginTop: "1rem", fontStyle: "italic", color: "#333" }}>
        Multi-Modal Deepfake Detection
      </p>
      {/* Project Information */}
        <div className="form-box" style={{ maxWidth: "100%",   // stretch full width
          margin: "3rem auto",
          textAlign: "left",
          padding: "2rem 3rem", }}>
          <h2 style={{ textAlign: "center", color: "#00aaff" }}>About the Project</h2>
          <p style={{ lineHeight: "1.6", fontSize: "1rem" }}>
            This project focuses on Multi-Model Deepfake Detection. It integrates
            video, audio, and behavioral analysis to identify manipulated media in
            real time. The system aims to provide reliable detection across
            different platforms and enhance security and authenticity verification.
            By combining multiple modalities, the model overcomes the limitations
            of single-modality detection systems, offering higher accuracy and
            robustness.
          </p>
          <p style={{ lineHeight: "1.6", fontSize: "1rem" }}>
            The solution is designed to be scalable, making it suitable for
            applications in social media monitoring, digital forensics, and
            cybersecurity. Ultimately, this project contributes to building trust
            in digital content by preventing the spread of misinformation and
            protecting users from malicious deepfake attacks.
          </p>
        </div>

      {/* Contact Details */}
      <div
  className="form-box"
  style={{
    maxWidth: "100%",
    margin: "3rem auto",
    textAlign: "center",
    padding: "2rem 3rem",
  }}
>
  <h2
    style={{
      textAlign: "center",
      color: "#00aaff", // 🌟 light sky blue
    }}
  >
    Contact
  </h2>
  <p>Email: tatikonda2228@gmail.com</p>
  <p>Phone: +91-9010102210</p>
  <p>Address: Gachibowli, Hyderabad, Telangana, India</p>
</div>
    </div>
  );
};

export default Home;
