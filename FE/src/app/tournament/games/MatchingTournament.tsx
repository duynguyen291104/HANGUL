'use client';

import { useEffect, useState } from 'react';

interface MatchPair {
  id: string;
  korean: string;
  vietnamese: string;
  romanization: string;
}

interface MatchingTournamentProps {
  onComplete: (score: number, correctAnswers: number) => void;
  onExit: () => void;
}

export default function MatchingTournament({ onComplete, onExit }: MatchingTournamentProps) {
  const [pairs, setPairs] = useState<MatchPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    loadPairs();
  }, []);

  const loadPairs = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Try endpoint 1: /vocabulary/random
      let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vocabulary/random?limit=8`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
      
      let data = res ? await res.json() : null;

      // Fallback: Try endpoint 2: /vocabulary
      if (!data || (Array.isArray(data) && data.length === 0) || (!Array.isArray(data) && (!data?.data || data.data.length === 0))) {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vocabulary?limit=8`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null);
        data = res ? await res.json() : null;
      }

      // Handle multiple response formats
      let vocabArray = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);

      if (!vocabArray || vocabArray.length === 0) {
        console.error('Invalid API response - using mock data:', data);
        // Mock data fallback
        vocabArray = [
          { id: 1, korean: '안녕하세요', vietnamese: 'Xin chào', romanization: 'Annyeonghaseyo' },
          { id: 2, korean: '감사합니다', vietnamese: 'Cảm ơn', romanization: 'Gamsahamnida' },
          { id: 3, korean: '네', vietnamese: 'Có', romanization: 'Ne' },
          { id: 4, korean: '아니요', vietnamese: 'Không', romanization: 'Aniyo' },
          { id: 5, korean: '수고했어요', vietnamese: 'Làm tốt rồi', romanization: 'Sugohasyeosseoyo' },
          { id: 6, korean: '잘 지내세요', vietnamese: 'Bạn khỏe không', romanization: 'Jal jineseyo' },
          { id: 7, korean: '미안합니다', vietnamese: 'Xin lỗi', romanization: 'Mianhamnida' },
          { id: 8, korean: '물', vietnamese: 'Nước', romanization: 'Mul' },
        ];
      }

      const newPairs: MatchPair[] = vocabArray.slice(0, 8).map((vocab: any, idx: number) => ({
        id: `pair-${idx}`,
        korean: vocab.korean,
        vietnamese: vocab.vietnamese,
        romanization: vocab.romanization || 'N/A',
      }));

      setPairs(newPairs);
      setLoading(false);
    } catch (error) {
      console.error('Error loading pairs:', error);
      setLoading(false);
    }
  };

  const handleMatch = (vietnameseId: string, koreanId: string) => {
    const vietnameseText = pairs.find((p) => p.id === vietnameseId)?.vietnamese;
    const koreanText = pairs.find((p) => p.id === koreanId)?.korean;

    if (!vietnameseText || !koreanText) return;

    const isCorrectMatch = pairs.find((p) => p.id === vietnameseId)?.korean === koreanText;

    setMatches((prev) => ({
      ...prev,
      [vietnameseId]: koreanId,
    }));

    if (isCorrectMatch) {
      setCorrectCount((prev) => prev + 1);
    }

    setSelected(null);
  };

  const handleFinish = () => {
    const score = correctCount * 10;
    onComplete(score, correctCount);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-white text-xl">Đang tải...</div>;
  }

  if (pairs.length === 0) {
    return <div className="flex justify-center items-center min-h-screen text-white text-xl">Không có dữ liệu</div>;
  }

  const vietnameseList = pairs.slice(0, 4);
  const koreanList = pairs.slice(4, 8).sort(() => Math.random() - 0.5);

  return (
    <div className="min-h-screen p-6 bg-[#fafaf5]">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">🔗</span>
              <h1 className="text-3xl font-bold text-[#72564c]">Ghép Cặp</h1>
            </div>
            <p className="text-[#8d6e63] text-sm">Ghép từ tiếng Việt với từ tiếng Hàn tương ứng</p>
          </div>
          <button onClick={onExit} className="text-[#72564c] hover:bg-[#f0e6e0] p-3 rounded-lg transition-all text-2xl">
            ✕
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="grid grid-cols-2 gap-8">
            {/* Vietnamese Words */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-[#72564c] flex items-center gap-2">
                <span>🇻🇳</span> Tiếng Việt
              </h3>
              <div className="space-y-2">
                {vietnameseList.map((pair) => (
                  <button
                    key={pair.id}
                    onClick={() => setSelected(matches[pair.id] ? null : pair.id)}
                    className={`w-full p-3 rounded-lg font-semibold text-left transition-all ${
                      matches[pair.id]
                        ? 'bg-green-100 text-green-700 border-2 border-green-500'
                        : selected === pair.id
                        ? 'bg-[#72564c] text-white ring-2 ring-[#8d6e63]'
                        : 'bg-[#f0e6e0] hover:bg-[#e8dcd4] text-[#72564c] border-2 border-transparent'
                    }`}
                  >
                    {pair.vietnamese}
                  </button>
                ))}
              </div>
            </div>

            {/* Korean Words */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-[#72564c] flex items-center gap-2">
                <span>🇰🇷</span> Tiếng Hàn
              </h3>
              <div className="space-y-2">
                {koreanList.map((pair) => (
                  <button
                    key={pair.id}
                    onClick={() => {
                      if (selected) {
                        handleMatch(selected, pair.id);
                      }
                    }}
                    className={`w-full p-3 rounded-lg font-semibold text-left transition-all cursor-pointer ${
                      Object.values(matches).includes(pair.id)
                        ? 'bg-green-100 text-green-700 border-2 border-green-500'
                        : 'bg-[#f0e6e0] hover:bg-[#e8dcd4] text-[#72564c] border-2 border-transparent hover:border-[#72564c]'
                    }`}
                  >
                    {pair.korean}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {Object.keys(matches).length === vietnameseList.length && (
            <div className="mt-8 p-4 bg-green-100 border-2 border-green-500 rounded-lg text-center">
              <p className="text-green-700 font-bold text-lg">✓ Hoàn thành! Bạn ghép đúng {correctCount} cặp.</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#e8dcd4]">
            <div className="text-center">
              <p className="text-xs text-[#8d6e63] mb-1">Điểm</p>
              <p className="text-2xl font-bold text-[#72564c]">{correctCount * 10}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#8d6e63] mb-1">Ghép Đúng</p>
              <p className="text-2xl font-bold text-[#72564c]">{correctCount}/{vietnameseList.length}</p>
            </div>
            <div className="text-center">
              <button
                onClick={handleFinish}
                disabled={Object.keys(matches).length < vietnameseList.length}
                className="w-full px-4 py-2 bg-gradient-to-r from-[#72564c] to-[#8d6e63] text-white rounded-lg font-bold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
              >
                Hoàn thành
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}