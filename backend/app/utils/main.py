import sys
import os
import cv2
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from collections import Counter

# ============================================================
# 🔧 Path Setup
# ============================================================

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
MODEL_DIR = os.path.join(BASE_DIR, "models")  # backend/models

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ============================================================
# 🧩 Function: Load Model
# ============================================================

def load_model(model_path, model_type="resnet"):
    if not os.path.exists(model_path):
        print(f"error: Model file not found: {model_path}")
        return None

    if model_type == "resnet":  # image/video
        model = models.resnet18(weights=None)
        model.fc = nn.Linear(model.fc.in_features, 2)
    elif model_type == "audio":  # audio
        class AudioClassifier(nn.Module):
            def __init__(self):
                super(AudioClassifier, self).__init__()
                self.fc = nn.Sequential(
                    nn.Linear(40, 64),
                    nn.ReLU(),
                    nn.Dropout(0.3),
                    nn.Linear(64, 2)
                )

            def forward(self, x):
                return self.fc(x)
        model = AudioClassifier()
    else:
        print("error: unknown model type")
        return None

    try:
        model.load_state_dict(torch.load(model_path, map_location=device))
    except Exception as e:
        print(f"error: failed to load model: {e}")
        return None

    model = model.to(device)
    model.eval()
    return model

# ============================================================
# 🧠 Function: Predict on Image
# ============================================================

def predict_image(model, img_path):
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.224, 0.225])
    ])
    try:
        img = Image.open(img_path).convert("RGB")
    except Exception:
        return "error: cannot open image"

    tensor = transform(img).unsqueeze(0).to(device)
    with torch.no_grad():
        outputs = model(tensor)
        _, pred = torch.max(outputs, 1)

    classes = ["real", "fake"]
    return classes[pred.item()]

# ============================================================
# 🎥 Function: Predict on Video
# ============================================================

def predict_video(model, video_path, every_n_frames=30, max_frames=20):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return "error: cannot open video"

    frame_count, saved_preds = 0, []
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.224, 0.225])
    ])
    classes = ["real", "fake"]

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_count % every_n_frames == 0:
            img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            tensor = transform(img).unsqueeze(0).to(device)
            with torch.no_grad():
                outputs = model(tensor)
                _, pred = torch.max(outputs, 1)
            saved_preds.append(classes[pred.item()])
            if len(saved_preds) >= max_frames:
                break
        frame_count += 1

    cap.release()
    if not saved_preds:
        return "error: no frames processed"
    return Counter(saved_preds).most_common(1)[0][0]

# ============================================================
# 🔈 Function: Predict on Audio
# ============================================================

def predict_audio(model, audio_path):
    if not os.path.exists(audio_path):
        return "error: file not found"
    
    import librosa
    y, sr = librosa.load(audio_path, sr=16000)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
    mfcc = torch.tensor(mfcc.mean(axis=1), dtype=torch.float32).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(mfcc)
        _, pred = torch.max(outputs, 1)
    classes = ["real", "fake"]
    return classes[pred.item()]

# ============================================================
# 🚀 Main Execution
# ============================================================

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("error: no input file provided")
        sys.exit(1)

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(f"error: input file not found: {file_path}")
        sys.exit(1)

    ext = os.path.splitext(file_path)[1].lower()

    # Select model type & path
    if ext in [".jpg", ".jpeg", ".png"]:
        model_path = os.path.join(MODEL_DIR, "saved_model.pth")
        model_type = "resnet"
    elif ext in [".mp4", ".avi", ".mov", ".mkv"]:
        model_path = os.path.join(MODEL_DIR, "video_model.pth")
        model_type = "resnet"
    elif ext in [".wav", ".mp3"]:
        model_path = os.path.join(MODEL_DIR, "audio_model.pth")
        model_type = "audio"
    else:
        print("unsupported file format")
        sys.exit(0)

    # Load model
    model = load_model(model_path, model_type=model_type)

    # Predict
    if ext in [".jpg", ".jpeg", ".png"]:
        result = predict_image(model, file_path) if model else "error: model not loaded"
    elif ext in [".mp4", ".avi", ".mov", ".mkv"]:
        result = predict_video(model, file_path) if model else "error: model not loaded"
    elif ext in [".wav", ".mp3"]:
        result = predict_audio(model, file_path) if model else "error: model not loaded"
    else:
        result = "unsupported"

    print(result)
