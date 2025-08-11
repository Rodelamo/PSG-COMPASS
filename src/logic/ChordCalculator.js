// src/logic/ChordCalculator.js

import { getNoteAtOffset, getSemitonesBetween, normalizeNote, getContextualIntervalName, getScaleIntervalName, getScaleNoteEnharmonic } from './NoteUtils';
import { CHROMATIC_SCALE_SHARPS } from '../data/Notes';
import { CHORD_TYPES } from '../data/DefaultChordTypes';
import { SCALES, SCALE_PRIORITY } from '../data/Scales';
import chordCache from '../utils/ChordCache';

const getControlStates = (controls) => {
    const controlStateMap = {};
    controls.forEach(control => {
        controlStateMap[control.id] = [{ id: control.id, changes: control.changes, name: control.name }];
    });
    return controlStateMap;
};

const generatePedalCombinations = (pedals) => {
    const combinations = [[]]; 
    const pedalIds = pedals.map(p => p.id).sort((a, b) => parseInt(a.substring(1)) - parseInt(b.substring(1)));
    pedalIds.forEach(id => combinations.push([id]));
    for (let i = 0; i < pedalIds.length - 1; i++) {
        if (Math.abs(parseInt(pedalIds[i].substring(1)) - parseInt(pedalIds[i+1].substring(1))) === 1) {
            combinations.push([pedalIds[i], pedalIds[i+1]]);
        }
    }
    return combinations;
};


const getLeverProperties = (leverId) => {
    if (leverId.startsWith('V')) return { knee: 'Vertical', direction: null };
    const baseId = leverId.split('-')[0];
    return {
        knee: baseId.charAt(0),
        direction: baseId.charAt(2)
    };
};

export const isLeverCombinationValid = (leverIds) => {
    const leftKneeDirections = new Set();
    const rightKneeDirections = new Set();
    for (const leverId of leverIds) {
        const props = getLeverProperties(leverId);
        if (props.knee === 'L') leftKneeDirections.add(props.direction);
        else if (props.knee === 'R') rightKneeDirections.add(props.direction);
    }
    if (leftKneeDirections.has('L') && leftKneeDirections.has('R')) return false;
    if (rightKneeDirections.has('L') && rightKneeDirections.has('R')) return false;
    return true;
};

const generateKneeLeverCombinations = (activeKneeLevers) => {
    const leverIds = activeKneeLevers.map(l => l.id);
    const subsets = [[]];
    for (const item of leverIds) {
      const currentLength = subsets.length;
      for (let i = 0; i < currentLength; i++) {
        subsets.push([...subsets[i], item]);
      }
    }
    return subsets.filter(subset => isLeverCombinationValid(subset));
};

const generateMechanismCombinations = (mechanisms, mechanismCombinations) => {
    const mecs = mechanisms.map(m => m.id);
    const subsets = [[]];
    for (const item of mecs) {
      const currentLength = subsets.length;
      for (let i = 0; i < currentLength; i++) {
        subsets.push([...subsets[i], item]);
      }
    }

    return subsets.filter(subset => {
        if (subset.length < 2) return true;
        for (let i = 0; i < subset.length; i++) {
            for (let j = i + 1; j < subset.length; j++) {
                const mec1 = subset[i];
                const mec2 = subset[j];
                if (!mechanismCombinations[mec1]?.includes(mec2)) {
                    return false;
                }
            }
        }
        return true;
    });
};

const generateAllCombinations = (copedent) => {
    const { pedals, kneeLevers, mechanisms, mechanismCombinations } = copedent;
    const activeLevers = kneeLevers.filter(l => l.active);
    
    const pedalCombos = generatePedalCombinations(pedals);
    const leverCombos = generateKneeLeverCombinations(activeLevers);
    const baseCombos = [];
    for (const pCombo of pedalCombos) {
        for (const lCombo of leverCombos) {
            baseCombos.push({ pedals: pCombo, levers: lCombo, mecs: [] });
        }
    }

    const mecCombos = generateMechanismCombinations(mechanisms, mechanismCombinations);

    const mergedCombos = [];
    for (const base of baseCombos) {
        for (const mecCombo of mecCombos) {
            if (mecCombo.length === 0) continue;
            
            const baseControls = [...base.pedals, ...base.levers];
            if (baseControls.length === 0) continue;

            const isMergeValid = mecCombo.every(mecId => 
                baseControls.every(controlId => 
                    mechanismCombinations[mecId]?.includes(controlId)
                )
            );

            if (isMergeValid) {
                mergedCombos.push({ ...base, mecs: mecCombo });
            }
        }
    }
    
    const mecOnlyCombos = mecCombos.filter(mc => mc.length > 0).map(mc => ({ pedals: [], levers: [], mecs: mc }));

    return [...baseCombos, ...mecOnlyCombos, ...mergedCombos];
};


export const calculateFrettedNotesWithEffects = (
  strings, copedent, activePedalIds, activeLeverIds, activeMechanismIds, rootNoteWithOctave, fret
) => {
  const allControls = [...copedent.pedals, ...copedent.kneeLevers, ...(copedent.mechanisms || [])];
  const controlStateMap = getControlStates(allControls);

  const fretNotes = [];
  const normalizedRoot = normalizeNote(rootNoteWithOctave);
  strings.forEach(string => {
    let currentNote = getNoteAtOffset(string.openNote, fret);
    let totalSemitoneChangeFromControls = 0;
    let isStringMutedBySplit = false;
    const controlsAffectingThisStringInCombo = [];
    
    const allActiveControls = [...activePedalIds, ...activeLeverIds, ...activeMechanismIds];
    
    allActiveControls.forEach(controlId => {
        const baseId = controlId.split('-')[0];
        const controlStates = controlStateMap[baseId] || [];
        const state = controlStates.find(s => s.id === controlId);
        if (state && state.changes[string.id]) {
            controlsAffectingThisStringInCombo.push({ id: state.id, name: state.name });
        }
    });

    if (controlsAffectingThisStringInCombo.length > 1) {
      const baseControlIds = controlsAffectingThisStringInCombo.map(c => c.id.split('-')[0]).sort();
      const relevantSplit = copedent.detectedSplits.find(split => {
        const splitControlIds = split.conflictingControls.map(c => c.id).sort();
        return split.stringId === string.id &&
               splitControlIds.length === baseControlIds.length &&
               splitControlIds.every((id, index) => id === baseControlIds[index]);
      });

      if (relevantSplit) {
        if (relevantSplit.isIncludedInCalculation === 'include') {
          totalSemitoneChangeFromControls = relevantSplit.manualSemitoneChange;
        } else {
          isStringMutedBySplit = true;
        }
      } else {
        allActiveControls.forEach(controlId => {
            const baseId = controlId.split('-')[0];
            const controlStates = controlStateMap[baseId] || [];
            const state = controlStates.find(s => s.id === controlId);
            if (state && state.changes[string.id]) {
                totalSemitoneChangeFromControls += state.changes[string.id];
            }
        });
      }
    } else if (controlsAffectingThisStringInCombo.length === 1) {
      const controlId = controlsAffectingThisStringInCombo[0].id;
      const baseId = controlId.split('-')[0];
      const controlStates = controlStateMap[baseId] || [];
      const state = controlStates.find(s => s.id === controlId);
      if (state && state.changes[string.id]) {
        totalSemitoneChangeFromControls = state.changes[string.id];
      }
    }

    currentNote = isStringMutedBySplit ? null : getNoteAtOffset(currentNote, totalSemitoneChangeFromControls);
    const semitonesFromRoot = currentNote ? getSemitonesBetween(normalizedRoot, currentNote) : null;
    fretNotes.push({
      stringId: string.id, originalNote: string.openNote, fret: fret,
      activeControls: controlsAffectingThisStringInCombo.map(c => c.id), finalNote: currentNote,
      semitonesFromRoot, isMuted: isStringMutedBySplit, isChordTone: false, isPlayedInVoicing: false,
      isOverriddenBySplit: !!isStringMutedBySplit,
    });
  });
  return fretNotes;
};

const findParentScale = (rootNote, playedIntervals, fullChordIntervals) => {
    let chordQuality = 'minor';
    if (fullChordIntervals.includes(4)) {
        if (fullChordIntervals.includes(10)) {
            chordQuality = 'dominant';
        } else {
            chordQuality = 'major';
        }
    }

    const rootName = rootNote.replace(/\d+$/, '');
    const playedIntervalSet = new Set(playedIntervals);

    for (const scaleName of SCALE_PRIORITY) {
        const scaleIsMajor = scaleName.includes('Ionian') || scaleName.includes('Lydian');
        const scaleIsMinor = scaleName.includes('Dorian') || scaleName.includes('Aeolian') || scaleName.includes('Phrygian') || scaleName.includes('Locrian') || scaleName.includes('Minor');
        const scaleIsDominant = scaleName.includes('Mixolydian') || scaleName.includes('Dominant');

        if (chordQuality === 'major' && !scaleIsMajor) continue;
        if (chordQuality === 'minor' && !scaleIsMinor) continue;
        if (chordQuality === 'dominant' && !scaleIsDominant) continue;
        
        const scaleIntervals = new Set(SCALES[scaleName]);
        if ([...playedIntervalSet].every(i => scaleIntervals.has(i))) {
            return `${rootName} ${scaleName}`;
        }
    }
    return null;
}
const calculateMaxGap = (stringIds) => {
    if (stringIds.length < 2) return 0;
    const sortedIds = [...stringIds].sort((a,b) => a - b);
    let maxGap = 0;
    for (let i = 0; i < sortedIds.length - 1; i++) {
        const gap = sortedIds[i+1] - sortedIds[i] - 1;
        if (gap > maxGap) {
            maxGap = gap;
        }
    }
    return maxGap;
};
const transformUnisons = (notesInVoicing) => {
    const playedNotes = notesInVoicing.filter(n => n.isPlayedInVoicing);
    if (playedNotes.length < 2) return notesInVoicing;

    const pitches = new Map();
    const controlCounts = playedNotes.flatMap(n => n.activeControls).reduce((acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
    }, {});
    
    for (const note of playedNotes) {
        if (!pitches.has(note.finalNote)) pitches.set(note.finalNote, []);
        pitches.get(note.finalNote).push(note);
    }

    const stringIdsToOmit = new Set();
    
    for (const unisonGroup of pitches.values()) {
        if (unisonGroup.length > 1) {
            const scoredNotes = unisonGroup.map(note => {
                let efficiencyScore = 1; 
                const isEngaged = note.activeControls.length > 0;
                if (isEngaged) {
                    const isEfficient = note.activeControls.some(controlId => controlCounts[controlId] > 1);
                    if (isEfficient) efficiencyScore = 3; 
                } else {
                    efficiencyScore = 2; 
                }

                const otherUnisonIds = unisonGroup.filter(n => n.stringId !== note.stringId).map(n => n.stringId);
                const potentialVoicingIds = playedNotes.filter(n => !otherUnisonIds.includes(n.stringId)).map(n => n.stringId);
                const compactnessScore = 100 - calculateMaxGap(potentialVoicingIds);
                const positionScore = 100 - note.stringId;

                return { note, scores: { efficiency: efficiencyScore, compactness: compactnessScore, position: positionScore } };
            });

            scoredNotes.sort((a, b) => {
                if (a.scores.efficiency !== b.scores.efficiency) return b.scores.efficiency - a.scores.efficiency;
                if (a.scores.compactness !== b.scores.compactness) return b.scores.compactness - a.scores.compactness;
                return b.scores.position - a.scores.position;
            });
            
            for (let i = 1; i < scoredNotes.length; i++) {
                stringIdsToOmit.add(scoredNotes[i].note.stringId);
            }
        }
    }
    
    if (stringIdsToOmit.size === 0) return notesInVoicing;

    return notesInVoicing.map(note => {
        if (stringIdsToOmit.has(note.stringId)) {
            return { ...note, isPlayedInVoicing: false, isChordTone: false };
        }
        return note;
    });
}

export const findChordVoicings = (copedent, rootNoteWithOctave, chordIntervalsToSearch, N, hasFullAccess, omitUnisons = false) => {
  const foundVoicings = [];
  
  // Both Basic and Pro tiers now get full copedent access for chord calculations
  let tierCopedent = copedent;

  const allCombinedControlSets = generateAllCombinations(tierCopedent);
  
  const excludedControlSets = tierCopedent.detectedSplits
      .filter(split => split.isIncludedInCalculation !== 'include')
      .map(split => split.conflictingControls.map(c => c.id).sort());

  const validControlSets = allCombinedControlSets.filter(combo => {
      const currentComboBaseIds = [...combo.pedals, ...combo.levers, ...combo.mecs].map(id => id.split('-')[0]).sort();
      return !excludedControlSets.some(excludedSet => 
          excludedSet.length === currentComboBaseIds.length && 
          excludedSet.every((id, index) => id === currentComboBaseIds[index])
      );
  });
  
  const chordTargetSemitones = new Set(chordIntervalsToSearch.map(interval => interval % 12));
  const fullChordIntervals = CHORD_TYPES[Object.keys(CHORD_TYPES).find(key => JSON.stringify(CHORD_TYPES[key]) === JSON.stringify(chordIntervalsToSearch))] || chordIntervalsToSearch;

  for (let fret = 0; fret <= 11; fret++) {
    let voicingsAtThisFret = [];
    for (const combo of validControlSets) {
      const currentStringNotesWithFlags = calculateFrettedNotesWithEffects(tierCopedent.strings, tierCopedent, combo.pedals, combo.levers, combo.mecs, rootNoteWithOctave, fret);
      
      let notesInVoicing = [];
      currentStringNotesWithFlags.forEach(stringNote => {
        if (stringNote.isMuted) {
          notesInVoicing.push({ ...stringNote, isChordTone: false, isPlayedInVoicing: false });
          return;
        }
        const intervalClass = (stringNote.semitonesFromRoot % 12 + 12) % 12;
        const isCurrentNoteChordTone = stringNote.semitonesFromRoot !== null && chordTargetSemitones.has(intervalClass);
        notesInVoicing.push({ ...stringNote, isChordTone: isCurrentNoteChordTone, isPlayedInVoicing: isCurrentNoteChordTone });
      });

      let finalNotesForVoicing = notesInVoicing;
      if (omitUnisons) {
          finalNotesForVoicing = transformUnisons(notesInVoicing);
      }
      
      const finalPlayedNotes = finalNotesForVoicing.filter(n => n.isPlayedInVoicing);
      const finalFoundTones = new Set(finalPlayedNotes.map(n => (n.semitonesFromRoot % 12 + 12) % 12));

      if ([...chordTargetSemitones].every(tone => finalFoundTones.has(tone)) && finalPlayedNotes.length > 0) {
            const playedStringIds = finalPlayedNotes.map(n => n.stringId).sort((a, b) => a - b);
            let largestBlockSize = 0;
            if (playedStringIds.length > 0) {
                largestBlockSize = 1; let currentBlockSize = 1;
                for (let i = 1; i < playedStringIds.length; i++) {
                    if (playedStringIds[i] === playedStringIds[i-1] + 1) currentBlockSize++;
                    else {
                        if (currentBlockSize > largestBlockSize) largestBlockSize = currentBlockSize;
                        currentBlockSize = 1;
                    }
                }
                if (currentBlockSize > largestBlockSize) largestBlockSize = currentBlockSize;
            }

            const playedIntervals = [...finalFoundTones];
            const parentScale = findParentScale(rootNoteWithOctave, playedIntervals, fullChordIntervals);

            voicingsAtThisFret.push({
                fret, 
                pedalCombo: combo.pedals, 
                leverCombo: combo.levers,
                mecCombo: combo.mecs, 
                notes: finalNotesForVoicing,
                parentScale,
                score: { largestBlockSize, usableStrings: finalPlayedNotes.length, easeOfPlay: combo.pedals.length + combo.levers.length + combo.mecs.length }
            });
      }
    }

    voicingsAtThisFret.sort((a, b) => {
        if (b.score.largestBlockSize !== a.score.largestBlockSize) return b.score.largestBlockSize - a.score.largestBlockSize;
        if (b.score.usableStrings !== a.score.usableStrings) return b.score.usableStrings - a.score.usableStrings;
        return a.score.easeOfPlay - b.score.easeOfPlay;
    });

    let filteredBySuperset = [];
    for (const currentVoicing of voicingsAtThisFret) {
        const currentControls = new Set([...currentVoicing.pedalCombo, ...currentVoicing.leverCombo, ...currentVoicing.mecCombo]);
        let isInferiorSuperset = false;
        for (const acceptedVoicing of filteredBySuperset) {
            const acceptedControls = new Set([...acceptedVoicing.pedalCombo, ...acceptedVoicing.leverCombo, ...acceptedVoicing.mecCombo]);
            if (currentControls.size > acceptedControls.size && [...acceptedControls].every(c => currentControls.has(c))) {
                isInferiorSuperset = true;
                break;
            }
        }
        if (!isInferiorSuperset) {
            filteredBySuperset.push(currentVoicing);
        }
    }

    const uniqueVoicings = [];
    const seenVoicings = new Set();
    for (const voicing of filteredBySuperset) {
      const playedNotesKey = voicing.notes.filter(n => n.isPlayedInVoicing).map(n => `${n.stringId}:${n.finalNote}`).sort().join('|');
      if (!seenVoicings.has(playedNotesKey)) {
          seenVoicings.add(playedNotesKey);
          uniqueVoicings.push(voicing);
      }
    }

    foundVoicings.push(...uniqueVoicings.slice(0, N));
  }
  return foundVoicings;
};

const getChordDisplayName = (root, chordName, playedIntervals, fullChordIntervals) => {
    const rootName = root.replace(/\d+$/, '');
    const fullSet = new Set(fullChordIntervals.map(i => i % 12));
    const playedSet = new Set(playedIntervals);
    const missingSet = new Set([...fullSet].filter(i => !playedSet.has(i)));

    const hasIdeal7th = fullSet.has(10) || fullSet.has(11);
    const is7thMissing = (fullSet.has(10) && missingSet.has(10)) || (fullSet.has(11) && missingSet.has(11));
    const hasPlayedExtensions = [...playedSet].some(i => [1, 2, 5, 6, 9].includes(i));
    
    if (hasIdeal7th && is7thMissing && hasPlayedExtensions) {
        let baseName = chordName.replace(/13|11|9|7/g, '').trim();
        if (baseName === 'Dominant' || baseName === 'Major') baseName = 'Major';
        else if (baseName.includes('Minor')) baseName = 'Minor';
        else baseName = '';

        const highestPlayedExtension = Math.max(...[...playedSet].filter(i => i !== 0 && i !== 3 && i !== 4 && i !== 7 && i !== 8));
        const addNoteName = getContextualIntervalName(highestPlayedExtension, chordName);
        
        const otherMissingNotes = [...missingSet].filter(i => i !== 10 && i !== 11);
        let finalName = `${rootName} ${baseName} (add ${addNoteName})`;

        if (otherMissingNotes.length > 0) {
            const noPart = `no ${otherMissingNotes.map(mi => getContextualIntervalName(mi, chordName)).join(', ')}`;
            finalName += ` (${noPart})`;
        }
        return finalName.replace(/\s+/g, ' ').trim();
    }

    if (missingSet.size > 0) {
        const missingNames = [...missingSet].map(mi => getContextualIntervalName(mi, chordName));
        return `${rootName} ${chordName} (no ${missingNames.join(', ')})`;
    }

    return `${rootName} ${chordName}`;
};

export const decipherChord = (copedent, fret, playedStringIds, pedalIds, leverIds, mechanismIds = []) => {
  const allNotesWithInfo = calculateFrettedNotesWithEffects(copedent.strings, copedent, pedalIds, leverIds, mechanismIds, 'C4', fret);
  const playedNotesWithInfo = allNotesWithInfo.filter(n => playedStringIds.includes(n.stringId) && n.finalNote);
  const uniquePlayedNotes = [...new Set(playedNotesWithInfo.map(n => n.finalNote))];
  if (uniquePlayedNotes.length < 3) return [];
  
  const lowestNote = uniquePlayedNotes.sort((a, b) => getSemitonesBetween('C0', a) - getSemitonesBetween('C0', b))[0];
  const baseOctave = parseInt(lowestNote.match(/\d+/)[0], 10);

  const allInterpretations = [];

  for (const rootChromatic of CHROMATIC_SCALE_SHARPS) {
    const root = `${rootChromatic}${baseOctave}`;
    for (const [chordName, fullChordIntervals] of Object.entries(CHORD_TYPES)) {
      const playedIntervals = uniquePlayedNotes.map(note => (getSemitonesBetween(root, note) % 12 + 12) % 12);
      const playedIntervalSet = new Set(playedIntervals);
      const fullIntervalSet = new Set(fullChordIntervals.map(i => i % 12));

      if (![...playedIntervalSet].every(i => fullIntervalSet.has(i))) continue;
      
      const hasMajor3 = playedIntervalSet.has(4);
      const hasMinor3 = playedIntervalSet.has(3);
      if ( (fullIntervalSet.has(4) && hasMinor3) || (fullIntervalSet.has(3) && hasMajor3) ) continue;
      if ( (fullIntervalSet.has(10) && playedIntervalSet.has(11)) || (fullIntervalSet.has(11) && playedIntervalSet.has(10)) ) continue;

      let score = (playedIntervalSet.size / fullIntervalSet.size) * 1000;
      
      const has3rd = hasMajor3 || hasMinor3;
      const has7th = playedIntervalSet.has(10) || playedIntervalSet.has(11);
      
      if (has3rd && has7th) score += 150; 
      if (has3rd) score += 75;
      if (has7th) score += 50;
      if (playedIntervalSet.has(0)) score += 25;

      if ((fullIntervalSet.has(3) || fullIntervalSet.has(4)) && !has3rd) score -= 150;
      if ((fullIntervalSet.has(10) || fullIntervalSet.has(11)) && !has7th) score -= 100;
      
      const nameContainsTension = /9|11|13/.test(chordName);
      const nameContainsAlteration = /b5|#5|b9|#9|#11|b13/.test(chordName);
      if (nameContainsTension || nameContainsAlteration) {
        const definingTensions = [...fullIntervalSet].filter(i => i !== 0 && i !== 3 && i !== 4 && i !== 7 && i !== 10 && i !== 11);
        const missingDefiningTension = definingTensions.some(t => !playedIntervalSet.has(t));
        if (missingDefiningTension) {
            score -= 250;
        }
      }
      
      score -= fullIntervalSet.size * 5;

      allInterpretations.push({ root, chordName, fullChordIntervals, playedIntervals: [...playedIntervalSet], score });
    }
  }
  
  const bestInterpByRoot = new Map();
  for (const interp of allInterpretations) {
    const rootName = interp.root.replace(/\d+$/, '');
    if (!bestInterpByRoot.has(rootName) || interp.score > bestInterpByRoot.get(rootName).score) {
      bestInterpByRoot.set(rootName, interp);
    }
  }

  const finalInterpretations = Array.from(bestInterpByRoot.values());
  finalInterpretations.sort((a, b) => b.score - a.score);
  
  return finalInterpretations.slice(0, 6).map(bestMatch => {
      const { root, chordName, fullChordIntervals, playedIntervals } = bestMatch;
      
      const chordDisplayName = getChordDisplayName(root, chordName, playedIntervals, fullChordIntervals);

      const voicingNotes = copedent.strings.map(s => {
          const playedNoteInfo = allNotesWithInfo.find(n => n.stringId === s.id);
          const isPlayed = playedStringIds.includes(s.id);
          return { ...playedNoteInfo, isChordTone: isPlayed, isPlayedInVoicing: isPlayed, semitonesFromRoot: isPlayed && playedNoteInfo.finalNote ? getSemitonesBetween(root, playedNoteInfo.finalNote) : null };
      });
      return { chordName: chordDisplayName, fret, pedalCombo: pedalIds, leverCombo: leverIds, mecCombo: mechanismIds, notes: voicingNotes, selectedCopedent: copedent };
  });
};

export const findScaleOnFretboard = (copedent, rootNote, scaleName, activePedals, activeLevers, activeMechanisms = []) => {
    const scaleIntervals = new Set(SCALES[scaleName]);
    if (!scaleIntervals) return [];

    const notesOnFretboard = [];
    const rootWithOctave = `${rootNote}4`;

    for (let fret = 0; fret <= 11; fret++) {
        const notesAtFret = calculateFrettedNotesWithEffects(
            copedent.strings, copedent,
            activePedals, activeLevers, activeMechanisms,
            rootWithOctave, fret
        );

        notesAtFret.forEach(note => {
            if (note.finalNote) {
                const interval = (getSemitonesBetween(rootWithOctave, note.finalNote) % 12 + 12) % 12;
                if (scaleIntervals.has(interval)) {
                    notesOnFretboard.push({
                        fret: fret,
                        stringId: note.stringId,
                        noteName: getScaleNoteEnharmonic(note.finalNote, rootNote, scaleName),
                        intervalName: getScaleIntervalName(interval, scaleName)
                    });
                }
            }
        });
    }
    return notesOnFretboard;
};

export const findScalesForChord = (chordIntervals) => {
    const chordIntervalSet = new Set(chordIntervals.map(i => i % 12));
    const matchingScales = [];
    for (const [scaleName, scaleIntervals] of Object.entries(SCALES)) {
        const scaleIntervalSet = new Set(scaleIntervals);
        if ([...chordIntervalSet].every(i => scaleIntervalSet.has(i))) {
            matchingScales.push(scaleName);
        }
    }
    return matchingScales;
};

export const findVoicingsOnStrings = (copedent, rootNoteWithOctave, chordIntervalsToSearch, stringIdsToUse) => {
  const foundVoicings = [];
  const tierCopedent = copedent;
  const stringsToSearch = tierCopedent.strings.filter(s => stringIdsToUse.includes(s.id));
  if (stringsToSearch.length === 0) {
      return [];
  }

  const allCombinedControlSets = generateAllCombinations(tierCopedent);
  const chordTargetSemitones = new Set(chordIntervalsToSearch.map(interval => interval % 12));

  for (let fret = 0; fret <= 11; fret++) {
    let voicingsAtThisFret = [];

    for (const combo of allCombinedControlSets) {
      const currentStringNotesWithFlags = calculateFrettedNotesWithEffects(stringsToSearch, tierCopedent, combo.pedals, combo.levers, combo.mecs, rootNoteWithOctave, fret);

      const notesInVoicing = currentStringNotesWithFlags.map(stringNote => {
        const intervalClass = (stringNote.semitonesFromRoot % 12 + 12) % 12;
        const isCurrentNoteChordTone = stringNote.semitonesFromRoot !== null && !stringNote.isMuted && chordTargetSemitones.has(intervalClass);
        return { ...stringNote, isChordTone: isCurrentNoteChordTone, isPlayedInVoicing: isCurrentNoteChordTone };
      });

      const finalPlayedNotes = notesInVoicing.filter(n => n.isPlayedInVoicing);
      const finalFoundTones = new Set(finalPlayedNotes.map(n => (n.semitonesFromRoot % 12 + 12) % 12));

      if ([...chordTargetSemitones].every(tone => finalFoundTones.has(tone)) && finalPlayedNotes.length > 0) {
        // SCORING LOGIC STARTS HERE
        const playedStringIds = finalPlayedNotes.map(n => n.stringId).sort((a, b) => a - b);
        let largestBlockSize = 0;
        if (playedStringIds.length > 0) {
            largestBlockSize = 1; let currentBlockSize = 1;
            for (let i = 1; i < playedStringIds.length; i++) {
                if (playedStringIds[i] === playedStringIds[i-1] + 1) currentBlockSize++;
                else {
                    if (currentBlockSize > largestBlockSize) largestBlockSize = currentBlockSize;
                    currentBlockSize = 1;
                }
            }
            if (currentBlockSize > largestBlockSize) largestBlockSize = currentBlockSize;
        }

        voicingsAtThisFret.push({
            fret, 
            pedalCombo: combo.pedals, 
            leverCombo: combo.levers,
            mecCombo: combo.mecs, 
            notes: notesInVoicing,
            score: { 
              largestBlockSize, 
              usableStrings: finalPlayedNotes.length, 
              easeOfPlay: combo.pedals.length + combo.levers.length + combo.mecs.length 
            }
        });
      }
    }

    // SORTING AND FILTERING FOR THIS FRET
    if (voicingsAtThisFret.length > 0) {
      voicingsAtThisFret.sort((a, b) => {
          // Prioritize using more of the selected strings
          if (b.score.usableStrings !== a.score.usableStrings) return b.score.usableStrings - a.score.usableStrings;
          // Then prioritize simpler pedal/lever combinations
          if (a.score.easeOfPlay !== b.score.easeOfPlay) return a.score.easeOfPlay - b.score.easeOfPlay;
          // Then prioritize more compact string blocks
          return b.score.largestBlockSize - a.score.largestBlockSize;
      });

      // Filter out inferior superset voicings (e.g., P1+P2 if P1 does the same job)
      let filteredBySuperset = [];
      for (const currentVoicing of voicingsAtThisFret) {
          const currentControls = new Set([...currentVoicing.pedalCombo, ...currentVoicing.leverCombo, ...currentVoicing.mecCombo]);
          let isInferiorSuperset = false;
          for (const acceptedVoicing of filteredBySuperset) {
              const acceptedControls = new Set([...acceptedVoicing.pedalCombo, ...acceptedVoicing.leverCombo, ...acceptedVoicing.mecCombo]);
              if (currentControls.size > acceptedControls.size && [...acceptedControls].every(c => currentControls.has(c))) {
                  isInferiorSuperset = true;
                  break;
              }
          }
          if (!isInferiorSuperset) {
              filteredBySuperset.push(currentVoicing);
          }
      }

      // Filter out identical voicings (same notes)
      const uniqueVoicings = [];
      const seenVoicings = new Set();
      for (const voicing of filteredBySuperset) {
        const playedNotesKey = voicing.notes.filter(n => n.isPlayedInVoicing).map(n => `${n.stringId}:${n.finalNote}`).sort().join('|');
        if (!seenVoicings.has(playedNotesKey)) {
            seenVoicings.add(playedNotesKey);
            uniqueVoicings.push(voicing);
        }
      }

      // Add only the single best result for this fret
      if (uniqueVoicings.length > 0) {
        foundVoicings.push(uniqueVoicings[0]);
      }
    }
  }
  return foundVoicings;
};

export const findChordTypeByIntervals = (intervals) => {
  const sortedInputIntervals = [...intervals].sort((a, b) => a - b);
  const sortedChordTypes = Object.entries(CHORD_TYPES).sort(([, a_intervals], [, b_intervals]) => a_intervals.length - b_intervals.length);

  for (const [name, chordIntervals] of sortedChordTypes) {
    const sortedChordIntervals = [...chordIntervals].sort((a, b) => a - b);
    if (sortedInputIntervals.length === sortedChordIntervals.length && sortedInputIntervals.every((val, index) => val === sortedChordIntervals[index])) {
      return name;
    }
  }
  
  return null;
};

/**
 * Cached version of findChordVoicings for performance optimization
 * Automatically caches results to prevent redundant calculations of identical chords
 */
export const findChordVoicingsWithCache = (copedent, rootNoteWithOctave, chordIntervalsToSearch, N, hasFullAccess, omitUnisons = false) => {
  // Extract root note for cache key (remove octave)
  const root = rootNoteWithOctave.replace(/\d+$/, '');
  
  // Try to get cached result first
  const cachedResult = chordCache.get(
    copedent.id,
    root,
    'intervals', // We use 'intervals' as type since we're searching by intervals, not chord name
    chordIntervalsToSearch,
    N,
    hasFullAccess
  );
  
  if (cachedResult) {
    // Cache hit - return cached voicings
    return cachedResult;
  }
  
  // Cache miss - calculate voicings using original function
  const voicings = findChordVoicings(copedent, rootNoteWithOctave, chordIntervalsToSearch, N, hasFullAccess, omitUnisons);
  
  // Store result in cache for future use
  chordCache.set(
    copedent.id,
    root,
    'intervals',
    chordIntervalsToSearch,
    N,
    hasFullAccess,
    voicings
  );
  
  return voicings;
};

/**
 * Clear chord cache when copedent changes
 */
export const clearChordCacheForCopedent = (copedentId) => {
  return chordCache.clearByCopedent(copedentId);
};

/**
 * Get chord cache statistics for performance monitoring
 */
export const getChordCacheStats = () => {
  return chordCache.getStats();
};

/**
 * Clear entire chord cache
 */
export const clearEntireChordCache = () => {
  return chordCache.clearAll();
};