'use client';

import { pronunciationService, userService } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface WordData {
  korean: string;
  romanization: string;
  english: string;
  vietnamese: string;
  id?: number;
  topic?: string;
}

const DEFAULT_WORD: WordData = {
  korean: '안녕하세요',
  romanization: 'An-nyeong-ha-se-yo',
  english: 'Hello / Good day',
  vietnamese: 'Xin chào',
};

const FALLBACK_VOCABULARY: WordData[] = [
  { korean: '안녕하세요', romanization: 'An-nyeong-ha-se-yo', english: 'Hello', vietnamese: 'Xin chào' },
  { korean: '감사합니다', romanization: 'Gam-sa-ham-ni-da', english: 'Thank you', vietnamese: 'Cảm ơn' },
  { korean: '죄송합니다', romanization: 'Jwoe-song-ham-ni-da', english: 'Sorry', vietnamese: 'Xin lỗi' },
  { korean: '네', romanization: 'Ne', english: 'Yes', vietnamese: 'Vâng' },
  { korean: '아니요', romanization: 'A-ni-yo', english: 'No', vietnamese: 'Không' },
];

const INITIAL_SOUNDWAVE = Array(20).fill(8);
const XP_PER_WORD = 20;
type SpeechSpeed = 'slow' | 'normal' | 'fast';

const SPEECH_SPEED_CONFIG: Record<
  SpeechSpeed,
  { label: string; rate: number }
> = {
  slow: { label: 'Chậm', rate: 0.5,  },
  normal: { label: '1.0x', rate: 1.0,  },
  fast: { label: 'Nhanh', rate: 1.5, },
};


const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Không thể đọc dữ liệu audio.'));
    reader.readAsDataURL(blob);
  });

const getMediaRecorderOptions = (): MediaRecorderOptions | undefined => {
  if (typeof MediaRecorder === 'undefined') {
    return undefined;
  }

  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  const mimeType = candidates.find((item) => MediaRecorder.isTypeSupported(item));

  return mimeType ? { mimeType } : undefined;
};

export default function PronunciationPage() {
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();

  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pronunciationScore, setPronunciationScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [transcribedText, setTranscribedText] = useState('');
  const [soundwaveHeights, setSoundwaveHeights] = useState<number[]>(INITIAL_SOUNDWAVE);
  const [vocabularyList, setVocabularyList] = useState<WordData[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState<WordData>(DEFAULT_WORD);
  const [isLoading, setIsLoading] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const nativeAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);
  const rewardedWordsRef = useRef<Set<string>>(new Set());

  const rewardCurrentWordXP = async (word: WordData) => {
    const rewardKey = String(word.id ?? word.korean);

    if (!user || rewardedWordsRef.current.has(rewardKey)) {
      return false;
    }

    const response = await userService.addXP(XP_PER_WORD);
    rewardedWordsRef.current.add(rewardKey);

    if (response?.user) {
      const nextUser = {
        ...user,
        totalXP: response.user.totalXP,
        level: response.user.level ?? user.level,
      };

      setUser(nextUser);
      localStorage.setItem('user', JSON.stringify(nextUser));
    }

    return true;
  };
  const [speechSpeed, setSpeechSpeed] = useState<SpeechSpeed>('normal');

  const cycleSpeechSpeed = () => {
    setSpeechSpeed((current) => {
      if (current === 'slow') return 'normal';
      if (current === 'normal') return 'fast';
      return 'slow';
    });
  };


  const applyFallbackVocabulary = () => {
    setVocabularyList(FALLBACK_VOCABULARY);
    setCurrentWord(FALLBACK_VOCABULARY[0]);
    setCurrentWordIndex(0);
  };

  const resetFeedback = () => {
    setPronunciationScore(0);
    setFeedbackMessage('');
    setTranscribedText('');
    setShowFeedback(false);
  };

  const cleanupAudioCapture = async () => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
      }
      audioContextRef.current = null;
    }

    analyzerRef.current = null;
    dataArrayRef.current = null;
    setSoundwaveHeights(INITIAL_SOUNDWAVE);
  };

  const fetchVocabulary = async (level: string) => {
    try {
      const response = await fetch(`/api/pronunciation/vocabulary/${level.toUpperCase()}?limit=20`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Không tải được danh sách từ vựng (${response.status}).`);
      }

      const data = await response.json();

      if (Array.isArray(data?.vocabulary) && data.vocabulary.length > 0) {
        const formattedVocab: WordData[] = data.vocabulary.map((item: any) => ({
          id: item.id,
          korean: item.korean,
          english: item.english,
          vietnamese: item.vietnamese,
          romanization: item.romanization || item.korean,
          topic: item.topic,
        }));

        setVocabularyList(formattedVocab);
        setCurrentWord(formattedVocab[0]);
        setCurrentWordIndex(0);
        return;
      }

      applyFallbackVocabulary();
    } catch {
      applyFallbackVocabulary();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    const level = String(user?.level || 'NEWBIE').toUpperCase();

    void fetchVocabulary(level).finally(() => {
      setIsLoading(false);
    });
  }, [router, user?.level]);

  useEffect(() => {
    return () => {
      void cleanupAudioCapture();
      if (nativeAudioRef.current) {
        nativeAudioRef.current.pause();
        nativeAudioRef.current = null;
      }
    };
  }, []);

  const updateSoundwave = () => {
    if (analyzerRef.current && dataArrayRef.current) {
      analyzerRef.current.getByteFrequencyData(dataArrayRef.current as any);

      const nextHeights: number[] = [];
      const barWidth = dataArrayRef.current.length / 20;

      for (let i = 0; i < 20; i += 1) {
        const start = Math.floor(i * barWidth);
        const end = Math.max(start + 1, Math.floor((i + 1) * barWidth));
        let sum = 0;

        for (let j = start; j < end; j += 1) {
          sum += dataArrayRef.current[j];
        }

        const average = sum / (end - start);
        nextHeights.push(Math.max(8, (average / 255) * 64));
      }

      setSoundwaveHeights(nextHeights);
    }

    if (isRecordingRef.current) {
      animationRef.current = requestAnimationFrame(updateSoundwave);
    }
  };

  const startRecording = async () => {
    if (isSubmitting) {
      return;
    }

    try {
      if (typeof MediaRecorder === 'undefined') {
        throw new Error('Trình duyệt hiện tại không hỗ trợ ghi âm.');
      }

      resetFeedback();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      analyzerRef.current = analyzer;
      source.connect(analyzer);
      dataArrayRef.current = new Uint8Array(analyzer.frequencyBinCount);

      const recorderOptions = getMediaRecorderOptions();
      const mediaRecorder = recorderOptions
        ? new MediaRecorder(stream, recorderOptions)
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        setIsRecording(true);
        isRecordingRef.current = true;
        animationRef.current = requestAnimationFrame(updateSoundwave);
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        isRecordingRef.current = false;

        try {
          setIsSubmitting(true);
          await cleanupAudioCapture();

          const audioBlob = new Blob(audioChunksRef.current, {
            type: mediaRecorder.mimeType || 'audio/webm',
          });

          const audioDataUrl = await blobToDataUrl(audioBlob);
          const result = await pronunciationService.transcribe(audioDataUrl, currentWord.korean);

          const score = Number(result.score ?? 0);
          const baseFeedback = result.feedback_vi || 'Chưa có phản hồi từ hệ thống.';

          setPronunciationScore(score);
          setTranscribedText(String(result.transcribed_text || ''));

          let finalFeedback = baseFeedback;

          try {
            const rewarded = await rewardCurrentWordXP(currentWord);
            if (rewarded) {
              finalFeedback = `${baseFeedback} (+${XP_PER_WORD} XP)`;
            }
          } catch (xpError) {
            console.error('Không thể cộng XP sau lượt phát âm:', xpError);
          }

          setFeedbackMessage(finalFeedback);
        } catch (error: any) {
          setPronunciationScore(0);
          setFeedbackMessage(error.message || 'Không thể chấm phát âm lúc này.');
          setTranscribedText('');
        } finally {
          setIsSubmitting(false);
          setShowFeedback(true);
        }
      };

      mediaRecorder.start();
    } catch (error: any) {
      setPronunciationScore(0);
      setFeedbackMessage(error.message || 'Không thể truy cập microphone.');
      setTranscribedText('');
      setShowFeedback(true);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state === 'inactive') {
      return;
    }

    recorder.stop();
  };

  const playNativeAudio = async () => {
  if (isPlayingAudio) {
    return;
  }

  try {
    setIsPlayingAudio(true);

    const result = await pronunciationService.tts(currentWord.korean);
    const player = nativeAudioRef.current ?? new Audio();
    nativeAudioRef.current = player;

    player.pause();
    player.currentTime = 0;
    player.src = result.audio;

    const currentRate = SPEECH_SPEED_CONFIG[speechSpeed].rate;
    player.playbackRate = currentRate;
    player.defaultPlaybackRate = currentRate;

    const pitchAudio = player as HTMLAudioElement & {
      preservesPitch?: boolean;
      mozPreservesPitch?: boolean;
      webkitPreservesPitch?: boolean;
    };
    pitchAudio.preservesPitch = true;
    pitchAudio.mozPreservesPitch = true;
    pitchAudio.webkitPreservesPitch = true;

    player.onended = () => setIsPlayingAudio(false);
    player.onerror = () => setIsPlayingAudio(false);

    await player.play();
  } catch (error: any) {
    setPronunciationScore(0);
    setFeedbackMessage(error.message || 'Không thể phát audio mẫu.');
    setShowFeedback(true);
    setIsPlayingAudio(false);
  }
};
  useEffect(() => {
  if (nativeAudioRef.current) {
    const currentRate = SPEECH_SPEED_CONFIG[speechSpeed].rate;
    nativeAudioRef.current.playbackRate = currentRate;
    nativeAudioRef.current.defaultPlaybackRate = currentRate;
  }
}, [speechSpeed]);


  const nextPhrase = () => {
    if (!vocabularyList.length) {
      return;
    }

    const nextIndex = (currentWordIndex + 1) % vocabularyList.length;
    setCurrentWordIndex(nextIndex);
    setCurrentWord(vocabularyList[nextIndex]);
    resetFeedback();
  };

  if (isLoading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#fafaf5] font-['Be_Vietnam_Pro']" suppressHydrationWarning>
      <div className="flex">

        <main className="flex-grow p-8 lg:p-12">
          <section className="flex flex-col gap-6 max-w-6xl mx-auto">
            <div className="bg-[#f4f4ef] rounded-lg p-8 relative overflow-hidden flex flex-col items-center text-center">
              <div className="mt-8 mb-6">
                <h1 className="text-6xl md:text-7xl font-['Plus_Jakarta_Sans'] font-extrabold text-[#72564c] tracking-tight mb-2">
                  {currentWord.korean}
                </h1>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={playNativeAudio}
                    disabled={isPlayingAudio || isSubmitting}
                    className="hover:opacity-70 disabled:opacity-40 transition-all active:scale-95 flex items-center justify-center"
                    title="Listen pronunciation"
                  >
                    <img
                      src="https://res.cloudinary.com/dds5jlp7e/image/upload/v1774781688/volume_rv7osj.png"
                      alt="Volume"
                      className="w-8 h-8 object-contain"
                    />
                  </button>

                  <button
                    onClick={cycleSpeechSpeed}
                    disabled={isSubmitting}
                    className="min-w-[74px] h-10 px-3 rounded-full border border-[#d4c3be] bg-white text-[#72564c] hover:bg-[#f8f5f2] disabled:opacity-40 transition-all active:scale-95 flex items-center justify-center gap-2"
                    title={`Tốc độ hiện tại: ${SPEECH_SPEED_CONFIG[speechSpeed].label} (${SPEECH_SPEED_CONFIG[speechSpeed].rate}x)`}
                  >
                    
                    <span className="text-xs font-bold">
                      {SPEECH_SPEED_CONFIG[speechSpeed].rate}x
                    </span>
                  </button>

                  <p className="text-2xl font-['Be_Vietnam_Pro'] text-[#8d6e63] font-medium tracking-widest uppercase">
                    {currentWord.romanization}
                  </p>
                </div>


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
                      style={{ height: `${height}px` }}
                    />
                  ))}
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isSubmitting}
                    className="mt-8 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
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

                {isSubmitting && (
                  <p className="mt-4 text-sm font-semibold text-[#8d6e63]">
                    Đang gửi audio và chấm phát âm...
                  </p>
                )}

                {showFeedback && (
                  <div className="mt-8 bg-white rounded-lg p-6 shadow-xl border-2 border-[#72564c] w-full max-w-md animate-in fade-in">
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-[#72564c] flex items-center justify-center">
                        <span className="text-2xl font-['Plus_Jakarta_Sans'] font-black text-white">
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

                      {transcribedText && (
                        <div className="mt-2 pt-4 border-t border-[#d4c3be] w-full">
                          <p className="text-xs text-[#504441] mb-2 uppercase tracking-wider">AI heard</p>
                          <p className="text-lg font-bold text-[#72564c]">{transcribedText}</p>
                        </div>
                      )}

                      <div className="mt-2 pt-4 border-t border-[#d4c3be] w-full">
                        <p className="text-xs text-[#504441] mb-2">Nghĩa tiếng Việt:</p>
                        <p className="text-lg font-bold text-[#8d6e63]">{currentWord.vietnamese}</p>
                      </div>

                      <div className="flex gap-4 w-full mt-4">
                        <button
                          onClick={resetFeedback}
                          className="flex-1 px-4 py-3 bg-[#e8e8e3] text-[#72564c] rounded-lg font-bold hover:bg-[#d4c3be] transition-all active:scale-95"
                        >
                          Thử lại
                        </button>
                        <button
                          onClick={nextPhrase}
                          className="flex-1 px-4 py-3 bg-[#72564c] text-white rounded-lg font-bold hover:bg-[#8d6e63] transition-all active:scale-95"
                        >
                          Tiếp theo
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch" />
          </section>
        </main>
      </div>

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
