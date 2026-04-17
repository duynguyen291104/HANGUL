'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

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
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedVocabCount, setSavedVocabCount] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordStep, setPasswordStep] = useState(1); // 1: current password, 2: new password
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
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
      // Fetch fresh user data from API to get updated profile
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch profile');
      
      const userData = await response.json();
      
      setProfileData({
        id: userData.id || 0,
        name: userData.name || '',
        email: userData.email || '',
        level: userData.level || 'NEWBIE',
        totalXP: userData.totalXP || 0,
        streakDays: userData.currentStreak || 0,
        completedQuizzes: 0,
        learnedVocabulary: 0,
      });

      // Fetch saved vocabulary count
      try {
        const vocabResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vocabulary/saved/collection`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (vocabResponse.ok) {
          const vocabData = await vocabResponse.json();
          setSavedVocabCount(vocabData.total || 0);
        }
      } catch (vocabError) {
        console.error('Lỗi tải số lượng từ vựng đã lưu:', vocabError);
        setSavedVocabCount(0);
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu hồ sơ:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // TODO: Implement API call to update profile
      setIsEditing(false);
      alert('Hồ sơ đã được cập nhật thành công!');
    } catch (error) {
      console.error('Lỗi cập nhật hồ sơ:', error);
      alert('Không thể cập nhật hồ sơ. Vui lòng thử lại!');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordNext = async () => {
    if (!passwordData.currentPassword) {
      alert('Vui lòng nhập mật khẩu hiện tại');
      return;
    }

    try {
      setPasswordLoading(true);

      // Verify current password with backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: 'temp123456', // temporary password for validation
          confirmPassword: 'temp123456',
        }),
      });

      if (response.status === 401) {
        alert('Mật khẩu hiện tại không chính xác');
        setPasswordData({ ...passwordData, currentPassword: '' });
        return;
      }

      // If password is correct, move to step 2
      setPasswordStep(2);
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      if (!passwordData.newPassword || !passwordData.confirmPassword) {
        alert('Vui lòng nhập mật khẩu mới');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        alert('Mật khẩu mới không khớp');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        alert('Mật khẩu mới phải có ít nhất 6 ký tự');
        return;
      }

      setPasswordLoading(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Không thể đổi mật khẩu');
      }

      alert('Đổi mật khẩu thành công!');
      setShowPasswordModal(false);
      setPasswordStep(1);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf5]">
      <Header />
      <header className="pt-[70px] pl-[200px] mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#504441] tracking-tight leading-tight">
          Hồ sơ cá nhân
        </h1>
      </header>
      <main className="flex-1 w-full flex flex-col items-center pl-[200px] pr-10">

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12 w-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#72564c]\"></div>
          </div>
        ) : (
          <div className="w-full max-w-4xl">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 max-w-4xl">
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
                  <div className="rounded-lg p-4">
                    <div className="text-sm text-gray-600">Cấp độ</div>
                    <div className="text-3xl font-bold text-black">{profileData.level}</div>
                  </div>
                  <div className="rounded-lg p-4">
                    <div className="text-sm text-gray-600">Tổng XP</div>
                    <div className="text-3xl font-bold text-black">{profileData.totalXP}</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">Chuỗi ngày</div>
                    <div className="text-3xl font-bold text-orange-600">{profileData.streakDays} 🔥</div>
                  </div>
                  <div className="relative rounded-lg p-4 cursor-pointer hover:shadow-md transition" onClick={() => router.push('/vocabulary-collection')}>
                    <div className="text-xl font-bold text-black">Kho từ vựng</div>
                    {/* Red badge with count */}
                    <div className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">
                      {savedVocabCount}
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <div className="mt-8 flex gap-4">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-white border border-black text-black rounded-lg font-semibold hover:bg-gray-50"
                  >
                    Chỉnh sửa hồ sơ
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

            {/* Settings Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Cài đặt</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-800">Chế độ tối</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-lg border-t pt-4">
                  <span className="font-semibold text-gray-800">Đổi mật khẩu</span>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50"
                  >
                    Thay đổi
                  </button>
                </div>
              </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-lg p-8 w-96">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">Đổi mật khẩu</h3>

                  {passwordStep === 1 ? (
                    // Step 1: Current password
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Mật khẩu hiện tại
                        </label>
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, currentPassword: e.target.value })
                          }
                          placeholder="Nhập mật khẩu hiện tại"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex gap-4 justify-end">
                        <button
                          onClick={() => {
                            setShowPasswordModal(false);
                            setPasswordStep(1);
                            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          }}
                          className="px-6 py-2 border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handlePasswordNext}
                          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                        >
                          Tiếp theo
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Step 2: New password
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Mật khẩu mới
                        </label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, newPassword: e.target.value })
                          }
                          placeholder="Nhập mật khẩu mới"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Xác nhận mật khẩu mới
                        </label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                          }
                          placeholder="Nhập lại mật khẩu mới"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex gap-4 justify-end">
                        <button
                          onClick={() => setPasswordStep(1)}
                          className="px-6 py-2 border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50"
                        >
                          Quay lại
                        </button>
                        <button
                          onClick={handlePasswordChange}
                          disabled={passwordLoading}
                          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold disabled:opacity-50"
                        >
                          {passwordLoading ? 'Đang xử lý...' : 'Xác nhận'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
