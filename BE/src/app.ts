const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Initialize Prisma
const prisma = new PrismaClient();

// Import routes
const healthRouter = require('./routes/health.routes');
const authRouter = require('./routes/auth.routes');
const userRouter = require('./routes/user.routes');
const vocabularyRouter = require('./routes/vocabulary.routes');
const quizRouter = require('./routes/quiz.routes');
const listeningRouter = require('./routes/listening.routes');
const pronunciationRouter = require('./routes/pronunciation.routes');
const cameraRouter = require('./routes/camera.routes');
const yoloRouter = require('./routes/yolo.routes');
const tournamentRouter = require('./routes/tournament.routes');
const handwritingRouter = require('./routes/handwriting.routes');
// Import middleware
const errorHandler = require('./middleware/errorHandler');
const authenticate = require('./middleware/authenticate');

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Store active connections
const tournamentPlayers = new Map();

// ========================
// SOCKET.IO EVENTS
// ========================
io.on('connection', (socket: any) => {
  console.log(`🎮 Tournament player connected: ${socket.id}`);

  // Join tournament room
  socket.on('tournament:join', (data: any) => {
    const { userId, name } = data;
    tournamentPlayers.set(userId, { socketId: socket.id, name });
    socket.join('tournament');
    console.log(`📍 ${name} joined tournament room`);
  });

  // When player scores updated
  socket.on('tournament:score-update', async (data: any) => {
    const { userId: _userId } = data;
    try {
      const updatedLeaderboard = await prisma.user.findMany({
        where: { trophy: { gte: 1000 } },
        select: {
          id: true,
          name: true,
          avatar: true,
          trophy: true,
          level: true,
          totalXP: true,
        },
        orderBy: [{ trophy: 'desc' }, { totalXP: 'desc' }],
        take: 100,
      });
      const formatted = updatedLeaderboard.map((user: any, idx: number) => ({
        rank: idx + 1,
        userId: user.id,
        name: user.name,
        avatar: user.avatar,
        trophy: user.trophy,
        level: user.level,
        xp: user.totalXP,
      }));
      io.to('tournament').emit('tournament:leaderboard-updated', formatted);
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`❌ Player disconnected: ${socket.id}`);
    for (let [userId, player] of tournamentPlayers) {
      if (player.socketId === socket.id) {
        tournamentPlayers.delete(userId);
        console.log(`🚪 ${player.name} left tournament`);
        break;
      }
    }
  });
});

// Export io for use in routes
module.exports.io = io;
// Allow multiple frontend URLs for development
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

app.use(cors({
  origin: function (origin: string | undefined, callback: any) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // Allow all localhost/127.0.0.1 in development
    if (process.env.NODE_ENV === 'development' && origin && origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
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

// Public tournament leaderboard (read-only)
const tournamentLeaderboardRouter = express.Router();
tournamentLeaderboardRouter.get('/', async (_req: any, res: any) => {
  try {
    const leaderboard = await prisma.user.findMany({
      where: { trophy: { gte: 1000 } },
      select: {
        id: true,
        name: true,
        avatar: true,
        trophy: true,
        level: true,
        totalXP: true,
      },
      orderBy: [{ trophy: 'desc' }, { totalXP: 'desc' }],
      take: 100,
    });
    const formatted = leaderboard.map((user: any, idx: number) => ({
      rank: idx + 1,
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
      trophy: user.trophy,
      level: user.level,
      xp: user.totalXP,
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json([]);
  }
});
app.use('/api/tournament/leaderboard', tournamentLeaderboardRouter);

// Protected routes (require authentication)
app.use('/api/user', authenticate, userRouter);
app.use('/api/vocabulary', authenticate, vocabularyRouter);
app.use('/api/quiz', authenticate, quizRouter);
app.use('/api/listening', authenticate, listeningRouter);
app.use('/api/tournament', authenticate, tournamentRouter);

// Pronunciation and Camera detection routes (public for testing)
app.use('/api/pronunciation', pronunciationRouter);
app.use('/api/camera', cameraRouter);
app.use('/api/yolo', authenticate, yoloRouter);
app.use('/api/handwriting', authenticate, handwritingRouter);

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
server.listen(PORT, () => {
  console.log(` HANGUL Backend running on port ${PORT}`);
  console.log(`🎮 Socket.IO running for tournament`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
export {};
module.exports = app;
