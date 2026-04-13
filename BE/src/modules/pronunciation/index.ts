import { Router, Request, Response } from 'express';
import axios from 'axios';
import prisma from '../../lib/prisma';
import { saveUserProgress, addUserXP, checkLevelTestUnlock } from '../../utils/progressHelper';

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

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

// Get vocabulary by topicId for pronunciation practice
router.get('/vocabulary/topic/:topicId', async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;
    const { limit = 20 } = req.query;

    console.log(`🎤 [Pronunciation API] Fetching vocabulary for topicId: ${topicId}, limit: ${limit}`);

    // Get vocabulary for this specific topic
    const vocabulary = await prisma.vocabulary.findMany({
      where: {
        topicId: Number(topicId),
        isActive: true,
      },
      include: {
        examples: true,
        topic: {
          select: {
            name: true,
            level: true,
          }
        }
      },
      take: parseInt(limit as string),
      orderBy: {
        createdAt: 'asc',
      }
    });

    console.log(`✅ Found ${vocabulary.length} vocabulary words for topicId: ${topicId}`);

    // Shuffle the results
    const shuffled = vocabulary.sort(() => Math.random() - 0.5);

    res.json({
      success: true,
      source: 'database',
      topicId: Number(topicId),
      count: shuffled.length,
      vocabulary: shuffled.map((item) => ({
        id: item.id,
        korean: item.korean,
        english: item.english,
        vietnamese: item.vietnamese,
        romanization: item.romanization,
        type: item.type,
        topic: item.topic?.name,
        level: item.topic?.level,
        difficulty: 1,
        examples: item.examples?.map(ex => ({
          korean: ex.korean,
          english: ex.english,
          vietnamese: ex.vietnamese,
        })) || []
      }))
    });
  } catch (error: any) {
    console.error(`❌ Pronunciation API error:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch vocabulary',
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

// Submit pronunciation attempt and save score (authenticated)
router.post('/submit-score', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { topicId, wordId, score } = req.body;
    const userId = (req.user as any).id;

    if (!topicId || score === undefined) {
      return res.status(400).json({ error: 'topicId and score required' });
    }

    const calculatedScore = Math.round(score);
    const isPassed = calculatedScore >= 70;

    // Save pronunciation attempt
    await prisma.pronunciationAttempt.create({
      data: {
        userId,
        wordId: wordId ? parseInt(wordId) : 1,
        overallScore: calculatedScore,
        audioUrl: '',
      },
    }).catch(() => {
      // If table doesn't exist, just log it
      console.log('Note: pronunciationAttempt table may not exist yet');
    });

    // Save progress
    await saveUserProgress(userId, parseInt(topicId), 'PRONUNCIATION', calculatedScore, isPassed);

    // Award XP based on score
    const xpGained = await addUserXP(userId, 'PRONUNCIATION', calculatedScore);

    // Check if user unlocked next level test
    await checkLevelTestUnlock(userId);

    // Get updated user
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalXP: true, totalTrophy: true, level: true },
    });

    res.json({
      success: true,
      score: calculatedScore,
      isPassed,
      xpGained,
      totalXP: updatedUser?.totalXP,
      totalTrophy: updatedUser?.totalTrophy,
      level: updatedUser?.level,
      message: isPassed ? 'Great pronunciation!' : 'Keep practicing!',
    });
  } catch (error) {
    console.error('Error submitting pronunciation score:', error);
    res.status(500).json({ error: 'Failed to submit pronunciation score' });
  }
});

export default router;

