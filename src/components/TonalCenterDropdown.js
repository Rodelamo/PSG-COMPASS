// src/components/TonalCenterDropdown.js

import React, { useState } from 'react';

const TonalCenterDropdown = ({ selectedKey, onKeyChange, useSharps, onToggleSharps }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Define all keys with their relative relationships
  const majorKeys = [
    { key: 'C', relative: 'Am' },
    { key: 'D♭', relative: 'B♭m' },
    { key: 'D', relative: 'Bm' },
    { key: 'E♭', relative: 'Cm' },
    { key: 'E', relative: 'C♯m' },
    { key: 'F', relative: 'Dm' },
    { key: 'G♭', relative: 'E♭m' },
    { key: 'G', relative: 'Em' },
    { key: 'A♭', relative: 'Fm' },
    { key: 'A', relative: 'F♯m' },
    { key: 'B♭', relative: 'Gm' },
    { key: 'B', relative: 'G♯m' }
  ];

  const minorKeys = [
    { key: 'Am', relative: 'C' },
    { key: 'B♭m', relative: 'D♭' },
    { key: 'Bm', relative: 'D' },
    { key: 'Cm', relative: 'E♭' },
    { key: 'C♯m', relative: 'E' },
    { key: 'Dm', relative: 'F' },
    { key: 'E♭m', relative: 'G♭' },
    { key: 'Em', relative: 'G' },
    { key: 'Fm', relative: 'A♭' },
    { key: 'F♯m', relative: 'A' },
    { key: 'Gm', relative: 'B♭' },
    { key: 'G♯m', relative: 'B' }
  ];

  const handleKeySelect = (key) => {
    onKeyChange(key);
    setIsOpen(false);
  };

  const getDisplayLabel = (keyObj) => {
    if (keyObj.key === selectedKey) {
      return keyObj.key;
    } else if (keyObj.relative === selectedKey) {
      return `${keyObj.key} - Relative`;
    } else {
      return keyObj.key;
    }
  };

  const isRelative = (keyObj) => keyObj.relative === selectedKey;

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        {/* Sharp/Flat Toggle Button */}
        <button
          onClick={onToggleSharps}
          className="px-3 py-2 bg-green-600 text-white font-mono text-sm rounded-md hover:bg-green-700 transition-colors"
          title="Toggle Sharps/Flats"
        >
          {useSharps ? '♯' : '♭'}
        </button>

        {/* Tonal Center Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[100px] text-left"
          >
            <span className="font-medium">{selectedKey}</span>
            <svg
              className={`inline ml-2 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute z-50 mt-1 w-48 bg-gray-800 text-white rounded-md shadow-lg max-h-96 overflow-y-auto">
              {/* Major Keys Section */}
              <div className="px-3 py-2 text-sm font-semibold text-gray-300 border-b border-gray-600">
                Major
              </div>
              {majorKeys.map((keyObj) => (
                <button
                  key={keyObj.key}
                  onClick={() => handleKeySelect(keyObj.key)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors ${
                    keyObj.key === selectedKey ? 'bg-blue-600 text-white' : ''
                  } ${isRelative(keyObj) ? 'text-gray-400' : ''}`}
                >
                  {getDisplayLabel(keyObj)}
                  {keyObj.key === selectedKey && (
                    <svg className="inline ml-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}

              {/* Minor Keys Section */}
              <div className="px-3 py-2 text-sm font-semibold text-gray-300 border-b border-gray-600 border-t border-gray-600 mt-2">
                Minor
              </div>
              {minorKeys.map((keyObj) => (
                <button
                  key={keyObj.key}
                  onClick={() => handleKeySelect(keyObj.key)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors ${
                    keyObj.key === selectedKey ? 'bg-blue-600 text-white' : ''
                  } ${isRelative(keyObj) ? 'text-gray-400' : ''}`}
                >
                  {getDisplayLabel(keyObj)}
                  {keyObj.key === selectedKey && (
                    <svg className="inline ml-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default TonalCenterDropdown;