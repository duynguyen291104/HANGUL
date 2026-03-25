# AI Folder - Dependency Diagram

## 🎯 QUICK REFERENCE

### **PRODUCTION FLOW (Những gì chạy thực tế)**
```
Frontend (Camera page)
  ↓ GET /api/yolo/stream
Backend (5000)
  ↓ requests to:
Flask AI Server (5002)
  yolo_flask_server_postgres.py ✅ MAIN
  ├─ imports: yolov8s.pt
  ├─ imports: labels_ko.json
  ├─ imports: psycopg2
  └─ outputs: Korean labels + save to DB
```

### **If Main Server Fails**
```
Fallback Server (5001)
  app.py (ai-backend) ✅ BACKUP
  ├─ imports: yolov8s.pt
  ├─ imports: labels_ko.json
  └─ outputs: Korean labels (no DB save)
```

---

## 📦 FILE CATEGORIES

### **TIER 1: CRITICAL (❌ NEVER DELETE)**
```
Layer 1 - Server
  └─ yolo_flask_server_postgres.py (17KB)
       │
       ├─ requires: yolov8s.pt
       │              (21.5MB model, auto-downloads)
       │
       ├─ requires: labels_ko.json
       │              (2KB, Korean label mapping)
       │
       ├─ requires: labels_ko_romanization.json
       │              (1KB, Optional pronunciation)
       │
       └─ requires: requirements.txt
                     (Dependency list)

Layer 2 - Backup Server
  └─ app.py (ai-backend)
       └─ Same imports as main server

Result: Deleting any = Camera feature broken
```

### **TIER 2: OPTIONAL (⚠️ CAN DELETE WITH CARE)**
```
detect_local.py (7.8KB)
  ├─ Status: Development tool
  ├─ Usage: Local image detection testing
  ├─ Depends: labels_ko_fixed.json
  └─ Impact: Only local testing, not critical

vocab_mapping.json (1KB)
  ├─ Status: Legacy vocabulary
  ├─ Usage: Backup vocab mapping
  └─ Impact: Zero if not used

data.yaml (1KB)
  ├─ Status: Dataset config
  ├─ Usage: Model training only
  └─ Impact: Zero for production
```

### **TIER 3: SAFE TO DELETE (✅ YES)**
```
Old Flask Servers
├─ yolo_flask_server.py (12KB) - Version 1
├─ yolo_flask_server_v2.py (18KB) - Version 2
└─ Status: Completely replaced by postgres version

Test/Development Scripts
├─ quick_test.py (0.5KB)
├─ test_detection.py (2.9KB)
├─ train_custom_model.py (3.5KB)
├─ yolo_menu.py (3.3KB)
└─ Status: Development only, never imported

Webcam Legacy Interfaces
├─ webcam_detection.py (8.0KB)
├─ webcam_full_interface.py (14KB)
├─ webcam_fullscreen.py (8.3KB)
├─ webcam_smooth.py (11KB)
├─ webcam_with_panel.py (10KB)
└─ Status: Replaced by Flask API

Dataset Files (1GB+)
├─ coco128/ (500MB)
├─ coco128_split/ (500MB)
└─ Status: Test data, not needed for production

Old Label File
└─ labels_ko_fixed.json (2KB) - Replaced by labels_ko.json
```

---

## 🔗 IMPORT ANALYSIS

### **What yolo_flask_server_postgres.py imports:**
```python
✅ REQUIRED (will crash if missing):
  - ultralytics.YOLO (from requirements.txt)
  - torch (from requirements.txt)
  - cv2 (from requirements.txt)
  - flask
  - psycopg2 (PostgreSQL)

✅ FILES LOADED AT STARTUP:
  - yolov8s.pt (21.5MB model)
    └─ If missing: Auto-downloads, waits 5 min
    └─ If deleted: System restarts, downloads again

  - labels_ko.json (Korean mapping)
    └─ If missing: Console error "labels_ko.json not found"
    └─ If deleted: Camera shows English labels only
```

### **What app.py (ai-backend) imports:**
```python
✅ SAME AS MAIN but without PostgreSQL
  - ultralytics.YOLO
  - torch
  - cv2
  - flask
  - labels_ko.json (optional fallback)

NOTE: This server is backup/fallback
If you delete it, main server still works
```

### **What other files import:**
```python
detect_local.py imports:
  - labels_ko_fixed.json (legacy)
  - yolov8s.pt
  └─ If missing: Script fails, but doesn't affect system

webcam_*.py (all 5 files) import:
  - cv2, torch, ultralytics
  └─ If deleted: System unaffected (never called)

quick_test.py, test_detection.py import:
  - Test utilities only
  └─ If deleted: Tests can't run, but production OK
```

---

## 🚨 CONFLICT SCENARIOS

### **Scenario A: File Size Conflict**
```
❌ Problem: yolov8s.pt exists in TWO places
  └─ AI/yolov8s.pt (21.5MB)
  └─ AI/ai-backend/yolov8s.pt (21.5MB)

Why: Both servers can load it, takes ~43MB total
Safe: Keeping both is fine, but wasteful

Solution: Use symlink to avoid duplication
  ln -s ../yolov8s.pt AI/ai-backend/yolov8s.pt
```

### **Scenario B: Version Conflict with Labels**
```
Problem: THREE label files exist
  ├─ labels_ko.json (CURRENT)
  ├─ labels_ko_fixed.json (OLD)
  └─ labels_ko_romanization.json (EXTENSION)

Which one is used?
  ✅ yolo_flask_server_postgres.py → labels_ko.json
  ✅ yolo_flask_server_postgres.py → labels_ko_romanization.json
  ❌ detect_local.py → labels_ko_fixed.json (only)

Safe to delete?
  ✅ YES - labels_ko_fixed.json is obsolete
  ⚠️  MAYBE - vocab_mapping.json (legacy fallback)
```

### **Scenario C: Server Port Conflict**
```
Three Flask servers trying to run:
  ❌ yolo_flask_server.py (port 5002) - DEAD
  ❌ yolo_flask_server_v2.py (port 5002) - DEAD
  ✅ yolo_flask_server_postgres.py (port 5002) - ACTIVE

If you run old version by mistake:
  → Port 5002 already in use
  → New server crashes
  → But your current start script uses postgres version

Safe: Delete old versions so accidental run doesn't happen
```

### **Scenario D: Model Conflict**
```
Two YOLO models exist:
  ├─ yolov8n.pt (9MB, nano - not used)
  └─ yolov8s.pt (21.5MB, small - used by system)

If system tries to use wrong model:
  → Detection works but slower
  → Or wrong accuracy

Current system uses hardcoded:
  YOLO('yolov8s.pt')
  
So yolov8n.pt is completely unused

Safe to delete:
  ✅ YES - yolov8n.pt never imported
```

---

## 📊 DEPENDENCY TREE

```
PRODUCTION (What runs when user uses camera)
│
├─ yolo_flask_server_postgres.py (MAIN)
│  ├─ yolov8s.pt (model) ✅ CRITICAL
│  ├─ labels_ko.json (labels) ✅ CRITICAL
│  ├─ labels_ko_romanization.json (romanization) ⚠️ OPTIONAL
│  ├─ requirements.txt (deps) ✅ CRITICAL
│  └─ PostgreSQL (external)
│
└─ Fallback: app.py (ai-backend)
   ├─ Same files
   └─ If main fails, this runs

DEVELOPMENT (Never used in production)
│
├─ yolo_flask_server.py (DEAD) ❌
├─ yolo_flask_server_v2.py (DEAD) ❌
├─ detect_local.py (TEST) ✅ CAN DELETE
├─ All webcam_*.py (LEGACY) ✅ CAN DELETE
├─ All test_*.py (DEV) ✅ CAN DELETE
└─ coco128/, coco128_split/ (DATA) ✅ CAN DELETE

OPTIONAL CONFIG
│
├─ data.yaml (training config) ✅ CAN DELETE
├─ vocab_mapping.json (legacy vocab) ✅ CAN DELETE
└─ labels_ko_fixed.json (old labels) ✅ CAN DELETE
```

---

## ✅ SAFE DELETION COMMANDS

**These are 100% safe - no system impact:**

```bash
# Remove old Flask servers
rm AI/ai-backend/yolo_flask_server.py
rm AI/ai-backend/yolo_flask_server_v2.py

# Remove test datasets (saves 1GB)
rm -rf AI/ai-backend/coco128
rm -rf AI/ai-backend/coco128_split

# Remove test scripts
rm AI/ai-backend/quick_test.py
rm AI/ai-backend/test_detection.py
rm AI/ai-backend/train_custom_model.py
rm AI/ai-backend/yolo_menu.py

# Remove old webcam interfaces
rm AI/ai-backend/webcam_detection.py
rm AI/ai-backend/webcam_full_interface.py
rm AI/ai-backend/webcam_fullscreen.py
rm AI/ai-backend/webcam_smooth.py
rm AI/ai-backend/webcam_with_panel.py

# Remove old root server
rm AI/app.py

# Remove old label file
rm AI/ai-backend/labels_ko_fixed.json

# TOTAL: Frees ~1.5GB, ZERO impact
```

**These are optional (ask first):**

```bash
# Only if not doing local detection testing
rm AI/ai-backend/detect_local.py

# Only if not maintaining legacy vocab
rm AI/ai-backend/vocab_mapping.json

# Only if not training custom models
rm AI/ai-backend/data.yaml
```

**NEVER delete these:**

```bash
# CRITICAL - System won't work
❌ DO NOT: rm AI/ai-backend/yolo_flask_server_postgres.py
❌ DO NOT: rm AI/ai-backend/requirements.txt
❌ DO NOT: rm AI/ai-backend/labels_ko.json
❌ DO NOT: rm AI/yolov8s.pt (or it auto-downloads)
```

---

## 🔄 GIT RECOVERY

**If you delete wrong file, recover with:**

```bash
# Restore one file
git checkout HEAD -- AI/ai-backend/yolo_flask_server_postgres.py

# Restore entire AI folder
git checkout HEAD -- AI/

# See what was deleted
git status

# Restore everything deleted
git checkout HEAD -- .
```

**Check what changed before committing:**

```bash
git diff AI/  # See changes
git status    # See deleted/modified files
```

---

## 📋 CLEAN-UP CHECKLIST

Before deleting any file:

- [ ] **Is it imported somewhere?** 
  - `grep -r "filename" AI/`
  - If zero results → Safe to delete

- [ ] **Is it production code?**
  - Check git log: `git log --oneline AI/filename | head -1`
  - If "Test" or "Dev" in name → Safe to delete

- [ ] **Is there a newer version?**
  - `ls -la AI/ai-backend/yolo_*.py`
  - If multiple versions → Keep only latest

- [ ] **Will server break?**
  - If it's yolo_flask_server_postgres.py → DON'T DELETE
  - If it's requirements.txt → DON'T DELETE
  - If it's labels_ko.json → DON'T DELETE
  - Otherwise → Probably safe

- [ ] **Have I committed to git?**
  - `git status`
  - Always commit before cleanup
  - Can restore if needed

