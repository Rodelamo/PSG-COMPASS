// src/data/Notes.js

/**
 * NOTES DATA MODULE
 *
 * This file provides foundational data for musical notes and their
 * relationships, which are used throughout the application, especially
 * by the NoteUtils module for calculations and conversions.
 *
 * It uses a consistent sharp notation for internal representation
 * to simplify chromatic indexing, while also providing mappings for
 * enharmonic equivalents to handle user input that might use flat
 * notation.
 */

/**
 * An array representing the 12 notes of the chromatic scale, starting from C.
 * These are the standard "sharp" representations used for internal indexing
 * to maintain consistency in semitone calculations.
 *
 * @type {string[]}
 */
export const CHROMATIC_SCALE_SHARPS = [
  'C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'
];

/**
 * An array representing the 12 notes of the chromatic scale using flats.
 *
 * @type {string[]}
 */
export const CHROMATIC_SCALE_FLATS = [
    'C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'
];


/**
 * A mapping of common enharmonic equivalents.
 * This object allows the application to convert flat notations (e.g., 'Db')
 * or less common sharp/flat notations (e.g., 'Fb', 'E#') to our
 * standard `CHROMATIC_SCALE_SHARPS` representation.
 *
 * For example, if a user inputs 'Db', this map helps in recognizing it
 * as equivalent to 'C#'.
 *
 * @type {Object.<string, string>}
 */
export const ENHARMONIC_MAP = {
  'D♭': 'C♯',
  'E♭': 'D♯',
  'G♭': 'F♯',
  'A♭': 'G♯',
  'B♭': 'A♯',
  // Less common but musically valid enharmonics
  'E♯': 'F', // E sharp is F
  'B♯': 'C', // B sharp is C
  'F♭': 'E', // F flat is E
  'C♭': 'B', // C flat is B
  // Legacy support for old notation (ASCII symbols)
  'Db': 'C♯',
  'Eb': 'D♯',
  'Gb': 'F♯',
  'Ab': 'G♯',
  'Bb': 'A♯',
  'E#': 'F',
  'B#': 'C',
  'Fb': 'E',
  'Cb': 'B',
  // ASCII sharp notation support
  'C#': 'C♯',
  'D#': 'D♯',
  'F#': 'F♯',
  'G#': 'G♯',
  'A#': 'A♯'
};


/**
 * Maps sharp notes to their flat equivalents.
 * @type {Object.<string, string>}
 */
export const SHARP_TO_FLAT_MAP = {
    'C♯': 'D♭',
    'D♯': 'E♭',
    'F♯': 'G♭',
    'G♯': 'A♭',
    'A♯': 'B♭'
};

/**
 * Maps flat notes to their sharp equivalents.
 * @type {Object.<string, string>}
 */
export const FLAT_TO_SHARP_MAP = {
    'D♭': 'C♯',
    'E♭': 'D♯',
    'G♭': 'F♯',
    'A♭': 'G♯',
    'B♭': 'A♯'
};


// We will not have a default export of just the NOTES array,
// as named exports are more explicit and easier to track dependencies.
// The Notes.js file in your prototype exported `NOTES` as default,
// but our new structure uses named exports for better clarity.