'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Đã thêm import Link
import { BookOpen, Camera, Mic2, PencilLine, Swords } from 'lucide-react';
import { FooterBrand, HangulCard, HangulPageFrame, MascotPortrait, Pill, SectionLabel } from '@/components/hangul/ui';
import { useAuthStore } from '@/store/authStore';

const toolkit = [
  {
    title: 'Smart Quiz',
    description: 'Dynamic testing that adapts to your weak spots and keeps every round fresh.',
    icon: BookOpen,
    tone: 'bg-[#ffe3d8] text-[#8b6052]',
  },
  {
    title: 'Writing Pad',
    description: 'Stroke-order guidance built for tactile repetition and confident handwriting.',
    icon: PencilLine,
    tone: 'bg-[#d9f7f4] text-[#2d6764]',
  },
  {
    title: 'Voice Lab',
    description: 'Native cadence, waveform feedback, and score-based pronunciation coaching.',
    icon: Mic2,
    tone: 'bg-[#ffefc7] text-[#926602]',
  },
  {
    title: 'Lens Scan',
    description: 'Scan real objects, spot Korean labels, and translate the world around you.',
    icon: Camera,
    tone: 'bg-[#ffd9d3] text-[#b1473e]',
  },
  {
    title: 'The Arena',
    description: 'Live battle modes that turn vocabulary and listening drills into competition.',
    icon: Swords,
    tone: 'bg-[#f0e7db] text-[#7e6457]',
  },
] as const;

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [router, user]);

  return (
    <div className="min-h-screen bg-[#fafaf5] font-['Be_Vietnam_Pro'] text-[#1a1c19]">
      {/* Top Navigation */}
      <header className="bg-[#fafaf5]/80 backdrop-blur-xl flex justify-between items-center w-full pl-[400px] pr-[400px] py-4 sticky top-0 z-50 shadow-[0_20px_40px_rgba(43,22,15,0.06)] h-20">
        <div className="flex items-center gap-2">
          <img 
            src="https://res.cloudinary.com/dds5jlp7e/image/upload/v1774702475/Screenshot_from_2026-03-28_19-52-57-removebg-preview_xvqdug.png" 
            alt="Mascot Icon" 
            className="w-[80px] h-[80px] object-contain -mt-0.5"
          />
          <div className="text-2xl font-black text-[#72564c] tracking-tighter uppercase font-['Plus_Jakarta_Sans']">
            HANGUL
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-6 py-2 text-[#72564c] font-['Plus_Jakarta_Sans'] font-bold tracking-tight hover:text-[#5b4137] transition"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="px-6 py-2 bg-gradient-to-r from-[#72564c] to-[#8d6e63] text-white rounded-xl font-['Plus_Jakarta_Sans'] font-bold hover:from-[#5b4137] hover:to-[#72564c] transition-all shadow-lg"
          >
            Đăng ký
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-12 overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-40">
            <div className="absolute top-20 left-10 w-64 h-64 bg-[#c2ebe5]/30 rounded-full blur-[80px]"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#ffdbce]/30 rounded-full blur-[100px]"></div>
          </div>
          
          <div className="relative z-10 text-center max-w-4xl mx-auto mb-16">
            <h1 className="font-['Plus_Jakarta_Sans'] text-5xl md:text-7xl font-extrabold text-[#72564c] tracking-tight mb-6 leading-tight">
              Korean Learning <br />
              <span className="text-[#406561]">Made Tactile.</span>
            </h1>
            <p className="text-xl md:text-2xl text-[#504441] font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
              Join Hana, Ji-woo, and our otter squad on a premium journey to mastering Hangul. No more sterile grids, just playful mastery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-gradient-to-r from-[#72564c] to-[#8d6e63] text-white px-10 py-5 rounded-xl font-['Plus_Jakarta_Sans'] font-bold text-lg shadow-xl hover:scale-105 transition-transform active:scale-95"
              >
                Start Learning for Free
              </Link>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-[#e8e8e3] text-[#504441] px-10 py-5 rounded-xl font-['Plus_Jakarta_Sans'] font-bold text-lg hover:bg-[#e3e3de] transition-colors active:scale-95"
              >
                See the Arena
              </button>
            </div>
          </div> {/* Đã thêm thẻ đóng div bị thiếu ở đây */}

          {/* Mascot Showcase */}
          <div className="relative z-20 w-full max-w-6xl h-[400px] flex items-end justify-center gap-4 px-4">
            {/* Hana */}
            <div className="relative group w-1/3 max-w-[280px]">
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-[#fafaf5]/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg border border-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-sm font-bold text-[#72564c]">Annyeong! I'm Hana! 👋</p>
              </div>
              <div className="bg-[#c2ebe5] h-64 rounded-t-full flex items-end justify-center overflow-visible transition-transform hover:-translate-y-4 duration-500">
                <div className="text-6xl">🦦</div>
              </div>
            </div>

            {/* Main Mascot */}
            <div className="relative group w-1/3 max-w-[320px] -mx-4 z-10">
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 bg-[#fafaf5]/80 backdrop-blur-md px-8 py-4 rounded-2xl shadow-xl border border-white/50 opacity-100">
                <p className="text-lg font-['Plus_Jakarta_Sans'] font-black text-[#72564c] uppercase tracking-tighter">Ready to Dive In?</p>
              </div>
              <div className="bg-[#ffdbce] h-80 rounded-t-full flex items-end justify-center transition-transform hover:-translate-y-4 duration-500">
                <div className="text-7xl">🦦</div>
              </div>
            </div>

            {/* Ji-woo */}
            <div className="relative group w-1/3 max-w-[280px]">
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-[#fafaf5]/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg border border-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-sm font-bold text-[#72564c]">Let's practice! 📚</p>
              </div>
              <div className="bg-[#ffddb5] h-64 rounded-t-full flex items-end justify-center overflow-visible transition-transform hover:-translate-y-4 duration-500">
                <div className="text-6xl">🦦</div>
              </div>
            </div>
          </div>
        </section>

        {/* Philosophy Section - Bento Grid */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="mb-16">
            <span className="font-['Plus_Jakarta_Sans'] font-bold text-[#72564c] tracking-widest uppercase text-sm">Our Philosophy</span>
            <h2 className="text-4xl md:text-5xl font-black text-[#72564c] mt-4 tracking-tight font-['Plus_Jakarta_Sans']">The Tactile Approach</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">
            {/* No Sterile Grids */}
            <div className="md:col-span-7 bg-[#f4f4ef] p-10 rounded-lg flex flex-col justify-between overflow-hidden relative group">
              <div>
                <h3 className="text-3xl font-['Plus_Jakarta_Sans'] font-bold text-[#72564c] mb-4">No Sterile Grids.</h3>
                <p className="text-lg text-[#504441] max-w-md leading-relaxed">We believe learning should feel like physical play. Our interface mimics high-end stationery and wooden blocks, creating a supportive, tangible environment for your brain.</p>
              </div>
              <div className="mt-8 flex gap-4">
                <div className="w-24 h-24 bg-[#c2ebe5] rounded-2xl flex items-center justify-center">
                  <span className="text-4xl">🧩</span>
                </div>
                <div className="w-24 h-24 bg-[#ffddb5] rounded-2xl flex items-center justify-center">
                  <span className="text-4xl">✏️</span>
                </div>
              </div>
            </div>

            {/* Mascot-Led Support */}
            <div className="md:col-span-5 bg-[#72564c] p-10 rounded-lg text-white flex flex-col justify-center relative">
              <span className="text-6xl mb-6 opacity-40">🎓</span>
              <h3 className="text-3xl font-['Plus_Jakarta_Sans'] font-bold mb-4">Mascot-Led Support</h3>
              <p className="text-lg opacity-80 leading-relaxed">You're never alone. Hana and the team track your progress, celebrate your wins, and gently nudge you when things get tough. A personal tutor in your pocket.</p>
              <div className="absolute top-4 right-4 text-[#ffdbce] opacity-20 text-9xl font-['Plus_Jakarta_Sans'] font-black">02</div>
            </div>

            {/* Smart Progress */}
            <div className="md:col-span-4 bg-[#c2ebe5] p-10 rounded-lg flex flex-col justify-end group">
              <span className="text-4xl text-[#406561] mb-4 group-hover:scale-125 transition-transform">✨</span>
              <h3 className="text-2xl font-['Plus_Jakarta_Sans'] font-bold text-[#406561] mb-2">Smart Progress</h3>
              <p className="text-[#406561] opacity-80">Our AI adapts to your learning pace, focusing on your weak spots through tactile repetition.</p>
            </div>

            {/* Master the Script */}
            <div className="md:col-span-8 bg-[#e8e8e3] p-10 rounded-lg flex items-center gap-8 group">
              <div className="flex-1">
                <h3 className="text-2xl font-['Plus_Jakarta_Sans'] font-bold text-[#72564c] mb-2">Master the Script</h3>
                <p className="text-[#504441] opacity-80">From simple vowels to complex sentences, we break down Hangul into manageable, beautiful building blocks.</p>
              </div>
              <div className="w-1/3 h-full rounded-2xl bg-white shadow-inner flex items-center justify-center">
                <span className="text-8xl font-['Plus_Jakarta_Sans'] font-black text-[#72564c]/10 group-hover:text-[#72564c] transition-colors">한</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-[#f4f4ef]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5 peso font-['Plus_Jakarta_Sans'] font-black text-[#72564c] tracking-tight mb-4">Your Learning Toolkit</h2>
              <p className="text-xl text-[#504441] max-w-2xl mx-auto">Everything you need to go from beginner to fluent, all in one playful experience.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Feature 1: Quiz */}
              <div className="bg-white p-8 rounded-xl hover:shadow-[0_20px_40px_rgba(43,22,15,0.06)] transition-all cursor-pointer border border-transparent hover:border-[#e4beb2] group">
                <div className="w-12 h-12 bg-[#ffdbce] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-xl">🧠</span>
                </div>
                <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#72564c] mb-2">Smart Quiz</h4>
                <p className="text-sm text-[#504441] leading-relaxed">Dynamic testing that learns from your mistakes.</p>
              </div>

              {/* Feature 2: Writing */}
              <div className="bg-white p-8 rounded-xl hover:shadow-[0_20px_40px_rgba(43,22,15,0.06)] transition-all cursor-pointer border border-transparent hover:border-[#a6cec9] group">
                <div className="w-12 h-12 bg-[#c2ebe5] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-xl">✍️</span>
                </div>
                <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#406561] mb-2">Writing Pad</h4>
                <p className="text-sm text-[#504441] leading-relaxed">Stroke-order detection for perfect calligraphy.</p>
              </div>

              {/* Feature 3: Speaking */}
              <div className="bg-white p-8 rounded-xl hover:shadow-[0_20px_40px_rgba(43,22,15,0.06)] transition-all cursor-pointer border border-transparent hover:border-[#ffb957] group">
                <div className="w-12 h-12 bg-[#ffddb5] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-xl">🎤</span>
                </div>
                <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#815300] mb-2">Voice Lab</h4>
                <p className="text-sm text-[#504441] leading-relaxed">AI feedback on your pronunciation in real-time.</p>
              </div>

              {/* Feature 4: Camera */}
              <div className="bg-white p-8 rounded-xl hover:shadow-[0_20px_40px_rgba(43,22,15,0.06)] transition-all cursor-pointer border border-transparent hover:border-[#ffdad6] group">
                <div className="w-12 h-12 bg-[#ffdad6] rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-xl">📸</span>
                </div>
                <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#ba1a1a] mb-2">Lens Scan</h4>
                <p className="text-sm text-[#504441] leading-relaxed">Scan real-world Korean text and translate instantly.</p>
              </div>

              {/* Feature 5: Arena */}
              <div className="bg-white p-8 rounded-xl hover:shadow-[0_20px_40px_rgba(43,22,15,0.06)] transition-all cursor-pointer border border-transparent hover:border-[#72564c] group">
                <div className="w-12 h-12 bg-[#72564c] text-white rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-xl">🏆</span>
                </div>
                <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#72564c] mb-2">The Arena</h4>
                <p className="text-sm text-[#504441] leading-relaxed">Live battle sessions with students worldwide.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="max-w-5xl mx-auto bg-[#8d6e63] rounded-3xl p-12 md:p-24 text-center relative z-10 overflow-hidden shadow-2xl">
            <div className="absolute -bottom-10 -right-10 w-64 h-64 opacity-20 rotate-12 text-8xl">🦦</div>
            
            <h2 className="font-['Plus_Jakarta_Sans'] text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">
              Ready to Master <br />
              Hangul?
            </h2>
            <p className="text-white/80 text-xl md:text-2xl mb-12 max-w-xl mx-auto">
              Join over 100,000 learners and start your journey with Hana and the team today.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/register"
                className="bg-white text-[#72564c] px-12 py-6 rounded-full font-['Plus_Jakarta_Sans'] font-bold text-xl shadow-xl hover:bg-[#c2ebe5] hover:scale-105 transition-all active:scale-95"
              >
                Start Learning for Free
              </Link>
              <a className="text-white/90 font-bold border-b-2 border-white/30 pb-1 hover:text-white transition-colors" href="#">
                Compare Plans
              </a>
            </div>

            {/* Floating Decorative Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none overflow-hidden -z-10">
              <div className="absolute top-10 left-10 w-12 h-12 rounded-full bg-[#c2ebe5] blur-2xl"></div>
              <div className="absolute bottom-20 right-20 w-32 h-32 rounded-full bg-[#ffddb5] blur-3xl"></div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#e8e8e3] py-16 px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-xs">
            <div className="text-2xl font-['Plus_Jakarta_Sans'] font-black text-[#72564c] tracking-tighter uppercase mb-6">
              HANGUL
            </div>
            <p className="text-[#504441] leading-relaxed">
              Elevating Korean education through tactile design and friendly companionship.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 w-full md:w-auto">
            <div className="flex flex-col gap-4">
              <h5 className="font-['Plus_Jakarta_Sans'] font-bold text-[#72564c]">Platform</h5>
              <a className="text-[#504441] hover:text-[#72564c] transition-colors" href="#">Courses</a>
              <a className="text-[#504441] hover:text-[#72564c] transition-colors" href="#">Arena</a>
              <a className="text-[#504441] hover:text-[#72564c] transition-colors" href="#">Library</a>
            </div>
            <div className="flex flex-col gap-4">
              <h5 className="font-['Plus_Jakarta_Sans'] font-bold text-[#72564c]">Resources</h5>
              <a className="text-[#504441] hover:text-[#72564c] transition-colors" href="#">Blog</a>
              <a className="text-[#504441] hover:text-[#72564c] transition-colors" href="#">Teachers</a>
              <a className="text-[#504441] hover:text-[#72564c] transition-colors" href="#">Support</a>
            </div>
            <div className="flex flex-col gap-4">
              <h5 className="font-['Plus_Jakarta_Sans'] font-bold text-[#72564c]">Company</h5>
              <a className="text-[#504441] hover:text-[#72564c] transition-colors" href="#">About Us</a>
              <a className="text-[#504441] hover:text-[#72564c] transition-colors" href="#">Careers</a>
              <a className="text-[#504441] hover:text-[#72564c] transition-colors" href="#">Privacy</a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-[#d4c3be]/20 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[#504441] text-sm">© 2026 HANGUL Edu. All rights reserved.</p>
          <div className="flex gap-6">
            <a className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#72564c] hover:bg-[#72564c] hover:text-white transition-all" href="#">
              🌐
            </a>
            <a className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#72564c] hover:bg-[#72564c] hover:text-white transition-all" href="#">
              ✉️
            </a>
            <a className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#72564c] hover:bg-[#72564c] hover:text-white transition-all" href="#">
              🔗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}