// src/utils/ChordNaming.js

/**
 * COMPREHENSIVE CHORD NAMING UTILITY
 * Converts internal chord type names to proper conventional abbreviations
 * Covers ALL 123 chord types from DefaultChordTypes.js
 */

// Comprehensive mapping of all chord types to conventional abbreviations
const CONVENTIONAL_CHORD_NAMES = {
  // TRIADS (3-note)
  'Major Triad': '',
  'Minor Triad': 'm',
  'Diminished Triad': 'dim',
  'Augmented Triad': 'aug',
  'sus2 Triad': 'sus2',
  'sus4 Triad': 'sus4',
  'Lydian Triad no 5th': 'maj♯11(no5)',
  'Lydian Triad no 3rd': 'sus♯4',

  // SEVENTH CHORDS (4-note)
  'Major 7': 'maj7',
  'Minor 7': 'm7',
  'Dominant 7': '7',
  'Diminished 7': 'dim7',
  'Minor 7b5': 'm7♭5',
  'Minor Major 7': 'm(maj7)',

  // SUSPENDED SEVENTHS (4-note)
  'Major 7 sus4': 'maj7sus4',
  '7 sus4': '7sus4',
  'Diminished 7 sus4': 'dim7sus4',
  'Major 7 sus4 b5': 'maj7sus4♭5',
  '7 sus4 b5': '7sus4♭5',
  'Major 7 sus2': 'maj7sus2',
  '7 sus2': '7sus2',
  'Diminished 7 sus2': 'dim7sus2',
  'Major 7 sus2 b5': 'maj7sus2♭5',
  '7 sus2 b5': '7sus2♭5',

  // SIXTH CHORDS (4-note)
  'Major 6': '6',
  'Minor 6': 'm6',
  'sus4 6': '6sus4',

  // ADD 9 CHORDS (4-note)
  'Major Triad add 9': 'add9',
  'Minor Triad add 9': 'madd9',
  'Diminished Triad add 9': 'dimadd9',
  'Augmented Triad add 9': 'augadd9',
  'Major Triad add b9': 'add♭9',
  'Minor Triad add b9': 'madd♭9',
  'Diminished Triad add b9': 'dimadd♭9',
  'Augmented Triad add b9': 'augadd♭9',

  // ADD 11 CHORDS (4-note)
  'Major Triad add 11': 'add11',
  'Minor Triad add 11': 'madd11',
  'Diminished Triad add 11': 'dimadd11',
  'Major Triad add #11': 'add♯11',

  // ALTERED 7TH CHORDS (4-note)
  'Dominant 7b5': '7♭5',
  'Dominant 7#5': '7♯5',
  'Major 7b5': 'maj7♭5',
  'Major 7#5': 'maj7♯5',
  'Minor 7#5': 'm7♯5',

  // NINTH CHORDS (5-note)
  'Major 9': 'maj9',
  'Major b9': 'maj7♭9',
  'Major #9': 'maj7♯9',
  'Minor 9': 'm9',
  'Minor b9': 'm7♭9',
  'Dominant 9': '9',
  'Dominant b9': '7♭9',
  'Dominant #9': '7♯9',

  // ALTERED 9TH CHORDS (5-note)
  'Dominant 9b5': '9♭5',
  'Dominant 9#5': '9♯5',
  'Dominant b9b5': '7♭9♭5',
  'Dominant b9#5': '7♭9♯5',
  'Dominant #9b5': '7♯9♭5',
  'Dominant #9#5': '7♯9♯5',
  'Major 9b5': 'maj9♭5',
  'Major 9#5': 'maj9♯5',
  'Major b9b5': 'maj7♭9♭5',
  'Major b9#5': 'maj7♭9♯5',
  'Major #9b5': 'maj7♯9♭5',
  'Major #9#5': 'maj7♯9♯5',
  'Minor 9b5': 'm9♭5',
  'Minor 9#5': 'm9♯5',
  'Minor b9b5': 'm7♭9♭5',
  'Minor b9#5': 'm7♭9♯5',

  // SIXTH/NINTH CHORDS (5-note)
  '6/9': '6/9',
  'Minor 6/9': 'm6/9',
  '6/9 sus4': '6/9sus4',

  // ELEVENTH CHORDS (6-note)
  'Major 11': 'maj11',
  'Major 11b9': 'maj11♭9',
  'Major 11#9': 'maj11♯9',
  'Minor 11': 'm11',
  'Minor 11b9': 'm11♭9',
  'Dominant 11': '11',
  'Dominant 11b9': '11♭9',
  'Dominant 11#9': '11♯9',

  // SHARP ELEVENTH CHORDS (6-note)
  'Major #11': 'maj7♯11',
  'Major #11b9': 'maj7♯11♭9',
  'Major #11#9': 'maj7♯11♯9',
  'Minor #11': 'm7♯11',
  'Minor #11b9': 'm7♯11♭9',
  'Dominant #11': '7♯11',
  'Dominant #11b9': '7♯11♭9',
  'Dominant #11#9': '7♯11♯9',

  // ALTERED 11TH CHORDS (6-note)
  'Dominant 11b5': '11♭5',
  'Dominant 11#5': '11♯5',
  'Dominant 11b9b5': '11♭9♭5',
  'Dominant 11b9#5': '11♭9♯5',
  'Dominant 11#9b5': '11♯9♭5',
  'Dominant 11#9#5': '11♯9♯5',
  'Major 11b5': 'maj11♭5',
  'Major 11#5': 'maj11♯5',
  'Major 11b9b5': 'maj11♭9♭5',
  'Major 11b9#5': 'maj11♭9♯5',
  'Major 11#9b5': 'maj11♯9♭5',
  'Major 11#9#5': 'maj11♯9♯5',
  'Minor 11b5': 'm11♭5',
  'Minor 11#5': 'm11♯5',
  'Minor 11b9b5': 'm11♭9♭5',
  'Minor 11b9#5': 'm11♭9♯5',

  // THIRTEENTH CHORDS (7-note)
  'Major 13': 'maj13',
  'Major 13b9': 'maj13♭9',
  'Major 13#9': 'maj13♯9',
  'Minor 13': 'm13',
  'Minor 13b9': 'm13♭9',
  'Dominant 13': '13',
  'Dominant 13b9': '13♭9',
  'Dominant 13#9': '13♯9',

  // THIRTEENTH #11 CHORDS (7-note)
  'Major 13#11': 'maj13♯11',
  'Major 13#11b9': 'maj13♯11♭9',
  'Major 13#11#9': 'maj13♯11♯9',
  'Minor 13#11': 'm13♯11',
  'Minor 13#11b9': 'm13♯11♭9',
  'Dominant 13#11': '13♯11',
  'Dominant 13#11b9': '13♯11♭9',
  'Dominant 13#11#9': '13♯11♯9',

  // ALTERED 13TH CHORDS (7-note)
  'Dominant 13b5': '13♭5',
  'Dominant 13#5': '13♯5',
  'Dominant 13b9b5': '13♭9♭5',
  'Dominant 13b9#5': '13♭9♯5',
  'Dominant 13#9b5': '13♯9♭5',
  'Dominant 13#9#5': '13♯9♯5',
  'Major 13b5': 'maj13♭5',
  'Major 13#5': 'maj13♯5',
  'Major 13b9b5': 'maj13♭9♭5',
  'Major 13b9#5': 'maj13♭9♯5',
  'Major 13#9b5': 'maj13♯9♭5',
  'Major 13#9#5': 'maj13♯9♯5',
  'Minor 13b5': 'm13♭5',
  'Minor 13#5': 'm13♯5',
  'Minor 13b9b5': 'm13♭9♭5',
  'Minor 13b9#5': 'm13♭9♯5'
};

/**
 * Convert chord to conventional abbreviated name
 * @param {Object|string} chord - Chord object {root, type} or chord name string
 * @returns {string} - Conventional abbreviated chord name
 */
export const convertToConventionalName = (chord) => {
  if (!chord) return '';
  
  let root, type;
  
  if (typeof chord === 'string') {
    // Parse chord name string like "Cmaj7", "Am", "Fdim7"
    const match = chord.match(/^([A-G][#b]?)(.*)$/);
    if (!match) return chord;
    root = match[1];
    type = match[2];
  } else if (typeof chord === 'object' && chord.root && chord.type) {
    // Handle chord object format
    root = chord.root;
    type = chord.type;
  } else {
    return String(chord);
  }
  
  // Get conventional abbreviation
  const abbreviation = CONVENTIONAL_CHORD_NAMES[type];
  
  if (abbreviation !== undefined) {
    return `${root}${abbreviation}`;
  }
  
  // Fallback: try to create a reasonable abbreviation
  return `${root}${createFallbackAbbreviation(type)}`;
};

/**
 * Create fallback abbreviation for unknown chord types
 * @param {string} type - Chord type
 * @returns {string} - Best-effort abbreviation
 */
const createFallbackAbbreviation = (type) => {
  if (!type) return '';
  
  return type
    .replace(/Major/g, 'maj')
    .replace(/Minor/g, 'm')
    .replace(/Dominant/g, '')
    .replace(/Diminished/g, 'dim')
    .replace(/Augmented/g, 'aug')
    .replace(/b/g, '♭')
    .replace(/#/g, '♯')
    .replace(/\s+/g, '')
    .replace(/Triad/g, '');
};

/**
 * Get all available conventional chord names for reference
 * @returns {Object} - Complete mapping of chord types to abbreviations
 */
export const getAllConventionalNames = () => {
  return { ...CONVENTIONAL_CHORD_NAMES };
};

/**
 * Validate that a chord type has a proper conventional name
 * @param {string} chordType - The chord type to validate
 * @returns {boolean} - Whether the chord type has a proper mapping
 */
export const hasConventionalName = (chordType) => {
  return CONVENTIONAL_CHORD_NAMES.hasOwnProperty(chordType);
};

export default {
  convertToConventionalName,
  getAllConventionalNames,
  hasConventionalName
};