// src/components/VLDirectionalControls.js

import React, { useState } from 'react';
import Slider from 'react-slider';
import '../styles/FretRangeSlider.css';

const VLDirectionalControls = ({
  fretStart = 0,
  fretRange = [0, 24],
  jumpSize = 0,
  resultsPerFret = 3,
  isCalculating = false,
  useFavorites = false,
  onDirectionSelect,
  onFretStartChange,
  onFretRangeChange,
  onJumpSizeChange,
  onResultsPerFretChange,
  onToggleUseFavorites,
  className = ''
}) => {
  const directions = [
    { 
      key: 'up', 
      icon: '⬆',
      label: 'Up', 
      description: 'Move up in frets with looping',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    { 
      key: 'down', 
      icon: '⬇',
      label: 'Down', 
      description: 'Move down in frets with looping',
      color: 'bg-green-600 hover:bg-green-700'
    },
    { 
      key: 'zigzag-up', 
      label: 'Up-Down↗↘', 
      description: 'Zig-zag starting upward',
      color: 'bg-sky-400 hover:bg-sky-500'
    },
    { 
      key: 'zigzag-down', 
      label: 'Down-Up↘↗', 
      description: 'Zig-zag starting downward',
      color: 'bg-emerald-400 hover:bg-emerald-500'
    },
    { 
      key: 'random', 
      icon: '🎲',
      label: 'Random', 
      description: 'Random fret selection',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  const handleDirectionClick = (direction) => {
    if (isCalculating) return;
    onDirectionSelect(direction, {
      fretStart,
      fretRange,
      jumpSize,
      resultsPerFret
    });
  };

  const handleRangeChange = (newRange) => {
    // Ensure values are valid numbers and within bounds
    const validRange = [
      Math.max(0, Math.min(24, newRange[0])),
      Math.max(0, Math.min(24, newRange[1]))
    ];
    onFretRangeChange(validRange);
  };

  const handleRangeInputChange = (value, index) => {
    const newRange = [...fretRange];
    newRange[index] = Math.max(0, Math.min(24, parseInt(value) || 0));
    
    // Ensure min <= max
    if (index === 0 && newRange[0] > newRange[1]) {
      newRange[1] = newRange[0];
    } else if (index === 1 && newRange[1] < newRange[0]) {
      newRange[0] = newRange[1];
    }
    
    onFretRangeChange(newRange);
  };

  const handleJumpSizeChange = (newValue) => {
    onJumpSizeChange(Math.max(0, Math.min(11, newValue)));
  };

  return (
    <div className={`bg-white border border-gray-300 rounded-lg shadow-sm py-3 w-full ${className}`}>
      {/* Header */}
      <div className="mb-4 px-4">
        <h2 className="text-2xl font-bold text-gray-800">Voice Leading Controls</h2>
      </div>

      {/* Main Layout: Left (Controls) and Right (Buttons) */}
      <div className="flex items-start justify-between gap-6 px-4">
        
        {/* Left Side: Sliders and Start Fret */}
        <div className="flex-1 space-y-3 pr-2">
          
          {/* Fret Start */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 w-8">Start:</label>
            <input
              type="number"
              min="0"
              max="24"
              value={fretStart}
              onChange={(e) => onFretStartChange(parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1.5 border border-gray-300 rounded-md text-center text-sm font-medium"
            />
            <button
              onClick={onToggleUseFavorites}
              className={`px-2 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                useFavorites 
                  ? 'bg-purple-500 text-white border-purple-500 hover:bg-purple-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              title={useFavorites ? 'Prioritize favorite chords (enabled)' : 'Prioritize favorite chords (disabled)'}
            >
              ⭐ Use Favs
            </button>
          </div>

          {/* Fret Range Slider */}
          <div className="space-y-1 pl-2 pr-2">
            <label className="block text-sm font-medium text-gray-700">Range: {fretRange[0]}-{fretRange[1]}</label>
            <div>
              <Slider
                className="fret-range-slider"
                thumbClassName="slider-thumb"
                trackClassName="slider-track"
                value={fretRange}
                onChange={handleRangeChange}
                min={0}
                max={24}
                pearling
                minDistance={0}
                renderThumb={(props, state) => (
                  <div {...props} data-value={state.valueNow}>
                    {state.valueNow}
                  </div>
                )}
              />
            </div>
            {/* Range inputs */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Min:</span>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={fretRange[0]}
                  onChange={(e) => handleRangeInputChange(e.target.value, 0)}
                  className="w-12 px-1 py-0.5 border border-gray-300 rounded text-center"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Max:</span>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={fretRange[1]}
                  onChange={(e) => handleRangeInputChange(e.target.value, 1)}
                  className="w-12 px-1 py-0.5 border border-gray-300 rounded text-center"
                />
              </div>
            </div>
          </div>

          {/* Jump Size Slider */}
          <div className="space-y-1 pl-2 pr-2">
            <label className="block text-sm font-medium text-gray-700">Jump: {jumpSize}</label>
            <div>
              <Slider
                className="jump-size-slider"
                thumbClassName="slider-thumb"
                trackClassName="slider-track"
                value={jumpSize}
                onChange={handleJumpSizeChange}
                min={0}
                max={11}
                renderThumb={(props, state) => (
                  <div {...props} data-value={state.valueNow}>
                    {state.valueNow}
                  </div>
                )}
              />
            </div>
          </div>
        </div>

        {/* Right Side: Direction Buttons and Results */}
        <div className="flex flex-col items-center gap-3">
          
          {/* Direction Buttons - 2x2 grid with bottom row for Random + Results */}
          <div className="grid grid-cols-2 gap-2">
            {directions.slice(0, 4).map(direction => (
              <button
                key={direction.key}
                onClick={() => handleDirectionClick(direction.key)}
                disabled={isCalculating}
                className={`px-4 py-2.5 text-white text-sm font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${direction.color} min-w-[110px] direction-button`}
                title={direction.description}
              >
                {isCalculating ? '...' : (
                  <>
                    {direction.icon && (
                      <span className={direction.key === 'random' ? 'dice-icon' : 'arrow-icon'}>
                        {direction.icon}
                      </span>
                    )}
                    {direction.label}
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Bottom Row: Random button and Results */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDirectionClick('random')}
              disabled={isCalculating}
              className={`px-4 py-2.5 text-white text-sm font-semibold rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${directions[4].color} direction-button`}
              title={directions[4].description}
            >
              {isCalculating ? '...' : (
                <>
                  <span className="dice-icon">{directions[4].icon}</span>
                  {directions[4].label}
                </>
              )}
            </button>
            
            {/* Results Per Fret */}
            <div className="flex items-center gap-1 ml-2">
              <label className="text-sm font-medium text-gray-700">Results:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={resultsPerFret}
                onChange={(e) => onResultsPerFretChange(parseInt(e.target.value) || 3)}
                className="w-16 px-2 py-1.5 border border-gray-300 rounded-md text-center text-sm font-medium"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VLDirectionalControls;