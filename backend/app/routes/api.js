import express from "express";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

export default function apiRoutes(upload) {
  router.post("/detect", upload.single("file"), (req, res) => {
    if (!req.file) {
      console.error("❌ No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = path.resolve(req.file.path);
    const pythonPath = process.env.PYTHON_PATH || "python";
    const scriptPath = path.resolve("./app/utils/main.py");

    console.log("========================================");
    console.log(`📁 File received: ${filePath}`);
    console.log(`🐍 Python path: ${pythonPath}`);
    console.log(`📜 Script path: ${scriptPath}`);
    console.log("========================================");

    // Run Python script
    const py = spawn(pythonPath, [scriptPath, filePath], {
      cwd: path.resolve("./"),
    });

    let result = "";
    let errorOutput = "";

    py.stdout.on("data", (data) => {
      console.log("📤 Python stdout:", data.toString());
      result += data.toString();
    });

    py.stderr.on("data", (data) => {
      console.error("🐍 Python stderr:", data.toString());
      errorOutput += data.toString();
    });

    py.on("close", (code) => {
      console.log(`✅ Python finished with exit code ${code}`);
      fs.unlink(filePath, (err) => {
        if (err) console.error("⚠️ Error deleting file:", err);
      });

      if (code !== 0) {
        console.error("❌ Python failed to run properly.");
        return res.status(500).json({
          error: "Python script execution failed",
          details: errorOutput.trim(),
        });
      }

      res.json({ result: result.trim() || "No output from script" });
    });

    py.on("error", (err) => {
      console.error("🚨 Failed to start Python process:", err);
      res.status(500).json({
        error: "Failed to start Python process",
        details: err.message,
      });
    });
  });

  return router;
}
