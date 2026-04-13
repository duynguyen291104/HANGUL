'use client';

import { ArrowRight } from 'lucide-react';

interface TopicCardProps {
  id: number;
  name: string;
  description: string;
  level: string;
  order: number;
  mode: 'quiz' | 'writing' | 'pronunciation';
  questionCount?: number;
  completedQuestions?: number;
  totalQuestions?: number;
  onClick: () => void;
}

export default function TopicCard({
  id,
  name,
  description,
  level,
  order,
  mode,
  questionCount = 0,
  completedQuestions = 0,
  totalQuestions = 0,
  onClick,
}: TopicCardProps) {
  // Color mapping based on mode and topic
  const getIconAndColor = () => {
    // Unified brown color for all modes
    const colorMap: Record<string, { icon: string; bgColor: string; textColor: string; accentColor: string }> = {
      'quiz-0': { icon: '', bgColor: 'bg-primary-fixed', textColor: 'text-primary', accentColor: 'from-primary-fixed-dim to-primary' },
      'quiz-1': { icon: '', bgColor: 'bg-primary-fixed', textColor: 'text-primary', accentColor: 'from-primary-fixed-dim to-primary' },
      'quiz-2': { icon: '', bgColor: 'bg-primary-fixed', textColor: 'text-primary', accentColor: 'from-primary-fixed-dim to-primary' },
      'writing-0': { icon: '', bgColor: 'bg-primary-fixed', textColor: 'text-primary', accentColor: 'from-primary-fixed-dim to-primary' },
      'writing-1': { icon: '', bgColor: 'bg-primary-fixed', textColor: 'text-primary', accentColor: 'from-primary-fixed-dim to-primary' },
      'writing-2': { icon: '', bgColor: 'bg-primary-fixed', textColor: 'text-primary', accentColor: 'from-primary-fixed-dim to-primary' },
      'pronunciation-0': { icon: '', bgColor: 'bg-primary-fixed', textColor: 'text-primary', accentColor: 'from-primary-fixed-dim to-primary' },
      'pronunciation-1': { icon: '', bgColor: 'bg-primary-fixed', textColor: 'text-primary', accentColor: 'from-primary-fixed-dim to-primary' },
      'pronunciation-2': { icon: '', bgColor: 'bg-primary-fixed', textColor: 'text-primary', accentColor: 'from-primary-fixed-dim to-primary' },
    };

    const key = `${mode}-${order % 3}`;
    return colorMap[key] || colorMap['quiz-0'];
  };

  const { icon, bgColor, textColor, accentColor } = getIconAndColor();

  const getModeLabel = () => {
    switch (mode) {
      case 'quiz':
        return 'TRẮC NGHIỆM';
      case 'writing':
        return 'LUYỆN VIẾT';
      case 'pronunciation':
        return 'LUYỆN PHÁT ÂM';
      default:
        return 'BÀI HỌC';
    }
  };

  const getLevelBadgeClass = () => {
    const baseBadge = 'px-3 py-1 text-xs font-bold rounded-full';
    // Unified brown color for all levels - no background
    return `${baseBadge} text-on-primary-fixed`;
  };

  const getProgressText = () => {
    // If no total questions info, show "not started"
    if (!totalQuestions || totalQuestions === 0) {
      return 'tiến độ: chưa làm';
    }
    
    // Show progress with X/X format
    return `${completedQuestions}/${totalQuestions}`;
  };

  return (
    <div className="bg-surface-container-low p-6 rounded-lg flex flex-col group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-outline-variant/20">
      {/* Title */}
      <h3 className="text-2xl font-extrabold font-headline text-on-surface mb-auto">
        {name}
      </h3>

      {/* Progress */}
      <p className="text-sm text-on-surface-variant font-body mt-4 mb-4">
        {getProgressText()}
      </p>

      {/* Button */}
      <div className="mt-auto">
        <button
          onClick={onClick}
          className={`w-full bg-gradient-to-r ${accentColor} text-white px-6 py-3 rounded-full font-bold shadow-lg hover:shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap font-headline`}
        >
          Bắt đầu
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
