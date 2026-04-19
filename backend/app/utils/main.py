import sys
import os
import cv2
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from collections import Counter

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
MODEL_DIR = os.path.join(BASE_DIR, "models")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# =========================
# LOAD MODEL (SAFE)
# =========================
def load_model(model_path, model_type="resnet"):
    if not os.path.exists(model_path):
        print("error: model file not found")
        return None

    if model_type == "resnet":
        model = models.resnet18(weights=None)
        model.fc = nn.Linear(model.fc.in_features, 2)
    else:
        class AudioClassifier(nn.Module):
            def __init__(self):
                super().__init__()
                self.fc = nn.Sequential(
                    nn.Linear(40, 64),
                    nn.ReLU(),
                    nn.Dropout(0.3),
                    nn.Linear(64, 2)
                )

            def forward(self, x):
                return self.fc(x)

        model = AudioClassifier()

    try:
        model.load_state_dict(torch.load(model_path, map_location=device))
    except Exception as e:
        print(f"error: model load failed {e}")
        return None

    model.to(device)
    model.eval()
    return model


# =========================
# IMAGE
# =========================
def predict_image(model, path):
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
    ])

    try:
        img = Image.open(path).convert("RGB")
    except:
        return "error: cannot open image"

    x = transform(img).unsqueeze(0).to(device)

    with torch.no_grad():
        out = model(x)
        _, pred = torch.max(out, 1)

    return ["real", "fake"][pred.item()]


# =========================
# VIDEO
# =========================
def predict_video(model, path):
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        return "error: cannot open video"

    preds = []
    count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if count % 30 == 0:
            img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            tensor = transforms.ToTensor()(img).unsqueeze(0).to(device)

            with torch.no_grad():
                out = model(tensor)
                _, pred = torch.max(out, 1)

            preds.append(["real", "fake"][pred.item()])

        count += 1

    cap.release()

    if not preds:
        return "error: no frames"

    return Counter(preds).most_common(1)[0][0]


# =========================
# AUDIO
# =========================
def predict_audio(model, path):
    import librosa

    try:
        y, sr = librosa.load(path, sr=16000)
    except:
        return "error: cannot load audio"

    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
    x = torch.tensor(mfcc.mean(axis=1)).unsqueeze(0).to(device)

    with torch.no_grad():
        out = model(x)
        _, pred = torch.max(out, 1)

    return ["real", "fake"][pred.item()]


# =========================
# MAIN
# =========================
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("error: no input file")
        sys.exit(1)

    file_path = sys.argv[1]

    if not os.path.exists(file_path):
        print("error: file not found")
        sys.exit(1)

    ext = os.path.splitext(file_path)[1].lower()

    if ext in [".jpg", ".jpeg", ".png"]:
        model_path = os.path.join(MODEL_DIR, "saved_model.pth")
        model = load_model(model_path)

        if model is None:
            print("error: model load failed")
            sys.exit(1)

        print(predict_image(model, file_path))

    elif ext in [".mp4", ".avi", ".mov"]:
        model_path = os.path.join(MODEL_DIR, "video_model.pth")
        model = load_model(model_path)

        if model is None:
            print("error: model load failed")
            sys.exit(1)

        print(predict_video(model, file_path))

    elif ext in [".wav", ".mp3"]:
        model_path = os.path.join(MODEL_DIR, "audio_model.pth")
        model = load_model(model_path, model_type="audio")

        if model is None:
            print("error: model load failed")
            sys.exit(1)

        print(predict_audio(model, file_path))

    else:
        print("error: unsupported format")
        sys.exit(1)