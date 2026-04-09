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
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
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

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    try {
      setSaving(true);
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password changed successfully!');
    } catch (requestError: any) {
      console.error(requestError);
      alert(requestError.message || 'Failed to change password');
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
          <HangulCard className="p-8 sm:p-10 bg-gradient-to-br from-white to-[#fef7f0] shadow-xl border-0">
            <div className="grid gap-8 lg:grid-cols-[0.36fr_0.64fr] lg:items-center">
              <div className="flex justify-center">
                <div className="relative">
                  <ProfileOrb emoji="🧑" />
                  <div className="absolute -bottom-2 -right-2 bg-[#815300] text-white rounded-full p-2 shadow-lg">
                    <Medal className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className="text-[clamp(3rem,5vw,5rem)] font-black tracking-[-0.06em] text-[var(--hangul-ink)] bg-gradient-to-r from-[#72564c] to-[#a36a00] bg-clip-text text-transparent">
                      {profileData.name}
                    </h1>
                    <p className="mt-2 text-2xl text-[var(--hangul-soft-ink)] flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Joined January 2024 • {levelMeta.label}
                    </p>
                  </div>
                  <Pill className="bg-gradient-to-r from-[#f7efe1] to-[#ffe9de] text-[var(--hangul-accent)] shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <Medal className="h-4 w-4" />
                    Master Rank
                  </Pill>
                </div>
                <div className="mt-10 flex items-center justify-between gap-4 text-lg font-semibold text-[var(--hangul-soft-ink)]">
                  <span className="bg-[#f0f0f0] px-4 py-2 rounded-full">{levelMeta.step.toUpperCase()}</span>
                  <span className="text-right">
                    <span className="text-2xl font-bold text-[#72564c]">{profileData.totalXP.toLocaleString()}</span> / {xpTarget.toLocaleString()} XP
                  </span>
                </div>
                <ProgressBar className="mt-4 h-6 bg-[#f0f0f0] rounded-full overflow-hidden shadow-inner" value={levelProgress} />
                <p className="mt-3 text-sm text-[var(--hangul-soft-ink)] text-center">
                  {xpTarget - profileData.totalXP} XP to next level
                </p>
              </div>
            </div>
          </HangulCard>

          <HangulCard className="p-8 bg-gradient-to-br from-[#fff8f0] to-[#fef2e8] shadow-xl border-0">
            <div className="text-2xl font-bold text-[#72564c]">Stats Summary</div>
            <div className="mt-8 space-y-8">
              <ProfileStat 
                accent="bg-gradient-to-r from-[#ffebc8] to-[#ffd4a3] text-[#a36a00] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" 
                icon="🔥"
                label="Day Streak" 
                title={`${profileData.streakDays} Days`} 
              />
              <ProfileStat 
                accent="bg-gradient-to-r from-[#ffd8cf] to-[#ffb3a7] text-[#9a5f52] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" 
                icon="📚"
                label="Words Mastered" 
                title={`${profileData.learnedVocabulary} Words`} 
              />
              <ProfileStat 
                accent="bg-gradient-to-r from-[#d6f6f2] to-[#a8edea] text-[#2e6764] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" 
                icon="🏆"
                label="Arena Wins" 
                title={`${Math.max(58, Math.round(profileData.totalXP / 42))} Wins`} 
              />
            </div>
          </HangulCard>
        </div>

        <HangulCard className="p-8 bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] shadow-xl border-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-4xl font-black tracking-[-0.05em] text-[var(--hangul-ink)] bg-gradient-to-r from-[#72564c] to-[#a36a00] bg-clip-text text-transparent">
              Achievement Badges
            </h2>
            <button className="text-xl font-semibold text-[var(--hangul-accent)] hover:text-[#a36a00] transition-colors duration-300 hover:underline" type="button">
              View All →
            </button>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            {achievements.slice(0, 5).map((achievement) => (
              <div key={achievement.id} className="group rounded-[30px] bg-white/80 backdrop-blur-sm px-6 py-8 text-center shadow-[0_18px_40px_rgba(121,95,78,0.08)] hover:shadow-[0_25px_60px_rgba(121,95,78,0.15)] transition-all duration-300 hover:scale-105 hover:bg-white/90 border border-white/50">
                <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-[#fef7f0] to-[#f7efe1] text-5xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <span className="group-hover:scale-110 transition-transform duration-300">{achievement.badge}</span>
                </div>
                <p className="mt-6 text-2xl font-black tracking-[-0.04em] text-[var(--hangul-ink)] group-hover:text-[#72564c] transition-colors duration-300">{achievement.name}</p>
                <p className="mt-3 text-base leading-7 text-[var(--hangul-soft-ink)]">{achievement.description}</p>
                <p className="mt-2 text-sm text-[#a36a00] font-medium">{achievement.unlockedAt}</p>
              </div>
            ))}
          </div>
        </HangulCard>

        <div className="grid gap-6 xl:grid-cols-2">
          <HangulCard className="p-8 bg-gradient-to-br from-[#fefefe] to-[#f8f9fa] shadow-xl border-0">
            <h2 className="text-3xl font-black tracking-[-0.04em] text-[var(--hangul-ink)] bg-gradient-to-r from-[#72564c] to-[#a36a00] bg-clip-text text-transparent">
              Account Settings
            </h2>
            <div className="mt-8 space-y-4">
              {isEditing ? (
                <div className="space-y-6 rounded-[30px] bg-gradient-to-br from-white/80 to-[#fef7f0]/80 backdrop-blur-sm p-8 shadow-lg border border-white/50">
                  <div className="space-y-2">
                    <label className="text-lg font-semibold text-[var(--hangul-ink)]">Full Name</label>
                    <input 
                      className="w-full px-4 py-3 rounded-2xl border-2 border-[#e8e8e3] focus:border-[#815300] focus:ring-2 focus:ring-[#815300]/20 transition-all duration-300 bg-white/70 backdrop-blur-sm text-lg" 
                      onChange={(event) => setProfileData((current) => ({ ...current, name: event.target.value }))} 
                      value={profileData.name}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-lg font-semibold text-[var(--hangul-ink)]">Email Address</label>
                    <input 
                      type="email"
                      className="w-full px-4 py-3 rounded-2xl border-2 border-[#e8e8e3] focus:border-[#815300] focus:ring-2 focus:ring-[#815300]/20 transition-all duration-300 bg-white/70 backdrop-blur-sm text-lg" 
                      onChange={(event) => setProfileData((current) => ({ ...current, email: event.target.value }))} 
                      value={profileData.email}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 pt-4">
                    <button 
                      className="px-8 py-3 bg-gradient-to-r from-[#815300] to-[#a36a00] text-white rounded-2xl font-bold hover:from-[#a36a00] hover:to-[#c47a00] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" 
                      disabled={saving} 
                      onClick={handleSave} 
                      type="button"
                    >
                      {saving ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Saving...
                        </div>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                    <button 
                      className="px-8 py-3 bg-white/80 text-[var(--hangul-ink)] rounded-2xl font-bold hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border-2 border-[#e8e8e3]" 
                      onClick={() => setIsEditing(false)} 
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <SettingRow 
                    icon={<UserRound className="h-5 w-5" />} 
                    label="Personal Information" 
                    description="Update your name and email"
                    onClick={() => setIsEditing(true)} 
                  />
                  <SettingRow 
                    icon={<Shield className="h-5 w-5" />} 
                    label="Change Password" 
                    description="Update your account password"
                    onClick={() => setIsChangingPassword(true)} 
                  />
                  <button 
                    className="flex w-full items-center justify-between rounded-[26px] bg-gradient-to-r from-[#ffe9de] to-[#ffd8cf] hover:from-[#ffd8cf] hover:to-[#ffb3a7] px-6 py-5 text-left transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] group" 
                    onClick={() => { logout(); router.push('/'); }} 
                    type="button"
                  >
                    <span className="flex items-center gap-3 text-xl font-semibold text-[#be4f46] group-hover:text-[#a33d35]">
                      <LogOut className="h-5 w-5" />
                      Logout
                    </span>
                    <ChevronRight className="h-5 w-5 text-[var(--hangul-soft-ink)] group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </>
              )}

              {isChangingPassword && (
                <div className="space-y-6 rounded-[30px] bg-gradient-to-br from-white/80 to-[#fef7f0]/80 backdrop-blur-sm p-8 shadow-lg border border-white/50 mt-6">
                  <h3 className="text-2xl font-bold text-[var(--hangul-ink)]">Change Password</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-lg font-semibold text-[var(--hangul-ink)]">Current Password</label>
                      <input 
                        type="password"
                        className="w-full px-4 py-3 rounded-2xl border-2 border-[#e8e8e3] focus:border-[#815300] focus:ring-2 focus:ring-[#815300]/20 transition-all duration-300 bg-white/70 backdrop-blur-sm text-lg" 
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter current password"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-lg font-semibold text-[var(--hangul-ink)]">New Password</label>
                      <input 
                        type="password"
                        className="w-full px-4 py-3 rounded-2xl border-2 border-[#e8e8e3] focus:border-[#815300] focus:ring-2 focus:ring-[#815300]/20 transition-all duration-300 bg-white/70 backdrop-blur-sm text-lg" 
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-lg font-semibold text-[var(--hangul-ink)]">Confirm New Password</label>
                      <input 
                        type="password"
                        className="w-full px-4 py-3 rounded-2xl border-2 border-[#e8e8e3] focus:border-[#815300] focus:ring-2 focus:ring-[#815300]/20 transition-all duration-300 bg-white/70 backdrop-blur-sm text-lg" 
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-4">
                    <button 
                      className="px-8 py-3 bg-gradient-to-r from-[#815300] to-[#a36a00] text-white rounded-2xl font-bold hover:from-[#a36a00] hover:to-[#c47a00] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" 
                      disabled={saving} 
                      onClick={handleChangePassword} 
                      type="button"
                    >
                      {saving ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Changing...
                        </div>
                      ) : (
                        'Change Password'
                      )}
                    </button>
                    <button 
                      className="px-8 py-3 bg-white/80 text-[var(--hangul-ink)] rounded-2xl font-bold hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border-2 border-[#e8e8e3]" 
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }} 
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </HangulCard>

          <HangulCard className="p-8 bg-gradient-to-br from-[#f0f8ff] to-[#e6f3ff] shadow-xl border-0">
            <h2 className="text-3xl font-black tracking-[-0.04em] text-[var(--hangul-ink)] bg-gradient-to-r from-[#72564c] to-[#a36a00] bg-clip-text text-transparent">
              Otter Friends
            </h2>
            <div className="mt-8 space-y-5">
              {friends.map((friend) => (
                <div key={friend.name} className="flex items-center justify-between gap-4 rounded-[28px] bg-white/80 backdrop-blur-sm px-5 py-4 hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.01] border border-white/50">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#101318] to-[#27323d] text-2xl text-white shadow-lg">
                        🧑
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-[var(--hangul-ink)]">{friend.name}</p>
                      <p className="text-base text-[var(--hangul-soft-ink)]">{friend.status}</p>
                    </div>
                  </div>
                  <button className="rounded-full bg-gradient-to-r from-[#ffe9de] to-[#ffd8cf] hover:from-[#ffd8cf] hover:to-[#ffb3a7] px-5 py-2 text-sm font-semibold text-[var(--hangul-accent)] hover:text-[#a36a00] transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105" type="button">
                    {friend.action}
                  </button>
                </div>
              ))}
            </div>
            <button className="hangul-button-secondary mt-8 w-full justify-center bg-gradient-to-r from-[#815300] to-[#a36a00] hover:from-[#a36a00] hover:to-[#c47a00] text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              Find More Friends
            </button>
          </HangulCard>
        </div>
      </div>
    </HangulPageFrame>
  );
}

function ProfileStat({ accent, icon, label, title }: { accent: string; icon: string; label: string; title: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-300">
      <div className={`grid h-16 w-16 place-items-center rounded-full text-2xl shadow-lg ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-[2.1rem] font-black tracking-[-0.04em] text-[var(--hangul-ink)]">{title}</p>
        <p className="text-lg text-[var(--hangul-soft-ink)] font-medium">{label}</p>
      </div>
    </div>
  );
}

function SettingRow({ icon, label, description, onClick }: { icon: ReactNode; label: string; description?: string; onClick: () => void }) {
  return (
    <button 
      className="flex w-full items-center justify-between rounded-[26px] bg-gradient-to-r from-white/80 to-[#fef7f0]/80 hover:from-white hover:to-[#fef7f0] px-6 py-5 text-left transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] group border border-white/50" 
      onClick={onClick} 
      type="button"
    >
      <div className="flex items-center gap-3">
        <div className="text-[var(--hangul-accent)] group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <div>
          <span className="text-xl font-semibold text-[var(--hangul-ink)] block">{label}</span>
          {description && <span className="text-base text-[var(--hangul-soft-ink)]">{description}</span>}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-[var(--hangul-soft-ink)] group-hover:translate-x-1 transition-transform duration-300" />
    </button>
  );
}

