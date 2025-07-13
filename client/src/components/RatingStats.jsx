import React from 'react';
import { Star, TrendingUp, Award, Users } from 'lucide-react';

export default function RatingStats({ stats, showBreakdown = true, compact = false }) {
  if (!stats || !stats.hasRatings) {
    return (
      <div className="text-center py-4 text-gray-500">
        <Star className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No ratings yet</p>
      </div>
    );
  }

  const { average, totalRatings, ratingBreakdown } = stats;

  const renderStars = (stars, size = 'w-4 h-4') => (
    <div className="flex items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${size} ${i < Math.round(stars) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  const renderBreakdownBar = (rating, count, total) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    
    return (
      <div key={rating} className="flex items-center space-x-2">
        <span className="text-xs text-gray-600 w-4">{rating}</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
      </div>
    );
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1">
          {renderStars(average, 'w-4 h-4')}
          <span className="font-medium text-gray-900">{average.toFixed(1)}</span>
        </div>
        <div className="text-sm text-gray-500">
          ({totalRatings} rating{totalRatings !== 1 ? 's' : ''})
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{average.toFixed(1)}</div>
            <div className="text-sm text-gray-500">out of 5</div>
          </div>
          <div className="flex items-center space-x-1">
            {renderStars(average, 'w-5 h-5')}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-semibold text-gray-900">{totalRatings}</div>
          <div className="text-sm text-gray-500">total ratings</div>
        </div>
      </div>

      {/* Rating Breakdown */}
      {showBreakdown && ratingBreakdown && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Rating Breakdown</h4>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating => 
              renderBreakdownBar(rating, ratingBreakdown[rating] || 0, totalRatings)
            )}
          </div>
        </div>
      )}

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-sm font-medium text-gray-900">
            {ratingBreakdown && ratingBreakdown[5] ? 
              Math.round((ratingBreakdown[5] / totalRatings) * 100) : 0}%
          </div>
          <div className="text-xs text-gray-500">5-star ratings</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Award className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-sm font-medium text-gray-900">
            {average >= 4.5 ? 'Excellent' : 
             average >= 4.0 ? 'Very Good' : 
             average >= 3.5 ? 'Good' : 
             average >= 3.0 ? 'Fair' : 'Poor'}
          </div>
          <div className="text-xs text-gray-500">Overall quality</div>
        </div>
      </div>
    </div>
  );
} 