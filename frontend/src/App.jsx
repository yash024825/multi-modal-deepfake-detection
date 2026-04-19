// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "./Pages/Home.jsx";
import UploadForm from "./Pages/UploadMediaPage.jsx";
import DiagnosisResult from "./Pages/Result.jsx";
import Login from "./Pages/Login.jsx";
import Signup from "./Pages/Signup.jsx";
import Profile from "./Pages/Profile.jsx";

/* ---------------- Protected Route ---------------- */
const ProtectedRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

/* ---------------- App ---------------- */
const App = () => {
  return (
    <Router>
      <Routes>

        {/* 🔵 Default route redirect */}
        <Route path="/" element={<Home />} />

        {/* 🔵 Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* 🔒 Protected routes */}
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/result"
          element={
            <ProtectedRoute>
              <DiagnosisResult />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* 🔴 Catch unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
};

export default App;