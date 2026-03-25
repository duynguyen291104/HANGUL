'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Detection {
  id: number;
  label: string;
  confidence: number;
  createdAt: string;
}

interface DetectionStats {
  totalDetections: number;
  uniqueLabels: number;
  topLabel: string;
  topLabelCount: number;
}

interface LabelData {
  label: string;
  count: number;
  percentage: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AnalyticsDashboard() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [stats, setStats] = useState<DetectionStats | null>(null);
  const [labels, setLabels] = useState<LabelData[]>([]);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetchUserAndData();
  }, []);

  const fetchUserAndData = async () => {
    try {
      // Get user ID from auth
      const authResponse = await axios.get(`${API_BASE}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (authResponse.data?.id) {
        const uid = authResponse.data.id;
        setUserId(uid);
        await Promise.all([
          fetchStats(uid),
          fetchLabels(uid),
          fetchDetections(uid),
          fetchDailyStats(uid),
        ]);
      }
    } catch (error) {
      console.error('❌ Auth error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (uid: number) => {
    try {
      const response = await axios.get(`${API_BASE}/api/yolo/stats/${uid}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setStats(response.data);
    } catch (error) {
      console.error('❌ Fetch stats error:', error);
    }
  };

  const fetchLabels = async (uid: number) => {
    try {
      const response = await axios.get(`${API_BASE}/api/yolo/labels/${uid}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data?.labels && response.data.labels.length > 0) {
        const total = response.data.labels.reduce((sum: number, l: any) => sum + l.count, 0);
        const labelsWithPercentage = response.data.labels.map((l: any) => ({
          ...l,
          percentage: total > 0 ? ((l.count / total) * 100).toFixed(1) : 0,
        }));
        setLabels(labelsWithPercentage);
      }
    } catch (error) {
      console.error('❌ Fetch labels error:', error);
    }
  };

  const fetchDetections = async (uid: number) => {
    try {
      const response = await axios.get(`${API_BASE}/api/yolo/user/${uid}?limit=20`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setDetections(response.data.detections || []);
    } catch (error) {
      console.error('❌ Fetch detections error:', error);
    }
  };

  const fetchDailyStats = async (uid: number) => {
    try {
      const response = await axios.get(`${API_BASE}/api/yolo/daily/${uid}?days=${days}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setDailyStats(response.data.stats || []);
    } catch (error) {
      console.error('❌ Fetch daily stats error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-2xl font-bold text-gray-700">📊 Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">📊 Phân Tích Detections</h1>
            <p className="text-gray-600 mt-2">Theo dõi lịch sử phát hiện đối tượng của bạn</p>
          </div>
          <button
            onClick={() => router.push('/camera')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            🎥 Quay lại Camera
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600 mb-2">📈 Tổng Detection</div>
            <div className="text-3xl font-bold text-blue-600">{stats?.totalDetections || 0}</div>
            <div className="text-xs text-gray-500 mt-2">Tất cả phát hiện</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="text-sm text-gray-600 mb-2">🏷️ Nhãn Duy Nhất</div>
            <div className="text-3xl font-bold text-green-600">{stats?.uniqueLabels || 0}</div>
            <div className="text-xs text-gray-500 mt-2">Loại đối tượng khác nhau</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="text-sm text-gray-600 mb-2">⭐ Nhãn Top</div>
            <div className="text-2xl font-bold text-purple-600 truncate">{stats?.topLabel || 'N/A'}</div>
            <div className="text-xs text-gray-500 mt-2">{stats?.topLabelCount || 0} lần</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="text-sm text-gray-600 mb-2">📅 Khoảng Thời Gian</div>
            <select
              value={days}
              onChange={(e) => {
                setDays(parseInt(e.target.value));
                if (userId) fetchDailyStats(userId);
              }}
              className="w-full px-3 py-1 border rounded text-orange-600 font-bold"
            >
              <option value={7}>7 ngày</option>
              <option value={30}>30 ngày</option>
              <option value={90}>90 ngày</option>
            </select>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Label Distribution */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">📊 Phân Bố Nhãn</h2>
            {labels.length > 0 ? (
              <div className="space-y-4">
                {labels.slice(0, 10).map((label) => (
                  <div key={label.label} className="cursor-pointer hover:bg-gray-50 p-3 rounded transition"
                    onClick={() => setSelectedLabel(selectedLabel === label.label ? null : label.label)}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-700">{label.label}</span>
                      <span className="text-sm font-bold text-indigo-600">{label.count}x ({label.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-2 rounded-full"
                        style={{ width: `${Math.min(label.percentage as any, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Chưa có dữ liệu</p>
            )}
          </div>

          {/* Daily Statistics */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">📈 Thống Kê Hàng Ngày</h2>
            {dailyStats.length > 0 ? (
              <div className="space-y-3">
                {dailyStats.map((stat) => (
                  <div key={stat.date} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded transition">
                    <span className="text-gray-700 font-medium">{stat.date}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                          style={{ width: `${Math.min((stat.count / Math.max(...dailyStats.map((s: any) => s.count), 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-green-600 w-12 text-right">{stat.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Chưa có dữ liệu</p>
            )}
          </div>
        </div>

        {/* Recent Detections */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">🔍 Detections Gần Đây</h2>
          {detections.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-700">Nhãn</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Độ Tin Cậy</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Thời Gian</th>
                  </tr>
                </thead>
                <tbody>
                  {detections.map((det) => (
                    <tr key={det.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <span className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {det.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${Math.min(det.confidence * 100, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">
                            {(det.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(det.createdAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Chưa có detections</p>
          )}
        </div>
      </div>
    </div>
  );
}
