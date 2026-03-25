const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const healthRouter = require('./routes/health.routes');
const authRouter = require('./routes/auth.routes');
const userRouter = require('./routes/user.routes');
const vocabularyRouter = require('./routes/vocabulary.routes');
const quizRouter = require('./routes/quiz.routes');
const listeningRouter = require('./routes/listening.routes');
const pronunciationRouter = require('./routes/pronunciation.routes');
const cameraRouter = require('./routes/camera.routes');
const yoloRouter = require('./routes/yolo.routes.js');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const authenticate = require('./middleware/authenticate');

const app = express();
const PORT = process.env.PORT || 5000;

// ========================
// MIDDLEWARE
// ========================
// Allow multiple frontend URLs for development
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
];

app.use(cors({
  origin: function (origin: string | undefined, callback: any) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ========================
// ROUTES
// ========================
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);

// Protected routes (require authentication)
app.use('/api/user', authenticate, userRouter);
app.use('/api/vocabulary', authenticate, vocabularyRouter);
app.use('/api/quiz', authenticate, quizRouter);
app.use('/api/listening', authenticate, listeningRouter);

// Pronunciation and Camera detection routes (public for testing)
app.use('/api/pronunciation', pronunciationRouter);
app.use('/api/camera', cameraRouter);
app.use('/api/yolo', authenticate, yoloRouter);

// ========================
// 404 HANDLER
// ========================
// @ts-ignore
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ========================
// ERROR HANDLER (Must be last)
// ========================
app.use(errorHandler);

// ========================
// START SERVER
// ========================
app.listen(PORT, () => {
  console.log(`🚀 HANGUL Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
