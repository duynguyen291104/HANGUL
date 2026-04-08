'use client';

import React from 'react';

interface RankCardProps {
  rankTier: string;
  trophy: number;
  nextTierTrophy?: number;
  compact?: boolean;
}

const getRankConfig = (tier: string) => {
  const configs: Record<string, any> = {
    BRONZE: {
      emoji: '🥉',
      color: 'from-orange-400 to-orange-600',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-300',
      displayName: 'Bronze',
    },
    SILVER: {
      emoji: '🥈',
      color: 'from-gray-300 to-gray-500',
      textColor: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-300',
      displayName: 'Silver',
    },
    GOLD: {
      emoji: '🥇',
      color: 'from-yellow-300 to-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
      displayName: 'Gold',
    },
    PLATINUM: {
      emoji: '💎',
      color: 'from-purple-300 to-purple-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-300',
      displayName: 'Platinum',
    },
    DIAMOND: {
      emoji: '👑',
      color: 'from-blue-400 to-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      displayName: 'Diamond',
    },
  };

  return configs[tier] || configs.BRONZE;
};

const getTrophyProgress = (
  trophy: number,
  tier: string
): { current: number; max: number; percentage: number } => {
  const trophyRanges: Record<string, [number, number]> = {
    BRONZE: [0, 499],
    SILVER: [500, 999],
    GOLD: [1000, 1999],
    PLATINUM: [2000, 3999],
    DIAMOND: [4000, 9999],
  };

  const [min, max] = trophyRanges[tier] || [0, 499];
  const current = Math.max(0, trophy - min);
  const range = max - min;
  const percentage = Math.min(100, Math.round((current / range) * 100));

  return { current, max: range, percentage };
};

export default function RankCard({
  rankTier,
  trophy,
  nextTierTrophy,
  compact = false,
}: RankCardProps) {
  const config = getRankConfig(rankTier);
  const progress = getTrophyProgress(trophy, rankTier);

  const widthClass = compact ? 'w-64' : 'max-w-sm';
  const paddingClass = compact ? 'p-4' : 'p-6';
  const iconSizeClass = compact ? 'text-3xl' : 'text-4xl';
  const titleSizeClass = compact ? 'text-lg' : 'text-2xl';
  const textSizeClass = compact ? 'text-xs' : 'text-sm';

  return (
    <div
      className={`${widthClass} bg-white rounded-xl shadow-lg border-2 ${config.borderColor} overflow-hidden hover:shadow-xl transition-shadow duration-300`}
    >
      {/* Header with gradient */}
      <div className={`bg-gradient-to-r ${config.color} ${paddingClass} text-white`}>
        <div className="flex items-center gap-3 mb-2">
          <span className={iconSizeClass}>{config.emoji}</span>
          <h3 className={`${titleSizeClass} font-bold font-['Plus_Jakarta_Sans']`}>
            {config.displayName}
          </h3>
        </div>
        <p className={`${textSizeClass} opacity-90`}>Rank Tier</p>
      </div>

      {/* Body */}
      <div className={paddingClass}>
        {/* Trophy count */}
        <div className="mb-4">
          <p className={`${textSizeClass} text-[#504441] mb-1`}>Current Trophy</p>
          <p className="text-2xl font-bold text-[#72564c]">
            {trophy.toLocaleString()} 🏆
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className={`${textSizeClass} text-[#504441] font-semibold`}>Progress</p>
            <p className={`${textSizeClass} text-[#72564c] font-bold`}>
              {progress.percentage}%
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`bg-gradient-to-r ${config.color} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
          <p className={`${textSizeClass} text-[#8d6e63] mt-1`}>
            {progress.current} / {progress.max}
          </p>
        </div>

        {/* Next tier info */}
        {rankTier !== 'DIAMOND' && nextTierTrophy ? (
          <div className={`${config.bgColor} rounded-lg ${paddingClass} border border-${config.borderColor}`}>
            <p className={`${textSizeClass} ${config.textColor} mb-1`}>Next Tier</p>
            <p className="font-bold text-[#1a1c19]">
              {nextTierTrophy.toLocaleString()} Trophy needed
            </p>
          </div>
        ) : rankTier === 'DIAMOND' ? (
          <div className={`${config.bgColor} rounded-lg ${paddingClass} text-center border border-${config.borderColor}`}>
            <p className="font-bold text-[#1a1c19] text-lg">🏆 MAX RANK!</p>
            <p className={`${textSizeClass} ${config.textColor}`}>You've reached the peak!</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
