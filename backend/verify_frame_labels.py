"""
verify_frame_labels.py
=======================
READ-ONLY. Doesn't move or delete anything.

Checks every file currently in datasets/frames/real and datasets/frames/fake
against the TRUE label derived from the filename itself (the FaceForensics++
naming convention), and reports any mismatches -- i.e. files sitting in the
wrong folder.

Rule (confirmed from your actual filenames):
  - Real:  "<actorID>__<scene>_<frame>.jpg"            e.g. 01__exit_phone_room_00000.jpg
           -> single ID before the first "__", no underscore inside it
  - Fake:  "<actorID>_<actorID>__<scene>__<hash>_<frame>.jpg"
           e.g. 01_02__exit_phone_room__YVGY8LOK_00000.jpg
           -> the part before the first "__" contains an underscore (two IDs)

Run: python verify_frame_labels.py
"""
import os

DATA_DIR = "datasets/frames"


def true_label(filename):
    """Return 'real' or 'fake' based purely on the filename pattern, or
    None if the filename doesn't match either known pattern."""
    stem = os.path.splitext(filename)[0]
    if "__" not in stem:
        return None  # doesn't match the expected convention at all
    first_segment = stem.split("__")[0]
    if "_" in first_segment:
        return "fake"   # two actor IDs joined by "_"
    else:
        return "real"   # single actor ID


def main():
    total_checked = 0
    mismatches = {"real": [], "fake": []}
    unrecognized = {"real": [], "fake": []}

    for folder_label in ["real", "fake"]:
        folder = os.path.join(DATA_DIR, folder_label)
        if not os.path.isdir(folder):
            print(f"[!] {folder} not found -- check your path / run this from backend/")
            continue

        for dirpath, _, filenames in os.walk(folder):
            for f in filenames:
                if not f.lower().endswith((".jpg", ".jpeg", ".png")):
                    continue
                total_checked += 1
                label = true_label(f)
                if label is None:
                    unrecognized[folder_label].append(f)
                elif label != folder_label:
                    mismatches[folder_label].append(f)

    print(f"\nTotal files checked: {total_checked}")

    for folder_label in ["real", "fake"]:
        n_mis = len(mismatches[folder_label])
        n_unrec = len(unrecognized[folder_label])
        print(f"\n--- {folder_label}/ folder ---")
        print(f"  Mismatched (true label is actually the OPPOSITE class): {n_mis}")
        if n_mis:
            print("   Examples:", mismatches[folder_label][:5])
        print(f"  Unrecognized filename pattern: {n_unrec}")
        if n_unrec:
            print("   Examples:", unrecognized[folder_label][:5])

    total_mismatches = len(mismatches["real"]) + len(mismatches["fake"])
    if total_mismatches == 0:
        print("\n✅ No mismatches found -- your current frames/real and frames/fake "
              "folders are correctly labeled (at least by this filename check).")
    else:
        print(f"\n⚠️  {total_mismatches} mislabeled files found. Recommend rebuilding "
              "from raw video with extract_frames_v2.py rather than patching these in place.")


if __name__ == "__main__":
    main()
