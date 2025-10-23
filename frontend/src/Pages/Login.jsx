// src/Pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    const savedEmail = localStorage.getItem("userEmail");
    const savedPassword = localStorage.getItem("userPassword");

    if (email === savedEmail && password === savedPassword) {
      alert("Login successful!");
      localStorage.setItem("isLoggedIn", "true"); // store login status
      navigate("/home"); // redirect to home page
    } else {
      alert("Invalid email or password!");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f5f5f5" }}>
      <div style={{ width: "350px", padding: "2rem", borderRadius: "8px", background: "#fff", boxShadow: "0px 4px 8px rgba(0,0,0,0.1)", textAlign: "center" }}>
        <h2 style={{ marginBottom: "1.5rem", color: "#222" }}>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Enter Email or ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "12px", marginBottom: "1rem", borderRadius: "6px", border: "1px solid #ddd", background: "#f0f6ff" }}
          />
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "12px", marginBottom: "1.5rem", borderRadius: "6px", border: "1px solid #ddd", background: "#f0f6ff" }}
          />
          <button type="submit" style={{ width: "100%", padding: "12px", background: "#00aaff", color: "#fff", border: "none", borderRadius: "6px", fontSize: "1rem", fontWeight: "bold", cursor: "pointer" }}>
            Log in
          </button>
        </form>
        <p style={{ marginTop: "1rem" }}>
          <Link to="/forgot-password" style={{ color: "black", textDecoration: "none" }}>
            Lost password?
          </Link>
        </p>
        <p>
          Don’t have an account?{" "}
          <Link to="/signup" style={{ color: "blue", textDecoration: "none" }}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
