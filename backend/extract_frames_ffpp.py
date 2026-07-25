"""
extract_frames_ffpp.py
======================
Extracts frames from the FaceForensics++ dataset downloaded via the
official FF++ download script. Handles BOTH real and fake video folders.

EXPECTED INPUT STRUCTURE (what the FF++ download script produces):
  datasets/
    original_sequences/
      youtube/
        c40/
          videos/
            000.mp4, 001.mp4, ...   <- REAL videos
    manipulated_sequences/
      Deepfakes/
        c40/
          videos/
            000_003.mp4, 001_004.mp4, ...   <- FAKE videos

OUTPUT STRUCTURE (per-video nested folders for leak-free CV splitting):
  datasets/frames_clean/
    real/
      000/
        frame_00000.jpg, frame_00001.jpg, ...
    fake/
      000_003/
        frame_00000.jpg, ...

NOTES:
- Label is determined by FOLDER PATH (real vs fake), NOT filename.
- FRAME_SAMPLE_INTERVAL=10 gives ~30-50 frames per 10-second clip at 30fps.
  With 1000 videos per class that's ~35,000-50,000 frames per class.
  Set lower (e.g. 5) for more frames; set higher (e.g. 15) for faster run.
- Existing output folders are SKIPPED on re-run (safe to interrupt and resume).
- Run from backend/: python extract_frames_ffpp.py
"""

import os
import cv2
from pathlib import Path

# ============================================================
# Config -- edit these paths if your download landed elsewhere
# ============================================================
REAL_VIDEO_DIR = os.path.join("datasets", "original_sequences", "youtube", "c40", "videos")
FAKE_VIDEO_DIR = os.path.join("datasets", "manipulated_sequences", "Deepfakes", "c40", "videos")
OUTPUT_DIR     = os.path.join("datasets", "frames_clean")

FRAME_SAMPLE_INTERVAL = 10   # keep 1 of every N frames
MAX_VIDEOS_PER_CLASS  = None  # set to e.g. 200 to cap during testing; None = use all
VIDEO_EXTENSIONS      = {".mp4", ".avi", ".mov", ".mkv"}

# ============================================================
# Core extraction
# ============================================================
def find_videos(directory):
    """Return sorted list of all video paths under directory."""
    if not os.path.isdir(directory):
        return []
    paths = []
    for entry in sorted(Path(directory).rglob("*")):
        if entry.is_file() and entry.suffix.lower() in VIDEO_EXTENSIONS:
            paths.append(str(entry))
    return paths


def extract_video(video_path, label, video_stem, output_dir, interval):
    """
    Extract frames from a single video file.
    Skips entirely if output directory already has frames (resume support).
    Returns number of frames saved.
    """
    out_dir = os.path.join(output_dir, label, video_stem)

    # Resume support: skip if already extracted
    if os.path.isdir(out_dir):
        existing = [f for f in os.listdir(out_dir) if f.endswith(".jpg")]
        if existing:
            return len(existing), True  # (count, skipped)

    os.makedirs(out_dir, exist_ok=True)
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return 0, False

    frame_idx = 0
    saved = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % interval == 0:
            out_path = os.path.join(out_dir, f"frame_{saved:05d}.jpg")
            cv2.imwrite(out_path, frame)
            saved += 1
        frame_idx += 1

    cap.release()
    return saved, False


def process_class(video_dir, label, output_dir, interval, max_videos):
    """Process all videos for one class (real or fake)."""
    videos = find_videos(video_dir)
    if not videos:
        print(f"  [!] No videos found in {video_dir}")
        print(f"      Check that the path exists and contains .mp4 files.")
        return 0, 0

    if max_videos:
        videos = videos[:max_videos]

    print(f"\n{'='*60}")
    print(f"Processing {label.upper()} videos: {len(videos)} found in {video_dir}")
    print(f"{'='*60}")

    total_frames = 0
    skipped_count = 0

    for i, vpath in enumerate(videos, 1):
        video_stem = Path(vpath).stem  # e.g. "000" or "000_003"
        n_frames, was_skipped = extract_video(vpath, label, video_stem, output_dir, interval)
        total_frames += n_frames

        if was_skipped:
            skipped_count += 1
            if i % 50 == 0 or i == len(videos):
                print(f"  [{i:4d}/{len(videos)}] (already done, skipping remaining already-extracted...)")
        else:
            status = f"{n_frames} frames" if n_frames > 0 else "0 frames (read error?)"
            print(f"  [{i:4d}/{len(videos)}] [{label}] {video_stem} -> {status}")

    print(f"\n  Done: {len(videos)} videos | {total_frames} total frames | {skipped_count} already existed")
    return len(videos), total_frames


# ============================================================
# Validation: check output structure is correct
# ============================================================
def validate_output(output_dir):
    print(f"\n{'='*60}")
    print("OUTPUT VALIDATION")
    print(f"{'='*60}")

    issues = []
    total_summary = {}

    for label in ["real", "fake"]:
        cls_dir = os.path.join(output_dir, label)
        if not os.path.isdir(cls_dir):
            issues.append(f"Missing class directory: {cls_dir}")
            continue

        video_dirs = [d for d in os.listdir(cls_dir)
                      if os.path.isdir(os.path.join(cls_dir, d))]
        frame_counts = []
        empty_dirs = []

        for vd in video_dirs:
            vpath = os.path.join(cls_dir, vd)
            frames = [f for f in os.listdir(vpath) if f.endswith(".jpg")]
            if not frames:
                empty_dirs.append(vd)
            else:
                frame_counts.append(len(frames))

        total = sum(frame_counts)
        avg = total / len(frame_counts) if frame_counts else 0
        total_summary[label] = {"videos": len(video_dirs), "frames": total, "avg": avg}

        print(f"\n  {label.upper()}:")
        print(f"    Video folders : {len(video_dirs)}")
        print(f"    Total frames  : {total:,}")
        print(f"    Avg per video : {avg:.0f}")
        if frame_counts:
            print(f"    Min/Max frames: {min(frame_counts)} / {max(frame_counts)}")
        if empty_dirs:
            issues.append(f"{len(empty_dirs)} empty video folders in {label}: {empty_dirs[:5]}")

    if issues:
        print(f"\n  ISSUES FOUND:")
        for issue in issues:
            print(f"    [!] {issue}")
    else:
        print(f"\n  All checks passed.")

    print(f"\n  NEXT STEP: run train_image.py")
    print(f"  It will detect faces in these frames and train the classifier.")

    return total_summary


# ============================================================
# Main
# ============================================================
def main():
    print("FF++ Frame Extraction Script")
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Sample interval : every {FRAME_SAMPLE_INTERVAL} frames")
    if MAX_VIDEOS_PER_CLASS:
        print(f"Cap per class   : {MAX_VIDEOS_PER_CLASS} videos (testing mode)")
    print()

    # Sanity check paths exist
    missing = []
    for path, name in [(REAL_VIDEO_DIR, "Real videos"), (FAKE_VIDEO_DIR, "Fake videos")]:
        if not os.path.isdir(path):
            missing.append(f"  {name}: {path}  <-- NOT FOUND")
        else:
            n = len(find_videos(path))
            print(f"  {name}: {path}  [{n} videos found]")

    if missing:
        print("\n[!] Some input directories are missing:")
        for m in missing:
            print(m)
        print("\nCheck REAL_VIDEO_DIR and FAKE_VIDEO_DIR at the top of this script.")
        print("Paths are relative to where you run the script (should be backend/).")
        return

    # Extract real
    real_vids, real_frames = process_class(
        REAL_VIDEO_DIR, "real", OUTPUT_DIR, FRAME_SAMPLE_INTERVAL, MAX_VIDEOS_PER_CLASS
    )

    # Extract fake
    fake_vids, fake_frames = process_class(
        FAKE_VIDEO_DIR, "fake", OUTPUT_DIR, FRAME_SAMPLE_INTERVAL, MAX_VIDEOS_PER_CLASS
    )

    # Summary and validation
    summary = validate_output(OUTPUT_DIR)

    print(f"\n{'='*60}")
    print("EXTRACTION COMPLETE")
    print(f"{'='*60}")
    print(f"  Real: {real_vids} videos, {real_frames:,} frames")
    print(f"  Fake: {fake_vids} videos, {fake_frames:,} frames")
    print(f"  Total: {real_frames + fake_frames:,} frames written to {OUTPUT_DIR}")
    print(f"\n  Estimated training set size after face detection (~70-80% yield):")
    est = int((real_frames + fake_frames) * 0.75)
    print(f"    ~{est:,} face-cropped frames")
    print(f"\n  Now run: python train_image.py")


if __name__ == "__main__":
    main()
