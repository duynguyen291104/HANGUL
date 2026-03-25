# AI Folder - Quick Summary (Vietnamese)

## 🎯 TỔNG QUÁT

```
AI folder có 2 phần chính:
  1. ROOT (AI/) - Chứa app.py + model file
  2. ai-backend/ - Chứa main server + files hỗ trợ
```

---

## 📌 FILE QUAN TRỌNG

### **❌ TUYỆT ĐỐI KHÔNG XÓA (Hệ thống sẽ hỏng)**

| File | Vai trò | Nếu xóa → ? |
|------|---------|-----------|
| `yolo_flask_server_postgres.py` | Server chính (port 5002) | Tính năng camera chết hoàn toàn |
| `requirements.txt` | Danh sách thư viện Python | Không cài được dependencies, server not start |
| `labels_ko.json` | Map từng Anh→Hàn | Camera chỉ hiển thị tiếng Anh |
| `yolov8s.pt` | Model YOLO | Camera không detect được, auto-download lại (5 min) |

### **⚠️ CÓ THỂ XÓA NHƯNG CẨN THẬN (Ảnh hưởng nhỏ)**

| File | Vai trò | Nếu xóa → ? |
|------|---------|-----------|
| `app.py` (ai-backend) | Server backup | Có chính server, không sao |
| `labels_ko_romanization.json` | Phát âm Tiếng Hàn | Mất tính năng phát âm, detector vẫn work |
| `detect_local.py` | Tool test local | Chỉ mất công cụ test, production OK |

### **✅ ĐƯỢC PHÉP XÓA (Không ảnh hưởng)**

```
Cũ/Test/Dev files:
  ❌ yolo_flask_server.py (v1 cũ)
  ❌ yolo_flask_server_v2.py (v2 cũ)
  ❌ webcam_*.py (5 files - giao diện cũ)
  ❌ quick_test.py, test_detection.py
  ❌ train_custom_model.py
  ❌ yolo_menu.py
  ❌ labels_ko_fixed.json (cũ)

Dataset lớn:
  ❌ coco128/ (500MB)
  ❌ coco128_split/ (500MB)

Root:
  ❌ AI/app.py (bản cũ)

Tổng: Xóa được ~1.5GB, KHÔNG RISK
```

---

## 🔗 CÁCH HOẠT ĐỘNG

```
User mở Camera
  ↓
Frontend gọi GET /api/yolo/stream
  ↓
Backend forward tới Flask (port 5002)
  ↓
yolo_flask_server_postgres.py nhận request
  ├─ Load yolov8s.pt (model detect)
  ├─ Detect object trong camera frame
  ├─ Map label tiếng Anh → tiếng Hàn (labels_ko.json)
  ├─ Save detection vào Prisma (PostgreSQL)
  └─ Return MJPEG stream về browser
  
✅ Camera hiển thị + Lưu data vào DB
```

**Nếu xóa yolo_flask_server_postgres.py:**
```
→ Backend không có chỗ để gửi request
→ Frontend bị lỗi 404/500
→ Tính năng camera completely broken
```

**Nếu xóa labels_ko.json:**
```
→ Server start nhưng console error
→ Camera detect được nhưng hiển thị tiếng Anh
→ "person" thay vì "사람"
→ UX xấu nhưng vẫn work
```

---

## 📋 DEPENDENCY MAP

```
yolo_flask_server_postgres.py (MAIN)
  ├─ imports: yolov8s.pt ✅ CRITICAL
  ├─ imports: labels_ko.json ✅ CRITICAL
  ├─ imports: labels_ko_romanization.json ⚠️ OPTIONAL
  └─ imports: requirements.txt (pip install) ✅ CRITICAL
       └─ cài: torch, flask, psycopg2, etc.

Nếu xóa dependencies:
  → Khi start server, python báo "ModuleNotFoundError"
  → Server không chạy được
  → Phải cài lại: pip install -r requirements.txt
```

---

## 🚨 SCENARIO: Nếu xóa nhầm file gì?

**Mình có Git backup, không sao!**

```bash
# Xóa file nhầm? Khôi phục ngay
git checkout HEAD -- <filename>

# Ví dụ: Xóa nhầm labels_ko.json
git checkout HEAD -- AI/ai-backend/labels_ko.json

# Xóa nhiều file? Khôi phục toàn bộ AI folder
git checkout HEAD -- AI/

# Xem những file bị thay đổi
git status
```

**Thời gian khôi phục: < 10 giây**

---

## 🎯 SAFE DELETION CHECKLIST

Trước khi xóa file nào, hỏi:

1. **❓ File này được import ở đâu không?**
   ```bash
   grep -r "filename" AI/
   # Nếu ko có result → Có thể xóa
   ```

2. **❓ Nó phục vụ tính năng gì?**
   - Tính năng camera → KHÔNG XÓA
   - Test/Dev → Xóa được

3. **❓ Có version mới không?**
   - `yolo_flask_server.py` (v1 cũ) → Xóa được
   - `yolo_flask_server_postgres.py` (latest) → KHÔNG XÓA

4. **❓ Server sẽ start được không khi xóa?**
   ```bash
   # Test: Xóa test file rồi start lại server
   python3 yolo_flask_server_postgres.py
   # Nếu vẫn chạy → Safe to delete
   ```

---

## 📊 FILE STATISTICS

| File | Size | Type | Xóa được? |
|------|------|------|----------|
| yolov8s.pt | 21.5MB | Model | ⚠️ Tái-download |
| yolov8n.pt | 9MB | Model | ✅ Unused |
| yolo_flask_server_postgres.py | 17KB | Main | ❌ Critical |
| app.py (ai-backend) | 18KB | Backup | ⚠️ Optional |
| yolo_flask_server.py | 12KB | Old | ✅ Dead |
| yolo_flask_server_v2.py | 18KB | Old | ✅ Dead |
| webcam_*.py (5 files) | 51KB | Legacy | ✅ Unused |
| coco128/ | 500MB | Test data | ✅ Can remove |
| coco128_split/ | 500MB | Test data | ✅ Can remove |
| labels_ko.json | 2KB | Labels | ❌ Critical |
| labels_ko_romanization.json | 1KB | Romanization | ⚠️ Optional |
| labels_ko_fixed.json | 2KB | Old labels | ✅ Obsolete |
| requirements.txt | 1KB | Config | ❌ Critical |
| **TỔNG** | **~1.5GB** | - | - |

---

## 💡 RECOMMENDED ACTION

**Để giải phóng 1.5GB mà KHÔNG RISk:**

```bash
# 1. Xóa dataset cũ (1GB)
rm -rf AI/ai-backend/coco128/
rm -rf AI/ai-backend/coco128_split/

# 2. Xóa Flask servers cũ (30KB)
rm AI/ai-backend/yolo_flask_server.py
rm AI/ai-backend/yolo_flask_server_v2.py

# 3. Xóa files test (30KB)
rm AI/ai-backend/quick_test.py
rm AI/ai-backend/test_detection.py
rm AI/ai-backend/train_custom_model.py
rm AI/ai-backend/yolo_menu.py

# 4. Xóa webcam cũ (50KB)
rm AI/ai-backend/webcam_*.py

# 5. Xóa files khác
rm AI/ai-backend/labels_ko_fixed.json
rm AI/app.py

# ✅ HOÀN THÀNH: Xóa ~1.5GB, ZERO risk
```

---

## ⚠️ NHỮNG ĐIỀU KHÔNG NÊN LÀM

```
❌ KHÔNG ĐƯỢC XÓA:
  - yolo_flask_server_postgres.py
  - requirements.txt
  - labels_ko.json
  - yolov8s.pt (hoặc sẽ auto-download)

❌ KHÔNG ĐƯỢC LÀM:
  - Chỉnh sửa yolo_flask_server_postgres.py nếu không hiểu
  - Rename files (server sẽ không tìm thấy)
  - Xóa từng part của file Python (sẽ syntax error)

✅ ĐƯỢC PHÉP:
  - Xóa old/test files
  - Khôi phục từ Git nếu làm sai
  - Thêm mới test files
```

---

## 📚 ĐỌC THÊM

File chi tiết: [AI_DEPENDENCY_ANALYSIS.md](../AI_DEPENDENCY_ANALYSIS.md)
Dependency diagram: [AI_DEPENDENCY_DIAGRAM.md](../AI_DEPENDENCY_DIAGRAM.md)

