'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuthStore();

  // 🔥 Auth Guard: Nếu đã login → redirect đến dashboard
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Check if user just registered
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess(' Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.');
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Vui lòng điền email và mật khẩu');
      setLoading(false);
      return;
    }

    try {
      await login(formData.email, formData.password);
      // Sau khi đăng nhập thành công, kiểm tra xem người dùng đã chọn cấp độ chưa
      // Nếu chưa, chuyển hướng đến trang chọn cấp độ
      setTimeout(() => {
        router.push('/level-selection');
      }, 500);
    } catch (err) {
      const error = err as Error;
      setError(error?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #2d5d4d 0%, #1f4439 100%)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-5xl mb-2"></h1>
          <h2 className="text-4xl font-bold text-white mb-2">HANGUL</h2>
          <p className="text-[#a8d5ba]">Your Korean Herbarium</p>
        </div>

        {/* Form Card */}
        <div style={{ background: 'white', borderRadius: '20px' }} className="shadow-xl p-10 mb-6">
          <h3 style={{ color: '#2d5d4d' }} className="text-2xl font-bold mb-8 text-center">
            Đăng nhập
          </h3>

          {success && (
            <div style={{ background: '#e6ffe6', borderRadius: '12px' }} className="p-4 mb-6 border border-green-300">
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}

          {error && (
            <div style={{ background: '#ffe6e6', borderRadius: '12px' }} className="p-4 mb-6 border border-red-300">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#2d3436] mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-lg border-2 border-[#a8d5ba] focus:border-[#2d5d4d] focus:outline-none transition"
              />
            </div>

            {/* Password Field */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-[#2d3436] mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg border-2 border-[#a8d5ba] focus:border-[#2d5d4d] focus:outline-none transition"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-white transition disabled:opacity-50"
              style={{ background: '#2d5d4d' }}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-8">
            <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }}></div>
            <p className="px-4 text-sm text-[#636e72]">hoặc</p>
            <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }}></div>
          </div>

          {/* Demo Login */}
          <button
            type="button"
            onClick={() => {
              setFormData({ email: 'demo@example.com', password: 'password123' });
            }}
            className="w-full py-3 rounded-lg font-semibold transition"
            style={{ background: '#f5f1e8', color: '#2d5d4d', border: '2px solid #a8d5ba' }}
          >
            Demo đăng nhập
          </button>
        </div>

        {/* Register Link */}
        <div style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '20px' }} className="p-6 text-center">
          <p className="text-white mb-3">Chưa có tài khoản?</p>
          <Link
            href="/register"
            className="inline-block px-8 py-2 rounded-lg font-semibold transition"
            style={{ background: '#a8d5ba', color: '#2d3436' }}
          >
            Tạo tài khoản ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
