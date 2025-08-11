// src/logic/VoiceLeading.js

import { findChordVoicingsWithCache } from './ChordCalculator';
import { CHORD_TYPES } from '../data/DefaultChordTypes';
import { getSemitonesBetween } from './NoteUtils';

/**
 * Calculates the "cost" of transitioning between two voicings.
 * A lower cost signifies a smoother, more economical transition.
 * The cost is a weighted sum of fret movement, individual note movement (voice leading),
 * and the number of control changes (pedals/levers).
 *
 * @param {object} voicingA - The starting voicing object.
 * @param {object} voicingB - The destination voicing object.
 * @param {object} directionalHints - User preferences for cost weights and direction.
 * @returns {number} The calculated numerical cost.
 */
function calculateTransitionCost(voicingA, voicingB, directionalHints = {}) {
  if (!voicingA || !voicingB) return 0; // No cost if a voicing is at the start/end
  let cost = 0;

  // Get cost weights from directional hints, with fallbacks to defaults
  const costWeights = directionalHints.costWeights || {
    fretMovement: 10,
    controlChanges: 5,
    voiceLeading: 1.5
  };

  // 1. Fret Movement Cost - now uses user-adjustable weight with directional preferences
  const fretDifference = Math.abs(voicingA.fret - voicingB.fret);
  let fretCost = fretDifference * costWeights.fretMovement;
  
  // Apply directional preferences to bias the cost
  const globalDirection = directionalHints.globalDirection || 'mixed';
  const fretMovement = voicingB.fret - voicingA.fret; // Positive = ascending, negative = descending
  
  let directionPenalty = 1;
  // Handle both globalDirection format ('ascending') and per-chord format ('up')
  const normalizedDirection = globalDirection === 'up' ? 'ascending' : 
                             globalDirection === 'down' ? 'descending' : 
                             globalDirection;
  
  if (normalizedDirection === 'ascending' && fretMovement < 0) {
    directionPenalty = 10000; // EXTREME penalty for descending movement when ascending preferred
  } else if (normalizedDirection === 'descending' && fretMovement > 0) {
    directionPenalty = 10000; // EXTREME penalty for ascending movement when descending preferred  
  } else if (normalizedDirection === 'minimal' && fretDifference > 0) {
    directionPenalty = 20000; // EXTREME penalty for any movement when minimal preferred
  }
  
  fretCost *= directionPenalty;
  cost += fretCost;
  
  // Debug log for first few transitions
  if (Math.random() < 0.1) { // Only log 10% of calculations to avoid spam
    console.log(`🔍 Cost calc: ${voicingA.fret}→${voicingB.fret}, direction: ${globalDirection}→${normalizedDirection}, movement: ${fretMovement}, penalty: ${directionPenalty}x, final cost: ${cost.toFixed(1)}`);
  }

  // 2. Control Change Cost - now uses user-adjustable weight
  const controlsA = new Set([...voicingA.pedalCombo, ...voicingA.leverCombo, ...voicingA.mecCombo]);
  const controlsB = new Set([...voicingB.pedalCombo, ...voicingB.leverCombo, ...voicingB.mecCombo]);
  const symmetricDifference = new Set([...controlsA].filter(x => !controlsB.has(x)).concat([...controlsB].filter(x => !controlsA.has(x))));
  cost += symmetricDifference.size * costWeights.controlChanges;

  // 3. Voice Leading Cost - now uses user-adjustable weight
  let totalNoteMovement = 0;
  for (let i = 0; i < voicingA.notes.length; i++) {
    const noteA = voicingA.notes[i];
    const noteB = voicingB.notes[i];
    if (noteA.isPlayedInVoicing && noteB.isPlayedInVoicing && noteA.finalNote && noteB.finalNote) {
      totalNoteMovement += Math.abs(getSemitonesBetween(noteA.finalNote, noteB.finalNote));
    }
  }
  cost += totalNoteMovement * costWeights.voiceLeading;

  return cost;
}

/**
 * Calculates the optimal path through a chord progression to ensure smooth voice leading.
 *
 * @param {object} copedent - The current copedent.
 * @param {Array<object>} progression - An array of chord objects, e.g., [{ root: 'C', type: 'Major Triad' }].
 * @param {number[]} stringIdsToUse - The specific strings the user has selected.
 * @param {object} directionalHints - Future use for 'ascending'/'descending' hints. (Not implemented yet)
 * @param {boolean} hasFullAccess - Whether to use full copedent access (default: true).
 * @returns {object} An object indicating success or failure, with the path or error details.
 */
export const calculateOptimalProgression = (copedent, progression, stringIdsToUse, directionalHints, hasFullAccess = true, resultsPerFret = 10) => {
  console.log('🎯 Starting optimization with directionalHints:', directionalHints);
  
  // Step 1: Generate all possible voicings for each step in the progression.
  const voicingsByStep = progression.map((chord, index) => {
    const chordIntervals = CHORD_TYPES[chord.type];
    if (!chordIntervals) return [];
    const rootNoteWithOctave = `${chord.root}4`;
    // Use the same function as regular chord finding with user's chosen resultsPerFret
    // Both Basic and Pro tiers get full copedent access
    const voicings = findChordVoicingsWithCache(copedent, rootNoteWithOctave, chordIntervals, resultsPerFret, true);
    console.log(`🎵 Chord ${index} (${chord.root} ${chord.type}): Found ${voicings.length} voicing options`);
    
    // Debug: Show all available fret positions for this chord
    const frets = voicings.map(v => v.fret).sort((a, b) => a - b);
    console.log(`   Available frets: ${frets.join(', ')}`);
    
    return voicings.map(v => ({ ...v, chordName: `${chord.root} ${chord.type}` }));
  });

  // Check for failure and return detailed information
  const failedStepIndex = voicingsByStep.findIndex(stepVoicings => stepVoicings.length === 0);
  if (failedStepIndex !== -1) {
    return {
      success: false,
      failedChordIndex: failedStepIndex,
      failedChord: progression[failedStepIndex]
    };
  }

  // Step 2: Use dynamic programming (Viterbi-like algorithm) to find the smoothest path.
  const numSteps = voicingsByStep.length;
  const dp = [];
  const path = [];

  // Debug: Show first chord options
  console.log('🎯 FIRST CHORD OPTIONS:');
  voicingsByStep[0].forEach((voicing, i) => {
    console.log(`  Option ${i}: fret ${voicing.fret}, pedals: ${voicing.pedalCombo.join(',') || 'none'}`);
  });

  dp[0] = voicingsByStep[0].map(() => 0);
  path[0] = [];

  for (let i = 1; i < numSteps; i++) {
    dp[i] = [];
    path[i] = [];
    for (let j = 0; j < voicingsByStep[i].length; j++) {
      let minCost = Infinity;
      let bestPrevIndex = -1;
      for (let k = 0; k < voicingsByStep[i - 1].length; k++) {
        // Apply per-chord directional hints if specified
        const currentChordIndex = i;
        const perChordDirection = directionalHints.perChord?.[currentChordIndex];
        
        // Create enhanced directional hints for this specific transition
        const enhancedHints = {
          ...directionalHints,
          globalDirection: perChordDirection || directionalHints.globalDirection
        };
        
        // Debug per-chord direction overrides
        if (perChordDirection && Math.random() < 0.1) {
          console.log(`🎯 Per-chord override for chord ${currentChordIndex}: ${perChordDirection} (overriding global: ${directionalHints.globalDirection})`);
        }
        
        const cost = dp[i - 1][k] + calculateTransitionCost(voicingsByStep[i - 1][k], voicingsByStep[i][j], enhancedHints);
        
        // TEMPORARY TEST: Force higher frets by preferring higher fret numbers
        const currentFret = voicingsByStep[i][j].fret;
        const testCost = cost - (currentFret * 1000); // Huge bonus for higher frets
        
        if (testCost < minCost) {
          minCost = testCost;
          bestPrevIndex = k;
        }
      }
      dp[i][j] = minCost;
      path[i][j] = bestPrevIndex;
    }
  }

  // Step 3: Backtrack from the end to find the optimal path.
  let bestLastIndex = -1;
  let minTotalCost = Infinity;
  const lastStepIndex = numSteps - 1;
  
  console.log('🎯 FINAL COSTS for last chord:');
  for (let j = 0; j < dp[lastStepIndex].length; j++) {
    const finalVoicing = voicingsByStep[lastStepIndex][j];
    console.log(`  Option ${j}: fret ${finalVoicing.fret}, total cost: ${dp[lastStepIndex][j].toFixed(1)}`);
    if (dp[lastStepIndex][j] < minTotalCost) {
      minTotalCost = dp[lastStepIndex][j];
      bestLastIndex = j;
    }
  }
  console.log(`🏆 WINNER: Option ${bestLastIndex} with cost ${minTotalCost.toFixed(1)}`);

  if (bestLastIndex === -1) {
      // This case should be rare, but indicates a path could not be formed.
      return { success: false, failedChordIndex: -1, failedChord: null };
  }

  const optimalPath = [];
  let currentIndex = bestLastIndex;
  for (let i = lastStepIndex; i >= 0; i--) {
    optimalPath.unshift(voicingsByStep[i][currentIndex]);
    currentIndex = path[i][currentIndex];
  }

  // Debug: Show what was selected
  console.log('🎯 OPTIMIZATION RESULT:');
  optimalPath.forEach((voicing, index) => {
    console.log(`  Chord ${index}: ${voicing.chordName} at fret ${voicing.fret}, pedals: ${voicing.pedalCombo.join(',') || 'none'}`);
  });

  // Return a success object with the path
  return { success: true, path: optimalPath };
};


/**
 * Finds and ranks alternative voicings for a specific step in a progression.
 */
export const findAlternativeVoicings = (previousVoicing, nextVoicing, chordToReplace, currentVoicing, copedent, stringIdsToUse, hasFullAccess = true, directionalHints, resultsPerFret = 10) => {
  const chordIntervals = CHORD_TYPES[chordToReplace.type];
  if (!chordIntervals) return [];
  
  const rootNoteWithOctave = `${chordToReplace.root}4`;
  // Use the same function as regular chord finding with user's chosen resultsPerFret
  // Both Basic and Pro tiers get full copedent access
  const allPossibleVoicings = findChordVoicingsWithCache(copedent, rootNoteWithOctave, chordIntervals, resultsPerFret, true);

  const scoredAlternatives = allPossibleVoicings.map(altVoicing => {
    const namedAltVoicing = { ...altVoicing, chordName: `${chordToReplace.root} ${chordToReplace.type}` };
    const costIn = calculateTransitionCost(previousVoicing, namedAltVoicing, directionalHints);
    const costOut = calculateTransitionCost(namedAltVoicing, nextVoicing, directionalHints);
    const totalCost = costIn + costOut;

    return { ...namedAltVoicing, score: totalCost };
  });

  scoredAlternatives.sort((a, b) => a.score - b.score);

  return scoredAlternatives;
};