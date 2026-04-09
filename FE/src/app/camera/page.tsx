'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  const [isRecording, setIsRecording] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

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

    const detectionInterval = setInterval(fetchDetections, 500); // Update every 500ms
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
      } else {
        throw new Error('Failed to start detection');
      }
    } catch (err) {
      setError('❌ Không thể khởi động phát hiện: ' + (err as Error).message);
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
    } catch (err) {
      setError('❌ Lỗi dừng phát hiện');
    }
  };

  const speakLabel = async (label: string) => {
    // Speak detection label using TTS
    try {
      await fetch(`${YOLO_SERVER}/api/yolo/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
    } catch (err) {
      console.error('TTS Error:', err);
    }
  };

  const startRecording = async () => {
    // Start video recording
    try {
      await fetch(`${YOLO_SERVER}/api/yolo/record/start`, {
        method: 'POST',
      });
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError('❌ Lỗi bắt đầu ghi video');
    }
  };

  const stopRecording = async () => {
    // Stop video recording
    try {
      await fetch(`${YOLO_SERVER}/api/yolo/record/stop`, {
        method: 'POST',
      });
      setIsRecording(false);
      setError(null);
    } catch (err) {
      setError('❌ Lỗi dừng ghi video');
    }
  };

  const saveDetections = async () => {
    // Save current detections to both YOLO server and backend database
    try {
      // First save to YOLO server history
      await fetch(`${YOLO_SERVER}/api/yolo/detections/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      // Then sync to backend database
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/yolo/sync-backend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          detections: detections,
          user_id: token ? 1 : null, // Default user for now
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setHistoryCount((data.count || 0) + detections.length);
        setError(null);
      } else {
        console.warn('Backend sync partially failed');
        setHistoryCount(detections.length);
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('⚠️ Lưu vào bộ nhớ cục bộ thành công, nhưng chưa đồng bộ với máy chủ');
    }
  };

  const exportDetections = async (format: 'csv' | 'json') => {
    // Export detections to file
    try {
      const response = await fetch(`${YOLO_SERVER}/api/yolo/detections/export?format=${format}`);
      
      if (format === 'csv') {
        const text = await response.text();
        const blob = new Blob([text], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `detections_${new Date().getTime()}.csv`;
        a.click();
      } else {
        const json = await response.json();
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `detections_${new Date().getTime()}.json`;
        a.click();
      }
      setError(null);
    } catch (err) {
      setError('❌ Lỗi export detections');
    }
  };

  const clearHistory = async () => {
    // Clear detection history
    try {
      await fetch(`${YOLO_SERVER}/api/yolo/detections/clear`, {
        method: 'POST',
      });
      setHistoryCount(0);
      setError(null);
    } catch (err) {
      setError('❌ Lỗi xóa history');
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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">🎬 Phát hiện từ vựng</h1>
          <p className="text-gray-600 mb-4">Phát hiện vật dụng từ webcam sử dụng YOLO AI</p>
          <div className="flex gap-4 justify-center">
            <Link href="/" className="text-blue-600 hover:text-blue-800 underline">← Quay lại trang chính</Link>
          </div>
        </div>

        {/* Server Status Alert */}
        <div className={`mb-6 p-4 rounded-lg text-white font-semibold ${
          serverStatus === 'connected' ? 'bg-green-600' :
          serverStatus === 'disconnected' ? 'bg-red-600' :
          'bg-yellow-600'
        }`}>
          {serverStatus === 'connected' && '✅ YOLO Server kết nối thành công'}
          {serverStatus === 'disconnected' && '❌ YOLO Server không kết nối (chạy: python3 yolo_flask_server.py)'}
          {serverStatus === 'checking' && '⏳ Đang kiểm tra kết nối...'}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Video Stream Section */}
            <div className="lg:col-span-2">
              <div className="bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center relative">
                {isStreamActive ? (
                  <>
                    <img 
                      src={`${YOLO_SERVER}/api/yolo/stream?t=${Date.now()}`}
                      alt="YOLO Stream"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      🔴 LIVE
                    </div>
                  </>
                ) : (
                  <div className="text-white text-center">
                    <p className="text-2xl mb-4">📹</p>
                    <p className="text-lg mb-4">
                      {serverStatus === 'disconnected' 
                        ? 'YOLO Server chưa kết nối' 
                        : 'Webcam chưa khởi động'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {serverStatus === 'disconnected'
                        ? 'Chạy: python3 yolo_flask_server.py'
                        : 'Nhấn "Bắt đầu" để khởi động'}
                    </p>
                  </div>
                )}
              </div>

              {/* Control Buttons */}
              <div className="mt-6 flex gap-2 flex-wrap">
                {!isStreamActive ? (
                  <button
                    onClick={startDetection}
                    disabled={loading || serverStatus === 'disconnected'}
                    className="flex-1 min-w-[120px] bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition"
                  >
                    {loading ? '⏳ Đang khởi động...' : '▶️ Bắt đầu'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={stopDetection}
                      className="flex-1 min-w-[120px] bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition"
                    >
                      ⏹️ Dừng
                    </button>
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`min-w-[140px] font-bold py-3 px-6 rounded-lg transition text-white ${
                        isRecording 
                          ? 'bg-red-500 hover:bg-red-600' 
                          : 'bg-purple-600 hover:bg-purple-700'
                      }`}
                    >
                      {isRecording ? '⏹️ Dừng ghi' : '🎬 Ghi video'}
                    </button>
                    <button
                      onClick={saveDetections}
                      className="min-w-[120px] bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition"
                    >
                      💾 Lưu
                    </button>
                  </>
                )}
              </div>

              {/* Export Buttons */}
              {historyCount > 0 && isStreamActive && (
                <div className="mt-4 flex gap-2 flex-wrap">
                  <button
                    onClick={() => exportDetections('csv')}
                    className="flex-1 min-w-[120px] bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition text-sm"
                  >
                    📥 Export CSV ({historyCount})
                  </button>
                  <button
                    onClick={() => exportDetections('json')}
                    className="flex-1 min-w-[120px] bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition text-sm"
                  >
                    📥 Export JSON ({historyCount})
                  </button>
                  <button
                    onClick={clearHistory}
                    className="flex-1 min-w-[120px] bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition text-sm"
                  >
                    🗑️ Xóa lịch sử
                  </button>
                </div>
              )}

              {/* Stats */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
                <div>📊 Frames: <span className="font-bold">{frameCount}</span></div>
                <div>🎯 Detections: <span className="font-bold">{detections.length}</span></div>
              </div>
            </div>

            {/* Detection Results Section */}
            <div className="bg-gray-50 rounded-lg p-6 h-fit">
              <h2 className="text-xl font-bold text-gray-800 mb-4">🎯 Kết quả ({detections.length})</h2>
              
              {detections.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {isStreamActive ? 'Đang phát hiện...' : 'Chưa phát hiện vật dụng'}
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {detections.map((obj) => (
                    <div key={obj.id} className="bg-white p-3 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-gray-800">{obj.label}</div>
                        <div className="flex gap-2">
                          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                            {(obj.confidence * 100).toFixed(0)}%
                          </span>
                          <button
                            onClick={() => speakLabel(obj.label)}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-2 py-1 rounded"
                            title="Phát âm"
                          >
                            🔊
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${obj.confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-gray-100 px-6 py-4 border-t">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Trạng thái hệ thống:</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Server:</span>
                <span className={`ml-2 font-bold ${
                  serverStatus === 'connected' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {serverStatus === 'connected' ? '✅ OK' : '❌ Lỗi'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Camera:</span>
                <span className={`ml-2 font-bold ${isStreamActive ? 'text-green-600' : 'text-gray-500'}`}>
                  {isStreamActive ? '✅ Hoạt động' : '⭕ Không'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Frames:</span>
                <span className="ml-2 font-bold text-gray-700">{frameCount}</span>
              </div>
              <div>
                <span className="text-gray-600">Kết quả:</span>
                <span className="ml-2 font-bold text-gray-700">{detections.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 bg-gray-800 text-gray-100 rounded-lg p-4 font-mono text-xs">
          <p className="text-gray-400 mb-2"> Thông tin debug:</p>
          <ul className="space-y-1">
            <li>🌐 Frontend: http://localhost:3000/camera</li>
            <li>🖥️ YOLO Server: {YOLO_SERVER}</li>
            <li>📡 Stream: {YOLO_SERVER}/api/yolo/stream</li>
            <li>🎯 Detections: {YOLO_SERVER}/api/yolo/detections</li>
            <li>📸 Chạy: python3 yolo_flask_server.py</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
