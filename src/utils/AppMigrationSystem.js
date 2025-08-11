// src/utils/AppMigrationSystem.js

/**
 * Complete App Migration System
 * Handles export and import of ALL user customizations for device migration,
 * sharing custom setups, and backup/restore operations.
 */

import { loadAllFavoriteChordCollections, saveAllFavoriteChordCollections } from './FavoriteChordStorage.js';
import { getSavedVLFiles } from './VLFileStorage.js';

// Migration file constants
export const MIGRATION_VERSION = "1.0";
export const APP_VERSION = "0.1.0";

/**
 * Generate complete app export data by aggregating all user customizations
 * @returns {Promise<Object>} Complete export data structure
 */
export const generateAppExportData = async () => {
  try {
    console.log('🔄 Starting app data aggregation...');
    
    // Get user copedents from localStorage
    const userCopedents = await getUserCopedents();
    
    // Get chord progression files (if implemented)
    const chordProgressions = await getChordProgressions();
    
    // Get Voice Leader files
    const voiceLeaderFiles = await getVoiceLeaderFiles();
    
    // Get favorite chord collections
    const favoriteChords = await getFavoriteChords();
    
    // Get user preferences and settings
    const userPreferences = await getUserPreferences();
    
    // Generate relationship mappings
    const relationships = generateRelationshipMap({
      userCopedents,
      chordProgressions,
      voiceLeaderFiles,
      favoriteChords
    });
    
    const exportData = {
      metadata: {
        exportVersion: MIGRATION_VERSION,
        appVersion: APP_VERSION,
        exportDate: new Date().toISOString(),
        deviceInfo: getDeviceInfo(),
        totalItems: getTotalItemCount({
          userCopedents,
          chordProgressions,
          voiceLeaderFiles,
          favoriteChords,
          userPreferences
        }),
        dataTypes: {
          userCopedents: userCopedents.length,
          chordProgressions: chordProgressions.length,
          voiceLeaderFiles: voiceLeaderFiles.length,
          favoriteChords: Object.keys(favoriteChords).length,
          userPreferences: 1
        }
      },
      userCopedents,
      chordProgressions,
      voiceLeaderFiles,
      favoriteChords,
      userPreferences,
      relationships
    };
    
    console.log(`✅ App data aggregation complete: ${exportData.metadata.totalItems} items`);
    return exportData;
    
  } catch (error) {
    console.error('❌ Error generating app export data:', error);
    throw new Error(`Failed to generate export data: ${error.message}`);
  }
};

/**
 * Create migration file from export data
 * @param {Object} exportData - Complete app export data
 * @returns {Object} Migration file ready for download
 */
export const createMigrationFile = (exportData) => {
  try {
    const migrationFile = {
      ...exportData,
      _migrationFileSignature: 'PSG_APP_MIGRATION_V1'
    };
    
    console.log(`📦 Migration file created: ${JSON.stringify(migrationFile).length} bytes`);
    return migrationFile;
    
  } catch (error) {
    console.error('❌ Error creating migration file:', error);
    throw new Error(`Failed to create migration file: ${error.message}`);
  }
};

/**
 * Validate and import complete app data
 * @param {Object} fileData - Migration file data to import
 * @returns {Promise<Object>} Import result with status and details
 */
export const validateAndImportAppData = async (fileData) => {
  try {
    console.log('🔍 Starting migration file validation...');
    
    // Validate file structure
    const validationResult = validateMigrationFile(fileData);
    if (!validationResult.isValid) {
      return {
        success: false,
        error: validationResult.error,
        details: validationResult.details
      };
    }
    
    // Create backup before import
    console.log('💾 Creating backup before import...');
    const backup = await createBackupBeforeImport();
    
    try {
      // Import each data type
      const importResults = {
        userCopedents: await importUserCopedents(fileData.userCopedents),
        chordProgressions: await importChordProgressions(fileData.chordProgressions),
        voiceLeaderFiles: await importVoiceLeaderFiles(fileData.voiceLeaderFiles),
        favoriteChords: await importFavoriteChords(fileData.favoriteChords),
        userPreferences: await importUserPreferences(fileData.userPreferences)
      };
      
      console.log('✅ App data import completed successfully');
      return {
        success: true,
        backup,
        importResults,
        summary: generateImportSummary(importResults)
      };
      
    } catch (importError) {
      console.error('❌ Import failed, restoring backup...');
      await restoreFromBackup(backup);
      throw importError;
    }
    
  } catch (error) {
    console.error('❌ Error during app data import:', error);
    return {
      success: false,
      error: error.message,
      details: error.stack
    };
  }
};

/**
 * Validate migration file structure and compatibility
 * @param {Object} fileData - Migration file data to validate
 * @returns {Object} Validation result
 */
const validateMigrationFile = (fileData) => {
  try {
    // Check signature
    if (fileData._migrationFileSignature !== 'PSG_APP_MIGRATION_V1') {
      return {
        isValid: false,
        error: 'Invalid migration file format',
        details: 'File signature not recognized'
      };
    }
    
    // Check required structure
    const requiredFields = ['metadata', 'userCopedents', 'favoriteChords'];
    for (const field of requiredFields) {
      if (!fileData.hasOwnProperty(field)) {
        return {
          isValid: false,
          error: `Missing required field: ${field}`,
          details: 'Migration file structure is incomplete'
        };
      }
    }
    
    // Check version compatibility
    if (fileData.metadata.exportVersion !== MIGRATION_VERSION) {
      console.warn(`⚠️ Version mismatch: file v${fileData.metadata.exportVersion}, system v${MIGRATION_VERSION}`);
      // For now, continue with warning - future versions may have compatibility logic
    }
    
    return {
      isValid: true,
      warning: null
    };
    
  } catch (error) {
    return {
      isValid: false,
      error: 'File validation failed',
      details: error.message
    };
  }
};

/**
 * Create backup of current app state before destructive import
 * @returns {Promise<Object>} Backup data
 */
const createBackupBeforeImport = async () => {
  try {
    const backup = {
      timestamp: new Date().toISOString(),
      data: await generateAppExportData()
    };
    
    console.log('📋 Backup created successfully');
    return backup;
    
  } catch (error) {
    console.error('❌ Failed to create backup:', error);
    throw new Error(`Backup creation failed: ${error.message}`);
  }
};

/**
 * Restore app state from backup
 * @param {Object} backup - Backup data to restore
 * @returns {Promise<boolean>} Success status
 */
const restoreFromBackup = async (backup) => {
  try {
    console.log('🔄 Restoring from backup...');
    
    // Restore each data type from backup
    await importUserCopedents(backup.data.userCopedents, { replace: true });
    await importChordProgressions(backup.data.chordProgressions, { replace: true });
    await importVoiceLeaderFiles(backup.data.voiceLeaderFiles, { replace: true });
    await importFavoriteChords(backup.data.favoriteChords, { replace: true });
    await importUserPreferences(backup.data.userPreferences, { replace: true });
    
    console.log('✅ Backup restored successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to restore backup:', error);
    return false;
  }
};

// Data aggregation functions

/**
 * Get user-created copedents from localStorage
 * @returns {Promise<Array>} Array of user copedents
 */
const getUserCopedents = async () => {
  try {
    const savedCopedents = localStorage.getItem('customCopedents');
    return savedCopedents ? JSON.parse(savedCopedents) : [];
  } catch (error) {
    console.error('Error loading user copedents:', error);
    return [];
  }
};

/**
 * Get chord progression files (placeholder for future implementation)
 * @returns {Promise<Array>} Array of CP files
 */
const getChordProgressions = async () => {
  // TODO: Implement when CP file system is added
  return [];
};

/**
 * Get Voice Leader files from VL storage system
 * @returns {Promise<Array>} Array of VL files
 */
const getVoiceLeaderFiles = async () => {
  try {
    // Use existing VL file storage functionality
    return await getSavedVLFiles() || [];
  } catch (error) {
    console.error('Error loading VL files:', error);
    return [];
  }
};

/**
 * Get favorite chord collections from favorite storage system
 * @returns {Promise<Object>} Favorite chords organized by copedent
 */
const getFavoriteChords = async () => {
  try {
    return await loadAllFavoriteChordCollections() || {};
  } catch (error) {
    console.error('Error loading favorite chords:', error);
    return {};
  }
};

/**
 * Get user preferences and app settings
 * @returns {Promise<Object>} User preferences object
 */
const getUserPreferences = async () => {
  try {
    // Collect various app settings from localStorage
    const preferences = {
      tierLevel: localStorage.getItem('userTier') || 'Basic',
      // Add other preference keys as needed
      lastSelectedCopedent: localStorage.getItem('lastSelectedCopedent') || null,
      appSettings: {
        // Collect any other app-specific settings
      }
    };
    
    return preferences;
  } catch (error) {
    console.error('Error loading user preferences:', error);
    return {};
  }
};

// Import functions

/**
 * Import user copedents
 * @param {Array} copedents - User copedents to import
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Import result
 */
const importUserCopedents = async (copedents, options = {}) => {
  try {
    if (!Array.isArray(copedents)) {
      return { success: false, error: 'Invalid copedents data format' };
    }
    
    const existingCopedents = await getUserCopedents();
    let finalCopedents = [...existingCopedents];
    let conflicts = [];
    let imported = 0;
    
    for (const copedent of copedents) {
      const existing = existingCopedents.find(c => c.id === copedent.id || c.name === copedent.name);
      
      if (existing && !options.replace) {
        conflicts.push({
          type: 'copedent',
          name: copedent.name,
          id: copedent.id
        });
      } else {
        if (existing && options.replace) {
          // Replace existing
          const index = finalCopedents.findIndex(c => c.id === copedent.id || c.name === copedent.name);
          finalCopedents[index] = copedent;
        } else {
          // Add new
          finalCopedents.push(copedent);
        }
        imported++;
      }
    }
    
    // Save updated copedents
    localStorage.setItem('customCopedents', JSON.stringify(finalCopedents));
    
    return {
      success: true,
      imported,
      conflicts,
      total: copedents.length
    };
    
  } catch (error) {
    console.error('Error importing user copedents:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Import chord progressions (placeholder)
 * @param {Array} progressions - CP files to import
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Import result
 */
const importChordProgressions = async (progressions, options = {}) => {
  // TODO: Implement when CP system is added
  return {
    success: true,
    imported: 0,
    conflicts: [],
    total: 0
  };
};

/**
 * Import Voice Leader files
 * @param {Array} vlFiles - VL files to import
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Import result
 */
const importVoiceLeaderFiles = async (vlFiles, options = {}) => {
  try {
    if (!Array.isArray(vlFiles)) {
      return { success: false, error: 'Invalid VL files data format' };
    }
    
    // TODO: Implement VL file import when available
    // For now, return success with no imports
    return {
      success: true,
      imported: 0,
      conflicts: [],
      total: vlFiles.length
    };
    
  } catch (error) {
    console.error('Error importing VL files:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Import favorite chord collections
 * @param {Object} favorites - Favorite chords to import
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Import result
 */
const importFavoriteChords = async (favorites, options = {}) => {
  try {
    if (!favorites || typeof favorites !== 'object') {
      return { success: false, error: 'Invalid favorites data format' };
    }
    
    // Use existing favorites save functionality
    await saveAllFavoriteChordCollections(favorites);
    
    return {
      success: true,
      imported: Object.keys(favorites).length,
      conflicts: [],
      total: Object.keys(favorites).length
    };
    
  } catch (error) {
    console.error('Error importing favorite chords:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Import user preferences
 * @param {Object} preferences - User preferences to import
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Import result
 */
const importUserPreferences = async (preferences, options = {}) => {
  try {
    if (!preferences || typeof preferences !== 'object') {
      return { success: false, error: 'Invalid preferences data format' };
    }
    
    // Import preferences to localStorage
    if (preferences.tierLevel) {
      localStorage.setItem('userTier', preferences.tierLevel);
    }
    
    if (preferences.lastSelectedCopedent) {
      localStorage.setItem('lastSelectedCopedent', preferences.lastSelectedCopedent);
    }
    
    // Import other settings as needed
    
    return {
      success: true,
      imported: 1,
      conflicts: [],
      total: 1
    };
    
  } catch (error) {
    console.error('Error importing user preferences:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Helper functions

/**
 * Generate relationship mappings between data types
 * @param {Object} data - All app data
 * @returns {Object} Relationship mappings
 */
const generateRelationshipMap = (data) => {
  const relationships = {
    copedentUsage: {},
    favoriteLinks: {}
  };
  
  // Map which copedents are used by which files
  // TODO: Implement based on actual file relationships
  
  // Map favorite chord counts per copedent
  Object.keys(data.favoriteChords).forEach(copedentId => {
    const favoriteList = data.favoriteChords[copedentId];
    relationships.favoriteLinks[copedentId] = favoriteList.favorites?.length || 0;
  });
  
  return relationships;
};

/**
 * Get device/browser information
 * @returns {string} Device info string
 */
const getDeviceInfo = () => {
  const platform = navigator.platform || 'Unknown';
  const userAgent = navigator.userAgent || '';
  const browserName = getBrowserName(userAgent);
  
  return `${platform}/${browserName}`;
};

/**
 * Extract browser name from user agent
 * @param {string} userAgent - Browser user agent string
 * @returns {string} Browser name
 */
const getBrowserName = (userAgent) => {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
};

/**
 * Calculate total item count across all data types
 * @param {Object} data - All app data
 * @returns {number} Total item count
 */
const getTotalItemCount = (data) => {
  return (
    data.userCopedents.length +
    data.chordProgressions.length +
    data.voiceLeaderFiles.length +
    Object.keys(data.favoriteChords).length +
    1 // userPreferences count
  );
};

/**
 * Generate import summary
 * @param {Object} importResults - Results from all import operations
 * @returns {Object} Summary object
 */
const generateImportSummary = (importResults) => {
  const summary = {
    totalImported: 0,
    totalConflicts: 0,
    details: {}
  };
  
  Object.keys(importResults).forEach(dataType => {
    const result = importResults[dataType];
    if (result.success) {
      summary.totalImported += result.imported || 0;
      summary.totalConflicts += result.conflicts?.length || 0;
    }
    summary.details[dataType] = result;
  });
  
  return summary;
};

/**
 * Generate export summary for UI display
 * @param {Object} exportData - Complete export data
 * @returns {Object} Summary for UI
 */
export const generateExportSummary = (exportData) => {
  return {
    totalItems: exportData.metadata.totalItems,
    dataTypes: exportData.metadata.dataTypes,
    exportDate: exportData.metadata.exportDate,
    size: JSON.stringify(exportData).length
  };
};