// src/utils/KeyTransposition.js

/**
 * Advanced Key Transposition Utilities
 * Handles intelligent key changes, relative major/minor relationships,
 * and preserves Roman numeral/Nashville number analysis
 */

// Import centralized constants to avoid duplication
import { CHROMATIC_SCALE_SHARPS as CHROMATIC_SCALE, ENHARMONIC_MAP } from '../data/Notes';
import { getChordRootsForKey, getRelativeMajor } from '../data/RadialWheelChordRoots';

// Major keys with their relative minors
export const MAJOR_MINOR_RELATIONSHIPS = {
  // Major keys to relative minors
  'C': 'Am', 'D♭': 'B♭m', 'D': 'Bm', 'E♭': 'Cm', 'E': 'C♯m', 'F': 'Dm',
  'F♯': 'D♯m', 'G♭': 'E♭m', 'G': 'Em', 'A♭': 'Fm', 'A': 'F♯m', 'B♭': 'Gm', 'B': 'G♯m',
  
  // Minor keys to relative majors
  'Am': 'C', 'B♭m': 'D♭', 'Bm': 'D', 'Cm': 'E♭', 'C♯m': 'E', 'Dm': 'F',
  'D♯m': 'F♯', 'E♭m': 'G♭', 'Em': 'G', 'Fm': 'A♭', 'F♯m': 'A', 'Gm': 'B♭', 'G♯m': 'B'
};

// Constants now imported from centralized Notes.js to avoid duplication

/**
 * Get the relative major or minor key
 */
export const getRelativeKey = (key) => {
  return MAJOR_MINOR_RELATIONSHIPS[key] || key;
};

/**
 * Check if a key is major or minor
 */
export const isMinorKey = (key) => {
  return key.includes('m');
};

/**
 * Check if a key is major
 */
export const isMajorKey = (key) => {
  return !key.includes('m');
};

/**
 * Get the base note without the 'm' suffix
 */
export const getBaseKey = (key) => {
  return isMinorKey(key) ? key.replace('m', '') : key;
};

/**
 * Normalize note name for chromatic calculations
 */
export const normalizeNote = (note) => {
  return ENHARMONIC_MAP[note] || note;
};

/**
 * Calculate semitone distance between two keys using 'twin keys' principle
 * All keys are converted to their major equivalents before distance calculation
 * This ensures C→Em = C→G since Em's twin is G
 */
export const getSemitoneDistance = (fromKey, toKey) => {
  // Convert both keys to their major equivalents (twin keys principle)
  const fromMajor = isMajorKey(fromKey) ? fromKey : getRelativeKey(fromKey);
  const toMajor = isMajorKey(toKey) ? toKey : getRelativeKey(toKey);
  
  const fromBase = normalizeNote(getBaseKey(fromMajor));
  const toBase = normalizeNote(getBaseKey(toMajor));
  
  const fromIndex = CHROMATIC_SCALE.indexOf(fromBase);
  const toIndex = CHROMATIC_SCALE.indexOf(toBase);
  
  if (fromIndex === -1 || toIndex === -1) return 0;
  
  return (toIndex - fromIndex + 12) % 12;
};

/**
 * Transpose a chord from one key to another using context-aware enharmonic spelling
 * Now matches the same enharmonic system used by CP loading
 */
export const transposeChord = (chord, fromKey, toKey) => {
  if (!chord || !chord.root) return chord;
  
  const semitones = getSemitoneDistance(fromKey, toKey);
  if (semitones === 0) return chord;
  
  // Use context-aware enharmonic spelling for target key
  const targetMajorKey = getRelativeMajor(toKey);
  const targetChordRoots = getChordRootsForKey(targetMajorKey);
  
  // Calculate the new root position using chromatic semitone offset
  const currentRootIndex = CHROMATIC_SCALE.indexOf(normalizeNote(chord.root));
  if (currentRootIndex === -1) return chord;
  
  const newRootIndex = (currentRootIndex + semitones) % 12;
  
  // Find the corresponding root in the context-aware array
  // Look for the chord root that matches the target chromatic position
  let contextAwareRoot = CHROMATIC_SCALE[newRootIndex]; // fallback
  
  // Create a map of chromatic positions to handle enharmonic equivalents
  const enharmonicToChromaticIndex = {
    'C': 0, 'C♯': 1, 'D♭': 1, 'D': 2, 'D♯': 3, 'E♭': 3, 'E': 4, 'F': 5, 
    'F♯': 6, 'G♭': 6, 'G': 7, 'G♯': 8, 'A♭': 8, 'A': 9, 'A♯': 10, 'B♭': 10, 'B': 11,
    // ASCII versions
    'Db': 1, 'Eb': 3, 'Gb': 6, 'Ab': 8, 'Bb': 10,
    'C#': 1, 'D#': 3, 'F#': 6, 'G#': 8, 'A#': 10
  };
  
  for (let i = 0; i < targetChordRoots.length; i++) {
    const rootChromaticIndex = enharmonicToChromaticIndex[targetChordRoots[i]];
    if (rootChromaticIndex === newRootIndex) {
      contextAwareRoot = targetChordRoots[i];
      break;
    }
  }
  
  return {
    ...chord,
    root: contextAwareRoot
  };
};

/**
 * Transpose a progression using 'twin keys' principle
 * All transpositions are based on major key relationships
 * C→Em = C→G since Em and G are harmonic twins
 */
export const transposeProgression = (measures, fromKey, toKey) => {
  if (!measures || measures.length === 0) return measures;
  
  // Calculate semitone distance using twin keys principle
  const semitones = getSemitoneDistance(fromKey, toKey);
  
  // If no semitone difference, return measures unchanged
  if (semitones === 0) {
    return measures;
  }
  
  // Transpose all chords by the calculated semitone distance
  return measures.map(measure => ({
    ...measure,
    slots: measure.slots.map(slot => ({
      ...slot,
      chord: slot.chord ? transposeChord(slot.chord, fromKey, toKey) : null
    }))
  }));
};

/**
 * Get intelligent key suggestions based on current key
 */
export const getKeySuggestions = (currentKey) => {
  const suggestions = {
    relative: getRelativeKey(currentKey),
    parallel: null, // Parallel major/minor (same root)
    dominant: null,
    subdominant: null,
    common: [] // Commonly related keys
  };
  
  const baseKey = getBaseKey(currentKey);
  const currentIsMinor = isMinorKey(currentKey);
  
  // Parallel major/minor (same root note)
  suggestions.parallel = currentIsMinor ? baseKey : baseKey + 'm';
  
  // Calculate dominant (perfect 5th up)
  const baseIndex = CHROMATIC_SCALE.indexOf(normalizeNote(baseKey));
  if (baseIndex !== -1) {
    const dominantIndex = (baseIndex + 7) % 12;
    const subdominantIndex = (baseIndex + 5) % 12;
    
    suggestions.dominant = currentIsMinor 
      ? CHROMATIC_SCALE[dominantIndex] + 'm'
      : CHROMATIC_SCALE[dominantIndex];
      
    suggestions.subdominant = currentIsMinor
      ? CHROMATIC_SCALE[subdominantIndex] + 'm'
      : CHROMATIC_SCALE[subdominantIndex];
  }
  
  // Common related keys (circle of fifths neighbors)
  const commonKeys = [
    suggestions.relative,
    suggestions.parallel,
    suggestions.dominant,
    suggestions.subdominant
  ].filter(key => key && key !== currentKey);
  
  suggestions.common = [...new Set(commonKeys)];
  
  return suggestions;
};

/**
 * Analyze key relationship between two keys
 */
export const analyzeKeyRelationship = (fromKey, toKey) => {
  if (fromKey === toKey) return 'same';
  
  const suggestions = getKeySuggestions(fromKey);
  
  if (toKey === suggestions.relative) return 'relative';
  if (toKey === suggestions.parallel) return 'parallel';
  if (toKey === suggestions.dominant) return 'dominant';
  if (toKey === suggestions.subdominant) return 'subdominant';
  if (suggestions.common.includes(toKey)) return 'related';
  
  const semitones = getSemitoneDistance(fromKey, toKey);
  if (semitones <= 2 || semitones >= 10) return 'close';
  
  return 'distant';
};

/**
 * Get user-friendly description of key change
 */
export const getKeyChangeDescription = (fromKey, toKey) => {
  const relationship = analyzeKeyRelationship(fromKey, toKey);
  
  const descriptions = {
    'same': 'No key change',
    'relative': `Relative ${isMinorKey(toKey) ? 'minor' : 'major'}`,
    'parallel': `Parallel ${isMinorKey(toKey) ? 'minor' : 'major'}`,
    'dominant': 'Dominant key',
    'subdominant': 'Subdominant key',
    'related': 'Related key',
    'close': 'Neighboring key',
    'distant': 'Distant key'
  };
  
  return descriptions[relationship] || 'Key change';
};