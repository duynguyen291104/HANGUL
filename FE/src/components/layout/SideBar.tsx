'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useMemo } from 'react';

const SIDEBAR_ITEMS = [
  { href: '/quiz', title: 'Quiz', description: 'Test knowledge' },
  { href: '/camera', title: 'Camera to Vocab', description: 'Visual learning' },
  { href: '/writing', title: 'Writing Practice', description: 'Handwriting' },
  { href: '/pronunciation', title: 'Pronunciation', description: 'Speak & listen' },
  { href: '/learning-map', title: 'Learning Path', description: 'Adjust level' },
  { href: '/tournament', title: 'Tournament', description: 'Compete & rank' },
];

const EXCLUDED_PREFIXES = ['/', '/login', '/register', '/level-selection'];

function isExcludedPath(pathname: string) {
  if (pathname === '/') {
    return true;
  }

  return EXCLUDED_PREFIXES
    .filter((prefix) => prefix !== '/')
    .some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function SideBar({ 
  children,
  sidebarOpen = true,
  onToggleSidebar,
}: { 
  children: ReactNode;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const showSidebar = useMemo(() => !isExcludedPath(pathname), [pathname]);

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#fafaf5] font-['Be_Vietnam_Pro'] pt-16">
      <div className="relative flex">
        <aside
          className={`bg-[#f4f4ef] h-screen sticky left-0 top-16 text-[#72564c] font-['Plus_Jakarta_Sans'] text-base font-semibold transition-all duration-300 overflow-hidden z-40 ${
            sidebarOpen ? 'hidden lg:flex w-72 flex-col gap-2 py-6 opacity-100' : 'hidden w-0 opacity-0'
          }`}
        >
          <nav className="flex-grow flex flex-col gap-1 px-4">
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg py-3 px-4 flex items-center gap-3 transition-all active:scale-95 ${
                    isActive
                      ? 'bg-[#72564c] text-white'
                      : 'text-[#72564c] hover:bg-[#72564c] hover:text-white'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold">{item.title}</span>
                    <span className={`text-xs font-normal ${isActive ? 'opacity-80' : 'opacity-70'}`}>{item.description}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-grow w-full max-w-7xl mx-auto p-8 lg:p-12 pb-28 md:pb-8 transition-all duration-300">
          {children}
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg flex justify-around items-center py-4 px-6 border-t border-[#d4c3be]/10 z-50">
        <Link href="/dashboard" className={`flex flex-col items-center gap-1 ${pathname === '/dashboard' ? 'text-[#72564c]' : 'text-[#504441]/60'}`}>
          <span className="text-2xl">🏠</span>
          <span className="text-[10px] font-bold uppercase">Home</span>
        </Link>
        <Link href="/quiz" className={`flex flex-col items-center gap-1 ${pathname.startsWith('/quiz') ? 'text-[#72564c]' : 'text-[#504441]/60'}`}>
          <span className="text-2xl">📚</span>
          <span className="text-[10px] font-bold uppercase">Learn</span>
        </Link>
        <Link href="/tournament" className={`flex flex-col items-center gap-1 ${pathname.startsWith('/tournament') ? 'text-[#72564c]' : 'text-[#504441]/60'}`}>
          <span className="text-2xl">🏆</span>
          <span className="text-[10px] font-bold uppercase">Rank</span>
        </Link>
        <button type="button" onClick={() => router.push('/profile')} className={`flex flex-col items-center gap-1 ${pathname.startsWith('/profile') ? 'text-[#72564c]' : 'text-[#504441]/60'}`}>
          <div className="w-6 h-6 rounded-full overflow-hidden">
            <img
              alt="Profile"
              className="w-full h-full object-cover"
              src="https://res.cloudinary.com/dds5jlp7e/image/upload/v1774702475/Screenshot_from_2026-03-28_19-52-57-removebg-preview_xvqdug.png"
            />
          </div>
          <span className="text-[10px] font-bold uppercase">Profile</span>
        </button>
      </nav>
    </div>
  );
}
