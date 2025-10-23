# backend/app/utils/audio_utils.py
"""
Audio preprocessing utilities for training and inference.
Requires: librosa, numpy
Functions:
 - load_audio(path, sr=16000)
 - mfcc_mean(path, n_mfcc=40, sr=16000) -> (n_mfcc,)
 - mfcc_pad(path, n_mfcc=40, sr=16000, max_len=174) -> (n_mfcc, max_len)
 - batch_extract_mfcc_mean(src_dir, dest_dir, n_mfcc=40, sr=16000)
"""

import os
import numpy as np
import librosa


def load_audio(audio_path, sr=16000):
    """
    Load audio with librosa.
    Returns: y (np.ndarray), sr (int)
    """
    y, sr = librosa.load(audio_path, sr=sr, mono=True)
    return y, sr


def mfcc_mean(audio_path, n_mfcc=40, sr=16000):
    """
    Compute MFCC and return the mean across time axis.
    Output shape: (n_mfcc,)
    This matches the simple feature used by evaluate.py and the original train_audio.py.
    """
    y, sr = load_audio(audio_path, sr=sr)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
    return np.mean(mfcc.T, axis=0)


def mfcc_pad(audio_path, n_mfcc=40, sr=16000, max_len=174):
    """
    Compute MFCC and pad or truncate to a fixed number of frames (max_len).
    Output shape: (n_mfcc, max_len)
    Useful for CNNs or models that expect fixed time-dimension.
    """
    y, sr = load_audio(audio_path, sr=sr)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)  # shape (n_mfcc, T)
    T = mfcc.shape[1]
    if T < max_len:
        pad_width = max_len - T
        mfcc = np.pad(mfcc, ((0, 0), (0, pad_width)), mode="constant", constant_values=0)
    else:
        mfcc = mfcc[:, :max_len]
    return mfcc


def batch_extract_mfcc_mean(src_dir, dest_dir, n_mfcc=40, sr=16000):
    """
    Walk src_dir, compute mfcc_mean for each supported audio file,
    and save as .npy into dest_dir preserving filenames (without extension).
    """
    os.makedirs(dest_dir, exist_ok=True)
    for fname in os.listdir(src_dir):
        if not fname.lower().endswith((".wav", ".mp3", ".flac", ".ogg", ".m4a")):
            continue
        in_path = os.path.join(src_dir, fname)
        try:
            feat = mfcc_mean(in_path, n_mfcc=n_mfcc, sr=sr)
            out_name = os.path.splitext(fname)[0] + ".npy"
            out_path = os.path.join(dest_dir, out_name)
            np.save(out_path, feat)
        except Exception as e:
            print(f"Failed to process {fname}: {e}")


# Example quick test (only run when executed directly)
if __name__ == "__main__":
    # quick local test: python audio_utils.py /path/to/audio.wav
    import sys
    if len(sys.argv) > 1:
        path = sys.argv[1]
        print("mfcc_mean shape:", mfcc_mean(path).shape)
        print("mfcc_pad shape:", mfcc_pad(path).shape)
