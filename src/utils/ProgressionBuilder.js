// src/utils/ProgressionBuilder.js

import { findChordVoicingsWithCache, getChordCacheStats } from '../logic/ChordCalculator';
import { CHORD_TYPES } from '../data/DefaultChordTypes';
import { preserveStringToggleStates } from '../logic/VoiceLeadingManager';

/**
 * Progression Building utilities for VoiceLeader component
 * Extracted from VoiceLeader.js to improve maintainability and reusability
 */

/**
 * Parse chord name into root and type components
 * @param {string} chordName - Chord name like "C", "Cm", "C7", etc.
 * @returns {Object} Object with root and type properties
 */
export const parseChordName = (chordName) => {
  // Parse chord names like "C", "Cm", "C7", "Cmaj7", etc.
  // Support both ASCII (#b) and Unicode (♯♭) symbols
  const match = chordName.match(/^([A-G][#b♯♭]?)(.*)$/);
  if (!match) return { root: 'C', type: 'Major Triad' };
  
  const root = match[1];
  const suffix = match[2];
  
  // Map common suffixes to chord types
  const suffixToType = {
    '': 'Major Triad',
    'm': 'Minor Triad',
    '7': 'Dominant 7',
    'maj7': 'Major 7',
    'm7': 'Minor 7',
    'dim': 'Diminished Triad',
    'aug': 'Augmented Triad',
    'm7♭5': 'Minor 7b5',
    'dim7': 'Diminished 7'
  };
  
  return {
    root,
    type: suffixToType[suffix] || 'Major Triad'
  };
};

/**
 * Build progression array from measures
 * @param {Array} measures - Array of measure objects
 * @returns {Array} Array of chord objects from all measures
 */
export const buildProgressionFromMeasures = (measures) => {
  const progression = [];
  measures.forEach(measure => {
    measure.slots.forEach(slot => {
      if (slot.chord) {
        progression.push(slot.chord);
      }
    });
  });
  return progression;
};

/**
 * Convert copedent to string IDs array
 * @param {Object} selectedCopedent - Selected copedent configuration
 * @returns {Array} Array of string IDs
 */
export const convertToStringIds = (selectedCopedent) => {
  // Return ALL string IDs for chord generation - masking happens after creation
  if (!selectedCopedent || !selectedCopedent.strings) return [];
  
  return selectedCopedent.strings.map(string => string.id);
};

/**
 * Handle progression calculation from measures
 * @param {Object} params - Calculation parameters
 */
export const handleCalculate = ({
  measures,
  selectedCopedent,
  chordIntervalFilters = {},
  resultsPerFret,
  results,
  lockedVoicings = [], // CRITICAL: Add lockedVoicings parameter
  findChordVoicingsFn = findChordVoicingsWithCache, // Allow injection of favorites-aware function
  setIsCalculating,
  setAppState,
  stopPlaybackAndCleanupFn,
  showToast
}) => {
  // Stop playback before manual calculation
  stopPlaybackAndCleanupFn();
  
  // Ensure findChordVoicingsFn is available in scope (for ESLint)
  const chordFindingFunction = findChordVoicingsFn;
  
  // Build progression from measures
  const progression = [];
  measures.forEach(measure => {
    measure.slots.forEach(slot => {
      if (slot.chord) {
        progression.push(slot.chord);
      }
    });
  });
  
  if (progression.length < 2) return showToast('Please add at least two chords to your progression.', 'error');
  
  // Performance warning for very large progressions
  if (progression.length > 100) {
    const proceed = window.confirm(
      `This progression has ${progression.length} chords, which may take several seconds to calculate and could slow down the browser. Continue?`
    );
    if (!proceed) return;
  }
  
  setIsCalculating(true);
  setTimeout(() => {
    const progressionResults = [];
    const alternativesByStep = [];
    let failedChord = null;
    
    // For each chord in progression, use ChordFinder logic
    for (let i = 0; i < progression.length; i++) {
      const chord = progression[i];
      
      // CRITICAL: Check if this chord is locked
      if (lockedVoicings.includes(i) && results[i]) {
        console.log(`🔒 Chord ${i} (${chord.root} ${chord.type}): LOCKED - preserving existing voicing`);
        
        // For locked chords, keep the exact existing voicing and find alternatives that match
        const existingVoicing = results[i];
        progressionResults.push(existingVoicing);
        
        // Generate alternatives for locked chord for consistency
        const chordIntervals = CHORD_TYPES[chord.type];
        if (chordIntervals) {
          const chordFilters = chordIntervalFilters[i];
          const intervalsToUse = chordFilters && chordFilters.length > 0 ? chordFilters : chordIntervals;
          const rootNoteWithOctave = `${chord.root}4`;
          const chordVoicings = chordFindingFunction(selectedCopedent, rootNoteWithOctave, intervalsToUse, resultsPerFret, true);
          
          const voicingsWithChordName = chordVoicings.map((voicing, index) => ({
            ...voicing,
            chordName: `${chord.root} ${chord.type}`,
            id: `${voicing.fret}-${voicing.pedalCombo.join('')}-${voicing.leverCombo.join('')}-${voicing.mecCombo.join('')}-${index}`
          }));
          
          alternativesByStep.push(voicingsWithChordName);
        } else {
          alternativesByStep.push([existingVoicing]); // Fallback
        }
        continue; // Skip normal processing for locked chord
      }
      
      const chordIntervals = CHORD_TYPES[chord.type];
      
      if (!chordIntervals) {
        failedChord = chord;
        break;
      }
      
      // Use chord-specific interval filters, or all intervals if none set
      const chordFilters = chordIntervalFilters[i];
      const intervalsToUse = chordFilters && chordFilters.length > 0 ? chordFilters : chordIntervals;
      const rootNoteWithOctave = `${chord.root}4`;
      
      // Find chord voicings using provided function (supports favorites-aware finding)
      // Both Basic and Pro tiers get full copedent access
      const chordVoicings = chordFindingFunction(selectedCopedent, rootNoteWithOctave, intervalsToUse, resultsPerFret, true);
      
      if (chordVoicings.length === 0) {
        failedChord = chord;
        break;
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
      
      // Add chord name to each voicing
      const voicingsWithChordName = extendedVoicings.map((voicing, index) => ({
        ...voicing,
        chordName: `${chord.root} ${chord.type}`,
        id: `${voicing.fret}-${voicing.pedalCombo.join('')}-${voicing.leverCombo.join('')}-${voicing.mecCombo.join('')}-${index}`
      }));
      
      // PRESERVE string toggle states from existing results (if any) - with validation
      const existingVoicing = results[i];
      let primaryVoicing = preserveStringToggleStates(voicingsWithChordName[0], existingVoicing);
      
      // Additional safety check: verify the preserved voicing is still valid for this chord
      if (existingVoicing && primaryVoicing === voicingsWithChordName[0]) {
        // preserveStringToggleStates returned the fresh voicing, meaning preservation failed
        console.log(`⚠️  Chord ${i} (${chord.root} ${chord.type}): State preservation failed, using fresh calculation`);
      }
      
      // Use preserved voicing as the displayed result
      progressionResults.push(primaryVoicing);
      
      // Store all voicings as alternatives for left/right cycling
      alternativesByStep.push(voicingsWithChordName);
    }

    if (failedChord) {
      showToast(`Could not calculate voicing for ${failedChord.root} ${failedChord.type}`, 'error');
      setAppState(prev => ({...prev, results: [], alternativesByStep: []}));
    } else {
      setAppState(prev => ({...prev, results: progressionResults, alternativesByStep: alternativesByStep}));
    }
    setIsCalculating(false);
  }, 50);
};

/**
 * Smart recalculation of progression with state preservation
 * @param {Object} params - Recalculation parameters
 */
export const smartRecalculateProgression = async ({
  results,
  measures,
  selectedCopedent,
  chordIntervalFilters = {},
  resultsPerFret,
  lockedVoicings = [], // CRITICAL: Add lockedVoicings parameter
  findChordVoicingsFn = findChordVoicingsWithCache, // Allow injection of favorites-aware function
  setIsCalculating,
  setAppState,
  showToast
}) => {
  // Only recalculate if there are existing results - this means user wants auto-refresh
  if (results.length === 0) return;

  // Ensure findChordVoicingsFn is available in scope (for ESLint)
  const chordFindingFunction = findChordVoicingsFn;
  
  // Build complete progression from measures, similar to handleCalculate but preserve existing approach
  const progression = [];
  measures.forEach((measure, measureIndex) => {
    measure.slots.forEach((slot, slotIndex) => {
      if (slot.chord) {
        progression.push({
          measureIndex,
          slotIndex,
          chord: slot.chord
        });
      }
    });
  });
  
  if (progression.length === 0) {
    // No chords at all, clear results
    setAppState(prev => ({ 
      ...prev, 
      results: [],
      alternativesByStep: []
    }));
    return;
  }
  
  setIsCalculating(true);
  
  try {
    const allVoicings = [];
    const allAlternatives = [];
    
    for (let chordIndex = 0; chordIndex < progression.length; chordIndex++) {
      const chordData = progression[chordIndex];
      const { root, type } = chordData.chord;
      
      // CRITICAL: Check if this chord is locked
      if (lockedVoicings.includes(chordIndex) && results[chordIndex]) {
        console.log(`🔒 Smart recalc chord ${chordIndex} (${root} ${type}): LOCKED - preserving existing voicing`);
        
        // For locked chords, keep the exact existing voicing
        const existingVoicing = results[chordIndex];
        allVoicings.push(existingVoicing);
        
        // Generate alternatives for consistency but keep the locked one first
        const chordIntervals = CHORD_TYPES[type];
        if (chordIntervals) {
          const chordFilters = chordIntervalFilters[chordIndex];
          const intervalsToUse = chordFilters && chordFilters.length > 0 ? chordFilters : chordIntervals;
          const rootNoteWithOctave = `${root}4`;
          const voicings = chordFindingFunction(selectedCopedent, rootNoteWithOctave, intervalsToUse, resultsPerFret, true);
          
          const voicingsWithChordName = voicings.map(v => ({
            ...v,
            chordName: `${root} ${type}`
          }));
          
          allAlternatives.push(voicingsWithChordName);
        } else {
          allAlternatives.push([existingVoicing]); // Fallback
        }
        continue; // Skip normal processing for locked chord
      }
      
      const rootNoteWithOctave = `${root}4`;
      const chordIntervals = CHORD_TYPES[type];
      
      if (!chordIntervals) {
        showToast(`Unknown chord type: ${type}`, 'error');
        continue;
      }
      
      // Use chord-specific interval filters, or all intervals if none set
      const chordFilters = chordIntervalFilters[chordIndex];
      const intervalsToUse = chordFilters && chordFilters.length > 0 ? chordFilters : chordIntervals;
      
      const voicings = chordFindingFunction(
        selectedCopedent,
        rootNoteWithOctave,
        intervalsToUse,
        resultsPerFret,
        true // Both Basic and Pro tiers get full copedent access
      );
      
      if (voicings.length > 0) {
        // For Voice Leader: Extend to fret 24 by duplicating 0-11 range (+12 fret offset)
        // Note: 0=12, 1=13, 2=14, ... 11=23 (octave repeat)
        const extendedVoicings = [...voicings];
        voicings.forEach(voicing => {
          if (voicing.fret <= 11) { // Only duplicate frets 0-11 (exclude fret 12 to avoid duplication at fret 24)
            const octaveVoicing = {
              ...voicing,
              fret: voicing.fret + 12 // Add 12 frets for octave: 0→12, 1→13, ... 11→23
            };
            extendedVoicings.push(octaveVoicing);
          }
        });
        
        const voicingsWithChordName = extendedVoicings.map(v => ({
          ...v,
          chordName: `${root} ${type}`
        }));
        
        // PRESERVE string toggle states from existing results - with validation
        const existingVoicing = results[chordIndex];
        const primaryVoicing = preserveStringToggleStates(voicingsWithChordName[0], existingVoicing);
        
        // Additional safety check for smart recalculation
        if (existingVoicing && primaryVoicing === voicingsWithChordName[0]) {
          console.log(`⚠️  Smart recalc chord ${chordIndex} (${root} ${type}): State preservation failed, using fresh calculation`);
        }
        
        allVoicings.push(primaryVoicing);
        allAlternatives.push(voicingsWithChordName); // Alternatives keep original states for cycling
      }
    }
    
    setAppState(prev => ({ 
      ...prev, 
      results: allVoicings,
      alternativesByStep: allAlternatives
    }));
    
    // Show cache statistics in development mode
    if (process.env.NODE_ENV === 'development') {
      const cacheStats = getChordCacheStats();
      showToast(`Progression auto-refreshed (Cache: ${cacheStats.hitRate} hit rate)`, 'success');
    } else {
      showToast('Progression auto-refreshed', 'success');
    }
  } catch (error) {
    showToast('Error refreshing progression', 'error');
  } finally {
    setIsCalculating(false);
  }
};