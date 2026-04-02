import { NextRequest, NextResponse } from 'next/server';

interface FallbackWord {
  id: number;
  korean: string;
  english: string;
  vietnamese: string;
  romanization: string;
  topic: string;
}

const FALLBACK_VOCABULARY: Record<string, FallbackWord[]> = {
  NEWBIE: [
    { id: 1, korean: '안녕하세요', english: 'Hello', vietnamese: 'Xin chào', romanization: 'An-nyeong-ha-se-yo', topic: 'Greeting' },
    { id: 2, korean: '감사합니다', english: 'Thank you', vietnamese: 'Cảm ơn', romanization: 'Gam-sa-ham-ni-da', topic: 'Greeting' },
    { id: 3, korean: '죄송합니다', english: 'Sorry', vietnamese: 'Xin lỗi', romanization: 'Jwoe-song-ham-ni-da', topic: 'Greeting' },
    { id: 4, korean: '네', english: 'Yes', vietnamese: 'Vâng', romanization: 'Ne', topic: 'Greeting' },
    { id: 5, korean: '아니요', english: 'No', vietnamese: 'Không', romanization: 'A-ni-yo', topic: 'Greeting' },
    { id: 6, korean: '좋아요', english: 'I like it', vietnamese: 'Tôi thích', romanization: 'Jo-a-yo', topic: 'Greeting' },
    { id: 7, korean: '물', english: 'Water', vietnamese: 'Nước', romanization: 'Mul', topic: 'Food' },
    { id: 8, korean: '밥', english: 'Rice / Meal', vietnamese: 'Cơm', romanization: 'Bap', topic: 'Food' },
    { id: 9, korean: '친구', english: 'Friend', vietnamese: 'Bạn', romanization: 'Chin-gu', topic: 'People' },
    { id: 10, korean: '학교', english: 'School', vietnamese: 'Trường học', romanization: 'Hak-gyo', topic: 'Place' },
  ],
  BEGINNER: [
    { id: 11, korean: '날씨', english: 'Weather', vietnamese: 'Thời tiết', romanization: 'Nal-ssi', topic: 'Nature' },
    { id: 12, korean: '책', english: 'Book', vietnamese: 'Sách', romanization: 'Chaek', topic: 'Object' },
  ],
};

export async function GET(
  request: NextRequest,
  { params }: { params: { level: string } }
) {
  const level = String(params.level || 'NEWBIE').toUpperCase();
  const { searchParams } = new URL(request.url);
  const limit = Math.max(1, Math.min(50, Number(searchParams.get('limit') || 20)));

  const backendBaseUrl = (
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
  ).replace(/\/+$/, '');
  const apiUrl = `${backendBaseUrl}/pronunciation/vocabulary/${level}?limit=${limit}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    if (response.ok && Array.isArray(data?.vocabulary) && data.vocabulary.length > 0) {
      return NextResponse.json(data, { status: 200 });
    }
  } catch {
    // fallback below
  }

  const fallback = FALLBACK_VOCABULARY[level] || FALLBACK_VOCABULARY.NEWBIE;

  return NextResponse.json(
    {
      success: true,
      source: 'fallback',
      level,
      count: fallback.length,
      vocabulary: fallback.slice(0, limit),
    },
    { status: 200 }
  );
}
