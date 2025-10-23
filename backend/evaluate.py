import sys
import os
import torch
import numpy as np
from torchvision import transforms, models
from PIL import Image
import librosa
import cv2

# ---------------- SETUP ----------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # ensures models are loaded from backend/

# ---------------- IMAGE MODEL ----------------
def load_image_model():
    model_path = os.path.join(BASE_DIR, "saved_model.pth")
    model = models.resnet18(pretrained=False)
    model.fc = torch.nn.Linear(model.fc.in_features, 2)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()
    return model

# ---------------- VIDEO MODEL ----------------
def load_video_model():
    model_path = os.path.join(BASE_DIR, "video_model.pth")
    model = models.resnet18(pretrained=False)
    model.fc = torch.nn.Linear(model.fc.in_features, 2)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()
    return model

# ---------------- AUDIO MODEL ----------------
def load_audio_model():
    model_path = os.path.join(BASE_DIR, "audio_model.pth")

    class AudioClassifier(torch.nn.Module):
        def __init__(self):
            super().__init__()
            self.fc = torch.nn.Sequential(
                torch.nn.Linear(40, 64),
                torch.nn.ReLU(),
                torch.nn.Linear(64, 2)
            )

        def forward(self, x):
            return self.fc(x)

    model = AudioClassifier()
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()
    return model

# ---------------- IMAGE PREDICTION ----------------
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

def predict_image(image_path):
    model = load_image_model()
    img = Image.open(image_path).convert("RGB")
    img = transform(img).unsqueeze(0)
    with torch.no_grad():
        outputs = model(img)
    _, predicted = outputs.max(1)
    return "real" if predicted.item() == 1 else "fake"

# ---------------- VIDEO PREDICTION ----------------
def predict_video(video_path):
    model = load_video_model()
    cap = cv2.VideoCapture(video_path)
    preds = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame = cv2.resize(frame, (224, 224))
        img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        tensor = transform(img).unsqueeze(0)
        with torch.no_grad():
            outputs = model(tensor)
            _, predicted = outputs.max(1)
            preds.append(predicted.item())
    cap.release()
    return "real" if preds.count(1) > preds.count(0) else "fake"

# ---------------- AUDIO PREDICTION ----------------
def predict_audio(audio_path):
    model = load_audio_model()
    y, sr = librosa.load(audio_path, sr=16000)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
    mfcc = np.mean(mfcc.T, axis=0)
    x = torch.tensor(mfcc, dtype=torch.float32).unsqueeze(0)
    with torch.no_grad():
        outputs = model(x)
        _, predicted = outputs.max(1)
    return "real" if predicted.item() == 1 else "fake"

# ---------------- MAIN ENTRY ----------------
if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python evaluate.py <modality> <file_path>")
        sys.exit(1)

    modality, path = sys.argv[1], sys.argv[2]

    print(f"🧠 Evaluating file: {path}")
    print(f"🔍 Modality: {modality}")

    try:
        if modality == "image":
            result = predict_image(path)
        elif modality == "video":
            result = predict_video(path)
        elif modality == "audio":
            result = predict_audio(path)
        else:
            raise ValueError("Invalid modality. Choose from [image, video, audio]")

        print(result)

    except Exception as e:
        print(f"❌ Error during evaluation: {e}")
        sys.exit(1)
