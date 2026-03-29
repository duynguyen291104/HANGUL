'use client';

import { useEffect, useState } from 'react';

interface MatchingTournamentProps {
  onComplete: (score: number, correctAnswers: number) => void;
  onExit: () => void;
}

interface MatchPair {
  id: string;
  korean: string;
  vietnamese: string;
  romanization: string;
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vocabulary?limit=8`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      const newPairs: MatchPair[] = data.data.slice(0, 8).map((vocab: any, idx: number) => ({
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
    return <div className="flex justify-center items-center min-h-screen text-white text-xl">Äang táº£i...</div>;
  }

  const vietnameseList = pairs.slice(0, 4);
  const koreanList = pairs.slice(4, 8).sort(() => Math.random() - 0.5);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">ðŸ”— GhÃ©p Cáº·p</h1>
          <button onClick={onExit} className="text-white hover:text-gray-300 text-2xl">
            âœ•
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <p className="text-gray-600 mb-6">GhÃ©p tá»« tiáº¿ng Viá»‡t vá»›i tá»« tiáº¿ng HÃ n tÆ°Æ¡ng á»©ng</p>

          <div className="grid grid-cols-2 gap-8">
            {/* Vietnamese Words */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-gray-800">ðŸ‡»ðŸ‡³ Tiáº¿ng Viá»‡t</h3>
              <div className="space-y-2">
                {vietnameseList.map((pair) => (
                  <button
                    key={pair.id}
                    onClick={() => setSelected(matches[pair.id] ? null : pair.id)}
                    className={`w-full p-3 rounded-lg font-semibold text-left transition-all ${
                      matches[pair.id]
                        ? 'bg-green-500 text-white'
                        : selected === pair.id
                        ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    {matches[pair.id] ? 'âœ…' : ''} {pair.vietnamese}
                  </button>
                ))}
              </div>
            </div>

            {/* Korean Words */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-gray-800">ðŸ‡°ðŸ‡· Tiáº¿ng HÃ n</h3>
              <div className="space-y-2">
                {koreanList.map((pair) => (
                  <button
                    key={pair.id}
                    onClick={() => {
                      if (selected && selected !== pair.id) {
                        handleMatch(selected, pair.id);
                      }
                    }}
                    className={`w-full p-3 rounded-lg font-semibold text-left transition-all ${
                      Object.values(matches).includes(pair.id)
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-100 hover:bg-blue-200 text-gray-800'
                    }`}
                  >
                    {pair.korean}
                    <br />
                    <span className="text-sm opacity-70">{pair.romanization}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-white mb-6 text-center">
          <p className="text-lg">ÄÃ£ ghÃ©p Ä‘Ãºng: <span className="font-bold text-2xl">{correctCount}/4</span></p>
        </div>

        <button
          onClick={handleFinish}
          disabled={correctCount < 4}
          className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-400 text-gray-900 font-bold py-4 rounded-lg transition-all"
        >
          {correctCount === 4 ? 'ðŸŽ‰ HoÃ n thÃ nh!' : `HoÃ n thÃ nh (${correctCount}/4)`}
        </button>
      </div>
    </div>
  );
}

