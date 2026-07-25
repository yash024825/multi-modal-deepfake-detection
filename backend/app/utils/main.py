"""
backend/app/utils/main.py
=========================
Deepfake detection inference script. Called by the backend API with:
    python main.py <file_path>

Prints one of: real / fake / error: <reason>

Supports:
  Images : .jpg .jpeg .png
  Videos : .mp4 .avi .mov
  Audio  : .wav .mp3
"""
import sys
import os
import gc
import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models, transforms
from PIL import Image

# ── diagnostics ────────────────────────────────────────────────────────────
# TEMP: prints cv2 build info to stderr on every run so we can see in Render
# logs whether cv2 is the real compiled package or a broken/shadowed import.
# Remove once the CascadeClassifier AttributeError is confirmed fixed.
print(f"[DIAG] cv2 file: {cv2.__file__}", file=sys.stderr)
print(f"[DIAG] cv2 version: {getattr(cv2, '__version__', 'unknown')}", file=sys.stderr)
print(f"[DIAG] has CascadeClassifier: {hasattr(cv2, 'CascadeClassifier')}", file=sys.stderr)
try:
    print(f"[DIAG] haarcascades path: {cv2.data.haarcascades}", file=sys.stderr)
    print(f"[DIAG] haarcascades exists: {os.path.exists(cv2.data.haarcascades)}", file=sys.stderr)
except Exception as e:
    print(f"[DIAG] cv2.data access failed: {e}", file=sys.stderr)

# ── paths ────────────────────────────────────────────────────────────────────
BASE_DIR  = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
MODEL_DIR = os.path.join(BASE_DIR, "models")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Free-tier hosts (Render/Fly/HF Basic) give 1-2 shared vCPUs and little RAM.
# Extra torch threads just fight each other for the same core and inflate
# peak memory; pin to 1 so a single inference process stays lean.
torch.set_num_threads(1)

# ── constants (must match training scripts exactly) ───────────────────────────
FACE_SIZE        = (224, 224)
HAAR_MIN_FACE    = 60
IMAGE_THRESHOLD  = 0.5    # fake_prob > this -> fake
VIDEO_THRESHOLD  = 0.65   # best threshold from train_video.py
AUDIO_N_MFCC     = 40
AUDIO_MAX_FRAMES = 200
AUDIO_SR         = 16000
VIDEO_FRAME_SKIP = 10     # sample every Nth frame (matches training density)
VIDEO_MAX_SAMPLES = 150   # hard cap on sampled frames -- bounds memory/runtime
                           # on free-tier hosts regardless of video length
GC_EVERY_N_SAMPLES = 20   # force garbage collection periodically during video loop

# ── shared image transform (matches eval_transform in train_image.py) ─────────
eval_transform = transforms.Compose([
    transforms.Resize(FACE_SIZE),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225]),
])


# ═════════════════════════════════════════════════════════════════════════════
# Model definitions  (must match train_image.py / train_audio.py exactly)
# ═════════════════════════════════════════════════════════════════════════════
def build_image_model():
    """ResNet18 with partial fine-tuning head -- matches train_image.py build_model()"""
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        m = models.resnet18(weights=None)
    m.fc = nn.Sequential(
        nn.Dropout(0.4),
        nn.Linear(m.fc.in_features, 2)
    )
    return m


class AudioCNN(nn.Module):
    """Small CNN over MFCC map -- matches train_audio.py AudioCNN exactly."""
    def __init__(self):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(1, 16, kernel_size=3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(),
            nn.MaxPool2d(2),

            nn.Conv2d(16, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2),

            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((1, 1)),
        )
        self.fc = nn.Sequential(
            nn.Flatten(),
            nn.Dropout(0.3),
            nn.Linear(64, 2),
        )

    def forward(self, x):
        return self.fc(self.conv(x))


# ═════════════════════════════════════════════════════════════════════════════
# Model loaders
# ═════════════════════════════════════════════════════════════════════════════
def load_image_model(path):
    if not os.path.exists(path):
        return None, f"model file not found: {path}"
    m = build_image_model()
    try:
        m.load_state_dict(torch.load(path, map_location=device))
    except Exception as e:
        return None, f"model load failed: {e}"
    m.to(device).eval()
    return m, None


def load_audio_model(path):
    if not os.path.exists(path):
        return None, f"model file not found: {path}"
    m = AudioCNN()
    try:
        m.load_state_dict(torch.load(path, map_location=device))
    except Exception as e:
        return None, f"model load failed: {e}"
    m.to(device).eval()
    return m, None


# ═════════════════════════════════════════════════════════════════════════════
# Face detection helper
# ═════════════════════════════════════════════════════════════════════════════
_face_cascade = None

def get_face_cascade():
    global _face_cascade
    if _face_cascade is None:
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        _face_cascade = cv2.CascadeClassifier(cascade_path)
    return _face_cascade


def crop_face(img_bgr):
    """
    Detect and crop the largest face from a BGR frame.
    Returns cropped face as PIL Image, or None if no face found.
    Matches the exact crop logic in train_image.py.
    """
    cascade = get_face_cascade()
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5,
        minSize=(HAAR_MIN_FACE, HAAR_MIN_FACE)
    )
    if len(faces) == 0:
        return None

    x, y, w, h = max(faces, key=lambda b: b[2] * b[3])
    pad_x = int(w * 0.20)
    pad_y = int(h * 0.20)
    H, W = img_bgr.shape[:2]
    x1, y1 = max(0, x - pad_x), max(0, y - pad_y)
    x2, y2 = min(W, x + w + pad_x), min(H, y + h + pad_y)
    face_bgr = img_bgr[y1:y2, x1:x2]
    face_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
    return Image.fromarray(face_rgb)


# ═════════════════════════════════════════════════════════════════════════════
# IMAGE inference
# ═════════════════════════════════════════════════════════════════════════════
def predict_image(model, path):
    try:
        img_bgr = cv2.imread(path)
        if img_bgr is None:
            raise ValueError("cv2.imread returned None")
    except Exception as e:
        return "error", f"cannot open image: {e}", 0.0

    # Try face crop first; fall back to full image if no face detected
    face = crop_face(img_bgr)
    if face is not None:
        pil_img = face
    else:
        pil_img = Image.open(path).convert("RGB")

    x = eval_transform(pil_img).unsqueeze(0).to(device)
    with torch.no_grad():
        logits = model(x)
        fake_prob = F.softmax(logits, dim=1)[0, 1].item()

    label = "fake" if fake_prob >= IMAGE_THRESHOLD else "real"
    confidence = fake_prob if label == "fake" else 1.0 - fake_prob
    return label, None, round(confidence * 100, 1)


# ═════════════════════════════════════════════════════════════════════════════
# VIDEO inference  (face crop + softmax aggregation, matches train_video.py)
# ═════════════════════════════════════════════════════════════════════════════
def predict_video(model, path):
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        return "error", "cannot open video", 0.0

    all_probs = []
    frame_idx = 0
    samples_taken = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % VIDEO_FRAME_SKIP == 0:
            face = crop_face(frame)
            if face is not None:
                x = eval_transform(face).unsqueeze(0).to(device)
                with torch.no_grad():
                    logits = model(x)
                    fake_prob = F.softmax(logits, dim=1)[0, 1].item()
                all_probs.append(fake_prob)

                # Explicitly drop references so they don't linger until the
                # next gc cycle -- matters on low-RAM free-tier instances.
                del x, logits
                samples_taken += 1

                if samples_taken % GC_EVERY_N_SAMPLES == 0:
                    gc.collect()

                if samples_taken >= VIDEO_MAX_SAMPLES:
                    break

        frame_idx += 1

    cap.release()
    gc.collect()

    if not all_probs:
        return "error", "no faces detected in video", 0.0

    avg_fake_prob = float(np.mean(all_probs))
    label = "fake" if avg_fake_prob >= VIDEO_THRESHOLD else "real"
    confidence = avg_fake_prob if label == "fake" else 1.0 - avg_fake_prob
    return label, None, round(confidence * 100, 1)


# ═════════════════════════════════════════════════════════════════════════════
# AUDIO inference  (MFCC CNN, matches train_audio.py exactly)
# ═════════════════════════════════════════════════════════════════════════════
def predict_audio(model, path):
    try:
        import librosa
        y, sr = librosa.load(path, sr=AUDIO_SR)
    except Exception as e:
        return "error", f"cannot load audio: {e}", 0.0

    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=AUDIO_N_MFCC)

    # Pad or truncate to fixed length (matches AudioDataset.__getitem__)
    if mfcc.shape[1] < AUDIO_MAX_FRAMES:
        pad = AUDIO_MAX_FRAMES - mfcc.shape[1]
        mfcc = np.pad(mfcc, ((0, 0), (0, pad)), mode="constant")
    else:
        mfcc = mfcc[:, :AUDIO_MAX_FRAMES]

    mfcc = (mfcc - mfcc.mean()) / (mfcc.std() + 1e-6)
    x = torch.tensor(mfcc, dtype=torch.float32).unsqueeze(0).unsqueeze(0).to(device)
    # shape: (1, 1, n_mfcc, max_frames) -- batch=1, channels=1

    with torch.no_grad():
        logits = model(x)
        fake_prob = F.softmax(logits, dim=1)[0, 1].item()

    label = "fake" if fake_prob >= 0.5 else "real"
    confidence = fake_prob if label == "fake" else 1.0 - fake_prob
    return label, None, round(confidence * 100, 1)


# ═════════════════════════════════════════════════════════════════════════════
# MAIN
# ═════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("error: no input file")
        sys.exit(1)

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print("error: file not found")
        sys.exit(1)

    ext = os.path.splitext(file_path)[1].lower()

    # ── Image ──────────────────────────────────────────────────────────────
    if ext in (".jpg", ".jpeg", ".png", ".webp", ".bmp"):
        model_path = os.path.join(MODEL_DIR, "image_model_v3.pth")
        model, err = load_image_model(model_path)
        if err:
            print(f"error: {err}")
            sys.exit(1)
        label, err, confidence = predict_image(model, file_path)

    # ── Video ──────────────────────────────────────────────────────────────
    elif ext in (".mp4", ".avi", ".mov", ".mkv", ".webm"):
        model_path = os.path.join(MODEL_DIR, "image_model_v3.pth")
        model, err = load_image_model(model_path)
        if err:
            print(f"error: {err}")
            sys.exit(1)
        label, err, confidence = predict_video(model, file_path)

    # ── Audio ──────────────────────────────────────────────────────────────
    elif ext in (".wav", ".mp3", ".flac", ".ogg", ".m4a"):
        model_path = os.path.join(MODEL_DIR, "audio_model.pth")
        model, err = load_audio_model(model_path)
        if err:
            print(f"error: {err}")
            sys.exit(1)
        label, err, confidence = predict_audio(model, file_path)

    else:
        print("error: unsupported format")
        sys.exit(1)

    if err:
        print(f"error: {err}")
        sys.exit(1)

    # Output format: "real 94.3" or "fake 87.1"
    # Frontend can split on space to get label + confidence
    print(f"{label} {confidence}")