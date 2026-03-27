'use client';

import { useEffect, useState } from 'react';

interface Question {
  id: number;
  korean: string;
  english: string;
  vietnamese: string;
  level: string;
}

interface Pair {
  korean: Question;
  vietnamese: Question;
  matched: boolean;
}

interface TournamentMatchingProps {
  onComplete: (score: number, correctAnswers: number) => void;
  onExit: () => void;
  userLevel: string;
}

export default function TournamentMatching({
  onComplete,
  onExit,
  userLevel,
}: TournamentMatchingProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedKorean, setSelectedKorean] = useState<Question | null>(null);
  const [selectedVietnamese, setSelectedVietnamese] = useState<Question | null>(
    null
  );

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vocabulary/by-level/tournament?limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();

      if (!data.data || data.data.length === 0) {
        setLoading(false);
        return;
      }

      const vocabList = data.data.slice(0, 10);
      setQuestions(vocabList);

      // Create pairs (shuffle for matching game)
      const newPairs = vocabList.map((vocab: Question) => ({
        korean: vocab,
        vietnamese: vocab,
        matched: false,
      }));

      setPairs(newPairs);
      setLoading(false);
    } catch (error) {
      console.error('Error loading questions:', error);
      setLoading(false);
    }
  };

  const handleMatch = (koreanWord: Question, vietnameseWord: Question) => {
    if (koreanWord.id === vietnameseWord.id) {
      // Correct match
      setScore((prev) => prev + 10);
      setCorrectAnswers((prev) => prev + 1);

      setPairs(
        pairs.map((pair) =>
          pair.korean.id === koreanWord.id && pair.vietnamese.id === vietnameseWord.id
            ? { ...pair, matched: true }
            : pair
        )
      );

      setSelectedKorean(null);
      setSelectedVietnamese(null);
    } else {
      // Incorrect match - just update selection
      setSelectedVietnamese(vietnameseWord);
    }
  };

  const handleKoreanSelect = (word: Question) => {
    setSelectedKorean(word);
  };

  const handleVietnameseSelect = (word: Question) => {
    if (selectedKorean) {
      handleMatch(selectedKorean, word);
    } else {
      setSelectedVietnamese(word);
    }
  };

  const unmatchedPairs = pairs.filter((p) => !p.matched);
  const allMatched = unmatchedPairs.length === 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white text-xl">Đang tải câu hỏi...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white text-xl">
          Không có câu hỏi cho cấp độ của bạn
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">🔗 Ghép Cặp Giải Đấu</h1>
          <button
            onClick={onExit}
            className="text-white hover:text-gray-300 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Stats */}
        <div className="bg-white/20 backdrop-blur rounded-xl p-6 text-white mb-8">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm opacity-80">✅ Ghép đúng</p>
              <p className="text-3xl font-bold text-green-300">
                {correctAnswers}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-80">⭐ Điểm</p>
              <p className="text-3xl font-bold text-yellow-300">{score}</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-80">📦 Còn lại</p>
              <p className="text-3xl font-bold text-blue-300">
                {unmatchedPairs.length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-80">📊 Tiến độ</p>
              <p className="text-3xl font-bold text-purple-300">
                {Math.round(
                  ((correctAnswers / questions.length) * 100)
                )}%
              </p>
            </div>
          </div>
        </div>

        {/* Game Board */}
        {!allMatched ? (
          <div className="grid grid-cols-2 gap-8">
            {/* Korean Column */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">🇰🇷 Tiếng Hàn</h2>
              <div className="space-y-3">
                {unmatchedPairs.map((pair) => (
                  <button
                    key={pair.korean.id}
                    onClick={() => handleKoreanSelect(pair.korean)}
                    className={`w-full p-4 rounded-lg font-semibold transition-all text-left ${
                      selectedKorean?.id === pair.korean.id
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white scale-105 shadow-lg'
                        : 'bg-white text-gray-800 hover:shadow-lg cursor-pointer'
                    }`}
                  >
                    {pair.korean.korean}
                  </button>
                ))}
              </div>
            </div>

            {/* Vietnamese Column */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">🇻🇳 Tiếng Việt</h2>
              <div className="space-y-3">
                {unmatchedPairs
                  .slice()
                  .sort(() => Math.random() - 0.5)
                  .map((pair) => (
                    <button
                      key={`vn-${pair.vietnamese.id}`}
                      onClick={() => handleVietnameseSelect(pair.vietnamese)}
                      className={`w-full p-4 rounded-lg font-semibold transition-all text-left ${
                        selectedVietnamese?.id === pair.vietnamese.id
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white scale-105 shadow-lg'
                          : 'bg-white text-gray-800 hover:shadow-lg cursor-pointer'
                      }`}
                    >
                      {pair.vietnamese.vietnamese}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          /* Completion Screen */
          <div className="bg-white rounded-xl shadow-xl p-12 text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              🎉 Hoàn thành!
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Bạn đã ghép đúng tất cả {correctAnswers} cặp từ
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-green-100 rounded-lg p-4">
                <p className="text-gray-600 text-sm">Cặp đúng</p>
                <p className="text-3xl font-bold text-green-600">
                  {correctAnswers}
                </p>
              </div>
              <div className="bg-yellow-100 rounded-lg p-4">
                <p className="text-gray-600 text-sm">Tổng điểm</p>
                <p className="text-3xl font-bold text-yellow-600">{score}</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-4">
                <p className="text-gray-600 text-sm">Cấp độ</p>
                <p className="text-3xl font-bold text-blue-600">
                  {questions[0]?.level}
                </p>
              </div>
            </div>

            <button
              onClick={() => onComplete(score, correctAnswers)}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-4 px-8 rounded-lg hover:shadow-lg transition-all"
            >
              ✓ Hoàn tất & Quay lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
