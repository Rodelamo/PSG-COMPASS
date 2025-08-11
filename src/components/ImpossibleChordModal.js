// src/components/ImpossibleChordModal.js

import React, { useState, useEffect, useMemo } from 'react';
import { CHORD_TYPES } from '../data/DefaultChordTypes';
import { getContextualIntervalName } from '../logic/NoteUtils';

function ImpossibleChordModal({ isOpen, onClose, failedChordInfo, onSimplify }) {
  const [selectedIntervals, setSelectedIntervals] = useState(new Set());

  const { root, type } = failedChordInfo?.failedChord || {};
  
  // FIX: Wrap the initialization of 'allIntervals' in its own useMemo() Hook
  const allIntervals = useMemo(() => CHORD_TYPES[type] || [], [type]);

  useEffect(() => {
    // When the modal opens with new chord info, pre-select all its intervals
    if (type) {
      setSelectedIntervals(new Set(allIntervals));
    }
  }, [type, allIntervals]);

  const handleIntervalToggle = (interval) => {
    setSelectedIntervals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(interval)) {
        newSet.delete(interval);
      } else {
        newSet.add(interval);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    onSimplify(Array.from(selectedIntervals));
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-2 text-center text-red-700">Impossible Chord</h2>
        <p className="text-center text-gray-700 mb-4">
          The chord <span className="font-semibold">{root} {type}</span> cannot be played on the selected strings.
        </p>
        <div className="p-4 bg-gray-50 border rounded-md">
          <p className="font-semibold mb-3 text-gray-800">Try removing non-essential notes to find a simpler version:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {allIntervals.map(interval => {
              // The Root and the defining 3rd (Major/minor) are essential
              const isEssential = interval === 0 || interval === 3 || interval === 4;
              return (
                <label key={interval} className={`flex items-center p-2 rounded-md transition-colors ${isEssential ? 'cursor-not-allowed bg-gray-200' : 'cursor-pointer hover:bg-blue-100'}`}>
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-blue-600 rounded"
                    checked={selectedIntervals.has(interval)}
                    onChange={() => handleIntervalToggle(interval)}
                    disabled={isEssential}
                  />
                  <span className={`ml-2 font-medium ${isEssential ? 'text-gray-500' : 'text-gray-800'}`}>
                    {getContextualIntervalName(interval, type)}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400" onClick={onClose}>Cancel</button>
          <button 
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={selectedIntervals.size < 3}
          >
            Find Simpler Chord
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImpossibleChordModal;