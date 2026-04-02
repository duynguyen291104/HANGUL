import { Router, Request, Response } from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const AI_BACKEND_URL = (
  process.env.AI_BACKEND_URL ||
  process.env.FLASK_API_URL ||
  'http://localhost:5001'
).replace(/\/+$/, '');

router.post('/transcribe', async (req: Request, res: Response) => {
  try {
    const audio = req.body?.audio;
    const target = String(req.body?.target || '').trim();

    if (!audio) {
      return res.status(400).json({
        success: false,
        error: 'Audio data required',
      });
    }

    if (!target) {
      return res.status(400).json({
        success: false,
        error: 'Target text required',
      });
    }

    try {
      const aiResponse = await axios.post(
        `${AI_BACKEND_URL}/transcribe`,
        { audio, target },
        {
          timeout: 60000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return res.json({
        ...aiResponse.data,
        success: aiResponse.data?.success ?? true,
        timestamp: new Date().toISOString(),
      });
    } catch (aiError: any) {
      const statusCode = aiError?.response?.status || 502;

      return res.status(statusCode).json({
        success: false,
        message: 'Transcription failed',
        error: aiError?.response?.data?.error || aiError.message,
        details: aiError?.response?.data || null,
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Transcription failed',
      message: error.message,
    });
  }
});

router.post('/tts', async (req: Request, res: Response) => {
  try {
    const text = String(req.body?.text || '').trim();

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text required',
      });
    }

    try {
      const aiResponse = await axios.post(
        `${AI_BACKEND_URL}/tts`,
        { text },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return res.json({
        ...aiResponse.data,
        success: aiResponse.data?.success ?? true,
        timestamp: new Date().toISOString(),
      });
    } catch (aiError: any) {
      const statusCode = aiError?.response?.status || 502;

      return res.status(statusCode).json({
        success: false,
        message: 'TTS generation failed',
        error: aiError?.response?.data?.error || aiError.message,
        details: aiError?.response?.data || null,
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'TTS failed',
      message: error.message,
    });
  }
});

router.get('/vocabulary/:level', async (req: Request, res: Response) => {
  try {
    const { level } = req.params;
    const limit = Math.max(1, Math.min(50, Number(req.query.limit || 10)));

    const levelUpper = String(level || '').toUpperCase();
    const validLevels = ['NEWBIE', 'BEGINNER', 'INTERMEDIATE', 'UPPER_INTERMEDIATE', 'ADVANCED'];

    if (!validLevels.includes(levelUpper)) {
      return res.status(400).json({
        error: 'Invalid level',
        validLevels,
      });
    }

    const vocabulary = await prisma.vocabulary.findMany({
      where: {
        level: levelUpper,
        isActive: true,
      },
      include: {
        examples: true,
        topic: {
          select: {
            name: true,
          },
        },
      },
      take: limit,
      orderBy: {
        createdAt: 'asc',
      },
    });

    const shuffled = [...vocabulary].sort(() => Math.random() - 0.5);

    return res.json({
      success: true,
      source: 'database',
      level: levelUpper,
      count: shuffled.length,
      vocabulary: shuffled.map((item) => ({
        id: item.id,
        korean: item.korean,
        english: item.english,
        vietnamese: item.vietnamese,
        romanization: item.romanization,
        type: item.type,
        topic: item.topic?.name,
        difficulty: 1,
        examples:
          item.examples?.map((example) => ({
            korean: example.korean,
            english: example.english,
            vietnamese: example.vietnamese,
          })) || [],
      })),
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to fetch vocabulary from database',
      message: error.message,
    });
  }
});

module.exports = router;
