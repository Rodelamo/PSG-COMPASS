// src/components/AlternativeVoicingModal.js

import React from 'react';
import { formatControlCombination } from '../logic/CopedentUtils';

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

function AlternativeVoicingModal({ isOpen, onClose, alternatives, onSelect, onPlayChord }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-center text-gray-800">Choose an Alternative Voicing</h2>
        
        <div className="flex-grow overflow-y-auto space-y-2 pr-2">
          {alternatives.length > 0 ? (
            alternatives.map((voicing, index) => (
              <div 
                key={index}
                onClick={() => onSelect(voicing)}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md shadow-sm border border-gray-200 cursor-pointer hover:bg-blue-100 hover:border-blue-400"
              >
                <div>
                  <span className="font-bold text-gray-900">Fret {voicing.fret}</span>
                  <span className="ml-4 text-sm text-blue-700">{formatControlCombination(voicing.pedalCombo, voicing.leverCombo, voicing.mecCombo) || 'Open'}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onPlayChord(voicing); }}
                  className="p-1 text-green-500 hover:text-green-700 rounded-full"
                  title="Play this voicing"
                >
                  <PlayIcon />
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">No other voicings found.</p>
          )}
        </div>

        <div className="mt-6 text-right">
          <button className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default AlternativeVoicingModal;