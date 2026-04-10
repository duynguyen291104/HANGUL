import { NextRequest, NextResponse } from 'next/server';

/**
 * Google Cloud Speech-to-Text API Proxy
 * 
 * Purpose: Evaluate Korean pronunciation by sending audio to Google's Speech API
 * - API key stored server-side (.env) for security
 * - Returns recognition results + confidence scores
 * 
 * Example request:
 * POST /api/pronunciation
 * {
 *   "audio": "base64_encoded_audio",
 *   "audioFormat": "LINEAR16",
 *   "sampleRate": 16000,
 *   "language": "ko-KR"
 * }
 */

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_SPEECH_API = 'https://speech.googleapis.com/v1/speech:recognize';

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { audio, audioFormat = 'LINEAR16', sampleRate = 16000, language = 'ko-KR' } = body;

    // Validate input
    if (!audio) {
      return NextResponse.json(
        { error: 'Audio data is required' },
        { status: 400 }
      );
    }

    // Call Google Cloud Speech-to-Text API
    const response = await fetch(`${GOOGLE_SPEECH_API}?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: {
          encoding: audioFormat,
          sampleRateHertz: sampleRate,
          languageCode: language,
          enableAutomaticPunctuation: true,
          model: 'default', // Could use 'latest_long' for longer audio
        },
        audio: {
          content: audio, // base64 encoded audio
        },
      }),
    });

    const data = await response.json();

    // Handle API errors
    if (!response.ok) {
      console.error('Google API error:', data);
      return NextResponse.json(
        { error: data.error?.message || 'Failed to process audio' },
        { status: response.status }
      );
    }

    // Extract results
    const results = data.results || [];
    const recognizedText = results
      .map((result: any) => result.alternatives?.[0]?.transcript || '')
      .join(' ')
      .trim();

    const confidence = results[0]?.alternatives?.[0]?.confidence || 0;

    // Return processed response
    return NextResponse.json({
      success: true,
      recognizedText,
      confidence, // 0-1 confidence score
      rawResults: results, // Full response for advanced use
    });
  } catch (error) {
    console.error('Pronunciation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
