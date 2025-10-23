// src/Pages/Signup.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    if (password !== confirm) {
      alert("Passwords do not match!");
      return;
    }

    // Save user to localStorage
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userPassword", password);

    alert("Signup successful! Please login.");
    navigate("/login"); // Redirect to login
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f5f5f5" }}>
      <div style={{ width: "350px", padding: "2rem", borderRadius: "8px", background: "#fff", boxShadow: "0px 4px 8px rgba(0,0,0,0.1)", textAlign: "center" }}>
        <h2>Sign Up</h2>
        <form onSubmit={handleSignup}>
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "12px", marginBottom: "1rem", borderRadius: "6px", border: "1px solid #ddd", background: "#f0f6ff" }}
          />
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "12px", marginBottom: "1rem", borderRadius: "6px", border: "1px solid #ddd", background: "#f0f6ff" }}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            style={{ width: "100%", padding: "12px", marginBottom: "1.5rem", borderRadius: "6px", border: "1px solid #ddd", background: "#f0f6ff" }}
          />
          <button type="submit" style={{ width: "100%", padding: "12px", background: "#00aaff", color: "#fff", border: "none", borderRadius: "6px", fontSize: "1rem", fontWeight: "bold", cursor: "pointer" }}>
            Sign Up
          </button>
        </form>
        <p style={{ marginTop: "1rem" }}>
          Already have an account? <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
