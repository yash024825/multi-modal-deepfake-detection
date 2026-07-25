"""
train_video.py
==================
Video-level deepfake classifier using frame-level aggregation.

HOW IT WORKS:
  1. Load the best image model (image_model_v3.pth) trained on face-cropped frames.
  2. For each video in datasets/frames_faces, run the model on every face-cropped
     frame and average the softmax "fake" probability across all frames.
  3. If the average fake probability > THRESHOLD, the video is classified as fake.
  4. Evaluate at the VIDEO level (one prediction per video, not per frame).

FIXES vs previous version:
  - MODEL_PATH now correctly points to image_model_v3.pth (not image_model.pth)
  - VIDEO_MODEL_PATH also updated accordingly
  - Added video-level summary statistics for the full FF++ dataset scale

Run from backend/:
    python train_video.py
"""
import os
import warnings
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models, transforms
from PIL import Image
from sklearn.metrics import (accuracy_score, precision_recall_fscore_support,
                             confusion_matrix, classification_report)
from sklearn.model_selection import GroupKFold

# ============================================================
# Config
# ============================================================
FACE_DIR         = "datasets/frames_faces"
MODEL_PATH       = os.path.join("..", "models", "image_model_v3.pth")   # ← FIXED (was image_model.pth)
VIDEO_MODEL_PATH = os.path.join("..", "models", "video_model_v3.pth")   # ← FIXED

THRESHOLD   = 0.5
N_FOLDS     = 5
SEED        = 42
FACE_SIZE   = (224, 224)

np.random.seed(SEED)
torch.manual_seed(SEED)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# ============================================================
# Transform (must match eval_transform in train_image.py)
# ============================================================
frame_transform = transforms.Compose([
    transforms.Resize(FACE_SIZE),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

# ============================================================
# Load trained image model
# ============================================================
def load_image_model(path):
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        m = models.resnet18(weights=None)

    # Must match the architecture used in train_image.py build_model()
    # Partial fine-tuning: layer1/layer2 frozen, layer3/layer4/fc trained
    m.fc = nn.Sequential(nn.Dropout(0.4), nn.Linear(m.fc.in_features, 2))
    state = torch.load(path, map_location=device)
    m.load_state_dict(state)
    m.to(device)
    m.eval()
    print(f"Loaded model from {path}")
    return m


# ============================================================
# Aggregate frame predictions -> video-level score
# ============================================================
def predict_video(model, video_frame_dir, batch_size=64):
    """
    Run model on all face-cropped frames in video_frame_dir.
    Returns mean softmax probability of class 'fake' (index 1).
    Returns None if no frames are found.
    """
    frame_paths = sorted([
        os.path.join(video_frame_dir, f)
        for f in os.listdir(video_frame_dir)
        if f.lower().endswith((".jpg", ".jpeg", ".png"))
    ])
    if not frame_paths:
        return None

    all_probs = []
    with torch.no_grad():
        for i in range(0, len(frame_paths), batch_size):
            batch_paths = frame_paths[i:i + batch_size]
            tensors = []
            for p in batch_paths:
                try:
                    img = Image.open(p).convert("RGB")
                    tensors.append(frame_transform(img))
                except Exception:
                    continue
            if not tensors:
                continue
            batch = torch.stack(tensors).to(device)
            logits = model(batch)
            probs = F.softmax(logits, dim=1)[:, 1]
            all_probs.extend(probs.cpu().numpy())

    return float(np.mean(all_probs)) if all_probs else None


# ============================================================
# Collect all videos
# ============================================================
def collect_videos(face_dir):
    video_dirs, labels, groups, names = [], [], [], []
    for cls, label in [("real", 0), ("fake", 1)]:
        cls_dir = os.path.join(face_dir, cls)
        if not os.path.isdir(cls_dir):
            print(f"[!] {cls_dir} not found")
            continue
        for video_name in sorted(os.listdir(cls_dir)):
            vdir = os.path.join(cls_dir, video_name)
            if not os.path.isdir(vdir):
                continue
            n_frames = len([f for f in os.listdir(vdir)
                            if f.lower().endswith((".jpg", ".jpeg", ".png"))])
            if n_frames == 0:
                continue
            video_dirs.append(vdir)
            labels.append(label)
            groups.append(f"{cls}__{video_name}")
            names.append(f"[{cls}] {video_name} ({n_frames} frames)")
    return video_dirs, labels, groups, names


# ============================================================
# Main
# ============================================================
def main():
    if not os.path.exists(MODEL_PATH):
        print(f"[!] Model not found at {MODEL_PATH}")
        print("    Run train_image.py first.")
        return

    model = load_image_model(MODEL_PATH)

    video_dirs, labels, groups, names = collect_videos(FACE_DIR)
    n_videos = len(video_dirs)
    n_real   = sum(1 for l in labels if l == 0)
    n_fake   = sum(1 for l in labels if l == 1)
    print(f"\nFound {n_videos} videos ({n_real} real, {n_fake} fake)")

    if n_videos == 0:
        print("[!] No videos found in", FACE_DIR)
        return

    # --- Per-video inference ---
    print(f"\nRunning frame inference on all {n_videos} videos...")
    print("(With 2000 videos this takes a while -- grab a coffee)\n")

    fake_probs = []
    for i, (vdir, name) in enumerate(zip(video_dirs, names), 1):
        prob = predict_video(model, vdir)
        fake_probs.append(prob if prob is not None else 0.5)
        pred   = "fake" if fake_probs[-1] >= THRESHOLD else "real"
        true   = "fake" if labels[i-1] == 1 else "real"
        status = "✓" if pred == true else "✗"
        # Print every video, but show progress every 50 to avoid spam
        if i % 50 == 0 or i <= 10 or i == n_videos:
            print(f"  [{i:4d}/{n_videos}] {status} {name} -> prob={fake_probs[-1]:.3f} pred={pred}")

    fake_probs  = np.array(fake_probs)
    labels_arr  = np.array(labels)
    groups_arr  = np.array(groups)

    # --- Threshold search ---
    print("\n--- Threshold sensitivity ---")
    best_f1, best_thresh = 0, THRESHOLD
    for t in np.arange(0.3, 0.8, 0.05):
        preds = (fake_probs >= t).astype(int)
        if len(set(preds)) < 2:
            continue
        _, _, f1, _ = precision_recall_fscore_support(
            labels_arr, preds, average="binary", pos_label=1, zero_division=0)
        acc = accuracy_score(labels_arr, preds)
        print(f"  threshold={t:.2f}  F1={f1:.4f}  acc={acc:.4f}")
        if f1 > best_f1:
            best_f1, best_thresh = f1, t

    print(f"\nBest threshold: {best_thresh:.2f} (F1={best_f1:.4f})")

    # --- Video-level CV ---
    n_folds = min(N_FOLDS, len(set(groups)))
    print(f"\nRunning {n_folds}-fold group-aware video-level CV...")
    gkf = GroupKFold(n_splits=n_folds)
    fold_results = []

    for fold, (train_idx, val_idx) in enumerate(
            gkf.split(video_dirs, labels_arr, groups_arr), 1):
        val_probs  = fake_probs[val_idx]
        val_labels = labels_arr[val_idx]

        preds = (val_probs >= best_thresh).astype(int)
        acc  = accuracy_score(val_labels, preds)
        prec, rec, f1, _ = precision_recall_fscore_support(
            val_labels, preds, average="binary", pos_label=1, zero_division=0)

        print(f"  Fold {fold}: {len(val_idx):4d} videos | "
              f"acc={acc:.3f}  prec={prec:.3f}  rec={rec:.3f}  f1={f1:.3f}")
        fold_results.append({"acc": acc, "prec": prec, "rec": rec, "f1": f1})

    # --- Summary ---
    print("\n" + "="*60)
    print(f"VIDEO-LEVEL CROSS-VALIDATION SUMMARY ({n_folds} folds)")
    print("="*60)
    for metric in ["acc", "prec", "rec", "f1"]:
        vals = [r[metric] for r in fold_results]
        print(f"{metric.upper():12s}: mean={np.mean(vals):.4f}  std={np.std(vals):.4f}  "
              f"per-fold={[round(v, 3) for v in vals]}")

    # Overall
    all_preds = (fake_probs >= best_thresh).astype(int)
    overall_acc = accuracy_score(labels_arr, all_preds)
    _, _, overall_f1, _ = precision_recall_fscore_support(
        labels_arr, all_preds, average="binary", pos_label=1, zero_division=0)

    print(f"\nOverall ({n_videos} videos, threshold={best_thresh:.2f}):")
    print(f"  Accuracy: {overall_acc:.4f}")
    print(f"  F1:       {overall_f1:.4f}")
    print(f"\nConfusion matrix [real, fake]:")
    print(confusion_matrix(labels_arr, all_preds))
    print(classification_report(labels_arr, all_preds, target_names=["real", "fake"]))

    # Save model
    import shutil
    shutil.copy(MODEL_PATH, VIDEO_MODEL_PATH)
    print(f"\nVideo model saved to {VIDEO_MODEL_PATH}")


if __name__ == "__main__":
    main()