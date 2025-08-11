// src/components/VoiceLeadingAlternativesModal.js

import React, { useState, useEffect } from 'react';
import { findChordVoicingsWithCache } from '../logic/ChordCalculator';
import { CHORD_TYPES } from '../data/DefaultChordTypes';
import { formatControlCombination } from '../logic/CopedentUtils';
import { formatChordName } from '../utils/ChordFormatting';
import SoundService from '../logic/SoundService';

const VoiceLeadingAlternativesModal = ({
  isOpen,
  onClose,
  chordIndex,
  currentVoicing,
  chord,
  selectedCopedent,
  resultsPerFret,
  onSelectAlternative,
  useSymbols = false
}) => {
  const [alternatives, setAlternatives] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState('fret'); // 'fret', 'pedals'
  const [playingIndex, setPlayingIndex] = useState(null);

  // Calculate pedal complexity for sorting
  const calculatePedalComplexity = (voicing) => {
    return voicing.pedalCombo.length + voicing.leverCombo.length + voicing.mecCombo.length;
  };

  // Load alternative voicings
  useEffect(() => {
    if (!isOpen || !chord || !selectedCopedent) return;

    setIsLoading(true);
    
    try {
      const chordIntervals = CHORD_TYPES[chord.type];
      if (!chordIntervals) {
        setAlternatives([]);
        setIsLoading(false);
        return;
      }

      const rootNoteWithOctave = `${chord.root}4`;
      const allVoicings = findChordVoicingsWithCache(
        selectedCopedent, 
        rootNoteWithOctave, 
        chordIntervals, 
        resultsPerFret, // Use user's chosen resultsPerFret setting
        true // Both Basic and Pro tiers get full copedent access
      );

      // Create alternatives list with basic info
      const alternativesList = allVoicings.map((voicing, index) => {
        const namedVoicing = { ...voicing, chordName: `${chord.root} ${chord.type}` };
        
        return {
          id: index,
          voicing: namedVoicing,
          pedalComplexity: calculatePedalComplexity(voicing),
          isCurrent: currentVoicing && 
            voicing.fret === currentVoicing.fret && 
            JSON.stringify(voicing.pedalCombo) === JSON.stringify(currentVoicing.pedalCombo) &&
            JSON.stringify(voicing.leverCombo) === JSON.stringify(currentVoicing.leverCombo)
        };
      });

      // Sort alternatives
      const sortedAlternatives = [...alternativesList].sort((a, b) => {
        switch (sortBy) {
          case 'fret':
            return a.voicing.fret - b.voicing.fret;
          case 'pedals':
            return a.pedalComplexity - b.pedalComplexity;
          default:
            return a.voicing.fret - b.voicing.fret;
        }
      });

      setAlternatives(sortedAlternatives);
    } catch (error) {
      console.error('Error loading alternatives:', error);
      setAlternatives([]);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, chord, selectedCopedent, resultsPerFret, sortBy, currentVoicing]);

  const handlePlayVoicing = (voicing, index) => {
    if (playingIndex !== null) return; // Already playing

    setPlayingIndex(index);
    try {
      // Filter notes that are played and not masked, same as other pluck buttons in the app
      const notesToPlay = voicing.notes.filter(n => n.isPlayedInVoicing);
      if (notesToPlay.length === 0) return;
      
      SoundService.resumeAudioContext();
      SoundService.playBlockChord(notesToPlay, 1.5);
      
      // Auto-clear playing state after 1.5 seconds (matching the duration)
      setTimeout(() => {
        setPlayingIndex(null);
      }, 1500);
    } catch (error) {
      console.error('Error playing voicing:', error);
      setPlayingIndex(null);
    }
  };

  const handleSelectVoicing = (alternative) => {
    onSelectAlternative(alternative.voicing);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Choose from Chord Pool</h2>
            <p className="text-blue-100">
              Chord {chordIndex + 1}: {formatChordName(chord ? `${chord.root} ${chord.type}` : '', useSymbols)}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-blue-500 text-white border border-blue-400 rounded px-2 py-1 text-sm"
            >
              <option value="fret">Fret Position</option>
              <option value="pedals">Pedal Complexity</option>
            </select>
            <button
              onClick={onClose}
              className="text-blue-200 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[80vh]">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-lg text-gray-600">Loading alternatives...</div>
            </div>
          ) : (
            <div className="space-y-2">
              {alternatives.map((alternative, index) => {
                const { voicing, pedalComplexity, isCurrent } = alternative;
                const controlsText = formatControlCombination(
                  voicing.pedalCombo, 
                  voicing.leverCombo, 
                  voicing.mecCombo, 
                  selectedCopedent
                ) || 'Open';

                return (
                  <div
                    key={alternative.id}
                    className={`border rounded-lg p-3 transition-all cursor-pointer flex items-center justify-between ${
                      isCurrent
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => handleSelectVoicing(alternative)}
                  >
                    {/* Left side - Fret and Controls info */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono bg-gray-100 px-3 py-1 rounded font-bold">
                          F{voicing.fret}
                        </span>
                        {isCurrent && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-blue-700 font-semibold" title={controlsText}>
                        {controlsText}
                      </div>
                      <div className="text-xs text-gray-500">
                        ({pedalComplexity} control{pedalComplexity !== 1 ? 's' : ''})
                      </div>
                    </div>

                    {/* Right side - Play button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayVoicing(voicing, index);
                      }}
                      disabled={playingIndex !== null}
                      className="text-green-600 hover:text-green-700 disabled:opacity-50 px-3 py-1 rounded hover:bg-green-50 transition-colors"
                    >
                      {playingIndex === index ? '🔊 Playing' : '▶️ Play'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && alternatives.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No alternative voicings found for this chord.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {alternatives.length} alternatives found
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceLeadingAlternativesModal;