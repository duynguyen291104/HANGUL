'use client';

import Link from 'next/link';

export default function TopBar({
  sidebarOpen = true,
  onToggleSidebar,
}: {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#72564c] text-white shadow-lg transition-all hover:bg-[#8d6e63] active:scale-95"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img
            src="https://res.cloudinary.com/dds5jlp7e/image/upload/v1774702475/Screenshot_from_2026-03-28_19-52-57-removebg-preview_xvqdug.png"
            alt="HANGUL Logo"
            className="w-10 h-10 object-contain"
          />
          <div className="text-2xl font-black text-[#72564c] tracking-tighter uppercase font-['Plus_Jakarta_Sans']">
            HANGUL
          </div>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="h-10 w-10 flex items-center justify-center rounded-full bg-[#72564c] text-white shadow-lg transition-all hover:bg-[#8d6e63] active:scale-95"
          aria-label="Notifications"
        >
          🔔
        </button>
        <button
          type="button"
          className="h-10 w-10 flex items-center justify-center rounded-full bg-[#72564c] text-white shadow-lg transition-all hover:bg-[#8d6e63] active:scale-95"
          aria-label="Settings"
        >
          ⚙️
        </button>
        <Link
          href="/profile"
          className="h-10 w-10 flex items-center justify-center rounded-full bg-[#72564c] text-white shadow-lg transition-all hover:bg-[#8d6e63] active:scale-95"
          aria-label="User profile"
        >
          🦦
        </Link>
      </div>
    </div>
  );
}