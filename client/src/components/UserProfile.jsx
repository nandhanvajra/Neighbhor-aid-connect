import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  MapPin, 
  Phone, 
  Calendar,
  Briefcase,
  Shield,
  Edit,
  Save,
  X,
  Plus,
  Bell,
  Heart,
  Settings,
  Check,
  Star,
  Eye
} from 'lucide-react';
import config from '../config/config';
import RatingModal from './RatingModal';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [requestPreferences, setRequestPreferences] = useState([]);

  // Stats state
  const [stats, setStats] = useState({ posted: 0, solved: 0, helped: 0 });
  const [ratingStats, setRatingStats] = useState(null);
  const [ratingModal, setRatingModal] = useState({ open: false, existingRating: null });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
    bio: '',
    skills: [],
    profilePicture: '',
    dateOfBirth: '',
    gender: 'prefer-not-to-say',
    occupation: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    preferences: {
      notifications: true,
      publicProfile: true
    }
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (user && (user._id || user.id)) {
      const userId = user._id || user.id;
      fetchUserStats(userId);
      fetchUserRatingStats(userId);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await fetch(`${config.apiBaseUrl}/api/auth/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      setUser(data.user);
      setFormData({
        name: data.user.name || '',
        email: data.user.email || '',
        address: data.user.address || '',
        phone: data.user.phone || '',
        bio: data.user.bio || '',
        skills: data.user.skills || [],
        profilePicture: data.user.profilePicture || '',
        dateOfBirth: data.user.dateOfBirth ? new Date(data.user.dateOfBirth).toISOString().split('T')[0] : '',
        gender: data.user.gender || 'prefer-not-to-say',
        occupation: data.user.occupation || '',
        emergencyContact: {
          name: data.user.emergencyContact?.name || '',
          phone: data.user.emergencyContact?.phone || '',
          relationship: data.user.emergencyContact?.relationship || ''
        },
        preferences: {
          notifications: data.user.preferences?.notifications ?? true,
          publicProfile: data.user.preferences?.publicProfile ?? true
        }
      });
      setRequestPreferences(data.user.requestPreferences || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch and compute user stats
  const fetchUserStats = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${config.apiBaseUrl}/api/requests/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) return;
      const data = await response.json();
      if (!data.requests || !Array.isArray(data.requests)) return;
      const posted = data.requests.filter(r => r.userId === userId).length;
      const solved = data.requests.filter(r => r.userId === userId && r.status === 'completed').length;
      const helped = data.requests.filter(r => r.completedBy === userId && (r.status === 'in-progress' || r.status === 'completed')).length;
      setStats({ posted, solved, helped });
    } catch (err) {
      // ignore
    }
  };

  // Fetch user rating statistics
  const fetchUserRatingStats = async (userId) => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/ratings/user/${userId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setRatingStats(data.stats);
      }
    } catch (err) {
      // ignore
    }
  };

  const updateFormData = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && formData.skills.length < config.profile.maxSkillsCount) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const saveData = { ...formData, requestPreferences };
      const response = await fetch(`${config.apiBaseUrl}/api/auth/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(saveData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update profile');
      }

      const data = await response.json();
      setUser(data.user);
      setSuccess('Profile updated successfully!');
      setEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to current user data
    setFormData({
      name: user.name || '',
      email: user.email || '',
      address: user.address || '',
      phone: user.phone || '',
      bio: user.bio || '',
      skills: user.skills || [],
      profilePicture: user.profilePicture || '',
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      gender: user.gender || 'prefer-not-to-say',
      occupation: user.occupation || '',
      emergencyContact: {
        name: user.emergencyContact?.name || '',
        phone: user.emergencyContact?.phone || '',
        relationship: user.emergencyContact?.relationship || ''
      },
      preferences: {
        notifications: user.preferences?.notifications ?? true,
        publicProfile: user.preferences?.publicProfile ?? true
      }
    });
    setEditing(false);
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load user profile</p>
          <button 
            onClick={fetchUserProfile}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{user.name}</h1>
                <p className="text-orange-100 mt-1">{user.email}</p>
                {user.occupation && (
                  <p className="text-orange-100 mt-1">{user.occupation}</p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center px-4 py-2 bg-white text-orange-600 rounded-md hover:bg-orange-50 transition-colors"
                  >
                    <Edit size={16} className="mr-2" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                    >
                      <Save size={16} className="mr-2" />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                      <X size={16} className="mr-2" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* User Stats */}
          <div className="mb-6 flex gap-6">
            <div className="bg-blue-50 rounded-lg p-4 flex-1 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.posted}</div>
              <div className="text-sm text-gray-600">Requests Posted</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 flex-1 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.solved}</div>
              <div className="text-sm text-gray-600">Requests Solved</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 flex-1 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.helped}</div>
              <div className="text-sm text-gray-600">Requests Helped With</div>
            </div>
            {ratingStats && ratingStats.totalRatings > 0 && (
              <div className="bg-orange-50 rounded-lg p-4 flex-1 text-center">
                <div className="flex items-center justify-center mb-1">
                  <div className="text-2xl font-bold text-orange-600 mr-2">{ratingStats.averageRating.toFixed(1)}</div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={`${
                          star <= Math.round(ratingStats.averageRating)
                            ? 'text-yellow-500 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-2">Average Rating ({ratingStats.totalRatings} ratings)</div>
                <button
                  onClick={() => window.location.href = `/ratings/${user._id || user.id}`}
                  className="inline-flex items-center px-3 py-1 bg-orange-500 text-white text-xs rounded-full hover:bg-orange-600 transition-colors"
                >
                  <Eye size={12} className="mr-1" />
                  View All Ratings
                </button>
              </div>
            )}
            {user && (
              <button
                className="text-blue-600 hover:underline ml-2"
                onClick={() => setRatingModal({ open: true, existingRating: ratingStats })}
              >
                Edit My Rating
              </button>
            )}
          </div>

          {/* Profile Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                  Basic Information
                </h2>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    {config.profile.formLabels.name}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className={`pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                        !editing ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                      value={formData.name}
                      onChange={(e) => updateFormData('name', e.target.value)}
                      disabled={!editing}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    {config.profile.formLabels.email}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                      value={formData.email}
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    {config.profile.formLabels.address}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className={`pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                        !editing ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                      value={formData.address}
                      onChange={(e) => updateFormData('address', e.target.value)}
                      disabled={!editing}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    {config.profile.formLabels.phone}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      className={`pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                        !editing ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      disabled={!editing}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    {config.profile.formLabels.occupation}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className={`pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                        !editing ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                      value={formData.occupation}
                      onChange={(e) => updateFormData('occupation', e.target.value)}
                      disabled={!editing}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                  Additional Information
                </h2>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    {config.profile.formLabels.bio}
                  </label>
                  <textarea
                    rows={4}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      !editing ? 'bg-gray-50 cursor-not-allowed' : ''
                    }`}
                    value={formData.bio}
                    onChange={(e) => updateFormData('bio', e.target.value)}
                    disabled={!editing}
                    maxLength={config.profile.maxBioLength}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.bio.length}/{config.profile.maxBioLength} characters
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    {config.profile.formLabels.skills}
                  </label>
                  {editing && (
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Add a skill..."
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      />
                      <button
                        type="button"
                        onClick={addSkill}
                        disabled={!skillInput.trim() || formData.skills.length >= config.profile.maxSkillsCount}
                        className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                      >
                        {skill}
                        {editing && (
                          <button
                            type="button"
                            onClick={() => removeSkill(index)}
                            className="ml-2 text-orange-600 hover:text-orange-800"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  {editing && (
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.skills.length}/{config.profile.maxSkillsCount} skills
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    {config.profile.formLabels.dateOfBirth}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      className={`pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                        !editing ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                      value={formData.dateOfBirth}
                      onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                      disabled={!editing}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    {config.profile.formLabels.gender}
                  </label>
                  <select
                    className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      !editing ? 'bg-gray-50 cursor-not-allowed' : ''
                    }`}
                    value={formData.gender}
                    onChange={(e) => updateFormData('gender', e.target.value)}
                    disabled={!editing}
                  >
                    {config.profile.genderOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="mt-8 pt-8 border-t">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-6">
                Emergency Contact
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    {config.profile.formLabels.emergencyContactName}
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      !editing ? 'bg-gray-50 cursor-not-allowed' : ''
                    }`}
                    value={formData.emergencyContact.name}
                    onChange={(e) => updateFormData('emergencyContact.name', e.target.value)}
                    disabled={!editing}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    {config.profile.formLabels.emergencyContactPhone}
                  </label>
                  <input
                    type="tel"
                    className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      !editing ? 'bg-gray-50 cursor-not-allowed' : ''
                    }`}
                    value={formData.emergencyContact.phone}
                    onChange={(e) => updateFormData('emergencyContact.phone', e.target.value)}
                    disabled={!editing}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    {config.profile.formLabels.emergencyContactRelationship}
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                      !editing ? 'bg-gray-50 cursor-not-allowed' : ''
                    }`}
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => updateFormData('emergencyContact.relationship', e.target.value)}
                    disabled={!editing}
                  />
                </div>
              </div>
            </div>

            {/* Service Categories to Receive Requests For */}
            <div className="mt-8 pt-8 border-t">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-6">
                Service Categories to Receive Requests For
              </h2>
              <div className={`w-full border border-gray-300 rounded px-2 py-2 ${!editing ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                style={{ minHeight: '48px' }}>
                {editing ? (
                  <div className="flex flex-wrap gap-2">
                    {config.serviceCategories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        className={`px-3 py-1 rounded-full border text-sm flex items-center gap-1 transition-colors ${
                          requestPreferences.includes(cat.value)
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-orange-50'
                        }`}
                        onClick={() => {
                          setRequestPreferences((prev) =>
                            prev.includes(cat.value)
                              ? prev.filter((v) => v !== cat.value)
                              : [...prev, cat.value]
                          );
                        }}
                      >
                        {cat.label}
                        {requestPreferences.includes(cat.value) && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {requestPreferences.length === 0 && <span className="text-gray-400">No preferences selected</span>}
                    {requestPreferences.map((val) => {
                      const cat = config.serviceCategories.find((c) => c.value === val);
                      return (
                        <span key={val} className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-sm">
                          {cat ? cat.label : val}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <RatingModal
        open={ratingModal.open}
        onClose={() => setRatingModal({ open: false, existingRating: null })}
        existingRating={ratingModal.existingRating}
        onRated={() => fetchUserRatingStats(user._id || user.id)}
      />
    </div>
  );
} 