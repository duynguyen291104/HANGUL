'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LockKeyhole, Mail, UserRound } from 'lucide-react';
import { HangulCard, MascotPortrait } from '@/components/hangul/ui';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register, user } = useAuthStore();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [router, user]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.name || !formData.password) {
      setError('Please complete every field.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      await register(formData.email, formData.name, formData.password);
      router.push('/login?registered=true');
    } catch (requestError) {
      const safeError = requestError as Error;
      setError(safeError.message || 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div className="pointer-events-none absolute left-[10%] top-[18%] hidden rotate-[-10deg] xl:block">
        <MascotPortrait emoji="🦦" tone="peach" className="h-64 w-56" />
      </div>
      <div className="pointer-events-none absolute right-[14%] top-[14%] hidden rotate-[11deg] xl:block">
        <MascotPortrait emoji="✨" tone="gold" className="h-60 w-52" />
      </div>
      <div className="pointer-events-none absolute bottom-[8%] left-[16%] hidden rotate-[6deg] xl:block">
        <MascotPortrait emoji="📚" tone="sky" className="h-60 w-52" />
      </div>

      <HangulCard className="relative z-10 w-full max-w-[720px] p-7 sm:p-10">
        <div className="rounded-[40px] bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(250,244,235,0.96))] p-6 shadow-[0_32px_70px_rgba(126,99,79,0.12)] sm:p-10">
          <div className="text-center">
            <h1 className="text-[3.6rem] font-black tracking-[-0.06em] text-[var(--hangul-ink)]">HANGUL</h1>
            <p className="mt-3 text-xl text-[var(--hangul-soft-ink)]">Create your account and start the river journey.</p>
          </div>

          <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-3 block text-lg font-semibold text-[var(--hangul-ink)]">Name</span>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--hangul-soft-ink)]" />
                <input className="hangul-input pl-14" name="name" onChange={handleChange} placeholder="Sam the Student" type="text" value={formData.name} />
              </div>
            </label>

            <label className="block">
              <span className="mb-3 block text-lg font-semibold text-[var(--hangul-ink)]">Email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--hangul-soft-ink)]" />
                <input className="hangul-input pl-14" name="email" onChange={handleChange} placeholder="hello@otter.edu" type="email" value={formData.email} />
              </div>
            </label>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="mb-3 block text-lg font-semibold text-[var(--hangul-ink)]">Password</span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--hangul-soft-ink)]" />
                  <input className="hangul-input pl-14" name="password" onChange={handleChange} placeholder="••••••••" type="password" value={formData.password} />
                </div>
              </label>

              <label className="block">
                <span className="mb-3 block text-lg font-semibold text-[var(--hangul-ink)]">Confirm</span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--hangul-soft-ink)]" />
                  <input className="hangul-input pl-14" name="confirmPassword" onChange={handleChange} placeholder="••••••••" type="password" value={formData.confirmPassword} />
                </div>
              </label>
            </div>

            {error ? <p className="rounded-3xl bg-[#ffe8e1] px-5 py-4 text-base text-[#944f42]">{error}</p> : null}

            <button className="hangul-button-primary w-full" disabled={loading} type="submit">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-10 text-center text-lg text-[var(--hangul-soft-ink)]">
            Already have an account?{' '}
            <Link className="font-bold text-[var(--hangul-ink)]" href="/login">
              Sign in
            </Link>
          </p>
        </div>
      </HangulCard>
    </main>
  );
}
