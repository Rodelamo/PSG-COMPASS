// src/utils/StringOperations.js

import { calculateFrettedNotesWithEffects } from '../logic/ChordCalculator';
import { getContextualIntervalName } from '../logic/NoteUtils';

/**
 * String Operations utilities for VoiceLeader component
 * Extracted from VoiceLeader.js to improve maintainability and reusability
 */

/**
 * Apply color inheritance rules when switching between voicings
 * @param {Object} currentVoicing - The voicing being switched from
 * @param {Object} newVoicing - The voicing being switched to
 * @param {Object} options - Additional options for inheritance behavior
 * @param {boolean} options.isCustomizationActive - Whether current voicing is showing a customization
 * @returns {Object} New voicing with inherited color states
 */
const applyColorInheritance = (currentVoicing, newVoicing, options = {}) => {
  if (!currentVoicing.notes || !newVoicing.notes) {
    return newVoicing;
  }

  // Create a map of current string states for quick lookup
  const currentStringStates = {};
  currentVoicing.notes.forEach(note => {
    // Determine current color state more accurately
    const isGrey = note.isPlayedInVoicing === false && note.isChordTone === true;
    const isRed = note.isChordTone === false; // Red = unavailable (non-chord tone)
    const isGreenYellow = note.isPlayedInVoicing === true && note.isChordTone === true;
    
    currentStringStates[note.stringId] = {
      isGrey,
      isRed,
      isGreenYellow
    };
  });

  // Apply inheritance rules to new voicing
  const inheritedNotes = newVoicing.notes.map(note => {
    const currentState = currentStringStates[note.stringId];
    if (!currentState) {
      // String wasn't in current voicing, use new voicing's natural state
      return note;
    }

    const newIsRed = note.isChordTone === false;
    const newIsGreenYellow = note.isChordTone === true;

    // SPECIAL CASE: If current voicing is showing a customization, 
    // reset to natural state instead of preserving customization colors
    if (options.isCustomizationActive) {
      // When switching away from a customization, use the new voicing's natural state
      // This prevents customization grey states from being carried over
      return {
        ...note,
        isPlayedInVoicing: note.isChordTone
      };
    }

    // Apply standard color inheritance rules:
    // CC-Y and TC-Y = stays Y (keep green/yellow if both voicings use the string)
    // CC-Y and TC-R = Turns R (turn red if new voicing doesn't use the string)
    // CC-G and TC-Y = turns G (keep grey if user disabled it)
    // CC-G and TC-R = Stays R (turn red if new voicing doesn't use the string)
    // CC-R and TC-Y = Turns Y (turn green/yellow if new voicing uses the string)
    // CC-R and TC-R = Stays R (stay red if neither voicing uses the string)

    let isPlayedInVoicing;

    if (currentState.isGreenYellow && newIsGreenYellow) {
      // CC-Y and TC-Y = stays Y
      isPlayedInVoicing = true;
    } else if (currentState.isGreenYellow && newIsRed) {
      // CC-Y and TC-R = Turns R (note becomes unavailable)
      isPlayedInVoicing = false;
    } else if (currentState.isGrey && newIsGreenYellow) {
      // CC-G and TC-Y = turns G (preserve user's grey choice)
      isPlayedInVoicing = false;
    } else if (currentState.isGrey && newIsRed) {
      // CC-G and TC-R = Stays R (note becomes unavailable)
      isPlayedInVoicing = false;
    } else if (currentState.isRed && newIsGreenYellow) {
      // CC-R and TC-Y = Turns Y (note becomes available)
      isPlayedInVoicing = true;
    } else if (currentState.isRed && newIsRed) {
      // CC-R and TC-R = Stays R (note stays unavailable)
      isPlayedInVoicing = false;
    } else {
      // Default case - use new voicing's natural state
      isPlayedInVoicing = note.isChordTone;
    }

    return {
      ...note,
      isPlayedInVoicing
    };
  });

  return {
    ...newVoicing,
    notes: inheritedNotes
  };
};

/**
 * Cycle alternative voicing for a chord in the progression
 * @param {Object} params - Alternative cycling parameters
 */
export const handleCycleAlternative = ({
  progressionIndex,
  direction,
  results,
  alternativesByStep,
  setAppState,
  currentCustomizations = {} // Optional: current customization states
}) => {
  const currentVoicing = results[progressionIndex];
  const alternatives = alternativesByStep[progressionIndex];
  if (!alternatives || alternatives.length <= 1) return;

  // Create a simple key to uniquely identify a voicing for comparison
  const voicingToKey = v => JSON.stringify({ f: v.fret, p: v.pedalCombo, l: v.leverCombo, m: v.mecCombo });

  const currentIndex = alternatives.findIndex(alt => voicingToKey(alt) === voicingToKey(currentVoicing));
  if (currentIndex === -1) return; // Should not happen

  const newIndex = currentIndex + direction;

  // Cycle within the bounds of the array
  if (newIndex >= 0 && newIndex < alternatives.length) {
    const newVoicing = alternatives[newIndex];
    
    // Check if current chord is showing a customization (not default state 0)
    const isCustomizationActive = currentCustomizations[progressionIndex] && currentCustomizations[progressionIndex] !== 0;
    
    // Apply color inheritance rules when switching voicings
    const voicingWithInheritedColors = applyColorInheritance(currentVoicing, newVoicing, {
      isCustomizationActive
    });
    
    const newResults = [...results];
    newResults[progressionIndex] = voicingWithInheritedColors;
    setAppState(prev => ({ ...prev, results: newResults }));
  }
};

/**
 * Refresh chord with interval filters
 * @param {Object} params - Refresh parameters
 */
export const handleRefreshChordWithFilters = ({
  editingChordIndex,
  editingChordType,
  results,
  alternativesByStep,
  selectedCopedent,
  activeIntervalFilters,
  resultsPerFret,
  setAppState,
  showToast,
  findChordVoicingsWithCacheFn,
  CHORD_TYPES,
  setIsManualEditModalOpen
}) => {
  if (editingChordIndex === null || !editingChordType) return;
  
  const currentVoicing = results[editingChordIndex];
  if (!currentVoicing) return;
  
  // Extract root note from chord name
  const rootNote = currentVoicing.chordName?.split(' ')[0] || 'C';
  const rootNoteWithOctave = `${rootNote}4`;
  
  // Use current active interval filters
  const intervalsToUse = activeIntervalFilters.length > 0 ? activeIntervalFilters : CHORD_TYPES[editingChordType];
  
  // Find new chord voicings with filtered intervals using cache (0-12 fret range)
  // Both Basic and Pro tiers get full copedent access
  const chordVoicings = findChordVoicingsWithCacheFn(selectedCopedent, rootNoteWithOctave, intervalsToUse, resultsPerFret, true);
  
  if (chordVoicings.length === 0) {
    showToast('No voicings found with current interval filters.', 'error');
    return;
  }
  
  // For Voice Leader: Extend to fret 24 by duplicating 0-11 range (+12 fret offset)
  // Note: 0=12, 1=13, 2=14, ... 11=23 (octave repeat)
  const extendedVoicings = [...chordVoicings];
  chordVoicings.forEach(voicing => {
    if (voicing.fret <= 11) { // Only duplicate frets 0-11 (exclude fret 12 to avoid duplication at fret 24)
      const octaveVoicing = {
        ...voicing,
        fret: voicing.fret + 12 // Add 12 frets for octave: 0→12, 1→13, ... 11→23
      };
      extendedVoicings.push(octaveVoicing);
    }
  });
  
  const newVoicings = extendedVoicings;
  
  // Update the results and alternatives
  const newResults = [...results];
  const newAlternatives = [...alternativesByStep];
  
  // Generate proper chord name with interval filtering (like CF does)
  const allOriginalIntervals = CHORD_TYPES[editingChordType] || [];
  const uniqueOriginalIntervalClasses = Array.from(new Set(allOriginalIntervals.map(i => i % 12)));
  
  let displayChordName;
  if (activeIntervalFilters.length === uniqueOriginalIntervalClasses.length) {
    displayChordName = `${rootNote} ${editingChordType}`;
  } else {
    const omittedIntervals = uniqueOriginalIntervalClasses.filter(interval => !activeIntervalFilters.includes(interval));
    if (omittedIntervals.length > 0) {
      const omittedNames = omittedIntervals.map(interval => getContextualIntervalName(interval, editingChordType));
      displayChordName = `${rootNote} ${editingChordType} (no ${omittedNames.join(', no ')})`;
    } else {
      displayChordName = `${rootNote} ${editingChordType}`;
    }
  }
  
  // Add chord name to voicings
  const voicingsWithChordName = newVoicings.map((voicing, index) => ({
    ...voicing,
    chordName: displayChordName,
    id: `${voicing.fret}-${voicing.pedalCombo.join('')}-${voicing.leverCombo.join('')}-${voicing.mecCombo.join('')}-${index}`
  }));
  
  // Update the current chord result and alternatives
  newResults[editingChordIndex] = voicingsWithChordName[0];
  newAlternatives[editingChordIndex] = voicingsWithChordName;
  
  setAppState(prev => ({ ...prev, results: newResults, alternativesByStep: newAlternatives }));
  showToast('Chord refreshed with interval filters!', 'success');
  setIsManualEditModalOpen(false);
};

/**
 * Toggle string state for a specific chord
 * @param {Object} params - String toggle parameters
 */
export const handleToggleString = ({
  chordIndex,
  stringId,
  results,
  selectedCopedent,
  setAppState,
  showToast
}) => {
  const voicing = results[chordIndex];
  if (!voicing) return;

  // We need to recalculate all strings for this voicing to see what notes they produce
  const chordRoot = voicing.chordName?.split(' ')[0] || 'C';
  const rootNoteWithOctave = `${chordRoot}4`;
  
  // Calculate what all strings would produce at this fret/pedal/lever combination
  const allStringNotes = calculateFrettedNotesWithEffects(
    selectedCopedent.strings, 
    selectedCopedent, 
    voicing.pedalCombo || [], 
    voicing.leverCombo || [], 
    voicing.mecCombo || [], 
    rootNoteWithOctave, 
    voicing.fret
  );

  const newResults = [...results];
  const existingNoteIndex = voicing.notes.findIndex(n => n.stringId === stringId);
  
  if (existingNoteIndex !== -1) {
    // String already exists in voicing, toggle its play state
    const newNotes = [...voicing.notes];
    newNotes[existingNoteIndex] = {
      ...newNotes[existingNoteIndex],
      isPlayedInVoicing: !newNotes[existingNoteIndex].isPlayedInVoicing
    };
    
    newResults[chordIndex] = {
      ...voicing,
      notes: newNotes
    };
    
    const action = newNotes[existingNoteIndex].isPlayedInVoicing ? 'added to' : 'removed from';
    showToast(`String ${stringId} ${action} chord ${chordIndex + 1}`, 'success');
  } else {
    // String doesn't exist in voicing, add it if it produces a valid chord tone
    const stringNote = allStringNotes.find(n => n.stringId === stringId);
    if (stringNote) {
      const newNotes = [...voicing.notes, {
        ...stringNote,
        isPlayedInVoicing: true,
        isChordTone: true
      }];
      
      newResults[chordIndex] = {
        ...voicing,
        notes: newNotes
      };
      
      showToast(`String ${stringId} added to chord ${chordIndex + 1}`, 'success');
    } else {
      showToast(`String ${stringId} cannot be added to this chord`, 'error');
      return;
    }
  }
  
  setAppState(prev => ({ ...prev, results: newResults }));
};

/**
 * Toggle string state for all chords in progression
 * @param {Object} params - Global string toggle parameters
 */
export const handleToggleAllStrings = ({
  stringId,
  results,
  setAppState,
  showToast
}) => {
  // Toggle this string for all chords in the progression
  // IMPORTANT: Only toggle green/yellow notes (never red/unavailable notes)
  // Green notes toggle to grey and back to green
  // Yellow notes toggle to grey and back to yellow (NOT to green)
  
  let hasChanges = false;
  
  const newResults = results.map((voicing, chordIndex) => {
    if (!voicing || !voicing.notes) return voicing;
    
    const existingNoteIndex = voicing.notes.findIndex(n => n.stringId === stringId);
    const newNotes = [...voicing.notes];
    
    if (existingNoteIndex >= 0) {
      const existingNote = newNotes[existingNoteIndex];
      
      // Only toggle if the note is a chord tone (available as green/yellow)
      // Use isChordTone property which determines if string can play a chord note
      if (existingNote.isChordTone) {
        // Toggle the played state while preserving all other properties (including unison status)
        newNotes[existingNoteIndex] = {
          ...existingNote,
          isPlayedInVoicing: !existingNote.isPlayedInVoicing
        };
        hasChanges = true;
      }
      // Red/unavailable notes (isChordTone === false) are never toggled
    }
    // Note: We don't need to handle the case where string doesn't exist in voicing.notes
    // because all strings should always be present in the notes array
    
    return { ...voicing, notes: newNotes };
  });
  
  if (hasChanges) {
    setAppState(prev => ({ ...prev, results: newResults }));
    showToast(`String ${stringId} toggled for all chords in progression`, 'success');
  } else {
    showToast(`No available notes on string ${stringId} to toggle`, 'info');
  }
};

/**
 * Handle string masking toggle
 * @param {Object} params - String masking parameters
 */
export const handleStringMask = ({
  stringId,
  maskedStrings,
  setAppState,
  showToast
}) => {
  const newMaskedStrings = maskedStrings.includes(stringId)
    ? maskedStrings.filter(id => id !== stringId)
    : [...maskedStrings, stringId];
  
  setAppState(prev => ({ ...prev, maskedStrings: newMaskedStrings }));
  
  const action = newMaskedStrings.includes(stringId) ? 'masked' : 'unmasked';
  showToast(`String ${stringId} ${action}`, 'success');
};