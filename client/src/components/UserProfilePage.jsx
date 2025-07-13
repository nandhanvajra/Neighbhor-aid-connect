import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  MapPin, 
  Phone, 
  Calendar,
  Briefcase,
  Shield,
  ArrowLeft,
  MessageCircle,
  Star,
  Clock,
  Users,
  Heart,
  Award,
  MapPin as LocationIcon
} from 'lucide-react';
import config from '../config/config';

export default function UserProfilePage({ editMode }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [averageRating, setAverageRating] = useState(null);
  const [totalRatings, setTotalRatings] = useState(0);

  console.log('UserProfilePage rendered with userId:', userId, 'editMode:', editMode);

  useEffect(() => {
    console.log('UserProfilePage useEffect triggered with userId:', userId, 'editMode:', editMode);
    fetchUserProfile();
    if (!editMode) checkCurrentUser();
    else setIsCurrentUser(true);
    if (userId) fetchUserRatings();
  }, [userId, editMode]);

  const checkCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${config.apiBaseUrl}/api/auth/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        setIsCurrentUser((data.user._id || data.user.id) === userId);
      }
    } catch (err) {
      console.error('Error checking current user:', err);
    }
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      let response;
      if (editMode) {
        const token = localStorage.getItem('token');
        response = await fetch(`${config.apiBaseUrl}/api/auth/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        response = await fetch(`${config.apiBaseUrl}/api/users/${userId}`);
      }
      console.log('Profile response status:', response.status);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error('Failed to fetch user profile');
      }
      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRatings = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/users/${userId}/ratings`);
      if (response.ok) {
        const data = await response.json();
        setAverageRating(data.averageRating);
        setTotalRatings(data.totalRatings);
      }
    } catch (err) {
      // ignore
    }
  };

  const getJobLabel = (jobValue) => {
    // For now, just return the job value as is
    // You can add job options to config if needed
    return jobValue || 'Not specified';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAge = (dateString) => {
    if (!dateString) return null;
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
            <div className="text-red-500 mb-4">
              <User size={48} className="mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Profile Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              <ArrowLeft size={16} className="mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-white hover:text-orange-100 transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back
            </button>
            <h1 className="text-2xl font-bold">User Profile</h1>
            <div className="w-8"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Profile Header */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white text-center">
                <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User size={48} />
                </div>
                <h2 className="text-xl font-bold mb-1">{user.name}</h2>
                <p className="text-orange-100">{getJobLabel(user.job)}</p>
                {user.role && (
                  <span className="inline-block mt-2 px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                    {user.role}
                  </span>
                )}
                {/* Show average rating if available */}
                {(user.rating > 0 || averageRating > 0) && (
                  <div className="flex items-center justify-center mt-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} className={`w-5 h-5 ${i < Math.round(user.rating || averageRating) ? 'fill-current text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20"><polygon points="9.9,1.1 7.6,6.6 1.6,7.3 6.1,11.2 4.8,17.1 9.9,14.1 15,17.1 13.7,11.2 18.2,7.3 12.2,6.6 "/></svg>
                    ))}
                    <span className="ml-2 text-yellow-200 font-semibold">{(user.rating || averageRating).toFixed(2)} / 5</span>
                    <span className="ml-2 text-orange-100 text-xs">{user.totalRatings || totalRatings} rating{(user.totalRatings || totalRatings) !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="p-6">
                {!isCurrentUser && (
                  <button
                    onClick={() => navigate(`/chat/${user.id}`)}
                    className="w-full mb-3 flex items-center justify-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                  >
                    <MessageCircle size={16} className="mr-2" />
                    Send Message
                  </button>
                )}
                
                {/* View All Ratings Button */}
                {(user.rating?.totalRatings > 0 || totalRatings > 0) && (
                  <button
                    onClick={() => navigate(`/ratings/${userId}`)}
                    className="w-full mb-3 flex items-center justify-center px-4 py-2 border border-orange-500 text-orange-500 rounded-md hover:bg-orange-50 transition-colors"
                  >
                    <Star size={16} className="mr-2" />
                    View All Ratings
                  </button>
                )}
                
                {isCurrentUser && (
                  <button
                    onClick={() => navigate('/profile/edit')}
                    className="w-full flex items-center justify-center px-4 py-2 border border-orange-500 text-orange-500 rounded-md hover:bg-orange-50 transition-colors"
                  >
                    <User size={16} className="mr-2" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <User size={20} className="mr-2 text-orange-500" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                  <p className="text-gray-800">{user.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                  <p className="text-gray-800 flex items-center">
                    <Mail size={14} className="mr-1 text-gray-400" />
                    {user.email}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Job/Profession</label>
                  <p className="text-gray-800 flex items-center">
                    <Briefcase size={14} className="mr-1 text-gray-400" />
                    {getJobLabel(user.job)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                  <p className="text-gray-800 flex items-center">
                    <MapPin size={14} className="mr-1 text-gray-400" />
                    {user.address}
                  </p>
                </div>
                
                {user.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                    <p className="text-gray-800 flex items-center">
                      <Phone size={14} className="mr-1 text-gray-400" />
                      {user.phone}
                    </p>
                  </div>
                )}
                
                {user.dateOfBirth && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Date of Birth</label>
                    <p className="text-gray-800 flex items-center">
                      <Calendar size={14} className="mr-1 text-gray-400" />
                      {formatDate(user.dateOfBirth)}
                      {getAge(user.dateOfBirth) && (
                        <span className="ml-2 text-sm text-gray-500">
                          ({getAge(user.dateOfBirth)} years old)
                        </span>
                      )}
                    </p>
                  </div>
                )}
                
                {user.gender && user.gender !== 'prefer-not-to-say' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
                    <p className="text-gray-800">{user.gender}</p>
                  </div>
                )}
                
                {user.occupation && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Occupation</label>
                    <p className="text-gray-800">{user.occupation}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Heart size={20} className="mr-2 text-orange-500" />
                  About
                </h3>
                <p className="text-gray-700 leading-relaxed">{user.bio}</p>
              </div>
            )}

            {/* Skills */}
            {user.skills && user.skills.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Award size={20} className="mr-2 text-orange-500" />
                  Skills & Expertise
                </h3>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            {user.emergencyContact && (user.emergencyContact.name || user.emergencyContact.phone) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Shield size={20} className="mr-2 text-orange-500" />
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.emergencyContact.name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                      <p className="text-gray-800">{user.emergencyContact.name}</p>
                    </div>
                  )}
                  {user.emergencyContact.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                      <p className="text-gray-800 flex items-center">
                        <Phone size={14} className="mr-1 text-gray-400" />
                        {user.emergencyContact.phone}
                      </p>
                    </div>
                  )}
                  {user.emergencyContact.relationship && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Relationship</label>
                      <p className="text-gray-800">{user.emergencyContact.relationship}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Member Since */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Clock size={20} className="mr-2 text-orange-500" />
                Community Member
              </h3>
              <div className="flex items-center text-gray-600">
                <Users size={16} className="mr-2" />
                <span>Member since {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 