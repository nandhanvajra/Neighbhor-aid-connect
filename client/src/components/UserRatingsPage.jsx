import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Filter, SortAsc, SortDesc, MessageSquare } from 'lucide-react';
import RatingDisplay from './RatingDisplay';
import RatingStats from './RatingStats';
import config from '../config/config';

export default function UserRatingsPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('all'); // all, 5, 4, 3, 2, 1
  const [sortBy, setSortBy] = useState('createdAt'); // createdAt, stars, helpfulCount
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc

  useEffect(() => {
    fetchUserRatings();
    fetchUserStats();
  }, [userId, currentPage, filter, sortBy, sortOrder]);

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/ratings/user/${userId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  };

  const fetchUserRatings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        sort: sortBy
      });

      if (filter !== 'all') {
        params.append('stars', filter);
      }

      const response = await fetch(`${config.apiBaseUrl}/api/ratings/user/${userId}?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch ratings');
      }

      const data = await response.json();
      
      if (currentPage === 1) {
        setRatings(data.ratings);
      } else {
        setRatings(prev => [...prev, ...data.ratings]);
      }
      
      setHasMore(data.pagination.hasMore);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching ratings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
    setRatings([]);
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setCurrentPage(1);
    setRatings([]);
  };

  const handleHelpfulClick = async (ratingId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiBaseUrl}/api/ratings/${ratingId}/helpful`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Update the rating in the list
        setRatings(prev => prev.map(rating => 
          rating._id === ratingId 
            ? { ...rating, helpfulCount: (rating.helpfulCount || 0) + 1 }
            : rating
        ));
      }
    } catch (err) {
      console.error('Error marking rating as helpful:', err);
    }
  };

  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  };

  const currentUser = getCurrentUser();

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ratings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-white hover:text-orange-100 transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back
            </button>
            <h1 className="text-2xl font-bold">User Ratings</h1>
            <div className="w-8"></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Rating Statistics */}
        {stats && (
          <div className="mb-8">
            <RatingStats stats={stats} />
          </div>
        )}

        {/* Filters and Sort */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filter */}
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <select
                value={filter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <button
                onClick={() => handleSortChange('createdAt')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                  sortBy === 'createdAt' 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>Date</span>
                {sortBy === 'createdAt' && (
                  sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
                )}
              </button>
              <button
                onClick={() => handleSortChange('stars')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                  sortBy === 'stars' 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Star size={14} />
                <span>Rating</span>
                {sortBy === 'stars' && (
                  sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
                )}
              </button>
              <button
                onClick={() => handleSortChange('helpfulCount')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                  sortBy === 'helpfulCount' 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MessageSquare size={14} />
                <span>Helpful</span>
                {sortBy === 'helpfulCount' && (
                  sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Ratings List */}
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {ratings.length === 0 && !loading ? (
            <div className="text-center py-8 text-gray-500">
              <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No ratings found</p>
              <p className="text-sm">This user hasn't received any ratings yet.</p>
            </div>
          ) : (
            ratings.map((rating) => (
              <RatingDisplay
                key={rating._id}
                rating={rating}
                onHelpfulClick={handleHelpfulClick}
                currentUserId={currentUser?.id}
              />
            ))
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More Ratings'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 