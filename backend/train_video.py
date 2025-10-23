import os
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import models, transforms, datasets
from torch.utils.data import DataLoader

# =========================
# Paths and Hyperparameters
# =========================
DATA_DIR = "datasets/frames"
MODEL_PATH = os.path.join("..", "models", "video_model.pth")  # save in backend/models
EPOCHS = 5
BATCH_SIZE = 16
LR = 0.001

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# =========================
# Dataset & DataLoader
# =========================
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])

dataset = datasets.ImageFolder(DATA_DIR, transform=transform)
dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)

# =========================
# Model, Loss, Optimizer
# =========================
model = models.resnet18(pretrained=True)
model.fc = nn.Linear(model.fc.in_features, 2)
model = model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=LR)

# =========================
# Training Loop
# =========================
for epoch in range(EPOCHS):
    total_loss = 0
    model.train()
    for imgs, labels in dataloader:
        imgs, labels = imgs.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(imgs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
    print(f"[Video] Epoch {epoch+1}/{EPOCHS}, Loss: {total_loss/len(dataloader):.4f}")

# =========================
# Save Model
# =========================
os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
torch.save(model.state_dict(), MODEL_PATH)
print("✅ Video model saved at", MODEL_PATH)
