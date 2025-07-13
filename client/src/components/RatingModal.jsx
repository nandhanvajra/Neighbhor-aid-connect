import React, { useState } from 'react';
import { Star, X, Send, MessageSquare, Clock, Award } from 'lucide-react';
import config from '../config/config';

export default function RatingModal({ 
  open, 
  onClose, 
  requestId, 
  requestCategory, 
  onRated, 
  existingRating = null 
}) {
  const [hoveredOverall, setHoveredOverall] = useState(0);
  const [hoveredQuality, setHoveredQuality] = useState(0);
  const [hoveredCommunication, setHoveredCommunication] = useState(0);
  const [hoveredProfessionalism, setHoveredProfessionalism] = useState(0);
  const [selected, setSelected] = useState(existingRating?.stars || 0);
  const [review, setReview] = useState(existingRating?.review || '');
  const [qualityOfWork, setQualityOfWork] = useState(existingRating?.qualityOfWork || 0);
  const [communication, setCommunication] = useState(existingRating?.communication || 0);
  const [professionalism, setProfessionalism] = useState(existingRating?.professionalism || 0);
  const [isAnonymous, setIsAnonymous] = useState(existingRating?.isAnonymous || false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleRate = async () => {
    if (selected === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const url = existingRating 
        ? `${config.apiBaseUrl}/api/ratings/${existingRating._id}`
        : `${config.apiBaseUrl}/api/ratings`;
      
      const method = existingRating ? 'PUT' : 'POST';
      
      const ratingData = {
        stars: selected,
        review: review.trim(),
        category: requestCategory,
        qualityOfWork: qualityOfWork || null,
        communication: communication || null,
        professionalism: professionalism || null,
        isAnonymous
      };

      if (!existingRating) {
        ratingData.requestId = requestId;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(ratingData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit rating');
      }

      if (onRated) onRated();
      onClose();
    } catch (err) {
      setError(err.message);
      console.error('Rating error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRating = (value, onChange, label, hovered, setHovered, size = 'w-6 h-6') => (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700 min-w-[100px]">{label}:</span>
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            className={`${size} focus:outline-none transition-colors ${
              i < (hovered || value) ? 'text-yellow-500' : 'text-gray-300'
            }`}
            onMouseEnter={() => setHovered(i + 1)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(i + 1)}
            disabled={submitting}
          >
            <Star className={`${size} fill-current`} />
          </button>
        ))}
      </div>
      {value > 0 && (
        <span className="text-sm text-gray-600 ml-2">{value}/5</span>
      )}
    </div>
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {existingRating ? 'Edit Rating' : 'Rate the Helper'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={submitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Overall Rating *
            </label>
            <div className="flex items-center justify-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`w-12 h-12 focus:outline-none transition-colors ${
                    i < (hoveredOverall || selected) ? 'text-yellow-500' : 'text-gray-300'
                  }`}
                  onMouseEnter={() => setHoveredOverall(i + 1)}
                  onMouseLeave={() => setHoveredOverall(0)}
                  onClick={() => setSelected(i + 1)}
                  disabled={submitting}
                >
                  <Star className="w-12 h-12 fill-current" />
                </button>
              ))}
            </div>
            {selected > 0 && (
              <p className="text-center mt-2 text-sm text-gray-600">
                {selected === 1 && 'Poor'}
                {selected === 2 && 'Fair'}
                {selected === 3 && 'Good'}
                {selected === 4 && 'Very Good'}
                {selected === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Detailed Ratings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Detailed Ratings (Optional)</h4>
            {renderStarRating(qualityOfWork, setQualityOfWork, 'Quality of Work', hoveredQuality, setHoveredQuality)}
            {renderStarRating(communication, setCommunication, 'Communication', hoveredCommunication, setHoveredCommunication)}
            {renderStarRating(professionalism, setProfessionalism, 'Professionalism', hoveredProfessionalism, setHoveredProfessionalism)}
          </div>

          {/* Review */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review (Optional)
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience with this helper..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={500}
              disabled={submitting}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">
                {review.length}/500 characters
              </span>
              <label className="flex items-center space-x-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  disabled={submitting}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span>Submit anonymously</span>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRate}
              disabled={submitting || selected === 0}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>{existingRating ? 'Update' : 'Submit'} Rating</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 