import { NextRequest, NextResponse } from 'next/server';

// Fallback data if API fails
const FALLBACK_VOCABULARY: Record<string, any[]> = {
  NEWBIE: [
    { id: 1, korean: '안녕하세요', english: 'Hello', vietnamese: 'Xin chào', romanization: 'An-nyeong-ha-se-yo', topic: 'Greeting' },
    { id: 2, korean: '감사합니다', english: 'Thank you', vietnamese: 'Cảm ơn', romanization: 'Gam-sa-ham-ni-da', topic: 'Greeting' },
    { id: 3, korean: '죄송합니다', english: 'Sorry', vietnamese: 'Xin lỗi', romanization: 'Jwoe-song-ham-ni-da', topic: 'Greeting' },
    { id: 4, korean: '네', english: 'Yes', vietnamese: 'Vâng', romanization: 'Ne', topic: 'Greeting' },
    { id: 5, korean: '아니요', english: 'No', vietnamese: 'Không', romanization: 'A-ni-yo', topic: 'Greeting' },
    { id: 6, korean: '좋아요', english: 'I like it', vietnamese: 'Tôi thích', romanization: 'Joa-yo', topic: 'Greeting' },
    { id: 7, korean: '물', english: 'Water', vietnamese: 'Nước', romanization: 'Mul', topic: 'Food' },
    { id: 8, korean: '밥', english: 'Rice / Meal', vietnamese: 'Cơm', romanization: 'Bap', topic: 'Food' },
    { id: 9, korean: '친구', english: 'Friend', vietnamese: 'Bạn', romanization: 'Chin-gu', topic: 'People' },
    { id: 10, korean: '학교', english: 'School', vietnamese: 'Trường học', romanization: 'Hak-gyo', topic: 'Place' },
  ],
  BEGINNER: [
    { id: 11, korean: '날씨', english: 'Weather', vietnamese: 'Thời tiết', romanization: 'Nal-ssae', topic: 'Nature' },
    { id: 12, korean: '책', english: 'Book', vietnamese: 'Sách', romanization: 'Chaek', topic: 'Object' },
  ],
};

export async function GET(
  request: NextRequest,
  { params }: { params: { level: string } }
) {
  try {
    const { level } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Call backend API
    const BE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const apiUrl = `${BE_URL}/pronunciation/vocabulary/${level}?limit=${limit}`;

    console.log(`📡 [FE API Route] Fetching from: ${apiUrl}`);

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ [BE Error] Status: ${response.status}`, data);
        throw new Error(`Backend error: ${data.message || response.statusText}`);
      }

      // Check if we got data
      if (data.vocabulary && data.vocabulary.length > 0) {
        console.log(`✅ [FE API Route] Success: ${data.count} words fetched from database`);
        return NextResponse.json(data, { status: 200 });
      }

      // If BE returned empty, use fallback
      console.warn(`⚠️ [FE API Route] Backend returned empty data, using fallback`);
      const fallback = FALLBACK_VOCABULARY[level] || FALLBACK_VOCABULARY['NEWBIE'];
      return NextResponse.json({
        success: true,
        source: 'fallback',
        level,
        count: fallback.length,
        vocabulary: fallback.slice(0, limit)
      }, { status: 200 });

    } catch (fetchError: any) {
      console.warn(`⚠️ [FE API Route] Backend fetch failed: ${fetchError.message}`);
      
      // Return fallback data
      const fallback = FALLBACK_VOCABULARY[level] || FALLBACK_VOCABULARY['NEWBIE'];
      console.log(`📌 [FE API Route] Returning ${fallback.length} fallback words`);
      
      return NextResponse.json({
        success: true,
        source: 'fallback',
        level,
        count: fallback.length,
        vocabulary: fallback.slice(0, limit)
      }, { status: 200 });
    }
  } catch (error: any) {
    console.error('❌ [FE API Route Error]:', error.message);
    
    // Final fallback - return NEWBIE data
    const fallback = FALLBACK_VOCABULARY['NEWBIE'];
    return NextResponse.json({
      success: true,
      source: 'fallback',
      level: 'NEWBIE',
      count: fallback.length,
      vocabulary: fallback
    }, { status: 200 });
  }
}

