// backend/server.js
import express from "express";
import dotenv from "dotenv";
import path from "path";
import multer from "multer";
import cors from "cors";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import fs from "fs";
import { connectDB } from "./app/models/index.js";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

// Enable CORS for React frontend
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

(async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }
})();

// 📁 File Upload Setup

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || "uploads");

// Ensure uploads folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`📂 Created uploads folder at ${uploadDir}`);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// Optional: serve uploaded files (for testing)
app.use("/uploads", express.static(uploadDir));

// -----------------------------
// 🚀 API Route: Deepfake Detection
// -----------------------------
app.post("/api/detect", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const filePath = path.resolve(req.file.path);
  const pythonPath = process.env.PYTHON_PATH || "python";
  const scriptPath = path.join(__dirname, "app", "utils", "main.py");

  console.log(`📂 Uploaded file: ${filePath}`);
  console.log(`⚙️ Running Python script: ${pythonPath} ${scriptPath}`);

  const pyProcess = spawn(pythonPath, [scriptPath, filePath]);

  let result = "";
  pyProcess.stdout.on("data", (data) => (result += data.toString()));
  pyProcess.stderr.on("data", (data) => console.error("❌ Python script error:", data.toString()));

  pyProcess.on("close", (code) => {
    if (code !== 0) return res.status(500).json({ error: "Detection failed" });
    console.log(`✅ Detection result: ${result.trim()}`);
    res.json({ result: result.trim() });
  });
});

// -----------------------------
// 🩺 Health Check Route
// -----------------------------
app.get("/", (req, res) => {
  res.send("✅ Multi-Modal Deepfake Detection API Running...");
});

// -----------------------------
// 🖥️ Start Server
// -----------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
