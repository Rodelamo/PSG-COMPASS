// src/components/StringToggleButton.js

import React, { useState } from 'react';
import { getContextualIntervalName, getSemitonesBetween } from '../logic/NoteUtils';

function StringToggleButton({ 
  stringId, 
  stringNote, 
  chordRoot, 
  isPlayed, 
  isAvailable, 
  isUnison = false,
  onClick, 
  className = '',
  disabled = false
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getButtonColor = () => {
    if (disabled) return 'bg-gray-300 cursor-not-allowed';
    if (isPlayed) {
      // Use yellow for unison strings, green for regular played strings
      return isUnison ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600';
    }
    if (isAvailable) return 'bg-gray-400 hover:bg-gray-500';
    return 'bg-red-500 cursor-not-allowed';
  };

  const getTooltipContent = () => {
    if (!stringNote || !chordRoot) return '';
    
    if (isPlayed || isAvailable) {
      try {
        // Calculate semitones between the chord root and the string note
        const rootNoteWithOctave = `${chordRoot}4`;
        const semitones = getSemitonesBetween(rootNoteWithOctave, stringNote);
        const interval = getContextualIntervalName(semitones, `${chordRoot} chord`);
        // Ensure interval is not undefined or null
        const displayInterval = interval || 'N/A';
        return `${stringNote}[${displayInterval}]`;
      } catch (error) {
        console.warn('Error calculating interval:', error);
        return `${stringNote}[N/A]`;
      }
    }
    
    return 'Not available for this chord';
  };

  const handleClick = () => {
    if (disabled) return;
    if (isAvailable || isPlayed) {
      onClick(stringId);
    }
  };

  return (
    <div className="relative">
      <button
        className={`w-4 h-4 rounded-sm border border-gray-300 ${getButtonColor()} ${className}`}
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={!isAvailable && !isPlayed}
        title={getTooltipContent()}
      />
      
      {showTooltip && getTooltipContent() && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap z-50">
          {getTooltipContent()}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
}

export default StringToggleButton;