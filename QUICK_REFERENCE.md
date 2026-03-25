# 🚀 YOLO Detection System - Quick Reference

## ⚡ Quick Start

```bash
# Terminal 1: Start Backend
cd ~/HANGUL/BE && npm start

# Terminal 2: Start Frontend  
cd ~/HANGUL/FE && npm run dev

# Terminal 3: Start YOLO Server
cd ~/HANGUL/AI/ai-backend && python3 yolo_flask_server_postgres.py
```

## 🌐 URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | Main app |
| **Camera** | http://localhost:3000/camera | YOLO detection |
| **Analytics** | http://localhost:3000/analytics | Stats dashboard |
| **Backend** | http://localhost:5000 | REST API |
| **YOLO Server** | http://localhost:5002 | Detection engine |
| **PostgreSQL** | localhost:5432 | Database |

## 📡 API Examples

### Health Check
```bash
curl http://localhost:5002/api/yolo/health
```

### Get Analytics
```bash
TOKEN="your_jwt_token"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/yolo/stats/1
```

### Export Data
```bash
curl http://localhost:5002/api/yolo/export?format=csv > detections.csv
```

## 🎮 Browser Operations

### Camera Page (localhost:3000/camera)
| Button | Action |
|--------|--------|
| ▶️ Bắt đầu | Start detection |
| ⏹️ Dừng | Stop detection |
| 🎬 Ghi video | Start/stop recording |
| 💾 Lưu | Save detections to DB |
| 📥 Export CSV | Download CSV |
| 📥 Export JSON | Download JSON |
| 🗑️ Xóa | Clear history |
| 🔊 | Speak label |

### Analytics Page (localhost:3000/analytics)
- 📊 View total detections
- 📈 See label distribution
- 📉 Check daily trends
- 📅 Filter by 7/30/90 days
- 📑 View recent detections table
- 🔗 Link back to camera

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| **YOLODetection** | Individual detections |
| **DetectionSession** | Group detections by session |
| **DetectionStats** | User analytics |
| **BatchJob** | Batch processing tracking |

## 🔑 Test Credentials

```
Email: test@example.com
Password: password123
User ID: 1
```

## 🔐 Authentication

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq '.token'

# Use token
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/yolo/stats/1
```

## 📊 Key Metrics Tracked

- **Total Detections** - All-time count
- **Unique Labels** - Different object types
- **Top Label** - Most detected object
- **Confidence** - Detection certainty (0-100%)
- **Daily Trends** - Detections per day
- **Label Distribution** - % of each object type

## 🐛 Common Issues

### YOLO Server not responding
```bash
# Check if running
curl http://localhost:5002/api/yolo/health

# Restart if needed
pkill -9 -f yolo_flask_server
cd ~/HANGUL/AI/ai-backend && python3 yolo_flask_server_postgres.py
```

### No detections showing
- Verify webcam: `ls /dev/video*`
- Click ▶️ Bắt đầu button
- Check browser console for errors
- Verify YOLO server logs

### Analytics page showing no data
- Save some detections first
- Verify JWT token is valid
- Check Backend API running on 5000
- Check browser console for errors

### Database connection failed
```bash
# Verify credentials
python3 << 'EOF'
import psycopg2
psycopg2.connect(
    host='localhost',
    database='hangul',
    user='hangul',
    password='hangul123'
)
print("✅ OK")
EOF
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `BE/src/routes/yolo.routes.js` | Backend YOLO API |
| `FE/src/app/analytics/page.tsx` | Dashboard page |
| `AI/ai-backend/yolo_flask_server_postgres.py` | YOLO engine |
| `BE/prisma/schema.prisma` | Database schema |
| `YOLO_DETECTION_GUIDE.md` | Full documentation |
| `IMPLEMENTATION_COMPLETE.md` | Implementation summary |

## 🎯 Typical Workflow

1. **Open browser**: http://localhost:3000/camera
2. **Login** with test credentials
3. **Click ▶️** to start detection
4. **Watch** MJPEG stream with live detections
5. **Click 💾** to save detections to database
6. **Go to Analytics**: http://localhost:3000/analytics
7. **View stats** and trends
8. **Export** data as CSV/JSON if needed

## 💡 Pro Tips

- Use Chrome DevTools Network tab to debug API calls
- Check Backend logs with: `tail -f /path/to/logs`
- Restart YOLO server if webcam freezes
- Analytics data updates in real-time
- Can filter detections by label in API calls
- Session IDs group detections from same session

## 🔗 Documentation

- **Full Guide**: `YOLO_DETECTION_GUIDE.md`
- **Implementation Summary**: `IMPLEMENTATION_COMPLETE.md`
- **This Quick Reference**: This file

## ✅ System Health Check

```bash
# All 4 services should be running

# Check Backend
curl -s http://localhost:5000/api/health | jq .

# Check YOLO Server
curl -s http://localhost:5002/api/yolo/health | jq .

# Check Frontend
curl -s http://localhost:3000 | head -c 100

# Check Database
psql -U hangul -d hangul -c "SELECT COUNT(*) FROM \"YOLODetection\";"
```

---

**Last Updated**: March 25, 2026  
**Status**: ✅ Production Ready  
**Version**: 1.0.0
