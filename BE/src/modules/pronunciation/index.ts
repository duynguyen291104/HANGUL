import { Router, Request, Response } from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// AI Backend URL - Flask running on port 5001
const AI_BACKEND_URL = process.env.AI_BACKEND_URL || 'http://localhost:5001';

// Transcribe audio and check pronunciation
router.post('/transcribe', async (req: Request, res: Response) => {
  try {
    const { audio, target } = req.body;

    if (!audio) {
      return res.status(400).json({ error: 'Audio data required' });
    }

    console.log(`🎙️ [${new Date().toISOString()}] Transcribing audio with Whisper...`);
    
    try {
      // Call Flask Whisper endpoint
      const aiResponse = await axios.post(
        `${AI_BACKEND_URL}/transcribe`,
        { audio, target },
        { 
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(` Transcription complete: ${aiResponse.data.transcribed_text}`);
      
      res.json({
        success: true,
        transcribed_text: aiResponse.data.transcribed_text,
        target_text: aiResponse.data.target_text,
        score: aiResponse.data.score,
        timestamp: new Date().toISOString(),
      });
    } catch (aiError: any) {
      console.error(` AI Backend error: ${aiError.message}`);
      
      res.status(502).json({
        success: false,
        message: 'Transcription failed',
        error: aiError.message,
      });
    }
  } catch (error: any) {
    console.error(` Transcription error: ${error.message}`);
    res.status(500).json({ 
      success: false,
      error: 'Transcription failed',
      message: error.message 
    });
  }
});

// Generate pronunciation audio (TTS)
router.post('/tts', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text required' });
    }

    console.log(`🔊 [${new Date().toISOString()}] Generating TTS for: ${text}`);
    
    try {
      // Call Flask TTS endpoint
      const aiResponse = await axios.post(
        `${AI_BACKEND_URL}/tts`,
        { text },
        { 
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(` TTS generated successfully`);
      
      res.json({
        success: true,
        text: aiResponse.data.text,
        audio: aiResponse.data.audio,
        timestamp: new Date().toISOString(),
      });
    } catch (aiError: any) {
      console.error(` AI Backend error: ${aiError.message}`);
      
      res.status(502).json({
        success: false,
        message: 'TTS generation failed',
        error: aiError.message,
      });
    }
  } catch (error: any) {
    console.error(` TTS error: ${error.message}`);
    res.status(500).json({ 
      success: false,
      error: 'TTS failed',
      message: error.message 
    });
  }
});

// Get vocabulary by level for pronunciation practice (from Database)
router.get('/vocabulary/:level', async (req: Request, res: Response) => {
  try {
    const { level } = req.params;
    const { limit = 10 } = req.query;

    const levelUpper = level.toUpperCase();

    // Validate level
    const validLevels = ['NEWBIE', 'BEGINNER', 'INTERMEDIATE', 'UPPER_INTERMEDIATE', 'ADVANCED'];
    if (!validLevels.includes(levelUpper)) {
      console.warn(`⚠️ Invalid level requested: ${level}`);
      return res.status(400).json({ 
        error: 'Invalid level',
        validLevels 
      });
    }

    console.log(`🎤 [Pronunciation API] Fetching vocabulary for level: ${levelUpper}, limit: ${limit}`);

    try {
      // Query vocabulary from database
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
            }
          }
        },
        take: parseInt(limit as string),
        orderBy: {
          createdAt: 'asc',
        }
      });

      console.log(`✅ Found ${vocabulary.length} vocabulary words for ${levelUpper}`);

      if (vocabulary.length === 0) {
        console.warn(`⚠️ No vocabulary found for level: ${levelUpper}`);
      }

      // Shuffle the results (simulating random selection)
      const shuffled = vocabulary.sort(() => Math.random() - 0.5);

      res.json({
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
          examples: item.examples?.map(ex => ({
            korean: ex.korean,
            english: ex.english,
            vietnamese: ex.vietnamese,
          })) || []
        }))
      });
    } catch (dbError: any) {
      console.error(`❌ Database error: ${dbError.message}`);
      console.error(`Stack: ${dbError.stack}`);
      res.status(500).json({ 
        error: 'Database query failed',
        message: dbError.message,
        hint: 'Check if PostgreSQL is running and has vocabulary data'
      });
    }
  } catch (error: any) {
    console.error(`❌ Pronunciation API error: ${error.message}`);
    res.status(500).json({ 
      error: 'Failed to fetch vocabulary from database',
      message: error.message 
    });
  }
});

export default router;

