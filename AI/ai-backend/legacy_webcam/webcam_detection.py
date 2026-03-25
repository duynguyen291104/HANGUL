#!/usr/bin/env python3
"""Real-time YOLO object detection from webcam"""

import cv2
import numpy as np
import json
import torch
import os
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Patch torch.load BEFORE importing YOLO
original_load = torch.load

def patched_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return original_load(*args, **kwargs)

torch.load = patched_load

from ultralytics import YOLO

os.environ['TORCH_WEIGHTS_ONLY'] = '0'

print("=" * 70)
print("🎥 YOLO Real-time Webcam Detection")
print("=" * 70)

# Load Korean font for text rendering
print("📝 Loading Korean font...")
font_path = "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc"
if not os.path.exists(font_path):
    print("⚠️  Font not found, trying alternative...")
    font_path = "/usr/share/fonts/truetype/nanum/NanumSquareRoundB.ttf"
    if not os.path.exists(font_path):
        print("❌ No Korean font found!")
        font_path = None

try:
    korean_font = ImageFont.truetype(font_path, 30) if font_path else None
    print(f"✅ Korean font loaded: {font_path}")
except Exception as e:
    print(f"⚠️  Could not load font: {e}")
    korean_font = None

# Load model
print("\n📦 Loading YOLOv8 model...")
model = YOLO('yolov8n.pt')
print("✅ Model loaded!")

# Load Korean labels
print("🇰🇷 Loading Korean vocabulary...")
try:
    with open('labels_ko_fixed.json', 'r', encoding='utf-8') as f:
        labels_ko = json.load(f)
    print(f"✅ Loaded {len(labels_ko)} Korean labels (fixed version)")
except FileNotFoundError:
    print("⚠️  labels_ko_fixed.json not found, creating it...")
    # Create default mapping
    coco_names = [
        "사람", "자전거", "자동차", "오토바이", "비행기",
        "버스", "기차", "트럭", "배", "신호등",
        "소화전", "정지 표지판", "주차 미터기", "벤치", "새",
        "고양이", "개", "말", "양", "소",
        "코끼리", "곰", "얼룩말", "기린", "배낭",
        "우산", "핸드백", "넥타이", "여행 가방", "프리스비",
        "스키", "스노보드", "공", "연", "야구 방망이",
        "야구 글러브", "스케이트보드", "서핑보드", "테니스 라켓", "병",
        "와인잔", "컵", "포크", "칼", "숟가락",
        "그릇", "바나나", "사과", "샌드위치", "오렌지",
        "브로콜리", "당근", "핫도그", "피자", "도넛",
        "케이크", "의자", "소파", "화분", "침대",
        "식탁", "변기", "텔레비전", "노트북", "마우스",
        "리모컨", "키보드", "휴대전화", "전자레인지", "오븐",
        "토스터", "싱크대", "냉장고", "책", "시계",
        "꽃병", "가위", "테디 베어", "헤어 드라이어", "칫솔"
    ]
    labels_ko = {str(i): name for i, name in enumerate(coco_names)}
    print(f"✅ Using default Korean labels")

print("\n" + "=" * 70)
print("📸 Starting webcam...")
print("   Controls:")
print("   - 'q': Quit")
print("   - 's': Save image")
print("   - 'r': Change detection speed (skip frames)")
print("   - 'c': Change confidence threshold")
print("   - 'f': Toggle fullscreen")
print("   - '+': Zoom in")
print("   - '-': Zoom out")
print("=" * 70 + "\n")

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Cannot open webcam!")
    sys.exit(1)

# Set camera resolution (lower = faster but less detail)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 960)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 640)
cap.set(cv2.CAP_PROP_FPS, 30)

# Window setup
window_name = '🎥 YOLO Real-time Detection'
cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
cv2.resizeWindow(window_name, 1200, 800)

frame_count = 0
skip_frames = 3  # Detect every 4 frames (faster!)
confidence_threshold = 0.5
show_stats = True
is_fullscreen = False
zoom_level = 1.0

print(f"💡 Tips: Adjust 'skip_frames' for speed vs accuracy tradeoff")
print(f"   Current: Skip {skip_frames} frames (detect every {skip_frames+1} frame)\n")

# Cache for detection results
current_detections = []

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1
    h, w = frame.shape[:2]
    
    # Store detection results (reuse if not detecting this frame)
    if frame_count % (skip_frames + 1) == 0:
        # Run YOLO detection
        results = model(frame, conf=confidence_threshold)
        current_detections = []
        
        # Parse results
        for result in results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                confidence = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                name_ko = labels_ko.get(str(cls_id), "Unknown")
                current_detections.append((x1, y1, x2, y2, name_ko, confidence))
    
    # Draw detections (current or reused from previous)
    frame_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(frame_pil)
    
    for x1, y1, x2, y2, name_ko, confidence in current_detections:
        # Draw bounding box
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        
        # Draw Korean text
        label_text = f"{name_ko} {confidence:.0%}"
        if korean_font:
            text_bbox = draw.textbbox((x1 + 5, y1 - 35), label_text, font=korean_font)
            draw.rectangle([text_bbox[0] - 3, text_bbox[1] - 3, 
                           text_bbox[2] + 3, text_bbox[3] + 3], 
                          fill=(0, 255, 0))
            draw.text((x1 + 5, y1 - 35), label_text, font=korean_font, fill=(0, 0, 0))
    
    frame = cv2.cvtColor(np.array(frame_pil), cv2.COLOR_RGB2BGR)
    
    # Draw frame info
    if show_stats:
        fps_text = f"Frame: {frame_count} | Size: {w}x{h} | Zoom: {zoom_level:.1f}x"
        cv2.putText(frame, fps_text, (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        mode_text = f"Skip: {skip_frames}x | Conf: {confidence_threshold:.1f}"
        cv2.putText(frame, mode_text, (10, 70),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    
    # Apply zoom
    if zoom_level != 1.0:
        h_zoom = int(h * zoom_level)
        w_zoom = int(w * zoom_level)
        # Center crop
        y1 = max(0, (h - h_zoom) // 2)
        x1 = max(0, (w - w_zoom) // 2)
        frame = frame[y1:y1+h_zoom, x1:x1+w_zoom]
        frame = cv2.resize(frame, (w, h))
    
    # Show frame
    cv2.imshow(window_name, frame)
    
    # Handle keyboard
    key = cv2.waitKey(1) & 0xFF
    
    if key == ord('q'):
        print("\n✋ Exiting...")
        break
    
    elif key == ord('s'):
        filename = f'capture_{frame_count}.jpg'
        cv2.imwrite(filename, frame)
        print(f"✅ Saved: {filename}")
    
    elif key == ord('r'):
        skip_frames = (skip_frames + 1) % 6
        print(f"🔄 Changed skip to {skip_frames}x (detect every {skip_frames+1} frame)")
    
    elif key == ord('c'):
        confidence_threshold += 0.1
        if confidence_threshold > 0.9:
            confidence_threshold = 0.3
        print(f"🎯 Changed confidence threshold to {confidence_threshold:.1f}")
    
    elif key == ord('h'):
        show_stats = not show_stats
        print(f"📊 Stats: {'ON' if show_stats else 'OFF'}")
    
    elif key == ord('f'):
        is_fullscreen = not is_fullscreen
        if is_fullscreen:
            cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
            print("🖥️  Fullscreen ON")
        else:
            cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_NORMAL)
            print("🖥️  Fullscreen OFF")
    
    elif key == ord('+') or key == ord('='):
        zoom_level = min(zoom_level + 0.2, 3.0)
        print(f"🔍 Zoom: {zoom_level:.1f}x")
    
    elif key == ord('-') or key == ord('_'):
        zoom_level = max(zoom_level - 0.2, 0.5)
        print(f"🔍 Zoom: {zoom_level:.1f}x")

cap.release()
cv2.destroyAllWindows()

print("=" * 70)
print("✅ Webcam closed!")
print("=" * 70)
