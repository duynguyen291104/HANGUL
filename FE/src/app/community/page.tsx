'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

interface Post {
  id: number;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
}

export default function CommunityPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      author: 'Linh Nguyễn',
      avatar: '👩‍🦰',
      content: 'Vừa hoàn thành 100 ngày học liên tiếp! 🎉🔥',
      timestamp: '2 giờ trước',
      likes: 24,
      comments: 5,
    },
    {
      id: 2,
      author: 'Minh Phạm',
      avatar: '👨‍',
      content: 'Tiền 한글 lại dễ hơn tôi tưởng. Hôm qua học được 30 từ mới!',
      timestamp: '4 giờ trước',
      likes: 15,
      comments: 3,
    },
  ]);
  const [newPost, setNewPost] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  const handlePostSubmit = () => {
    if (!newPost.trim() || !user) return;

    const post: Post = {
      id: posts.length + 1,
      author: user.name,
      avatar: '👤',
      content: newPost,
      timestamp: 'Vừa xong',
      likes: 0,
      comments: 0,
    };

    setPosts([post, ...posts]);
    setNewPost('');
  };

  const likePost = (id: number) => {
    setPosts(posts.map(post =>
      post.id === id ? { ...post, likes: post.likes + 1 } : post
    ));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">👥 Cộng đồng</h1>
          <button onClick={() => router.push('/')} className="text-2xl">✕</button>
        </div>

        {/* New Post */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex gap-4">
            <div className="text-3xl">👤</div>
            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Chia sẻ cảm xúc học tập của bạn..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setNewPost('')}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  onClick={handlePostSubmit}
                  disabled={!newPost.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold"
                >
                  Đăng
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl shadow-lg p-6">
              {/* Author */}
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">{post.avatar}</div>
                <div className="flex-1">
                  <div className="font-bold text-gray-800">{post.author}</div>
                  <div className="text-sm text-gray-500">{post.timestamp}</div>
                </div>
              </div>

              {/* Content */}
              <p className="text-gray-700 mb-4">{post.content}</p>

              {/* Actions */}
              <div className="flex gap-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => likePost(post.id)}
                  className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition"
                >
                   {post.likes}
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition">
                   {post.comments}
                </button>
                <button className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition">
                  🔄 Chia sẻ
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
