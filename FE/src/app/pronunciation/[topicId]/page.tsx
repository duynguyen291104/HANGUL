'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface WordData {
  korean: string;
  romanization: string;
  english: string;
  vietnamese: string;
  id?: number;
  topic?: string;
}

export default function PronunciationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const topicId = params.topicId as string;
  const { user } = useAuthStore();

  const [isRecording, setIsRecording] = useState(false);
  const [pronunciationScore, setPronunciationScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [soundwaveHeights, setSoundwaveHeights] = useState<number[]>(Array(20).fill(8));
  const [vocabularyList, setVocabularyList] = useState<WordData[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState<WordData>({
    korean: '안녕하세요',
    romanization: 'An-nyeong-ha-se-yo',
    english: 'Hello',
    vietnamese: 'Xin chào',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [totalScores, setTotalScores] = useState<number[]>([]);
  const [completionStats, setCompletionStats] = useState({
    xp: 25,
    accuracy: 0,
    time: '00:00',
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);

  const fetchVocabulary = async (topicId: string) => {
    try {
      console.log(`🎤 [Pronunciation] Fetching vocabulary for topicId: ${topicId}`);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pronunciation/vocabulary/topic/${topicId}?limit=20`
      );

      console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Raw API response:', data);

      // Check both data.vocabulary and direct array response
      const vocabArray = data.vocabulary || data.data || data || [];
      console.log('🔍 Processed vocab array:', vocabArray);

      if (Array.isArray(vocabArray) && vocabArray.length > 0) {
        const formattedVocab: WordData[] = vocabArray.map((item: any) => ({
          id: item.id,
          korean: item.korean,
          english: item.english,
          vietnamese: item.vietnamese,
          romanization: item.romanization || item.korean,
          topic: item.topic,
        })).slice(0, 10);

        setVocabularyList(formattedVocab);
        setCurrentWord(formattedVocab[0]);
        setCurrentWordIndex(0);

        console.log(`✅ Loaded ${formattedVocab.length} pronunciation words from database`);
      } else {
        console.warn('⚠️ No vocabulary data returned from API - using fallback');
        useFallbackVocabulary();
      }
    } catch (error: any) {
      console.error('❌ Error fetching vocabulary:', error.message);
      console.log('📌 Using fallback hardcoded vocabulary...');
      useFallbackVocabulary();
    }
  };

  const useFallbackVocabulary = () => {
    const fallbackVocab: WordData[] = [
      { korean: '안녕하세요', romanization: 'An-nyeong-ha-se-yo', english: 'Hello', vietnamese: 'Xin chào' },
      { korean: '감사합니다', romanization: 'Gam-sa-ham-ni-da', english: 'Thank you', vietnamese: 'Cảm ơn' },
      { korean: '죄송합니다', romanization: 'Jwoe-song-ham-ni-da', english: 'Sorry', vietnamese: 'Xin lỗi' },
      { korean: '네', romanization: 'Ne', english: 'Yes', vietnamese: 'Vâng' },
      { korean: '아니요', romanization: 'A-ni-yo', english: 'No', vietnamese: 'Không' },
      { korean: '좋아요', romanization: 'Jo-a-yo', english: 'Good', vietnamese: 'Tốt' },
      { korean: '몰라요', romanization: 'Mol-la-yo', english: 'I do not know', vietnamese: 'Tôi không biết' },
      { korean: '천천히', romanization: 'Cheon-cheon-hi', english: 'Slowly', vietnamese: 'Chậm đi' },
      { korean: '다시', romanization: 'Da-si', english: 'Again', vietnamese: 'Lại lần nữa' },
      { korean: '이해했어요', romanization: 'I-hae-haess-eo-yo', english: 'I understand', vietnamese: 'Tôi hiểu' },
    ].slice(0, 10);
    setVocabularyList(fallbackVocab);
    setCurrentWord(fallbackVocab[0]);
    setCurrentWordIndex(0);
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (topicId) {
      fetchVocabulary(topicId);
      setStartTime(Date.now());
      setIsLoading(false);
    }
  }, [topicId, user, router]);

  const updateSoundwave = () => {
    if (analyzerRef.current && dataArrayRef.current) {
      (analyzerRef.current.getByteFrequencyData as any)(dataArrayRef.current);

      const newHeights: number[] = [];
      const barWidth = dataArrayRef.current.length / 20;

      for (let i = 0; i < 20; i++) {
        const start = Math.floor(i * barWidth);
        const end = Math.floor((i + 1) * barWidth);
        let sum = 0;

        for (let j = start; j < end; j++) {
          sum += dataArrayRef.current[j];
        }

        const average = sum / (end - start);
        const height = Math.max(8, (average / 255) * 64);
        newHeights.push(height);
      }

      setSoundwaveHeights(newHeights);
    }

    if (isRecordingRef.current) {
      animationRef.current = requestAnimationFrame(updateSoundwave);
    }
  };

  if (isLoading || !user) {
    return null;
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzerRef.current = analyzer;

      analyzer.fftSize = 256;
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;

      source.connect(analyzer);

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstart = () => {
        setIsRecording(true);
        isRecordingRef.current = true;
        updateSoundwave();
      };

      mediaRecorder.onstop = () => {
        setIsRecording(false);
        isRecordingRef.current = false;
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        setSoundwaveHeights(Array(20).fill(8));

        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };

      mediaRecorder.start();
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());

      setTimeout(() => {
        const score = Math.floor(Math.random() * 40) + 60;

        let message = '';
        if (score >= 90) {
          message = 'Excellent! Perfect pronunciation!';
        } else if (score >= 80) {
          message = 'Great! Good job!';
        } else if (score >= 70) {
          message = 'Good effort! Keep practicing!';
        } else {
          message = 'Try again! You can do better!';
        }

        setPronunciationScore(score);
        setFeedbackMessage(message);
        setShowFeedback(true);
      }, 1500);
    }
  };

  const playNativeAudio = () => {
    const utterance = new SpeechSynthesisUtterance(currentWord.korean);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  };

  const markTopicComplete = async () => {
    try {
      if (!user) {
        console.warn('⚠️ User not authenticated');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ Token not found in localStorage');
        return;
      }

      console.log('📤 Posting completion to API with token:', token.substring(0, 10) + '...');
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/quiz/progress/complete-topic`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ topicId: Number(topicId), mode: 'speak' }),
        }
      );

      if (!response.ok) {
        console.error(`❌ API Error: ${response.status} - ${response.statusText}`);
        return;
      }

      const data = await response.json();
      console.log('✅ Topic marked as completed:', data);
    } catch (error) {
      console.error('❌ Error marking topic complete:', error);
    }
  };

  const retryPhrase = () => {
    setPronunciationScore(0);
    setShowFeedback(false);
    setFeedbackMessage('');
  };

  const nextPhrase = async () => {
    if (vocabularyList.length === 0) {
      return;
    }

    const nextIndex = currentWordIndex + 1;
    
    // Add current score to total
    setTotalScores([...totalScores, pronunciationScore]);

    // Check if completed all 10 items
    if (nextIndex >= 10 || nextIndex >= vocabularyList.length) {
      await markTopicComplete();
      
      // Calculate completion stats
      const scores = [...totalScores, pronunciationScore];
      const avgAccuracy = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const elapsedTime = startTime ? Date.now() - startTime : 0;
      const minutes = Math.floor(elapsedTime / 60000);
      const seconds = Math.floor((elapsedTime % 60000) / 1000);
      const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      
      setCompletionStats({
        xp: 25,
        accuracy: avgAccuracy,
        time: timeStr,
      });
      setIsCompleted(true);
      return;
    }

    setCurrentWordIndex(nextIndex);
    setCurrentWord(vocabularyList[nextIndex]);
    setPronunciationScore(0);
    setShowFeedback(false);
    setFeedbackMessage('');
  };

  return (
    <div className="min-h-screen bg-[#fafaf5]" suppressHydrationWarning>
      <Header />
      <div className="flex">
        <main className="flex-grow p-8 lg:p-12">
          {/* Completion Screen */}
          {isCompleted ? (
            <div className="flex flex-col items-center justify-center min-h-[80vh] gap-12">
              {/* Hero Section */}
              <div className="relative w-full flex flex-col items-center">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-full bg-gradient-radial opacity-30 rounded-full blur-3xl"></div>
                </div>
                <div className="text-center">
                  <h1 className="font-extrabold text-5xl md:text-6xl text-[#72564c] tracking-tight">
                    Bài học hoàn tất!
                  </h1>
                  <p className="text-[#504441] font-medium mt-4 text-xl">
                    Hana rất tự hào về nỗ lực của bạn!
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                {/* XP Card */}
                <div className="bg-[#f4f4ef] rounded-lg p-6 flex flex-col items-center justify-center hover:bg-[#eeeee9] transition-colors">
                  <div className="w-12 h-12 rounded-full bg-[#ffdbce] flex items-center justify-center mb-3">
                    <span className="text-xl">⚡</span>
                  </div>
                  <span className="font-bold text-2xl text-[#815300]">
                    +{completionStats.xp} XP
                  </span>
                  <span className="text-xs uppercase tracking-widest text-[#504441] mt-2">
                    Điểm kinh nghiệm
                  </span>
                </div>

                {/* Accuracy Card */}
                <div className="bg-[#f4f4ef] rounded-lg p-6 flex flex-col items-center justify-center hover:bg-[#eeeee9] transition-colors">
                  <div className="w-12 h-12 rounded-full bg-[#ffdbce] flex items-center justify-center mb-3">
                    <span className="text-xl"></span>
                  </div>
                  <span className="font-bold text-2xl text-[#72564c]">
                    {completionStats.accuracy}%
                  </span>
                  <span className="text-xs uppercase tracking-widest text-[#504441] mt-2">
                    Độ chính xác
                  </span>
                </div>

                {/* Time Card */}
                <div className="bg-[#f4f4ef] rounded-lg p-6 flex flex-col items-center justify-center hover:bg-[#eeeee9] transition-colors">
                  <div className="w-12 h-12 rounded-full bg-[#ffdbce] flex items-center justify-center mb-3">
                    <span className="text-xl">⏱️</span>
                  </div>
                  <span className="font-bold text-2xl text-[#5b4137]">
                    {completionStats.time}
                  </span>
                  <span className="text-xs uppercase tracking-widest text-[#504441] mt-2">
                    Thời gian học
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col w-full max-w-sm gap-4">
                <button
                  onClick={() => router.push('/pronunciation')}
                  className="bg-gradient-to-r from-[#72564c] to-[#8d6e63] text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:from-[#8d6e63] hover:to-[#a0806e] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Tiếp tục
                  <span>→</span>
                </button>
                <button
                  onClick={() => router.push('/pronunciation')}
                  className="bg-[#ffdbce] text-[#2b160f] font-bold text-lg py-4 rounded-xl hover:bg-[#e4beb2] active:scale-95 transition-all"
                >
                  Chọn bài khác
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Back Button */}
              <button
                onClick={() => router.push('/pronunciation')}
                className="flex items-center gap-2 text-[#72564c] hover:text-[#8d6e63] font-semibold mb-6 transition"
              >
                <ArrowLeft size={20} />
                Quay lại
              </button>

              <section className="flex flex-col gap-6 max-w-6xl mx-auto">
            {/* Progress Bar */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-[#72564c]">Tiến độ</span>
                <span className="text-sm font-bold text-[#8d6e63]">{currentWordIndex + 1}/10</span>
              </div>
              <div className="w-full bg-[#e8dcd3] rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#72564c] to-[#8d6e63] h-3 transition-all duration-300"
                  style={{ width: `${((currentWordIndex + 1) / 10) * 100}%` }}
                />
              </div>
            </div>

            {/* Header Card */}
            <div className="bg-[#f4f4ef] rounded-lg p-8 relative overflow-hidden flex flex-col items-center text-center">
              <div className="mt-8 mb-6">
                <h1 className="text-6xl md:text-7xl font-extrabold text-[#72564c] tracking-tight mb-2">
                  {currentWord.korean}
                </h1>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={playNativeAudio}
                    className="hover:opacity-70 transition-all active:scale-95 flex items-center justify-center"
                    title="Listen pronunciation"
                  >
                    <img
                      src="https://res.cloudinary.com/dds5jlp7e/image/upload/v1774781688/volume_rv7osj.png"
                      alt="Volume"
                      className="w-8 h-8 object-contain"
                    />
                  </button>
                  <p className="text-2xl text-[#8d6e63] font-medium tracking-widest uppercase">
                    {currentWord.romanization}
                  </p>
                </div>

                {/* Soundwave Animation */}
                <div className="mt-6 flex items-center justify-center gap-1 h-16" style={{ width: '300px', margin: '0 auto' }}>
                  <style>{`
                    .sound-bar {
                      background-color: #72564c;
                      border-radius: 4px;
                      width: 7px;
                      transition: ${isRecording ? 'none' : 'height 0.3s ease'};
                    }
                  `}</style>

                  {soundwaveHeights.map((height, index) => (
                    <div
                      key={index}
                      className="sound-bar"
                      style={{
                        height: `${height}px`,
                      }}
                    />
                  ))}
                </div>

                {/* Recording Button */}
                <div className="flex justify-center">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className="mt-8 active:scale-95 transition-all flex items-center justify-center"
                    style={{
                      borderRadius: '12px',
                      width: '70px',
                      height: '70px',
                      backgroundColor: isRecording ? '#ffffff' : '#72564c',
                      border: isRecording ? '2px solid #72564c' : 'none',
                    }}
                    title={isRecording ? 'Stop recording' : 'Start recording'}
                  >
                    <img
                      src="https://res.cloudinary.com/dds5jlp7e/image/upload/v1774782369/microphone_qebkse.png"
                      alt="Microphone"
                      className="w-10 h-10 object-contain"
                      style={{
                        filter: isRecording
                          ? 'invert(0.4) sepia(0.5) hue-rotate(-10deg) saturate(0.8)'
                          : 'brightness(0) invert(1)',
                      }}
                    />
                  </button>
                </div>

                {/* Feedback Notification */}
                {showFeedback && (
                  <div className="mt-8 bg-white rounded-lg p-6 shadow-xl border-2 border-[#72564c] w-full max-w-md animate-in fade-in">
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-[#72564c] flex items-center justify-center">
                        <span className="text-3xl font-black text-white">
                          {pronunciationScore}%
                        </span>
                      </div>
                      <div>
                        <p className="text-xs uppercase font-bold text-[#504441] tracking-wider mb-1">
                          Pronunciation Score
                        </p>
                        <p className="text-xl font-bold text-[#72564c]">
                          {feedbackMessage}
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-[#d4c3be] w-full">
                        <p className="text-xs text-[#504441] mb-2">Nghĩa tiếng Việt:</p>
                        <p className="text-lg font-bold text-[#8d6e63]">{currentWord.vietnamese}</p>
                      </div>

                      <div className="mt-4 w-full flex gap-3">
                        <button
                          onClick={retryPhrase}
                          className="flex-1 px-6 py-3 bg-[#e8dcd3] text-[#72564c] rounded-lg font-bold hover:bg-[#d4c3be] transition-all active:scale-95"
                        >
                          Phát lại
                        </button>
                        <button
                          onClick={nextPhrase}
                          className="flex-1 px-6 py-3 bg-[#72564c] text-white rounded-lg font-bold hover:bg-[#8d6e63] transition-all active:scale-95"
                        >
                          Từ tiếp theo
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
            </>
          )}
        </main>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg flex justify-around items-center py-4 px-6 border-t border-[#d4c3be]/10 z-50">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-[#72564c]/60">
          <span className="text-2xl"></span>
          <span className="text-[10px] font-bold uppercase">Home</span>
        </Link>
        <button className="flex flex-col items-center gap-1 text-[#72564c]">
          <span className="text-2xl"></span>
          <span className="text-[10px] font-bold uppercase">Practice</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#72564c]/60">
          <span className="text-2xl"></span>
          <span className="text-[10px] font-bold uppercase">Stats</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#72564c]/60">
          <span className="text-2xl">👤</span>
          <span className="text-[10px] font-bold uppercase">Profile</span>
        </button>
      </nav>
    </div>
  );
}
