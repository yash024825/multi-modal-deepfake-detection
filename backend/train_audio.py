import os
import librosa
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader

# =========================
# Paths & Hyperparameters
# =========================
AUDIO_DIR = "datasets/Audio"  # your audio dataset
MODEL_PATH = os.path.join("..", "models", "audio_model.pth")  # save in backend/models
EPOCHS = 5
BATCH_SIZE = 2
LR = 0.001

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# =========================
# Dataset
# =========================
class AudioDataset(Dataset):
    def __init__(self, directory):
        self.files = []
        self.labels = []

        for f in os.listdir(directory):
            if not f.lower().endswith((".wav", ".mp3", ".flac", ".ogg", ".m4a")):
                continue
            file_path = os.path.join(directory, f)
            self.files.append(file_path)
            # Dummy label; replace with real labels if available
            label = 0
            self.labels.append(label)

        if not self.files:
            raise ValueError(f"No valid audio files found in {directory}")

        print(f"📁 Found {len(self.files)} audio files in '{directory}'")

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):
        file = self.files[idx]
        y, sr = librosa.load(file, sr=16000)
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
        mfcc = np.mean(mfcc.T, axis=0)
        return torch.tensor(mfcc, dtype=torch.float32), torch.tensor(self.labels[idx])

# =========================
# Model
# =========================
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

# =========================
# Training
# =========================
dataset = AudioDataset(AUDIO_DIR)
dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)

model = AudioClassifier().to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=LR)

for epoch in range(EPOCHS):
    total_loss = 0
    model.train()
    for mfccs, labels in dataloader:
        mfccs, labels = mfccs.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(mfccs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()

    print(f"[Audio] Epoch {epoch+1}/{EPOCHS}, Loss: {total_loss/len(dataloader):.4f}")

# =========================
# Save Model
# =========================
os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
torch.save(model.state_dict(), MODEL_PATH)
print("✅ Audio model saved at", MODEL_PATH)
