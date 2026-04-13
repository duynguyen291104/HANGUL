'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import SpeedTournament from '../SpeedTournament';
import WritingTournament from '../WritingTournament';
import MatchingTournament from '../MatchingTournament';
import PronunciationTournament from '../PronunciationTournament';

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params?.gameId as string;

  useEffect(() => {
    if (!gameId) {
      router.push('/tournament');
    }
  }, [gameId, router]);

  const handleComplete = (score: number, correctAnswers: number) => {
    // Xử lý khi hoàn thành trò chơi
    console.log(`Game completed: ${score} points, ${correctAnswers} correct answers`);
    // Có thể chuyển đến trang kết quả hoặc quay lại tournament
    router.push('/tournament');
  };

  const handleExit = () => {
    router.push('/tournament');
  };

  // Render component phù hợp dựa trên gameId
  const renderGame = () => {
    switch (gameId) {
      case 'speed-quiz':
        return <SpeedTournament onComplete={handleComplete} onExit={handleExit} />;
      case 'flash-writing':
        return <WritingTournament onComplete={handleComplete} onExit={handleExit} />;
      case 'word-match':
        return <MatchingTournament onComplete={handleComplete} onExit={handleExit} />;
      case 'perfect-speaking':
        return <PronunciationTournament onComplete={handleComplete} onExit={handleExit} />;
      default:
        return <SpeedTournament onComplete={handleComplete} onExit={handleExit} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf5]">
      {renderGame()}
    </div>
  );
}
