'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { achievementService } from '@/services/api';

interface Achievement {
  id: number;
  name: string;
  description: string;
  badge: string;
  target: number;
  reward: number;
  difficulty: string;
  progress: number;
  completed: boolean;
}

export default function MonthlyTasksPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [tasks, setTasks] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAchievements: 0,
    unlockedCount: 0,
    totalXP: 0,
  });

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    loadAchievements();
  }, [token, router]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      // Load all achievements and their progress
      const [progressResponse, statsResponse] = await Promise.all([
        achievementService.getProgress(),
        achievementService.getStats(),
      ]);

      const achievementsData = (progressResponse.achievements || []).map((ach: any) => ({
        id: ach.id,
        name: ach.name,
        description: ach.description,
        badge: ach.badge || '🎯',
        target: ach.target || 10,
        reward: ach.reward || 500,
        difficulty: getDifficulty(ach.reward),
        progress: ach.progress || 0,
        completed: ach.unlockedAt !== null,
      }));

      setTasks(achievementsData);
      setStats({
        totalAchievements: achievementsData.length,
        unlockedCount: achievementsData.filter((a: Achievement) => a.completed).length,
        totalXP: statsResponse.stats?.totalXP || 0,
      });
    } catch (error) {
      console.error('Lỗi tải thành tích:', error);
      alert('Không thể tải danh sách thành tích. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const getDifficulty = (reward: number) => {
    if (reward <= 500) return 'DỄ';
    if (reward <= 750) return 'TRUNG BÌNH';
    return 'KHÓ';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: { [key: string]: string } = {
      'DỄ': 'bg-green-100 text-green-800',
      'TRUNG BÌNH': 'bg-yellow-100 text-yellow-800',
      'KHÓ': 'bg-red-100 text-red-800',
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyIcon = (difficulty: string) => {
    if (difficulty === 'DỄ') return '⭐';
    if (difficulty === 'TRUNG BÌNH') return '⭐⭐';
    return '⭐⭐⭐';
  };

  const possibleReward = tasks.reduce((sum, t) => sum + t.reward, 0);
  const earnedReward = tasks
    .filter(t => t.completed)
    .reduce((sum, t) => sum + t.reward, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">⭐ Thách thức tháng này</h1>
          <button onClick={() => router.push('/')} className="text-2xl">✕</button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Month & Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-sm text-gray-600">Tháng</div>
                  <div className="text-3xl font-bold text-blue-600">Tháng 3</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Hoàn thành</div>
                  <div className="text-3xl font-bold text-green-600">
                    {stats.unlockedCount}/{stats.totalAchievements}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">XP nhận được</div>
                  <div className="text-3xl font-bold text-purple-600">
                    ⭐ {earnedReward}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">XP còn lại</div>
                  <div className="text-3xl font-bold text-orange-600">
                    ⭐ {possibleReward - earnedReward}
                  </div>
                </div>
              </div>

              {/* Overall Progress */}
              <div className="mt-8">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Tiến độ tổng thể</span>
                  <span>{stats.totalAchievements > 0 ? Math.round((stats.unlockedCount / stats.totalAchievements) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all"
                    style={{ width: stats.totalAchievements > 0 ? `${(stats.unlockedCount / stats.totalAchievements) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Tasks List */}
            <div className="space-y-4">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`rounded-2xl shadow-lg p-6 transition ${
                      task.completed ? 'bg-green-50 border-2 border-green-300' : 'bg-white hover:shadow-xl'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Task Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-800">{task.name}</h3>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${getDifficultyColor(task.difficulty)}`}>
                            {getDifficultyIcon(task.difficulty)} {task.difficulty}
                          </span>
                          {task.completed && <span className="text-2xl">✅</span>}
                        </div>
                        <p className="text-gray-600 mb-4">{task.description}</p>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Tiến độ</span>
                            <span>
                              {task.progress}/{task.target}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                task.completed ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${(task.progress / task.target) * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Status Text */}
                        {task.completed && (
                          <p className="text-sm text-green-700 font-semibold">🎉 Đã hoàn thành!</p>
                        )}
                        {!task.completed && (
                          <p className="text-sm text-gray-600">
                            Cần thêm {task.target - task.progress} để hoàn thành
                          </p>
                        )}
                      </div>

                      {/* Reward */}
                      <div className="text-right">
                        <div className="text-3xl font-bold text-yellow-500 mb-2">{task.badge}</div>
                        <div className="text-lg font-bold text-gray-800">{task.reward} XP</div>
                        {task.completed && (
                          <div className="text-sm text-green-600 font-semibold mt-2">Đã nhận</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <p>Không có thành tích nào. Hãy hoàn thành các bài học để mở khóa!</p>
                </div>
              )}
            </div>

            {/* Tips Section */}
            <div className="mt-12 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">💡 Mẹo</h3>
              <ul className="space-y-3 text-gray-800">
                <li>✓ Các thách thức sẽ được cập nhật mỗi tháng</li>
                <li>✓ Hoàn thành nhiều thách thức để mở khóa huy hiệu</li>
                <li>✓ XP có thể được sử dụng để mở khóa nội dung mới</li>
                <li>✓ Nếu bạn hoàn thành mọi thách thức, bạn sẽ nhận được giải thưởng đặc biệt!</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
