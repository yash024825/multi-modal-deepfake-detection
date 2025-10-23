// backend/app/models/index.js
import mongoose from "mongoose";
import DetectionModel from "./detectionModel.js";

export const connectDB = async (mongoUri) => {
  const uri = mongoUri || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/deepfake";
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
};

export const Detection = DetectionModel;
