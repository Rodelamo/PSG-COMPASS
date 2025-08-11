// src/components/StarToggleButton.js

import React, { useState } from 'react';

/**
 * StarToggleButton Component
 * Reusable star button for toggling favorite status of chords
 * Shows filled star for favorites, outline star for non-favorites
 */
function StarToggleButton({ 
  chordData, 
  copedentId, 
  isFavorite = false, 
  onToggle, 
  size = 'medium',
  disabled = false,
  className = ''
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || !onToggle) return;
    
    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 200);
    
    // Call the toggle handler
    try {
      await onToggle(chordData, copedentId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Size configurations
  const sizeConfig = {
    small: {
      button: 'w-6 h-6 text-sm',
      star: 'text-sm'
    },
    medium: {
      button: 'w-8 h-8 text-base',
      star: 'text-base'
    },
    large: {
      button: 'w-10 h-10 text-lg',
      star: 'text-lg'
    }
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // Visual states
  const getStarContent = () => {
    if (isFavorite) {
      return '⭐'; // Filled star for favorites
    } else {
      return '☆'; // Outline star for non-favorites
    }
  };

  const getStarColor = () => {
    if (disabled) return 'text-gray-300';
    if (isFavorite) return 'text-yellow-500'; // Gold for favorites
    return 'text-gray-400 hover:text-yellow-400'; // Gray with hover
  };

  const getTooltipText = () => {
    if (disabled) return 'Favorite toggle disabled';
    return isFavorite ? 'Remove from favorites' : 'Add to favorites';
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        ${config.button}
        ${getStarColor()}
        inline-flex items-center justify-center
        rounded-full
        transition-all duration-150 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-opacity-50
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
        ${isAnimating ? 'scale-125' : ''}
        ${className}
      `}
      title={getTooltipText()}
      aria-label={getTooltipText()}
    >
      <span 
        className={`
          ${config.star}
          transition-transform duration-150
          ${isAnimating ? 'animate-pulse' : ''}
        `}
      >
        {getStarContent()}
      </span>
    </button>
  );
}

export default StarToggleButton;