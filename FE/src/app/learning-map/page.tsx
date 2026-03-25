'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LearningNode {
  id: number;
  title: string;
  description: string;
  level: 'NEWBIE' | 'BEGINNER' | 'INTERMEDIATE' | 'UPPER' | 'ADVANCED';
  completed: boolean;
  progress: number;
  tasks: number;
  link: string;
}

const learningPath: LearningNode[] = [
  {
    id: 1,
    title: 'Học Chữ Cơ Bản',
    description: 'Tìm hiểu các chữ cái Hangul và phát âm cơ bản',
    level: 'NEWBIE',
    completed: true,
    progress: 100,
    tasks: 8,
    link: '/level-selection',
  },
  {
    id: 2,
    title: 'Từ Vựng Hàng Ngày',
    description: 'Học những từ vựng thường dùng trong cuộc sống',
    level: 'NEWBIE',
    completed: true,
    progress: 85,
    tasks: 15,
    link: '/vocabulary',
  },
  {
    id: 3,
    title: 'Phát Âm Chuẩn',
    description: 'Luyện tập phát âm chính xác như người bản xứ',
    level: 'BEGINNER',
    completed: false,
    progress: 45,
    tasks: 12,
    link: '/pronunciation',
  },
  {
    id: 4,
    title: 'Viết Chữ Hangul',
    description: 'Luyện kỹ năng viết tay những chữ cái Hangul',
    level: 'BEGINNER',
    completed: false,
    progress: 30,
    tasks: 20,
    link: '/writing',
  },
  {
    id: 5,
    title: 'Quiz Tiếng Hàn',
    description: 'Kiểm tra kiến thức qua các bài tập trắc nghiệm',
    level: 'BEGINNER',
    completed: false,
    progress: 60,
    tasks: 25,
    link: '/quiz',
  },
  {
    id: 6,
    title: 'Luyện Nghe',
    description: 'Cải thiện khả năng nghe hiểu tiếng Hàn',
    level: 'INTERMEDIATE',
    completed: false,
    progress: 0,
    tasks: 18,
    link: '/listening',
  },
  {
    id: 7,
    title: 'Nhận Diện Hình Ảnh',
    description: 'Học từ vựng thông qua nhận diện hình ảnh',
    level: 'INTERMEDIATE',
    completed: false,
    progress: 0,
    tasks: 30,
    link: '/camera',
  },
  {
    id: 8,
    title: 'Giải Đấu Tiếng Hàn',
    description: 'Cạnh tranh với những người học khác',
    level: 'ADVANCED',
    completed: false,
    progress: 0,
    tasks: 5,
    link: '/tournament',
  },
];

const levelColors: Record<string, { bg: string; text: string; border: string }> = {
  NEWBIE: { bg: '#fff3cd', text: '#856404', border: '#ffc107' },
  BEGINNER: { bg: '#d1ecf1', text: '#0c5460', border: '#17a2b8' },
  INTERMEDIATE: { bg: '#d4edda', text: '#155724', border: '#28a745' },
  UPPER: { bg: '#f8d7da', text: '#721c24', border: '#dc3545' },
  ADVANCED: { bg: '#e2e3e5', text: '#383d41', border: '#6c757d' },
};

const levelLabels: Record<string, string> = {
  NEWBIE: ' Sơ Cấp',
  BEGINNER: ' Cơ Bản',
  INTERMEDIATE: '⚡ Trung Cấp',
  UPPER: '🔥 Nâng Cao',
  ADVANCED: '👑 Chuyên Sâu',
};

export default function LearningMapPage() {
  const { token, user, setUser } = useAuthStore();
  const router = useRouter();
  const [nodes] = useState<LearningNode[]>(learningPath);
  const [currentLevel, setCurrentLevel] = useState<string>('NEWBIE');
  const [stats, setStats] = useState({ totalCompleted: 0, totalProgress: 0 });
  const [changingLevel, setChangingLevel] = useState(false);
  const [selectedNewLevel, setSelectedNewLevel] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    // Set current level from user
    if (user?.level) {
      setCurrentLevel(user.level);
    }

    // Calculate stats
    const completed = nodes.filter(n => n.completed).length;
    const avgProgress = Math.round(nodes.reduce((sum, n) => sum + n.progress, 0) / nodes.length);
    setStats({ totalCompleted: completed, totalProgress: avgProgress });
  }, [token, router, nodes, user]);

  const handleLevelChange = async (newLevel: string) => {
    setSelectedNewLevel(newLevel);
    const confirmed = window.confirm(
      ` Bạn có chắc muốn thay đổi mức độ từ ${levelLabels[currentLevel]} sang ${levelLabels[newLevel]}?\n\nLưu ý: Tiến độ hiện tại có thể bị ảnh hưởng.`
    );

    if (!confirmed) {
      setSelectedNewLevel(null);
      return;
    }

    setChangingLevel(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/update-level`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ level: newLevel }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể thay đổi mức độ');
      }

      const data = await response.json();
      console.log(' Cấp độ đã cập nhật:', data);

      // Update local state
      setCurrentLevel(newLevel);

      // Update user in store
      if (user) {
        setUser({
          ...user,
          level: newLevel,
        });
      }

      alert(` Mức độ đã được thay đổi thành ${levelLabels[newLevel]}`);
    } catch (error: any) {
      console.error('Lỗi cập nhật cấp độ:', error);
      alert(` Lỗi: ${error.message}`);
    } finally {
      setChangingLevel(false);
      setSelectedNewLevel(null);
    }
  };

  const currentLevelNodes = nodes.filter(n => n.level === currentLevel);
  const nextLevelIndex = Object.keys(levelLabels).indexOf(currentLevel);
  const isLastLevel = nextLevelIndex === Object.keys(levelLabels).length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2 mb-6 hover:opacity-80 w-fit">
            <span className="text-2xl">←</span>
            <span>Quay lại</span>
          </Link>
          <h1 className="text-4xl font-bold mb-3"> Lộ Trình Học Tập</h1>
          <p className="text-purple-100 text-lg">Theo dõi hành trình học tiếng Hàn của bạn</p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow">
            <p className="text-gray-600 text-sm mb-2">Chủ Đề Hoàn Thành</p>
            <p className="text-3xl font-bold text-purple-600">{stats.totalCompleted}/{nodes.length}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <p className="text-gray-600 text-sm mb-2">Tiến Độ Trung Bình</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalProgress}%</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow">
            <p className="text-gray-600 text-sm mb-2">Cấp Độ Hiện Tại</p>
            <p className="text-3xl font-bold text-green-600">{levelLabels[user?.level || 'NEWBIE']}</p>
          </div>
        </div>

        {/* Level Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-700 font-semibold">Chọn Cấp Độ</p>
            {currentLevel !== user?.level && (
              <p className="text-sm text-blue-600 font-semibold">💡 Bạn có thể thay đổi mức độ của mình tại đây</p>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(levelLabels).map(([level, label]) => (
              <button
                key={level}
                onClick={() => handleLevelChange(level)}
                disabled={changingLevel}
                className={`p-3 rounded-lg font-semibold transition ${
                  currentLevel === level
                    ? 'ring-2 ring-offset-2 ring-purple-600'
                    : 'opacity-60 hover:opacity-80'
                } ${changingLevel && selectedNewLevel === level ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{
                  background: levelColors[level].bg,
                  color: levelColors[level].text,
                  borderColor: levelColors[level].border,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Learning Nodes */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {levelLabels[currentLevel]} - {currentLevelNodes.length} Chủ Đề
          </h2>

          {currentLevelNodes.map((node) => (
            <div
              key={node.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Number & Icon */}
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl"
                    style={{
                      background: levelColors[node.level].bg,
                      borderLeft: `4px solid ${levelColors[node.level].border}`,
                    }}
                  >
                    {node.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{node.title}</h3>
                      {node.completed && (
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                           Hoàn Thành
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-4">{node.description}</p>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Tiến độ</span>
                        <span className="text-sm font-semibold text-gray-700">{node.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${node.progress}%`,
                            background: `linear-gradient(90deg, ${levelColors[node.level].border}, #06b6d4)`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <p className="text-sm text-gray-500">
                      {node.tasks} nhiệm vụ
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <Link
                  href={node.link}
                  className="ml-4 px-6 py-3 rounded-lg font-semibold transition text-white whitespace-nowrap"
                  style={{ background: levelColors[node.level].border }}
                >
                  {node.completed ? '🔄 Ôn Tập' : '▶ Bắt Đầu'}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-3">🎯 Tiếp Tục Hành Trình Của Bạn</h3>
          <p className="text-gray-700 mb-6">
            Hãy hoàn thành tất cả các chủ đề để trở thành chuyên gia tiếng Hàn!
          </p>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              ✨ Hoàn thành tất cả {nodes.length} chủ đề để nhận <span className="font-bold">Huy hiệu Thành Thạo</span>
            </div>
            {!isLastLevel && (
              <div className="text-sm text-gray-600">
                 Tiến độ của bạn: <span className="font-bold">{stats.totalProgress}%</span> -
                {stats.totalProgress < 50 ? ' Hãy cố gắng thêm!' : ' Bạn đang tiến bộ tốt!'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
