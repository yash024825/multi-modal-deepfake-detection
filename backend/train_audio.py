"""
train_audio.py
==================
Rebuilt audio deepfake detector.

SETUP (do this first):
1. Go to https://www.kaggle.com/datasets/mohammedabdeldayem/the-fake-or-real-dataset
   Download the "for-2sec" version (smaller, balanced, fast to train on a laptop).
2. Unzip it. You should get folders like:
       for-2seconds/training/real/*.wav
       for-2seconds/training/fake/*.wav
       for-2seconds/validation/real/*.wav
       for-2seconds/validation/fake/*.wav
       for-2seconds/testing/real/*.wav
       for-2seconds/testing/fake/*.wav
3. Place the "for-2seconds" folder at: backend/datasets/Audio/for-2seconds
   (or change AUDIO_ROOT below to wherever you put it)

   If your download only has real/ and fake/ with no training/validation split,
   that's fine too -- this script auto-detects either layout (see find_split below).

Install once: pip install scikit-learn librosa torch torchvision

Run: python train_audio.py
"""
import os
import random
import numpy as np
import librosa
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix, classification_report

# =========================
# Config
# =========================
AUDIO_ROOT = "datasets/Audio/for-2sec/for-2seconds"   # Kaggle download extracts to this nested path
MODEL_PATH = os.path.join("..", "models", "audio_model.pth")
SAMPLE_RATE = 16000
N_MFCC = 40
MAX_FRAMES = 200          # ~2 seconds of MFCC frames at default hop length; clips/pads to this
EPOCHS = 30
BATCH_SIZE = 16
LR = 1e-3
PATIENCE = 6              # early stopping patience
SEED = 42

random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")


# =========================
# Locate train/val/test split (handles a couple of common layouts)
# =========================
def find_split(root):
    """
    Returns dict of {'train': (real_dir, fake_dir), 'val': (...), 'test': (...)}
    Handles either:
      root/training/real,  root/validation/real, root/testing/real
    or just:
      root/real, root/fake   (we'll carve our own split)
    """
    candidates = {
        "train": ["training", "train"],
        "val":   ["validation", "val", "valid"],
        "test":  ["testing", "test"],
    }
    found = {}
    for split, names in candidates.items():
        for name in names:
            real_dir = os.path.join(root, name, "real")
            fake_dir = os.path.join(root, name, "fake")
            if os.path.isdir(real_dir) and os.path.isdir(fake_dir):
                found[split] = (real_dir, fake_dir)
                break

    if found:
        return found

    # fallback: flat real/fake, we split ourselves
    real_dir = os.path.join(root, "real")
    fake_dir = os.path.join(root, "fake")
    if os.path.isdir(real_dir) and os.path.isdir(fake_dir):
        return {"flat": (real_dir, fake_dir)}

    raise FileNotFoundError(
        f"Couldn't find expected folders under {root}. "
        "Check AUDIO_ROOT and the dataset layout described in the docstring."
    )


def list_files(real_dir, fake_dir):
    files, labels = [], []
    for d, label in [(real_dir, 0), (fake_dir, 1)]:  # 0 = real, 1 = fake
        for f in os.listdir(d):
            if f.lower().endswith((".wav", ".mp3", ".flac", ".ogg", ".m4a")):
                files.append(os.path.join(d, f))
                labels.append(label)
    return files, labels


# =========================
# Dataset
# =========================
class AudioDataset(Dataset):
    def __init__(self, files, labels):
        self.files = files
        self.labels = labels

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):
        path = self.files[idx]
        label = self.labels[idx]
        try:
            y, sr = librosa.load(path, sr=SAMPLE_RATE)
        except Exception as e:
            print(f"[warn] failed to load {path}: {e} -- using silence instead")
            y = np.zeros(SAMPLE_RATE)
            sr = SAMPLE_RATE

        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=N_MFCC)  # shape: (n_mfcc, time)

        # pad or truncate time axis to MAX_FRAMES so batches are uniform shape
        if mfcc.shape[1] < MAX_FRAMES:
            pad_width = MAX_FRAMES - mfcc.shape[1]
            mfcc = np.pad(mfcc, ((0, 0), (0, pad_width)), mode="constant")
        else:
            mfcc = mfcc[:, :MAX_FRAMES]

        mfcc = (mfcc - mfcc.mean()) / (mfcc.std() + 1e-6)  # normalize
        tensor = torch.tensor(mfcc, dtype=torch.float32).unsqueeze(0)  # (1, n_mfcc, time) like a 1-channel image
        return tensor, torch.tensor(label, dtype=torch.long)


# =========================
# Model: small CNN over the MFCC time-frequency map
# (this keeps temporal structure, unlike averaging MFCCs into one vector)
# =========================
class AudioCNN(nn.Module):
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
        x = self.conv(x)
        return self.fc(x)


def run_epoch(model, loader, criterion, optimizer=None):
    is_train = optimizer is not None
    model.train() if is_train else model.eval()

    total_loss, all_preds, all_labels = 0.0, [], []
    context = torch.enable_grad() if is_train else torch.no_grad()
    with context:
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            if is_train:
                optimizer.zero_grad()
            out = model(x)
            loss = criterion(out, y)
            if is_train:
                loss.backward()
                optimizer.step()
            total_loss += loss.item() * x.size(0)
            preds = out.argmax(dim=1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(y.cpu().numpy())

    avg_loss = total_loss / len(loader.dataset)
    acc = accuracy_score(all_labels, all_preds)
    return avg_loss, acc, all_labels, all_preds


def main():
    split = find_split(AUDIO_ROOT)

    if "flat" in split:
        real_dir, fake_dir = split["flat"]
        files, labels = list_files(real_dir, fake_dir)
        idx = list(range(len(files)))
        random.shuffle(idx)
        n_train = int(0.7 * len(idx))
        n_val = int(0.15 * len(idx))
        train_idx, val_idx, test_idx = idx[:n_train], idx[n_train:n_train + n_val], idx[n_train + n_val:]
        train_files = [files[i] for i in train_idx]; train_labels = [labels[i] for i in train_idx]
        val_files   = [files[i] for i in val_idx];   val_labels   = [labels[i] for i in val_idx]
        test_files  = [files[i] for i in test_idx];  test_labels  = [labels[i] for i in test_idx]
    else:
        train_files, train_labels = list_files(*split["train"])
        val_files, val_labels = list_files(*split["val"])
        test_files, test_labels = list_files(*split.get("test", split["val"]))

    print(f"Train: {len(train_files)} | Val: {len(val_files)} | Test: {len(test_files)}")
    if len(train_files) < 50:
        print("[!] Very small training set -- did the dataset download/extract correctly?")

    train_ds = AudioDataset(train_files, train_labels)
    val_ds = AudioDataset(val_files, val_labels)
    test_ds = AudioDataset(test_files, test_labels)

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    model = AudioCNN().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LR)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="min", factor=0.5, patience=2)

    best_val_loss = float("inf")
    epochs_no_improve = 0
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

    for epoch in range(1, EPOCHS + 1):
        train_loss, train_acc, _, _ = run_epoch(model, train_loader, criterion, optimizer)
        val_loss, val_acc, _, _ = run_epoch(model, val_loader, criterion)
        scheduler.step(val_loss)

        print(f"Epoch {epoch:02d}/{EPOCHS} | train_loss={train_loss:.4f} train_acc={train_acc:.3f} "
              f"| val_loss={val_loss:.4f} val_acc={val_acc:.3f}")

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            epochs_no_improve = 0
            torch.save(model.state_dict(), MODEL_PATH)
            print(f"   -> saved new best model (val_loss={val_loss:.4f})")
        else:
            epochs_no_improve += 1
            if epochs_no_improve >= PATIENCE:
                print(f"Early stopping at epoch {epoch} (no val improvement for {PATIENCE} epochs)")
                break

    # Final evaluation on the held-out test set using the BEST saved model
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    test_loss, test_acc, y_true, y_pred = run_epoch(model, test_loader, criterion)
    precision, recall, f1, _ = precision_recall_fscore_support(y_true, y_pred, average="binary", pos_label=1)

    print("\n========== FINAL TEST RESULTS (held-out set, never seen during training) ==========")
    print(f"Accuracy:  {test_acc:.4f}")
    print(f"Precision: {precision:.4f}  (of predicted fakes, how many were actually fake)")
    print(f"Recall:    {recall:.4f}  (of actual fakes, how many were caught)")
    print(f"F1 score:  {f1:.4f}")
    print("\nConfusion matrix (rows=true, cols=pred) [real, fake]:")
    print(confusion_matrix(y_true, y_pred))
    print("\n", classification_report(y_true, y_pred, target_names=["real", "fake"]))
    print(f"\nBest model saved at: {MODEL_PATH}")


if __name__ == "__main__":
    main()