'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, CameraOff, RotateCw, ScanSearch, Volume2, Zap } from 'lucide-react';
import {
  HangulCard,
  HangulPageFrame,
  HangulSidebar,
  MascotPortrait,
  Pill,
  ProgressBar,
  StatusChip,
  getLevelMeta,
  getSidebarItems,
} from '@/components/hangul/ui';
import { useAuthStore } from '@/store/authStore';

interface Detection {
  id: number;
  label: string;
  confidence: number;
  bbox: number[];
  age: number;
}

const YOLO_SERVER = 'http://localhost:5002';

export default function CameraPage() {
  const { token, user } = useAuthStore();
  const router = useRouter();
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [frameCount, setFrameCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [historyCount, setHistoryCount] = useState(12);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const checkServerHealth = async () => {
      try {
        const response = await fetch(`${YOLO_SERVER}/api/yolo/health`);
        const data = await response.json();
        setServerStatus('connected');
        setFrameCount(data.frame_count ?? 0);
      } catch (requestError) {
        console.error(requestError);
        setServerStatus('disconnected');
      }
    };

    checkServerHealth();
    const intervalId = window.setInterval(checkServerHealth, 5000);
    return () => window.clearInterval(intervalId);
  }, [router, token]);

  useEffect(() => {
    if (!isStreamActive) {
      return undefined;
    }

    const fetchDetections = async () => {
      try {
        const response = await fetch(`${YOLO_SERVER}/api/yolo/detections`);
        const payload = await response.json();
        setDetections(payload.detections || []);
        setFrameCount(payload.frame_count || 0);
      } catch (requestError) {
        console.error(requestError);
      }
    };

    fetchDetections();
    const intervalId = window.setInterval(fetchDetections, 600);
    return () => window.clearInterval(intervalId);
  }, [isStreamActive]);

  const startDetection = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${YOLO_SERVER}/api/yolo/start`, { method: 'POST' });
      if (!response.ok) {
        throw new Error('Unable to start detection');
      }
      setIsStreamActive(true);
    } catch (requestError) {
      const safeError = requestError as Error;
      setError(safeError.message);
    } finally {
      setLoading(false);
    }
  };

  const stopDetection = async () => {
    try {
      await fetch(`${YOLO_SERVER}/api/yolo/stop`, { method: 'POST' });
      setIsStreamActive(false);
      setDetections([]);
    } catch (requestError) {
      console.error(requestError);
    }
  };

  const toggleRecording = async () => {
    try {
      await fetch(`${YOLO_SERVER}/api/yolo/record/${isRecording ? 'stop' : 'start'}`, { method: 'POST' });
      setIsRecording((current) => !current);
    } catch (requestError) {
      console.error(requestError);
      setError('Unable to change recording state.');
    }
  };

  const saveDetections = async () => {
    try {
      await fetch(`${YOLO_SERVER}/api/yolo/detections/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detections }),
      });
      setHistoryCount((current) => current + detections.length);
    } catch (requestError) {
      console.error(requestError);
      setError('Could not save this batch.');
    }
  };

  const speakLabel = async (label: string) => {
    try {
      await fetch(`${YOLO_SERVER}/api/yolo/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
    } catch (requestError) {
      console.error(requestError);
    }
  };

  const primaryDetection = useMemo(() => detections[0], [detections]);
  const levelMeta = getLevelMeta(user?.level ?? 'BEGINNER');

  return (
    <HangulPageFrame
      activeNav="Arena"
      sidebar={
        <HangulSidebar
          items={getSidebarItems('vocabulary')}
          profile={{
            title: `${levelMeta.step}: ${levelMeta.label}`,
            subtitle: `Next: ${levelMeta.next}`,
            emoji: '🦦',
            tone: 'mint',
          }}
        />
      }
    >
      <div className="space-y-6">
        {error ? <div className="rounded-[28px] bg-[#ffe8e1] px-5 py-4 text-base text-[#944f42]">{error}</div> : null}

        <HangulCard className="overflow-hidden bg-[#101418] p-4 sm:p-6">
          <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[#0b0f12] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="absolute left-6 top-6 z-20 grid h-20 w-20 place-items-center rounded-full bg-white text-[var(--hangul-accent)] shadow-[0_20px_40px_rgba(0,0,0,0.26)]">
              {isStreamActive ? <CameraOff className="h-9 w-9" /> : <Camera className="h-9 w-9" />}
            </div>
            <div className="absolute right-6 top-6 z-20 flex gap-4">
              <button className="grid h-20 w-20 place-items-center rounded-full bg-white text-[var(--hangul-accent)] shadow-[0_20px_40px_rgba(0,0,0,0.26)]" onClick={toggleRecording} type="button">
                <Zap className="h-8 w-8" />
              </button>
              <button className="grid h-20 w-20 place-items-center rounded-full bg-white text-[var(--hangul-accent)] shadow-[0_20px_40px_rgba(0,0,0,0.26)]" type="button">
                <RotateCw className="h-8 w-8" />
              </button>
            </div>

            <div className="relative aspect-[4/3] overflow-hidden rounded-[30px] bg-[#0d1215]">
              {isStreamActive ? (
                <img
                  alt="YOLO stream"
                  className="h-full w-full object-cover"
                  src={`${YOLO_SERVER}/api/yolo/stream?t=${Date.now()}`}
                />
              ) : (
                <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,0.08),transparent_22%),linear-gradient(180deg,#11171d,#0b0f12)]">
                  <Camera className="h-32 w-32 text-white/18" />
                </div>
              )}

              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[24%] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-[34px] border-[4px] border-dashed border-[#d39b42] shadow-[0_0_0_4px_rgba(211,155,66,0.18)]" />

              {primaryDetection ? (
                <div className="absolute bottom-[28%] left-[46%] flex -translate-x-1/2 flex-col items-center gap-3">
                  <div className="rounded-full bg-white px-10 py-6 text-5xl font-black tracking-[-0.05em] text-[var(--hangul-accent)]">
                    책
                  </div>
                  <Pill className="bg-[#3b5d63] px-5 py-2 text-white">{primaryDetection.label} ({Math.round(primaryDetection.confidence * 100)}%)</Pill>
                </div>
              ) : null}

              <div className="absolute bottom-5 left-6 z-20">
                <Pill className="bg-white text-[var(--hangul-soft-ink)]">AI vision active</Pill>
              </div>

              <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-4">
                <button className="grid h-28 w-28 place-items-center rounded-full border-[8px] border-[rgba(255,255,255,0.35)] bg-white shadow-[0_24px_48px_rgba(0,0,0,0.28)]" disabled={loading} onClick={isStreamActive ? stopDetection : startDetection} type="button">
                  <ScanSearch className="h-12 w-12 text-[var(--hangul-accent)]" />
                </button>
                <p className="text-2xl font-black tracking-[0.08em] text-white">SCAN OBJECT</p>
              </div>

              <div className="absolute bottom-6 right-6 z-20 flex gap-4">
                <MascotPortrait emoji="🦦" tone="paper" className="h-40 w-32 shrink-0" />
                <div className="w-[320px] rounded-[30px] bg-[rgba(255,251,245,0.92)] p-5 text-[var(--hangul-ink)] shadow-[0_20px_46px_rgba(0,0,0,0.18)]">
                  <p className="text-2xl font-black tracking-[-0.03em]">Ji-woo's Tip</p>
                  <p className="mt-4 text-lg leading-8 text-[var(--hangul-soft-ink)]">
                    Excellent! You found a <span className="font-bold italic">chaek</span>. This word sounds like the “che-” in “check”.
                  </p>
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-between text-sm font-semibold text-[var(--hangul-soft-ink)]">
                      <span>Objects found: {historyCount}/15</span>
                      <span>+50 XP</span>
                    </div>
                    <ProgressBar className="h-3" value={(historyCount / 15) * 100} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </HangulCard>

        <HangulCard className="flex flex-wrap items-center justify-between gap-4 px-7 py-6">
          <div className="flex flex-wrap gap-3">
            <StatusChip label={serverStatus === 'connected' ? 'Server connected' : 'Server disconnected'} tone={serverStatus === 'connected' ? 'mint' : 'peach'} />
            <StatusChip label={`Frames: ${frameCount}`} tone="paper" />
            <StatusChip label={`Detections: ${detections.length}`} tone="paper" />
          </div>
          <div className="flex flex-wrap gap-4">
            <button className="hangul-button-secondary" onClick={toggleRecording} type="button">
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            <button className="hangul-button-primary" onClick={saveDetections} type="button">
              Save Detections
            </button>
          </div>
        </HangulCard>

        <div className="grid gap-6 xl:grid-cols-[0.7fr_0.3fr]">
          <HangulCard className="p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--hangul-soft-ink)]">Detection Queue</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {detections.length === 0 ? (
                <div className="rounded-[28px] bg-white/72 p-5 text-lg text-[var(--hangul-soft-ink)]">
                  No objects detected yet. Scan a real-world item to populate this panel.
                </div>
              ) : (
                detections.map((item) => (
                  <button
                    key={item.id}
                    className="rounded-[28px] bg-white/72 p-5 text-left shadow-[0_16px_34px_rgba(121,95,78,0.08)]"
                    onClick={() => speakLabel(item.label)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-2xl font-black tracking-[-0.03em] text-[var(--hangul-ink)]">{item.label}</p>
                      <Volume2 className="h-5 w-5 text-[var(--hangul-accent)]" />
                    </div>
                    <p className="mt-3 text-base text-[var(--hangul-soft-ink)]">Confidence {Math.round(item.confidence * 100)}%</p>
                    <ProgressBar className="mt-4 h-3" value={item.confidence * 100} />
                  </button>
                ))
              )}
            </div>
          </HangulCard>

          <HangulCard className="p-6" tone="soft">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--hangul-soft-ink)]">Scan Notes</p>
            <p className="mt-4 text-3xl font-black tracking-[-0.04em] text-[var(--hangul-ink)]">Arena-ready vision lab</p>
            <p className="mt-4 text-lg leading-8 text-[var(--hangul-soft-ink)]">
              This screen mirrors the arena mini-game: soft chrome, dark camera stage, floating mentor card, and quick detection actions.
            </p>
          </HangulCard>
        </div>
      </div>
    </HangulPageFrame>
  );
}

