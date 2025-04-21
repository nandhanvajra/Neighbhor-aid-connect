import React, { useState } from 'react';
import axios from 'axios';

export default function PostRequest() {
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    urgency: '',
    preferredTime: '',
    addressNote: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      await axios.post('/api/requests', formData, config);
      alert('Help request posted successfully!');
      setFormData({ category: '', description: '', urgency: '', preferredTime: '', addressNote: '' });
    } catch (err) {
      console.error(err);
      alert('Error posting request.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow rounded mt-8 font-sans">
      <h2 className="text-3xl font-bold text-orange-500 mb-6 text-center">Post Help Request</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Category</label>
          <select
            name="category"
            value={formData.category}
            className="w-full border border-gray-300 rounded px-4 py-2"
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          >
            <option value="">Select</option>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="maid">Maid</option>
            <option value="cook">Cook</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Task Description</label>
          <textarea
            className="w-full border border-gray-300 rounded px-4 py-2"
            rows="4"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the help you need in detail..."
            required
          ></textarea>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Urgency Level</label>
            <select
              className="w-full border border-gray-300 rounded px-4 py-2"
              value={formData.urgency}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
              required
            >
              <option value="">Select urgency</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
            <input
              type="time"
              className="w-full border border-gray-300 rounded px-4 py-2"
              value={formData.preferredTime}
              onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (Optional)</label>
          <textarea
            className="w-full border border-gray-300 rounded px-4 py-2"
            rows="2"
            value={formData.addressNote}
            onChange={(e) => setFormData({ ...formData, addressNote: e.target.value })}
            placeholder="House entrance info, parking note, etc."
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full bg-orange-500 text-white font-semibold text-lg py-2 rounded hover:bg-orange-600 transition-all duration-200"
        >
          Submit Help Request
        </button>
      </form>
    </div>
  );
}