'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  level: string;
}

export default function AdminUsers() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">👤 User Management</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No users found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Level</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{user.email}</td>
                  <td className="px-6 py-4 text-sm">{user.name}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                      {user.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Total: {users.length} users
      </div>
    </div>
  );
}
