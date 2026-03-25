'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  const { register } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.name || !formData.password) {
      setError('Vui lòng điền đầy đủ thông tin');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu không khớp');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải tối thiểu 6 ký tự');
      setLoading(false);
      return;
    }

    try {
      await register(formData.email, formData.name, formData.password);
      // Redirect to login instead of auto-login
      router.push('/login?registered=true');
    } catch (err) {
      const error = err as Error;
      setError(error?.message || 'Đăng ký thất bại');
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
            Tạo tài khoản
          </h3>

          {error && (
            <div style={{ background: '#ffe6e6', borderRadius: '12px' }} className="p-4 mb-6 border border-red-300">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Name Field */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-[#2d3436] mb-2">
                Tên của bạn
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-3 rounded-lg border-2 border-[#a8d5ba] focus:border-[#2d5d4d] focus:outline-none transition"
              />
            </div>

            {/* Email Field */}
            <div className="mb-5">
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
            <div className="mb-5">
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
              <p className="text-xs text-[#636e72] mt-1">Tối thiểu 6 ký tự</p>
            </div>

            {/* Confirm Password Field */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-[#2d3436] mb-2">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
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
              {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-8">
            <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }}></div>
            <p className="px-4 text-sm text-[#636e72]">hoặc</p>
            <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }}></div>
          </div>

          {/* Demo Register */}
          <button
            type="button"
            onClick={() => {
              setFormData({
                email: 'demo@example.com',
                name: 'Người dùng Demo',
                password: 'password123',
                confirmPassword: 'password123',
              });
            }}
            className="w-full py-3 rounded-lg font-semibold transition"
            style={{ background: '#f5f1e8', color: '#2d5d4d', border: '2px solid #a8d5ba' }}
          >
            Demo tạo tài khoản
          </button>
        </div>

        {/* Login Link */}
        <div style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '20px' }} className="p-6 text-center">
          <p className="text-white mb-3">Đã có tài khoản?</p>
          <Link
            href="/login"
            className="inline-block px-8 py-2 rounded-lg font-semibold transition"
            style={{ background: '#a8d5ba', color: '#2d3436' }}
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
