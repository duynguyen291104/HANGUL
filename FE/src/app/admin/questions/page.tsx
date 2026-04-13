'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

interface Question {
  id: number;
  questionText: string;
  difficulty: string;
  topicId: number;
  explanation?: string;
  explanation_vi?: string;
}

interface Topic {
  id: number;
  name: string;
}

export default function AdminQuestions() {
  const { token } = useAuthStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    difficulty: 'easy',
    topicId: 0,
    explanation: '',
    explanation_vi: '',
  });

  useEffect(() => {
    fetchData();
  }, [token, filterDifficulty]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [questionsRes, topicsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/admin/questions?difficulty=${filterDifficulty}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:5000/api/topic', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const questionsData = await questionsRes.json();
      const topicsData = await topicsRes.json();

      setQuestions(questionsData);
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
        ? `http://localhost:5000/api/admin/questions/${editingId}`
        : 'http://localhost:5000/api/admin/questions';

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
        setFormData({
          questionText: '',
          options: ['', '', '', ''],
          correctAnswer: '',
          difficulty: 'easy',
          topicId: 0,
          explanation: '',
          explanation_vi: '',
        });
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
      const response = await fetch(`http://localhost:5000/api/admin/questions/${id}`, {
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

  const filteredQuestions = questions.filter((q) =>
    q.questionText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">❓ Questions Management</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              questionText: '',
              options: ['', '', '', ''],
              correctAnswer: '',
              difficulty: 'easy',
              topicId: 0,
              explanation: '',
              explanation_vi: '',
            });
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Question</span>
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit' : 'Add New'} Question</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              placeholder="Question text"
              value={formData.questionText}
              onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
              required
              className="w-full border rounded px-3 py-2 min-h-20"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="border rounded px-3 py-2"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Options</label>
              {formData.options.map((opt, idx) => (
                <input
                  key={idx}
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const newOptions = [...formData.options];
                    newOptions[idx] = e.target.value;
                    setFormData({ ...formData, options: newOptions });
                  }}
                  required
                  className="w-full border rounded px-3 py-2 mb-2"
                />
              ))}
            </div>

            <input
              type="text"
              placeholder="Correct answer (must match one of the options)"
              value={formData.correctAnswer}
              onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
              required
              className="w-full border rounded px-3 py-2"
            />

            <textarea
              placeholder="Explanation (English)"
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              className="w-full border rounded px-3 py-2 min-h-16"
            />

            <textarea
              placeholder="Explanation (Vietnamese)"
              value={formData.explanation_vi}
              onChange={(e) => setFormData({ ...formData, explanation_vi: e.target.value })}
              className="w-full border rounded px-3 py-2 min-h-16"
            />

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
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent flex-1 outline-none"
            />
          </div>
        </div>
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">Loading...</div>
        ) : filteredQuestions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No questions found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold">Question</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Difficulty</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Topic</th>
                <th className="px-6 py-3 text-center text-sm font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredQuestions.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{item.questionText.substring(0, 50)}...</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      item.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {topics.find((t) => t.id === item.topicId)?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-center space-x-2 flex justify-center">
                    <button className="text-blue-500 hover:text-blue-700">
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
        Total: {filteredQuestions.length} items
      </div>
    </div>
  );
}
