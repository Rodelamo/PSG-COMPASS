// src/components/MultiCustomizationButton.js

import React, { useState } from 'react';

/**
 * MultiCustomizationButton Component
 * Cycling button that displays 🎛️(n) and cycles through customizations 0→1→2→3→4→5→0
 * Provides instant preview of each customization state
 */
function MultiCustomizationButton({
  currentCustomization = 0,
  customizationCount = 0,
  onCycle,
  disabled = false,
  size = 'medium',
  className = ''
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled || !onCycle) return;
    
    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 200);
    
    // Calculate next customization (0→1→2→...→5→0)
    const maxCustomizations = Math.min(customizationCount, 5);
    const nextCustomization = currentCustomization >= maxCustomizations 
      ? 0 
      : currentCustomization + 1;
    
    onCycle(nextCustomization);
  };

  // Size configurations
  const sizeConfig = {
    small: {
      button: 'w-8 h-8 text-sm',
      text: 'text-sm'
    },
    medium: {
      button: 'w-10 h-10 text-base',
      text: 'text-base'
    },
    large: {
      button: 'w-12 h-12 text-lg', 
      text: 'text-lg'
    }
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // Visual states based on customization count and current state
  const getButtonColor = () => {
    if (disabled) return 'text-gray-300 cursor-not-allowed';
    if (currentCustomization === 0) return 'text-gray-600 hover:text-blue-600'; // Default
    return 'text-blue-600 hover:text-blue-700'; // Has customization applied
  };

  const getTooltipText = () => {
    if (disabled) return 'Customization cycling disabled';
    if (customizationCount === 0) return 'No customizations available';
    
    const nextCustomization = currentCustomization >= customizationCount ? 0 : currentCustomization + 1;
    const nextName = nextCustomization === 0 ? 'Default' : `Customization ${nextCustomization}`;
    
    return `Click to switch to: ${nextName}`;
  };

  const hasCustomizations = customizationCount > 0;

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        ${config.button}
        ${getButtonColor()}
        inline-flex items-center justify-center
        rounded-md border border-gray-300
        transition-all duration-150 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}
        ${isAnimating ? 'scale-110' : ''}
        ${currentCustomization > 0 ? 'bg-blue-50 border-blue-400' : 'bg-white'}
        ${className}
      `}
      title={getTooltipText()}
      aria-label={getTooltipText()}
      style={{ minWidth: '44px', minHeight: '44px' }} // Touch-friendly minimum
    >
      <span 
        className={`
          ${config.text}
          font-medium
          transition-transform duration-150
          ${isAnimating ? 'animate-pulse' : ''}
          ${!hasCustomizations ? 'opacity-50' : ''}
        `}
      >
        🎛️({currentCustomization})
      </span>
    </button>
  );
}

export default MultiCustomizationButton;