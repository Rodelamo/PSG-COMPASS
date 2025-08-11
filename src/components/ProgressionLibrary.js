// src/components/ProgressionLibrary.js

import React, { useState } from 'react';
import { PROGRESSION_CATEGORIES, convertProgressionToChords } from '../data/DefaultProgressions';
import { CHROMATIC_SCALE_SHARPS, CHROMATIC_SCALE_FLATS } from '../data/Notes';

function ProgressionLibrary({ isOpen, onClose, onSelectProgression, currentKey = 'C', useSharps = true }) {
  const [selectedCategory, setSelectedCategory] = useState(PROGRESSION_CATEGORIES[0]?.name || '');
  const [tonalCenter, setTonalCenter] = useState(currentKey);
  const [showNashville, setShowNashville] = useState(false);

  if (!isOpen) return null;

  const rootNoteOptions = useSharps ? CHROMATIC_SCALE_SHARPS : CHROMATIC_SCALE_FLATS;
  const selectedCategoryData = PROGRESSION_CATEGORIES.find(cat => cat.name === selectedCategory);

  const handleSelectProgression = (progression) => {
    const chords = convertProgressionToChords(progression, tonalCenter);
    onSelectProgression({
      name: progression.name,
      chords: chords,
      tonalCenter: tonalCenter,
      originalProgression: progression
    });
    onClose();
  };

  const formatProgressionDisplay = (progression) => {
    const notation = showNashville ? progression.nashvilleNumbers : progression.romanNumerals;
    return notation.join(' - ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Chord Progression Library</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              &times;
            </button>
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center">
              <label htmlFor="tonal-center" className="text-sm font-medium text-gray-700 mr-2">
                Key:
              </label>
              <select
                id="tonal-center"
                value={tonalCenter}
                onChange={(e) => setTonalCenter(e.target.value)}
                className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {rootNoteOptions.map(note => (
                  <option key={note} value={note}>{note}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center">
              <label htmlFor="notation-toggle" className="text-sm font-medium text-gray-700 mr-2">
                Notation:
              </label>
              <button
                id="notation-toggle"
                onClick={() => setShowNashville(!showNashville)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  showNashville 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-blue-600 text-white'
                }`}
              >
                {showNashville ? 'Nashville Numbers' : 'Roman Numerals'}
              </button>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            {PROGRESSION_CATEGORIES.map(category => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === category.name
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Progression list */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {selectedCategoryData && (
            <div className="space-y-4">
              {selectedCategoryData.progressions.map((progression, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleSelectProgression(progression)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {progression.name}
                    </h3>
                    <div className="text-sm text-gray-600">
                      {progression.romanNumerals.length} chords
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <span className="text-lg font-mono text-blue-600">
                      {formatProgressionDisplay(progression)}
                    </span>
                  </div>
                  
                  {/* Preview in selected key */}
                  <div className="mb-2">
                    <span className="text-sm text-gray-600 mr-2">In {tonalCenter}:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {convertProgressionToChords(progression, tonalCenter)
                        .map(chord => `${chord.root} ${chord.type}`)
                        .join(' - ')}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    {progression.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Click any progression to add it to your Voice Leader
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressionLibrary;