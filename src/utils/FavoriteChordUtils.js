// src/utils/FavoriteChordUtils.js

/**
 * Favorite Chord Utilities
 * Core logic functions for managing favorite chord voicings
 * Provides root-independent storage and cross-mode compatibility
 */

import { loadFavoriteChordList, addFavoriteChord, removeFavoriteChord } from './FavoriteChordStorage';

/**
 * Extract chord type from full chord name (removes root note)
 * @param {string} chordName - Full chord name like "C Major Triad" or "F# Dominant 7 (no P5)"
 * @returns {string} Chord type like "Major Triad" or "Dominant 7 (no P5)"
 */
const extractChordTypeFromName = (chordName) => {
  if (!chordName) return '';
  
  // Remove root note from beginning of chord name
  // Handles: "C Major", "C# Major", "Db Major", "C𝄫 Major", etc.
  const rootNotePattern = /^[A-G][#♯b♭𝄫𝄪]*\s*/;
  return chordName.replace(rootNotePattern, '').trim();
};

/**
 * Generate unique identifier for a favorite chord
 * Root-independent: excludes fret position to work with any root note
 * @param {string} chordType - Original chord type name
 * @param {Object} combo - Pedal/lever/mechanism combination
 * @param {Object} modifications - Interval filters and color state changes
 * @returns {string} Unique hash identifier
 */
export const generateFavoriteId = (chordType, combo, modifications = {}) => {
  const idComponents = {
    chordType: chordType, // Always use root-independent chord type for ID
    pedalCombo: (combo.pedalCombo || []).slice().sort(), // Sort for consistency
    leverCombo: (combo.leverCombo || []).slice().sort(),
    mecCombo: (combo.mecCombo || []).slice().sort(),
    intervalFilters: modifications.intervalFilters || [],
    colorStates: modifications.colorStates || {}
    // NOTE: Deliberately excluding fret and filteredChordName for root independence
  };
  
  try {
    // Create deterministic hash using base64 encoding
    const jsonString = JSON.stringify(idComponents);
    const hash = btoa(jsonString).replace(/[^a-zA-Z0-9]/g, '');
    return hash;
  } catch (error) {
    console.error('Error generating favorite ID:', error);
    // Fallback to timestamp-based ID if hashing fails
    return `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

/**
 * Check if a chord is marked as favorite
 * @param {string} copedentId - ID of current copedent
 * @param {Object} chordData - Chord voicing data to check
 * @returns {boolean} True if chord is favorited
 */
export const isFavoriteChord = (copedentId, chordData) => {
  try {
    const favoritesList = loadFavoriteChordList(copedentId);
    if (!favoritesList || !favoritesList.favorites) return false;
    
    const chordId = generateFavoriteId(
      chordData.selectedChordType || extractChordTypeFromName(chordData.chordName),
      {
        pedalCombo: chordData.pedalCombo || [],
        leverCombo: chordData.leverCombo || [],
        mecCombo: chordData.mecCombo || []
      },
      {
        filteredChordName: chordData.chordName,
        intervalFilters: chordData.intervalFilters,
        colorStates: chordData.colorStates
      }
    );
    
    return favoritesList.favorites.some(fav => fav.id === chordId);
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
};

/**
 * Toggle favorite status of a chord
 * @param {string} copedentId - ID of current copedent
 * @param {Object} chordData - Chord voicing data to toggle
 * @param {Object} copedentInfo - Additional copedent information
 * @returns {Object} Result with success status and new favorite state
 */
export const toggleFavoriteStatus = (copedentId, chordData, copedentInfo = {}) => {
  try {
    const isCurrentlyFavorite = isFavoriteChord(copedentId, chordData);
    
    if (isCurrentlyFavorite) {
      // Remove from favorites
      const chordId = generateFavoriteId(
        chordData.selectedChordType || extractChordTypeFromName(chordData.chordName),
        {
          pedalCombo: chordData.pedalCombo || [],
          leverCombo: chordData.leverCombo || [],
          mecCombo: chordData.mecCombo || []
        },
        {
          filteredChordName: chordData.chordName,
          intervalFilters: chordData.intervalFilters,
          colorStates: chordData.colorStates
        }
      );
      
      const success = removeFavoriteChord(copedentId, chordId);
      return {
        success,
        isFavorite: false,
        action: 'removed'
      };
    } else {
      // Add to favorites
      const favoriteData = createFavoriteFromVoicing(chordData, copedentInfo);
      const success = addFavoriteChord(copedentId, favoriteData, copedentInfo);
      return {
        success,
        isFavorite: true,
        action: 'added'
      };
    }
  } catch (error) {
    console.error('Error toggling favorite status:', error);
    return {
      success: false,
      isFavorite: isFavoriteChord(copedentId, chordData),
      action: 'error',
      error: error.message
    };
  }
};

/**
 * Get all favorite chords for a specific chord type
 * @param {string} copedentId - ID of current copedent
 * @param {string} chordType - Chord type to filter by
 * @returns {Array} Array of favorite chord objects
 */
export const getFavoritesForChordType = (copedentId, chordType) => {
  try {
    const favoritesList = loadFavoriteChordList(copedentId);
    if (!favoritesList || !favoritesList.favorites) return [];
    
    return favoritesList.favorites.filter(favorite => {
      // Match both original and filtered chord names
      return favorite.chordType === chordType || 
             favorite.filteredChordName === chordType;
    });
  } catch (error) {
    console.error('Error getting favorites for chord type:', error);
    return [];
  }
};

/**
 * Validate that chord data has required fields for favoriting
 * @param {Object} chordData - Chord voicing data to validate
 * @returns {Object} Validation result with success and missing fields
 */
export const validateChordForFavoriting = (chordData) => {
  const requiredFields = ['pedalCombo', 'leverCombo', 'mecCombo'];
  const missingFields = [];
  
  // Check for required combination data
  requiredFields.forEach(field => {
    if (!chordData[field]) {
      missingFields.push(field);
    }
  });
  
  // Must have some chord identification
  if (!chordData.chordName && !chordData.selectedChordType) {
    missingFields.push('chordName or selectedChordType');
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
    hasRequiredData: chordData.hasOwnProperty('pedalCombo') && 
                    chordData.hasOwnProperty('leverCombo') && 
                    chordData.hasOwnProperty('mecCombo')
  };
};

/**
 * Create favorite chord object from voicing data
 * @param {Object} voicing - Chord voicing data
 * @param {Object} copedentInfo - Additional copedent context
 * @returns {Object} Favorite chord data structure
 */
export const createFavoriteFromVoicing = (voicing, copedentInfo = {}) => {
  const rootIndependentChordType = voicing.selectedChordType || extractChordTypeFromName(voicing.chordName) || 'Unknown';
  const combo = {
    pedalCombo: voicing.pedalCombo || [],
    leverCombo: voicing.leverCombo || [],
    mecCombo: voicing.mecCombo || []
  };
  
  const modifications = {
    filteredChordName: voicing.chordName,
    intervalFilters: voicing.intervalFilters,
    colorStates: voicing.colorStates
  };
  
  return {
    id: generateFavoriteId(rootIndependentChordType, combo, modifications),
    chordType: rootIndependentChordType, // Root-independent chord type
    // fret: REMOVED - root-independent system doesn't store fret
    pedalCombo: combo.pedalCombo,
    leverCombo: combo.leverCombo,
    mecCombo: combo.mecCombo,
    stringsUsed: voicing.strings ? voicing.strings.map((_, index) => index + 1) : [],
    intervalFilters: modifications.intervalFilters || [],
    filteredChordName: modifications.filteredChordName || rootIndependentChordType,
    colorStates: modifications.colorStates || {},
    dateAdded: new Date().toISOString(),
    userNotes: ''
    // Removed originalVoicing - truly root-independent storage
    // C reference fret is calculated dynamically when needed
  };
};

/**
 * Get count of favorites for current copedent
 * @param {string} copedentId - ID of current copedent
 * @returns {number} Total number of favorite chords
 */
export const getFavoriteCount = (copedentId) => {
  try {
    const favoritesList = loadFavoriteChordList(copedentId);
    return favoritesList && favoritesList.favorites ? favoritesList.favorites.length : 0;
  } catch (error) {
    console.error('Error getting favorite count:', error);
    return 0;
  }
};

/**
 * Check if any favorites exist for copedent
 * @param {string} copedentId - ID of current copedent
 * @returns {boolean} True if any favorites exist
 */
export const hasFavorites = (copedentId) => {
  return getFavoriteCount(copedentId) > 0;
};