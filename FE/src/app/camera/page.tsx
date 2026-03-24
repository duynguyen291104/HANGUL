'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DetectedObject {
  name: string;
  korean: string;
  romanization: string;
  confidence: number;
}

export default function CameraPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [detections, setDetections] = useState<DetectedObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [learned, setLearned] = useState<string[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    // Don't auto-start camera, wait for user to click button
    return () => {
      stopCamera();
    };
  }, [token, router]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsActive(true);
      }
    } catch (error: any) {
      console.error('Lỗi truy cập camera:', error);
      
      if (error.name === 'NotAllowedError') {
        setCameraError('❌ Bạn cần cấp quyền truy cập camera. Vui lòng cho phép ứng dụng sử dụng camera.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('❌ Không tìm thấy camera trên thiết bị này.');
      } else if (error.name === 'NotReadableError') {
        setCameraError('❌ Camera đang được sử dụng bởi ứng dụng khác.');
      } else {
        setCameraError('❌ Lỗi truy cập camera: ' + error.message);
      }
      setIsActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setIsActive(false);
    }
  };

  const captureFrame = async () => {
    setLoading(true);
    try {
      const mockDetections: DetectedObject[] = [
        { name: 'Táo', korean: '사과', romanization: 'sagwa', confidence: 0.95 },
        { name: 'Sách', korean: '책', romanization: 'chaek', confidence: 0.87 },
      ];
      setDetections(mockDetections);
    } catch (error) {
      console.error('Lỗi phát hiện:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsLearned = (korean: string) => {
    setLearned([...learned, korean]);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f1e8 0%, #ede4d3 100%)' }}>
      <div className="flex">
        {/* Sidebar */}
        <aside style={{ background: '#2d5d4d', width: '280px', minHeight: '100vh' }} className="sticky top-0 p-6 text-white">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <span className="text-2xl">←</span>
            <span className="font-semibold">Quay lại</span>
          </Link>
          <h2 className="text-xl font-bold mb-4">📸 Từ vựng qua ảnh</h2>
          <p className="text-sm opacity-75">Chụp ảnh các vật xung quanh để học từ vựng tiếng Hàn.</p>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-[#2d3436] mb-2">📸 Phát hiện từ vựng</h1>
              <p className="text-[#636e72]">Sử dụng camera để chụp và học các từ vựng tiếng Hàn mới.</p>
            </div>

            {/* Camera Container */}
            <div style={{ background: 'white', borderRadius: '20px' }} className="shadow-sm p-8 mb-8">
              {/* Error Message */}
              {cameraError && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-red-700 text-sm">{cameraError}</p>
                </div>
              )}

              <div style={{ background: '#000', borderRadius: '16px' }} className="w-full aspect-video flex items-center justify-center mb-6 overflow-hidden">
                {isActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-white text-center">
                    <p className="text-2xl mb-2">📷</p>
                    <p>{cameraError ? 'Không thể bật camera' : 'Nhấn "Bắt đầu" để kích hoạt camera'}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mb-6">
                <button
                  onClick={captureFrame}
                  disabled={loading || !isActive}
                  className="flex-1 py-3 px-6 rounded-lg font-semibold text-white transition disabled:opacity-50"
                  style={{ background: '#2d5d4d' }}
                >
                  {loading ? '⏳ Đang phát hiện...' : '📸 Chụp ảnh'}
                </button>
                <button
                  onClick={isActive ? stopCamera : startCamera}
                  className="px-6 py-3 rounded-lg font-semibold transition"
                  style={{ background: isActive ? '#e74c3c' : '#2d5d4d', color: 'white' }}
                >
                  {isActive ? '🛑 Dừng' : '▶️ Bắt đầu'}
                </button>
              </div>

              {detections.length > 0 && (
                <div className="mt-8 border-t pt-8">
                  <p className="font-semibold text-[#636e72] mb-4">Từ vựng phát hiện:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {detections.map((item, idx) => (
                      <div key={idx} style={{ background: '#f5f1e8', borderRadius: '12px' }} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-sm text-[#636e72]">{item.name}</p>
                            <p style={{ color: '#2d5d4d' }} className="text-2xl font-bold">{item.korean}</p>
                            <p className="text-xs text-[#636e72] mt-1">{item.romanization}</p>
                          </div>
                          <p className="text-sm font-semibold text-[#a8d5ba]">{Math.round(item.confidence * 100)}%</p>
                        </div>
                        <button
                          onClick={() => markAsLearned(item.korean)}
                          disabled={learned.includes(item.korean)}
                          className="w-full py-2 rounded-lg font-semibold transition text-sm"
                          style={{
                            background: learned.includes(item.korean) ? '#a8d5ba' : 'rgba(168, 213, 186, 0.5)',
                            color: '#2d3436'
                          }}
                        >
                          {learned.includes(item.korean) ? '✅ Đã học' : '📌 Đánh dấu'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
