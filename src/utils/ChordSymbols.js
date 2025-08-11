// src/utils/ChordSymbols.js

/**
 * Comprehensive chord symbol conversion utility
 * Converts long-form chord names to standard compact chord symbols
 * Reference: https://www.stringkick.com/blog-lessons/chord-names-symbols/
 */

// Standard chord symbol mappings
const CHORD_SYMBOL_MAP = {
  // Basic triads
  'Major Triad': '',
  'Minor Triad': '−',
  'Diminished Triad': 'dim',
  'Augmented Triad': '+',
  'sus2 Triad': 'sus2',
  'sus4 Triad': 'sus4',
  
  // Seventh chords
  'Major 7': 'Δ',
  'Major 7': 'Δ',
  'Minor 7': '−7',
  'Minor 7': '−7',
  'Dominant 7': '7',
  'Dominant 7': '7',
  'Diminished 7': '°7',
  'Diminished 7': '°7',
  'Minor 7b5': 'ø7',
  'Minor 7b5': 'ø7',
  'Minor Major 7': '−Δ',
  
  // Suspended sevenths
  'Major 7 sus4': 'Δsus4',
  '7 sus4': '7sus4',
  'Diminished 7 sus4': '°7sus4',
  'Major 7 sus4 b5': 'Δsus4♭5',
  '7 sus4 b5': '7sus4♭5',
  'Major 7 sus2': 'Δsus2',
  '7 sus2': '7sus2',
  'Diminished 7 sus2': '°7sus2',
  'Major 7 sus2 b5': 'Δsus2♭5',
  '7 sus2 b5': '7sus2♭5',
  
  // Sixth chords
  'Major 6': '6',
  'Minor 6': '−6',
  'sus4 6': '6sus4',
  
  // Add 9 chords
  'Major Triad add 9': 'add9',
  'Minor Triad add 9': '−add9',
  'Diminished Triad add 9': 'dimadd9',
  'Augmented Triad add 9': '+add9',
  'Major Triad add b9': 'add♭9',
  'Minor Triad add b9': '−add♭9',
  'Diminished Triad add b9': 'dimadd♭9',
  'Augmented Triad add b9': '+add♭9',
  
  // Add 11 chords
  'Major Triad add 11': 'add11',
  'Minor Triad add 11': '−add11',
  'Diminished Triad add 11': 'dimadd11',
  'Major Triad add #11': 'add♯11',
  
  // Altered 7ths
  'Dominant 7b5': '7♭5',
  'Dominant 7#5': '7♯5',
  'Major 7b5': 'Δ♭5',
  'Major 7#5': 'Δ♯5',
  'Minor 7#5': '−7♯5',
  
  // Ninth chords
  'Major 9': 'Δ9',
  'Major b9': 'Δ♭9',
  'Major #9': 'Δ♯9',
  'Minor 9': '−9',
  'Minor b9': '−♭9',
  'Dominant 9': '9',
  'Dominant b9': '7♭9',
  'Dominant #9': '7♯9',
  
  // Altered 9ths
  'Dominant 9b5': '9♭5',
  'Dominant 9#5': '9♯5',
  'Dominant b9b5': '7♭9♭5',
  'Dominant b9#5': '7♭9♯5',
  'Dominant #9b5': '7♯9♭5',
  'Dominant #9#5': '7♯9♯5',
  'Major 9b5': 'Δ9♭5',
  'Major 9#5': 'Δ9♯5',
  'Major b9b5': 'Δ♭9♭5',
  'Major b9#5': 'Δ♭9♯5',
  'Major #9b5': 'Δ♯9♭5',
  'Major #9#5': 'Δ♯9♯5',
  'Minor 9b5': '−9♭5',
  'Minor 9#5': '−9♯5',
  'Minor b9b5': '−♭9♭5',
  'Minor b9#5': '−♭9♯5',
  
  // Sixth/Ninth
  '6/9': '6/9',
  'Minor 6/9': '−6/9',
  '6/9 sus4': '6/9sus4',
  
  // Eleventh chords
  'Major 11': 'Δ11',
  'Major 11b9': 'Δ11♭9',
  'Major 11#9': 'Δ11♯9',
  'Minor 11': '−11',
  'Minor 11b9': '−11♭9',
  'Dominant 11': '11',
  'Dominant 11b9': '11♭9',
  'Dominant 11#9': '11♯9',
  
  // Sharp 11ths
  'Major #11': 'Δ♯11',
  'Major #11b9': 'Δ♯11♭9',
  'Major #11#9': 'Δ♯11♯9',
  'Minor #11': '−♯11',
  'Minor #11b9': '−♯11♭9',
  'Dominant #11': '7♯11',
  'Dominant #11b9': '7♯11♭9',
  'Dominant #11#9': '7♯11♯9',
  
  // Altered 11ths
  'Dominant 11b5': '11♭5',
  'Dominant 11#5': '11♯5',
  'Dominant 11b9b5': '11♭9♭5',
  'Dominant 11b9#5': '11♭9♯5',
  'Dominant 11#9b5': '11♯9♭5',
  'Dominant 11#9#5': '11♯9♯5',
  'Major 11b5': 'Δ11♭5',
  'Major 11#5': 'Δ11♯5',
  'Major 11b9b5': 'Δ11♭9♭5',
  'Major 11b9#5': 'Δ11♭9♯5',
  'Major 11#9b5': 'Δ11♯9♭5',
  'Major 11#9#5': 'Δ11♯9♯5',
  'Minor 11b5': '−11♭5',
  'Minor 11#5': '−11♯5',
  'Minor 11b9b5': '−11♭9♭5',
  'Minor 11b9#5': '−11♭9♯5',
  
  // Thirteenth chords
  'Major 13': 'Δ13',
  'Major 13b9': 'Δ13♭9',
  'Major 13#9': 'Δ13♯9',
  'Minor 13': '−13',
  'Minor 13b9': '−13♭9',
  'Dominant 13': '13',
  'Dominant 13b9': '13♭9',
  'Dominant 13#9': '13♯9',
  
  // 13th #11s
  'Major 13#11': 'Δ13♯11',
  'Major 13#11b9': 'Δ13♯11♭9',
  'Major 13#11#9': 'Δ13♯11♯9',
  'Minor 13#11': '−13♯11',
  'Minor 13#11b9': '−13♯11♭9',
  'Dominant 13#11': '13♯11',
  'Dominant 13#11b9': '13♯11♭9',
  'Dominant 13#11#9': '13♯11♯9',
  
  // Altered 13ths
  'Dominant 13b5': '13♭5',
  'Dominant 13#5': '13♯5',
  'Dominant 13b9b5': '13♭9♭5',
  'Dominant 13b9#5': '13♭9♯5',
  'Dominant 13#9b5': '13♯9♭5',
  'Dominant 13#9#5': '13♯9♯5',
  'Major 13b5': 'Δ13♭5',
  'Major 13#5': 'Δ13♯5',
  'Major 13b9b5': 'Δ13♭9♭5',
  'Major 13b9#5': 'Δ13♭9♯5',
  'Major 13#9b5': 'Δ13♯9♭5',
  'Major 13#9#5': 'Δ13♯9♯5',
  'Minor 13b5': '−13♭5',
  'Minor 13#5': '−13♯5',
  'Minor 13b9b5': '−13♭9♭5',
  'Minor 13b9#5': '−13♭9♯5',
  
  // Special cases
  'Lydian Triad no 5th': 'Δ♯11(no5)',
  'Lydian Triad no 3rd': 'sus♯4'
};

// Text-based symbol replacements (for existing chord symbols)
const TEXT_SYMBOL_REPLACEMENTS = {
  'm': '−',
  'maj7': 'Δ',
  'maj': 'Δ',
  'dim7': '°7',
  'dim': 'dim',
  'm7b5': 'ø7',
  'm7♭5': 'ø7',
  'aug': '+',
  'b5': '♭5',
  '#5': '♯5',
  'b9': '♭9',
  '#9': '♯9',
  '#11': '♯11',
  'b13': '♭13',
  '#13': '♯13',
  '♭5': '♭5',
  '♯5': '♯5',
  '♭9': '♭9',
  '♯9': '♯9',
  '♯11': '♯11',
  '♭13': '♭13',
  '♯13': '♯13'
};

/**
 * Convert a chord name or chord object to standard symbol notation
 * @param {string|Object} input - Either a chord name string or chord object {root, type}
 * @returns {string} - Standardized chord symbol
 */
export const convertChordToSymbol = (input) => {
  if (!input) return '';
  
  let root, type;
  
  if (typeof input === 'string') {
    // Parse chord name string like "Cmaj7", "Am", "Fdim7"
    const match = input.match(/^([A-G][#b]?)(.*)$/);
    if (!match) return input;
    
    root = match[1];
    type = match[2];
  } else if (typeof input === 'object' && input.root && input.type) {
    // Handle chord object format
    root = input.root;
    type = input.type;
  } else {
    return String(input);
  }
  
  // First check if we have a direct mapping for the full type
  if (CHORD_SYMBOL_MAP.hasOwnProperty(type)) {
    const symbol = CHORD_SYMBOL_MAP[type];
    return `${root}${symbol}`;
  }
  
  // If no direct mapping, apply text replacements
  let convertedType = type;
  for (const [text, symbol] of Object.entries(TEXT_SYMBOL_REPLACEMENTS)) {
    convertedType = convertedType.replace(new RegExp(text, 'g'), symbol);
  }
  
  return `${root}${convertedType}`;
};

/**
 * Convert a chord name from symbol notation back to readable form
 * @param {string} symbolChord - Chord in symbol notation
 * @returns {string} - Readable chord name
 */
export const convertSymbolToReadable = (symbolChord) => {
  if (!symbolChord) return '';
  
  // Reverse lookup for common symbols
  const reverseMap = {
    '−': 'm',
    'Δ': 'maj7',
    '°7': 'dim7',
    'ø7': 'm7♭5',
    '+': 'aug',
    '♭5': '♭5',
    '♯5': '♯5',
    '♭9': '♭9',
    '♯9': '♯9',
    '♯11': '♯11',
    '♭13': '♭13',
    '♯13': '♯13'
  };
  
  let result = symbolChord;
  for (const [symbol, text] of Object.entries(reverseMap)) {
    result = result.replace(new RegExp(symbol, 'g'), text);
  }
  
  return result;
};

/**
 * Check if a chord name should use symbols
 * @param {string} chordName - The chord name to check
 * @returns {boolean} - Whether symbols should be applied
 */
export const shouldUseSymbols = (chordName) => {
  if (!chordName) return false;
  
  // Check if chord contains any mappable elements
  const checkString = typeof chordName === 'string' ? chordName : 
                     (chordName.type || '');
  
  return Object.keys(CHORD_SYMBOL_MAP).some(key => checkString.includes(key)) ||
         Object.keys(TEXT_SYMBOL_REPLACEMENTS).some(key => checkString.includes(key));
};

/**
 * Get all available chord symbols for reference
 * @returns {Object} - Complete mapping of chord types to symbols
 */
export const getAllChordSymbols = () => {
  return { ...CHORD_SYMBOL_MAP };
};

const ChordSymbolsUtils = {
  convertChordToSymbol,
  convertSymbolToReadable,
  shouldUseSymbols,
  getAllChordSymbols
};

export default ChordSymbolsUtils;