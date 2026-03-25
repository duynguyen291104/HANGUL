"""
HANGUL Learning App - Flask AI Backend

Services:
- Camera object detection (YOLOv8)
- Pronunciation scoring (Azure Speech Services)
- Text-to-speech (Google Cloud)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import numpy as np
from PIL import Image
import io
import os
import torch

# Patch torch.load for weights_only issue
original_load = torch.load
def patched_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return original_load(*args, **kwargs)
torch.load = patched_load

from ultralytics import YOLO

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load YOLO model once on startup
print("📦 Loading YOLO model...")
model = YOLO('yolov8s.pt')
print("✅ Model loaded!")

# Korean labels for COCO classes
KOREAN_LABELS = {
    'person': '사람', 'bicycle': '자전거', 'car': '자동차', 'motorcycle': '오토바이',
    'airplane': '비행기', 'bus': '버스', 'train': '기차', 'truck': '트럭',
    'boat': '배', 'traffic light': '신호등', 'fire hydrant': '소화전',
    'stop sign': '정지 표지판', 'parking meter': '주차 미터기', 'bench': '벤치',
    'bird': '새', 'cat': '고양이', 'dog': '개', 'horse': '말', 'sheep': '양',
    'cow': '소', 'elephant': '코끼리', 'bear': '곰', 'zebra': '얼룩말',
    'giraffe': '기린', 'backpack': '배낭', 'umbrella': '우산', 'handbag': '핸드백',
    'tie': '넥타이', 'suitcase': '여행 가방', 'frisbee': '프리스비', 'skis': '스키',
    'snowboard': '스노보드', 'sports ball': '공', 'kite': '연', 'baseball bat': '야구 방망이',
    'baseball glove': '야구 글러브', 'skateboard': '스케이트보드', 'surfboard': '서핑보드',
    'tennis racket': '테니스 라켓', 'bottle': '병', 'wine glass': '와인잔', 'cup': '컵',
    'fork': '포크', 'knife': '칼', 'spoon': '숟가락', 'bowl': '그릇',
    'banana': '바나나', 'apple': '사과', 'sandwich': '샌드위치', 'orange': '오렌지',
    'broccoli': '브로콜리', 'carrot': '당근', 'hot dog': '핫도그', 'pizza': '피자',
    'donut': '도넛', 'cake': '케이크', 'chair': '의자', 'couch': '소파',
    'potted plant': '화분', 'bed': '침대', 'dining table': '식탁', 'toilet': '화장실',
    'tv': '텔레비전', 'laptop': '노트북', 'mouse': '마우스', 'remote': '리모콘',
    'keyboard': '키보드', 'microwave': '전자레인지', 'oven': '오븐', 'toaster': '토스터',
    'sink': '싱크대', 'refrigerator': '냉장고', 'book': '책', 'clock': '시계',
    'vase': '꽃병', 'scissors': '가위', 'teddy bear': '테디 베어', 'hair drier': '드라이기',
    'toothbrush': '칫솔', 'phone': '휴대폰', 'computer': '컴퓨터', 'keyboard': '키보드',
    'headphones': '헤드폰',
}

# ========================
# ROUTES
# ========================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'HANGUL Flask AI Backend',
        'version': '0.2.0',
        'model': 'yolov8s'
    })

@app.route('/api/detect', methods=['POST'])
def detect():
    """
    Camera object detection endpoint (new)
    
    Request:
        {
            "image": "data:image/jpeg;base64,..."
        }
    
    Response:
        {
            "objects": [
                {
                    "class": "cup",
                    "korean": "컵",
                    "confidence": 0.95
                }
            ]
        }
    """
    try:
        data = request.json
        image_base64 = data.get('image')
        
        if not image_base64:
            return jsonify({'error': 'No image provided'}), 400
        
        # Remove data URL prefix if present
        if image_base64.startswith('data:image'):
            image_base64 = image_base64.split(',')[1]
        
        # Decode base64 image
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        
        # Run YOLO detection
        results = model(image, conf=0.35, verbose=False)
        
        # Extract detections
        objects = []
        if results and len(results) > 0:
            detections = results[0]
            for box in detections.boxes:
                class_id = int(box.cls)
                class_name = detections.names[class_id]
                confidence = float(box.conf)
                
                objects.append({
                    'class': class_name,
                    'korean': KOREAN_LABELS.get(class_name, class_name),
                    'confidence': round(confidence, 3),
                })
        
        print(f"✅ Detected {len(objects)} objects")
        return jsonify({'objects': objects}), 200
        
    except Exception as e:
        print(f"❌ Detection error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/detect-camera', methods=['POST'])
def detect_camera():
    """
    Camera object detection endpoint (legacy, calls new /api/detect)
    
    Request:
        {
            "image": "base64_image_string",
            "canvasSize": {"width": 640, "height": 480}
        }
    
    Response:
        {
            "objects": [
                {
                    "name": "cup",
                    "korean": "컵",
                    "confidence": 0.95
                }
            ]
        }
    """
    try:
        data = request.json
        image_base64 = data.get('image')
        
        if not image_base64:
            return jsonify({'error': 'No image provided'}), 400
        
        # Remove data URL prefix if present
        if image_base64.startswith('data:image'):
            image_base64 = image_base64.split(',')[1]
        
        # Decode base64 image
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        
        # Run YOLO detection
        results = model(image, conf=0.35, verbose=False)
        
        # Extract detections
        objects = []
        if results and len(results) > 0:
            detections = results[0]
            for box in detections.boxes:
                class_id = int(box.cls)
                class_name = detections.names[class_id]
                confidence = float(box.conf)
                
                objects.append({
                    'name': class_name,
                    'korean': KOREAN_LABELS.get(class_name, class_name),
                    'confidence': round(confidence, 3),
                })
        
        print(f"✅ Detected {len(objects)} objects")
        return jsonify({'objects': objects}), 200
        
    except Exception as e:
        print(f"❌ Detection error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/pronunciation-score', methods=['POST'])
def score_pronunciation():
    """
    Pronunciation scoring endpoint
    
    Request:
        {
            "audio": "base64_audio_string",
            "word": "apple",
            "userId": 1
        }
    
    Response:
        {
            "accuracyScore": 85,
            "fluencyScore": 80,
            "completenessScore": 90,
            "overallScore": 85,
            "feedback": "Good pronunciation!"
        }
    """
    try:
        data = request.json
        audio_base64 = data.get('audio')
        word = data.get('word')
        
        if not audio_base64 or not word:
            return jsonify({'error': 'Missing audio or word'}), 400
        
        # TODO: Implement Azure Speech Service integration or similar
        # from azure.cognitiveservices.speech import speechconfig, SpeechRecognizer
        
        # Placeholder response
        result = {
            'accuracyScore': 85,
            'fluencyScore': 80,
            'completenessScore': 90,
            'overallScore': 85,
            'feedback': 'Good pronunciation!',
            'phoneticErrors': []
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print('🚀 Flask AI Backend running on port 5001')
    app.run(host='0.0.0.0', port=5001, debug=True)
