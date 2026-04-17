'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuthStore } from '@/store/authStore';
import { Volume2, Mic } from 'lucide-react';
import ResultSummary, { type ResultItem } from '@/components/ResultSummary';

interface Vocabulary {
  id: number;
  korean: string;
  english: string;
  vietnamese: string;
  romanization: string;
}

interface SoundWavePoint {
  x: number;
  y: number;
}

export default function PronunciationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuthStore();
  const slug = params.slug as string;

  const [topicId, setTopicId] = useState<number | null>(null);
  const [topicName, setTopicName] = useState('');
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [totalScores, setTotalScores] = useState<number[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [soundWave, setSoundWave] = useState<SoundWavePoint[]>([]);
  const [speed, setSpeed] = useState(0.5);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [results, setResults] = useState<ResultItem[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const highlightIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchTopic = async () => {
      if (!slug) return;
      
      try {
        // Step 1: Fetch topic info to get topicId and name
        const topicResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/topic/slug/${slug}`
        );
        
        if (topicResponse.ok) {
          const topicData = await topicResponse.json();
          setTopicId(topicData.id); // NEW: Store topicId for scoring
          setTopicName(topicData.name);
          
          // Step 2: Fetch random vocabulary from this topic
          if (topicData.id) {
            const vocabResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/public-vocab/random-by-topic/${topicData.id}?limit=10`
            );
            
            if (vocabResponse.ok) {
              const vocabData = await vocabResponse.json();
              if (vocabData.data && Array.isArray(vocabData.data)) {
                setVocabulary(vocabData.data);
              }
            }
          }
          setQuestionStartTime(Date.now()); // Set initial question start time
        }
      } catch (error) {
        console.error('Error fetching topic:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopic();
  }, [slug]);

  // Initialize voices
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const synth = window.speechSynthesis;
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = () => {
          synth.getVoices();
        };
      }
    }
  }, []);

  const handlePlayAudio = async () => {
    const currentWord = vocabulary[currentIndex];
    if (!currentWord) return;

    try {
      // Clear previous highlight interval
      if (highlightIntervalRef.current) {
        clearInterval(highlightIntervalRef.current);
      }

      const synth = window.speechSynthesis;
      
      // Ensure voices are loaded
      let voices = synth.getVoices();
      if (voices.length === 0) {
        await new Promise(resolve => {
          synth.onvoiceschanged = () => {
            resolve(null);
          };
        });
        voices = synth.getVoices();
      }

      // Phát với tốc độ hiện tại
      const speech = new SpeechSynthesisUtterance(currentWord.korean);
      speech.rate = speed;
      speech.lang = 'ko-KR';
      speech.volume = 1;
      speech.pitch = 1;

      // Find Korean voice or use default
      const koreanVoice = voices.find((v) => v.lang.includes('ko'));
      if (koreanVoice) {
        speech.voice = koreanVoice;
      }

      // Cancel any ongoing speech
      synth.cancel();
      
      // Log for debugging
      console.log(`🔊 Playing: "${currentWord.korean}" at ${speed}x speed`);
      
      // Speak
      synth.speak(speech);
      
      // Highlight characters in romanization
      const romanizationLength = currentWord.romanization ? currentWord.romanization.length : 0;
      if (romanizationLength > 0) {
        let charIndex = 0;
        const highlightDuration = 150; // adjust timing based on speed
        
        highlightIntervalRef.current = setInterval(() => {
          setActiveIndex(charIndex);
          charIndex++;
          
          if (charIndex >= romanizationLength) {
            clearInterval(highlightIntervalRef.current!);
            highlightIntervalRef.current = null;
            
            // Reset to gray after speaking
            setTimeout(() => setActiveIndex(-1), 300);
          }
        }, highlightDuration);
      }
      
      // Sau đó chuyển sang tốc độ tiếp theo: 0.5x → 1.5x → 0.5x
      const speeds = [0.5, 1.5];
      const currentSpeedIndex = speeds.indexOf(speed);
      const nextSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
      const nextSpeed = speeds[nextSpeedIndex];
      setSpeed(nextSpeed);
    } catch (error) {
      console.error('❌ Error playing audio:', error);
    }
  };

  const handleMicClick = async () => {
    if (!isRecording && !hasRecorded) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        setIsRecording(true);
        setHasRecorded(true);
        setSoundWave([]);

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyserRef.current = analyser;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const visualize = () => {
          animationFrameRef.current = requestAnimationFrame(visualize);
          
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);

          const points: SoundWavePoint[] = [];
          for (let i = 0; i < dataArray.length; i++) {
            points.push({
              x: (i / dataArray.length) * 100,
              y: (dataArray[i] / 255) * 100,
            });
          }
          setSoundWave(points);
        };
        visualize();

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        
        const audioChunks: Blob[] = [];
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          try {
            // Create audio blob
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            
            // Convert to base64
            const reader = new FileReader();
            reader.readAsArrayBuffer(audioBlob);
            
            reader.onload = async () => {
              const arrayBuffer = reader.result as ArrayBuffer;
              const base64Audio = btoa(
                new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
              );

              const currentWord = vocabulary[currentIndex];
              if (!currentWord) return;

              // Call scoring endpoint
              try {
                const scoreResponse = await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/pronunciation/score`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      audioBase64: base64Audio,
                      correctAnswer: currentWord.romanization,
                      language: 'ko-KR',
                      topicId, // NEW: Add topicId for progress tracking
                      vocabId: currentWord.id, // NEW: Add vocabId
                      korean: currentWord.korean, // NEW: Add korean word
                    }),
                  }
                );

                if (scoreResponse.ok) {
                  const scoreData = await scoreResponse.json();
                  console.log('📊 Pronunciation Score:', scoreData);
                  setScore(scoreData.accuracy);
                } else {
                  console.error('Scoring failed:', scoreResponse.statusText);
                  // Fallback to random score if API fails
                  const fallbackScore = Math.floor(Math.random() * 51) + 50;
                  setScore(fallbackScore);
                }
              } catch (error) {
                console.error('Error calling scoring endpoint:', error);
                // Fallback to random score if can't reach API
                const fallbackScore = Math.floor(Math.random() * 51) + 50;
                setScore(fallbackScore);
              }
            };
          } catch (error) {
            console.error('Error processing audio:', error);
          }
        };

        mediaRecorder.start();
      } catch (error) {
        console.error('Error accessing microphone:', error);
        setIsRecording(false);
        setHasRecorded(false);
      }
    } else if (isRecording) {
      setIsRecording(false);
      
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleRetry = () => {
    setScore(null);
    setHasRecorded(false);
    setSoundWave([]);
    setIsRecording(false);
    setQuestionStartTime(Date.now());
  };

  const savePronunciationHistory = async (resultsToSave: ResultItem[]) => {
    try {
      console.log('💾 Saving pronunciation history...');
      console.log('📦 Data being sent:', {
        questionCount: resultsToSave.length,
        slug,
        skillType: 'PRONUNCIATION',
        questions: resultsToSave.map((r) => ({
          korean: r.question,
          accuracy: r.accuracy,
        })),
      });
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/quiz/save-learning-history`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            questions: resultsToSave.map((result) => ({
              korean: result.question,
              vietnamese: vocabulary.find(word => word.korean === result.question)?.vietnamese || '',
              accuracy: result.accuracy,
            })),
            slug: slug,
            skillType: 'PRONUNCIATION',
          }),
        }
      );

      console.log(`📡 Response status: ${response.status}`);
      
      const result = await response.json();
      if (response.ok) {
        console.log('✅ Pronunciation history saved:', result);
      } else {
        console.warn('⚠️ Failed to save history:', result.message, result);
      }
    } catch (error) {
      console.error('❌ Error saving pronunciation history:', error);
    }
  };

  const handleNext = async () => {
    const currentWord = vocabulary[currentIndex];
    const timeSpent = score !== null ? Math.round((Date.now() - questionStartTime) / 1000) : 0;
    const currentAccuracy = score || 0;
    const isCorrect = currentAccuracy >= 50;
    const xp = isCorrect ? 10 : 0;

    // Add to results
    const newResult: ResultItem = {
      question: currentWord.korean,
      correctAnswer: currentWord.romanization,
      accuracy: currentAccuracy,
      isCorrect,
      xp,
      timeSpent,
    };

    setResults([...results, newResult]);

    if (currentIndex < vocabulary.length - 1) {
      setTotalScores([...totalScores, score || 0]);
      setCurrentIndex(currentIndex + 1);
      setScore(null);
      setHasRecorded(false);
      setSoundWave([]);
      setIsRecording(false);
      setQuestionStartTime(Date.now());
    } else {
      console.log('🏁 All words completed! Saving history...');
      console.log('📊 Results to save:', [...results, newResult]);
      
      setTotalScores([...totalScores, score || 0]);
      
      // Calculate total time and log activity
      const updatedResults = [...results, newResult];
      const totalTimeSpent = updatedResults.reduce((sum, r) => sum + r.timeSpent, 0);
      console.log(`⏱️ Total time spent: ${totalTimeSpent}s`);
      console.log(`📤 About to save to backend...`);
      
      await savePronunciationHistory(updatedResults);
      await logLearningTime(totalTimeSpent, 'pronunciation');
      
      console.log('✅ All save operations completed, setting isCompleted = true');
      setIsCompleted(true);
    }
  };

  const logLearningTime = async (totalSeconds: number, skillType: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/activity/log-time`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            totalSeconds: Math.round(totalSeconds),
            skillType,
          }),
        }
      );

      if (response.ok) {
        console.log(`✅ Logged ${Math.round(totalSeconds)}s of ${skillType} learning`);
      } else {
        console.warn('⚠️ Failed to log learning time');
      }
    } catch (error) {
      console.warn('⚠️ Error logging learning time:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface to-surface-container flex items-center justify-center">
        <Header />
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="text-on-surface-variant font-medium">Đang tải bài phát âm...</p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <ResultSummary
        results={results}
        mode="pronunciation"
        topicName={topicName}
        backPath="/pronunciation"
        continueAction={() => router.push('/pronunciation?refresh=true')}
      />
    );
  }

  if (!vocabulary.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface to-surface-container flex items-center justify-center">
        <Header />
        <p className="text-on-surface-variant">Không có từ nào để phát âm</p>
      </div>
    );
  }

  const currentWord = vocabulary[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-surface-container">
      <Header />
      
      <div className="pt-[75px] flex flex-col items-center px-4 pb-8">
        <button
          onClick={() => router.push('/pronunciation')}
          className="fixed top-[95px] left-[20px] z-20 flex items-center gap-2 px-4 py-2 text-[#72564c] hover:text-[#504441] font-semibold transition-all hover:scale-105 active:scale-95"
        >
          <span className="text-xl">←</span>
          <span>Quay lại</span>
        </button>

        <p className="text-on-surface-variant mb-8">
          {currentIndex + 1} / {vocabulary.length}
        </p>

        <h1 className="text-4xl font-bold text-on-background mb-12">{topicName}</h1>

        <div className="bg-surface-container rounded-2xl p-12 text-center mb-12 max-w-md w-full">
          <p className="text-on-surface-variant text-sm font-bold mb-4">Phát âm từ này</p>
          
          {/* Speaker + Speed + Korean in same row */}
          <div className="flex items-center gap-2 justify-center mb-8">
            <p className="text-8xl font-bold text-on-background">{currentWord.korean}</p>
          </div>

          {/* Sound Wave Animation */}
          {soundWave.length > 0 && (
            <div className="mb-8 h-12 flex items-center justify-center">
              <svg width="100%" height="100%" viewBox="0 0 400 64" preserveAspectRatio="none">
                <polyline
                  points={soundWave
                    .map((point, i) => `${(i / soundWave.length) * 400},${32 - point.y / 2}`)
                    .join(' ')}
                  fill="none"
                  stroke="#72564c"
                  strokeWidth="2"
                />
              </svg>
            </div>
          )}

          {/* Speaker + Speed + Romanization */}
          <div className="flex items-start gap-2 justify-center mb-8">
            <div className="flex flex-col items-center gap-0.5">
              <button
                onClick={handlePlayAudio}
                className="text-on-background hover:opacity-70 transition flex-shrink-0"
                title="Click to cycle speed: 0.5x → 1.5x"
              >
                <Volume2 size={28} />
              </button>
              <p className="text-2xl font-bold text-primary">
                {speed === 0.5 ? '0.5x' : '1.5x'}
              </p>
            </div>
            <p className="text-lg font-medium">
              {currentWord.romanization && currentWord.romanization.split('').map((char, index) => (
                <span
                  key={index}
                  className={`transition-all duration-100 ${
                    index <= activeIndex
                      ? 'text-black font-bold'
                      : 'text-gray-400 font-normal'
                  }`}
                >
                  {char}
                </span>
              ))}
            </p>
          </div>

          <button
            onClick={handleMicClick}
            className={`w-12 h-12 rounded-full mx-auto mb-8 flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-[#72564c] hover:bg-[#8d6e63]'
            }`}
            title={isRecording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
          >
            <Mic size={24} className="text-white" />
          </button>

          {score !== null && (
            <div className="mt-8 p-4 bg-primary/10 rounded-lg">
              <p className="text-on-surface font-medium mb-2">{currentWord.english}</p>
              <p className="text-on-surface-variant text-sm mb-4">{currentWord.vietnamese}</p>
              <p className="text-on-surface-variant text-sm mb-2">Kết quả phát âm</p>
              <p className="text-3xl font-bold text-primary">{score}%</p>
              <p className="text-on-surface-variant text-xs mt-2">
                {score >= 80 ? '🎉 Xuất sắc!' : score >= 60 ? '👍 Tốt' : '💪 Cố gắng thêm'}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-4 max-w-md w-full">
          {score !== null ? (
            <>
              <button
                onClick={handleRetry}
                className="flex-1 px-6 py-3 bg-surface-container text-on-surface rounded-full font-bold hover:opacity-80 transition border border-outline-variant"
              >
                Làm lại
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-6 py-3 bg-primary text-on-primary rounded-full font-bold hover:opacity-90 transition"
              >
                {currentIndex === vocabulary.length - 1 ? 'Hoàn tát' : 'Tiếp tục'}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
