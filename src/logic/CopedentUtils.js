// src/logic/CopedentUtils.js

import { getNoteAtOffset } from './NoteUtils';

/**
 * COPEDENT UTILITIES MODULE
 */

export const formatControlCombination = (pedalIds = [], leverIds = [], mechanismIds = [], copedent) => {
  const parts = [];

  if (!copedent) {
    const allIds = [...pedalIds, ...leverIds, ...mechanismIds];
    return allIds.length > 0 ? `(${allIds.sort().join('+')})` : 'Open';
  }

  if (pedalIds.length > 0) {
    const pedalNames = pedalIds.sort().map(id => {
      const baseId = id.split('-')[0];
      const basePedal = copedent.pedals.find(p => p.id === baseId);
      if (!basePedal) return id; // Fallback
      if (id.includes('-')) {
          const fraction = id.split('-')[1];
          return `${basePedal.name}-${fraction}`;
      }
      return basePedal.name;
    });
    parts.push(`(${pedalNames.join('+')})`);
  }

  const leftKneeGroup = leverIds.filter(l => l.startsWith('L') || l.startsWith('V')).sort();
  const rightKneeGroup = leverIds.filter(l => l.startsWith('R')).sort();

  const formatLevers = (leverIdGroup) => {
      return leverIdGroup.map(id => {
        const baseId = id.split('-')[0];
        const baseLever = copedent.kneeLevers.find(l => l.id === baseId);
        if (!baseLever) return id; // Fallback
        if (id.includes('-')) {
            const fraction = id.split('-')[1];
            return `${baseLever.name}-${fraction}`;
        }
        return baseLever.name;
      });
  };

  if (leftKneeGroup.length > 0) parts.push(`(${formatLevers(leftKneeGroup).join('+')})`);
  if (rightKneeGroup.length > 0) parts.push(`(${formatLevers(rightKneeGroup).join('+')})`);
  
  if (mechanismIds.length > 0) {
    const mecNames = mechanismIds.sort().map(id => {
        const mec = copedent.mechanisms?.find(m => m.id === id);
        return mec ? mec.name : id;
    });
    parts.push(`(${mecNames.join('+')})`);
  }

  if (parts.length === 0) return 'Open';
  
  return parts.join(' + ');
};

const getLeverProperties = (leverId) => {
    if (leverId.startsWith('V')) return { knee: 'Vertical', direction: null };
    return {
        knee: leverId.charAt(0),
        direction: leverId.charAt(2)
    };
};

export const isLeverCombinationValid = (leverIds) => {
    const leftKneeDirections = new Set();
    const rightKneeDirections = new Set();
    for (const leverId of leverIds) {
        const props = getLeverProperties(leverId.split('-')[0]);
        if (props.knee === 'L') leftKneeDirections.add(props.direction);
        else if (props.knee === 'R') rightKneeDirections.add(props.direction);
    }
    if (leftKneeDirections.has('L') && leftKneeDirections.has('R')) return false;
    if (rightKneeDirections.has('L') && rightKneeDirections.has('R')) return false;
    return true;
};

export const isFractalCombinationValid = (controlIds) => {
    const baseIds = controlIds.map(id => id.split('-')[0]);
    const uniqueBaseIds = new Set(baseIds);
    return uniqueBaseIds.size === controlIds.length;
};

const canControlsSplit = (controlA, controlB, mechanismCombinations) => {
  if (controlA.id === controlB.id) return false;

  if (controlA.type === 'mechanism' || controlB.type === 'mechanism') {
    const mec = controlA.type === 'mechanism' ? controlA : controlB;
    const other = controlA.type === 'mechanism' ? controlB : controlA;
    return mechanismCombinations[mec.id]?.includes(other.id) || false;
  }

  if (controlA.type === 'pedal' && controlB.type === 'pedal') {
    const pedalNumA = parseInt(controlA.id.substring(1));
    const pedalNumB = parseInt(controlB.id.substring(1));
    return Math.abs(pedalNumA - pedalNumB) === 1;
  }

  if (controlA.type === 'lever' && controlB.type === 'lever') {
    return isLeverCombinationValid([controlA.id, controlB.id]);
  }
  
  return true;
};

export const detectSplits = (strings, pedals, kneeLevers, mechanisms = [], mechanismCombinations = {}) => {
  const splits = [];
  const activeKneeLevers = kneeLevers.filter(lever => lever.active);
  
  const allControls = [
      ...pedals.map(p => ({...p, type: 'pedal'})), 
      ...activeKneeLevers.map(l => ({...l, type: 'lever'})),
      ...mechanisms.map(m => ({...m, type: 'mechanism'}))
  ];

  strings.forEach(string => {
    const affectedByControls = [];

    allControls.forEach(control => {
      const semitones = control.changes[string.id];
      if (semitones !== undefined && semitones !== 0) {
        affectedByControls.push({ 
            id: control.id, 
            name: control.name, 
            type: control.type,
            change: semitones
        });
      }
    });

    if (affectedByControls.length < 2) return;

    const uniqueSplitPairs = new Set();
    for (let i = 0; i < affectedByControls.length; i++) {
      for (let j = i + 1; j < affectedByControls.length; j++) {
        const controlA = affectedByControls[i];
        const controlB = affectedByControls[j];
        if (canControlsSplit(controlA, controlB, mechanismCombinations)) {
          const sortedIds = [controlA.id, controlB.id].sort();
          const splitPairKey = `${string.id}-${sortedIds[0]}_${sortedIds[1]}`;
          if (!uniqueSplitPairs.has(splitPairKey)) {
            uniqueSplitPairs.add(splitPairKey);
            
            const stackedChange = controlA.change + controlB.change;

            splits.push({ 
              stringId: string.id, 
              openNote: string.openNote, 
              conflictingControls: [
                  { id: controlA.id, name: controlA.name, type: controlA.type }, 
                  { id: controlB.id, name: controlB.name, type: controlB.type }
              ],
              manualSemitoneChange: stackedChange,
              isIncludedInCalculation: 'DEFINE'
            });
          }
        }
      }
    }
  });
  return splits;
};

// NEW: A central validation function for any combination of controls.
export const isFullCombinationValid = (pedals, levers, mecs, copedent) => {
    // 1. Check standard pedal rules (adjacency)
    if (pedals.length > 2) return { valid: false, message: 'You can select a maximum of two adjacent pedals.' };
    if (pedals.length === 2) {
        const p1Num = parseInt(pedals[0].substring(1));
        const p2Num = parseInt(pedals[1].substring(1));
        if (Math.abs(p1Num - p2Num) !== 1) {
            return { valid: false, message: 'You can only select two pedals that are adjacent to each other.' };
        }
    }

    // 2. Check standard lever rules (physical possibility)
    if (!isLeverCombinationValid(levers)) {
        return { valid: false, message: 'This knee lever combination is physically impossible.' };
    }

    // 3. Check mechanism rules against all other active controls
    const allOtherControls = [...pedals, ...levers];
    for (const mecId of mecs) {
        const allowedPartners = copedent.mechanismCombinations[mecId] || [];
        // Check against other active mecs
        for (const otherMecId of mecs) {
            if (mecId !== otherMecId && !allowedPartners.includes(otherMecId)) {
                const mec1 = copedent.mechanisms.find(m => m.id === mecId);
                const mec2 = copedent.mechanisms.find(m => m.id === otherMecId);
                return { valid: false, message: `Mechanism ${mec1.name} cannot be combined with ${mec2.name}.`};
            }
        }
        // Check against active pedals and levers
        for (const controlId of allOtherControls) {
            if (!allowedPartners.includes(controlId)) {
                const mec = copedent.mechanisms.find(m => m.id === mecId);
                const control = [...copedent.pedals, ...copedent.kneeLevers].find(c => c.id === controlId);
                return { valid: false, message: `Mechanism ${mec.name} cannot be combined with ${control.name}.` };
            }
        }
    }

    return { valid: true, message: '' };
};