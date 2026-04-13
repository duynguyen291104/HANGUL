'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Check if user is admin
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have admin access</p>
          <Link href="/" className="text-blue-500 hover:underline mt-4 block">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-800">
          <h1 className={`font-bold ${sidebarOpen ? 'text-xl' : 'text-sm text-center'}`}>
            {sidebarOpen ? '🎓 HANGUL ADMIN' : '⚙️'}
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <AdminNavLink 
            href="/admin/dashboard" 
            icon="📊" 
            label="Dashboard"
            open={sidebarOpen}
          />
          <AdminNavLink 
            href="/admin/vocabulary" 
            icon="📚" 
            label="Vocabulary"
            open={sidebarOpen}
          />
          <AdminNavLink 
            href="/admin/questions" 
            icon="❓" 
            label="Questions"
            open={sidebarOpen}
          />
          <AdminNavLink 
            href="/admin/handwriting" 
            icon="✍️" 
            label="Handwriting"
            open={sidebarOpen}
          />
          <AdminNavLink 
            href="/admin/users" 
            icon="👤" 
            label="Users"
            open={sidebarOpen}
          />
        </nav>

        <div className="border-t border-gray-800 p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-800 transition"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, <strong>{user?.name}</strong>
            </span>
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {user?.name?.[0] || 'A'}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

interface AdminNavLinkProps {
  href: string;
  icon: string;
  label: string;
  open: boolean;
}

function AdminNavLink({ href, icon, label, open }: AdminNavLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-3 px-3 py-2 rounded hover:bg-gray-800 transition text-sm"
    >
      <span className="text-lg">{icon}</span>
      {open && <span>{label}</span>}
    </Link>
  );
}
