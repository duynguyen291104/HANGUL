'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

interface Detection {
  id: number;
  label: string;
  confidence: number;
  bbox: number[];
  age: number;
}

const YOLO_SERVER = 'http://localhost:5002';

export default function CameraPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [frameCount, setFrameCount] = useState(0);
  const [cameraStatus, setCameraStatus] = useState<'active' | 'inactive'>('inactive');

  // Check server health on mount
  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    checkServerHealth();
    const healthInterval = setInterval(checkServerHealth, 5000);
    
    return () => clearInterval(healthInterval);
  }, [token, router]);

  // Fetch detections when stream is active
  useEffect(() => {
    if (!isStreamActive) return;

    const detectionInterval = setInterval(fetchDetections, 500);
    return () => clearInterval(detectionInterval);
  }, [isStreamActive]);

  const checkServerHealth = async () => {
    try {
      const response = await fetch(`${YOLO_SERVER}/api/yolo/health`);
      const data = await response.json();
      setServerStatus('connected');
      setFrameCount(data.frame_count);
    } catch (err) {
      setServerStatus('disconnected');
      console.error('YOLO server health check failed:', err);
    }
  };

  const startDetection = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${YOLO_SERVER}/api/yolo/start`, {
        method: 'POST',
      });
      if (response.ok) {
        setIsStreamActive(true);
        setCameraStatus('active');
      } else {
        throw new Error('Failed to start detection');
      }
    } catch (err) {
      setError('❌ Không thể khởi động phát hiện: ' + (err as Error).message);
      setCameraStatus('inactive');
    } finally {
      setLoading(false);
    }
  };

  const stopDetection = async () => {
    try {
      await fetch(`${YOLO_SERVER}/api/yolo/stop`, {
        method: 'POST',
      });
      setIsStreamActive(false);
      setDetections([]);
      setCameraStatus('inactive');
    } catch (err) {
      setError('❌ Lỗi dừng phát hiện');
    }
  };

  const fetchDetections = async () => {
    try {
      const response = await fetch(`${YOLO_SERVER}/api/yolo/detections`);
      const data = await response.json();
      setDetections(data.detections || []);
      setFrameCount(data.frame_count);
    } catch (err) {
      console.error('Error fetching detections:', err);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden flex flex-col bg-[#fafaf5] font-['Be_Vietnam_Pro']">
      <Header />

      {/* Main Content */}
      <main className="flex-1 relative overflow-auto bg-[#fafaf5]">
        <div className="flex gap-6 p-8 pt-[60px] min-h-full">
          {/* Left: Camera Section */}
          <div className="relative">
            {/* AR Camera Section */}
            <section 
              className="bg-black rounded-[20px] overflow-hidden shadow-2xl border-4 border-[#72564c]"
              style={{ width: '1100px', height: '730px' }}
            >
              {/* Camera Viewport Background */}
              <div className="absolute inset-0 z-0 w-full h-full flex items-center justify-center">
                {isStreamActive ? (
                  <img 
                    src={`${YOLO_SERVER}/api/yolo/stream?t=${Date.now()}`}
                    alt="Camera view"
                    className="w-full h-full object-cover opacity-90"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black"></div>
                )}
                {/* AR Scanning Effect Overlay */}
                <div className="absolute inset-0 pointer-events-none border-[12px] border-white/10"></div>
                {isStreamActive && <div className="ar-scanner-line"></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20"></div>
              </div>

              {/* Server Status Indicator - Top Left (for devs only) */}
              <div className="absolute top-4 left-4 z-20">
                <div className={`w-3 h-3 rounded-full ${serverStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'} shadow-lg`}></div>
              </div>

              {/* Camera Status Indicator - Top Right (when inactive) */}
              {!isStreamActive && (
                <div className="absolute top-4 right-4 z-20">
                  <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full">
                    <p className="text-white text-xs font-bold tracking-wide">Camera Off</p>
                  </div>
                </div>
              )}

              {/* Not Active State */}
              {!isStreamActive && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                  <p className="text-3xl mb-4 font-['Plus_Jakarta_Sans'] font-bold text-white text-center">
                    {serverStatus === 'disconnected' 
                      ? 'YOLO Server chưa kết nối' 
                      : 'Webcam chưa khởi động'}
                  </p>
                  <p className="text-sm text-gray-300">
                    {serverStatus === 'disconnected'
                      ? 'Chạy: python3 yolo_flask_server.py'
                      : 'Nhấn nút bên dưới để khởi động'}
                  </p>
                </div>
              )}

              {/* Interface Controls - Bottom */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20">
                {!isStreamActive ? (
                  <button 
                    onClick={startDetection}
                    disabled={loading || serverStatus === 'disconnected'}
                    className="group relative p-2 rounded-full bg-white/20 backdrop-blur-md transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                  >
                    <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center overflow-hidden">
                      <div className="w-16 h-16 rounded-full bg-white transition-all group-hover:bg-[#815300]"></div>
                    </div>
                  </button>
                ) : (
                  <button 
                    onClick={stopDetection}
                    className="group relative p-2 rounded-full bg-white/20 backdrop-blur-md transition-all hover:scale-110 active:scale-95"
                  >
                    <div className="w-20 h-20 rounded-full border-4 border-red-600 flex items-center justify-center overflow-hidden">
                      <div className="w-16 h-16 rounded-full bg-red-600 transition-all group-hover:bg-red-700 flex items-center justify-center">
                        <span className="text-white text-2xl">⏹</span>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </section>
          </div>

          {/* Right: Info Panels */}
          <div className="flex-1 min-w-[350px] flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: '730px' }}>
            {/* Frames Counter Panel */}
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-[#72564c]">
              <div className="flex justify-between items-center">
                <span className="text-[#72564c]/70 text-sm">Frames</span>
                <span className="font-bold text-[#72564c] text-2xl">{frameCount}</span>
              </div>
            </div>

            {/* Detection Counter Panel */}
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-[#815300]">
              <div className="flex justify-between items-center">
                <span className="text-[#72564c]/70 text-sm">Phát Hiện</span>
                <span className="font-bold text-[#72564c] text-2xl">{detections.length}</span>
              </div>
            </div>

            {/* Detection Results Panel */}
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-[#406561] flex-1">
              <h3 className="text-base font-['Plus_Jakarta_Sans'] font-bold text-[#72564c] mb-3">
                Kết Quả Phát Hiện ({detections.length})
              </h3>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {detections.length === 0 ? (
                  <p className="text-[#72564c]/60 text-sm text-center py-4">Chưa phát hiện vật dụng</p>
                ) : (
                  detections.map((detection, idx) => (
                    <div key={idx} className="bg-[#fafaf5] p-3 rounded-lg border border-[#406561]/20 hover:bg-[#eeeee9] transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-['Plus_Jakarta_Sans'] font-semibold text-[#72564c] text-sm">{detection.label}</span>
                        <span className="bg-[#406561] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          {Math.round(detection.confidence * 100)}%
                        </span>
                      </div>
                      <button className="w-full bg-[#72564c] hover:bg-[#8d6e63] text-white text-xs font-bold py-1.5 rounded-lg transition-colors">
                        Thêm vào học
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-xs font-semibold">{error}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .glass-panel {
          background: rgba(250, 250, 245, 0.8);
          backdrop-filter: blur(12px);
        }
        .ar-scanner-line {
          background: linear-gradient(to bottom, transparent, #815300, transparent);
          height: 4px;
          width: 100%;
          position: absolute;
          animation: scan 3s ease-in-out infinite;
        }
        @keyframes scan {
          0%, 100% { top: 10%; opacity: 0; }
          50% { top: 90%; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
