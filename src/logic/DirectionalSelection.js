// src/logic/DirectionalSelection.js

/**
 * Find the nearest available voicing to a target fret from alternatives array
 * @param {Array} alternatives - Available chord voicings
 * @param {number} targetFret - Desired fret position
 * @returns {Object|null} Nearest voicing or null if no alternatives
 */
export const findNearestVoicing = (alternatives, targetFret) => {
  if (!alternatives || alternatives.length === 0) return null;
  
  let nearestVoicing = alternatives[0];
  let nearestDistance = Math.abs(alternatives[0].fret - targetFret);
  
  for (const voicing of alternatives) {
    const distance = Math.abs(voicing.fret - targetFret);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestVoicing = voicing;
    }
  }
  
  return nearestVoicing;
};

/**
 * Calculate target fret for UP direction with range looping
 * @param {number} currentFret - Current fret position
 * @param {number} jumpSize - Size of jump
 * @param {Array} fretRange - [min, max] fret range
 * @returns {number} Target fret position
 */
export const calculateUpTarget = (currentFret, jumpSize, fretRange) => {
  const [minFret, maxFret] = fretRange;
  const rangeSize = maxFret - minFret + 1;
  
  if (jumpSize === 0) return currentFret; // Stay close
  
  const targetFret = currentFret + jumpSize;
  
  if (targetFret <= maxFret) {
    return targetFret;
  }
  
  // Loop back to beginning of range
  const overflow = targetFret - maxFret;
  return minFret + ((overflow - 1) % rangeSize);
};

/**
 * Calculate target fret for DOWN direction with range looping
 * @param {number} currentFret - Current fret position  
 * @param {number} jumpSize - Size of jump
 * @param {Array} fretRange - [min, max] fret range
 * @returns {number} Target fret position
 */
export const calculateDownTarget = (currentFret, jumpSize, fretRange) => {
  const [minFret, maxFret] = fretRange;
  const rangeSize = maxFret - minFret + 1;
  
  if (jumpSize === 0) return currentFret; // Stay close
  
  const targetFret = currentFret - jumpSize;
  
  if (targetFret >= minFret) {
    return targetFret;
  }
  
  // Loop back to end of range
  const underflow = minFret - targetFret;
  return maxFret - ((underflow - 1) % rangeSize);
};

/**
 * Calculate target fret for ZIG-ZAG directions with bouncing
 * @param {number} currentFret - Current fret position
 * @param {number} jumpSize - Size of jump
 * @param {Array} fretRange - [min, max] fret range
 * @param {boolean} goingUp - Current direction (true=up, false=down)
 * @returns {Object} {targetFret, newDirection}
 */
export const calculateZigZagTarget = (currentFret, jumpSize, fretRange, goingUp) => {
  const [minFret, maxFret] = fretRange;
  
  if (jumpSize === 0) return { targetFret: currentFret, newDirection: goingUp };
  
  let targetFret;
  let newDirection = goingUp;
  
  if (goingUp) {
    targetFret = currentFret + jumpSize;
    if (targetFret > maxFret) {
      // Hit ceiling, bounce down
      const overshoot = targetFret - maxFret;
      targetFret = maxFret - overshoot;
      newDirection = false;
      
      // Ensure we don't go below minimum
      if (targetFret < minFret) {
        targetFret = minFret;
      }
    }
  } else {
    targetFret = currentFret - jumpSize;
    if (targetFret < minFret) {
      // Hit floor, bounce up
      const undershoot = minFret - targetFret;
      targetFret = minFret + undershoot;
      newDirection = true;
      
      // Ensure we don't go above maximum
      if (targetFret > maxFret) {
        targetFret = maxFret;
      }
    }
  }
  
  return { targetFret, newDirection };
};

/**
 * Calculate random target fret within range
 * @param {Array} fretRange - [min, max] fret range
 * @param {number} maxJump - Maximum jump size (from jump slider)
 * @param {number} currentFret - Current fret (optional, for bounded randomness)
 * @returns {number} Random target fret
 */
export const calculateRandomTarget = (fretRange, maxJump = 11, currentFret = null) => {
  const [minFret, maxFret] = fretRange;
  
  if (currentFret !== null && maxJump > 0) {
    // Bounded randomness around current fret
    const jumpDirection = Math.random() < 0.5 ? -1 : 1;
    const jumpSize = Math.floor(Math.random() * (maxJump + 1));
    const targetFret = currentFret + (jumpDirection * jumpSize);
    
    // Clamp to range
    return Math.max(minFret, Math.min(maxFret, targetFret));
  }
  
  // Full range randomness
  return Math.floor(Math.random() * (maxFret - minFret + 1)) + minFret;
};

/**
 * Apply directional selection to chord progression
 * @param {Array} alternativesByStep - Available voicings for each chord
 * @param {string} direction - Direction type ('up', 'down', 'zigzag-up', 'zigzag-down', 'random')
 * @param {Object} settings - {fretStart, fretRange, jumpSize}
 * @param {Array} lockedVoicings - Array of locked chord indices
 * @returns {Array} Selected chord voicings
 */
export const applyDirectionalSelection = (alternativesByStep, direction, settings, lockedVoicings = []) => {
  if (!alternativesByStep || alternativesByStep.length === 0) return [];
  
  const { fretStart, fretRange, jumpSize } = settings;
  const results = [];
  let currentFret = fretStart;
  let zigzagDirection = direction === 'zigzag-up'; // true=up, false=down
  
  console.log(`🎯 APPLYING DIRECTIONAL SELECTION: ${direction.toUpperCase()}`);
  console.log(`   Settings: Start=${fretStart}, Range=${fretRange[0]}-${fretRange[1]}, Jump=${jumpSize}`);
  console.log(`   Locked chords: [${lockedVoicings.join(', ')}]`);
  
  for (let chordIndex = 0; chordIndex < alternativesByStep.length; chordIndex++) {
    const alternatives = alternativesByStep[chordIndex];
    
    if (!alternatives || alternatives.length === 0) {
      console.log(`   Chord ${chordIndex}: No alternatives available`);
      continue;
    }
    
    // Skip locked chords - keep their current voicing
    if (lockedVoicings.includes(chordIndex)) {
      console.log(`   Chord ${chordIndex}: LOCKED - keeping current voicing`);
      // Find current voicing from alternatives (first one as fallback)
      results.push(alternatives[0]);
      continue;
    }
    
    let targetFret;
    
    // Calculate target fret based on direction
    switch (direction) {
      case 'up':
        targetFret = calculateUpTarget(currentFret, jumpSize, fretRange);
        break;
        
      case 'down':
        targetFret = calculateDownTarget(currentFret, jumpSize, fretRange);
        break;
        
      case 'zigzag-up':
      case 'zigzag-down':
        const zigResult = calculateZigZagTarget(currentFret, jumpSize, fretRange, zigzagDirection);
        targetFret = zigResult.targetFret;
        zigzagDirection = zigResult.newDirection;
        break;
        
      case 'random':
        targetFret = calculateRandomTarget(fretRange, jumpSize, currentFret);
        break;
        
      default:
        targetFret = currentFret; // Fallback
    }
    
    // Find nearest available voicing to target fret
    const selectedVoicing = findNearestVoicing(alternatives, targetFret);
    
    if (selectedVoicing) {
      results.push(selectedVoicing);
      currentFret = selectedVoicing.fret; // Update current fret for next iteration
      
      console.log(`   Chord ${chordIndex}: Target F-${targetFret} → Selected F-${selectedVoicing.fret} (${selectedVoicing.pedalCombo?.join('+') || 'none'})`);
    } else {
      console.log(`   Chord ${chordIndex}: No voicing found for target F-${targetFret}`);
    }
  }
  
  return results;
};