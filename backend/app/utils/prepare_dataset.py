import os
import shutil

# Example: Split dataset into real/fake folders for training
SRC_DIR = "datasets/frames"
DEST_DIR = "datasets/frames_prepared"

os.makedirs(os.path.join(DEST_DIR, "real"), exist_ok=True)
os.makedirs(os.path.join(DEST_DIR, "fake"), exist_ok=True)

for file in os.listdir(SRC_DIR):
    if "real" in file.lower():
        shutil.copy(os.path.join(SRC_DIR, file), os.path.join(DEST_DIR, "real", file))
    else:
        shutil.copy(os.path.join(SRC_DIR, file), os.path.join(DEST_DIR, "fake", file))

print("✅ Dataset prepared in", DEST_DIR)
