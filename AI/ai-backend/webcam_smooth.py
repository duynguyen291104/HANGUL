#!/usr/bin/env python3
"""Real-time YOLO object detection from webcam - SMOOTH VERSION"""

import cv2
import numpy as np
import json
import torch
import os
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from collections import defaultdict

# Patch torch.load BEFORE importing YOLO
original_load = torch.load

def patched_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return original_load(*args, **kwargs)

torch.load = patched_load

from ultralytics import YOLO

os.environ['TORCH_WEIGHTS_ONLY'] = '0'

print("=" * 70)
print("🎥 YOLO Real-time Webcam Detection (SMOOTH MODE)")
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
    print("⚠️  labels_ko_fixed.json not found, creating default...")
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
print("   - 'r': Change detection speed")
print("   - 't': Adjust tracking (smoothness)")
print("   - 'c': Change confidence threshold")
print("   - 'f': Toggle fullscreen")
print("=" * 70 + "\n")

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Cannot open webcam!")
    sys.exit(1)

# Set camera resolution (balanced)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 960)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 640)
cap.set(cv2.CAP_PROP_FPS, 30)

# Window setup
window_name = '🎥 YOLO Real-time Detection'
cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
cv2.resizeWindow(window_name, 1200, 800)

# Tracking variables
frame_count = 0
skip_frames = 2  # Detect every 3 frames
confidence_threshold = 0.5
show_stats = True
is_fullscreen = False

# Smooth tracking: Keep detections alive for N frames
tracked_objects = {}  # id -> {bbox, label, confidence, age, last_seen}
next_id = 0
tracking_threshold = 50  # pixels to consider "same object"
max_object_age = 10  # frames to keep object after last detection

print(f"💡 Smooth tracking enabled - objects stay visible for ~{max_object_age} frames")
print(f"   Change 't' key to adjust smoothness\n")

def box_center(x1, y1, x2, y2):
    """Calculate center of bounding box"""
    return ((x1 + x2) // 2, (y1 + y2) // 2)

def distance(p1, p2):
    """Euclidean distance between two points"""
    return np.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

def iou(box1, box2):
    """Calculate Intersection over Union"""
    x1a, y1a, x2a, y2a = box1
    x1b, y1b, x2b, y2b = box2
    
    xi1 = max(x1a, x1b)
    yi1 = max(y1a, y1b)
    xi2 = min(x2a, x2b)
    yi2 = min(y2a, y2b)
    
    inter = max(0, xi2 - xi1) * max(0, yi2 - yi1)
    union = (x2a - x1a) * (y2a - y1a) + (x2b - x1b) * (y2b - y1b) - inter
    
    return inter / union if union > 0 else 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1
    h, w = frame.shape[:2]
    
    # Age all tracked objects
    for obj_id in list(tracked_objects.keys()):
        tracked_objects[obj_id]['age'] += 1
        # Remove old objects
        if tracked_objects[obj_id]['age'] > max_object_age:
            del tracked_objects[obj_id]
    
    # Detect every N frames
    if frame_count % (skip_frames + 1) == 0:
        results = model(frame, conf=confidence_threshold)
        
        # Current detections
        current_detections = []
        for result in results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                confidence = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                name_ko = labels_ko.get(str(cls_id), "Unknown")
                current_detections.append({
                    'bbox': (x1, y1, x2, y2),
                    'label': name_ko,
                    'confidence': confidence,
                    'cls_id': cls_id
                })
        
        # Match detections to tracked objects
        matched_ids = set()
        
        for detection in current_detections:
            best_id = None
            best_iou = 0.3  # Minimum IoU threshold
            
            # Find best matching tracked object
            for obj_id, obj_data in tracked_objects.items():
                if obj_id in matched_ids:
                    continue
                
                iou_score = iou(detection['bbox'], obj_data['bbox'])
                if iou_score > best_iou:
                    best_iou = iou_score
                    best_id = obj_id
            
            if best_id is not None:
                # Update existing track
                tracked_objects[best_id].update({
                    'bbox': detection['bbox'],
                    'label': detection['label'],
                    'confidence': detection['confidence'],
                    'age': 0,
                    'last_seen': frame_count
                })
                matched_ids.add(best_id)
            else:
                # Create new track
                tracked_objects[next_id] = {
                    'bbox': detection['bbox'],
                    'label': detection['label'],
                    'confidence': detection['confidence'],
                    'age': 0,
                    'last_seen': frame_count,
                    'cls_id': detection['cls_id']
                }
                next_id += 1
    
    # Draw tracked objects with smooth appearance
    frame_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(frame_pil)
    
    for obj_id, obj_data in tracked_objects.items():
        x1, y1, x2, y2 = obj_data['bbox']
        label = obj_data['label']
        confidence = obj_data['confidence']
        age = obj_data['age']
        
        # Fade color based on age (younger = brighter)
        alpha = max(0.3, 1.0 - (age / max_object_age))
        color = (0, int(255 * alpha), 0)
        
        # Draw bounding box with thickness based on confidence
        thickness = max(1, int(3 * confidence))
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, thickness)
        
        # Draw label (Korean text)
        label_text = f"{label} {confidence:.0%}"
        if korean_font:
            try:
                text_bbox = draw.textbbox((x1 + 5, y1 - 35), label_text, font=korean_font)
                draw.rectangle([text_bbox[0] - 3, text_bbox[1] - 3, 
                               text_bbox[2] + 3, text_bbox[3] + 3], 
                              fill=(0, int(255 * alpha), 0))
                draw.text((x1 + 5, y1 - 35), label_text, font=korean_font, 
                         fill=(0, 0, 0))
            except:
                pass
    
    frame = cv2.cvtColor(np.array(frame_pil), cv2.COLOR_RGB2BGR)
    
    # Draw stats
    if show_stats:
        stats_text = f"Frame: {frame_count} | Objects: {len(tracked_objects)} | Skip: {skip_frames}x | MaxAge: {max_object_age}"
        cv2.putText(frame, stats_text, (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
    
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
    
    elif key == ord('t'):
        max_object_age = (max_object_age + 5) % 31
        if max_object_age < 5:
            max_object_age = 5
        print(f"🎯 Changed tracking smoothness: objects stay {max_object_age} frames")
    
    elif key == ord('c'):
        confidence_threshold += 0.1
        if confidence_threshold > 0.9:
            confidence_threshold = 0.3
        print(f"🎯 Changed confidence threshold to {confidence_threshold:.1f}")
    
    elif key == ord('f'):
        is_fullscreen = not is_fullscreen
        if is_fullscreen:
            cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
            print("🖥️  Fullscreen ON")
        else:
            cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_NORMAL)
            print("🖥️  Fullscreen OFF")
    
    elif key == ord('h'):
        show_stats = not show_stats
        print(f"📊 Stats: {'ON' if show_stats else 'OFF'}")

cap.release()
cv2.destroyAllWindows()

print("=" * 70)
print("✅ Webcam closed!")
print("=" * 70)
