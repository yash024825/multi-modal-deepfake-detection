"""
extract_frames_v2.py
=====================
Rebuilds datasets/frames_clean/real and datasets/frames_clean/fake directly
from raw video files in datasets/video, recursing into ANY subfolder
structure (it does NOT trust folder names -- we confirmed "Fake dataset"
and "original dataset" are mislabeled relative to their actual content).

Classification is based SOLELY on the filename, using the confirmed
FaceForensics++ convention:
  Real: "<actorID>__<scene>.mp4"             e.g. 01__exit_phone_room.mp4
  Fake: "<actorID>_<actorID>__<scene>__<hash>.mp4"
        e.g. 01_02__exit_phone_room__YVGY8LOK.mp4

Output layout (per-video nested folders -- needed for leak-free train/val
splitting in train_image_v2.py):
  datasets/frames_clean/real/01__exit_phone_room/frame_00000.jpg
  datasets/frames_clean/fake/01_02__exit_phone_room__YVGY8LOK/frame_00000.jpg

FRAME_SAMPLE_INTERVAL controls how many frames you keep -- extracting
EVERY frame from a 24-second clip gives ~700 near-duplicate frames per
video, which mostly adds redundancy, not real information. Sampling every
Nth frame keeps a more diverse, lighter dataset.

Install once: pip install opencv-python

Run from backend/: python extract_frames_v2.py
"""
import os
import cv2

VIDEO_DIR = "datasets/video"            # recurses into all subfolders, regardless of their names
OUTPUT_DIR = "datasets/frames_clean"
FRAME_SAMPLE_INTERVAL = 5               # keep 1 out of every N frames; set to 1 to keep all


def true_label(filename):
    """Return 'real' or 'fake' based purely on the filename pattern, or None if unrecognized."""
    stem = os.path.splitext(filename)[0]
    if "__" not in stem:
        return None
    first_segment = stem.split("__")[0]
    return "fake" if "_" in first_segment else "real"


def find_all_videos(root):
    paths = []
    for dirpath, _, filenames in os.walk(root):
        for f in filenames:
            if f.lower().endswith((".mp4", ".avi", ".mov", ".mkv")):
                paths.append(os.path.join(dirpath, f))
    return paths


def extract(video_path, label, video_stem):
    out_dir = os.path.join(OUTPUT_DIR, label, video_stem)
    os.makedirs(out_dir, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    frame_idx = 0
    saved = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % FRAME_SAMPLE_INTERVAL == 0:
            out_path = os.path.join(out_dir, f"frame_{saved:05d}.jpg")
            cv2.imwrite(out_path, frame)
            saved += 1
        frame_idx += 1
    cap.release()
    return saved


def main():
    all_videos = find_all_videos(VIDEO_DIR)
    print(f"Found {len(all_videos)} video files under {VIDEO_DIR} (all subfolders, names ignored)\n")

    counts = {"real": 0, "fake": 0}
    unrecognized = []

    for video_path in all_videos:
        filename = os.path.basename(video_path)
        label = true_label(filename)
        video_stem = os.path.splitext(filename)[0]

        if label is None:
            unrecognized.append(filename)
            print(f"[skip] {filename} -- doesn't match the expected naming convention")
            continue

        saved = extract(video_path, label, video_stem)
        counts[label] += 1
        print(f"[{label}] {filename} -> {saved} frames saved")

    print("\n========== SUMMARY ==========")
    print(f"Real videos processed: {counts['real']}")
    print(f"Fake videos processed: {counts['fake']}")
    print(f"Unrecognized filenames (skipped): {len(unrecognized)}")
    if unrecognized:
        print("  ", unrecognized[:10], "..." if len(unrecognized) > 10 else "")
    print(f"\nClean dataset written to: {OUTPUT_DIR}/real and {OUTPUT_DIR}/fake")
    print("Point train_image_v2.py's DATA_DIR at this folder once you've spot-checked a few results.")


if __name__ == "__main__":
    main()