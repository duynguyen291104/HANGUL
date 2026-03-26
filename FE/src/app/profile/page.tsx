'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { userService, achievementService } from '@/services/api';

interface Achievement {
  id: number;
  name: string;
  description: string;
  badge: string;
  unlockedAt: string;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  level: string;
  totalXP: number;
  streakDays: number;
  completedQuizzes: number;
  learnedVocabulary: number;
}

export default function ProfilePage() {
  const { user, token, logout } = useAuthStore();
  const router = useRouter();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile>({
    id: 0,
    name: user?.name || '',
    email: user?.email || '',
    level: user?.level || 'NEWBIE',
    totalXP: user?.totalXP || 0,
    streakDays: 0,
    completedQuizzes: 0,
    learnedVocabulary: 0,
  });

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    loadProfileData();
  }, [token, router]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      // Load user profile
      const profileResponse = await userService.getProfile();
      setProfileData(profileResponse.user || profileResponse);
      
      // Load achievements
      const achievementsResponse = await achievementService.getUnlocked();
      const formattedAchievements = (achievementsResponse.achievements || []).map((ach: any) => ({
        id: ach.id,
        name: ach.name,
        description: ach.description,
        badge: ach.badge || '🏆',
        unlockedAt: ach.unlockedAt ? new Date(ach.unlockedAt).toLocaleDateString('vi-VN') : 'N/A',
      }));
      setAchievements(formattedAchievements);
    } catch (error) {
      console.error('Lỗi tải dữ liệu hồ sơ:', error);
      alert('Không thể tải dữ liệu hồ sơ. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await userService.updateProfile({
        name: profileData.name,
        email: profileData.email,
      });
      setIsEditing(false);
      alert('Hồ sơ đã được cập nhật thành công!');
      loadProfileData();
    } catch (error) {
      console.error('Lỗi cập nhật hồ sơ:', error);
      alert('Không thể cập nhật hồ sơ. Vui lòng thử lại!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">👤 Hồ sơ cá nhân</h1>
          <button onClick={() => router.push('/')} className="text-2xl">✕</button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Avatar & Name */}
                <div className="flex flex-col items-center">
                  <div className="text-7xl mb-4">👤</div>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">{profileData.name}</h2>
                    <p className="text-gray-600">{profileData.email}</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Cấp độ</div>
                    <div className="text-3xl font-bold text-blue-600">{profileData.level}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Tổng XP</div>
                    <div className="text-3xl font-bold text-green-600">{profileData.totalXP}</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Chuỗi ngày</div>
                    <div className="text-3xl font-bold text-orange-600">{profileData.streakDays} 🔥</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Quiz hoàn thành</div>
                    <div className="text-3xl font-bold text-purple-600">{profileData.completedQuizzes}</div>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Từ vựng học</div>
                    <div className="text-3xl font-bold text-pink-600">{profileData.learnedVocabulary}</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Thành tích</div>
                    <div className="text-3xl font-bold text-yellow-600">{achievements.length}</div>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <div className="mt-8 flex gap-4">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                  >
                    ✏️ Chỉnh sửa hồ sơ
                  </button>
                )}
              </div>
            </div>

            {/* Edit Form */}
            {isEditing && (
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Chỉnh sửa hồ sơ</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tên</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50"
                    >
                      {saving ? '⏳ Đang lưu...' : '💾 Lưu'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold"
                    >
                      ✕ Hủy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Achievements Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">🏆 Thành tích</h3>
              {achievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {achievements.map((ach) => (
                    <div key={ach.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6 border-2 border-yellow-200">
                      <div className="text-5xl mb-3">{ach.badge}</div>
                      <h4 className="text-lg font-bold text-gray-800">{ach.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{ach.description}</p>
                      <p className="text-xs text-gray-500">Mở khóa: {ach.unlockedAt}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">Chưa có thành tích nào. Hoàn thành các bài học để mở khóa thành tích!</p>
              )}
            </div>

            {/* Settings Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Cài đặt</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-800">Thông báo</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-800">Chế độ tối</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-lg border-t pt-4">
                  <span className="font-semibold text-red-600">Đăng xuất</span>
                  <button
                    onClick={() => {
                      logout();
                      router.push('/');
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
