// src/utils/ChordFormatting.js

import { convertChordToSymbol } from './ChordSymbols';
import { convertToConventionalName } from './ChordNaming';

/**
 * Centralized chord name formatting utility
 * Handles both string and object chord inputs
 * Consolidates duplicate formatChordName functions from ProgressionTablature.js and MeasureGrid.js
 */

/**
 * Format chord name for display, handling both input formats
 * @param {string|object} chord - Either a chord string "C Major Triad" or chord object {root: "C", type: "Major Triad"}
 * @param {boolean} useSymbols - Whether to use musical symbols (♭, ♯, etc.)
 * @returns {string} Formatted chord name
 */
export const formatChordName = (chord, useSymbols = false) => {
  if (!chord) return '';
  
  let chordObj;
  
  // Handle string input (from ProgressionTablature.js pattern)
  if (typeof chord === 'string') {
    // Parse chordName string into chord object
    const parts = chord.split(' ');
    const root = parts[0];
    const type = parts.slice(1).join(' ');
    chordObj = { root, type };
  } 
  // Handle object input (from MeasureGrid.js pattern)
  else if (typeof chord === 'object' && chord.root && chord.type !== undefined) {
    chordObj = chord;
  }
  // Invalid input
  else {
    console.warn('formatChordName: Invalid chord input:', chord);
    return '';
  }
  
  // Apply formatting based on symbol preference
  if (useSymbols) {
    return convertChordToSymbol(chordObj);
  }
  return convertToConventionalName(chordObj);
};

/**
 * Legacy wrapper for backward compatibility
 * @deprecated Use formatChordName directly
 */
export const formatChordDisplay = formatChordName;