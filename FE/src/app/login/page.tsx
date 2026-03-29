'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LockKeyhole, Mail } from 'lucide-react';
import { HangulCard, MascotPortrait } from '@/components/hangul/ui';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuthStore();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [router, user]);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess('Account created successfully. Sign in to continue your journey.');
    }
  }, [searchParams]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      await login(formData.email, formData.password);
      router.push('/level-selection');
    } catch (requestError) {
      const safeError = requestError as Error;
      setError(safeError.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div className="pointer-events-none absolute left-[12%] top-[16%] hidden rotate-[-8deg] xl:block">
        <MascotPortrait emoji="🦦" tone="paper" className="h-64 w-56" />
      </div>
      <div className="pointer-events-none absolute right-[10%] top-[18%] hidden rotate-[8deg] xl:block">
        <MascotPortrait emoji="🧥" tone="cocoa" className="h-60 w-52" />
      </div>
      <div className="pointer-events-none absolute bottom-[10%] right-[18%] hidden rotate-[-10deg] xl:block">
        <MascotPortrait emoji="💪" tone="sky" className="h-60 w-52" />
      </div>

      <HangulCard className="relative z-10 w-full max-w-[620px] p-7 sm:p-10">
        <div className="rounded-[40px] bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(250,244,235,0.96))] p-6 shadow-[0_32px_70px_rgba(126,99,79,0.12)] sm:p-10">
          <div className="text-center">
            <h1 className="text-[3.6rem] font-black tracking-[-0.06em] text-[var(--hangul-ink)]">HANGUL</h1>
            <p className="mt-3 text-xl text-[var(--hangul-soft-ink)]">Your journey to fluency starts here.</p>
          </div>

          <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-3 block text-lg font-semibold text-[var(--hangul-ink)]">Email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--hangul-soft-ink)]" />
                <input
                  className="hangul-input pl-14"
                  name="email"
                  onChange={handleChange}
                  placeholder="hello@otter.edu"
                  type="email"
                  value={formData.email}
                />
              </div>
            </label>

            <label className="block">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-lg font-semibold text-[var(--hangul-ink)]">Password</span>
                <button type="button" className="text-base font-semibold text-[var(--hangul-gold)]">
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--hangul-soft-ink)]" />
                <input
                  className="hangul-input pl-14"
                  name="password"
                  onChange={handleChange}
                  placeholder="••••••••"
                  type="password"
                  value={formData.password}
                />
              </div>
            </label>

            {success ? <p className="rounded-3xl bg-[#e3f8ef] px-5 py-4 text-base text-[#366b58]">{success}</p> : null}
            {error ? <p className="rounded-3xl bg-[#ffe8e1] px-5 py-4 text-base text-[#944f42]">{error}</p> : null}

            <button className="hangul-button-primary w-full" disabled={loading} type="submit">
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4 text-[var(--hangul-muted)]">
            <div className="h-px flex-1 bg-[rgba(129,100,85,0.12)]" />
            <span className="text-base">Or continue with</span>
            <div className="h-px flex-1 bg-[rgba(129,100,85,0.12)]" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <button className="hangul-button-secondary w-full text-base font-bold">Google</button>
            <button className="hangul-button-secondary w-full text-base font-bold">Apple</button>
          </div>

          <p className="mt-10 text-center text-lg text-[var(--hangul-soft-ink)]">
            New to the river?{' '}
            <Link className="font-bold text-[var(--hangul-ink)]" href="/register">
              Create an account
            </Link>
          </p>
        </div>
      </HangulCard>
    </main>
  );
}
