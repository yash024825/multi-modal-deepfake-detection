// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "./Pages/Home.jsx";
import UploadForm from "./Pages/UploadForm.jsx";
import DiagnosisResult from "./Pages/DiagnosisResult.jsx";
import Login from "./Pages/Login.jsx";
import Signup from "./Pages/Signup.jsx";

const Navbar = () => {
  const location = useLocation();

  // Hide Navbar on login, signup, and result pages
  if (location.pathname === "/" || location.pathname === "/signup" || location.pathname === "/result") {
    return null;
  }

  return (
    <nav style={{ background: "#222", padding: "1rem" }}>
      <ul
        style={{
          listStyle: "none",
          display: "flex",
          gap: "2rem",
          margin: 0,
          padding: 0,
          justifyContent: "center",
        }}
      >
        <li>
          <Link to="/home" style={{ color: "white", textDecoration: "none" }}>
            Home
          </Link>
        </li>
        <li>
          <Link to="/upload" style={{ color: "white", textDecoration: "none" }}>
            Upload
          </Link>
        </li>
      </ul>
    </nav>
  );
};

const App = () => {
  return (
    <Router>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/home" element={<Home />} />
          <Route path="/upload" element={<UploadForm />} />
          <Route path="/result" element={<DiagnosisResult />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
