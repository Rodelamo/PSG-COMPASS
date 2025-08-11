// src/components/ManualEditModal.js - TRANSFORMED TO INTERVAL FILTERING

import React from 'react';
import { getContextualIntervalName } from '../logic/NoteUtils';

function ManualEditModal({ 
  isOpen, 
  onClose, 
  chordType, 
  uniqueChordIntervals, 
  activeIntervalFilters, 
  onIntervalToggle, 
  onRefreshResults 
}) {
  if (!isOpen) return null;

  // Only show interval filtering for 4+ note chords (copied from ChordFinder)
  if (uniqueChordIntervals.length < 4) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Filter Chord Intervals</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          
          <div className="text-center py-8">
            <p className="text-gray-600">Interval filtering is only available for chords with 4 or more intervals.</p>
            <p className="text-gray-500 text-sm mt-2">Current chord ({chordType}) has {uniqueChordIntervals.length} intervals.</p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Filter Chord Intervals</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{chordType}</h3>
          <p className="text-gray-600 mb-4">Uncheck intervals you wish to omit from the search.</p>
        </div>

        {/* Interval Checkboxes (copied from ChordFinder) */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6">
          {uniqueChordIntervals.map(intervalSemitone => {
            const intervalLabel = getContextualIntervalName(intervalSemitone, chordType);
            return (
              <label 
                key={intervalSemitone} 
                className="inline-flex items-center cursor-pointer" 
                title={`Include or exclude the ${intervalLabel} from the search`}
              >
                <input 
                  type="checkbox" 
                  className="form-checkbox h-5 w-5 text-blue-600 rounded" 
                  checked={activeIntervalFilters.includes(intervalSemitone)} 
                  onChange={() => onIntervalToggle(intervalSemitone)} 
                />
                <span className="ml-2 text-gray-700">{intervalLabel}</span>
              </label>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onRefreshResults}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
          >
            Refresh Results
          </button>
        </div>
      </div>
    </div>
  );
}

export default ManualEditModal;