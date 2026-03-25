#!/usr/bin/env python3
"""YOLO Detection - Full Screen Clean Mode"""

import cv2
import numpy as np
import json
import torch
import os
import sys
from PIL import Image, ImageDraw, ImageFont

# Setup torch
original_load = torch.load
def patched_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return original_load(*args, **kwargs)
torch.load = patched_load

from ultralytics import YOLO

os.environ['TORCH_WEIGHTS_ONLY'] = '0'

print("=" * 70)
print("🎥 YOLO Detection - Full Screen Mode")
print("=" * 70)

# Load fonts
print("📝 Loading Korean font...")
font_path = "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc"
if not os.path.exists(font_path):
    font_path = "/usr/share/fonts/truetype/nanum/NanumSquareRoundB.ttf"

try:
    korean_font = ImageFont.truetype(font_path, 40) if os.path.exists(font_path) else None
    print("✅ Korean font loaded")
except Exception as e:
    korean_font = None
    print(f"⚠️  Font: {e}")

# Load model
print("📦 Loading YOLOv8 model...")
model = YOLO('yolov8s.pt')  # Small model - better accuracy
print("✅ Model loaded!")

# Load labels
print("🇰🇷 Loading labels...")
try:
    with open('labels_ko_fixed.json', 'r', encoding='utf-8') as f:
        labels_ko = json.load(f)
except FileNotFoundError:
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

print("\n" + "=" * 70)
print("📸 Starting Full Screen Detection")
print("=" * 70)
print("\nCONTROLS:")
print("  ESC or 'q' = Quit")
print("  's' = Save image")
print("  'r' = Speed (detect every N frames)")
print("  't' = Tracking smoothness")
print("  'c' = Confidence threshold")
print("=" * 70 + "\n")

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("❌ Cannot open webcam!")
    sys.exit(1)

# High resolution
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
cap.set(cv2.CAP_PROP_FPS, 30)

# Fullscreen window
window_name = 'YOLO Detection'
cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)

# Set fullscreen BEFORE displaying
cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)

# Also set to maximized in case fullscreen doesn't work
cv2.resizeWindow(window_name, 1920, 1080)
cv2.moveWindow(window_name, 0, 0)

# State
frame_count = 0
skip_frames = 1  # Detect more frequently
confidence_threshold = 0.35  # Lower threshold to detect more objects
max_object_age = 15
tracked_objects = {}
next_id = 0

def iou(box1, box2):
    x1a, y1a, x2a, y2a = box1
    x1b, y1b, x2b, y2b = box2
    xi1 = max(x1a, x1b)
    yi1 = max(y1a, y1b)
    xi2 = min(x2a, x2b)
    yi2 = min(y2a, y2b)
    inter = max(0, xi2 - xi1) * max(0, yi2 - yi1)
    union = (x2a - x1a) * (y2a - y1a) + (x2b - x1b) * (y2b - y1b) - inter
    return inter / union if union > 0 else 0

print("🚀 Detection started!\n")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1
    h, w = frame.shape[:2]
    
    # Age objects
    for obj_id in list(tracked_objects.keys()):
        tracked_objects[obj_id]['age'] += 1
        if tracked_objects[obj_id]['age'] > max_object_age:
            del tracked_objects[obj_id]
    
    # Detect
    if frame_count % (skip_frames + 1) == 0:
        results = model(frame, conf=confidence_threshold)
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
                })
        
        # Match detections
        matched_ids = set()
        for detection in current_detections:
            best_id = None
            best_iou = 0.3
            
            for obj_id, obj_data in tracked_objects.items():
                if obj_id in matched_ids:
                    continue
                iou_score = iou(detection['bbox'], obj_data['bbox'])
                if iou_score > best_iou:
                    best_iou = iou_score
                    best_id = obj_id
            
            if best_id is not None:
                tracked_objects[best_id].update({
                    'bbox': detection['bbox'],
                    'label': detection['label'],
                    'confidence': detection['confidence'],
                    'age': 0,
                })
                matched_ids.add(best_id)
            else:
                tracked_objects[next_id] = {
                    'bbox': detection['bbox'],
                    'label': detection['label'],
                    'confidence': detection['confidence'],
                    'age': 0,
                }
                next_id += 1
    
    # Draw on frame
    display = frame.copy()
    
    # Draw boxes
    for obj_id, obj_data in tracked_objects.items():
        x1, y1, x2, y2 = obj_data['bbox']
        alpha = max(0.3, 1.0 - (obj_data['age'] / max_object_age))
        color = (0, int(255 * alpha), 0)
        thickness = max(2, int(4 * obj_data['confidence']))
        
        cv2.rectangle(display, (x1, y1), (x2, y2), color, thickness)
    
    # Draw Korean text with PIL
    if korean_font and tracked_objects:
        display_pil = Image.fromarray(cv2.cvtColor(display, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(display_pil)
        
        for obj_id, obj_data in tracked_objects.items():
            x1, y1, x2, y2 = obj_data['bbox']
            label = obj_data['label']
            conf = obj_data['confidence']
            
            text = f"{label} {conf:.0%}"
            try:
                # Draw text with background
                bbox = draw.textbbox((x1 + 10, y1 - 50), text, font=korean_font)
                padding = 8
                draw.rectangle([bbox[0] - padding, bbox[1] - padding, 
                               bbox[2] + padding, bbox[3] + padding], 
                              fill=(0, 200, 50))
                draw.text((x1 + 10, y1 - 50), text, font=korean_font, fill=(0, 0, 0))
            except:
                pass
        
        display = cv2.cvtColor(np.array(display_pil), cv2.COLOR_RGB2BGR)
    
    cv2.imshow(window_name, display)
    
    # Keyboard
    key = cv2.waitKey(1) & 0xFF
    
    if key == 27 or key == ord('q'):  # ESC or q
        print("\n✋ Exiting...")
        break
    
    elif key == ord('s'):
        cv2.imwrite(f'capture_{frame_count}.jpg', display)
        print(f"✅ Saved: capture_{frame_count}.jpg")
    
    elif key == ord('r'):
        skip_frames = (skip_frames + 1) % 6
        print(f"🔄 Speed: detect every {skip_frames + 1} frame")
    
    elif key == ord('t'):
        max_object_age = (max_object_age + 5) % 31
        if max_object_age < 5:
            max_object_age = 5
        print(f"🎯 Tracking smoothness: {max_object_age} frames")
    
    elif key == ord('c'):
        confidence_threshold += 0.1
        if confidence_threshold > 0.9:
            confidence_threshold = 0.3
        print(f"🎯 Confidence: {confidence_threshold:.1f}")

cap.release()
cv2.destroyAllWindows()
print("\n✅ Closed!")
