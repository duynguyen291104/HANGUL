'use client';

import { useEffect, useRef, useState } from 'react';

interface WordData {
  korean: string;
  romanization: string;
  english: string;
  vietnamese: string;
  id?: number;
  topic?: string;
}

interface PronunciationTournamentProps {
  onComplete: (score: number, correctAnswers: number) => void;
  onExit: () => void;
}

export default function PronunciationTournament({ onComplete, onExit }: PronunciationTournamentProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [pronunciationScore, setPronunciationScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [soundwaveHeights, setSoundwaveHeights] = useState<number[]>(Array(20).fill(8));
  const [vocabularyList, setVocabularyList] = useState<WordData[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState<WordData>({
    korean: '안녕하세요',
    romanization: 'An-nyeong-ha-se-yo',
    english: '"Hello / Good day"',
    vietnamese: '"Xin chào"'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [tournamentScore, setTournamentScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    loadVocabulary();
  }, []);

  const loadVocabulary = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vocabulary?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      // Handle both response formats: direct array or {data: array}
      const vocabArray = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : null);

      if (!vocabArray || vocabArray.length === 0) {
        console.error('Invalid API response:', data);
        setIsLoading(false);
        return;
      }

      const vocabList = vocabArray.slice(0, 10).map((vocab: any) => ({
        korean: vocab.korean,
        romanization: vocab.romanization || '',
        english: vocab.english,
        vietnamese: vocab.vietnamese,
        id: vocab.id,
      }));

      setVocabularyList(vocabList);
      if (vocabList.length > 0) {
        setCurrentWord(vocabList[0]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading vocabulary:', error);
      setIsLoading(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        // audioBlob is recorded but used for API calls in production
        // const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await handleAnalyzePronunciation();
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      isRecordingRef.current = true;

      // Setup audio visualization
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyzerRef.current = audioContextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 256;
        const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
        dataArrayRef.current = dataArray;

        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyzerRef.current);
      }

      animateWaveform();
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      isRecordingRef.current = false;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  };

  const animateWaveform = () => {
    if (!analyzerRef.current || !dataArrayRef.current || !isRecordingRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (analyzerRef.current as any).getByteFrequencyData(dataArrayRef.current);
    const newHeights = Array.from(dataArrayRef.current)
      .slice(0, 20)
      .map(v => Math.max(8, Math.min(48, (v / 255) * 48)));

    setSoundwaveHeights(newHeights);
    animationRef.current = requestAnimationFrame(animateWaveform);
  };

  const handleAnalyzePronunciation = async () => {
    try {
      // Simulate pronunciation analysis (in real implementation, call API)
      const score = Math.floor(Math.random() * 40 + 60); // 60-100 score
      setPronunciationScore(score);
      setFeedbackMessage(score > 80 ? 'Excellent pronunciation! 🎉' : 'Good effort! Keep practicing. 💪');
      setShowFeedback(true);

      // Update tournament scores
      setTournamentScore(prev => prev + score);
      setCorrectAnswers(prev => prev + 1);

      setTimeout(() => {
        handleNextWord();
      }, 2000);
    } catch (error) {
      console.error('Error analyzing pronunciation:', error);
      setFeedbackMessage('Error analyzing pronunciation');
      setShowFeedback(true);
    }
  };

  const handleNextWord = () => {
    setShowFeedback(false);
    if (currentWordIndex < vocabularyList.length - 1) {
      const nextIndex = currentWordIndex + 1;
      setCurrentWordIndex(nextIndex);
      setCurrentWord(vocabularyList[nextIndex]);
    } else {
      // Tournament completed
      onComplete(tournamentScore, correctAnswers);
    }
  };

  const handlePlayNativeAudio = async () => {
    if (isPlayingAudio) return;

    try {
      setIsPlayingAudio(true);
      const audioUrl = `https://noto-website-2.storage.googleapis.com/poems/gmorning_ko_x5.mp3`;
      
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlayingAudio(false);
      audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlayingAudio(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafaf5] flex items-center justify-center">
        <p className="text-[#72564c] font-bold text-lg">Loading pronunciation tournament...</p>
      </div>
    );
  }

  if (vocabularyList.length === 0 || !currentWord) {
    return (
      <div className="min-h-screen bg-[#fafaf5] flex items-center justify-center">
        <p className="text-[#72564c] font-bold text-lg">Không có dữ liệu từ vựng</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf5] p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl"></span>
              <h1 className="text-3xl font-bold text-[#72564c]">Perfect Speaking</h1>
            </div>
            <p className="text-[#8d6e63] text-sm">Luyện phát âm hoàn hảo</p>
          </div>
          <button
            onClick={onExit}
            className="px-4 py-2 bg-[#f0e6e0] text-[#72564c] rounded-lg font-bold hover:bg-[#e8dcd4] transition-all"
          >
            ✕
          </button>
        </div>

        {/* Progress */}
        <div className="mb-8 p-4 bg-white rounded-lg shadow-md">
          <p className="text-sm text-[#72564c] font-bold">
            Word {currentWordIndex + 1} of {vocabularyList.length}
          </p>
          <div className="w-full h-2 bg-[#eeeee9] rounded-full mt-2">
            <div
              className="h-full bg-gradient-to-r from-[#72564c] to-[#8d6e63] rounded-full transition-all"
              style={{ width: `${((currentWordIndex + 1) / vocabularyList.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Korean Word */}
          <div className="mb-6">
            <p className="text-sm text-[#72564c] mb-2">Pronounce this word:</p>
            <p className="text-5xl font-bold text-[#1a1c19] mb-2">{currentWord.korean}</p>
            <p className="text-lg text-[#504441]">{currentWord.romanization}</p>
          </div>

          {/* English & Vietnamese */}
          <div className="mb-8 p-4 bg-[#f9f9f7] rounded-lg">
            <p className="text-sm text-[#504441]">{currentWord.english}</p>
            <p className="text-sm text-[#72564c] font-semibold">{currentWord.vietnamese}</p>
          </div>

          {/* Play Native Audio Button */}
          <div className="mb-8">
            <button
              onClick={handlePlayNativeAudio}
              disabled={isPlayingAudio}
              className="px-8 py-3 bg-[#ffddb5] text-[#815300] rounded-lg font-bold hover:bg-[#ffcd9b] transition-all disabled:opacity-50"
            >
              {isPlayingAudio ? 'Playing...' : 'Listen to Native'}
            </button>
          </div>

          {/* Soundwave Visualization */}
          {isRecording && (
            <div className="mb-8 flex items-center justify-center gap-1 h-16">
              {soundwaveHeights.map((height, idx) => (
                <div
                  key={idx}
                  className="w-1 bg-gradient-to-t from-[#72564c] to-[#8d6e63] rounded-full transition-all duration-75"
                  style={{ height: `${height}px` }}
                ></div>
              ))}
            </div>
          )}

          {/* Recording Button */}
          <div className="mb-8">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                className="w-full px-8 py-6 bg-gradient-to-r from-[#72564c] to-[#8d6e63] text-white rounded-lg font-bold text-lg hover:scale-105 transition-transform active:scale-95"
              >
                Start Recording
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="w-full px-8 py-6 bg-[#f44336] text-white rounded-lg font-bold text-lg hover:bg-[#da190b] transition-all active:scale-95 animate-pulse"
              >
                Stop Recording
              </button>
            )}
          </div>

          {/* Feedback Message */}
          {showFeedback && (
            <div className="p-4 bg-[#f1f8e9] border-2 border-[#4caf50] rounded-lg">
              <p className="text-lg font-bold text-[#4caf50]">Score: {pronunciationScore}/100</p>
              <p className="text-sm text-[#2e7d32]">{feedbackMessage}</p>
            </div>
          )}
        </div>

        {/* Tournament Stats */}
        <div className="mt-8 p-4 bg-gradient-to-r from-[#72564c] to-[#8d6e63] text-white rounded-lg shadow-lg">
          <p className="text-sm font-bold">Tournament Score: <span className="text-xl">{tournamentScore}</span></p>
        </div>
      </div>
    </div>
  );
}
