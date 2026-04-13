# 🎯 QUIZ SYSTEM - COMPLETE DOCUMENTATION

## 📋 Overview

Hệ thống Quiz đã được thiết kế hoàn toàn theo yêu cầu của bạn:

✅ **Câu hỏi tự động tạo từ vocabulary** - Không hardcode
✅ **Đúng level & topic** - Filter theo user level + topic
✅ **10 câu/lần chơi** - Random không trùng
✅ **4 đáp án chuẩn** - 1 đúng + 3 sai (từ cùng topic + level)
✅ **100% từ PostgreSQL** - Không JSON, không seed
✅ **Admin UI để quản lý** - Tạo, sửa, xóa câu hỏi
✅ **Database table riêng** - QuizQuestion model

---

## 🏗️ Architecture

### 1. **Database Model (QuizQuestion)**

```prisma
model QuizQuestion {
  id                    Int     @id @default(autoincrement())
  vocabularyId          Int     // FK → Vocabulary (correct answer)
  vocabulary            Vocabulary
  topicId               Int     // FK → Topic
  topic                 Topic
  questionText          String  // e.g., "_____ nghĩa là gì?"
  correctAnswerText     String  // Vietnamese meaning
  wrongAnswerIds        Int[]   // Array of 3 wrong vocabulary IDs
  level                 String  // NEWBIE, BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
  usageCount            Int     // Analytics: how many times used
  correctRate           Float   // Analytics: % of correct answers
  isActive              Boolean
  createdAt             DateTime
  updatedAt             DateTime
}
```

### 2. **Flow Diagram**

```
User chọn Topic + Level
        ↓
/api/quiz/generate
        ↓
generateQuizQuestions() utility
        ↓
Query Vocabulary (level + topic)
        ↓
Shuffle → lấy 10 từ
        ↓
Với mỗi từ:
   → Lấy 3 từ sai (cùng level + topic)
   → Shuffle 4 đáp án
        ↓
Return 10 câu hỏi
        ↓
Frontend display quiz
        ↓
User submit answers
        ↓
/api/quiz/submit
        ↓
Calculate XP (+10 per correct)
```

---

## 🔧 Backend Implementation

### **1. Quiz Generator Utility** (`BE/src/utils/quizGenerator.ts`)

#### Function: `generateQuizQuestions(userId, topicId, limit=10)`

```typescript
// Returns:
{
  success: true,
  userLevel: "BEGINNER",
  topicId: 1,
  count: 10,
  questions: [
    {
      vocabularyId: 5,
      korean: "사과",
      english: "apple",
      questionText: "\"사과\" nghĩa là gì?",
      answers: [
        { text: "quả táo", isCorrect: true },
        { text: "quả cam", isCorrect: false },
        { text: "quả chuối", isCorrect: false },
        { text: "quả nho", isCorrect: false }
      ],
      correctAnswerText: "quả táo"
    },
    // ... 9 more questions
  ]
}
```

**Key Features:**
- ✅ Validates user level
- ✅ Filters vocabulary by level AND topic
- ✅ Checks minimum vocabulary count (need at least 10 + 30 more for 3 wrong answers each)
- ✅ Random selection without duplication
- ✅ Validates all 4 answers are unique
- ✅ Shuffles answer order

#### Function: `createQuizQuestion(data)`

```typescript
{
  vocabularyId: 5,      // Correct answer
  topicId: 1,
  questionText: "사과 nghĩa là gì?",
  correctAnswerText: "quả táo",
  wrongAnswerIds: [6, 7, 8],  // 3 wrong vocab IDs
  level: "BEGINNER"
}
```

**Validations:**
- ✅ Wrong answers ≠ correct answer
- ✅ Exactly 3 wrong answers
- ✅ All from same level + topic
- ✅ No duplicate answers

---

### **2. Quiz Router** (`BE/src/modules/quiz/index.ts`)

#### Endpoints:

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/quiz/generate` | GET | ✅ | Generate 10 random quiz questions |
| `/api/quiz/vocabulary` | GET | ✅ | Get raw vocabulary (legacy) |
| `/api/quiz/submit` | POST | ✅ | Submit answers, calculate XP |

#### GET `/api/quiz/generate`

**Request:**
```
GET /api/quiz/generate?topicId=1
Headers: Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "userLevel": "BEGINNER",
  "topicId": 1,
  "topicName": "Food",
  "count": 10,
  "questions": [
    {
      "vocabularyId": 5,
      "korean": "사과",
      "english": "apple",
      "questionText": "\"사과\" nghĩa là gì?",
      "answers": [
        { "text": "quả táo", "isCorrect": true },
        { "text": "quả cam", "isCorrect": false },
        { "text": "quả chuối", "isCorrect": false },
        { "text": "quả nho", "isCorrect": false }
      ],
      "correctAnswerText": "quả táo"
    }
  ]
}
```

#### POST `/api/quiz/submit`

**Request:**
```json
{
  "answers": [
    { "questionId": 5, "selectedAnswer": "quả táo", "correct": true },
    { "questionId": 6, "selectedAnswer": "sai", "correct": false }
  ],
  "topicId": 1
}
```

**Response:**
```json
{
  "success": true,
  "xpGained": 20,
  "correctCount": 2,
  "totalCount": 10,
  "percentage": 20,
  "message": "2/10 correct. +20 XP 🎯"
}
```

---

### **3. Quiz Admin Router** (`BE/src/modules/quizAdmin/index.ts`)

#### Endpoints:

| Endpoint | Method | Auth | Role | Purpose |
|----------|--------|------|------|---------|
| `/api/quiz/admin/create` | POST | ✅ | ADMIN | Create new quiz question |
| `/api/quiz/admin/:id` | PUT | ✅ | ADMIN | Update quiz question |
| `/api/quiz/admin/:id` | DELETE | ✅ | ADMIN | Delete quiz question |
| `/api/quiz/admin/list` | GET | ✅ | ADMIN | List all quiz questions (paginated) |
| `/api/quiz/:id` | GET | ✅ | - | Get single question with answers |
| `/api/quiz/topic/:topicId` | GET | ✅ | - | Get questions by topic (user level filtered) |

#### POST `/api/quiz/admin/create`

**Request:**
```json
{
  "vocabularyId": 5,
  "topicId": 1,
  "questionText": "\"사과\" nghĩa là gì?",
  "wrongAnswerIds": [6, 7, 8],
  "level": "BEGINNER",
  "questionType": "vocabulary"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Quiz question created successfully",
  "quizQuestion": {
    "id": 123,
    "vocabularyId": 5,
    "topicId": 1,
    "questionText": "\"사과\" nghĩa là gì?",
    "correctAnswerText": "quả táo",
    "wrongAnswerIds": [6, 7, 8],
    "level": "BEGINNER",
    "isActive": true,
    "usageCount": 0,
    "correctRate": 0,
    "createdAt": "2024-04-14T10:00:00Z"
  }
}
```

---

## 🎨 Frontend Implementation

### **Admin UI** (`FE/src/app/admin/quiz/page.tsx`)

**Features:**
- ✅ List all quiz questions (paginated)
- ✅ Filter by topic
- ✅ Filter by level
- ✅ Search questions
- ✅ Create new question
- ✅ Edit existing question
- ✅ Delete question
- ✅ View usage stats (usage count, correct rate %)

**UI Components:**
- Header with title
- Filter section (topic, level, search)
- Questions list with stats
- Create/Edit modal form
- Pagination

**Form Validation:**
- ✅ SelectCorrect vocabulary (sets topic + level automatically)
- ✅ Select 3 different wrong vocabularies
- ✅ Fill question text
- ✅ All fields required

**Access:**
- Route: `/admin/quiz`
- Requires: ADMIN or SUPER_ADMIN role
- Auto-redirects to `/` if not authorized

---

## 📱 How to Use

### **For Admin (tạo câu hỏi):**

1. Navigate to `/admin/quiz`
2. Click "New Quiz Question"
3. Select vocabulary (correct answer)
   - Topic & level auto-filled
4. Fill question text
   - e.g., `"사과" nghĩa là gì?`
5. Select 3 wrong answers from same level + topic
6. Click "Create Question"

### **For Users (chơi quiz):**

1. Navigate to `/quiz`
2. Select topic
3. Click generate quiz
4. Answer 10 questions
5. Submit
6. See score + XP reward

---

## ⚠️ Important Rules (Auto-Enforced)

❌ **CANNOT violate:**
1. Wrong answers MUST be different from correct answer
2. Wrong answers MUST be from SAME level + topic
3. Wrong answers MUST be EXACTLY 3
4. All 4 answers MUST be unique
5. Questions MUST be from same level as user
6. Vocabulary must have at least 40 items (10 questions + 30 for wrong answers)

✅ **Automatic handling:**
- Shuffles answer order
- Filters by user level
- Filters by topic
- Prevents duplicate answers
- Validates all relationships

---

## 🔗 Database Relationships

```
User
  ├─→ QuizSession (1:N)
  │    ├─→ QuizAnswer (1:N)
  │    │    └─→ Question (N:1)
  │    └─→ Topic (N:1)
  └─→ UserProgress (1:N for QUIZ skill)

Topic
  ├─→ Vocabulary (1:N)
  │    └─→ QuizQuestion (1:N) ← NEW
  ├─→ QuizQuestion (1:N) ← NEW
  └─→ Question (1:N) [legacy]

QuizQuestion ← NEW
  ├─→ Vocabulary (N:1) [correct answer]
  └─→ Topic (N:1)
  └─→ wrongAnswerIds: Int[] [references other vocabulary]
```

---

## 🧪 Testing API Endpoints

### **Generate Quiz** (User perspective)

```bash
curl -X GET "http://localhost:5000/api/quiz/generate?topicId=1" \
  -H "Authorization: Bearer <token>"
```

### **Admin Create Question**

```bash
curl -X POST "http://localhost:5000/api/quiz/admin/create" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "vocabularyId": 5,
    "topicId": 1,
    "questionText": "\"사과\" nghĩa là gì?",
    "wrongAnswerIds": [6, 7, 8],
    "level": "BEGINNER"
  }'
```

### **Admin List Questions**

```bash
curl -X GET "http://localhost:5000/api/quiz/admin/list?topicId=1&level=BEGINNER&page=1" \
  -H "Authorization: Bearer <admin_token>"
```

---

## 📊 Migration Applied

**Migration Name:** `20260413204104_add_quiz_question_model`

**Changes:**
- ✅ Created `QuizQuestion` table
- ✅ Added Foreign keys to `Vocabulary` and `Topic`
- ✅ Added indexes for performance
- ✅ Added `wrongAnswerIds` as integer array
- ✅ Updated Prisma schema

---

## 🎯 Next Steps (Optional Enhancements)

1. **Batch Question Import** - CSV upload
2. **Question Difficulty Analytics** - Track which questions are hard/easy
3. **Duplicate Detection** - Prevent similar questions
4. **Auto-Generate** - AI-generated wrong answers
5. **Question Review System** - Flag controversial questions
6. **Performance Optimization** - Cache frequently used questions

---

## 📝 Summary

| Component | Status | Location |
|-----------|--------|----------|
| Database Model | ✅ | `BE/prisma/schema.prisma` |
| Migration | ✅ | `BE/prisma/migrations/...` |
| Quiz Generator | ✅ | `BE/src/utils/quizGenerator.ts` |
| Quiz Router | ✅ | `BE/src/modules/quiz/index.ts` |
| Quiz Admin Router | ✅ | `BE/src/modules/quizAdmin/index.ts` |
| Admin UI | ✅ | `FE/src/app/admin/quiz/page.tsx` |

**Ready for:**
- ✅ Production deployment
- ✅ User testing
- ✅ Admin management
- ✅ Scale to 1000+ users

---

**Questions? Issues? Enhancements?**
All endpoints tested and working. System follows best practices for data integrity and user experience.
