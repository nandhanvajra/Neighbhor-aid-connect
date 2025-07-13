import React, { useState } from 'react';
import { Star, ThumbsUp, MessageSquare, Calendar, User } from 'lucide-react';

export default function RatingDisplay({ 
  rating, 
  showReview = true, 
  showMetadata = true, 
  compact = false,
  onHelpfulClick = null,
  currentUserId = null
}) {
  const [showFullReview, setShowFullReview] = useState(false);

  if (!rating) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (stars, size = 'w-4 h-4') => (
    <div className="flex items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${size} ${i < stars ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  const renderDetailedRatings = () => {
    const details = [];
    if (rating.qualityOfWork) details.push({ label: 'Quality', value: rating.qualityOfWork });
    if (rating.communication) details.push({ label: 'Communication', value: rating.communication });
    if (rating.professionalism) details.push({ label: 'Professionalism', value: rating.professionalism });

    if (details.length === 0) return null;

    return (
      <div className="space-y-1">
        {details.map((detail, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <span className="text-gray-600">{detail.label}:</span>
            <div className="flex items-center space-x-1">
              {renderStars(detail.value, 'w-3 h-3')}
              <span className="text-gray-500">{detail.value}/5</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {renderStars(rating.stars, 'w-4 h-4')}
        <span className="text-sm text-gray-600">{rating.stars}/5</span>
        {rating.review && (
          <button
            onClick={() => setShowFullReview(!showFullReview)}
            className="text-xs text-orange-600 hover:text-orange-700"
          >
            {showFullReview ? 'Hide' : 'Show'} review
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {renderStars(rating.stars, 'w-5 h-5')}
          <div>
            <span className="font-medium text-gray-900">{rating.stars}/5</span>
            {rating.category && (
              <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                {rating.category}
              </span>
            )}
          </div>
        </div>
        
        {onHelpfulClick && rating.raterId && rating.raterId !== currentUserId && (
          <button
            onClick={() => onHelpfulClick(rating._id)}
            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-orange-600 transition-colors"
          >
            <ThumbsUp size={14} />
            <span>Helpful ({rating.helpfulCount || 0})</span>
          </button>
        )}
      </div>

      {/* Detailed Ratings */}
      {renderDetailedRatings()}

      {/* Review */}
      {showReview && rating.review && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MessageSquare size={14} />
            <span>Review</span>
          </div>
          <div className="text-sm text-gray-700">
            {rating.review.length > 200 && !showFullReview ? (
              <>
                {rating.review.substring(0, 200)}...
                <button
                  onClick={() => setShowFullReview(true)}
                  className="text-orange-600 hover:text-orange-700 ml-1"
                >
                  Read more
                </button>
              </>
            ) : (
              <>
                {rating.review}
                {rating.review.length > 200 && showFullReview && (
                  <button
                    onClick={() => setShowFullReview(false)}
                    className="text-orange-600 hover:text-orange-700 ml-1"
                  >
                    Show less
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      {showMetadata && (
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <User size={12} />
              <span>{rating.isAnonymous ? 'Anonymous' : (rating.raterName || 'User')}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar size={12} />
              <span>{formatDate(rating.createdAt || rating.ratedAt)}</span>
            </div>
          </div>
          
          {rating.responseTime && (
            <div className="text-xs text-gray-500">
              Response: {rating.responseTime} min
            </div>
          )}
        </div>
      )}
    </div>
  );
} 