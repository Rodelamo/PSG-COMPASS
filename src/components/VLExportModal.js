// src/components/VLExportModal.js

import React, { useState, useCallback } from 'react';
import { formatControlCombination } from '../logic/CopedentUtils';
import SoundService from '../logic/SoundService';

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h6l-3-3-3 3zm0 4h6l-3 3-3-3z" />
  </svg>
);

const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h6v4H9z" />
  </svg>
);

const MetronomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="inline">
    <path d="M2 8h8l-1-2H3l-1 2z"/>
    <path d="M4 2h4l2 6H2L4 2z"/>
  </svg>
);

function TabPreview({ voicing, copedent, maskedStrings = [] }) {
  const allStrings = copedent.strings.sort((a, b) => a.id - b.id);
  
  return (
    <div className="bg-white p-3 border-2 border-gray-400 rounded-lg shadow-sm">
      {/* Header with chord name and controls */}
      <div className="text-center mb-2">
        <div className="bg-white border border-gray-300 rounded-lg p-2">
          <p className="font-bold text-gray-800 text-sm">{voicing.chordName}</p>
          <p className="text-xs text-blue-700 font-semibold">{formatControlCombination(voicing.pedalCombo, voicing.leverCombo, voicing.mecCombo, copedent) || 'Open'}</p>
        </div>
      </div>
      
      {/* Tablature grid matching ProgressionTablature format */}
      <div className="bg-gray-50 rounded-md p-2">
        <div className="inline-flex space-x-0">
          {/* String labels column */}
          <div className="flex-shrink-0 w-12 bg-white">
            {allStrings.map((string, stringIndex) => {
              const isLastString = stringIndex === allStrings.length - 1;
              return (
                <div key={`label-${string.id}`} className={`relative h-6 border-t border-gray-400 flex items-center justify-center text-xs ${stringIndex === 0 ? 'border-t-2' : ''} ${isLastString ? 'border-b-2' : ''}`}>
                  {/* String line background */}
                  <div className="absolute inset-0 border-t-2 border-gray-800"></div>
                  <span className="text-xs font-mono text-gray-600 bg-white px-1 z-10">
                    {string.id} {string.openNote.replace(/\d+$/, '')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Single chord column */}
          <div className="flex-shrink-0">
            <div className="w-24 border-l border-r border-gray-400">
              {allStrings.map((string, stringIndex) => {
                const note = voicing.notes.find(n => n.stringId === string.id);
                const isPlayed = note && note.isPlayedInVoicing;
                const fretNumber = isPlayed ? voicing.fret : '';
                const isMasked = maskedStrings.includes(string.id);
                
                // Get active controls for this specific string
                let activeControlsForString = '';
                if (note && note.activeControls && note.activeControls.length > 0) {
                  const pedalIds = note.activeControls.filter(id => id.startsWith('P'));
                  const leverIds = note.activeControls.filter(id => !id.startsWith('P') && !id.startsWith('M'));
                  const mecIds = note.activeControls.filter(id => id.startsWith('M'));
                  activeControlsForString = formatControlCombination(pedalIds, leverIds, mecIds, copedent).replace(/[()]/g, '');
                }
                
                const isLastString = stringIndex === allStrings.length - 1;
                
                return (
                  <div key={string.id} className={`relative h-6 border-t border-gray-400 flex items-center ${stringIndex === 0 ? 'border-t-2' : ''} ${isLastString ? 'border-b-2' : ''}`}>
                    {/* String line background */}
                    <div className="absolute inset-0 border-t-2 border-gray-800"></div>
                    
                    {/* Fret number and control indicators - only show if not masked */}
                    <div className="w-full flex items-center relative">
                      {isPlayed && !isMasked && (
                        <>
                          {/* Fret number - left side, consistent position */}
                          <div className="absolute left-2">
                            <span className="font-bold text-xs text-gray-900 bg-white px-1 z-10">
                              {fretNumber}
                            </span>
                          </div>
                          {/* Control indicators - right side of fret number */}
                          {activeControlsForString && (
                            <div className="absolute left-6">
                              <span className="text-[10px] font-bold text-gray-900 bg-white px-1 z-10">
                                {activeControlsForString}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* String numbers column */}
          <div className="flex-shrink-0 w-6 bg-white">
            {allStrings.map((string, stringIndex) => {
              const isLastString = stringIndex === allStrings.length - 1;
              return (
                <div key={`right-${string.id}`} className={`relative h-6 border-t border-gray-400 flex items-center justify-center ${stringIndex === 0 ? 'border-t-2' : ''} ${isLastString ? 'border-b-2' : ''}`}>
                  {/* String line background */}
                  <div className="absolute inset-0 border-t-2 border-gray-800"></div>
                  <span className="text-xs font-mono text-gray-600 bg-white px-1 z-10">{string.id}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function VLExportModal({ 
  progression, 
  selectedCopedent, 
  onClose, 
  onExportPdf,
  tempo,
  metronomeEnabled,
  timeSignature = '4/4',
  maskedStrings = []
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [headerText, setHeaderText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(-1);
  const [progressionInterval, setProgressionInterval] = useState(null);

  const handleModalContentClick = (e) => e.stopPropagation();

  const handleLocalExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    await onExportPdf(progression, headerText);
    setIsExporting(false);
  };

  // Stop progression playback
  const stopProgressionPlayback = useCallback(() => {
    if (progressionInterval) {
      clearInterval(progressionInterval);
      setProgressionInterval(null);
    }
    setIsPlaying(false);
    setCurrentPlayingIndex(-1);
  }, [progressionInterval]);

  // Play progression sequence
  const handlePlayProgression = () => {
    if (isPlaying) {
      stopProgressionPlayback();
      return;
    }

    if (!progression || progression.length === 0) return;

    setIsPlaying(true);
    SoundService.resumeAudioContext();

    // Calculate timing based on tempo
    const beatDurationMs = (60 / tempo) * 1000;
    const beatsPerMeasure = timeSignature === '3/4' ? 3 : 4;

    let currentBeatIndex = 0;
    
    const playBeat = () => {
      try {
        if (currentBeatIndex >= progression.length) {
          stopProgressionPlayback();
          return;
        }

        const voicing = progression[currentBeatIndex];
        const beatInMeasure = currentBeatIndex % beatsPerMeasure;
        
        // Play metronome click if enabled
        if (metronomeEnabled) {
          try {
            const isDownbeat = beatInMeasure === 0;
            const frequency = isDownbeat ? 1000 : 800;
            const duration = 0.1;
            
            const oscillator = SoundService.audioContext.createOscillator();
            const gainNode = SoundService.audioContext.createGain();
            
            oscillator.frequency.setValueAtTime(frequency, SoundService.audioContext.currentTime);
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.3, SoundService.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, SoundService.audioContext.currentTime + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(SoundService.audioContext.destination);
            
            oscillator.start(SoundService.audioContext.currentTime);
            oscillator.stop(SoundService.audioContext.currentTime + duration);
          } catch (error) {
            console.warn('Metronome click failed:', error);
          }
        }

        // Update visual feedback
        setCurrentPlayingIndex(currentBeatIndex);

        // Play chord
        if (voicing && voicing.notes) {
          try {
            const notesToPlay = voicing.notes.filter(n => n && n.isPlayedInVoicing);
            if (notesToPlay.length > 0) {
              SoundService.playBlockChord(notesToPlay, 1.5);
            }
          } catch (error) {
            console.warn('Chord playback failed:', error);
          }
        }

        currentBeatIndex++;
      } catch (error) {
        console.error('Playback error:', error);
        stopProgressionPlayback();
      }
    };

    // Start playback
    playBeat(); // Play first beat immediately
    const interval = setInterval(playBeat, beatDurationMs);
    setProgressionInterval(interval);
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopProgressionPlayback();
    };
  }, [stopProgressionPlayback]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col" onClick={handleModalContentClick}>
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-700">Exporting Arrangement to PDF</h2>

        <div className="flex justify-between items-center mb-4 p-2 bg-gray-100 rounded-lg">
          <div className="flex items-center space-x-4">
            {/* Sequence play button */}
            <button
              onClick={handlePlayProgression}
              className={`flex items-center px-3 py-2 text-white font-medium rounded-md transition-colors ${
                isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
              title={isPlaying ? 'Stop Sequence' : 'Play Sequence'}
            >
              {isPlaying ? <StopIcon /> : <PlayIcon />}
              <span className="ml-1">{isPlaying ? 'Stop' : 'Play'}</span>
            </button>

            {/* Metronome toggle - visual only, uses parent state */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Click:</span>
              <div className={`px-2 py-1 text-sm font-medium rounded-md ${
                metronomeEnabled ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'
              }`}>
                <MetronomeIcon />
                <span className="ml-1">{metronomeEnabled ? 'ON' : 'OFF'}</span>
              </div>
            </div>

            {/* Tempo display */}
            <div className="text-sm text-gray-600">
              Tempo: {tempo} BPM
            </div>
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto mb-6 border border-gray-300 rounded-md p-4">
          {progression.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No progression to export.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {progression.map((voicing, index) => (
                <div key={index} className={`relative ${currentPlayingIndex === index ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}>
                  <TabPreview voicing={voicing} copedent={selectedCopedent} maskedStrings={maskedStrings} />
                  {currentPlayingIndex === index && (
                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {index + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-auto">
          <button className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400" onClick={onClose}>Go Back</button>
          <div className="flex-grow mx-4">
            <input 
              type="text"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              placeholder="Add an optional title to your PDF..."
              maxLength="70"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-center text-sm"
            />
          </div>
          <button 
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50" 
            onClick={handleLocalExport} 
            disabled={progression.length === 0 || isExporting}
          >
            {isExporting ? 'Generating...' : 'Export to PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VLExportModal;