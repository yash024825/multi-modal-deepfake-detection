"""
train_image.py
==================
Frame-level deepfake classifier. Updated for the full FF++ dataset
(1000 real + 1000 fake videos, ~70,000+ face-cropped frames).

CPU TUNING vs previous version:
  - N_FOLDS: 5 -> 3
  - EPOCHS: 15 -> 10
  - BATCH_SIZE: 32 -> 64
  - MAX_FRAMES_PER_VIDEO: 20 -> 10
  - get_sampler: skips WeightedRandomSampler if classes within 10% (avoids Windows deadlock)
  - run_epoch: prints batch progress every 50 batches so you know it's alive
  Expected runtime: ~20-40 min per fold, 1-2 hours total on CPU.

PREREQUISITES:
  Run extract_frames_ffpp.py first. Face detection runs once and caches to FACE_DIR.

Run from backend/:
    python train_image.py
"""
import os
import random
import warnings
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
from torchvision import models, transforms
from PIL import Image
from sklearn.metrics import (accuracy_score, precision_recall_fscore_support,
                             confusion_matrix, classification_report)
from sklearn.model_selection import GroupKFold

# ============================================================
# Config
# ============================================================
DATA_DIR   = "datasets/frames_clean"
FACE_DIR   = "datasets/frames_faces"
MODEL_PATH = os.path.join("..", "models", "image_model_v3.pth")

N_FOLDS    = 3       # reduced from 5 -- saves 40% training time on CPU
EPOCHS     = 10      # early stopping will trigger before this most folds
BATCH_SIZE = 64      # larger batches = fewer passes per epoch = faster
LR         = 5e-5
WD         = 1e-4
PATIENCE   = 4
SEED       = 42
FACE_SIZE  = (224, 224)
HAAR_MIN_FACE = 60

MAX_FRAMES_PER_VIDEO = 10   # reduced from 20 -- halves dataset, still representative

random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# ============================================================
# STEP 0 -- Face cropping (runs once, cached)
# ============================================================
def crop_faces(src_dir, dst_dir):
    import cv2
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    if not os.path.exists(cascade_path):
        raise FileNotFoundError(f"Haar cascade not found at {cascade_path}")
    face_cascade = cv2.CascadeClassifier(cascade_path)
    total, saved, skipped = 0, 0, 0

    for cls in ["real", "fake"]:
        src_cls = os.path.join(src_dir, cls)
        if not os.path.isdir(src_cls):
            print(f"[!] {src_cls} not found")
            continue

        video_names = sorted(os.listdir(src_cls))
        print(f"\n  Processing {len(video_names)} {cls} videos...")

        for vi, video_name in enumerate(video_names, 1):
            src_vid = os.path.join(src_cls, video_name)
            dst_vid = os.path.join(dst_dir, cls, video_name)
            if not os.path.isdir(src_vid):
                continue

            if os.path.isdir(dst_vid):
                existing = [f for f in os.listdir(dst_vid) if f.endswith(".jpg")]
                if existing:
                    saved += len(existing)
                    total += len(existing)
                    continue

            os.makedirs(dst_vid, exist_ok=True)
            frame_files = sorted([f for f in os.listdir(src_vid)
                                   if f.lower().endswith((".jpg", ".jpeg", ".png"))])

            if MAX_FRAMES_PER_VIDEO and len(frame_files) > MAX_FRAMES_PER_VIDEO:
                indices = np.linspace(0, len(frame_files) - 1, MAX_FRAMES_PER_VIDEO, dtype=int)
                frame_files = [frame_files[i] for i in indices]

            for fname in frame_files:
                total += 1
                src_path = os.path.join(src_vid, fname)
                dst_path = os.path.join(dst_vid, fname)

                img_bgr = cv2.imread(src_path)
                if img_bgr is None:
                    skipped += 1
                    continue

                gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(
                    gray, scaleFactor=1.1, minNeighbors=5,
                    minSize=(HAAR_MIN_FACE, HAAR_MIN_FACE)
                )
                if len(faces) == 0:
                    skipped += 1
                    continue

                x, y, w, h = max(faces, key=lambda b: b[2] * b[3])
                pad_x = int(w * 0.20)
                pad_y = int(h * 0.20)
                H, W = img_bgr.shape[:2]
                x1, y1 = max(0, x - pad_x), max(0, y - pad_y)
                x2, y2 = min(W, x + w + pad_x), min(H, y + h + pad_y)
                face_crop = img_bgr[y1:y2, x1:x2]
                face_resized = cv2.resize(face_crop, FACE_SIZE, interpolation=cv2.INTER_LINEAR)
                cv2.imwrite(dst_path, face_resized)
                saved += 1

            if vi % 100 == 0:
                print(f"    [{vi}/{len(video_names)}] {cls}: {saved} faces saved so far...")

    print(f"\nFace cropping done: {saved}/{total} frames saved ({skipped} skipped - no face detected)")
    return saved


def ensure_faces(src_dir, dst_dir):
    existing = sum(
        len([f for f in files if f.lower().endswith(".jpg")])
        for _, _, files in os.walk(dst_dir)
    )
    if existing > 1000:
        print(f"Face-cropped frames already exist ({existing:,} files). Skipping crop step.")
        print("Delete datasets/frames_faces to redo face cropping.")
    else:
        print(f"Running face detection: {src_dir} -> {dst_dir}")
        print(f"(This runs once. With {MAX_FRAMES_PER_VIDEO} frames/video cap, expect ~30-60 min on CPU)")
        crop_faces(src_dir, dst_dir)


# ============================================================
# Dataset utilities
# ============================================================
def collect_files(root_dir, max_per_video=None):
    files, labels, groups = [], [], []
    for cls, label in [("real", 0), ("fake", 1)]:
        folder = os.path.join(root_dir, cls)
        if not os.path.isdir(folder):
            print(f"[!] {folder} not found")
            continue

        video_names = sorted(os.listdir(folder))
        for video_name in video_names:
            vdir = os.path.join(folder, video_name)
            if not os.path.isdir(vdir):
                continue

            frame_files = sorted([
                os.path.join(vdir, f) for f in os.listdir(vdir)
                if f.lower().endswith(".jpg")
            ])
            if not frame_files:
                continue

            if max_per_video and len(frame_files) > max_per_video:
                indices = np.linspace(0, len(frame_files) - 1, max_per_video, dtype=int)
                frame_files = [frame_files[i] for i in indices]

            for fp in frame_files:
                files.append(fp)
                labels.append(label)
                groups.append(f"{cls}__{video_name}")

    return files, labels, groups


class FrameDataset(Dataset):
    def __init__(self, files, labels, transform):
        self.files = files
        self.labels = labels
        self.transform = transform

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):
        img = Image.open(self.files[idx]).convert("RGB")
        return self.transform(img), torch.tensor(self.labels[idx], dtype=torch.long)


train_transform = transforms.Compose([
    transforms.Resize(FACE_SIZE),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(10),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1),
    transforms.RandomPerspective(distortion_scale=0.1, p=0.3),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

eval_transform = transforms.Compose([
    transforms.Resize(FACE_SIZE),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])


# ============================================================
# Model: partial fine-tuning of ResNet18
# Freeze layer1+layer2; unfreeze layer3, layer4, fc
# ============================================================
def build_model():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        m = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)

    for name, param in m.named_parameters():
        if name.startswith("layer1") or name.startswith("layer2") or \
           name.startswith("conv1") or name.startswith("bn1"):
            param.requires_grad = False
        else:
            param.requires_grad = True

    m.fc = nn.Sequential(
        nn.Dropout(0.4),
        nn.Linear(m.fc.in_features, 2)
    )
    return m.to(device)


def get_sampler(labels_list):
    """
    Only use WeightedRandomSampler if imbalance > 10%.
    FF++ data is ~50/50 so returns None (plain shuffle used instead).
    This avoids a Windows+PyTorch deadlock with sampler + num_workers=0.
    """
    labels_arr = np.array(labels_list)
    class_counts = np.bincount(labels_arr)
    ratio = min(class_counts) / max(class_counts)
    if ratio > 0.90:
        return None
    print(f"  Class imbalance detected: real={class_counts[0]}, fake={class_counts[1]}")
    print(f"  Using WeightedRandomSampler to balance.")
    weights = 1.0 / class_counts[labels_arr]
    return WeightedRandomSampler(weights, num_samples=len(weights), replacement=True)


# ============================================================
# Training / evaluation
# ============================================================
def run_epoch(model, loader, criterion, optimizer=None):
    is_train = optimizer is not None
    model.train() if is_train else model.eval()
    total_loss, all_preds, all_labels = 0.0, [], []
    ctx = torch.enable_grad() if is_train else torch.no_grad()
    with ctx:
        for batch_idx, (x, y) in enumerate(loader):
            x, y = x.to(device), y.to(device)
            if is_train:
                optimizer.zero_grad()
            out = model(x)
            loss = criterion(out, y)
            if is_train:
                loss.backward()
                optimizer.step()
            total_loss += loss.item() * x.size(0)
            all_preds.extend(out.argmax(1).cpu().numpy())
            all_labels.extend(y.cpu().numpy())
            # Progress so you know it's alive
            if is_train and batch_idx % 50 == 0:
                print(f"    batch {batch_idx}/{len(loader)} loss={loss.item():.4f}", end="\r")

    return total_loss / len(loader.dataset), accuracy_score(all_labels, all_preds), all_labels, all_preds


def train_fold(fold_num, train_files, train_labels_list, val_files, val_labels_list):
    train_ds = FrameDataset(train_files, train_labels_list, train_transform)
    val_ds   = FrameDataset(val_files,   val_labels_list,   eval_transform)

    sampler = get_sampler(train_labels_list)
    train_loader = DataLoader(
        train_ds, batch_size=BATCH_SIZE, num_workers=0,
        sampler=sampler, shuffle=(sampler is None),
        persistent_workers=False, pin_memory=False
    )
    val_loader = DataLoader(
        val_ds, batch_size=BATCH_SIZE, shuffle=False,
        num_workers=0, persistent_workers=False, pin_memory=False
    )

    model     = build_model()
    criterion = nn.CrossEntropyLoss()

    head_params     = list(model.fc.parameters())
    backbone_params = [p for name, p in model.named_parameters()
                       if p.requires_grad and not name.startswith("fc")]
    optimizer = optim.Adam([
        {"params": backbone_params, "lr": LR},
        {"params": head_params,     "lr": LR * 5},
    ], weight_decay=WD)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="min", factor=0.5, patience=2)

    best_val_loss = float("inf")
    best_state    = None
    no_improve    = 0

    for epoch in range(1, EPOCHS + 1):
        tr_loss, tr_acc, _, _ = run_epoch(model, train_loader, criterion, optimizer)
        va_loss, va_acc, _, _ = run_epoch(model, val_loader,   criterion)
        scheduler.step(va_loss)

        print(f"  Fold {fold_num} Ep {epoch:02d}/{EPOCHS} | "
              f"train_loss={tr_loss:.4f} acc={tr_acc:.3f} | "
              f"val_loss={va_loss:.4f} acc={va_acc:.3f}")

        if va_loss < best_val_loss:
            best_val_loss = va_loss
            best_state    = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            no_improve    = 0
        else:
            no_improve += 1
            if no_improve >= PATIENCE:
                print(f"  Early stopping at epoch {epoch}")
                break

    model.load_state_dict(best_state)
    return model


# ============================================================
# Main
# ============================================================
def main():
    ensure_faces(DATA_DIR, FACE_DIR)

    files, labels, groups = collect_files(FACE_DIR, max_per_video=MAX_FRAMES_PER_VIDEO)
    if not files:
        print("[!] No face-cropped images found. Did face cropping succeed?")
        return

    n_groups = len(set(groups))
    labels_arr = np.array(labels)
    groups_arr = np.array(groups)

    real_count = (labels_arr == 0).sum()
    fake_count = (labels_arr == 1).sum()
    print(f"\nFace-cropped dataset: {len(files):,} frames | {n_groups} videos")
    print(f"  Real frames: {real_count:,} | Fake frames: {fake_count:,}")
    print(f"  Approx batches per train epoch: ~{int(len(files)*0.67/BATCH_SIZE)}")

    n_folds = min(N_FOLDS, n_groups)
    gkf = GroupKFold(n_splits=n_folds)
    fold_results = []
    best_overall_model = None
    best_overall_f1 = -1.0

    print(f"\nRunning {n_folds}-fold group-aware cross-validation...")
    print("(Groups = videos -- no video leaks between train and val)\n")

    for fold, (train_idx, val_idx) in enumerate(gkf.split(files, labels_arr, groups_arr), 1):
        train_groups = set(groups_arr[train_idx])
        val_groups   = set(groups_arr[val_idx])
        train_real = (labels_arr[train_idx] == 0).sum()
        train_fake = (labels_arr[train_idx] == 1).sum()
        val_real   = (labels_arr[val_idx]   == 0).sum()
        val_fake   = (labels_arr[val_idx]   == 1).sum()

        print(f"{'='*65}")
        print(f"FOLD {fold}/{n_folds} | "
              f"train={len(train_idx):,} ({train_real}r/{train_fake}f, {len(train_groups)} videos) | "
              f"val={len(val_idx):,} ({val_real}r/{val_fake}f, {len(val_groups)} videos)")
        print(f"{'='*65}")

        train_files  = [files[i] for i in train_idx]
        train_labels = [labels[i] for i in train_idx]
        val_files    = [files[i] for i in val_idx]
        val_labels   = [labels[i] for i in val_idx]

        model = train_fold(fold, train_files, train_labels, val_files, val_labels)

        val_ds     = FrameDataset(val_files, val_labels, eval_transform)
        val_loader = DataLoader(
            val_ds, batch_size=BATCH_SIZE, shuffle=False,
            num_workers=0, persistent_workers=False, pin_memory=False
        )
        criterion  = nn.CrossEntropyLoss()
        _, acc, y_true, y_pred = run_epoch(model, val_loader, criterion)
        prec, rec, f1, _ = precision_recall_fscore_support(
            y_true, y_pred, average="binary", pos_label=1, zero_division=0)

        print(f"\n  Fold {fold}: acc={acc:.4f}  prec={prec:.4f}  rec={rec:.4f}  f1={f1:.4f}")
        print(f"  Confusion matrix:\n{confusion_matrix(y_true, y_pred)}\n")
        fold_results.append({"acc": acc, "prec": prec, "rec": rec, "f1": f1})

        if f1 > best_overall_f1:
            best_overall_f1 = f1
            best_overall_model = {k: v.cpu().clone() for k, v in model.state_dict().items()}

    print("\n" + "="*65)
    print(f"CROSS-VALIDATION SUMMARY ({n_folds} folds)")
    print("="*65)
    for metric in ["acc", "prec", "rec", "f1"]:
        vals = [r[metric] for r in fold_results]
        print(f"{metric.upper():12s}: mean={np.mean(vals):.4f}  std={np.std(vals):.4f}  "
              f"per-fold={[round(v, 3) for v in vals]}")

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    best_model = build_model()
    best_model.load_state_dict(best_overall_model)
    torch.save(best_model.state_dict(), MODEL_PATH)
    print(f"\nBest model (F1={best_overall_f1:.4f}) saved to {MODEL_PATH}")
    print("\nNext: run train_video.py for video-level aggregation.")


if __name__ == "__main__":
    main()