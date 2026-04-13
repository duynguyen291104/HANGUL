'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

interface Vocabulary {
  id: number;
  korean: string;
  english: string;
  vietnamese: string;
  level: string;
  topicId: number;
}

interface Topic {
  id: number;
  name: string;
  level: string;
}

export default function AdminVocabulary() {
  const { token } = useAuthStore();
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    korean: '',
    english: '',
    vietnamese: '',
    level: 'NEWBIE',
    topicId: 0,
  });

  useEffect(() => {
    fetchData();
  }, [token, filterLevel]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vocabRes, topicsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/admin/vocabulary?level=${filterLevel}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:5000/api/topic', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const vocabData = await vocabRes.json();
      const topicsData = await topicsRes.json();

      setVocabulary(vocabData);
      setTopics(topicsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `http://localhost:5000/api/admin/vocabulary/${editingId}`
        : 'http://localhost:5000/api/admin/vocabulary';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          topicId: parseInt(formData.topicId.toString()),
        }),
      });

      if (response.ok) {
        alert(editingId ? 'Updated successfully!' : 'Created successfully!');
        setShowForm(false);
        setEditingId(null);
        setFormData({ korean: '', english: '', vietnamese: '', level: 'NEWBIE', topicId: 0 });
        fetchData();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/admin/vocabulary/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert('Deleted successfully!');
        fetchData();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to delete');
    }
  };

  const filteredVocab = vocabulary.filter((v) =>
    v.korean.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.english.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📚 Vocabulary Management</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ korean: '', english: '', vietnamese: '', level: 'NEWBIE', topicId: 0 });
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Vocabulary</span>
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit' : 'Add New'} Vocabulary</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Korean"
                value={formData.korean}
                onChange={(e) => setFormData({ ...formData, korean: e.target.value })}
                required
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="English"
                value={formData.english}
                onChange={(e) => setFormData({ ...formData, english: e.target.value })}
                required
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Vietnamese"
                value={formData.vietnamese}
                onChange={(e) => setFormData({ ...formData, vietnamese: e.target.value })}
                className="border rounded px-3 py-2"
              />
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="border rounded px-3 py-2"
              >
                <option value="NEWBIE">NEWBIE</option>
                <option value="BEGINNER">BEGINNER</option>
                <option value="INTERMEDIATE">INTERMEDIATE</option>
                <option value="ADVANCED">ADVANCED</option>
                <option value="EXPERT">EXPERT</option>
              </select>
              <select
                value={formData.topicId}
                onChange={(e) => setFormData({ ...formData, topicId: parseInt(e.target.value) })}
                className="border rounded px-3 py-2"
                required
              >
                <option value="">Select Topic</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex space-x-3">
              <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex space-x-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 bg-gray-100 rounded px-3 py-2">
            <Search size={20} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search by korean or english..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent flex-1 outline-none"
            />
          </div>
        </div>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Levels</option>
          <option value="NEWBIE">NEWBIE</option>
          <option value="BEGINNER">BEGINNER</option>
          <option value="INTERMEDIATE">INTERMEDIATE</option>
          <option value="ADVANCED">ADVANCED</option>
          <option value="EXPERT">EXPERT</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">Loading...</div>
        ) : filteredVocab.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No vocabulary found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Korean</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">English</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Vietnamese</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Level</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Topic</th>
                <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredVocab.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{item.korean}</td>
                  <td className="px-6 py-4 text-sm">{item.english}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.vietnamese}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                      {item.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {topics.find((t) => t.id === item.topicId)?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-center space-x-2 flex justify-center">
                    <button
                      onClick={() => {
                        setFormData(item);
                        setEditingId(item.id);
                        setShowForm(true);
                      }}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Total: {filteredVocab.length} items
      </div>
    </div>
  );
}
