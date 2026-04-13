'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Header from '@/components/Header';
import { Check } from 'lucide-react';

interface SkillProgress {
  done: boolean;
  score?: number;
  attempts: number;
}

interface Topic {
  id: number;
  name: string;
  description: string;
  order: number;
  quiz: SkillProgress;
  writing: SkillProgress;
  pronunciation: SkillProgress;
}

interface LearningPathData {
  level: string;
  totalTopics: number;
  completedSkills: number;
  totalSkills: number;
  progressPercentage: number;
  topics: Topic[];
  xp: number;
  trophy: number;
}

interface AnswerHistory {
  id: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  createdAt: string;
}

export default function LearningMapPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [data, setData] = useState<LearningPathData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // History state
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, AnswerHistory[]>>({});
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchTopics = async () => {
      try {
        setLoading(true);
        console.log('📚 Fetching learning path...');

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/user/learning-path`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch learning path: ${response.status}`);
        }

        const learningPath = await response.json();
        console.log('✅ Learning path fetched:', learningPath);
        setData(learningPath);
        setError('');
      } catch (error: any) {
        console.error('❌ Error fetching learning path:', error);
        setError(error.message || 'Failed to load learning path');
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [token, router]);

  const handleToggleSkill = async (topicId: number, skillType: string) => {
    const key = `${topicId}-${skillType}`;
    
    if (expandedSkill === key) {
      setExpandedSkill(null);
      return;
    }

    setExpandedSkill(key);
    setLoadingHistory(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/learning-path/history?topicId=${topicId}&skillType=${skillType}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const historyData = await response.json();
      console.log(`✅ ${skillType} history fetched:`, historyData.length);
      setHistory((prev) => ({
        ...prev,
        [key]: historyData,
      }));
    } catch (err: any) {
      console.error('❌ Error fetching history:', err);
      setHistory((prev) => ({
        ...prev,
        [key]: [],
      }));
    } finally {
      setLoadingHistory(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf5]">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#72564c] mx-auto mb-4"></div>
            <p className="text-[#504441]">Loading your learning path...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#fafaf5]">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || 'No data available'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#72564c] text-white rounded hover:bg-[#504441]"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf5]">
      <Header />
      <main className="pt-[70px] pl-[200px]">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-extrabold text-[#1a1c19] tracking-tight mb-0">
            Lộ Trình Học Tập
          </h1>
          <p className="text-[#504441] mt-[20px]">
            {data.level} •  {data.completedSkills}/{data.totalSkills} kỹ náng hoàn thành
          </p>
          
          {/* XP & Trophy Stats */}
          <div className="grid grid-cols-2 gap-8 max-w-xs">
            <div>
              <p className="text-sm font-semibold text-[#72564c] mb-2">XP</p>
              <p className="text-3xl font-black text-[#72564c]">{data.xp}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#72564c] mb-2">Trophy</p>
              <p className="text-3xl font-black text-[#72564c]">{data.trophy}</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Progress Bar */}
          <div className="mb-12">
            <div className="w-full h-4 bg-[#e8e8e3] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#72564c] to-[#8d6e63] transition-all duration-300"
                style={{ width: `${data.progressPercentage}%` }}
              />
            </div>
            <p className="text-sm text-[#504441] mt-2">
              {data.progressPercentage}% hoàn thành
            </p>
          </div>

          {/* Topics */}
          <div className="space-y-6">
          {data.topics.map((topic) => (
            <div
              key={topic.id}
              className="bg-white p-6 rounded-lg border border-[#e8e8e3] hover:shadow-md transition-shadow"
            >
              <h3 className="text-xl font-bold text-[#72564c] mb-2">
                {topic.name}
              </h3>
              <p className="text-[#504441] text-sm mb-4">{topic.description}</p>

              {/* Skills Row */}
              <div className="flex gap-4 flex-wrap">
                {/* Quiz */}
                <div className="flex-1 min-w-[140px]">
                  <button
                    onClick={() => handleToggleSkill(topic.id, 'QUIZ')}
                    className={`w-full p-3 rounded-lg text-center transition-all font-bold ${
                      topic.quiz.done
                        ? 'bg-[#c2ebe5] text-[#406561]'
                        : 'bg-[#f4f4ef] text-[#504441] hover:bg-[#e8e8e3]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {topic.quiz.done && <Check size={16} />}
                      <span>Quiz</span>
                      <span className="text-sm">{expandedSkill === `${topic.id}-QUIZ` ? '▼' : '▶'}</span>
                    </div>
                    {topic.quiz.score && (
                      <div className="text-xs mt-1">{topic.quiz.score}%</div>
                    )}
                  </button>

                  {/* Quiz History Dropdown */}
                  {expandedSkill === `${topic.id}-QUIZ` && (
                    <div className="mt-2 bg-white border border-[#e8e8e3] rounded-lg p-4 space-y-3 max-h-80 overflow-y-auto">
                      {loadingHistory ? (
                        <p className="text-[#504441] text-sm">Loading...</p>
                      ) : history[`${topic.id}-QUIZ`]?.length > 0 ? (
                        history[`${topic.id}-QUIZ`].map((item, idx) => (
                          <div key={idx} className="pb-3 border-b border-[#e8e8e3] last:border-0">
                            <p className="text-sm font-semibold text-[#72564c]">{item.question}</p>
                            <p className="text-xs text-[#504441] mt-1">
                              <span className={item.isCorrect ? 'text-green-600' : 'text-red-600'}>
                                Your answer: {item.userAnswer} {item.isCorrect ? '✅' : '❌'}
                              </span>
                            </p>
                            {!item.isCorrect && (
                              <p className="text-xs text-[#504441] mt-1">
                                <span className="text-green-600">Correct: {item.correctAnswer}</span>
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-[#504441] text-sm">No quiz history yet</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Writing */}
                <div className="flex-1 min-w-[140px]">
                  <button
                    onClick={() => handleToggleSkill(topic.id, 'WRITING')}
                    className={`w-full p-3 rounded-lg text-center transition-all font-bold ${
                      topic.writing.done
                        ? 'bg-[#c2ebe5] text-[#406561]'
                        : 'bg-[#f4f4ef] text-[#504441] hover:bg-[#e8e8e3]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {topic.writing.done && <Check size={16} />}
                      <span>Writing</span>
                      <span className="text-sm">{expandedSkill === `${topic.id}-WRITING` ? '▼' : '▶'}</span>
                    </div>
                    {topic.writing.score && (
                      <div className="text-xs mt-1">{topic.writing.score}%</div>
                    )}
                  </button>

                  {/* Writing History Dropdown */}
                  {expandedSkill === `${topic.id}-WRITING` && (
                    <div className="mt-2 bg-white border border-[#e8e8e3] rounded-lg p-4 space-y-3 max-h-80 overflow-y-auto">
                      {loadingHistory ? (
                        <p className="text-[#504441] text-sm">Loading...</p>
                      ) : history[`${topic.id}-WRITING`]?.length > 0 ? (
                        history[`${topic.id}-WRITING`].map((item, idx) => (
                          <div key={idx} className="pb-3 border-b border-[#e8e8e3] last:border-0">
                            <p className="text-sm font-semibold text-[#72564c]">{item.question}</p>
                            <p className="text-xs text-[#504441] mt-1">
                              <span className={item.isCorrect ? 'text-green-600' : 'text-red-600'}>
                                Your answer: {item.userAnswer} {item.isCorrect ? '✅' : '❌'}
                              </span>
                            </p>
                            {!item.isCorrect && (
                              <p className="text-xs text-[#504441] mt-1">
                                <span className="text-green-600">Correct: {item.correctAnswer}</span>
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-[#504441] text-sm">No writing history yet</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Pronunciation */}
                <div className="flex-1 min-w-[140px]">
                  <button
                    onClick={() => handleToggleSkill(topic.id, 'PRONUNCIATION')}
                    className={`w-full p-3 rounded-lg text-center transition-all font-bold ${
                      topic.pronunciation.done
                        ? 'bg-[#c2ebe5] text-[#406561]'
                        : 'bg-[#f4f4ef] text-[#504441] hover:bg-[#e8e8e3]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {topic.pronunciation.done && <Check size={16} />}
                      <span>Speak</span>
                      <span className="text-sm">{expandedSkill === `${topic.id}-PRONUNCIATION` ? '▼' : '▶'}</span>
                    </div>
                    {topic.pronunciation.score && (
                      <div className="text-xs mt-1">{topic.pronunciation.score}%</div>
                    )}
                  </button>

                  {/* Pronunciation History Dropdown */}
                  {expandedSkill === `${topic.id}-PRONUNCIATION` && (
                    <div className="mt-2 bg-white border border-[#e8e8e3] rounded-lg p-4 space-y-3 max-h-80 overflow-y-auto">
                      {loadingHistory ? (
                        <p className="text-[#504441] text-sm">Loading...</p>
                      ) : history[`${topic.id}-PRONUNCIATION`]?.length > 0 ? (
                        history[`${topic.id}-PRONUNCIATION`].map((item, idx) => (
                          <div key={idx} className="pb-3 border-b border-[#e8e8e3] last:border-0">
                            <p className="text-sm font-semibold text-[#72564c]">{item.question}</p>
                            <p className="text-xs text-[#504441] mt-1">
                              <span className={item.isCorrect ? 'text-green-600' : 'text-red-600'}>
                                Your answer: {item.userAnswer} {item.isCorrect ? '✅' : '❌'}
                              </span>
                            </p>
                            {!item.isCorrect && (
                              <p className="text-xs text-[#504441] mt-1">
                                <span className="text-green-600">Correct: {item.correctAnswer}</span>
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-[#504441] text-sm">No speaking history yet</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>

      </main>
    </div>
  );
}