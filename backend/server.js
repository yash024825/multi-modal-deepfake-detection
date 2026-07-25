import express from "express";
import dotenv from "dotenv";
import path from "path";
import multer from "multer";
import cors from "cors";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import fs from "fs";
import { connectDB } from "./app/models/index.js";

dotenv.config();

const app = express();
app.use(express.json());

/* =========================
   ✅ CORS FIX (IMPORTANT)
   Allows your stable localhost dev URL AND any Vercel deployment --
   production domain or per-deploy preview URL (which changes every
   push, e.g. multi-modal-deepfake-detection-ifxxyuun4.vercel.app).
   This avoids having to update FRONTEND_URL on every deploy.
========================= */
const corsOptions = {
  origin: (origin, callback) => {
    const allowed =
      !origin || // same-origin / server-to-server / curl requests have no Origin header
      /\.vercel\.app$/.test(origin) ||
      origin === "http://localhost:5173";

    if (allowed) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions));

// 🔥 Handle preflight requests
app.options("*", cors(corsOptions));

/* =========================
   🗄️ DATABASE CONNECTION
========================= */
(async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("⚠️ MongoDB connection failed (server will keep running, detection still works):", err.message);
  }
})();

/* =========================
   📁 PATH SETUP
========================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================
   📂 UPLOAD FOLDER
========================= */
const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`📂 Created uploads folder at ${uploadDir}`);
}

/* =========================
   📦 MULTER CONFIG
========================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

app.use("/uploads", express.static(uploadDir));

/* =========================
   🚀 API: DETECTION
========================= */
app.post("/api/detect", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = path.resolve(req.file.path);
  const pythonPath = process.env.PYTHON_PATH || "python";
  const scriptPath = path.join(__dirname, "app", "utils", "main.py");

  console.log("📂 File uploaded:", filePath);

  const pyProcess = spawn(pythonPath, [scriptPath, filePath]);

  let output = "";
  let errorOutput = "";

  pyProcess.stdout.on("data", (data) => {
    output += data.toString();
  });

  pyProcess.stderr.on("data", (data) => {
    errorOutput += data.toString();
    console.error("❌ Python error:", data.toString());
  });

  pyProcess.on("close", (code) => {
    const result = output.trim();

    console.log("🐍 Python exit code:", code);
    console.log("📤 Output:", result);

    // 🔴 SAFE ERROR HANDLING
    if (code !== 0) {
      return res.status(500).json({
        error: "Detection failed",
        details: errorOutput || result || "Unknown error",
      });
    }

    // ✅ SUCCESS RESPONSE
    return res.json({
      result: result.toLowerCase(),
    });
  });
});

/* =========================
   🩺 HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("✅ Multi-Modal Deepfake Detection API Running...");
});

/* =========================
   🚀 START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});