// src/data/DefaultChordTypes.js

/**
 * CHORD TYPE DEFINITIONS
 * Defines all available chord types, now structured by category for the selection modal.
 */

// Helper function to create a structured list from raw data
const createChordList = (chords) => Object.entries(chords).map(([name, intervals]) => ({ name, intervals }));

// Raw Data
const TRIADS_3_NOTE = {
  'Major Triad': [0, 4, 7], 'Minor Triad': [0, 3, 7], 'Diminished Triad': [0, 3, 6],
  'Augmented Triad': [0, 4, 8], 'sus2 Triad': [0, 2, 7], 'sus4 Triad': [0, 5, 7],
  'Lydian Triad no 5th': [0, 4, 6], 'Lydian Triad no 3rd': [0, 6, 7],
};

const SEVENTH_CHORDS_4_NOTE = {
  'Major 7': [0, 4, 7, 11], 'Minor 7': [0, 3, 7, 10], 'Dominant 7': [0, 4, 7, 10],
  'Diminished 7': [0, 3, 6, 9], 'Minor 7b5': [0, 3, 6, 10], 'Minor Major 7': [0, 3, 7, 11],
};

const SUS_SEVENTH_CHORDS_4_NOTE = {
  'Major 7 sus4': [0, 5, 7, 11], '7 sus4': [0, 5, 7, 10], 'Diminished 7 sus4': [0, 5, 6, 9],
  'Major 7 sus4 b5': [0, 5, 6, 11], '7 sus4 b5': [0, 5, 6, 10], 'Major 7 sus2': [0, 2, 7, 11],
  '7 sus2': [0, 2, 7, 10], 'Diminished 7 sus2': [0, 2, 6, 9], 'Major 7 sus2 b5': [0, 2, 6, 11],
  '7 sus2 b5': [0, 2, 6, 10],
};

const SIXTH_CHORDS_4_NOTE = { 'Major 6': [0, 4, 7, 9], 'Minor 6': [0, 3, 7, 9], 'sus4 6': [0, 5, 7, 9] };

const ADD_9_CHORDS_4_NOTE = {
  'Major Triad add 9': [0, 4, 7, 2], 'Minor Triad add 9': [0, 3, 7, 2], 'Diminished Triad add 9': [0, 3, 6, 2],
  'Augmented Triad add 9': [0, 4, 8, 2], 'Major Triad add b9': [0, 4, 7, 1], 'Minor Triad add b9': [0, 3, 7, 1],
  'Diminished Triad add b9': [0, 3, 6, 1], 'Augmented Triad add b9': [0, 4, 8, 1],
};

const ADD_11_CHORDS_4_NOTE = {
  'Major Triad add 11': [0, 4, 7, 5], 'Minor Triad add 11': [0, 3, 7, 5], 'Diminished Triad add 11': [0, 3, 6, 5],
  'Major Triad add #11': [0, 4, 7, 6],
};

const ALTERED_7TH_CHORDS_4_NOTE = {
  'Dominant 7b5': [0, 4, 6, 10], 'Dominant 7#5': [0, 4, 8, 10], 'Major 7b5': [0, 4, 6, 11],
  'Major 7#5': [0, 4, 8, 11], 'Minor 7#5': [0, 3, 8, 10],
};

const NINTH_CHORDS_5_NOTE = {
  'Major 9': [0, 4, 7, 11, 2], 'Major b9': [0, 4, 7, 11, 1], 'Major #9': [0, 4, 7, 11, 3],
  'Minor 9': [0, 3, 7, 10, 2], 'Minor b9': [0, 3, 7, 10, 1], 'Dominant 9': [0, 4, 7, 10, 2],
  'Dominant b9': [0, 4, 7, 10, 1], 'Dominant #9': [0, 4, 7, 10, 3],
};

const ALTERED_9TH_CHORDS_5_NOTE = {
  'Dominant 9b5': [0, 4, 6, 10, 2], 'Dominant 9#5': [0, 4, 8, 10, 2], 'Dominant b9b5': [0, 4, 6, 10, 1],
  'Dominant b9#5': [0, 4, 8, 10, 1], 'Dominant #9b5': [0, 4, 6, 10, 3], 'Dominant #9#5': [0, 4, 8, 10, 3],
  'Major 9b5': [0, 4, 6, 11, 2], 'Major 9#5': [0, 4, 8, 11, 2], 'Major b9b5': [0, 4, 6, 11, 1],
  'Major b9#5': [0, 4, 8, 11, 1], 'Major #9b5': [0, 4, 6, 11, 3], 'Major #9#5': [0, 4, 8, 11, 3],
  'Minor 9b5': [0, 3, 6, 10, 2], 'Minor 9#5': [0, 3, 8, 10, 2], 'Minor b9b5': [0, 3, 6, 10, 1], 'Minor b9#5': [0, 3, 8, 10, 1],
};

const SIXTH_NINTH_CHORDS_5_NOTE = { '6/9': [0, 4, 7, 9, 2], 'Minor 6/9': [0, 3, 7, 9, 2], '6/9 sus4': [0, 5, 7, 9, 2] };

const ELEVENTH_CHORDS_6_NOTE = {
  'Major 11': [0, 4, 7, 11, 2, 5], 'Major 11b9': [0, 4, 7, 11, 1, 5], 'Major 11#9': [0, 4, 7, 11, 3, 5],
  'Minor 11': [0, 3, 7, 10, 2, 5], 'Minor 11b9': [0, 3, 7, 10, 1, 5], 'Dominant 11': [0, 4, 7, 10, 2, 5],
  'Dominant 11b9': [0, 4, 7, 10, 1, 5], 'Dominant 11#9': [0, 4, 7, 10, 3, 5],
};

const SHARP_ELEVENTH_CHORDS_6_NOTE = {
  'Major #11': [0, 4, 7, 11, 2, 6], 'Major #11b9': [0, 4, 7, 11, 1, 6], 'Major #11#9': [0, 4, 7, 11, 3, 6],
  'Minor #11': [0, 3, 7, 10, 2, 6], 'Minor #11b9': [0, 3, 7, 10, 1, 6], 'Dominant #11': [0, 4, 7, 10, 2, 6],
  'Dominant #11b9': [0, 4, 7, 10, 1, 6], 'Dominant #11#9': [0, 4, 7, 10, 3, 6],
};

const ALTERED_11TH_CHORDS_6_NOTE = {
  'Dominant 11b5': [0, 4, 6, 10, 2, 5], 'Dominant 11#5': [0, 4, 8, 10, 2, 5], 'Dominant 11b9b5': [0, 4, 6, 10, 1, 5],
  'Dominant 11b9#5': [0, 4, 8, 10, 1, 5], 'Dominant 11#9b5': [0, 4, 6, 10, 3, 5], 'Dominant 11#9#5': [0, 4, 8, 10, 3, 5],
  'Major 11b5': [0, 4, 6, 11, 2, 5], 'Major 11#5': [0, 4, 8, 11, 2, 5], 'Major 11b9b5': [0, 4, 6, 11, 1, 5],
  'Major 11b9#5': [0, 4, 8, 11, 1, 5], 'Major 11#9b5': [0, 4, 6, 11, 3, 5], 'Major 11#9#5': [0, 4, 8, 11, 3, 5],
  'Minor 11b5': [0, 3, 6, 10, 2, 5], 'Minor 11#5': [0, 3, 8, 10, 2, 5], 'Minor 11b9b5': [0, 3, 6, 10, 1, 5], 'Minor 11b9#5': [0, 3, 8, 10, 1, 5],
};

const THIRTEENTH_CHORDS_7_NOTE = {
  'Major 13': [0, 4, 7, 11, 2, 5, 9], 'Major 13b9': [0, 4, 7, 11, 1, 5, 9], 'Major 13#9': [0, 4, 7, 11, 3, 5, 9],
  'Minor 13': [0, 3, 7, 10, 2, 5, 9], 'Minor 13b9': [0, 3, 7, 10, 1, 5, 9], 'Dominant 13': [0, 4, 7, 10, 2, 5, 9],
  'Dominant 13b9': [0, 4, 7, 10, 1, 5, 9], 'Dominant 13#9': [0, 4, 7, 10, 3, 5, 9],
};

const THIRTEENTH_SHARP_11_CHORDS_7_NOTE = {
  'Major 13#11': [0, 4, 7, 11, 2, 6, 9], 'Major 13#11b9': [0, 4, 7, 11, 1, 6, 9], 'Major 13#11#9': [0, 4, 7, 11, 3, 6, 9],
  'Minor 13#11': [0, 3, 7, 10, 2, 6, 9], 'Minor 13#11b9': [0, 3, 7, 10, 1, 6, 9], 'Dominant 13#11': [0, 4, 7, 10, 2, 6, 9],
  'Dominant 13#11b9': [0, 4, 7, 10, 1, 6, 9], 'Dominant 13#11#9': [0, 4, 7, 10, 3, 6, 9],
};

const ALTERED_13TH_CHORDS_7_NOTE = {
  'Dominant 13b5': [0, 4, 6, 10, 2, 5, 9], 'Dominant 13#5': [0, 4, 8, 10, 2, 5, 9], 'Dominant 13b9b5': [0, 4, 6, 10, 1, 5, 9],
  'Dominant 13b9#5': [0, 4, 8, 10, 1, 5, 9], 'Dominant 13#9b5': [0, 4, 6, 10, 3, 5, 9], 'Dominant 13#9#5': [0, 4, 8, 10, 3, 5, 9],
  'Major 13b5': [0, 4, 6, 11, 2, 5, 9], 'Major 13#5': [0, 4, 8, 11, 2, 5, 9], 'Major 13b9b5': [0, 4, 6, 11, 1, 5, 9],
  'Major 13b9#5': [0, 4, 8, 11, 1, 5, 9], 'Major 13#9b5': [0, 4, 6, 11, 3, 5, 9], 'Major 13#9#5': [0, 4, 8, 11, 3, 5, 9],
  'Minor 13b5': [0, 3, 6, 10, 2, 5, 9], 'Minor 13#5': [0, 3, 8, 10, 2, 5, 9], 'Minor 13b9b5': [0, 3, 6, 10, 1, 5, 9], 'Minor 13b9#5': [0, 3, 8, 10, 1, 5, 9],
};

export const CHORD_CATEGORIES = [
  { name: 'Triads (3-note)', chords: createChordList(TRIADS_3_NOTE) },
  { name: 'Seventh Chords (4-note)', chords: createChordList(SEVENTH_CHORDS_4_NOTE) },
  { name: 'Suspended Sevenths (4-note)', chords: createChordList(SUS_SEVENTH_CHORDS_4_NOTE) },
  { name: 'Sixth Chords (4-note)', chords: createChordList(SIXTH_CHORDS_4_NOTE) },
  { name: 'add 9 Chords (4-note)', chords: createChordList(ADD_9_CHORDS_4_NOTE) },
  { name: 'add 11 Chords (4-note)', chords: createChordList(ADD_11_CHORDS_4_NOTE) },
  { name: 'Altered 7ths (4-note)', chords: createChordList(ALTERED_7TH_CHORDS_4_NOTE) },
  { name: 'Ninth Chords (5-note)', chords: createChordList(NINTH_CHORDS_5_NOTE) },
  { name: 'Altered 9ths (5-note)', chords: createChordList(ALTERED_9TH_CHORDS_5_NOTE) },
  { name: 'Sixth/Ninth (5-note)', chords: createChordList(SIXTH_NINTH_CHORDS_5_NOTE) },
  { name: 'Eleventh Chords (6-note)', chords: createChordList(ELEVENTH_CHORDS_6_NOTE) },
  { name: 'Sharp 11th Chords (6-note)', chords: createChordList(SHARP_ELEVENTH_CHORDS_6_NOTE) },
  { name: 'Altered 11ths (6-note)', chords: createChordList(ALTERED_11TH_CHORDS_6_NOTE) },
  { name: 'Thirteenth Chords (7-note)', chords: createChordList(THIRTEENTH_CHORDS_7_NOTE) },
  { name: '13th #11 Chords (7-note)', chords: createChordList(THIRTEENTH_SHARP_11_CHORDS_7_NOTE) },
  { name: 'Altered 13ths (7-note)', chords: createChordList(ALTERED_13TH_CHORDS_7_NOTE) },
];

export const CHORD_TYPES = {
  ...TRIADS_3_NOTE, ...SEVENTH_CHORDS_4_NOTE, ...SUS_SEVENTH_CHORDS_4_NOTE, ...SIXTH_CHORDS_4_NOTE, ...ADD_9_CHORDS_4_NOTE,
  ...ADD_11_CHORDS_4_NOTE, ...ALTERED_7TH_CHORDS_4_NOTE, ...NINTH_CHORDS_5_NOTE, ...ALTERED_9TH_CHORDS_5_NOTE,
  ...SIXTH_NINTH_CHORDS_5_NOTE, ...ELEVENTH_CHORDS_6_NOTE, ...SHARP_ELEVENTH_CHORDS_6_NOTE, ...ALTERED_11TH_CHORDS_6_NOTE,
  ...THIRTEENTH_CHORDS_7_NOTE, ...THIRTEENTH_SHARP_11_CHORDS_7_NOTE, ...ALTERED_13TH_CHORDS_7_NOTE
};