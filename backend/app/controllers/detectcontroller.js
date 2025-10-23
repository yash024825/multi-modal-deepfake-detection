import { spawn } from "child_process";
import path from "path";

export const detectDeepfake = async (req, res) => {
  try {
    const file = req.file;
    const { modality } = req.body; // "image", "video", or "audio"

    if (!file || !modality) {
      return res.status(400).json({ message: "File and modality required" });
    }

    // ✅ Correct path to evaluate.py (inside backend folder)
    const pyPath = path.join(path.resolve(), "backend", "evaluate.py");

    // ✅ Spawn Python process
    const processPy = spawn("python", [pyPath, modality, file.path]);

    let result = "";
    let errorOutput = "";

    // ✅ Capture stdout (Python normal output)
    processPy.stdout.on("data", (data) => {
      result += data.toString();
    });

    // ✅ Capture stderr (Python errors)
    processPy.stderr.on("data", (data) => {
      console.error(`🔴 Python Error: ${data}`);
      errorOutput += data.toString();
    });

    // ✅ When Python process closes
    processPy.on("close", (code) => {
      if (code !== 0) {
        return res.status(500).json({
          message: "Python script error",
          error: errorOutput.trim() || "Unknown error",
        });
      }

      res.status(200).json({
        message: "Detection completed",
        modality,
        file: file.originalname,
        result: result.trim(),
      });
    });
  } catch (err) {
    console.error("⚠️ Server Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
