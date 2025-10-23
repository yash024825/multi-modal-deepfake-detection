// backend/app/models/detectionModel.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const DetectionSchema = new Schema(
  {
    filename: { type: String, required: true },
    filepath: { type: String }, // local path (optional)
    modality: {
      type: String,
      enum: ["image", "video", "audio"],
      required: true,
    },
    result: {
      type: String,
      enum: ["real", "fake", "error", "unknown"],
      required: true,
    },
    confidence: { type: Number, default: null }, // optional, 0-1
    meta: { type: Schema.Types.Mixed }, // any extra info (frame count, timings)
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Detection", DetectionSchema);
