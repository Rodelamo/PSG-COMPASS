// src/utils/FavoriteChordStorage.js

/**
 * Favorite Chord Storage Utility
 * Handles saving and loading favorite chord collections using localStorage
 * Follows same patterns as existing copedent and VL file storage
 */

export const FAVORITE_CHORD_VERSION = "1.0";
export const FAVORITE_CHORD_STORAGE_KEY = "favoriteChords";

/**
 * Create empty favorite chord list structure
 * @param {string} copedentId - ID of the copedent
 * @param {string} copedentName - Name of the copedent
 * @returns {Object} Empty favorite chord list structure
 */
const createEmptyFavoriteList = (copedentId, copedentName) => ({
  copedentId,
  copedentName,
  isActive: true,
  favorites: [],
  metadata: {
    name: `${copedentName} Favorites`,
    description: `Favorite chord voicings for ${copedentName}`,
    dateCreated: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    totalCount: 0
  },
  version: FAVORITE_CHORD_VERSION
});

/**
 * Load all favorite chord collections from localStorage
 * @returns {Object} All favorite chord collections indexed by copedentId
 */
export const loadAllFavoriteChordCollections = () => {
  try {
    const saved = localStorage.getItem(FAVORITE_CHORD_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error("Error parsing favorite chords from localStorage:", error);
    return {};
  }
};

/**
 * Save all favorite chord collections to localStorage
 * @param {Object} collections - All collections indexed by copedentId
 */
export const saveAllFavoriteChordCollections = (collections) => {
  try {
    localStorage.setItem(FAVORITE_CHORD_STORAGE_KEY, JSON.stringify(collections));
  } catch (error) {
    console.error("Error saving favorite chords to localStorage:", error);
    throw new Error("Failed to save favorite chords to storage");
  }
};

/**
 * Load favorite chord list for specific copedent
 * @param {string} copedentId - ID of the copedent
 * @returns {Object|null} Favorite chord list or null if not found
 */
export const loadFavoriteChordList = (copedentId) => {
  try {
    const allCollections = loadAllFavoriteChordCollections();
    return allCollections[copedentId] || null;
  } catch (error) {
    console.error(`Error loading favorite chord list for copedent ${copedentId}:`, error);
    return null;
  }
};

/**
 * Save favorite chord list for specific copedent
 * @param {string} copedentId - ID of the copedent
 * @param {Object} listData - Complete favorite chord list data
 * @returns {boolean} Success status
 */
export const saveFavoriteChordList = (copedentId, listData) => {
  try {
    const allCollections = loadAllFavoriteChordCollections();
    
    // Update metadata
    listData.metadata.lastModified = new Date().toISOString();
    listData.metadata.totalCount = listData.favorites ? listData.favorites.length : 0;
    
    allCollections[copedentId] = listData;
    saveAllFavoriteChordCollections(allCollections);
    return true;
  } catch (error) {
    console.error(`Error saving favorite chord list for copedent ${copedentId}:`, error);
    return false;
  }
};

/**
 * Add a favorite chord to copedent's collection
 * @param {string} copedentId - ID of the copedent
 * @param {Object} favoriteData - Favorite chord data to add
 * @param {Object} copedentInfo - Additional copedent context
 * @returns {boolean} Success status
 */
export const addFavoriteChord = (copedentId, favoriteData, copedentInfo = {}) => {
  try {
    let favoritesList = loadFavoriteChordList(copedentId);
    
    // Create new collection if it doesn't exist
    if (!favoritesList) {
      const copedentName = copedentInfo.name || copedentInfo.copedentName || `Copedent ${copedentId}`;
      favoritesList = createEmptyFavoriteList(copedentId, copedentName);
    }
    
    // Check if favorite already exists (prevent duplicates)
    const existingIndex = favoritesList.favorites.findIndex(fav => fav.id === favoriteData.id);
    if (existingIndex !== -1) {
      // Update existing favorite with new data
      favoritesList.favorites[existingIndex] = {
        ...favoritesList.favorites[existingIndex],
        ...favoriteData,
        dateAdded: favoritesList.favorites[existingIndex].dateAdded, // Keep original date
        dateModified: new Date().toISOString()
      };
    } else {
      // Add new favorite
      favoritesList.favorites.push(favoriteData);
    }
    
    return saveFavoriteChordList(copedentId, favoritesList);
  } catch (error) {
    console.error(`Error adding favorite chord to copedent ${copedentId}:`, error);
    return false;
  }
};

/**
 * Remove a favorite chord from copedent's collection
 * @param {string} copedentId - ID of the copedent
 * @param {string} favoriteId - ID of the favorite chord to remove
 * @returns {boolean} Success status
 */
export const removeFavoriteChord = (copedentId, favoriteId) => {
  try {
    const favoritesList = loadFavoriteChordList(copedentId);
    if (!favoritesList || !favoritesList.favorites) {
      return false; // Nothing to remove
    }
    
    const originalCount = favoritesList.favorites.length;
    favoritesList.favorites = favoritesList.favorites.filter(fav => fav.id !== favoriteId);
    
    // Check if anything was removed
    const removedCount = originalCount - favoritesList.favorites.length;
    if (removedCount > 0) {
      return saveFavoriteChordList(copedentId, favoritesList);
    }
    
    return false; // Nothing was removed
  } catch (error) {
    console.error(`Error removing favorite chord ${favoriteId} from copedent ${copedentId}:`, error);
    return false;
  }
};

/**
 * Get all active favorite chord collections
 * @returns {Array} Array of active favorite chord collections
 */
export const getAllActiveFavoriteCollections = () => {
  try {
    const allCollections = loadAllFavoriteChordCollections();
    return Object.values(allCollections).filter(collection => collection.isActive);
  } catch (error) {
    console.error("Error getting active favorite collections:", error);
    return [];
  }
};

/**
 * Get all inactive favorite chord collections (missing copedent dependencies)
 * @returns {Array} Array of inactive favorite chord collections
 */
export const getAllInactiveFavoriteCollections = () => {
  try {
    const allCollections = loadAllFavoriteChordCollections();
    return Object.values(allCollections).filter(collection => !collection.isActive);
  } catch (error) {
    console.error("Error getting inactive favorite collections:", error);
    return [];
  }
};

/**
 * Mark favorite collection as active or inactive
 * @param {string} copedentId - ID of the copedent
 * @param {boolean} isActive - New active status
 * @returns {boolean} Success status
 */
export const markListActive = (copedentId, isActive) => {
  try {
    const favoritesList = loadFavoriteChordList(copedentId);
    if (!favoritesList) return false;
    
    favoritesList.isActive = isActive;
    return saveFavoriteChordList(copedentId, favoritesList);
  } catch (error) {
    console.error(`Error marking favorite list ${copedentId} as ${isActive ? 'active' : 'inactive'}:`, error);
    return false;
  }
};

/**
 * Delete entire favorite collection for copedent
 * @param {string} copedentId - ID of the copedent
 * @returns {boolean} Success status
 */
export const deleteFavoriteCollection = (copedentId) => {
  try {
    const allCollections = loadAllFavoriteChordCollections();
    
    if (allCollections[copedentId]) {
      delete allCollections[copedentId];
      saveAllFavoriteChordCollections(allCollections);
      return true;
    }
    
    return false; // Collection didn't exist
  } catch (error) {
    console.error(`Error deleting favorite collection for copedent ${copedentId}:`, error);
    return false;
  }
};

/**
 * Export favorite chord collection to JSON format
 * @param {string} copedentId - ID of the copedent
 * @returns {Object|null} Exportable favorite chord data
 */
export const exportFavoriteChordList = (copedentId) => {
  try {
    const favoritesList = loadFavoriteChordList(copedentId);
    if (!favoritesList) return null;
    
    return {
      fileType: "favorite-chord-collection",
      version: FAVORITE_CHORD_VERSION,
      timestamp: new Date().toISOString(),
      ...favoritesList
    };
  } catch (error) {
    console.error(`Error exporting favorite chord list for copedent ${copedentId}:`, error);
    return null;
  }
};

/**
 * Import favorite chord collection from JSON data
 * @param {Object} fileData - Imported favorite chord data
 * @param {boolean} additive - Whether to merge with existing favorites
 * @returns {Object} Import result with status and statistics
 */
export const importFavoriteChordList = (fileData, additive = true) => {
  try {
    // Validate file structure
    if (!fileData.copedentId || !fileData.favorites || !Array.isArray(fileData.favorites)) {
      return {
        success: false,
        error: "Invalid favorite chord file format",
        imported: 0,
        duplicatesSkipped: 0
      };
    }
    
    const copedentId = fileData.copedentId;
    let result = {
      success: true,
      imported: 0,
      duplicatesSkipped: 0,
      totalCount: 0,
      isActive: true
    };
    
    if (additive) {
      // Merge with existing favorites
      const existingList = loadFavoriteChordList(copedentId) || 
                          createEmptyFavoriteList(copedentId, fileData.copedentName);
      
      const existingIds = new Set(existingList.favorites.map(fav => fav.id));
      
      fileData.favorites.forEach(favorite => {
        if (existingIds.has(favorite.id)) {
          result.duplicatesSkipped++;
        } else {
          existingList.favorites.push(favorite);
          result.imported++;
        }
      });
      
      result.totalCount = existingList.favorites.length;
      saveFavoriteChordList(copedentId, existingList);
      
    } else {
      // Replace existing collection
      result.imported = fileData.favorites.length;
      result.totalCount = fileData.favorites.length;
      saveFavoriteChordList(copedentId, fileData);
    }
    
    return result;
    
  } catch (error) {
    console.error("Error importing favorite chord list:", error);
    return {
      success: false,
      error: error.message,
      imported: 0,
      duplicatesSkipped: 0
    };
  }
};

/**
 * Get statistics for favorite chord collection
 * @param {string} copedentId - ID of the copedent
 * @returns {Object} Statistics about the collection
 */
export const getFavoriteChordStats = (copedentId) => {
  try {
    const favoritesList = loadFavoriteChordList(copedentId);
    if (!favoritesList || !favoritesList.favorites) {
      return {
        totalCount: 0,
        chordTypes: {},
        recentlyAdded: []
      };
    }
    
    const chordTypes = {};
    const recentlyAdded = [];
    
    favoritesList.favorites.forEach(favorite => {
      // Count by chord type
      const chordType = favorite.filteredChordName || favorite.chordType;
      chordTypes[chordType] = (chordTypes[chordType] || 0) + 1;
      
      // Track recent additions (last 7 days)
      const dateAdded = new Date(favorite.dateAdded);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (dateAdded > weekAgo) {
        recentlyAdded.push(favorite);
      }
    });
    
    return {
      totalCount: favoritesList.favorites.length,
      chordTypes,
      recentlyAdded: recentlyAdded.sort((a, b) => 
        new Date(b.dateAdded) - new Date(a.dateAdded)
      )
    };
    
  } catch (error) {
    console.error(`Error getting favorite chord stats for copedent ${copedentId}:`, error);
    return {
      totalCount: 0,
      chordTypes: {},
      recentlyAdded: []
    };
  }
};

// ============================================================================
// MULTI-CUSTOMIZATION OPERATIONS (Version 2.0)
// ============================================================================

/**
 * Add a customization to an existing favorite chord
 * @param {string} copedentId - ID of the copedent
 * @param {string} favoriteId - ID of the favorite chord
 * @param {Object} customizationData - Customization data to add
 * @returns {boolean} Success status
 */
export const addCustomizationToFavorite = (copedentId, favoriteId, customizationData) => {
  try {
    const favoritesList = loadFavoriteChordList(copedentId);
    if (!favoritesList || !favoritesList.favorites) return { success: false, error: 'storage_load_error' };
    
    const favoriteIndex = favoritesList.favorites.findIndex(fav => fav.id === favoriteId);
    if (favoriteIndex === -1) return { success: false, error: 'favorite_not_found' };
    
    const favorite = favoritesList.favorites[favoriteIndex];
    
    // Initialize customizations array if it doesn't exist (backward compatibility)
    if (!favorite.customizations) {
      favorite.customizations = [];
    }
    
    // Check if we're at the limit (5 customizations max)
    if (favorite.customizations.length >= 5) return { success: false, error: 'limit_reached' };
    
    // Check for duplicate names
    const existingNames = favorite.customizations.map(c => c.name.toLowerCase());
    if (existingNames.includes(customizationData.name.toLowerCase())) {
      return { success: false, error: 'duplicate_name' };
    }
    
    // Check for duplicate color states (same grey notes)
    const newColorStatesKey = JSON.stringify(Object.keys(customizationData.colorStates || {}).sort());
    const duplicateColorStates = favorite.customizations.some(c => {
      const existingColorStatesKey = JSON.stringify(Object.keys(c.colorStates || {}).sort());
      return existingColorStatesKey === newColorStatesKey;
    });
    
    if (duplicateColorStates) {
      return { success: false, error: 'duplicate_notes' };
    }
    
    // Generate new customization ID
    const newId = favorite.customizations.length > 0 
      ? Math.max(...favorite.customizations.map(c => c.id || 0)) + 1 
      : 1;
    
    const newCustomization = {
      id: newId,
      name: customizationData.name || `Customization ${newId}`,
      description: customizationData.description || `Custom chord voicing`,
      colorStates: customizationData.colorStates || {},
      mutedStrings: customizationData.mutedStrings || Object.keys(customizationData.colorStates || {}).map(s => parseInt(s)),
      dateCreated: new Date().toISOString(),
      isActive: true,
      ...customizationData
    };
    
    favorite.customizations.push(newCustomization);
    
    // Update metadata
    favorite.hasCustomizations = true;
    favorite.customizationCount = favorite.customizations.length;
    favorite.version = "2.0";
    favorite.lastModified = new Date().toISOString();
    
    const saveSuccess = saveFavoriteChordList(copedentId, favoritesList);
    return { success: saveSuccess, error: saveSuccess ? null : 'storage_error' };
    
  } catch (error) {
    console.error(`Error adding customization to favorite ${favoriteId}:`, error);
    return { success: false, error: 'system_error' };
  }
};

/**
 * Remove a customization from a favorite chord
 * @param {string} copedentId - ID of the copedent
 * @param {string} favoriteId - ID of the favorite chord
 * @param {number} customizationId - ID of the customization to remove
 * @returns {boolean} Success status
 */
export const removeCustomizationFromFavorite = (copedentId, favoriteId, customizationId) => {
  try {
    const favoritesList = loadFavoriteChordList(copedentId);
    if (!favoritesList || !favoritesList.favorites) return false;
    
    const favoriteIndex = favoritesList.favorites.findIndex(fav => fav.id === favoriteId);
    if (favoriteIndex === -1) return false;
    
    const favorite = favoritesList.favorites[favoriteIndex];
    if (!favorite.customizations) return false;
    
    const originalCount = favorite.customizations.length;
    favorite.customizations = favorite.customizations.filter(c => c.id !== customizationId);
    
    if (favorite.customizations.length === originalCount) return false; // Nothing removed
    
    // Update metadata
    favorite.customizationCount = favorite.customizations.length;
    favorite.hasCustomizations = favorite.customizations.length > 0;
    favorite.lastModified = new Date().toISOString();
    
    // Reset current customization if it was deleted
    if (favorite.currentCustomization === customizationId) {
      favorite.currentCustomization = 0; // Default
    }
    
    return saveFavoriteChordList(copedentId, favoritesList);
    
  } catch (error) {
    console.error(`Error removing customization ${customizationId} from favorite ${favoriteId}:`, error);
    return false;
  }
};

/**
 * Update an existing customization
 * @param {string} copedentId - ID of the copedent
 * @param {string} favoriteId - ID of the favorite chord
 * @param {number} customizationId - ID of the customization to update
 * @param {Object} updates - Updates to apply
 * @returns {boolean} Success status
 */
export const updateFavoriteCustomization = (copedentId, favoriteId, customizationId, updates) => {
  try {
    const favoritesList = loadFavoriteChordList(copedentId);
    if (!favoritesList || !favoritesList.favorites) return false;
    
    const favoriteIndex = favoritesList.favorites.findIndex(fav => fav.id === favoriteId);
    if (favoriteIndex === -1) return false;
    
    const favorite = favoritesList.favorites[favoriteIndex];
    if (!favorite.customizations) return false;
    
    const customizationIndex = favorite.customizations.findIndex(c => c.id === customizationId);
    if (customizationIndex === -1) return false;
    
    // Apply updates
    favorite.customizations[customizationIndex] = {
      ...favorite.customizations[customizationIndex],
      ...updates,
      id: customizationId, // Preserve ID
      dateModified: new Date().toISOString()
    };
    
    favorite.lastModified = new Date().toISOString();
    
    return saveFavoriteChordList(copedentId, favoritesList);
    
  } catch (error) {
    console.error(`Error updating customization ${customizationId}:`, error);
    return false;
  }
};

/**
 * Set the current active customization for a favorite
 * @param {string} copedentId - ID of the copedent
 * @param {string} favoriteId - ID of the favorite chord
 * @param {number} customizationId - ID of customization to set as current (0 = default)
 * @returns {boolean} Success status
 */
export const setCurrentCustomization = (copedentId, favoriteId, customizationId) => {
  try {
    const favoritesList = loadFavoriteChordList(copedentId);
    if (!favoritesList || !favoritesList.favorites) return false;
    
    const favoriteIndex = favoritesList.favorites.findIndex(fav => fav.id === favoriteId);
    if (favoriteIndex === -1) return false;
    
    const favorite = favoritesList.favorites[favoriteIndex];
    
    // Validate customization exists (or is 0 for default)
    if (customizationId !== 0 && (!favorite.customizations || 
        !favorite.customizations.some(c => c.id === customizationId))) {
      return false;
    }
    
    favorite.currentCustomization = customizationId;
    favorite.lastModified = new Date().toISOString();
    
    return saveFavoriteChordList(copedentId, favoritesList);
    
  } catch (error) {
    console.error(`Error setting current customization ${customizationId}:`, error);
    return false;
  }
};

/**
 * Get a specific customization by ID
 * @param {string} copedentId - ID of the copedent
 * @param {string} favoriteId - ID of the favorite chord
 * @param {number} customizationId - ID of the customization
 * @returns {Object|null} Customization object or null if not found
 */
export const getCustomizationById = (copedentId, favoriteId, customizationId) => {
  try {
    const favoritesList = loadFavoriteChordList(copedentId);
    if (!favoritesList || !favoritesList.favorites) return null;
    
    const favorite = favoritesList.favorites.find(fav => fav.id === favoriteId);
    if (!favorite || !favorite.customizations) return null;
    
    if (customizationId === 0) {
      // Return default customization info
      return {
        id: 0,
        name: 'Default',
        description: 'Original chord without customizations',
        colorStates: {},
        mutedStrings: [],
        isDefault: true
      };
    }
    
    return favorite.customizations.find(c => c.id === customizationId) || null;
    
  } catch (error) {
    console.error(`Error getting customization ${customizationId}:`, error);
    return null;
  }
};

/**
 * Get all customizations for a favorite chord
 * @param {string} copedentId - ID of the copedent
 * @param {string} favoriteId - ID of the favorite chord
 * @returns {Array} Array of customizations including default (id: 0)
 */
export const getAllCustomizations = (copedentId, favoriteId) => {
  try {
    const favoritesList = loadFavoriteChordList(copedentId);
    if (!favoritesList || !favoritesList.favorites) return [];
    
    const favorite = favoritesList.favorites.find(fav => fav.id === favoriteId);
    if (!favorite) return [];
    
    const customizations = [
      {
        id: 0,
        name: 'Default',
        description: 'Original chord without customizations',
        colorStates: {},
        mutedStrings: [],
        isDefault: true
      }
    ];
    
    if (favorite.customizations && favorite.customizations.length > 0) {
      customizations.push(...favorite.customizations);
    }
    
    return customizations;
    
  } catch (error) {
    console.error(`Error getting all customizations for favorite ${favoriteId}:`, error);
    return [];
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a description for a customization based on its data
 * @param {Object} customizationData - Customization data
 * @returns {string} Generated description
 */
function generateCustomizationDescription(customizationData) {
  if (customizationData.description) return customizationData.description;
  
  const mutedStrings = extractMutedStrings(customizationData.colorStates || {});
  if (mutedStrings.length > 0) {
    const count = mutedStrings.length;
    const stringList = mutedStrings.sort((a, b) => a - b).join(', ');
    return `${count} string${count > 1 ? 's' : ''} muted (${stringList})`;
  }
  
  return 'Custom chord voicing';
}

/**
 * Extract muted strings from color states
 * @param {Object} colorStates - Color state data
 * @returns {Array} Array of muted string numbers
 */
function extractMutedStrings(colorStates) {
  const mutedStrings = [];
  
  Object.keys(colorStates).forEach(stringNumber => {
    const state = colorStates[stringNumber];
    if (state && (state.currentState === 'grey' || state.currentState === 'gray')) {
      mutedStrings.push(parseInt(stringNumber));
    }
  });
  
  return mutedStrings.sort((a, b) => a - b);
}

/**
 * Generate smart customization name based on chord data and color states
 * @param {Object} colorStates - Current color states
 * @param {Object} chordData - Original chord data
 * @returns {string} Suggested name
 */
export const generateSmartCustomizationName = (colorStates, chordData) => {
  const mutedStrings = extractMutedStrings(colorStates);
  const totalStrings = chordData?.strings?.length || 10;
  const playedStrings = totalStrings - mutedStrings.length;
  
  if (mutedStrings.length === 0) {
    return 'Full Voicing';
  }
  
  if (mutedStrings.length === 1) {
    return `String ${mutedStrings[0]} Muted`;
  }
  
  if (mutedStrings.length === 2) {
    return `Strings ${mutedStrings.join(', ')} Muted`;
  }
  
  if (playedStrings <= 3) {
    return 'Minimal Voicing';
  }
  
  if (playedStrings <= 5) {
    return 'Sparse Voicing';
  }
  
  // Check for bass/treble patterns
  const lowStrings = mutedStrings.filter(s => s <= 5);
  const highStrings = mutedStrings.filter(s => s > 5);
  
  if (lowStrings.length > 0 && highStrings.length === 0) {
    return 'Treble Focus';
  }
  
  if (highStrings.length > 0 && lowStrings.length === 0) {
    return 'Bass Focus';
  }
  
  return `${mutedStrings.length} Strings Muted`;
};