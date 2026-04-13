'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Header from '@/components/Header';
import TopicCard from '@/components/TopicCard';

interface Topic {
  id: number;
  name: string;
  description: string;
  level: string;
  order: number;
}

interface TopicListProps {
  mode: 'quiz' | 'writing' | 'speak';
}

export default function TopicList({ mode }: TopicListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [questionCounts, setQuestionCounts] = useState<Record<number, number>>({});
  const [progressData, setProgressData] = useState<Record<number, { completed: number; total: number; correctCount?: number; score?: number }>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!user) {
      router.push('/login');
      return;
    }

    const fetchTopics = async () => {
      try {
        setLoading(true);
        const level = user.level || 'NEWBIE';
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/topic/by-level/${level}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch topics: ${response.status}`);
        }

        const data = await response.json();
        const topicsData = data.data || [];
        setTopics(topicsData);

        // Fetch progress data for each topic
        const progress: Record<number, { completed: number; total: number; correctCount?: number; score?: number }> = {};
        for (const topic of topicsData) {
          try {
            const progressResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/${mode}/user-progress/${topic.id}`,
              {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              }
            );
            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              const data = progressData.data || {};
              
              // For quiz mode, calculate completed count from score percentage
              // Quiz always has 10 questions
              if (mode === 'quiz') {
                const hasAttempted = data.attempts && data.attempts > 0;
                const totalQuestions = hasAttempted ? 10 : 0;
                const completedCount = hasAttempted ? Math.round((data.score || 0) / 100 * 10) : 0;
                
                progress[topic.id] = {
                  completed: completedCount,
                  total: totalQuestions,
                  correctCount: completedCount,
                  score: data.score,
                };
                console.log(`Progress for topic ${topic.id}:`, progress[topic.id]);
              } else {
                // For non-quiz modes, use the default format
                progress[topic.id] = {
                  completed: data.completedQuestions || 0,
                  total: data.totalQuestions || 0,
                  correctCount: data.correctCount,
                  score: data.score,
                };
              }
            } else {
              console.warn(`Progress endpoint not found for topic ${topic.id}, setting default`);
              progress[topic.id] = { completed: 0, total: 0 };
            }
          } catch (e) {
            console.error(`Error fetching progress for topic ${topic.id}:`, e);
            progress[topic.id] = { completed: 0, total: 0 };
          }
        }
        console.log('All progress data:', progress);
        setProgressData(progress);
      } catch (err) {
        console.error(`Error:`, err);
        setError(err instanceof Error ? err.message : 'Failed to load topics');
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
    
    // Clear the refresh param from URL if it exists
    if (searchParams.get('refresh')) {
      window.history.replaceState({}, '', `/${mode === 'speak' ? 'pronunciation' : mode}`);
    }
  }, [mounted, user, router, mode, searchParams]);

  const getModeInfo = () => {
    switch (mode) {
      case 'quiz':
        return {
          title: 'Trắc Nghiệm',
          subtitle: 'Kiểm tra từ vựng và ngữ pháp',
        };
      case 'writing':
        return {
          title: 'Luyện Viết',
          subtitle: 'Thực hành viết chữ Hangul',
        };
      case 'speak':
        return {
          title: 'Luyện Phát Âm',
          subtitle: 'Cải thiện kỹ năng phát âm',
        };
      default:
        return {
          title: 'Bài Học',
          subtitle: 'Bắt đầu học',
        };
    }
  };

  const handleStartTopic = (topicId: number) => {
    const routePath = mode === 'speak' ? 'pronunciation' : mode;
    router.push(`/${routePath}/${topicId}`);
  };

  const modeInfo = getModeInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-surface-container">
      <Header />

      {/* Header Section */}
      <header className="pt-[70px] pl-[200px] mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-on-background leading-tight tracking-tight">
          {modeInfo.title}
        </h1>
        <p className="text-on-surface-variant font-medium font-body mt-[20px]">{modeInfo.subtitle}</p>
        {mounted && (
          <div className="inline-block text-on-surface-variant font-semibold text-sm mt-4 font-headline">
            Cấp độ: {user?.level || 'N/A'}
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Content */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-fixed border-t-primary"></div>
            <p className="mt-4 text-on-surface-variant font-medium font-body">Đang tải bài học...</p>
          </div>
        ) : error ? (
          <div className="bg-error-container border border-error rounded-2xl p-8 text-center">
            <p className="text-on-error-container font-semibold font-headline mb-4 text-lg">Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-error text-on-error rounded-full font-bold font-headline hover:opacity-90 transition"
            >
              Thử Lại
            </button>
          </div>
        ) : topics.length === 0 ? (
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-8 text-center">
            <p className="text-on-surface-variant font-semibold font-headline text-lg">Không có bài học cho cấp độ này</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {topics.map((topic) => (
              <TopicCard
                key={topic.id}
                {...topic}
                mode={mode as 'quiz' | 'writing' | 'pronunciation'}
                questionCount={questionCounts[topic.id] || 0}
                completedQuestions={progressData[topic.id]?.completed || 0}
                totalQuestions={progressData[topic.id]?.total || 0}
                onClick={() => handleStartTopic(topic.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
