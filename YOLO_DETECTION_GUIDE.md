# 🎥 YOLO Detection System with PostgreSQL Integration

## 🎯 Features Overview

The HANGUL application now includes a comprehensive YOLO object detection system with the following capabilities:

### ✅ Completed Features

1. **Real-time Object Detection** 🎯
   - MJPEG streaming to browser
   - YOLOv8s model integration
   - Real-time bounding boxes and labels
   - Korean language labels support

2. **Database Integration** 💾
   - Save detections to PostgreSQL
   - User detection history
   - Detection statistics and analytics
   - Batch job tracking

3. **Analytics Dashboard** 📊
   - Total detections overview
   - Label distribution charts
   - Daily statistics trends
   - Top detected objects
   - Recent detections table

4. **Advanced Features** 🎬
   - Video recording (AVI format)
   - Voice synthesis (Korean TTS)
   - CSV/JSON export
   - Detection history tracking
   - Session management

## 🏗️ Architecture

```
┌──────────────────────────────────────┐
│     Browser (localhost:3000)         │
│  - Next.js Frontend                  │
│  - Camera detection page             │
│  - Analytics dashboard               │
└──────────────┬───────────────────────┘
               │ HTTP/API
┌──────────────▼───────────────────────┐
│  YOLO Flask Server (5002)            │
│  - MJPEG stream                      │
│  - Real-time detection               │
│  - Voice synthesis (gTTS)            │
│  - Video recording                   │
│  - PostgreSQL save                   │
└──────────────┬───────────────────────┘
               │ Prisma ORM
┌──────────────▼───────────────────────┐
│  Backend Express (5000)              │
│  - Detection CRUD API                │
│  - Analytics endpoints               │
│  - Batch job management              │
└──────────────┬───────────────────────┘
               │ SQL
┌──────────────▼───────────────────────┐
│  PostgreSQL (5432)                   │
│  - YOLODetection table               │
│  - DetectionSession table            │
│  - DetectionStats table              │
│  - BatchJob table                    │
└──────────────────────────────────────┘
```

## 📦 Database Schema

### YOLODetection
Stores individual detections from webcam or batch processing.

```sql
CREATE TABLE "YOLODetection" (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT,
  label VARCHAR(100),
  confidence DECIMAL(4, 4),
  bbox JSON,
  sessionId VARCHAR(100),
  frameNumber INT,
  videoUrl VARCHAR(500),
  source VARCHAR(50), -- 'webcam' | 'batch' | 'video'
  status VARCHAR(50), -- 'active' | 'archived'
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (userId) REFERENCES "User"(id)
);
```

### DetectionSession
Groups detections from the same session.

```sql
CREATE TABLE "DetectionSession" (
  id VARCHAR(100) PRIMARY KEY,
  userId INT,
  startTime TIMESTAMP,
  endTime TIMESTAMP,
  totalFrames INT,
  totalDetections INT,
  videoUrl VARCHAR(500),
  deviceInfo JSON,
  settings JSON,
  FOREIGN KEY (userId) REFERENCES "User"(id)
);
```

### DetectionStats
User-level analytics and statistics.

```sql
CREATE TABLE "DetectionStats" (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT UNIQUE,
  totalDetections INT DEFAULT 0,
  uniqueLabels INT DEFAULT 0,
  topLabel VARCHAR(100),
  topLabelCount INT,
  lastDetectionAt TIMESTAMP,
  totalTime INT, -- in seconds
  FOREIGN KEY (userId) REFERENCES "User"(id)
);
```

### BatchJob
Tracks batch processing jobs.

```sql
CREATE TABLE "BatchJob" (
  id VARCHAR(100) PRIMARY KEY,
  userId INT,
  name VARCHAR(200),
  status VARCHAR(50), -- 'pending' | 'processing' | 'completed' | 'failed'
  inputPath VARCHAR(500),
  inputType VARCHAR(50), -- 'video' | 'image' | 'folder'
  fileCount INT,
  progress INT DEFAULT 0, -- percentage
  resultCount INT,
  outputPath VARCHAR(500),
  logPath VARCHAR(500),
  errorMessage TEXT,
  startedAt TIMESTAMP,
  completedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (userId) REFERENCES "User"(id)
);
```

## 🚀 API Endpoints

### YOLO Server (Flask, port 5002)

#### Health Check
```bash
GET /api/yolo/health

Response:
{
  "status": "running",
  "model": "YOLOv8s",
  "database": "✅ Connected",
  "detections": 0,
  "frame_count": 1413,
  "session": "1774434826234"
}
```

#### MJPEG Stream
```bash
GET /api/yolo/stream

# Returns MJPEG stream suitable for <img> or <video> tag
```

#### Get Current Detections
```bash
GET /api/yolo/detections

Response:
{
  "count": 2,
  "detections": [
    {
      "label": "사람",
      "confidence": 0.95,
      "bbox": {"x1": 100, "y1": 100, "x2": 200, "y2": 250},
      "timestamp": "2026-03-25T17:34:00.000Z",
      "frame_number": 1413
    }
  ],
  "frame_number": 1413
}
```

#### Save Detections to PostgreSQL
```bash
POST /api/yolo/save-detections

Body:
{
  "user_id": 1,
  "detections": [...]  # current detections
}

Response:
{
  "success": true,
  "count": 2,
  "session_id": "1774434826234"
}
```

#### Sync to Backend API
```bash
POST /api/yolo/sync-backend

Body:
{
  "detections": [...],
  "user_id": 1
}

Response:
{
  "success": true,
  "count": 2
}
```

#### Voice Synthesis
```bash
POST /api/yolo/speak

Body:
{
  "text": "사람"
}

Response: Audio/MPEG stream
```

#### Recording
```bash
POST /api/yolo/record/start
POST /api/yolo/record/stop
```

#### Export
```bash
GET /api/yolo/export?format=csv|json

Returns: CSV or JSON file download
```

#### Control Detection
```bash
POST /api/yolo/start
POST /api/yolo/stop
POST /api/yolo/reset

Response:
{
  "success": true,
  "message": "Detection started|stopped|reset"
}
```

### Backend API (Express, port 5000)

All endpoints require authentication token.

#### Save Detection
```bash
POST /api/yolo/save
Authorization: Bearer <token>

Body:
{
  "label": "사람",
  "confidence": 0.95,
  "bbox": {"x1": 100, "y1": 100, "x2": 200, "y2": 250},
  "sessionId": "session-123",
  "frameNumber": 100,
  "source": "webcam"
}

Response:
{
  "success": true,
  "id": 1
}
```

#### Batch Save
```bash
POST /api/yolo/batch-save
Authorization: Bearer <token>

Body:
{
  "detections": [...],
  "sessionId": "session-123"
}

Response:
{
  "success": true,
  "count": 5
}
```

#### Get User Detections
```bash
GET /api/yolo/user/:userId?limit=100&offset=0&label=사람
Authorization: Bearer <token>

Response:
{
  "count": 5,
  "total": 100,
  "limit": 100,
  "offset": 0,
  "detections": [...]
}
```

#### Get Detection Stats
```bash
GET /api/yolo/stats/:userId
Authorization: Bearer <token>

Response:
{
  "totalDetections": 150,
  "uniqueLabels": 12,
  "topLabel": "사람",
  "topLabelCount": 45
}
```

#### Get Label Statistics
```bash
GET /api/yolo/labels/:userId
Authorization: Bearer <token>

Response:
{
  "count": 5,
  "labels": [
    {
      "label": "사람",
      "count": 45,
      "percentage": 30
    }
  ]
}
```

#### Get Daily Statistics
```bash
GET /api/yolo/daily/:userId?days=7
Authorization: Bearer <token>

Response:
{
  "days": 7,
  "stats": [
    {
      "date": "2026-03-25",
      "count": 45
    }
  ]
}
```

#### Batch Processing
```bash
POST /api/yolo/batch/create
POST /api/yolo/batch/jobs/:userId
PATCH /api/yolo/batch/:jobId
```

## 💻 Usage Examples

### 1. Start Detection in Browser
```javascript
// In frontend page
await fetch('http://localhost:5002/api/yolo/start', {
  method: 'POST'
});
```

### 2. Save Detections to Database
```javascript
const response = await fetch('http://localhost:5000/api/yolo/batch-save', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    detections: [
      {
        label: '사람',
        confidence: 0.95,
        bbox: {x1: 100, y1: 100, x2: 200, y2: 250},
        frame_number: 100
      }
    ]
  })
});
```

### 3. View Analytics Dashboard
```
URL: http://localhost:3000/analytics
Displays:
- Total detections
- Label distribution
- Daily trends
- Top detected objects
- Recent detections table
```

### 4. Export Data
```bash
# Export as CSV
curl -o detections.csv 'http://localhost:5002/api/yolo/export?format=csv'

# Export as JSON
curl -o detections.json 'http://localhost:5002/api/yolo/export?format=json'
```

## 🔧 Configuration

### YOLO Flask Server

Environment variables (optional):
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hangul
DB_USER=hangul
DB_PASSWORD=hangul123

BACKEND_URL=http://localhost:5000
BACKEND_API_KEY=optional_api_key
```

### Backend API

Environment variables:
```bash
DATABASE_URL=postgresql://hangul:hangul123@localhost:5432/hangul
JWT_SECRET=your_secret_key
```

## 📊 Analytics Dashboard Features

### KPI Cards
- **Total Detections**: All-time detection count
- **Unique Labels**: Number of distinct object types
- **Top Label**: Most frequently detected object
- **Time Range**: Select 7, 30, or 90 days

### Charts
1. **Label Distribution** - Horizontal bar chart of object frequency
2. **Daily Statistics** - Line chart of detections per day
3. **Recent Detections** - Table of latest 50 detections

### Filtering
- Filter by label
- Filter by date range
- Sort by confidence, date, or label

## 🔒 Security Notes

1. All Backend endpoints require authentication
2. YOLO Flask server has optional API key support
3. Database credentials are environment-based
4. Session IDs prevent replay attacks
5. User detection data is isolated by user ID

## 🐛 Troubleshooting

### YOLO Server not connecting to database
```bash
# Check credentials
python3 -c "import psycopg2; psycopg2.connect(host='localhost', database='hangul', user='hangul', password='hangul123')"

# Check logs
tail -f /home/ngocduy/HANGUL/AI/ai-backend/yolo_postgres.log
```

### No detections showing
1. Check if webcam is available: `ls /dev/video*`
2. Verify YOLO model is loaded in logs
3. Check confidence threshold (default 0.35)
4. Make sure detection is started: `POST /api/yolo/start`

### Analytics page not loading
1. Verify authentication token is valid
2. Check Backend API is running on port 5000
3. Verify user has some detections in database
4. Check browser console for errors

## 📝 Files Modified/Created

### Created Files
- `/home/ngocduy/HANGUL/BE/src/routes/yolo.routes.js` - Backend YOLO API routes
- `/home/ngocduy/HANGUL/FE/src/app/analytics/page.tsx` - Analytics dashboard
- `/home/ngocduy/HANGUL/AI/ai-backend/yolo_flask_server_postgres.py` - YOLO with PostgreSQL

### Modified Files
- `/home/ngocduy/HANGUL/BE/src/app.ts` - Added YOLO router
- `/home/ngocduy/HANGUL/BE/prisma/schema.prisma` - Added 4 new models
- `/home/ngocduy/HANGUL/FE/src/app/camera/page.tsx` - Added analytics link and save to DB

## 🚀 Getting Started

1. **Start all services**:
```bash
# Terminal 1: Backend
cd /home/ngocduy/HANGUL/BE && npm start

# Terminal 2: Frontend
cd /home/ngocduy/HANGUL/FE && npm run dev

# Terminal 3: YOLO Server
cd /home/ngocduy/HANGUL/AI/ai-backend && python3 yolo_flask_server_postgres.py
```

2. **Open browser**:
```
Camera Detection: http://localhost:3000/camera
Analytics: http://localhost:3000/analytics
```

3. **Start detection and save data**:
- Click "▶️ Bắt đầu" on camera page
- Click "💾 Lưu" to save detections
- View analytics at `/analytics`

## 📚 Next Steps

- [ ] Custom model training with user data
- [ ] Batch processing endpoint for multiple videos
- [ ] Export reports (PDF, Excel)
- [ ] Real-time notifications
- [ ] Comparison analytics (day-over-day, week-over-week)
- [ ] Integration with email alerts
