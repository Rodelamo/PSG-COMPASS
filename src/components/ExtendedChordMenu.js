// src/components/ExtendedChordMenu.js

import React, { useState } from 'react';
import { CHORD_CATEGORIES } from '../data/DefaultChordTypes';
import { CHROMATIC_SCALE_SHARPS, CHROMATIC_SCALE_FLATS } from '../data/Notes';

const ExtendedChordMenu = ({ 
  isOpen, 
  onClose, 
  onChordSelect, 
  tonalCenter = 'C',
  position = { x: 0, y: 0 }
}) => {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedRoot, setSelectedRoot] = useState('C');
  const [useSharps, setUseSharps] = useState(true);
  
  if (!isOpen) return null;

  // Use the same chord categories as ChordFinder, excluding slash chords
  const availableCategories = CHORD_CATEGORIES.filter(cat => 
    !cat.name.toLowerCase().includes('slash') &&
    !cat.name.toLowerCase().includes('poly')
  );

  const currentCategory = availableCategories[selectedCategory];
  const rootNoteOptions = useSharps ? CHROMATIC_SCALE_SHARPS : CHROMATIC_SCALE_FLATS;

  // Build proper chord object with selected root and type
  const buildChordObject = (chordType) => {
    return {
      root: selectedRoot,
      type: chordType
    };
  };

  const handleEnharmonicToggle = () => {
    setUseSharps(!useSharps);
    // Convert current root to new system if needed
    const conversionMap = useSharps ? 
      {'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'} :
      {'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'};
    const newRoot = conversionMap[selectedRoot] || selectedRoot;
    setSelectedRoot(newRoot);
  };

  const handleChordSelect = (chord) => {
    onChordSelect(buildChordObject(chord.name));
    onClose();
  };

  return (
    <>
      {/* Full-screen backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-40 z-40"
        onClick={onClose}
      />
      
      {/* Full-screen container */}
      <div className="fixed inset-0 z-50 flex bg-white">
        {/* Left sidebar: Categories */}
        <div className="w-80 bg-gray-100 border-r border-gray-300 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Extended Chords</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Root Note Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Root Note</label>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleEnharmonicToggle} 
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-green-600 text-white hover:bg-green-700 font-mono text-sm" 
                  title="Toggle between Sharps (#) and Flats (b)"
                >
                  {useSharps ? '#' : 'b'}
                </button>
                <select 
                  className="flex-1 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  value={selectedRoot} 
                  onChange={(e) => setSelectedRoot(e.target.value)}
                >
                  {rootNoteOptions.map(note => (
                    <option key={note} value={note}>{note}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Category list */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {availableCategories.map((category, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedCategory(index)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === index
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{category.name}</span>
                    <span className="text-xs opacity-75">
                      {category.chords.length}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right content: Chord grid */}
        <div className="flex-1 flex flex-col">
          {/* Content header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentCategory.name}</h2>
            <p className="text-gray-600 mb-4">
              {currentCategory.chords.length} chord type{currentCategory.chords.length !== 1 ? 's' : ''} available
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Selected Root:</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-mono font-bold">
                {selectedRoot}
              </span>
            </div>
          </div>

          {/* Chord grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {currentCategory.chords.map((chord, index) => (
                <button
                  key={index}
                  onClick={() => handleChordSelect(chord)}
                  className="p-4 bg-white hover:bg-blue-50 rounded-lg cursor-pointer transition-all duration-200 border border-gray-200 hover:border-blue-300 hover:shadow-md"
                >
                  <div className="text-center">
                    <div className="font-bold text-gray-800 text-lg mb-1">
                      {selectedRoot}
                    </div>
                    <div className="text-sm font-mono text-gray-600 break-words">
                      {chord.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Empty state */}
            {currentCategory.chords.length === 0 && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-gray-500 text-lg mb-2">No chords in this category</p>
                  <p className="text-gray-400 text-sm">This category is currently empty</p>
                </div>
              </div>
            )}

            {/* Info panel */}
            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">About Extended Chord Selection</h4>
              <div className="text-sm text-blue-700 space-y-2">
                <p>
                  <strong>Independent Root Selection:</strong> Choose any root note, regardless of your current key. 
                  This gives you access to all possible chord combinations.
                </p>
                <p>
                  <strong>Comprehensive Library:</strong> All chord types from the Chord Finder mode are available here, 
                  organized by musical categories for easy browsing.
                </p>
                <p>
                  <strong>Professional Notation:</strong> Toggle between sharp (#) and flat (♭) notation systems 
                  to match your preferred style or key signature.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExtendedChordMenu;