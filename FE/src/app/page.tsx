'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Nếu đã login → redirect đến dashboard
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🇰🇷</span>
            <h1 className="text-2xl font-bold text-green-700">HANGUL</h1>
          </div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-6 py-2 text-green-700 font-semibold hover:text-green-800 transition"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="px-6 py-2 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Học tiếng Hàn một cách vui vẻ
            </h2>
            <p className="text-xl text-gray-700 mb-8">
              Khám phá cách học tiếng Hàn hiện đại với bài quiz, luyện viết, phát âm, và công nghệ nhận dạng hình ảnh. Bắt đầu hành trình học tập của bạn ngay hôm nay!
            </p>
            <div className="flex gap-4">
              <Link
                href="/register"
                className="px-8 py-4 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition text-lg shadow-lg hover:shadow-xl"
              >
                Bắt đầu học ngay
              </Link>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 border-2 border-green-700 text-green-700 rounded-lg font-semibold hover:bg-green-50 transition text-lg"
              >
                Tìm hiểu thêm
              </button>
            </div>
          </div>

          {/* Right Visual */}
          <div className="flex justify-center">
            <div className="text-center">
              <div className="text-9xl mb-4">🇰🇷</div>
              <p className="text-2xl font-bold text-gray-900">Ahn-nyeong-ha-se-yo!</p>
              <p className="text-gray-600 mt-2">안녕하세요</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Tính năng học tập tuyệt vời
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-8 text-center hover:shadow-lg transition">
              <div className="text-5xl mb-4">🎯</div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Quiz thông minh</h4>
              <p className="text-gray-700">
                Trắc nghiệm từ vựng và ngữ pháp với hệ thống học tập thích nghi
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-8 text-center hover:shadow-lg transition">
              <div className="text-5xl mb-4">✍️</div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Luyện viết</h4>
              <p className="text-gray-700">
                Thực hành viết tiếng Hàn từ cơ bản đến nâng cao
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-8 text-center hover:shadow-lg transition">
              <div className="text-5xl mb-4">🎤</div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Phát âm</h4>
              <p className="text-gray-700">
                Học phát âm chuẩn với đánh giá tức thời
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-8 text-center hover:shadow-lg transition">
              <div className="text-5xl mb-4">📸</div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Nhận dạng hình</h4>
              <p className="text-gray-700">
                Sử dụng camera để nhận dạng chữ Hàn
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-gradient-to-br from-green-700 to-green-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-4xl font-bold text-center mb-16">Tại sao chọn HANGUL?</h3>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="text-5xl mb-4">⚡</div>
              <h4 className="text-2xl font-bold mb-3">Nhanh chóng</h4>
              <p>
                Bắt đầu học trong vòng 30 giây. Không cần cài đặt phức tạp.
              </p>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-4">🎯</div>
              <h4 className="text-2xl font-bold mb-3">Hiệu quả</h4>
              <p>
                Hệ thống học tập được thiết kế bởi giáo viên tiếng Hàn chuyên nghiệp
              </p>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-4">🏆</div>
              <h4 className="text-2xl font-bold mb-3">Thú vị</h4>
              <p>
                Gamification với điểm, huy hiệu, và bảng xếp hạng
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-green-700 mb-2">5000+</div>
              <p className="text-gray-700">Từ vựng</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-700 mb-2">100+</div>
              <p className="text-gray-700">Bài học</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-700 mb-2">10k+</div>
              <p className="text-gray-700">Người học</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-700 mb-2">4.8</div>
              <p className="text-gray-700">Đánh giá</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-6">
            Sẵn sàng học tiếng Hàn chưa?
          </h3>
          <p className="text-xl mb-8">
            Tham gia hàng nghìn học viên đang học cùng HANGUL
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-green-700 rounded-lg font-semibold hover:bg-gray-100 transition text-lg shadow-lg"
            >
              Đăng ký miễn phí
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-green-700 transition text-lg"
            >
              Đã có tài khoản? Đăng nhập
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">HANGUL</h4>
              <p>Học tiếng Hàn một cách hiện đại và vui vẻ</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Tính năng</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition">Quiz</a></li>
                <li><a href="#" className="hover:text-white transition">Luyện viết</a></li>
                <li><a href="#" className="hover:text-white transition">Phát âm</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Công ty</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition">Về chúng tôi</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Liên hệ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Pháp lý</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition">Điều khoản</a></li>
                <li><a href="#" className="hover:text-white transition">Quyền riêng tư</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center">
            <p>&copy; 2026 HANGUL. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
