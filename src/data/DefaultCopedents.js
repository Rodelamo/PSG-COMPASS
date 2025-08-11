// src/data/DefaultCopedents.js

import { detectSplits } from '../logic/CopedentUtils';

/**
 * DEFAULT COPEDENTS DATA MODULE
 * This file defines a collection of predefined pedal steel guitar copedents.
 */

const createCopedentObject = (rawCopedent) => {
  const strings = rawCopedent.strings.map((note, index) => ({
    id: index + 1,
    openNote: note,
    changes: {}
  }));

  const pedals = rawCopedent.pedals.map(p => ({
    id: p.id,
    name: p.name,
    changes: p.changes
  }));

  const kneeLevers = rawCopedent.kneeLevers.map(kl => ({
    id: kl.id,
    name: kl.name,
    active: kl.active,
    changes: kl.changes
  }));

  const detectedSplits = rawCopedent.splits.map(split => ({
      stringId: split.stringId,
      openNote: strings[split.stringId - 1].openNote,
      conflictingControls: split.conflictingControlIds.map(controlId => {
          const control = [...pedals, ...kneeLevers].find(c => c.id === controlId);
          return {
              id: control.id,
              name: control.name,
              type: control.id.startsWith('P') ? 'pedal' : 'lever'
          };
      }),
      manualSemitoneChange: split.manualSemitoneChange,
      isIncludedInCalculation: split.isIncludedInCalculation,
  }));
  
  const mechanisms = rawCopedent.mechanisms.map(m => ({ ...m }));
  const mechanismCombinations = { ...rawCopedent.mechanismCombinations };

  return {
    id: rawCopedent.id,
    name: rawCopedent.name,
    strings: strings,
    pedals: pedals,
    kneeLevers: kneeLevers,
    detectedSplits: detectedSplits,
    mechanisms: mechanisms,
    mechanismCombinations: mechanismCombinations
  };
};

const rawMyCustomCopedent = {
  id: 'default-12-string-universal',
  name: 'GFI 12 String Universal Tuning',
  mechanisms: [],
  mechanismCombinations: {},
  strings: [
    'F♯4', 'D♯4', 'G♯4', 'E4', 'B3', 'G♯3', 'F♯3', 'E3', 'B2', 'G♯2', 'E2', 'B1'
  ],
  pedals: [
    { id: 'P1', name: 'P1', changes: { 5: 2, 9: 2 } },
    { id: 'P2', name: 'P2', changes: { 3: 1, 6: 1, 10: 1 } },
    { id: 'P3', name: 'P3', changes: { 4: 2, 5: 2 } },
    { id: 'P4', name: 'P4', changes: { 9: 1, 11: -1, 12: -3 } },
    { id: 'P5', name: 'P5', changes: { 7: -1, 11: 1, 12: 2 } },
    { id: 'P6', name: 'P6', changes: { 4: 1, 8: -2 } },
    { id: 'P7', name: 'P7', changes: { 5: 2, 6: 2 } }
  ],
  kneeLevers: [
    { id: 'LKL', name: 'LKL', active: true, changes: { 4: 1, 8: 1 } },
    { id: 'LKR', name: 'LKR', active: true, changes: { 4: -1, 8: -1 } },
    { id: 'VL', name: 'VL', active: true, changes: { 5: -1 } },
    { id: 'RKL', name: 'RKL', active: true, changes: { 1: 1, 7: 1 } },
    { id: 'RKR', name: 'RKR', active: true, changes: { 2: -1, 9: 3 } },
    { id: 'VR', name: 'VR', active: false, changes: {} },
    { id: 'LKL2', name: 'LKL2', active: false, changes: {} },
    { id: 'LKR2', name: 'LKR2', active: false, changes: {} },
    { id: 'VL2', name: 'VL2', active: false, changes: {} },
    { id: 'RKL2', name: 'RKL2', active: false, changes: {} },
    { id: 'RKR2', name: 'RKR2', active: false, changes: {} },
    { id: 'VR2', name: 'VR2', active: false, changes: {} },
  ],
  splits: [
    { stringId: 4, conflictingControlIds: ['P3', 'LKL'], manualSemitoneChange: 2, isIncludedInCalculation: 'include' },
    { stringId: 4, conflictingControlIds: ['P3', 'LKR'], manualSemitoneChange: 1, isIncludedInCalculation: 'include' },
    { stringId: 4, conflictingControlIds: ['P6', 'LKL'], manualSemitoneChange: 1, isIncludedInCalculation: 'include' },
    { stringId: 4, conflictingControlIds: ['P6', 'LKR'], manualSemitoneChange: 0, isIncludedInCalculation: 'include' },
    { stringId: 5, conflictingControlIds: ['P1', 'VL'], manualSemitoneChange: 1, isIncludedInCalculation: 'include' },
    { stringId: 5, conflictingControlIds: ['P3', 'VL'], manualSemitoneChange: 1, isIncludedInCalculation: 'include' },
    { stringId: 5, conflictingControlIds: ['P7', 'VL'], manualSemitoneChange: 1, isIncludedInCalculation: 'include' },
    { stringId: 7, conflictingControlIds: ['P5', 'RKL'], manualSemitoneChange: 0, isIncludedInCalculation: 'include' },
    { stringId: 8, conflictingControlIds: ['P6', 'LKL'], manualSemitoneChange: -1, isIncludedInCalculation: 'include' },
    { stringId: 8, conflictingControlIds: ['P6', 'LKR'], manualSemitoneChange: -2, isIncludedInCalculation: 'include' },
    { stringId: 9, conflictingControlIds: ['P1', 'RKR'], manualSemitoneChange: 3, isIncludedInCalculation: 'include' },
    { stringId: 9, conflictingControlIds: ['P4', 'RKR'], manualSemitoneChange: 3, isIncludedInCalculation: 'include' },
    { stringId: 11, conflictingControlIds: ['P4', 'P5'], manualSemitoneChange: 0, isIncludedInCalculation: 'include' },
    { stringId: 12, conflictingControlIds: ['P4', 'P5'], manualSemitoneChange: -1, isIncludedInCalculation: 'include' },
  ],
};

const raw_e9_standard = {
  id: 'default-e9-standard',
  name: 'E9 Standard',
  mechanisms: [],
  mechanismCombinations: {},
  strings: ['F♯4', 'D♯4', 'G♯4', 'E4', 'B3', 'G♯3', 'F♯3', 'E3', 'D3', 'B2'],
  pedals: [
    { id: 'P1', name: 'P1', changes: { 5: 2, 10: 2 } },
    { id: 'P2', name: 'P2', changes: { 3: 1, 6: 1 } },
    { id: 'P3', name: 'P3', changes: { 4: 2, 5: 2 } }
  ],
  kneeLevers: [
    { id: 'LKL', name: 'LKL', active: true, changes: { 4: 1, 8: 1 } },
    { id: 'LKR', name: 'LKR', active: true, changes: { 4: -1, 8: -1 } },
    { id: 'VL', name: 'VL', active: true, changes: { 5: -1, 10: -1 } },
    { id: 'RKL', name: 'RKL', active: true, changes: { 1: 2, 2: 1, 6: -2 } },
    { id: 'RKR', name: 'RKR', active: true, changes: { 2: -2, 9: -1 } },
    { id: 'VR', name: 'VR', active: false, changes: {} },
    { id: 'LKL2', name: 'LKL2', active: false, changes: {} },
    { id: 'LKR2', name: 'LKR2', active: false, changes: {} },
    { id: 'VL2', name: 'VL2', active: false, changes: {} },
    { id: 'RKL2', name: 'RKL2', active: false, changes: {} },
    { id: 'RKR2', name: 'RKR-HS', active: true, changes: { 2: -1 } },
    { id: 'VR2', name: 'VR2', active: false, changes: {} }
  ],
  splits: [
    { stringId: 2, conflictingControlIds: ['RKR', 'RKR2'], manualSemitoneChange: -3, isIncludedInCalculation: 'exclude' },
    { stringId: 4, conflictingControlIds: ['P3', 'LKL'], manualSemitoneChange: 2, isIncludedInCalculation: 'include' },
    { stringId: 4, conflictingControlIds: ['P3', 'LKR'], manualSemitoneChange: 1, isIncludedInCalculation: 'include' },
    { stringId: 5, conflictingControlIds: ['P1', 'VL'], manualSemitoneChange: 1, isIncludedInCalculation: 'include' },
    { stringId: 5, conflictingControlIds: ['P3', 'VL'], manualSemitoneChange: 1, isIncludedInCalculation: 'include' },
    { stringId: 6, conflictingControlIds: ['P2', 'RKL'], manualSemitoneChange: 1, isIncludedInCalculation: 'include' },
    { stringId: 10, conflictingControlIds: ['P1', 'VL'], manualSemitoneChange: 1, isIncludedInCalculation: 'include' }
  ]
};

const raw_c6_standard = {
  id: 'default-c6-standard',
  name: 'C6 Standard',
  mechanisms: [],
  mechanismCombinations: {},
  strings: ['G4', 'E4', 'C4', 'A3', 'G3', 'E3', 'C3', 'A2', 'F2', 'C2'],
  pedals: [
    { id: 'P1', name: 'P4', changes: { 4: 2, 8: 2 } },
    { id: 'P2', name: 'P5', changes: { 1: 1, 5: -1, 9: 1, 10: 2 } },
    { id: 'P3', name: 'P6', changes: { 2: 1, 6: -1 } },
    { id: 'P4', name: 'P7', changes: { 3: 2, 4: 2 } },
    { id: 'P5', name: 'P8', changes: { 7: 1, 9: -1, 10: -3 } }
  ],
  kneeLevers: [
    { id: 'LKL', name: 'LKL', active: false, changes: { 4: 1, 8: 1 } },
    { id: 'LKR', name: 'LKR', active: false, changes: { 4: -1, 8: -1 } },
    { id: 'VL', name: 'VL', active: false, changes: { 5: -1, 10: -1 } },
    { id: 'RKL', name: 'RKL', active: true, changes: { 3: -1 } },
    { id: 'RKR', name: 'RKR', active: false, changes: { 2: -2, 9: -1 } },
    { id: 'VR', name: 'VR', active: false, changes: {  } },
    { id: 'LKL2', name: 'LKL2', active: false, changes: {  } },
    { id: 'LKR2', name: 'LKR2', active: false, changes: {  } },
    { id: 'VL2', name: 'VL2', active: false, changes: {  } },
    { id: 'RKL2', name: 'RKL2', active: false, changes: {  } },
    { id: 'RKR2', name: 'RKR-HS', active: false, changes: { 2: -1 } },
    { id: 'VR2', name: 'VR2', active: false, changes: {  } }
  ],
  splits: [
    { stringId: 3, conflictingControlIds: ['P4', 'RKL'], manualSemitoneChange: 1, isIncludedInCalculation: 'include' }
  ]
};

export const DEFAULT_COPEDENTS = [
  createCopedentObject(rawMyCustomCopedent),
  createCopedentObject(raw_e9_standard),
  createCopedentObject(raw_c6_standard),
];