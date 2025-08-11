// src/data/Scales.js

// Helper function to create a structured list from raw data
const createScaleList = (scales) => Object.entries(scales).map(([name, intervals]) => ({ name, intervals }));

// Raw data grouped by category
const MAJOR_MODES = {
    'Ionian': [0, 2, 4, 5, 7, 9, 11], 'Dorian': [0, 2, 3, 5, 7, 9, 10],
    'Phrygian': [0, 1, 3, 5, 7, 8, 10], 'Lydian': [0, 2, 4, 6, 7, 9, 11],
    'Mixolydian': [0, 2, 4, 5, 7, 9, 10], 'Aeolian': [0, 2, 3, 5, 7, 8, 10],
    'Locrian': [0, 1, 3, 5, 6, 8, 10],
};
const MELODIC_MINOR_MODES = {
    'Melodic Minor': [0, 2, 3, 5, 7, 9, 11], 'Dorian ♭2': [0, 1, 3, 5, 7, 9, 10],
    'Lydian Augmented': [0, 2, 4, 6, 8, 9, 11], 'Lydian Dominant': [0, 2, 4, 6, 7, 9, 10],
    'Mixolydian ♭6': [0, 2, 4, 5, 7, 8, 10], 'Locrian ♮2': [0, 2, 3, 5, 6, 8, 10],
    'Super Locrian (Altered Scale)': [0, 1, 3, 4, 6, 8, 10],
};
const HARMONIC_MINOR_MODES = {
    'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11], 'Locrian ♮6': [0, 1, 3, 5, 6, 9, 10],
    'Ionian ♯5': [0, 2, 4, 5, 8, 9, 11], 'Dorian ♯4': [0, 2, 3, 6, 7, 9, 10],
    'Phrygian Dominant': [0, 1, 4, 5, 7, 8, 10], 'Lydian ♯2': [0, 3, 4, 6, 7, 9, 11],
    'Super Locrian 𝄫7': [0, 1, 3, 4, 6, 8, 9],
};
const PENTATONIC_SCALES = {
    'Major Pentatonic': [0, 2, 4, 7, 9], 'Minor Pentatonic': [0, 3, 5, 7, 10],
    'Blues Scale': [0, 3, 5, 6, 7, 10], 'Suspended Pentatonic (Egyptian)': [0, 2, 5, 7, 10],
};
const JAPANESE_SCALES = {
    'Insen Scale': [0, 1, 5, 7, 10], 'Hirajoshi Scale': [0, 2, 3, 7, 8],
};
const BEBOP_SCALES = {
    'Bebop Dominant': [0, 2, 4, 5, 7, 9, 10, 11], 'Bebop Major': [0, 2, 4, 5, 7, 8, 9, 11],
};
const SYMMETRIC_SCALES = {
    'Whole Tone': [0, 2, 4, 6, 8, 10], 'Whole-Half Diminished': [0, 2, 3, 5, 6, 8, 9, 11],
    'Half-Whole Diminished': [0, 1, 3, 4, 6, 7, 9, 10], 
};

// New structured export for the modal
export const SCALE_CATEGORIES = [
    { name: 'Major Modes', scales: createScaleList(MAJOR_MODES) },
    { name: 'Pentatonic & Blues', scales: createScaleList(PENTATONIC_SCALES) },
    { name: 'Melodic Minor Modes', scales: createScaleList(MELODIC_MINOR_MODES) },
    { name: 'Harmonic Minor Modes', scales: createScaleList(HARMONIC_MINOR_MODES) },
    { name: 'Bebop Scales', scales: createScaleList(BEBOP_SCALES) },
    { name: 'Japanese Scales', scales: createScaleList(JAPANESE_SCALES) },
    { name: 'Symmetric Scales', scales: createScaleList(SYMMETRIC_SCALES) },
];

// Flat object for backwards compatibility
export const SCALES = {
    ...MAJOR_MODES, ...MELODIC_MINOR_MODES, ...HARMONIC_MINOR_MODES, ...PENTATONIC_SCALES,
    ...JAPANESE_SCALES, ...BEBOP_SCALES, ...SYMMETRIC_SCALES
};

// ... (SCALE_PRIORITY and SCALE_INTERVAL_NAMES remain unchanged)
export const SCALE_PRIORITY = [ 'Ionian', 'Dorian', 'Mixolydian', 'Aeolian', 'Lydian', 'Phrygian', 'Melodic Minor', 'Harmonic Minor', 'Lydian Dominant', 'Phrygian Dominant', 'Super Locrian (Altered Scale)', 'Dorian ♭2', 'Lydian Augmented', 'Mixolydian ♭6', 'Locrian ♮2', 'Locrian ♮6', 'Ionian ♯5', 'Dorian ♯4', 'Lydian ♯2', 'Super Locrian 𝄫7', 'Whole Tone', 'Half-Whole Diminished', 'Whole-Half Diminished', 'Locrian' ];
export const SCALE_INTERVAL_NAMES = { 'Ionian': ['R', 'M2', 'M3', 'P4', 'P5', 'M6', 'M7'], 'Dorian': ['R', 'M2', 'm3', 'P4', 'P5', 'M6', 'm7'], 'Phrygian': ['R', '♭2', 'm3', 'P4', 'P5', 'm6', 'm7'], 'Lydian': ['R', 'M2', 'M3', '♯4', 'P5', 'M6', 'M7'], 'Mixolydian': ['R', 'M2', 'M3', 'P4', 'P5', 'M6', 'm7'], 'Aeolian': ['R', 'M2', 'm3', 'P4', 'P5', 'm6', 'm7'], 'Locrian': ['R', '♭2', 'm3', 'P4', '♭5', 'm6', 'm7'], 'Melodic Minor': ['R', 'M2', 'm3', 'P4', 'P5', 'M6', 'M7'], 'Dorian ♭2': ['R', '♭2', 'm3', 'P4', 'P5', 'M6', 'm7'], 'Lydian Augmented': ['R', 'M2', 'M3', '♯4', '♯5', 'M6', 'M7'], 'Lydian Dominant': ['R', 'M2', 'M3', '♯4', 'P5', 'M6', 'm7'], 'Mixolydian ♭6': ['R', 'M2', 'M3', 'P4', 'P5', '♭6', 'm7'], 'Locrian ♮2': ['R', 'M2', 'm3', 'P4', '♭5', 'm6', 'm7'], 'Super Locrian (Altered Scale)': ['R', '♭2', 'm3', '♭4', '♭5', '♭6', 'm7'], 'Harmonic Minor': ['R', 'M2', 'm3', 'P4', 'P5', 'm6', 'M7'], 'Locrian ♮6': ['R', '♭2', 'm3', 'P4', '♭5', 'M6', 'm7'], 'Ionian ♯5': ['R', 'M2', 'M3', 'P4', '♯5', 'M6', 'M7'], 'Dorian ♯4': ['R', 'M2', 'm3', '♯4', 'P5', 'M6', 'm7'], 'Phrygian Dominant': ['R', '♭2', 'M3', 'P4', 'P5', 'm6', 'm7'], 'Lydian ♯2': ['R', '♯2', 'M3', '♯4', 'P5', 'M6', 'M7'], 'Super Locrian 𝄫7': ['R', '♭2', 'm3', '♭4', '♭5', '♭6', '𝄫7'], 'Whole Tone': ['R', 'M2', 'M3', '♯4', '♯5', '♭7'], 'Whole-Half Diminished': ['R', 'M2', 'm3', 'P4', '♭5', 'm6', 'M6', 'M7'], 'Half-Whole Diminished': ['R', '♭2', 'm3', '♭4', '♭5', 'M5', 'M6', 'm7'], };