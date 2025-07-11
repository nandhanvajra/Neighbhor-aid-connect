import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';

export default function ClickableUserName({ userId, userName, className = '', showIcon = false }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('ClickableUserName clicked:', { userId, userName });
    console.log('Navigating to:', `/profile/${userId}`);
    
    // Check if userId is valid
    if (!userId) {
      console.error('No userId provided to ClickableUserName');
      return;
    }
    
    try {
      navigate(`/profile/${userId}`);
      console.log('Navigation triggered successfully');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`text-orange-600 hover:text-orange-700 hover:underline transition-colors ${className}`}
      title={`View ${userName}'s profile`}
    >
      {showIcon && <User size={14} className="inline mr-1" />}
      {userName}
    </button>
  );
} 