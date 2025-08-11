// src/utils/MeasureOperations.js

import { parseChordName } from './ProgressionBuilder';

/**
 * Measure Operations utilities for VoiceLeader component
 * Extracted from VoiceLeader.js to improve maintainability and reusability
 */

/**
 * Handle slot click to open chord selection menu
 * @param {Object} params - Slot click parameters
 */
export const handleSlotClick = ({
  measureIndex,
  slotIndex,
  setSelectedSlot,
  setRadialMenuPosition,
  setIsRadialMenuOpen
}) => {
  setSelectedSlot({ measureIndex, slotIndex });
  
  // Position the radial menu at the center of the screen
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  setRadialMenuPosition({ x: centerX, y: centerY });
  setIsRadialMenuOpen(true);
};

/**
 * Handle chord selection and assignment to slot
 * @param {Object} params - Chord selection parameters
 */
export const handleChordSelect = ({
  chordInput,
  selectedSlot,
  measures,
  setAppState,
  stopPlaybackAndCleanupFn,
  smartRecalculateProgressionFn,
  setIsRadialMenuOpen,
  setIsExtendedMenuOpen,
  setSelectedSlot
}) => {
  if (!selectedSlot) return;
  
  // Handle both string chord names and chord objects
  let chord;
  
  if (typeof chordInput === 'string') {
    // Parse chord name to extract root and type
    const { root, type } = parseChordName(chordInput);
    chord = { root, type };
  } else {
    // Already a chord object
    chord = chordInput;
  }
  
  const newMeasures = [...measures];
  newMeasures[selectedSlot.measureIndex].slots[selectedSlot.slotIndex].chord = chord;
  setAppState(prev => ({ ...prev, measures: newMeasures }));
  
  // Stop playback before modifying progression
  stopPlaybackAndCleanupFn();
  
  // Smart auto-refresh: recalculate progression if tablature exists
  setTimeout(() => {
    smartRecalculateProgressionFn();
  }, 100);
  
  setIsRadialMenuOpen(false);
  setIsExtendedMenuOpen(false);
  setSelectedSlot(null);
};

/**
 * Handle chord erasure from slot
 * @param {Object} params - Chord erasure parameters
 */
export const handleEraseChord = ({
  selectedSlot,
  measures,
  setAppState,
  stopPlaybackAndCleanupFn,
  smartRecalculateProgressionFn,
  setIsRadialMenuOpen,
  setSelectedSlot
}) => {
  if (!selectedSlot) return;
  
  const newMeasures = [...measures];
  newMeasures[selectedSlot.measureIndex].slots[selectedSlot.slotIndex].chord = null;
  setAppState(prev => ({ ...prev, measures: newMeasures }));
  
  // Stop playback before removing chord
  stopPlaybackAndCleanupFn();
  
  // Smart auto-refresh: recalculate progression if tablature exists
  setTimeout(() => {
    smartRecalculateProgressionFn();
  }, 100);
  
  setIsRadialMenuOpen(false);
  setSelectedSlot(null);
};

/**
 * Handle copying measures to clipboard
 * @param {Object} params - Copy measures parameters
 */
export const handleCopyMeasures = ({
  numMeasures,
  startMeasureIndex,
  measures,
  setCopiedMeasures,
  showToast
}) => {
  try {
    // Validate boundaries
    if (startMeasureIndex + numMeasures > measures.length) {
      showToast(`Cannot copy ${numMeasures} measures: only ${measures.length - startMeasureIndex} available`, 'error');
      return;
    }
    
    // Copy the specified range of measures
    const measuresToCopy = measures.slice(startMeasureIndex, startMeasureIndex + numMeasures);
    const copiedData = {
      measures: JSON.parse(JSON.stringify(measuresToCopy)), // Deep copy
      numMeasures,
      timestamp: Date.now()
    };
    
    setCopiedMeasures(copiedData);
    const sourceStart = startMeasureIndex + 1;
    const sourceEnd = startMeasureIndex + numMeasures;
    showToast(`Copied ${numMeasures} measures (${sourceStart}-${sourceEnd}) to clipboard`, 'success');
  } catch (error) {
    showToast('Error copying measures', 'error');
  }
};

/**
 * Handle pasting measures from clipboard
 * @param {Object} params - Paste measures parameters
 */
export const handlePasteMeasures = ({
  numMeasures,
  startMeasureIndex,
  measures,
  copiedMeasures,
  setAppState,
  stopPlaybackAndCleanupFn,
  smartRecalculateProgressionFn,
  showToast
}) => {
  try {
    // Validate clipboard
    if (!copiedMeasures) {
      showToast('No clipboard data. Copy some measures first.', 'error');
      return;
    }
    
    if (copiedMeasures.numMeasures !== numMeasures) {
      showToast(`Clipboard has ${copiedMeasures.numMeasures} measures, but trying to paste ${numMeasures}. Copy ${numMeasures} measures first.`, 'error');
      return;
    }
    
    // Validate boundaries
    if (startMeasureIndex + numMeasures > measures.length) {
      const availableSpace = measures.length - startMeasureIndex;
      showToast(`Cannot paste ${numMeasures} measures: only ${availableSpace} slots available forward`, 'error');
      return;
    }
    
    // Create new measures array with pasted data
    const newMeasures = [...measures];
    for (let i = 0; i < numMeasures; i++) {
      const sourceIndex = i;
      const targetIndex = startMeasureIndex + i;
      
      if (sourceIndex < copiedMeasures.measures.length && targetIndex < newMeasures.length) {
        // Copy the measure structure but update the ID to match target position
        newMeasures[targetIndex] = {
          ...copiedMeasures.measures[sourceIndex],
          id: targetIndex
        };
      }
    }
    
    setAppState(prev => ({ ...prev, measures: newMeasures }));
    
    // Stop playback before pasting measures
    stopPlaybackAndCleanupFn();
    
    // Smart auto-refresh: only for reasonably-sized progressions to avoid performance issues
    const totalChords = newMeasures.reduce((count, measure) => 
      count + measure.slots.filter(slot => slot.chord).length, 0
    );
    
    if (totalChords <= 50) {
      setTimeout(() => {
        smartRecalculateProgressionFn();
      }, 100);
    } else {
      showToast(`Pasted ${numMeasures} measures. Click "Calculate Progression" to update tablature (${totalChords} chords).`, 'info');
    }
    
    const targetStart = startMeasureIndex + 1;
    const targetEnd = startMeasureIndex + numMeasures;
    showToast(`Pasted ${numMeasures} measures from clipboard to ${targetStart}-${targetEnd}`, 'success');
  } catch (error) {
    showToast('Error pasting measures', 'error');
  }
};