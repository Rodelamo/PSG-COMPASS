// src/components/MeasureGrid.js

import React from 'react';
import { formatChordName } from '../utils/ChordFormatting';
import { getRomanNumeral, getNashvilleNumber } from '../utils/ChordAnalysis';
import DisplayToggleButtons from './DisplayToggleButtons';

const MeasureGrid = ({ 
  measures, 
  onMeasureChange,
  timeSignature = '4/4',
  onSlotClick,
  displayMode = 'names', // 'names', 'roman', 'nashville'
  useSymbols = false,
  currentPlayingSlot = null, // { measureIndex, slotIndex }
  tonalCenter = 'C',
  onReset = null, // Reset handler for clearing all measures and results
  onDisplayModeChange = null, // Display mode change handler
  onToggleSymbols = null // Symbol toggle handler
}) => {
  const beatsPerMeasure = timeSignature === '3/4' ? 3 : 4;
  const measuresPerRow = 4;

  const addMeasure = () => {
    if (measures.length < 32) {
      const newMeasure = {
        id: measures.length,
        slots: Array.from({ length: beatsPerMeasure }, (_, i) => ({
          beat: i + 1,
          chord: null
        }))
      };
      onMeasureChange([...measures, newMeasure]);
    }
  };

  const removeMeasure = () => {
    if (measures.length > 4) {
      const newMeasures = measures.slice(0, -1);
      onMeasureChange(newMeasures);
    }
  };

  const clearMeasureChords = (measureIndex) => {
    const newMeasures = [...measures];
    newMeasures[measureIndex].slots = newMeasures[measureIndex].slots.map(slot => ({
      ...slot,
      chord: null
    }));
    onMeasureChange(newMeasures);
  };

  // Chord name formatting now uses centralized utility

  // Now using centralized ChordAnalysis functions with "Key is King" logic

  const getAnalysisDisplay = (chord, measureIndex, slotIndex) => {
    switch (displayMode) {
      case 'roman':
        return getRomanNumeral(chord, tonalCenter);
      case 'nashville':
        return getNashvilleNumber(chord, tonalCenter);
      default:
        return '';
    }
  };

  const isCurrentlyPlaying = (measureIndex, slotIndex) => {
    return currentPlayingSlot && 
           currentPlayingSlot.measureIndex === measureIndex && 
           currentPlayingSlot.slotIndex === slotIndex;
  };

  // Organize measures into rows
  const measureRows = [];
  for (let i = 0; i < measures.length; i += measuresPerRow) {
    measureRows.push(measures.slice(i, i + measuresPerRow));
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Chord Progression</h3>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600">{measures.length} measures</span>
          <button
            onClick={removeMeasure}
            disabled={measures.length <= 4}
            className="w-5 h-5 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg"
          >
            −
          </button>
          <button
            onClick={addMeasure}
            disabled={measures.length >= 32}
            className="w-5 h-5 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold text-lg"
          >
            +
          </button>
          {/* Display Toggle Buttons */}
          {onDisplayModeChange && onToggleSymbols && (
            <DisplayToggleButtons
              displayMode={displayMode}
              onDisplayModeChange={onDisplayModeChange}
              useSymbols={useSymbols}
              onToggleSymbols={onToggleSymbols}
            />
          )}
          {onReset && (
            <button 
              onClick={onReset} 
              className="px-3 py-2 bg-gray-700 text-white text-sm font-semibold rounded-md hover:bg-gray-600"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Compact pill-based measure display */}
      <div className="space-y-4">
        {measureRows.map((row, rowIndex) => (
          <div key={rowIndex} className="relative">
            {/* Measure row container */}
            <div className="flex relative" style={{ height: '60px' }}>
              {row.map((measure, measureIndex) => {
                const actualMeasureIndex = rowIndex * measuresPerRow + measureIndex;
                const isLastInRow = measureIndex === row.length - 1;
                
                return (
                  <div 
                    key={measure.id}
                    className="flex-1 relative"
                    style={{ minWidth: '200px' }}
                  >
                    {/* Measure number with clear chords button - positioned above the measure */}
                    <div className="absolute -top-6 left-2 flex items-center space-x-1">
                      <span className="text-sm font-bold text-blue-600">
                        {actualMeasureIndex + 1}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearMeasureChords(actualMeasureIndex);
                        }}
                        className="w-5 h-5 bg-red-400 text-white rounded-full hover:bg-red-500 flex items-center justify-center text-sm font-bold shadow opacity-70 hover:opacity-100"
                        title={`Clear all chords in measure ${actualMeasureIndex + 1}`}
                      >
                        ×
                      </button>
                    </div>
                    
                    {/* Beat slots in this measure */}
                    <div className="flex relative h-full">
                      {measure.slots.map((slot, slotIndex) => {
                        const isLastSlotInMeasure = slotIndex === measure.slots.length - 1;
                        const isPlaying = isCurrentlyPlaying(actualMeasureIndex, slotIndex);
                        
                        return (
                          <div
                            key={slotIndex}
                            onClick={() => onSlotClick(actualMeasureIndex, slotIndex)}
                            className={`
                              flex-1 cursor-pointer relative flex flex-col items-center justify-center px-1
                              ${isPlaying ? 'bg-yellow-100' : 'hover:bg-blue-50'}
                            `}
                            style={{ minHeight: '60px' }}
                          >
                            {/* Analysis display (Roman/Nashville) above chord pill */}
                            {displayMode !== 'names' && slot.chord && (
                              <div className="text-xs font-semibold text-gray-500 mb-1">
                                {getAnalysisDisplay(slot.chord, actualMeasureIndex, slotIndex)}
                              </div>
                            )}
                            
                            {/* Chord pill container */}
                            <div className="flex items-center justify-center min-h-[28px]">
                              {slot.chord ? (
                                <div className={`
                                  px-3 py-1.5 rounded-full text-sm font-medium shadow-sm transition-all duration-200
                                  ${isPlaying 
                                    ? 'bg-yellow-400 text-gray-900 shadow-md' 
                                    : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-md'
                                  }
                                `}>
                                  {formatChordName(slot.chord, useSymbols)}
                                </div>
                              ) : (
                                <div className="w-12 h-7 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center hover:border-blue-400 transition-colors">
                                  <span className="text-gray-400 text-xs">+</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Beat number - small and positioned at bottom */}
                            <div className="text-xs text-gray-400 mt-1">
                              {slot.beat}
                            </div>
                            
                            {/* Thin vertical line after each quarter note (except last in measure) */}
                            {!isLastSlotInMeasure && (
                              <div className="absolute right-0 top-2 bottom-2 border-r border-gray-300"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Thick vertical line after each measure (except last in row) */}
                    {!isLastInRow && (
                      <div className="absolute right-0 top-0 bottom-0 border-r-2 border-gray-600"></div>
                    )}
                  </div>
                );
              })}
              
              {/* Fill remaining space in row if needed */}
              {Array.from({ length: measuresPerRow - row.length }, (_, i) => (
                <div key={`empty-${i}`} className="flex-1" style={{ minWidth: '200px' }}></div>
              ))}
            </div>
            
            {/* Horizontal line at bottom of each row */}
            <div className="mt-2 border-b border-gray-300"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeasureGrid;