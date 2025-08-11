// src/logic/VoiceLeadingManager.js

/**
 * Voice Leading Management utilities for VoiceLeader component
 * Extracted from VoiceLeader.js to improve maintainability and reusability
 */

/**
 * Optimize chord progression using existing calculated alternatives
 * This maintains the alternativesByStep structure for continued editing
 * @param {Array} alternativesByStep - Pre-calculated alternatives for each chord
 * @param {Object} directionalHints - User optimization preferences
 * @param {Array} currentResults - Current chord selections
 * @param {Array} lockedVoicings - Array of locked chord indices (optional)
 * @returns {Array} Optimized chord selections from existing alternatives
 */
export const optimizeFromExistingAlternatives = (alternativesByStep, directionalHints, currentResults, lockedVoicings = []) => {
  if (!alternativesByStep || alternativesByStep.length < 2) {
    return currentResults; // No optimization possible
  }

  console.log('🎯 OPTIMIZING FROM EXISTING ALTERNATIVES');
  console.log(`🔒 Locked chords: [${lockedVoicings.join(', ')}]`);
  
  // Use dynamic programming to find best path through existing alternatives
  const numChords = alternativesByStep.length;
  const dp = [];
  const path = [];
  
  // Start with current results as basis for locked chords
  let optimalResults = [...currentResults];

  // Initialize first chord
  if (lockedVoicings.includes(0)) {
    // First chord is locked - force it to current selection
    console.log(`  Chord 0: LOCKED - keeping current voicing`);
    const currentVoicingIndex = alternativesByStep[0].findIndex(alt => 
      alt.fret === currentResults[0].fret && 
      JSON.stringify(alt.pedalCombo) === JSON.stringify(currentResults[0].pedalCombo)
    );
    const lockedIndex = currentVoicingIndex >= 0 ? currentVoicingIndex : 0;
    dp[0] = alternativesByStep[0].map((_, index) => index === lockedIndex ? 0 : Infinity);
    path[0] = alternativesByStep[0].map(() => lockedIndex);
  } else {
    // First chord is unlocked - all alternatives have cost 0
    dp[0] = alternativesByStep[0].map(() => 0);
    path[0] = alternativesByStep[0].map((_, index) => index);
  }

  // For each subsequent chord, find the best previous chord to transition from
  for (let chordIndex = 1; chordIndex < numChords; chordIndex++) {
    dp[chordIndex] = [];
    path[chordIndex] = [];
    
    const currentAlternatives = alternativesByStep[chordIndex];
    const previousAlternatives = alternativesByStep[chordIndex - 1];
    
    if (lockedVoicings.includes(chordIndex)) {
      // This chord is locked - force it to current selection
      console.log(`  Chord ${chordIndex}: LOCKED - keeping current voicing`);
      const currentVoicingIndex = currentAlternatives.findIndex(alt => 
        alt.fret === currentResults[chordIndex].fret && 
        JSON.stringify(alt.pedalCombo) === JSON.stringify(currentResults[chordIndex].pedalCombo)
      );
      const lockedIndex = currentVoicingIndex >= 0 ? currentVoicingIndex : 0;
      
      // Only allow the locked alternative, block all others
      for (let currentAltIndex = 0; currentAltIndex < currentAlternatives.length; currentAltIndex++) {
        if (currentAltIndex === lockedIndex) {
          // Find best way to reach this locked chord
          let minCost = Infinity;
          let bestPrevIndex = 0;
          
          for (let prevAltIndex = 0; prevAltIndex < previousAlternatives.length; prevAltIndex++) {
            const totalCost = dp[chordIndex - 1][prevAltIndex];
            if (totalCost < minCost) {
              minCost = totalCost;
              bestPrevIndex = prevAltIndex;
            }
          }
          dp[chordIndex][currentAltIndex] = minCost;
          path[chordIndex][currentAltIndex] = bestPrevIndex;
        } else {
          // Block all other alternatives
          dp[chordIndex][currentAltIndex] = Infinity;
          path[chordIndex][currentAltIndex] = 0;
        }
      }
    } else {
      // This chord is unlocked - normal DP optimization
      for (let currentAltIndex = 0; currentAltIndex < currentAlternatives.length; currentAltIndex++) {
        let minCost = Infinity;
        let bestPrevIndex = 0;
        
        const currentVoicing = currentAlternatives[currentAltIndex];
        
        for (let prevAltIndex = 0; prevAltIndex < previousAlternatives.length; prevAltIndex++) {
          const previousVoicing = previousAlternatives[prevAltIndex];
          
          // Skip if previous alternative is blocked (infinite cost)
          if (dp[chordIndex - 1][prevAltIndex] === Infinity) continue;
          
          // Calculate transition cost with reasonable penalties (not extreme)
          const transitionCost = calculateReasonableTransitionCost(
            previousVoicing, 
            currentVoicing, 
            directionalHints,
            chordIndex
          );
          
          const totalCost = dp[chordIndex - 1][prevAltIndex] + transitionCost;
          
          if (totalCost < minCost) {
            minCost = totalCost;
            bestPrevIndex = prevAltIndex;
          }
        }
        
        dp[chordIndex][currentAltIndex] = minCost;
        path[chordIndex][currentAltIndex] = bestPrevIndex;
      }
    }
  }

  // Find the best final chord (minimum cost in last step)
  const finalChordAlternatives = alternativesByStep[numChords - 1];
  let bestFinalIndex = 0;
  let bestFinalCost = dp[numChords - 1][0];
  
  for (let i = 1; i < finalChordAlternatives.length; i++) {
    if (dp[numChords - 1][i] < bestFinalCost) {
      bestFinalCost = dp[numChords - 1][i];
      bestFinalIndex = i;
    }
  }

  // Reconstruct the optimal path
  optimalResults.length = 0; // Clear the existing array
  let currentIndex = bestFinalIndex;
  
  for (let chordIndex = numChords - 1; chordIndex >= 0; chordIndex--) {
    optimalResults[chordIndex] = alternativesByStep[chordIndex][currentIndex];
    if (chordIndex > 0) {
      currentIndex = path[chordIndex][currentIndex];
    }
  }

  console.log('🔍 AFTER OPTIMIZATION:');
  optimalResults.forEach((voicing, index) => {
    console.log(`  Chord ${index}: ${voicing.chordName} at fret ${voicing.fret}, pedals: ${voicing.pedalCombo.join(',') || 'none'}`);
  });

  return optimalResults;
};

/**
 * Calculate reasonable transition cost (not extreme penalties)
 * @param {Object} voicingA - Previous voicing
 * @param {Object} voicingB - Current voicing  
 * @param {Object} directionalHints - User preferences
 * @param {number} chordIndex - Current chord position
 * @returns {number} Reasonable transition cost
 */
export const calculateReasonableTransitionCost = (voicingA, voicingB, directionalHints, chordIndex) => {
  if (!voicingA || !voicingB) return 0;
  
  let cost = 0;
  
  // Get cost weights with reasonable defaults
  const costWeights = directionalHints.costWeights || {
    fretMovement: 10,
    controlChanges: 5,
    voiceLeading: 1.5
  };
  
  // 1. Fret Movement Cost
  const fretDifference = Math.abs(voicingA.fret - voicingB.fret);
  cost += fretDifference * costWeights.fretMovement;
  
  // 2. Control Changes Cost (pedals/levers)
  const controlsA = new Set([...voicingA.pedalCombo, ...voicingA.leverCombo, ...voicingA.mecCombo]);
  const controlsB = new Set([...voicingB.pedalCombo, ...voicingB.leverCombo, ...voicingB.mecCombo]);
  const controlChanges = new Set([...controlsA].filter(x => !controlsB.has(x)).concat([...controlsB].filter(x => !controlsA.has(x))));
  cost += controlChanges.size * costWeights.controlChanges;
  
  // 3. Apply directional preferences with REASONABLE penalties (not extreme)
  const fretMovement = voicingB.fret - voicingA.fret;
  const perChordDirection = directionalHints.perChord?.[chordIndex];
  const effectiveDirection = perChordDirection || directionalHints.globalDirection || 'mixed';
  
  // Apply reasonable directional preferences (penalty, not prohibition)
  if (effectiveDirection === 'up' && fretMovement < 0) {
    cost += 50; // Reasonable penalty for wrong direction
  } else if (effectiveDirection === 'down' && fretMovement > 0) {
    cost += 50; // Reasonable penalty for wrong direction
  } else if (effectiveDirection === 'minimal' && fretDifference > 3) {
    cost += 30; // Encourage staying close, but don't prohibit movement
  }
  
  return cost;
};

/**
 * Calculate quality score for a progression of voicings
 * @param {Array} voicings - Array of chord voicings
 * @param {Function} calculateTransitionCost - Transition cost calculation function
 * @returns {Object} Quality metrics with score, costs, and problem transitions
 */
export const calculateQualityScore = (voicings, calculateTransitionCostFn) => {
  if (!voicings || voicings.length < 2) return { score: 10, costs: [], problems: [] };
  
  const transitionCosts = [];
  let totalCost = 0;
  
  for (let i = 1; i < voicings.length; i++) {
    const cost = calculateTransitionCostFn(voicings[i-1], voicings[i]);
    transitionCosts.push(cost);
    totalCost += cost;
  }
  
  // Convert cost to 0-10 score (lower cost = higher score)
  const averageCost = totalCost / transitionCosts.length;
  const score = Math.max(0, Math.min(10, 10 - (averageCost / 10)));
  
  // Identify problem transitions (cost > 30)
  const problemTransitions = transitionCosts
    .map((cost, index) => ({ index, cost }))
    .filter(t => t.cost > 30)
    .map(t => t.index);
  
  return { score, costs: transitionCosts, problems: problemTransitions };
};

/**
 * Calculate transition cost between two voicings
 * @param {Object} voicingA - First voicing
 * @param {Object} voicingB - Second voicing
 * @param {Object} directionalHints - Cost weight configuration
 * @returns {number} Transition cost value
 */
export const calculateTransitionCost = (voicingA, voicingB, directionalHints) => {
  if (!voicingA || !voicingB) return 0;
  let cost = 0;

  // Fret Movement Cost
  const fretDifference = Math.abs(voicingA.fret - voicingB.fret);
  cost += fretDifference * (directionalHints.costWeights?.fretMovement || 10);

  // Control Change Cost
  const controlsA = new Set([...voicingA.pedalCombo, ...voicingA.leverCombo, ...voicingA.mecCombo]);
  const controlsB = new Set([...voicingB.pedalCombo, ...voicingB.leverCombo, ...voicingB.mecCombo]);
  const symmetricDifference = new Set([...controlsA].filter(x => !controlsB.has(x)).concat([...controlsB].filter(x => !controlsA.has(x))));
  cost += symmetricDifference.size * (directionalHints.costWeights?.controlChanges || 5);

  // Voice Leading Cost (simplified for now)
  cost += Math.random() * (directionalHints.costWeights?.voiceLeading || 1.5);

  return cost;
};

/**
 * Preserve string toggle states from existing voicing to new voicing with chord validation
 * @param {Object} newVoicing - New chord voicing
 * @param {Object} existingVoicing - Existing chord voicing with toggle states
 * @returns {Object} New voicing with preserved toggle states (only if chord remains valid)
 */
export const preserveStringToggleStates = (newVoicing, existingVoicing) => {
  if (!existingVoicing || !existingVoicing.notes || !newVoicing || !newVoicing.notes) {
    return newVoicing;
  }
  
  // Create a map of existing string states
  const existingStringStates = {};
  existingVoicing.notes.forEach(note => {
    if (note && note.stringId !== undefined) {
      existingStringStates[note.stringId] = note.isPlayedInVoicing;
    }
  });
  
  // Apply existing states to new voicing
  const preservedNotes = newVoicing.notes.map(note => {
    if (note && note.stringId !== undefined && existingStringStates.hasOwnProperty(note.stringId)) {
      return {
        ...note,
        isPlayedInVoicing: existingStringStates[note.stringId]
      };
    }
    return note;
  });
  
  // CRITICAL FIX: Validate that preserved states create a valid chord
  const preservedVoicing = {
    ...newVoicing,
    notes: preservedNotes
  };
  
  // Check if preserved voicing has at least some chord tones played
  const playedNotes = preservedNotes.filter(note => note && note.isPlayedInVoicing);
  const hasChordTones = playedNotes.some(note => note.isChordTone);
  
  // If preservation results in no chord tones being played, return original new voicing
  if (!hasChordTones) {
    console.warn('🚨 Preserved states removed all chord tones - using fresh calculation');
    return newVoicing;
  }
  
  // Additional validation: ensure we don't have too many cluster notes
  const nonChordTones = playedNotes.filter(note => !note.isChordTone);
  const chordTones = playedNotes.filter(note => note.isChordTone);
  
  // If we have more non-chord tones than chord tones, something is wrong
  if (nonChordTones.length > chordTones.length) {
    console.warn('🚨 Preserved states created cluster chord - using fresh calculation');
    return newVoicing;
  }
  
  return preservedVoicing;
};

/**
 * Handle auto-optimization of chord progression
 * @param {Object} params - Optimization parameters
 * @returns {Promise<Object>} Optimization result
 */
export const handleAutoOptimize = async ({
  progression,
  selectedCopedent,
  directionalHints,
  results,
  alternativesByStep,
  lockedVoicings, // CRITICAL FIX: Add missing lockedVoicings parameter
  qualityMetrics,
  buildProgressionFromMeasures,
  convertToStringIds,
  showToast,
  setIsOptimizing,
  setAppState
}) => {
  console.log('🚨 AUTO-OPTIMIZE BUTTON CLICKED!');
  
  // Validate that we have alternatives to work with
  if (!alternativesByStep || alternativesByStep.length === 0) {
    showToast('Please calculate the progression first to generate chord alternatives.', 'error');
    return;
  }

  if (results.length < 2) {
    showToast('Please add at least two chords to your progression.', 'error');
    return;
  }

  console.log('🔍 BEFORE OPTIMIZATION:');
  results.forEach((voicing, index) => {
    console.log(`  Chord ${index}: ${voicing.chordName} at fret ${voicing.fret}, pedals: ${voicing.pedalCombo.join(',') || 'none'}`);
  });

  setIsOptimizing(true);
  
  try {
    // Use existing alternatives instead of generating new voicings - RESPECT LOCKS
    const optimizedResults = optimizeFromExistingAlternatives(
      alternativesByStep,
      directionalHints,
      results,
      lockedVoicings // CRITICAL FIX: Pass lockedVoicings to optimization algorithm
    );

    
    // Calculate quality metrics
    const transitionCostFn = (voicingA, voicingB) => calculateTransitionCost(voicingA, voicingB, directionalHints);
    const quality = calculateQualityScore(optimizedResults, transitionCostFn);
    
    // Update state with optimized results (keeping alternativesByStep intact!)
    setAppState(prev => ({
      ...prev,
      results: optimizedResults,
      qualityMetrics: {
        overallScore: quality.score,
        transitionCosts: quality.costs,
        problemTransitions: quality.problems
      },
      voiceLeadingPreferences: {
        ...prev.voiceLeadingPreferences,
        optimizationEnabled: true,
        lastOptimized: Date.now()
      }
    }));

    showToast(`Progression optimized! Quality score: ${quality.score.toFixed(1)}/10`, 'success');
    
  } catch (error) {
    console.error('Optimization error:', error);
    showToast('Error during optimization. Please try again.', 'error');
  } finally {
    setIsOptimizing(false);
  }
};


/**
 * Reset optimization state
 * @param {Function} setAppState - State setter function
 * @param {Function} showToast - Toast notification function
 */
export const handleOptimizationReset = (setAppState, showToast) => {
  setAppState(prev => ({
    ...prev,
    lockedVoicings: [],
    qualityMetrics: {
      overallScore: 0,
      transitionCosts: [],
      problemTransitions: []
    },
    voiceLeadingPreferences: {
      ...prev.voiceLeadingPreferences,
      optimizationEnabled: false
    }
  }));
  showToast('Voice leading optimization reset', 'info');
};

