import cv2
import os

VIDEO_DIR = "datasets/video"
FRAME_DIR = "datasets/frames"

os.makedirs(FRAME_DIR, exist_ok=True)

for video_file in os.listdir(VIDEO_DIR):
    video_path = os.path.join(VIDEO_DIR, video_file)
    cap = cv2.VideoCapture(video_path)
    count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        frame_filename = os.path.join(FRAME_DIR, f"{video_file}_{count}.jpg")
        cv2.imwrite(frame_filename, frame)
        count += 1
    cap.release()
    print(f"Extracted {count} frames from {video_file}")
