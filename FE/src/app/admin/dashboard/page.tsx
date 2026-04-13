'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

interface DashboardStats {
  totalVocab: number;
  totalQuestions: number;
  totalUsers: number;
  totalTopics: number;
}

export default function AdminDashboard() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalVocab: 0,
    totalQuestions: 0,
    totalUsers: 0,
    totalTopics: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [token]);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Vocabulary"
            value={stats.totalVocab}
            icon="📚"
            color="blue"
          />
          <StatCard
            label="Questions"
            value={stats.totalQuestions}
            icon="❓"
            color="green"
          />
          <StatCard
            label="Users"
            value={stats.totalUsers}
            icon="👤"
            color="purple"
          />
          <StatCard
            label="Topics"
            value={stats.totalTopics}
            icon="📖"
            color="orange"
          />
        </div>
      )}

      <div className="mt-12 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionButton href="/admin/vocabulary" label="Add Vocabulary" icon="➕" />
          <ActionButton href="/admin/questions" label="Add Question" icon="➕" />
          <ActionButton href="/admin/handwriting" label="Add Handwriting" icon="➕" />
          <ActionButton href="/admin/users" label="Manage Users" icon="⚙️" />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-6 text-center`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm font-medium mt-2">{label}</div>
    </div>
  );
}

interface ActionButtonProps {
  href: string;
  label: string;
  icon: string;
}

function ActionButton({ href, label, icon }: ActionButtonProps) {
  return (
    <a
      href={href}
      className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition font-medium"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </a>
  );
}
