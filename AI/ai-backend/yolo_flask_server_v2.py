#!/usr/bin/env python3
"""YOLO Detection - Flask Server with Voice, Recording, Database Export"""

import cv2
import numpy as np
import json
import torch
import os
import sys
import threading
import time
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
from flask import Flask, Response, jsonify, request, send_file
from flask_cors import CORS
from gtts import gTTS
import io
import csv

# Setup torch
original_load = torch.load
def patched_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return original_load(*args, **kwargs)
torch.load = patched_load

from ultralytics import YOLO

os.environ['TORCH_WEIGHTS_ONLY'] = '0'

print("=" * 70)
print("🎥 YOLO Detection - Flask Server (Full Features)")
print("=" * 70)

# Initialize Flask
app = Flask(__name__)
CORS(app)

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
model = YOLO('yolov8s.pt')
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

# Global state
class DetectionState:
    def __init__(self):
        self.frame = None
        self.detections = []
        self.lock = threading.Lock()
        self.is_running = False
        self.frame_count = 0
        self.skip_frames = 1
        self.confidence_threshold = 0.35
        self.max_object_age = 15
        self.tracked_objects = {}
        self.next_id = 0
        self.is_recording = False
        self.video_writer = None
        self.detection_history = []  # Store all detections for export
        self.last_spoken = {}  # Track last spoken object to avoid repetition

state = DetectionState()

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

def speak_label(label_ko):
    """Convert Korean text to speech (non-blocking)"""
    def _speak():
        try:
            tts = gTTS(text=label_ko, lang='ko', slow=False)
            tts.save('/tmp/speech.mp3')
            os.system('ffplay -nodisp -autoexit /tmp/speech.mp3 2>/dev/null &')
        except Exception as e:
            print(f"⚠️  TTS Error: {e}")
    
    thread = threading.Thread(target=_speak, daemon=True)
    thread.start()

def start_recording():
    """Start video recording"""
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"/tmp/yolo_recording_{timestamp}.avi"
        
        fourcc = cv2.VideoWriter_fourcc(*'MJPG')
        state.video_writer = cv2.VideoWriter(output_file, fourcc, 30.0, (1280, 720))
        state.is_recording = True
        print(f"🎬 Recording started: {output_file}")
        return output_file
    except Exception as e:
        print(f"❌ Recording error: {e}")
        return None

def stop_recording():
    """Stop video recording"""
    if state.video_writer:
        state.video_writer.release()
        state.is_recording = False
        print("🛑 Recording stopped")

def process_frames():
    """Background thread to process webcam frames"""
    print("\n🚀 Detection thread started!")
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ Cannot open webcam!")
        return
    
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    cap.set(cv2.CAP_PROP_FPS, 30)
    
    state.is_running = True
    
    while state.is_running:
        ret, frame = cap.read()
        if not ret:
            break
        
        state.frame_count += 1
        h, w = frame.shape[:2]
        
        # Write to video if recording
        if state.is_recording and state.video_writer:
            state.video_writer.write(frame)
        
        # Age objects
        for obj_id in list(state.tracked_objects.keys()):
            state.tracked_objects[obj_id]['age'] += 1
            if state.tracked_objects[obj_id]['age'] > state.max_object_age:
                del state.tracked_objects[obj_id]
        
        # Detect
        if state.frame_count % (state.skip_frames + 1) == 0:
            results = model(frame, conf=state.confidence_threshold)
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
                
                for obj_id, obj_data in state.tracked_objects.items():
                    if obj_id in matched_ids:
                        continue
                    iou_score = iou(detection['bbox'], obj_data['bbox'])
                    if iou_score > best_iou:
                        best_iou = iou_score
                        best_id = obj_id
                
                if best_id is not None:
                    state.tracked_objects[best_id].update({
                        'bbox': detection['bbox'],
                        'label': detection['label'],
                        'confidence': detection['confidence'],
                        'age': 0,
                    })
                    matched_ids.add(best_id)
                else:
                    state.tracked_objects[state.next_id] = {
                        'bbox': detection['bbox'],
                        'label': detection['label'],
                        'confidence': detection['confidence'],
                        'age': 0,
                    }
                    state.next_id += 1
        
        # Draw on frame
        display = frame.copy()
        
        # Draw boxes
        for obj_id, obj_data in state.tracked_objects.items():
            x1, y1, x2, y2 = obj_data['bbox']
            alpha = max(0.3, 1.0 - (obj_data['age'] / state.max_object_age))
            color = (0, int(255 * alpha), 0)
            thickness = max(2, int(4 * obj_data['confidence']))
            
            cv2.rectangle(display, (x1, y1), (x2, y2), color, thickness)
        
        # Draw Korean text with PIL
        if korean_font and state.tracked_objects:
            try:
                display_pil = Image.fromarray(cv2.cvtColor(display, cv2.COLOR_BGR2RGB))
                draw = ImageDraw.Draw(display_pil)
                
                for obj_id, obj_data in state.tracked_objects.items():
                    x1, y1, x2, y2 = obj_data['bbox']
                    label = obj_data['label']
                    conf = obj_data['confidence']
                    
                    text = f"{label} {conf:.0%}"
                    try:
                        bbox = draw.textbbox((x1 + 10, y1 - 50), text, font=korean_font)
                        padding = 8
                        draw.rectangle([bbox[0] - padding, bbox[1] - padding, 
                                       bbox[2] + padding, bbox[3] + padding], 
                                      fill=(0, 200, 50))
                        draw.text((x1 + 10, y1 - 50), text, font=korean_font, fill=(0, 0, 0))
                    except:
                        pass
                
                display = cv2.cvtColor(np.array(display_pil), cv2.COLOR_RGB2BGR)
            except Exception as e:
                print(f"⚠️  Text drawing error: {e}")
        
        # Store frame and detections
        with state.lock:
            _, buffer = cv2.imencode('.jpg', display, [cv2.IMWRITE_JPEG_QUALITY, 80])
            state.frame = buffer.tobytes()
            state.detections = list(state.tracked_objects.values())
    
    cap.release()
    if state.video_writer:
        state.video_writer.release()
    state.is_running = False
    print("✋ Detection thread stopped")

# Routes
@app.route('/api/yolo/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        'status': 'ok',
        'is_running': state.is_running,
        'frame_count': state.frame_count,
        'detections': len(state.detections),
        'recording': state.is_recording,
    })

@app.route('/api/yolo/stream', methods=['GET'])
def stream():
    """MJPEG stream"""
    def generate():
        while True:
            if state.frame is not None:
                with state.lock:
                    frame_data = state.frame
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n'
                       b'Content-Length: ' + str(len(frame_data)).encode() + b'\r\n\r\n' + 
                       frame_data + b'\r\n')
            else:
                blank = np.zeros((720, 1280, 3), dtype=np.uint8)
                cv2.putText(blank, 'Loading...', (640, 360), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                _, buffer = cv2.imencode('.jpg', blank)
                frame_data = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n'
                       b'Content-Length: ' + str(len(frame_data)).encode() + b'\r\n\r\n' + 
                       frame_data + b'\r\n')
    
    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/yolo/detections', methods=['GET'])
def get_detections():
    """Get current detections as JSON"""
    with state.lock:
        detections = []
        for obj_id, obj_data in state.tracked_objects.items():
            x1, y1, x2, y2 = obj_data['bbox']
            detections.append({
                'id': obj_id,
                'label': obj_data['label'],
                'confidence': round(obj_data['confidence'], 2),
                'bbox': [x1, y1, x2, y2],
                'age': obj_data['age'],
            })
    
    return jsonify({
        'count': len(detections),
        'detections': detections,
        'frame_count': state.frame_count,
        'is_running': state.is_running,
    })

@app.route('/api/yolo/speak', methods=['POST'])
def speak():
    """Text-to-speech for Korean label"""
    try:
        data = request.get_json()
        label = data.get('label', '')
        
        if label:
            speak_label(label)
            return jsonify({'status': 'speaking', 'label': label})
        return jsonify({'error': 'No label provided'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/yolo/record/start', methods=['POST'])
def start_record():
    """Start video recording"""
    try:
        output_file = start_recording()
        return jsonify({'status': 'recording', 'file': output_file})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/yolo/record/stop', methods=['POST'])
def stop_record():
    """Stop video recording"""
    try:
        stop_recording()
        return jsonify({'status': 'stopped'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/yolo/detections/save', methods=['POST'])
def save_detections():
    """Save current detections to history"""
    try:
        data = request.get_json()
        timestamp = datetime.now().isoformat()
        
        with state.lock:
            detections_copy = list(state.tracked_objects.values())
        
        for det in detections_copy:
            state.detection_history.append({
                'timestamp': timestamp,
                'label': det['label'],
                'confidence': round(det['confidence'], 4),
                'bbox': det['bbox'],
            })
        
        return jsonify({
            'status': 'saved',
            'count': len(detections_copy),
            'total_history': len(state.detection_history),
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/yolo/detections/export', methods=['GET'])
def export_detections():
    """Export detections as CSV"""
    try:
        format_type = request.args.get('format', 'csv').lower()
        
        if format_type == 'json':
            # JSON export
            return jsonify({
                'count': len(state.detection_history),
                'detections': state.detection_history,
            })
        
        else:
            # CSV export
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=['timestamp', 'label', 'confidence', 'bbox'])
            writer.writeheader()
            
            for det in state.detection_history:
                writer.writerow({
                    'timestamp': det['timestamp'],
                    'label': det['label'],
                    'confidence': det['confidence'],
                    'bbox': str(det['bbox']),
                })
            
            # Return as file download
            output.seek(0)
            return Response(
                output.getvalue(),
                mimetype='text/csv',
                headers={'Content-Disposition': 'attachment;filename=detections.csv'}
            )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/yolo/detections/history', methods=['GET'])
def get_history():
    """Get detection history"""
    limit = request.args.get('limit', 100, type=int)
    return jsonify({
        'count': len(state.detection_history),
        'history': state.detection_history[-limit:],
    })

@app.route('/api/yolo/detections/clear', methods=['POST'])
def clear_history():
    """Clear detection history"""
    state.detection_history.clear()
    return jsonify({'status': 'cleared'})

@app.route('/api/yolo/config', methods=['GET', 'POST'])
def config():
    """Get/Set detection configuration"""
    if request.method == 'POST':
        data = request.get_json()
        if 'skip_frames' in data:
            state.skip_frames = data['skip_frames']
        if 'confidence_threshold' in data:
            state.confidence_threshold = data['confidence_threshold']
        if 'max_object_age' in data:
            state.max_object_age = data['max_object_age']
    
    return jsonify({
        'skip_frames': state.skip_frames,
        'confidence_threshold': state.confidence_threshold,
        'max_object_age': state.max_object_age,
    })

@app.route('/api/yolo/start', methods=['POST'])
def start():
    """Start detection"""
    if not state.is_running:
        thread = threading.Thread(target=process_frames, daemon=True)
        thread.start()
        return jsonify({'status': 'started'})
    return jsonify({'status': 'already running'})

@app.route('/api/yolo/stop', methods=['POST'])
def stop():
    """Stop detection"""
    state.is_running = False
    return jsonify({'status': 'stopped'})

if __name__ == '__main__':
    print("\n" + "=" * 70)
    print("🌐 YOLO Flask Server - Full Features")
    print("=" * 70)
    print("\n📡 API Endpoints:")
    print("  GET  /api/yolo/health              - Health check")
    print("  GET  /api/yolo/stream              - MJPEG stream")
    print("  GET  /api/yolo/detections          - JSON detections")
    print("  POST /api/yolo/speak               - Text-to-speech (Korean)")
    print("  POST /api/yolo/record/start        - Start recording")
    print("  POST /api/yolo/record/stop         - Stop recording")
    print("  POST /api/yolo/detections/save     - Save to history")
    print("  GET  /api/yolo/detections/export   - Export as CSV/JSON")
    print("  GET  /api/yolo/detections/history  - Get history")
    print("  POST /api/yolo/detections/clear    - Clear history")
    print("  POST /api/yolo/start               - Start detection")
    print("  POST /api/yolo/stop                - Stop detection")
    print("\n🚀 Starting on http://localhost:5002")
    print("=" * 70 + "\n")
    
    app.run(host='0.0.0.0', port=5002, debug=False, threaded=True)
