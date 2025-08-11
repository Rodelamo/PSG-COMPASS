// src/utils/ChordAnalysis.js

/**
 * Chord Analysis Utilities
 * Convert chords to Roman numerals and Nashville numbers
 * IMPLEMENTS "KEY IS KING" LOGIC: All minor keys analyzed from relative major
 */

// Relative major/minor key relationships
const RELATIVE_MAJOR_KEYS = {
  'Am': 'C', 'B♭m': 'D♭', 'Bm': 'D', 'Cm': 'E♭', 'C♯m': 'E', 'Dm': 'F',
  'D♯m': 'F♯', 'E♭m': 'G♭', 'Em': 'G', 'Fm': 'A♭', 'F♯m': 'A', 'Gm': 'B♭', 'G♯m': 'B'
};

// Shared constants to avoid duplication within this file
const CHROMATIC_NOTES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const FLAT_TO_SHARP = {'D♭': 'C♯', 'E♭': 'D♯', 'G♭': 'F♯', 'A♭': 'G♯', 'B♭': 'A♯'};

export const getRomanNumeral = (chord, tonalCenter) => {
  if (!chord) return '';
  
  const { root, type } = chord;
  const isMinorKey = tonalCenter.includes('m');
  
  // KEY IS KING: Always analyze from relative major for minor keys
  const baseKey = isMinorKey ? (RELATIVE_MAJOR_KEYS[tonalCenter] || tonalCenter.replace('m', '')) : tonalCenter;
  
  // Get chromatic position of key and chord root using shared constants
  const normalizeNote = (note) => FLAT_TO_SHARP[note] || note;
  const baseNoteIndex = CHROMATIC_NOTES.indexOf(normalizeNote(baseKey));
  const chordRootIndex = CHROMATIC_NOTES.indexOf(normalizeNote(root));
  
  if (baseNoteIndex === -1 || chordRootIndex === -1) return '';
  
  // Calculate semitones from key center
  const interval = (chordRootIndex - baseNoteIndex + 12) % 12;
  
  // Determine chord quality - handle all minor chord type formats
  const isChordMinor = type.toLowerCase().includes('minor') || 
                       type.includes('m7') || 
                       type.includes('m ') || 
                       type === 'm' ||
                       type.toLowerCase() === 'minor';
  const isChordDiminished = type.toLowerCase().includes('dim');
  
  // Roman numeral mapping based on scale degree
  const intervalToBase = {
    0: 'I',   1: 'II',  2: 'II',  3: 'III', 4: 'III',
    5: 'IV',  6: 'V',   7: 'V',   8: 'VI',  9: 'VI',
    10: 'VII', 11: 'VII'
  };
  
  // Get the base Roman numeral
  let roman = intervalToBase[interval];
  
  // Add accidentals for chromatic alterations
  if (interval === 1 || interval === 3 || interval === 6 || interval === 8 || interval === 10) {
    // These are chromatic notes, add flat or sharp
    if ([1, 3, 8, 10].includes(interval)) {
      roman = '♭' + roman;
    } else if (interval === 6) {
      roman = '♯' + roman;
    }
  }
  
  // Adjust case based on chord quality (not key context)
  if (isChordMinor) {
    roman = roman.toLowerCase();
  } else if (isChordDiminished) {
    roman = roman.toLowerCase() + '°';
  }
  // Major chords stay uppercase
  
  return roman;
};

export const getNashvilleNumber = (chord, tonalCenter) => {
  if (!chord) return '';
  
  const { root, type } = chord;
  const isMinorKey = tonalCenter.includes('m');
  
  // KEY IS KING: Always analyze from relative major for minor keys
  const baseKey = isMinorKey ? (RELATIVE_MAJOR_KEYS[tonalCenter] || tonalCenter.replace('m', '')) : tonalCenter;
  
  // Get chromatic position of key and chord root using shared constants
  const normalizeNote = (note) => FLAT_TO_SHARP[note] || note;
  const baseNoteIndex = CHROMATIC_NOTES.indexOf(normalizeNote(baseKey));
  const chordRootIndex = CHROMATIC_NOTES.indexOf(normalizeNote(root));
  
  if (baseNoteIndex === -1 || chordRootIndex === -1) return '';
  
  // Calculate semitones from key center
  const interval = (chordRootIndex - baseNoteIndex + 12) % 12;
  
  // Determine chord quality - handle all minor chord type formats
  const isChordMinor = type.toLowerCase().includes('minor') || 
                       type.includes('m7') || 
                       type.includes('m ') || 
                       type === 'm' ||
                       type.toLowerCase() === 'minor';
  const isChordDiminished = type.toLowerCase().includes('dim');
  
  // Nashville number mapping based on scale degree
  const intervalToBase = {
    0: '1',   1: '2',   2: '2',   3: '3',   4: '3',
    5: '4',   6: '5',   7: '5',   8: '6',   9: '6',
    10: '7',  11: '7'
  };
  
  // Get the base number
  let number = intervalToBase[interval];
  
  // Add accidentals for chromatic alterations
  if (interval === 1 || interval === 3 || interval === 6 || interval === 8 || interval === 10) {
    // These are chromatic notes, add flat or sharp
    if ([1, 3, 8, 10].includes(interval)) {
      number = '♭' + number;
    } else if (interval === 6) {
      number = '♯' + number;
    }
  }
  
  // Add chord quality suffix
  if (isChordMinor) {
    number += 'm';
  } else if (isChordDiminished) {
    number += '°';
  }
  // Major chords get no suffix
  
  return number;
};