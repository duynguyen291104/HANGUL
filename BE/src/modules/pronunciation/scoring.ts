import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import FormData = require('form-data');
import fetch from 'node-fetch';
import fs = require('fs');
import path = require('path');
import os = require('os');

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

/**
 * Levenshtein Distance - Calculate similarity between two strings
 * Used for pronunciation accuracy scoring
 * 
 * @param a First string
 * @param b Second string
 * @returns Similarity score (0-100)
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialize first row and column
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,  // Substitution
          matrix[i][j - 1] + 1,      // Insertion
          matrix[i - 1][j] + 1       // Deletion
        );
      }
    }
  }

  // Calculate similarity percentage
  const distance = matrix[b.length][a.length];
  const maxLength = Math.max(a.length, b.length);
  return Math.max(0, Math.round((1 - distance / maxLength) * 100));
}

/**
 * Call Flask Whisper server to transcribe audio
 * 
 * @param audioBuffer Audio data as Buffer (WEBM, MP3, etc.)
 * @param language Language code (e.g., 'ko', 'en')
 * @returns { success, transcript, language, confidence }
 */
const callWhisperServer = async (audioBuffer: Buffer, language: string = 'ko') => {
  try {
    const flaskUrl = process.env.FLASK_API_URL || 'http://localhost:5001';
    
    // Create temp file for audio
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `audio_${Date.now()}.webm`);
    fs.writeFileSync(tempFilePath, audioBuffer);

    try {
      // Create FormData and append audio file
      const form = new FormData();
      form.append('audio', fs.createReadStream(tempFilePath), {
        filename: 'audio.webm',
        contentType: 'audio/webm',
      });
      form.append('language', language);

      console.log('🎤 Whisper Request:', {
        url: `${flaskUrl}/transcribe`,
        audioSize: audioBuffer.length,
        language,
      });

      // Call Flask Whisper server
      const response = await fetch(`${flaskUrl}/transcribe`, {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
      } as any);

      if (!response.ok) {
        throw new Error(`Flask returned ${response.status}`);
      }

      const data = (await response.json()) as any;

      if (!data.success) {
        throw new Error(data.error || 'Transcription failed');
      }

      console.log('✅ Whisper Success:', {
        transcript: data.text,
        language: data.language,
        processingTime: data.processing_time,
      });

      return {
        success: true,
        transcript: data.text?.trim() || '',
        language: data.language || language,
        confidence: data.confidence || 0.95,
      };
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  } catch (error) {
    console.error('❌ Whisper Server Error:', (error as any).message);
    return {
      success: false,
      transcript: '',
      language: language,
      confidence: 0,
      error: (error as any).message,
    };
  }
};

/**
 * Check Flask Whisper server status
 */
const checkWhisperServerStatus = async () => {
  try {
    const flaskUrl = process.env.FLASK_API_URL || 'http://localhost:5001';
    const response = await fetch(`${flaskUrl}/status`);
    
    if (!response.ok) {
      return { available: false, error: `Status ${response.status}` };
    }

    const data = await response.json();
    return { available: true, data };
  } catch (error) {
    return { available: false, error: (error as any).message };
  }
};

/**
 * ENDPOINT: POST /pronunciation/score
 * 
 * Purpose: Score user's pronunciation using local Whisper
 * Process: WEBM audio → Flask Whisper → transcript → Levenshtein similarity → score
 */
router.post('/score', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { audioBase64, correctAnswer, language = 'ko', topicId, vocabId, korean } = req.body;

    if (!audioBase64 || !correctAnswer) {
      return res.status(400).json({ error: 'Missing audioBase64 or correctAnswer' });
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    // Call Whisper server to transcribe
    const whisperResult = await callWhisperServer(audioBuffer, language);

    // If transcription failed, return error
    if (!whisperResult.success) {
      console.error('❌ Transcription failed');
      return res.status(503).json({
        error: 'Transcription service unavailable',
        message: 'Flask Whisper server is not responding. Make sure it\'s running on ' + (process.env.FLASK_API_URL || 'http://localhost:5001'),
        success: false,
      });
    }

    const transcript = whisperResult.transcript?.trim() || '';

    // If no transcript was produced
    if (!transcript) {
      console.warn('⚠️ No transcript produced from audio');
      return res.json({
        accuracy: 0,
        transcript: '',
        isCorrect: false,
        xp: 0,
        confidence: 0,
        message: 'Could not transcribe audio',
        success: false,
      });
    }

    // Calculate accuracy using Levenshtein distance (REAL SCORING)
    const accuracy = levenshteinDistance(
      transcript.toLowerCase(),
      correctAnswer.toLowerCase()
    );

    // Determine if correct (>= 50%)
    const isCorrect = accuracy >= 50;
    const xp = isCorrect ? 10 : 0;

    // Save to LearningHistory if topicId provided (NEW: Track history for progress calculation)
    if (topicId && korean) {
      try {
        await prisma.learningHistory.deleteMany({
          where: {
            userId: req.user.id,
            topicId,
            skillType: 'PRONUNCIATION',
            korean,
          },
        });

        await prisma.learningHistory.create({
          data: {
            userId: req.user.id,
            topicId,
            korean,
            vietnamese: correctAnswer,
            accuracy,
            skillType: 'PRONUNCIATION',
          },
        });

        console.log(`💾 Pronunciation history saved for "${korean}" with accuracy ${accuracy}%`);
      } catch (err) {
        console.warn('⚠️ Failed to save pronunciation history:', err);
        // Don't fail the request
      }
    }

    // Log scoring for analytics (REAL DATA)
    console.log(`📊 Pronunciation Score:`, {
      userId: req.user.id,
      correctAnswer,
      transcript,
      accuracy,
      isCorrect,
      xp,
      confidence: whisperResult.confidence || 0,
      message: '✅ Real Whisper scoring (free, local)',
    });

    res.json({
      accuracy,
      transcript,
      isCorrect,
      xp,
      confidence: whisperResult.confidence,
      success: true,
    });
  } catch (error) {
    console.error('❌ Error scoring pronunciation:', error);
    res.status(500).json({ error: 'Failed to score pronunciation', details: (error as any).message });
  }
});

/**
 * ENDPOINT: POST /pronunciation/batch-score
 * 
 * Score multiple pronunciations at once using local Whisper
 */
router.post('/batch-score', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { items, language = 'ko' } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items must be non-empty array' });
    }

    // Process each item with Whisper transcription
    const results = await Promise.all(
      items.map(async (item: { audioBase64: string; correctAnswer: string }) => {
        try {
          const audioBuffer = Buffer.from(item.audioBase64, 'base64');
          const whisperResult = await callWhisperServer(audioBuffer, language);

          // FAIL if transcription failed - NO FAKE SCORING
          if (!whisperResult.success) {
            console.error(`❌ Batch item failed: ${item.correctAnswer}`);
            return {
              correctAnswer: item.correctAnswer,
              accuracy: 0,
              transcript: '',
              isCorrect: false,
              xp: 0,
              error: 'transcription_failed',
              success: false,
            };
          }

          const transcript = whisperResult.transcript?.trim() || '';

          // If no transcript
          if (!transcript) {
            return {
              correctAnswer: item.correctAnswer,
              accuracy: 0,
              transcript: '',
              isCorrect: false,
              xp: 0,
              error: 'no_transcript',
              success: false,
            };
          }

          // REAL SCORING with Levenshtein distance
          const accuracy = levenshteinDistance(
            transcript.toLowerCase(),
            item.correctAnswer.toLowerCase()
          );

          return {
            correctAnswer: item.correctAnswer,
            accuracy,
            transcript,
            isCorrect: accuracy >= 50,
            xp: accuracy >= 50 ? 10 : 0,
            confidence: whisperResult.confidence || 0,
            success: true,
          };
        } catch (error) {
          console.error('Batch item processing error:', error);
          // Return error, NO FAKE SCORE
          return {
            correctAnswer: item.correctAnswer,
            accuracy: 0,
            transcript: '',
            isCorrect: false,
            xp: 0,
            error: 'processing_failed',
            success: false,
          };
        }
      })
    );

    res.json({
      count: results.length,
      results,
      totalXP: results.reduce((sum, r) => sum + r.xp, 0),
    });
  } catch (error) {
    console.error('Error batch scoring:', error);
    res.status(500).json({ error: 'Failed to batch score' });
  }
});

/**
 * ENDPOINT: GET /pronunciation/status
 * 
 * Check if Whisper Flask server is available
 */
router.get('/status', async (_req, res: Response) => {
  const status = await checkWhisperServerStatus();

  res.json({
    whisperAvailable: status.available,
    message: status.available
      ? '✅ Whisper Flask server is ready (FREE LOCAL SPEECH-TO-TEXT)'
      : '❌ Whisper Flask server is not responding',
    flaskUrl: process.env.FLASK_API_URL || 'http://localhost:5001',
    NODE_ENV: process.env.NODE_ENV,
    error: status.error,
    serverInfo: status.data,
  });
});

export default router;
