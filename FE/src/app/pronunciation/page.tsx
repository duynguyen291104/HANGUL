'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

interface WordData {
  korean: string;
  romanization: string;
  english: string;
  vietnamese: string;
  id?: number;
  topic?: string;
}

export default function PronunciationPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
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
    english: '"Hello / Good day"',
    vietnamese: '"Xin chào"'
  });
  const [isLoading, setIsLoading] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);

  // Fetch vocabulary from database based on user level
  const fetchVocabulary = async (level: string) => {
    try {
      console.log(`🎤 [Pronunciation] Fetching vocabulary for level: ${level}`);
      
      const response = await fetch(`/api/pronunciation/vocabulary/${level}?limit=20`);
      
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.vocabulary && data.vocabulary.length > 0) {
        const formattedVocab: WordData[] = data.vocabulary.map((item: any) => ({
          id: item.id,
          korean: item.korean,
          english: item.english,
          vietnamese: item.vietnamese,
          romanization: item.romanization || item.korean,
          topic: item.topic
        }));
        
        setVocabularyList(formattedVocab);
        setCurrentWord(formattedVocab[0]);
        setCurrentWordIndex(0);
        
        console.log(`✅ Loaded ${formattedVocab.length} pronunciation words from database`);
      } else {
        console.warn('⚠️ No vocabulary data returned from API');
        useFallbackVocabulary();
      }
    } catch (error: any) {
      console.error('❌ Error fetching vocabulary:', error.message);
      console.log('📌 Using fallback hardcoded vocabulary...');
      useFallbackVocabulary();
    }
  };

  // Fallback vocabulary if API fails
  const useFallbackVocabulary = () => {
    const fallbackVocab: WordData[] = [
      { korean: '안녕하세요', romanization: 'An-nyeong-ha-se-yo', english: 'Hello', vietnamese: 'Xin chào' },
      { korean: '감사합니다', romanization: 'Gam-sa-ham-ni-da', english: 'Thank you', vietnamese: 'Cảm ơn' },
      { korean: '죄송합니다', romanization: 'Jwoe-song-ham-ni-da', english: 'Sorry', vietnamese: 'Xin lỗi' },
      { korean: '네', romanization: 'Ne', english: 'Yes', vietnamese: 'Vâng' },
      { korean: '아니요', romanization: 'A-ni-yo', english: 'No', vietnamese: 'Không' },
    ];
    setVocabularyList(fallbackVocab);
    setCurrentWord(fallbackVocab[0]);
    setCurrentWordIndex(0);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Get user level and fetch vocabulary
    if (user?.level) {
      fetchVocabulary(user.level);
    }
    
    setIsLoading(false);
  }, [router, user]);

  // Animate soundwave based on audio input
  const updateSoundwave = () => {
    if (analyzerRef.current && dataArrayRef.current) {
      (analyzerRef.current.getByteFrequencyData as any)(dataArrayRef.current);
      
      // Create 20 bars from the frequency data
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
        // Map 0-255 to 8-64px height
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

  // Simulate voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Setup Web Audio API for visualization
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
        // Start soundwave animation
        updateSoundwave();
      };

      mediaRecorder.onstop = () => {
        setIsRecording(false);
        isRecordingRef.current = false;
        // Cancel animation
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        // Reset soundwave to initial state
        setSoundwaveHeights(Array(20).fill(8));
        
        // Close audio context
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
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

      // Simulate checking pronunciation and showing feedback
      setTimeout(() => {
        const score = Math.floor(Math.random() * 40) + 60; // 60-100%
        setPronunciationScore(score);
        
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
        
        setFeedbackMessage(message);
        setShowFeedback(true);
      }, 1500);
    }
  };

  // Play native audio
  const playNativeAudio = () => {
    // Audio playback - trigger recording simulation
    // In real app, fetch and play actual audio
  };

  // Simulate switching to next phrase
  const nextPhrase = () => {
    if (vocabularyList.length === 0) {
      return; // No vocabulary loaded yet
    }

    let nextIndex = currentWordIndex + 1;
    
    // Loop back to beginning if reached end
    if (nextIndex >= vocabularyList.length) {
      nextIndex = 0;
    }

    setCurrentWordIndex(nextIndex);
    setCurrentWord(vocabularyList[nextIndex]);
    setPronunciationScore(0);
    setShowFeedback(false);
    setFeedbackMessage('');
  };

  return (
    <div className="min-h-screen bg-[#fafaf5] font-['Be_Vietnam_Pro']" suppressHydrationWarning>
      <Header />
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col gap-2 py-6 bg-[#f4f4ef] w-72 h-screen sticky left-0 top-0 text-[#72564c] font-['Plus_Jakarta_Sans'] text-sm font-semibold">
          <div className="px-4 mb-4">
            <Link href="/dashboard" className="flex items-center gap-3 justify-center hover:opacity-70 transition-opacity cursor-pointer">
              <img
                src="https://res.cloudinary.com/dds5jlp7e/image/upload/v1774702475/Screenshot_from_2026-03-28_19-52-57-removebg-preview_xvqdug.png"
                alt="HANGUL Logo"
                className="w-12 h-12 object-contain"
              />
              <div className="text-2xl font-black text-[#72564c] tracking-tighter uppercase font-['Plus_Jakarta_Sans']">
                HANGUL
              </div>
            </Link>
          </div>

          <nav className="flex-grow flex flex-col gap-1 px-4">
            <Link
              href="/quiz"
              className="text-[#72564c] rounded-lg mx-0 py-3 px-4 flex items-center gap-3 hover:bg-[#72564c] hover:text-white transition-all active:scale-95"
            >
              <div className="flex flex-col">
                <span className="font-bold">Quiz</span>
                <span className="text-xs opacity-70 font-normal">Test knowledge</span>
              </div>
            </Link>

            <Link href="/camera" className="text-[#72564c] mx-0 py-3 px-4 rounded-lg flex items-center gap-3 hover:bg-[#72564c] hover:text-white transition-all active:scale-95">
              <div className="flex flex-col">
                <span className="font-bold">Camera to Vocab</span>
                <span className="text-xs opacity-70 font-normal">Visual learning</span>
              </div>
            </Link>

            <Link href="/writing" className="text-[#72564c] mx-0 py-3 px-4 rounded-lg flex items-center gap-3 hover:bg-[#72564c] hover:text-white transition-all active:scale-95">
              <div className="flex flex-col">
                <span className="font-bold">Writing Practice</span>
                <span className="text-xs opacity-70 font-normal">Handwriting</span>
              </div>
            </Link>

            <Link href="/pronunciation" className="text-[#72564c] mx-0 py-3 px-4 rounded-lg flex items-center gap-3 hover:bg-[#72564c] hover:text-white transition-all active:scale-95">
              <div className="flex flex-col">
                <span className="font-bold">Pronunciation</span>
                <span className="text-xs opacity-70 font-normal">Speak & listen</span>
              </div>
            </Link>

            <Link href="/learning-map" className="text-[#72564c] mx-0 py-3 px-4 rounded-lg flex items-center gap-3 hover:bg-[#72564c] hover:text-white transition-all active:scale-95">
              <div className="flex flex-col">
                <span className="font-bold">Learning Path</span>
                <span className="text-xs opacity-70 font-normal">Adjust level</span>
              </div>
            </Link>

            <Link href="/tournament" className="text-[#72564c] mx-0 py-3 px-4 rounded-lg flex items-center gap-3 hover:bg-[#72564c] hover:text-white transition-all active:scale-95">
              <div className="flex flex-col">
                <span className="font-bold">Tournament</span>
                <span className="text-xs opacity-70 font-normal">Compete & rank</span>
              </div>
            </Link>
          </nav>

          <div className="px-4 mt-auto flex flex-col gap-3">
            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="w-full py-3 bg-[#e8e8e3] text-[#72564c] rounded-lg font-bold hover:bg-[#d4c3be] transition-all active:scale-95"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-grow p-8 lg:p-12">
          <section className="flex flex-col gap-6 max-w-6xl mx-auto">
            {/* Header Card */}
            <div className="bg-[#f4f4ef] rounded-lg p-8 relative overflow-hidden flex flex-col items-center text-center">
              
              <div className="mt-8 mb-6">
                <h1 className="text-6xl md:text-7xl font-['Plus_Jakarta_Sans'] font-extrabold text-[#72564c] tracking-tight mb-2">
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
                  <p className="text-2xl font-['Be_Vietnam_Pro'] text-[#8d6e63] font-medium tracking-widest uppercase">
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
                        height: `${height}px`
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
                      border: isRecording ? '2px solid #72564c' : 'none'
                    }}
                    title={isRecording ? 'Stop recording' : 'Start recording'}
                  >
                    <img 
                      src="https://res.cloudinary.com/dds5jlp7e/image/upload/v1774782369/microphone_qebkse.png" 
                      alt="Microphone"
                      className="w-10 h-10 object-contain"
                      style={{
                        filter: isRecording ? 'invert(0.4) sepia(0.5) hue-rotate(-10deg) saturate(0.8)' : 'brightness(0) invert(1)'
                      }}
                    />
                  </button>
                </div>

                {/* Feedback Notification */}
                {showFeedback && (
                  <div className="mt-8 bg-white rounded-lg p-6 shadow-xl border-2 border-[#72564c] w-full max-w-md animate-in fade-in">
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-[#72564c] flex items-center justify-center">
                        <span className="text-3xl font-['Plus_Jakarta_Sans'] font-black text-white">
                          {pronunciationScore}%
                        </span>
                      </div>
                      <div>
                        <p className="text-xs uppercase font-['Plus_Jakarta_Sans'] font-bold text-[#504441] tracking-wider mb-1">
                          Pronunciation Score
                        </p>
                        <p className="text-xl font-['Plus_Jakarta_Sans'] font-bold text-[#72564c]">
                          {feedbackMessage}
                        </p>
                      </div>
                      
                      {/* Vietnamese Translation */}
                      <div className="mt-4 pt-4 border-t border-[#d4c3be] w-full">
                        <p className="text-xs text-[#504441] mb-2">Nghĩa tiếng Việt:</p>
                        <p className="text-lg font-bold text-[#8d6e63]">
                          {currentWord.vietnamese}
                        </p>
                      </div>
                      
                      <button
                        onClick={nextPhrase}
                        className="mt-4 px-8 py-3 bg-[#72564c] text-white rounded-lg font-bold hover:bg-[#8d6e63] transition-all active:scale-95 w-full"
                      >
                        Next Phrase
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
            </div>

            {/* Interaction Canvas (Bento Style) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            </div>
          </section>
        </main>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg flex justify-around items-center py-4 px-6 border-t border-[#d4c3be]/10 z-50">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-[#72564c]/60">
          <span className="text-2xl">🏠</span>
          <span className="text-[10px] font-bold uppercase">Home</span>
        </Link>
        <button className="flex flex-col items-center gap-1 text-[#72564c]">
          <span className="text-2xl">🎤</span>
          <span className="text-[10px] font-bold uppercase">Practice</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#72564c]/60">
          <span className="text-2xl">📊</span>
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
