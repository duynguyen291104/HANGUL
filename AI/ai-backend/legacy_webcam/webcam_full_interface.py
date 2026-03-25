#!/usr/bin/env python3
"""YOLO detection with MULTIPLE INFO FRAMES - Complete UI"""

import cv2
import numpy as np
import json
import torch
import os
import sys
from collections import deque
from PIL import Image, ImageDraw, ImageFont

# Setup torch
original_load = torch.load
def patched_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return original_load(*args, **kwargs)
torch.load = patched_load

from ultralytics import YOLO

os.environ['TORCH_WEIGHTS_ONLY'] = '0'

print("=" * 80)
print("🎥 YOLO DETECTION - COMPLETE INTERFACE WITH MULTIPLE FRAMES")
print("=" * 80)

# Load fonts
print("📝 Loading Korean font...")
font_path = "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc"
if not os.path.exists(font_path):
    font_path = "/usr/share/fonts/truetype/nanum/NanumSquareRoundB.ttf"

try:
    korean_font_xl = ImageFont.truetype(font_path, 36) if os.path.exists(font_path) else None
    korean_font_lg = ImageFont.truetype(font_path, 28) if os.path.exists(font_path) else None
    korean_font_md = ImageFont.truetype(font_path, 20) if os.path.exists(font_path) else None
    print("✅ Korean fonts loaded")
except Exception as e:
    korean_font_xl = korean_font_lg = korean_font_md = None
    print(f"⚠️  Font: {e}")

# Load model
print("📦 Loading YOLOv8 model...")
model = YOLO('yolov8n.pt')
print("✅ Model loaded!")

# Load Korean labels
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

print("\n" + "=" * 80)
print("📸 LAYOUT: [VIDEO] [INFO PANEL] [STATS] [HISTORY]")
print("=" * 80)
print("\nCONTROLS:")
print("  q = Quit          s = Save image      r = Detection speed")
print("  t = Tracking      c = Confidence      f = Fullscreen")
print("  h = Help          + = Zoom in         - = Zoom out")
print("=" * 80 + "\n")

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("❌ Cannot open webcam!")
    sys.exit(1)

cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1024)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 768)
cap.set(cv2.CAP_PROP_FPS, 30)

window_name = '🎥 YOLO Detection Interface'
cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
cv2.resizeWindow(window_name, 1920, 1080)

# State
frame_count = 0
skip_frames = 2
confidence_threshold = 0.5
max_object_age = 15
tracked_objects = {}
next_id = 0
detection_history = deque(maxlen=60)  # Last 60 frames
class_count = {}
total_detected = 0

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
                    'cls_id': cls_id
                })
        
        detection_history.append(len(current_detections))
        
        # Match
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
                class_count[detection['label']] = class_count.get(detection['label'], 0) + 1
                total_detected += 1
                next_id += 1
    
    # FRAME 1: VIDEO
    display = frame.copy()
    
    for obj_id, obj_data in tracked_objects.items():
        x1, y1, x2, y2 = obj_data['bbox']
        alpha = max(0.3, 1.0 - (obj_data['age'] / max_object_age))
        color = (0, int(255 * alpha), 0)
        thickness = max(1, int(3 * obj_data['confidence']))
        cv2.rectangle(display, (x1, y1), (x2, y2), color, thickness)
        cv2.putText(display, f"ID:{obj_id}", (x1, y1 - 5),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
    
    # Add Korean text
    if korean_font_md and tracked_objects:
        display_pil = Image.fromarray(cv2.cvtColor(display, cv2.COLOR_BGR2RGB))
        draw = ImageDraw.Draw(display_pil)
        
        for obj_id, obj_data in tracked_objects.items():
            x1, y1, x2, y2 = obj_data['bbox']
            label = obj_data['label']
            conf = obj_data['confidence']
            text = f"{label} {conf:.0%}"
            try:
                bbox = draw.textbbox((x1 + 5, y1 + 25), text, font=korean_font_md)
                draw.rectangle([bbox[0] - 2, bbox[1] - 2, bbox[2] + 2, bbox[3] + 2], 
                              fill=(0, 200, 0))
                draw.text((x1 + 5, y1 + 25), text, font=korean_font_md, fill=(0, 0, 0))
            except:
                pass
        
        display = cv2.cvtColor(np.array(display_pil), cv2.COLOR_RGB2BGR)
    
    # FRAME 2: INFO PANEL (Objects) - Match video height
    panel_info = np.ones((h, 300, 3), dtype=np.uint8) * 30
    
    cv2.putText(panel_info, "DETECTED OBJECTS", (10, 40),
               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    
    y_pos = 90
    for obj_id, obj_data in sorted(tracked_objects.items())[:12]:
        cv2.rectangle(panel_info, (5, y_pos - 30), (295, y_pos + 20), 
                     (50, 100, 50), -1)
        
        cv2.putText(panel_info, f"ID:{obj_id} Age:{obj_data['age']}", (15, y_pos - 10),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
        cv2.putText(panel_info, f"Conf: {obj_data['confidence']:.0%}", (15, y_pos + 10),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 200, 100), 1)
        
        if korean_font_lg:
            try:
                panel_pil = Image.fromarray(cv2.cvtColor(panel_info, cv2.COLOR_BGR2RGB))
                draw = ImageDraw.Draw(panel_pil)
                draw.text((150, y_pos - 20), obj_data['label'], 
                         font=korean_font_lg, fill=(0, 200, 0))
                panel_info = cv2.cvtColor(np.array(panel_pil), cv2.COLOR_RGB2BGR)
            except:
                pass
        
        y_pos += 50
    
    cv2.putText(panel_info, f"Total: {len(tracked_objects)}", (10, h - 20),
               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
    
    # FRAME 3: STATS - Match video height
    panel_stats = np.ones((h, 280, 3), dtype=np.uint8) * 30
    
    cv2.putText(panel_stats, "STATISTICS", (10, 40),
               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
    
    y_pos = 90
    cv2.putText(panel_stats, f"Frame: {frame_count}", (15, y_pos),
               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (100, 200, 100), 1)
    y_pos += 40
    
    cv2.putText(panel_stats, f"Detected: {total_detected}", (15, y_pos),
               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (100, 200, 100), 1)
    y_pos += 40
    
    cv2.putText(panel_stats, f"Active: {len(tracked_objects)}", (15, y_pos),
               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (100, 200, 100), 1)
    y_pos += 40
    
    avg_conf = np.mean([obj['confidence'] for obj in tracked_objects.values()]) if tracked_objects else 0
    cv2.putText(panel_stats, f"Avg Conf: {avg_conf:.1%}", (15, y_pos),
               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (100, 200, 100), 1)
    y_pos += 60
    
    cv2.putText(panel_stats, "TOP CLASSES", (10, y_pos),
               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (100, 255, 100), 1)
    y_pos += 35
    
    for label, count in sorted(class_count.items(), key=lambda x: x[1], reverse=True)[:5]:
        cv2.putText(panel_stats, f"{label}: {count}", (15, y_pos),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (150, 150, 255), 1)
        y_pos += 30
    
    # FRAME 4: HISTORY GRAPH - Match video height
    panel_history = np.ones((h, 250, 3), dtype=np.uint8) * 30
    
    cv2.putText(panel_history, "DETECTION HISTORY", (10, 40),
               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 100, 100), 2)
    
    # Draw graph
    if len(detection_history) > 1:
        max_det = max(detection_history) if detection_history else 1
        scale = (h - 120) / max(max_det, 1)
        
        for i, count in enumerate(detection_history):
            x = int((i / len(detection_history)) * 230) + 10
            y = h - 60 - int(count * scale)
            cv2.circle(panel_history, (x, y), 2, (0, 255, 100), -1)
    
    # Current count
    current_count = detection_history[-1] if detection_history else 0
    cv2.putText(panel_history, f"Now: {current_count}", (15, h - 20),
               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 200, 0), 2)
    
    # Combine: Side by side layout (Video + 3 panels stacked)
    top_row = np.hstack([display, panel_info])  # Video + Objects
    bottom_left = np.vstack([panel_stats, np.ones((50, 280, 3), dtype=np.uint8) * 30])  # Stats + spacer
    bottom_right = np.vstack([panel_history, np.ones((50, 250, 3), dtype=np.uint8) * 30])  # History + spacer
    bottom_row = np.hstack([bottom_left, bottom_right])  # Stats + History
    
    # Make bottom_row same width as top_row by padding
    top_width = top_row.shape[1]
    bottom_width = bottom_row.shape[1]
    
    if top_width > bottom_width:
        padding = np.ones((bottom_row.shape[0], top_width - bottom_width, 3), dtype=np.uint8) * 30
        bottom_row = np.hstack([bottom_row, padding])
    elif bottom_width > top_width:
        padding = np.ones((top_row.shape[0], bottom_width - top_width, 3), dtype=np.uint8) * 30
        top_row = np.hstack([top_row, padding])
    
    result = np.vstack([top_row, bottom_row])
    
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
        print(f"🔄 Detection speed: Every {skip_frames + 1} frame")
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
    elif key == ord('h'):
        print("\nKEYBOARDS:")
        print("  q = Quit, s = Save, r = Speed, t = Tracking")
        print("  c = Confidence, f = Fullscreen, h = This help")

cap.release()
cv2.destroyAllWindows()
print("\n✅ Closed!")
