// src/logic/NoteUtils.js

import { CHROMATIC_SCALE_SHARPS, ENHARMONIC_MAP } from '../data/Notes';
import { SCALES, SCALE_INTERVAL_NAMES } from '../data/Scales';
import { getChordRootsForKey, getRelativeMajor } from '../data/RadialWheelChordRoots';

/**
 * NOTE UTILITIES MODULE
 */

const NOTE_LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const INTERVAL_NAMES = {
  0: 'Root', 1: 'm2/b9', 2: 'M2/9', 3: 'm3', 4: 'M3', 5: 'P4/11',
  6: 'TT/#11/b5', 7: 'P5', 8: 'm6/b13', 9: 'M6/13', 10: 'm7', 11: 'M7'
};

export const getContextualIntervalName = (semitones, chordName = '') => {
  const s = (semitones % 12 + 12) % 12;
  const name = chordName.toLowerCase();
  switch (s) {
    case 0: return 'R';
    case 1: if (name.includes('b9')) return 'b9'; return 'm2';
    case 2: if (name.includes('sus2') || name.includes('9')) return '9'; return 'M2';
    case 3: if (name.includes('#9')) return '#9'; return 'm3';
    case 4: return 'M3';
    case 5: if (name.includes('sus4') || name.includes('11')) return '11'; return 'P4';
    case 6: if (name.includes('lydian') || name.includes('#11')) return '#11'; if (name.includes('diminished') || name.includes('b5')) return 'b5'; return 'TT';
    case 7: return 'P5';
    case 8: if (name.includes('b13')) return 'b13'; if (name.includes('augmented') || name.includes('#5')) return '#5'; return 'm6';
    case 9: if (name.includes('diminished 7')) return '𝄫7'; if (name.includes('13')) return '13'; return 'M6';
    case 10: return 'm7';
    case 11: return 'M7';
    default: return 'N/A';
  }
};

export const getScaleIntervalName = (semitone, scaleName) => {
    const normalizedSemitone = (semitone % 12 + 12) % 12;
    const scaleIntervals = SCALES[scaleName];
    const scaleNames = SCALE_INTERVAL_NAMES[scaleName];
    if (!scaleIntervals || !scaleNames) return getContextualIntervalName(semitone, '');
    const index = scaleIntervals.indexOf(normalizedSemitone);
    if (index > -1 && scaleNames[index]) return scaleNames[index];
    return `♭${getContextualIntervalName(semitone, '')}`;
};

/**
 * Convert Roman numeral to chord object in a given key using context-aware enharmonic spelling
 * Uses the existing VL enharmonic system and twin keys principle
 * @param {string} roman - Roman numeral (e.g., 'I', 'vi', 'bVII')
 * @param {string} chordType - Chord type (e.g., 'Major Triad', 'Minor 7')
 * @param {string} key - Key center (e.g., 'C', 'F#')
 * @returns {Object} - Chord object with root and type
 */
export const convertRomanToChord = (roman, chordType, key = 'C') => {
  // Map Roman numerals to positions in RadialWheelChordRoots array
  // Array pattern: [1, 5, 2, 6, 3, 7, #4, ♭2, ♭6, ♭3, ♭7, 4]
  // Array indices:  [0, 1, 2, 3, 4, 5,  6,   7,   8,   9,  10, 11]
  const romanToArrayIndex = {
    'I': 0,   // 1 -> index 0
    'bII': 7, // ♭2 -> index 7
    'II': 2,  // 2 -> index 2
    'bIII': 9, // ♭3 -> index 9
    'III': 4, // 3 -> index 4
    'IV': 11, // 4 -> index 11
    'bV': 6,  // #4 -> index 6 (enharmonic of bV)
    'V': 1,   // 5 -> index 1
    'bVI': 8, // ♭6 -> index 8
    'VI': 3,  // 6 -> index 3
    'bVII': 10, // ♭7 -> index 10
    'VII': 5, // 7 -> index 5
    // Lowercase versions (same positions, just different chord qualities)
    'i': 0, 'bii': 7, 'ii': 2, 'biii': 9, 'iii': 4, 'iv': 11, 'bv': 6, 'v': 1, 'bvi': 8, 'vi': 3, 'bvii': 10, 'vii': 5
  };

  // Use existing VL context-aware enharmonic system
  // Apply twin keys principle - convert to major equivalent
  const majorKey = getRelativeMajor(key);
  const chordRoots = getChordRootsForKey(majorKey);
  
  const cleanRoman = roman.replace(/m$/, ''); // Remove trailing 'm' for interval calculation
  const arrayIndex = romanToArrayIndex[cleanRoman];
  if (arrayIndex === undefined) return { root: key, type: chordType };
  
  // Use context-aware chord root from existing VL system
  const root = chordRoots[arrayIndex] || key;
  
  return {
    root: root,
    type: chordType
  };
};

export const getScaleNoteEnharmonic = (targetNoteWithOctave, rootNote, scaleName) => {
    try {
        const semitonesFromRoot = getSemitonesBetween(`${rootNote}4`, targetNoteWithOctave);
        const intervalName = getScaleIntervalName(semitonesFromRoot, scaleName);

        const intervalNumberMatch = intervalName.match(/\d+/);
        if (!intervalNumberMatch) {
            return normalizeNote(targetNoteWithOctave);
        }
        const intervalNumber = parseInt(intervalNumberMatch[0], 10);

        const rootLetter = rootNote.charAt(0);
        const rootLetterIndex = NOTE_LETTERS.indexOf(rootLetter);
        const targetLetterIndex = (rootLetterIndex + intervalNumber - 1) % 7;
        const targetLetter = NOTE_LETTERS[targetLetterIndex];

        const octave = parseInt(targetNoteWithOctave.match(/\d+/)[0], 10);
        const naturalTargetNote = `${targetLetter}${octave}`;
        const accidentalOffset = getSemitonesBetween(naturalTargetNote, targetNoteWithOctave);

        let finalNoteName = targetLetter;
        switch (accidentalOffset) {
            case 1: finalNoteName += '#'; break;
            case 2: finalNoteName += 'x'; break;
            case -1: finalNoteName += 'b'; break;
            case -2: finalNoteName += '𝄫'; break;
            default: break;
        }
        return `${finalNoteName}${octave}`;
    } catch (error) {
        console.error("Error in getScaleNoteEnharmonic:", error);
        return normalizeNote(targetNoteWithOctave);
    }
};

export const getEnharmonicNoteName = (targetNoteWithOctave, rootNote, chordName) => {
  try {
    const rootNoteWithOctave = `${rootNote}4`; // Use a consistent octave for the root context
    const semitonesFromRoot = getSemitonesBetween(rootNoteWithOctave, targetNoteWithOctave);
    const intervalName = getContextualIntervalName(semitonesFromRoot, chordName);
    
    let intervalNumber;
    if (intervalName === 'R') {
      intervalNumber = 1;
    } else {
      const intervalNumberMatch = intervalName.match(/\d+/);
      if (!intervalNumberMatch) {
        return normalizeNote(targetNoteWithOctave).replace(/(\d+)/, '$1');
      }
      intervalNumber = parseInt(intervalNumberMatch[0], 10);
    }

    const rootLetter = rootNote.charAt(0);
    const { octave: rootOctave } = splitNote(rootNoteWithOctave);
    const rootLetterIndex = NOTE_LETTERS.indexOf(rootLetter);
    const targetLetterIndex = (rootLetterIndex + intervalNumber - 1) % 7;
    const targetLetter = NOTE_LETTERS[targetLetterIndex];

    // Robust octave calculation
    const naturalNoteOnRootOctave = `${targetLetter}${rootOctave}`;
    const semitonesToNaturalNote = getSemitonesBetween(rootNoteWithOctave, naturalNoteOnRootOctave);
    const octaveDifference = Math.round((semitonesFromRoot - semitonesToNaturalNote) / 12);
    const finalOctave = rootOctave + octaveDifference;

    const naturalTargetNote = `${targetLetter}${finalOctave}`;
    const accidentalOffset = getSemitonesBetween(naturalTargetNote, targetNoteWithOctave);
    
    let finalNoteName = targetLetter;
    switch (accidentalOffset) {
      case 1: finalNoteName += '#'; break;
      case 2: finalNoteName += 'x'; break; // Double sharp
      case -1: finalNoteName += 'b'; break;
      case -2: finalNoteName += '𝄫'; break; // Double flat
      default: break;
    }
    return `${finalNoteName}${finalOctave}`;
  } catch (error) {
    console.error("Error in getEnharmonicNoteName:", error);
    return normalizeNote(targetNoteWithOctave).replace(/(\d+)/, '$1');
  }
};

const splitNote = (note) => {
  const match = note.match(/^([A-G])([b♭#♯x]|𝄫|𝄪|bb)?(\d+)$/);
  if (!match) throw new Error(`Invalid note format: ${note}.`);
  const [, letter, accidental, octaveStr] = match;
  return { baseNote: `${letter}${accidental || ''}`, octave: parseInt(octaveStr, 10) };
};

export const normalizeNote = (note) => {
  const { baseNote, octave } = splitNote(note);
  const normalizedBase = ENHARMONIC_MAP[baseNote] || baseNote;
  return `${normalizedBase}${octave}`;
};

const getNoteIndex = (baseNote) => {
  const normalizedBase = splitNote(normalizeNote(`${baseNote}4`)).baseNote;
  const index = CHROMATIC_SCALE_SHARPS.indexOf(normalizedBase);
  if (index === -1) throw new Error(`Invalid note name: ${baseNote}.`);
  return index;
};

export const getNoteAtOffset = (startNote, semitones) => {
  const normalizedStartNote = normalizeNote(startNote);
  const { baseNote, octave } = splitNote(normalizedStartNote);
  const startIndex = getNoteIndex(baseNote);
  const totalSemitonesFromC0 = startIndex + (octave * 12);
  const newTotalSemitones = totalSemitonesFromC0 + semitones;
  const newOctave = Math.floor(newTotalSemitones / 12);
  let newIndex = newTotalSemitones % 12;
  if (newIndex < 0) newIndex += 12;
  const newBaseNote = CHROMATIC_SCALE_SHARPS[newIndex];
  return `${newBaseNote}${newOctave}`;
};

export const getSemitonesBetween = (note1, note2) => {
  const normNote1 = normalizeNote(note1);
  const normNote2 = normalizeNote(note2);
  const { baseNote: base1, octave: oct1 } = splitNote(normNote1);
  const { baseNote: base2, octave: oct2 } = splitNote(normNote2);
  const index1 = getNoteIndex(base1);
  const index2 = getNoteIndex(base2);
  return (oct2 * 12 + index2) - (oct1 * 12 + index1);
};

export const noteToFrequency = (note) => {
  const A4_FREQUENCY = 440;
  return A4_FREQUENCY * Math.pow(2, getSemitonesBetween('A4', note) / 12);
};

export const isValidNote = (note) => {
  try {
    splitNote(note);
    return true;
  } catch (e) {
    return false;
  }
};