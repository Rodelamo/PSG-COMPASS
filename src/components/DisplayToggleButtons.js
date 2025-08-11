// src/components/DisplayToggleButtons.js

import React from 'react';

const DisplayToggleButtons = ({ 
  displayMode = 'names', // 'names', 'roman', 'nashville'
  onDisplayModeChange,
  useSymbols = false,
  onToggleSymbols 
}) => {
  const displayOptions = [
    { 
      value: 'names', 
      label: 'Chord Names', 
      icon: '—',
      style: 'px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-mono text-sm min-w-[60px] flex items-center justify-center'
    },
    { 
      value: 'roman', 
      label: 'Roman Numerals', 
      icon: 'V',
      style: 'px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-mono text-sm min-w-[60px] flex items-center justify-center relative border-t-2 border-b-2 border-white'
    },
    { 
      value: 'nashville', 
      label: 'Nashville Numbers', 
      icon: 'NNS',
      style: 'px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-mono text-xs min-w-[60px] flex items-center justify-center'
    }
  ];

  const currentOption = displayOptions.find(opt => opt.value === displayMode) || displayOptions[0];

  return (
    <div className="flex items-center space-x-3">
      {/* Display Mode Toggle (3 options cycling) */}
      <div className="flex items-center">
        <label className="text-sm font-medium text-gray-700 mr-2">Display:</label>
        <button
          onClick={() => {
            const currentIndex = displayOptions.findIndex(opt => opt.value === displayMode);
            const nextIndex = (currentIndex + 1) % displayOptions.length;
            onDisplayModeChange(displayOptions[nextIndex].value);
          }}
          className={currentOption.style}
          title="Choose between Chord Names, Roman or Nashville Numerical systems"
        >
          {displayMode === 'roman' && (
            <>
              <div className="absolute top-0 left-2 right-2 border-t border-white"></div>
              <span>{currentOption.icon}</span>
              <div className="absolute bottom-0 left-2 right-2 border-b border-white"></div>
            </>
          )}
          {displayMode !== 'roman' && <span>{currentOption.icon}</span>}
        </button>
      </div>

      {/* Symbol Toggle - ALWAYS VISIBLE and ALWAYS ENABLED */}
      <div className="flex items-center">
        <label className="text-sm font-medium text-gray-700 mr-2">Symbols:</label>
        <button
          onClick={onToggleSymbols}
          className={`px-3 py-2 rounded-md transition-colors font-mono text-sm min-w-[60px] flex items-center justify-center ${
            useSymbols 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
          title={`Current: ${useSymbols ? 'Symbols' : 'Letters'}. Click to toggle between standard letters and musical symbols.`}
        >
          {useSymbols ? 'C−' : 'Cm'}
        </button>
      </div>
    </div>
  );
};

export default DisplayToggleButtons;