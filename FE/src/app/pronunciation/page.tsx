'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  BookMarked,
  BookOpen,
  Languages,
  Map,
  Mic2,
  Sparkles,
  Trophy,
  Volume2,
} from 'lucide-react';
import {
  HangulCard,
  HangulPageFrame,
  HangulSidebar,
  MascotPortrait,
  Pill,
  StatusChip,
} from '@/components/hangul/ui';
import { useAuthStore } from '@/store/authStore';

interface VocabularyWord {
  id: string;
  korean: string;
  english: string;
  romanization: string;
}

interface PronunciationIssue {
  unit: string;
  error_type: string;
  score: number;
  advice_vi: string;
}

interface PronunciationAnalysis {
  overall: number;
  accuracy: number;
  fluency: number;
  prosody: number;
  transcript: string;
  source: 'backend' | 'browser';
  note: string;
  details: string[];
}

interface PronunciationBackendResponse {
  success: boolean;
  transcribed_text?: string;
  target_text?: string;
  score?: number;
  metrics?: {
    overall: number;
    accuracy: number;
    fluency: number;
    prosody: number;
  };
  issues?: PronunciationIssue[];
  feedback_vi?: string;
  assessment_mode?: string;
}

interface BrowserSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const RECOGNITION_WAIT_MS = 1400;

const practiceSidebar = [
  { key: 'course' as const, label: 'Current Course', href: '/dashboard', icon: BookOpen },
  { key: 'path' as const, label: 'Speaking Practice', href: '/pronunciation', icon: Mic2, active: true },
  { key: 'vocabulary' as const, label: 'Learning Path', href: '/learning-map', icon: Map },
  { key: 'achievements' as const, label: 'Vocabulary', href: '/camera', icon: BookMarked },
  { key: 'friends' as const, label: 'Achievements', href: '/profile', icon: Trophy },
];

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{Letter}\p{Number}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const splitSyllables = (value: string) =>
  normalizeText(value)
    .replace(/\s+/g, '')
    .split('')
    .filter(Boolean);

const levenshtein = (left: string, right: string) => {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const rows = Array.from({ length: left.length + 1 }, (_, index) => [index]);
  rows[0] = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + cost
      );
    }
  }

  return rows[left.length][right.length];
};

const similarityPercent = (recognized: string, target: string) => {
  const cleanRecognized = normalizeText(recognized);
  const cleanTarget = normalizeText(target);

  if (!cleanRecognized || !cleanTarget) return 0;

  const distance = levenshtein(cleanRecognized, cleanTarget);
  const maxLength = Math.max(cleanRecognized.length, cleanTarget.length);

  return clampScore(((maxLength - distance) / maxLength) * 100);
};

const detectPronunciationIssues = (recognized: string, target: string) => {
  const recognizedSyllables = splitSyllables(recognized);
  const targetSyllables = splitSyllables(target);
  const details: string[] = [];

  if (!recognizedSyllables.length) {
    return ['Hệ thống chưa nghe rõ phần bạn đọc. Hãy nói chậm hơn và đứng gần micro hơn.'];
  }

  if (recognizedSyllables.length < targetSyllables.length) {
    details.push(`Bạn đang đọc thiếu phần "${targetSyllables.slice(recognizedSyllables.length).join('')}".`);
  }

  if (recognizedSyllables.length > targetSyllables.length) {
    details.push(`Bạn đang đọc dư phần "${recognizedSyllables.slice(targetSyllables.length).join('')}".`);
  }

  const mismatchIndex = targetSyllables.findIndex(
    (syllable, index) => recognizedSyllables[index] !== syllable
  );

  if (mismatchIndex >= 0 && mismatchIndex < recognizedSyllables.length) {
    details.push(
      `Âm tiết ${mismatchIndex + 1} nên là "${targetSyllables[mismatchIndex]}", nhưng hệ thống nghe gần giống "${recognizedSyllables[mismatchIndex]}".`
    );
  }

  const lastTarget = targetSyllables[targetSyllables.length - 1];
  const lastRecognized = recognizedSyllables[targetSyllables.length - 1];
  if (lastTarget && lastRecognized && lastTarget !== lastRecognized) {
    details.push(`Âm cuối "${lastTarget}" chưa rõ. Hãy nhấn rõ phần kết thúc hơn.`);
  }

  return details.slice(0, 4);
};

const createBrowserFallbackAnalysis = (transcript: string, target: VocabularyWord): PronunciationAnalysis => {
  const accuracy = similarityPercent(transcript, target.korean);
  const fluency = clampScore(accuracy - 6);
  const prosody = clampScore(accuracy - 12);
  const overall = clampScore((accuracy * 0.55) + (fluency * 0.25) + (prosody * 0.2));
  const details = detectPronunciationIssues(transcript, target.korean);

  return {
    overall,
    accuracy,
    fluency,
    prosody,
    transcript,
    source: 'browser',
    note: details[0] || 'Đây là chấm điểm dự phòng từ trình duyệt, độ chính xác chỉ ở mức tương đối.',
    details,
  };
};

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the recorded audio.'));
    reader.readAsDataURL(blob);
  });

const scoreVoice = (voice: SpeechSynthesisVoice) => {
  let total = 0;
  if (voice.lang.toLowerCase().startsWith('ko')) total += 40;
  if (/google/i.test(voice.name)) total += 20;
  if (/neural|premium/i.test(voice.name)) total += 10;
  if (voice.default) total += 4;
  return total;
};

const pickKoreanVoice = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  const koreanVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith('ko'));
  if (koreanVoices.length === 0) return null;
  return koreanVoices.sort((left, right) => scoreVoice(right) - scoreVoice(left))[0];
};

async function waitForVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (window.speechSynthesis.getVoices().length > 0) return;

  await new Promise<void>((resolve) => {
    const handleVoicesChanged = () => {
      window.clearTimeout(timeoutId);
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      resolve();
    };

    const timeoutId = window.setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      resolve();
    }, 800);

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
  });
}

export default function PronunciationPage() {
  const { token, user } = useAuthStore();
  const router = useRouter();

  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [transcribed, setTranscribed] = useState('');
  const [message, setMessage] = useState('');
  const [currentWord, setCurrentWord] = useState<VocabularyWord | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [analysis, setAnalysis] = useState<PronunciationAnalysis | null>(null);
  const [supportsBrowserScoring, setSupportsBrowserScoring] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const recognitionWaitResolverRef = useRef<(() => void) | null>(null);
  const browserTranscriptRef = useRef('');

  const resolveRecognitionWait = () => {
    if (recognitionWaitResolverRef.current) {
      recognitionWaitResolverRef.current();
      recognitionWaitResolverRef.current = null;
    }
  };

  const waitForSpeechRecognitionResult = async () => {
    if (!supportsBrowserScoring || !speechRecognitionRef.current) return;

    await new Promise<void>((resolve) => {
      const finish = () => {
        if (recognitionWaitResolverRef.current === finish) {
          recognitionWaitResolverRef.current = null;
        }
        resolve();
      };

      recognitionWaitResolverRef.current = finish;
      window.setTimeout(finish, RECOGNITION_WAIT_MS);
    });
  };

  const createSpeechRecognition = () => {
    if (typeof window === 'undefined') return null;

    const RecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!RecognitionConstructor) return null;

    const recognition = new RecognitionConstructor();
    recognition.lang = 'ko-KR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results || [])
        .map((result: any) => result?.[0]?.transcript || '')
        .filter(Boolean)
        .join(' ')
        .trim();

      if (transcript) {
        browserTranscriptRef.current = transcript;
        setTranscribed(transcript);
      }

      resolveRecognitionWait();
    };

    recognition.onerror = () => {
      resolveRecognitionWait();
    };

    recognition.onend = () => {
      resolveRecognitionWait();
    };

    return recognition;
  };

  const fetchVocabulary = async (level: string) => {
    try {
      setMessage('Đang tải danh sách từ...');
      const response = await fetch(`${API_BASE_URL}/pronunciation/vocabulary/${level}?limit=20`);
      if (!response.ok) throw new Error('Failed to fetch vocabulary');

      const data = await response.json();
      if (!data.success || !Array.isArray(data.vocabulary)) {
        throw new Error('Invalid vocabulary payload');
      }

      setVocabulary(data.vocabulary);
      setCurrentWord(data.vocabulary[Math.floor(Math.random() * data.vocabulary.length)]);
      setMessage('');
    } catch {
      const fallbackWords: VocabularyWord[] = [
        { id: '1', korean: '안녕하세요', english: 'Hello / Good day', romanization: 'an-nyeong-ha-se-yo' },
        { id: '2', korean: '감사합니다', english: 'Thank you', romanization: 'gam-sa-ham-ni-da' },
        { id: '3', korean: '죄송합니다', english: 'Sorry', romanization: 'joe-song-ham-ni-da' },
      ];
      setVocabulary(fallbackWords);
      setCurrentWord(fallbackWords[0]);
      setMessage('Đang dùng bộ từ mẫu offline.');
    }
  };

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    fetchVocabulary(user?.level || 'NEWBIE');
  }, [router, token, user?.level]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setSupportsBrowserScoring(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));

    return () => {
      try {
        speechRecognitionRef.current?.abort();
      } catch {}

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const applyBackendAnalysis = (payload: PronunciationBackendResponse) => {
    const metrics = payload.metrics;
    if (!metrics) return;

    const details = Array.isArray(payload.issues) ? payload.issues.map((item) => item.advice_vi) : [];

    const result: PronunciationAnalysis = {
      overall: metrics.overall,
      accuracy: metrics.accuracy,
      fluency: metrics.fluency,
      prosody: metrics.prosody,
      transcript: payload.transcribed_text || '',
      source: 'backend',
      note: payload.feedback_vi || 'Đã chấm điểm bằng Whisper + Gemini.',
      details,
    };

    setAnalysis(result);
    setTranscribed(result.transcript);
    setScore(result.overall);
    setMessage(result.note);
  };

  const startRecording = async () => {
    try {
      if (loading || isRecording) return;

      setAnalysis(null);
      setScore(null);
      setTranscribed('');
      setMessage('Đang nghe phần phát âm của bạn...');
      browserTranscriptRef.current = '';

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        setIsRecording(true);
      };

      if (supportsBrowserScoring) {
        try {
          speechRecognitionRef.current?.abort();
        } catch {}

        speechRecognitionRef.current = createSpeechRecognition();

        try {
          speechRecognitionRef.current?.start();
        } catch {}
      }

      mediaRecorder.start();
    } catch {
      setIsRecording(false);
      setLoading(false);
      setMessage('Không thể truy cập microphone. Hãy cấp quyền micro rồi thử lại.');
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || !currentWord || loading) return;

    const recorder = mediaRecorderRef.current;
    if (recorder.state === 'inactive') return;

    const targetWord = currentWord;

    setIsRecording(false);
    setLoading(true);

    recorder.onstop = async () => {
      try {
        await waitForSpeechRecognitionResult();
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });

        try {
          const base64Audio = await blobToDataUrl(audioBlob);
          const response = await fetch(`${API_BASE_URL}/pronunciation/transcribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio: base64Audio,
              target: targetWord.korean,
            }),
          });

          const payload: PronunciationBackendResponse = await response.json();

          if (!response.ok || !payload.success) {
            throw new Error(payload?.feedback_vi || payload?.target_text || 'Pronunciation API failed');
          }

          if (payload.metrics && payload.feedback_vi) {
            applyBackendAnalysis(payload);
          } else if (browserTranscriptRef.current) {
            const browserAnalysis = createBrowserFallbackAnalysis(browserTranscriptRef.current, targetWord);
            setAnalysis(browserAnalysis);
            setTranscribed(browserAnalysis.transcript);
            setScore(browserAnalysis.overall);
            setMessage(browserAnalysis.note);
          } else {
            setMessage('Không nhận được dữ liệu chấm điểm từ backend.');
          }
        } catch {
          if (browserTranscriptRef.current) {
            const browserAnalysis = createBrowserFallbackAnalysis(browserTranscriptRef.current, targetWord);
            setAnalysis(browserAnalysis);
            setTranscribed(browserAnalysis.transcript);
            setScore(browserAnalysis.overall);
            setMessage('Đang dùng chế độ chấm dự phòng của trình duyệt.');
          } else {
            setMessage('Không phân tích được giọng nói. Nên dùng Chrome hoặc Edge để có speech recognition.');
          }
        }
      } catch {
        setMessage('Xử lý audio thất bại.');
      } finally {
        setLoading(false);
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];

        try {
          speechRecognitionRef.current?.abort();
        } catch {}

        speechRecognitionRef.current = null;
      }
    };

    try {
      speechRecognitionRef.current?.stop();
    } catch {}

    recorder.stop();
    recorder.stream.getTracks().forEach((track) => track.stop());
  };

  const playPronunciation = async () => {
    if (!currentWord) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    try {
      setIsPlaying(true);

      const response = await fetch(`${API_BASE_URL}/pronunciation/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentWord.korean }),
      });

      if (!response.ok) throw new Error(`API error ${response.status}`);
      const payload = await response.json();

      if (!audioRef.current) throw new Error('Audio element is not available.');

      audioRef.current.src = payload.audio;
      audioRef.current.onended = () => setIsPlaying(false);
      setMessage('Đang phát audio mẫu...');
      await audioRef.current.play();
    } catch {
      try {
        await waitForVoices();
        const browserVoice = pickKoreanVoice();

        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
          throw new Error('Speech synthesis is not supported.');
        }

        setMessage(
          browserVoice
            ? `Đang phát audio mẫu bằng ${browserVoice.name}.`
            : 'Đang phát audio mẫu bằng giọng ko-KR của trình duyệt.'
        );

        await new Promise<void>((resolve, reject) => {
          const utterance = new SpeechSynthesisUtterance(currentWord.korean);
          utterance.lang = 'ko-KR';
          utterance.rate = 0.92;
          utterance.pitch = 1.02;
          utterance.volume = 1;

          if (browserVoice) {
            utterance.voice = browserVoice;
          }

          utterance.onend = () => resolve();
          utterance.onerror = () => reject(new Error('Speech synthesis failed.'));
          window.speechSynthesis.speak(utterance);
        });
      } catch {
        setMessage('Native audio hiện chưa khả dụng.');
      } finally {
        setIsPlaying(false);
      }
    }
  };

  const nextWord = () => {
    if (vocabulary.length === 0) return;

    const next = vocabulary[Math.floor(Math.random() * vocabulary.length)];
    setCurrentWord(next);
    setScore(null);
    setTranscribed('');
    setMessage('');
    setAnalysis(null);
    browserTranscriptRef.current = '';
  };

  if (!currentWord) return null;

  const waveform = [32, 58, 76, 40, 22, 68, 84, 54];

  const scoreLabel =
    score === null
      ? 'Chờ bạn luyện nói'
      : score >= 80
        ? 'Phát âm khá tốt'
        : score >= 50
          ? 'Khá ổn, cần luyện thêm'
          : 'Cần luyện thêm';

  const scoringSourceLabel =
    analysis?.source === 'backend'
      ? 'Whisper + Gemini'
      : analysis?.source === 'browser'
        ? 'Trình duyệt dự phòng'
        : supportsBrowserScoring
          ? 'Sẵn sàng chấm'
          : 'Chờ backend';

  return (
    <HangulPageFrame
      activeNav="Practice"
      sidebar={
        <HangulSidebar
          items={practiceSidebar}
          profile={{
            title: 'Level 2: Explorer',
            subtitle: 'Next: Advanced Hangul',
            emoji: '🦦',
            tone: 'peach',
          }}
        />
      }
    >
      <div className="space-y-6">
        <HangulCard className="p-7 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link className="text-2xl font-semibold text-[var(--hangul-soft-ink)]" href="/dashboard">
              ← Exit Practice
            </Link>
            <Pill className="bg-[#f5eee5] text-[var(--hangul-soft-ink)]">Speaking Practice</Pill>
          </div>

          <div className="mt-10 text-center">
            <p className="text-[clamp(4rem,9vw,6.6rem)] font-black tracking-[-0.06em] text-[var(--hangul-accent)]">
              {currentWord.korean}
            </p>
            <p className="mt-4 text-[2.1rem] uppercase tracking-[0.28em] text-[var(--hangul-soft-ink)]">
              {currentWord.romanization}
            </p>
            <div className="mt-8 flex justify-center">
              <Pill className="bg-white px-6 py-3 text-xl text-[var(--hangul-ink)]">
                <Languages className="h-5 w-5" />
                “{currentWord.english}”
              </Pill>
            </div>
          </div>
        </HangulCard>

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.46fr]">
          <HangulCard className="p-7 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <SectionTitle title="Điểm phát âm" subtitle={scoreLabel} />
              <div className="space-y-3 text-right">
                <Pill className="bg-white text-[var(--hangul-soft-ink)]">
                  {score === null ? 'Ready' : `${score}% tổng`}
                </Pill>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--hangul-soft-ink)]">
                  {scoringSourceLabel}
                </p>
              </div>
            </div>

            <div className="mt-10 flex flex-col items-center gap-8">
              <MascotPortrait emoji="🎧" tone="sky" className="h-80 w-[320px]" />

              <div className="flex items-end gap-3">
                {waveform.map((height, index) => (
                  <span
                    key={`${height}-${index}`}
                    className="w-3 rounded-full bg-[linear-gradient(180deg,#2d6764,#a57b6e)]"
                    style={{ height }}
                  />
                ))}
              </div>

              <p className="text-center text-xl italic text-[var(--hangul-soft-ink)]">
                {message || 'Bấm micro, đọc từ phía trên, rồi bấm lại để chấm điểm.'}
              </p>

              {transcribed ? (
                <p className="text-lg font-semibold text-[var(--hangul-ink)]">Nhận diện: {transcribed}</p>
              ) : null}

              {analysis?.details?.length ? (
                <div className="w-full rounded-[28px] bg-[#fbf8f2] p-5 text-left shadow-[inset_0_0_0_1px_rgba(121,95,78,0.05)]">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--hangul-soft-ink)]">
                    Nhận xét chi tiết
                  </p>
                  <div className="mt-3 space-y-2">
                    {analysis.details.map((item, index) => (
                      <p key={`${item}-${index}`} className="text-base leading-7 text-[var(--hangul-ink)]">
                        • {item}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid w-full gap-4 md:grid-cols-4">
                <ScoreCard icon={BarChart3} label="Độ chính xác" value={analysis ? `${analysis.accuracy}%` : '--'} />
                <ScoreCard icon={Sparkles} label="Độ trôi chảy" value={analysis ? `${analysis.fluency}%` : '--'} />
                <ScoreCard icon={Sparkles} label="Ngữ điệu" value={analysis ? `${analysis.prosody}%` : '--'} />
                <ScoreCard label="Nguồn" value={analysis ? (analysis.source === 'backend' ? 'AI' : 'Browser') : 'Chờ'} />
              </div>
            </div>
          </HangulCard>

          <div className="space-y-6">
            <HangulCard className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center" tone="cocoa">
              <button
                className="grid h-36 w-36 place-items-center rounded-full bg-white text-[var(--hangul-accent)] shadow-[0_24px_48px_rgba(53,30,24,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
                onClick={isRecording ? stopRecording : startRecording}
                type="button"
              >
                <Mic2 className="h-16 w-16" />
              </button>

              <p className="mt-10 text-4xl font-black tracking-[-0.04em] text-white">
                {loading ? 'Đang chấm...' : isRecording ? 'Dừng ghi âm' : 'Nhấn để nói'}
              </p>

              <p className="mt-4 text-xl leading-9 text-white/76">
                {supportsBrowserScoring
                  ? 'Whisper + Gemini là luồng chính. Trình duyệt sẽ hỗ trợ dự phòng nếu backend lỗi.'
                  : 'Whisper + Gemini là luồng chính cho phần chấm điểm.'}
              </p>
            </HangulCard>

            <HangulCard className="flex items-center justify-between gap-4 p-6">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-[#ffdccc] text-[var(--hangul-accent)]">
                  <Volume2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--hangul-soft-ink)]">Listen</p>
                  <p className="text-2xl font-black tracking-[-0.03em] text-[var(--hangul-ink)]">Native Audio</p>
                </div>
              </div>

              <button
                className="grid h-16 w-16 place-items-center rounded-full bg-white shadow-[0_16px_32px_rgba(121,95,78,0.12)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPlaying}
                onClick={playPronunciation}
                type="button"
              >
                <Volume2 className="h-6 w-6 text-[var(--hangul-accent)]" />
              </button>
            </HangulCard>
          </div>
        </div>

        <HangulCard className="flex flex-wrap items-center justify-between gap-6 px-7 py-6">
          <div className="flex flex-wrap gap-3">
            <StatusChip label="12:45 tổng luyện tập" tone="mint" />
            <StatusChip label="4 ngày streak" tone="gold" />
          </div>

          <div className="flex flex-wrap gap-4">
            <button className="hangul-button-secondary" onClick={playPronunciation} type="button">
              Nghe lại
            </button>
            <button className="hangul-button-primary" onClick={nextWord} type="button">
              Từ tiếp theo
            </button>
          </div>
        </HangulCard>

        <audio ref={audioRef} hidden />
      </div>
    </HangulPageFrame>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--hangul-soft-ink)]">{title}</p>
      <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-[var(--hangul-ink)]">{subtitle}</p>
    </div>
  );
}

function ScoreCard({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof BarChart3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[28px] bg-[#fbf8f2] p-5 shadow-[inset_0_0_0_1px_rgba(121,95,78,0.05)]">
      <div className="flex items-center gap-3 text-[var(--hangul-soft-ink)]">
        {Icon ? <Icon className="h-5 w-5" /> : null}
        <p className="text-sm font-semibold uppercase tracking-[0.14em]">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-black tracking-[-0.04em] text-[var(--hangul-ink)]">{value}</p>
    </div>
  );
}
