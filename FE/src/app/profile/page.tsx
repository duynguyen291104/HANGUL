'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, LogOut, Medal, Shield, UserRound } from 'lucide-react';
import {
  HangulCard,
  HangulPageFrame,
  HangulSidebar,
  Pill,
  ProfileOrb,
  ProgressBar,
  SectionLabel,
  getLevelMeta,
  getSidebarItems,
} from '@/components/hangul/ui';
import { achievementService, userService } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

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

const friends = [
  { name: 'Ji-hun', status: 'Last active 2h ago', action: 'Wave' },
  { name: 'Emma', status: 'Learning verbs', action: 'Wave' },
];

export default function ProfilePage() {
  const { user, token, logout } = useAuthStore();
  const router = useRouter();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile>({
    id: 0,
    name: user?.name || 'Sam the Student',
    email: user?.email || 'hello@otter.edu',
    level: user?.level || 'BEGINNER',
    totalXP: user?.totalXP || 0,
    streakDays: 12,
    completedQuizzes: 34,
    learnedVocabulary: 342,
  });

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const loadProfileData = async () => {
      try {
        setLoading(true);
        const profileResponse = await userService.getProfile();
        setProfileData(profileResponse.user || profileResponse);

        const achievementsResponse = await achievementService.getUnlocked();
        const formattedAchievements = (achievementsResponse.achievements || []).map((achievement: any) => ({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          badge: achievement.badge || '🏆',
          unlockedAt: achievement.unlockedAt
            ? new Date(achievement.unlockedAt).toLocaleDateString('vi-VN')
            : 'Recently unlocked',
        }));
        setAchievements(
          formattedAchievements.length > 0
            ? formattedAchievements
            : [
                { id: 1, name: 'Early Bird', description: '10 lessons before 8am', badge: '🏆', unlockedAt: 'This week' },
                { id: 2, name: 'Otter Pal', description: 'Shared 5 updates', badge: '🐾', unlockedAt: 'This week' },
                { id: 3, name: 'Speed Learner', description: 'Perfect quiz score', badge: '⚡', unlockedAt: 'This month' },
                { id: 4, name: 'Polyglot', description: 'Locked badge', badge: '📖', unlockedAt: 'Locked' },
                { id: 5, name: 'Champion', description: 'Locked badge', badge: '⭐', unlockedAt: 'Locked' },
              ]
        );
      } catch (requestError) {
        console.error(requestError);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [router, token]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await userService.updateProfile({ name: profileData.name, email: profileData.email });
      setIsEditing(false);
    } catch (requestError) {
      console.error(requestError);
    } finally {
      setSaving(false);
    }
  };

  const levelMeta = getLevelMeta(profileData.level);
  const xpTarget = 3000;
  const levelProgress = useMemo(() => Math.min(100, Math.round((profileData.totalXP / xpTarget) * 100)), [profileData.totalXP]);

  if (loading) {
    return (
      <HangulPageFrame
        activeNav="Library"
        sidebar={<HangulSidebar items={getSidebarItems('friends')} profile={{ title: 'Loading profile', subtitle: 'Fetching latest stats', emoji: '🦦', tone: 'paper' }} />}
      >
        <HangulCard className="grid min-h-[70vh] place-items-center p-10">
          <div className="text-center">
            <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-[rgba(140,103,88,0.12)] border-t-[var(--hangul-accent)]" />
            <p className="mt-5 text-lg text-[var(--hangul-soft-ink)]">Loading your profile...</p>
          </div>
        </HangulCard>
      </HangulPageFrame>
    );
  }

  return (
    <HangulPageFrame
      activeNav="Library"
      sidebar={
        <HangulSidebar
          items={getSidebarItems('friends')}
          profile={{
            title: `${levelMeta.step}: ${levelMeta.label}`,
            subtitle: `Next: ${levelMeta.next}`,
            emoji: '🦦',
            tone: 'paper',
          }}
        />
      }
    >
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.5fr]">
          <HangulCard className="p-8 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.36fr_0.64fr] lg:items-center">
              <div className="flex justify-center">
                <ProfileOrb emoji="🧑" />
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className="text-[clamp(3rem,5vw,5rem)] font-black tracking-[-0.06em] text-[var(--hangul-ink)]">{profileData.name}</h1>
                    <p className="mt-2 text-2xl text-[var(--hangul-soft-ink)]">Joined January 2024 • {levelMeta.label}</p>
                  </div>
                  <Pill className="bg-[#f7efe1] text-[var(--hangul-accent)]">
                    <Medal className="h-4 w-4" />
                    Master Rank
                  </Pill>
                </div>
                <div className="mt-10 flex items-center justify-between gap-4 text-lg font-semibold text-[var(--hangul-soft-ink)]">
                  <span>{levelMeta.step.toUpperCase()}</span>
                  <span>{profileData.totalXP.toLocaleString()} / {xpTarget.toLocaleString()} XP</span>
                </div>
                <ProgressBar className="mt-4 h-5" value={levelProgress} />
              </div>
            </div>
          </HangulCard>

          <HangulCard className="p-8">
            <SectionLabel>Stats Summary</SectionLabel>
            <div className="mt-8 space-y-8">
              <ProfileStat accent="bg-[#ffebc8] text-[#a36a00]" label="Day Streak" title={`${profileData.streakDays} Days`} />
              <ProfileStat accent="bg-[#ffd8cf] text-[#9a5f52]" label="Words Mastered" title={`${profileData.learnedVocabulary} Words`} />
              <ProfileStat accent="bg-[#d6f6f2] text-[#2e6764]" label="Arena Wins" title={`${Math.max(58, Math.round(profileData.totalXP / 42))} Wins`} />
            </div>
          </HangulCard>
        </div>

        <HangulCard className="p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-4xl font-black tracking-[-0.05em] text-[var(--hangul-ink)]">Achievement Badges</h2>
            <button className="text-xl font-semibold text-[var(--hangul-soft-ink)]" type="button">
              View All
            </button>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            {achievements.slice(0, 5).map((achievement) => (
              <div key={achievement.id} className="rounded-[30px] bg-white/72 px-6 py-8 text-center shadow-[0_18px_40px_rgba(121,95,78,0.08)]">
                <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[rgba(121,95,78,0.06)] text-5xl">
                  <span>{achievement.badge}</span>
                </div>
                <p className="mt-6 text-2xl font-black tracking-[-0.04em] text-[var(--hangul-ink)]">{achievement.name}</p>
                <p className="mt-3 text-base leading-7 text-[var(--hangul-soft-ink)]">{achievement.description}</p>
              </div>
            ))}
          </div>
        </HangulCard>

        <div className="grid gap-6 xl:grid-cols-2">
          <HangulCard className="p-8">
            <h2 className="text-3xl font-black tracking-[-0.04em] text-[var(--hangul-ink)]">Account Settings</h2>
            <div className="mt-8 space-y-4">
              {isEditing ? (
                <div className="space-y-4 rounded-[30px] bg-white/72 p-6">
                  <input className="hangul-input" onChange={(event) => setProfileData((current) => ({ ...current, name: event.target.value }))} value={profileData.name} />
                  <input className="hangul-input" onChange={(event) => setProfileData((current) => ({ ...current, email: event.target.value }))} value={profileData.email} />
                  <div className="flex flex-wrap gap-3">
                    <button className="hangul-button-primary" disabled={saving} onClick={handleSave} type="button">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button className="hangul-button-secondary" onClick={() => setIsEditing(false)} type="button">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <SettingRow icon={<UserRound className="h-5 w-5" />} label="Personal Information" onClick={() => setIsEditing(true)} />
                  <SettingRow icon={<Shield className="h-5 w-5" />} label="Privacy & Security" onClick={() => setIsEditing(true)} />
                  <button className="flex w-full items-center justify-between rounded-[26px] bg-white/72 px-6 py-5 text-left" onClick={() => { logout(); router.push('/'); }} type="button">
                    <span className="flex items-center gap-3 text-xl font-semibold text-[#be4f46]">
                      <LogOut className="h-5 w-5" />
                      Logout
                    </span>
                    <ChevronRight className="h-5 w-5 text-[var(--hangul-soft-ink)]" />
                  </button>
                </>
              )}
            </div>
          </HangulCard>

          <HangulCard className="p-8">
            <h2 className="text-3xl font-black tracking-[-0.04em] text-[var(--hangul-ink)]">Otter Friends</h2>
            <div className="mt-8 space-y-5">
              {friends.map((friend) => (
                <div key={friend.name} className="flex items-center justify-between gap-4 rounded-[28px] bg-white/72 px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-[linear-gradient(145deg,#101318,#27323d)] text-2xl text-white">🧑</div>
                    <div>
                      <p className="text-xl font-bold text-[var(--hangul-ink)]">{friend.name}</p>
                      <p className="text-base text-[var(--hangul-soft-ink)]">{friend.status}</p>
                    </div>
                  </div>
                  <button className="rounded-full bg-[#ffe9de] px-5 py-2 text-sm font-semibold text-[var(--hangul-accent)]" type="button">
                    {friend.action}
                  </button>
                </div>
              ))}
            </div>
            <button className="hangul-button-secondary mt-8 w-full justify-center">Find More Friends</button>
          </HangulCard>
        </div>
      </div>
    </HangulPageFrame>
  );
}

function ProfileStat({ accent, label, title }: { accent: string; label: string; title: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className={`grid h-16 w-16 place-items-center rounded-full text-xl ${accent}`}>•</div>
      <div>
        <p className="text-[2.1rem] font-black tracking-[-0.04em] text-[var(--hangul-ink)]">{title}</p>
        <p className="text-lg text-[var(--hangul-soft-ink)]">{label}</p>
      </div>
    </div>
  );
}

function SettingRow({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button className="flex w-full items-center justify-between rounded-[26px] bg-white/72 px-6 py-5 text-left" onClick={onClick} type="button">
      <span className="flex items-center gap-3 text-xl font-semibold text-[var(--hangul-ink)]">
        {icon}
        {label}
      </span>
      <ChevronRight className="h-5 w-5 text-[var(--hangul-soft-ink)]" />
    </button>
  );
}

