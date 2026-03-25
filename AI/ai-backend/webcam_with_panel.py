#!/usr/bin/env python3
"""YOLO detection with detailed info panel"""

import cv2
import numpy as np
import json
import torch
import os
import sys
from PIL import Image, ImageDraw, ImageFont

# Patch torch.load
original_load = torch.load
def patched_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return original_load(*args, **kwargs)
torch.load = patched_load

from ultralytics import YOLO

os.environ['TORCH_WEIGHTS_ONLY'] = '0'

print("=" * 70)
print("🎥 YOLO Detection with Info Panel")
print("=" * 70)

# Load Korean font
print("📝 Loading Korean font...")
font_path = "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc"
if not os.path.exists(font_path):
    font_path = "/usr/share/fonts/truetype/nanum/NanumSquareRoundB.ttf"

try:
    korean_font_large = ImageFont.truetype(font_path, 32) if os.path.exists(font_path) else None
    korean_font_small = ImageFont.truetype(font_path, 24) if os.path.exists(font_path) else None
    print(f"✅ Korean font loaded")
except Exception as e:
    print(f"⚠️  Font error: {e}")
    korean_font_large = None
    korean_font_small = None

# Load model
print("📦 Loading YOLOv8 model...")
model = YOLO('yolov8n.pt')
print("✅ Model loaded!")

# Load Korean labels
print("🇰🇷 Loading Korean vocabulary...")
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
print("📸 Starting detection...")
print("   Controls: 'q'=Quit, 's'=Save, 'r'=Speed, 't'=Track, 'f'=Fullscreen")
print("=" * 70 + "\n")

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("❌ Cannot open webcam!")
    sys.exit(1)

cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
cap.set(cv2.CAP_PROP_FPS, 30)

window_name = '🎥 YOLO Detection with Info'
cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
cv2.resizeWindow(window_name, 1600, 900)

# Variables
frame_count = 0
skip_frames = 2
confidence_threshold = 0.5
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

print("🚀 Detection started! Press 'q' to quit\n")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1
    h, w = frame.shape[:2]
    
    # Age tracked objects
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
                    'cls_id': cls_id
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
    
    # Draw video
    display = frame.copy()
    
    # Draw boxes
    for obj_id, obj_data in tracked_objects.items():
        x1, y1, x2, y2 = obj_data['bbox']
        alpha = max(0.3, 1.0 - (obj_data['age'] / max_object_age))
        color = (0, int(255 * alpha), 0)
        thickness = max(1, int(3 * obj_data['confidence']))
        
        cv2.rectangle(display, (x1, y1), (x2, y2), color, thickness)
        
        # Draw ID number
        cv2.putText(display, f"ID:{obj_id}", (x1, y1 - 5),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
    
    # Draw Korean text with PIL
    if korean_font_small and tracked_objects:
        display_pil = Image.fromarray(cv2.cvtColor(display, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(display_pil)
        
        for obj_id, obj_data in tracked_objects.items():
            x1, y1, x2, y2 = obj_data['bbox']
            label = obj_data['label']
            conf = obj_data['confidence']
            
            text = f"{label} {conf:.0%}"
            try:
                bbox = draw.textbbox((x1 + 5, y1 + 25), text, font=korean_font_small)
                draw.rectangle([bbox[0] - 2, bbox[1] - 2, bbox[2] + 2, bbox[3] + 2], 
                              fill=(0, 200, 0))
                draw.text((x1 + 5, y1 + 25), text, font=korean_font_small, fill=(0, 0, 0))
            except:
                pass
        
        display = cv2.cvtColor(np.array(display_pil), cv2.COLOR_RGB2BGR)
    
    # Create info panel
    panel_width = 350
    panel = np.ones((h, panel_width, 3), dtype=np.uint8) * 30  # Dark background
    
    # Panel title
    cv2.putText(panel, "=== DETECTED OBJECTS ===", (10, 40),
               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    
    # Object list
    y_pos = 90
    line_height = 60
    
    if tracked_objects:
        for obj_id, obj_data in sorted(tracked_objects.items()):
            if y_pos + line_height > h - 50:
                break
            
            # Background for each object
            cv2.rectangle(panel, (5, y_pos - 30), (panel_width - 5, y_pos + 25), 
                         (50, 100, 50), -1)
            
            # Object info
            conf = obj_data['confidence']
            age = obj_data['age']
            
            cv2.putText(panel, f"ID: {obj_id}", (15, y_pos - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 1)
            
            cv2.putText(panel, f"Age: {age} Conf: {conf:.0%}", (15, y_pos + 12),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
            
            y_pos += line_height
            
            # Korean label with PIL
            try:
                panel_pil = Image.fromarray(cv2.cvtColor(panel, cv2.COLOR_BGR2RGB))
                draw = ImageDraw.Draw(panel_pil)
                draw.text((20, y_pos - 55), obj_data['label'], 
                         font=korean_font_large, fill=(0, 200, 0))
                panel = cv2.cvtColor(np.array(panel_pil), cv2.COLOR_RGB2BGR)
            except:
                pass
    else:
        cv2.putText(panel, "No objects detected", (15, 100),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (100, 100, 100), 1)
    
    # Bottom info
    cv2.putText(panel, f"Frame: {frame_count}", (10, h - 30),
               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 200, 100), 1)
    cv2.putText(panel, f"Objects: {len(tracked_objects)}", (10, h - 10),
               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 200, 100), 1)
    
    # Combine video + panel
    result = np.hstack([display, panel])
    
    cv2.imshow(window_name, result)
    
    # Keyboard
    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        print("\n✋ Exiting...")
        break
    elif key == ord('s'):
        cv2.imwrite(f'capture_{frame_count}.jpg', display)
        print(f"✅ Saved: capture_{frame_count}.jpg")
    elif key == ord('r'):
        skip_frames = (skip_frames + 1) % 6
        print(f"🔄 Speed: {skip_frames}x")
    elif key == ord('t'):
        max_object_age = (max_object_age + 5) % 31
        if max_object_age < 5:
            max_object_age = 5
        print(f"🎯 Track smoothness: {max_object_age} frames")
    elif key == ord('f'):
        cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
        print("🖥️  Fullscreen")

cap.release()
cv2.destroyAllWindows()
print("\n✅ Closed!")
