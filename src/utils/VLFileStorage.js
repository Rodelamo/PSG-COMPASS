// src/utils/VLFileStorage.js

/**
 * VL File Storage Utility
 * Handles saving and loading Voice Leader arrangement files (.vlead format)
 * Provides both localStorage and file system operations
 */

export const VL_FILE_VERSION = "1.0";
export const VL_FILE_EXTENSION = ".vlead";

/**
 * Create a VL file data structure from Voice Leader state
 */
export const createVLFileData = (appState, selectedCopedent, metadata = {}) => {
  const vlFileData = {
    // File metadata
    fileType: "voice-leader-arrangement",
    version: VL_FILE_VERSION,
    timestamp: new Date().toISOString(),
    
    // User metadata
    name: metadata.name || `VL Arrangement ${Date.now()}`,
    description: metadata.description || "",
    author: metadata.author || "",
    tags: metadata.tags || [],
    category: metadata.category || "User Arrangements",
    
    // Musical data
    arrangement: {
      // Core progression data
      measures: appState.measures,
      tonalCenter: appState.tonalCenter,
      timeSignature: appState.timeSignature,
      tempo: appState.tempo,
      
      // Display preferences
      displayMode: appState.displayMode,
      useSymbols: appState.useSymbols,
      useSharps: appState.useSharps,
      
      // Voice leading settings
      resultsPerFret: appState.resultsPerFret,
      activeIntervalFilters: appState.activeIntervalFilters, // Keep for backward compatibility
      chordIntervalFilters: appState.chordIntervalFilters,
      
      // Audio settings
      clickVolume: appState.clickVolume,
      
      // Copedent information
      copedentId: selectedCopedent.id,
      copedentName: selectedCopedent.name,
      
      // Results and tablature (optional - can be regenerated)
      results: appState.results || [],
      alternativesByStep: appState.alternativesByStep || []
    },
    
    // File statistics
    statistics: {
      totalMeasures: appState.measures?.length || 0,
      totalChords: appState.measures?.reduce((count, measure) => 
        count + measure.slots.filter(slot => slot.chord).length, 0) || 0,
      hasResults: (appState.results?.length || 0) > 0,
      createdWith: "PSG Compass Voice Leader"
    }
  };
  
  return vlFileData;
};

/**
 * Validate VL file data structure
 */
export const validateVLFileData = (data) => {
  const errors = [];
  
  // Check required fields
  if (!data.fileType || data.fileType !== "voice-leader-arrangement") {
    errors.push("Invalid file type");
  }
  
  if (!data.version) {
    errors.push("Missing file version");
  }
  
  if (!data.arrangement) {
    errors.push("Missing arrangement data");
  } else {
    if (!data.arrangement.measures || !Array.isArray(data.arrangement.measures)) {
      errors.push("Invalid measures data");
    }
    
    if (!data.arrangement.tonalCenter) {
      errors.push("Missing tonal center");
    }
    
    if (!data.arrangement.timeSignature) {
      errors.push("Missing time signature");
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Extract Voice Leader state from VL file data
 */
export const extractVLState = (vlFileData) => {
  const validation = validateVLFileData(vlFileData);
  if (!validation.isValid) {
    throw new Error(`Invalid VL file: ${validation.errors.join(', ')}`);
  }
  
  const arrangement = vlFileData.arrangement;
  
  return {
    // Core progression data
    measures: arrangement.measures,
    tonalCenter: arrangement.tonalCenter,
    timeSignature: arrangement.timeSignature,
    tempo: arrangement.tempo || 120,
    
    // Display preferences
    displayMode: arrangement.displayMode || 'names',
    useSymbols: arrangement.useSymbols || false,
    useSharps: arrangement.useSharps || true,
    
    // Voice leading settings
    resultsPerFret: arrangement.resultsPerFret || 3,
    activeIntervalFilters: arrangement.activeIntervalFilters || [], // Keep for backward compatibility
    chordIntervalFilters: arrangement.chordIntervalFilters || {},
    
    // Audio settings
    clickVolume: arrangement.clickVolume || 0.3,
    
    // Results (if present)
    results: arrangement.results || [],
    alternativesByStep: arrangement.alternativesByStep || []
  };
};

/**
 * Save VL file to localStorage
 */
export const saveVLFileToStorage = (vlFileData) => {
  try {
    const savedFiles = getSavedVLFiles();
    
    // Check for duplicate names
    const existingFile = savedFiles.find(file => file.name === vlFileData.name);
    if (existingFile) {
      throw new Error(`A file with the name "${vlFileData.name}" already exists`);
    }
    
    // Add to saved files
    savedFiles.push(vlFileData);
    localStorage.setItem('savedVLFiles', JSON.stringify(savedFiles));
    
    return {
      success: true,
      message: `VL file "${vlFileData.name}" saved successfully`
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Error saving VL file'
    };
  }
};

/**
 * Get all saved VL files from localStorage
 */
export const getSavedVLFiles = () => {
  try {
    const saved = localStorage.getItem('savedVLFiles');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading saved VL files:', error);
    return [];
  }
};

/**
 * Delete VL file from localStorage
 */
export const deleteVLFileFromStorage = (fileName) => {
  try {
    const savedFiles = getSavedVLFiles();
    const filteredFiles = savedFiles.filter(file => file.name !== fileName);
    localStorage.setItem('savedVLFiles', JSON.stringify(filteredFiles));
    
    return {
      success: true,
      message: `VL file "${fileName}" deleted successfully`
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Error deleting VL file'
    };
  }
};

/**
 * Export VL file to download
 */
export const exportVLFileToDownload = (vlFileData) => {
  try {
    const dataStr = JSON.stringify(vlFileData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${vlFileData.name}${VL_FILE_EXTENSION}`;
    link.click();
    
    // Cleanup
    URL.revokeObjectURL(link.href);
    
    return {
      success: true,
      message: `VL file "${vlFileData.name}" exported successfully`
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Error exporting VL file'
    };
  }
};

/**
 * Import VL file from file upload
 */
export const importVLFileFromUpload = () => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = `${VL_FILE_EXTENSION},.json`;
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const vlFileData = JSON.parse(e.target.result);
          const validation = validateVLFileData(vlFileData);
          
          if (!validation.isValid) {
            reject(new Error(`Invalid VL file: ${validation.errors.join(', ')}`));
            return;
          }
          
          resolve({
            success: true,
            data: vlFileData,
            message: `VL file "${vlFileData.name}" imported successfully`
          });
        } catch (error) {
          reject(new Error('Invalid file format - not a valid VL file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  });
};

/**
 * Get VL file categories from saved files
 */
export const getVLFileCategories = () => {
  const savedFiles = getSavedVLFiles();
  const categories = new Set(['User Arrangements']); // Default category
  
  savedFiles.forEach(file => {
    if (file.category) {
      categories.add(file.category);
    }
  });
  
  return Array.from(categories).sort();
};

/**
 * Get VL files by category
 */
export const getVLFilesByCategory = (category) => {
  const savedFiles = getSavedVLFiles();
  return savedFiles.filter(file => 
    (file.category || 'User Arrangements') === category
  );
};

/**
 * Rename VL file
 */
export const renameVLFile = (oldName, newName) => {
  try {
    const savedFiles = getSavedVLFiles();
    const fileIndex = savedFiles.findIndex(file => file.name === oldName);
    
    if (fileIndex === -1) {
      throw new Error(`File "${oldName}" not found`);
    }
    
    // Check for duplicate new name
    const duplicateFile = savedFiles.find(file => file.name === newName);
    if (duplicateFile) {
      throw new Error(`A file with the name "${newName}" already exists`);
    }
    
    // Update the file name
    savedFiles[fileIndex].name = newName;
    savedFiles[fileIndex].timestamp = new Date().toISOString(); // Update timestamp
    
    localStorage.setItem('savedVLFiles', JSON.stringify(savedFiles));
    
    return {
      success: true,
      message: `VL file renamed to "${newName}" successfully`
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Error renaming VL file'
    };
  }
};

/**
 * Get custom categories from localStorage
 */
export const getCustomCategories = () => {
  try {
    const saved = localStorage.getItem('customVLCategories');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading custom categories:', error);
    return [];
  }
};

/**
 * Add a new custom category
 */
export const addCustomCategory = (categoryName) => {
  try {
    if (!categoryName || !categoryName.trim()) {
      throw new Error('Category name is required');
    }
    
    const trimmedName = categoryName.trim();
    const customCategories = getCustomCategories();
    
    // Check for duplicates
    if (customCategories.includes(trimmedName)) {
      throw new Error(`Category "${trimmedName}" already exists`);
    }
    
    // Default categories that cannot be duplicated
    const defaultCategories = ['User Arrangements', 'Songs', 'Exercises', 'Experiments', 'Templates'];
    if (defaultCategories.includes(trimmedName)) {
      throw new Error(`"${trimmedName}" is a default category`);
    }
    
    customCategories.push(trimmedName);
    localStorage.setItem('customVLCategories', JSON.stringify(customCategories));
    
    return {
      success: true,
      message: `Category "${trimmedName}" created successfully`
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Error creating category'
    };
  }
};

/**
 * Delete a custom category
 */
export const deleteCustomCategory = (categoryName) => {
  try {
    const customCategories = getCustomCategories();
    const filteredCategories = customCategories.filter(cat => cat !== categoryName);
    
    if (filteredCategories.length === customCategories.length) {
      throw new Error(`Category "${categoryName}" not found`);
    }
    
    localStorage.setItem('customVLCategories', JSON.stringify(filteredCategories));
    
    // Move files from deleted category to "User Arrangements"
    const savedFiles = getSavedVLFiles();
    const updatedFiles = savedFiles.map(file => ({
      ...file,
      category: file.category === categoryName ? 'User Arrangements' : file.category
    }));
    
    localStorage.setItem('savedVLFiles', JSON.stringify(updatedFiles));
    
    return {
      success: true,
      message: `Category "${categoryName}" deleted successfully`
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Error deleting category'
    };
  }
};

/**
 * Get all categories (default + custom)
 */
export const getAllCategories = () => {
  const defaultCategories = ['User Arrangements', 'Songs', 'Exercises', 'Experiments', 'Templates'];
  const customCategories = getCustomCategories();
  
  return [...defaultCategories, ...customCategories].sort();
};