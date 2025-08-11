// src/utils/FileExtensions.js

/**
 * PSG Compass File Extension System
 * Defines specific file extensions for all export/import operations
 * to create a professional, organized file management system
 */

// File Extensions with Descriptions
export const FILE_EXTENSIONS = {
  // Copedent Files
  COPEDENT: '.cop',
  
  // Voice Leader Files  
  VOICE_LEADER: '.vlead',
  
  // Chord Progression Files (future implementation)
  CHORD_PROGRESSION: '.cprog',
  
  // Favorite Chord Collections
  FAVORITES: '.favs',
  
  // Complete App Migration Files
  MIGRATION: '.psgbackup',
  
  // PDF Export Files (informational)
  PDF: '.pdf'
};

// File Type Descriptions for UI
export const FILE_DESCRIPTIONS = {
  [FILE_EXTENSIONS.COPEDENT]: 'PSG Copedent Configuration',
  [FILE_EXTENSIONS.VOICE_LEADER]: 'Voice Leader Arrangement', 
  [FILE_EXTENSIONS.CHORD_PROGRESSION]: 'Chord Progression',
  [FILE_EXTENSIONS.FAVORITES]: 'Favorite Chords Collection',
  [FILE_EXTENSIONS.MIGRATION]: 'PSG Compass Backup File',
  [FILE_EXTENSIONS.PDF]: 'PDF Chord Chart'
};

// MIME Types for file operations
export const MIME_TYPES = {
  JSON: 'application/json',
  PDF: 'application/pdf'
};

// File name generators with proper extensions
export const generateFileName = (type, baseName, date = new Date()) => {
  const dateStr = date.toISOString().split('T')[0];
  const safeName = baseName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
  
  switch (type) {
    case 'copedent':
      return `${safeName}${FILE_EXTENSIONS.COPEDENT}`;
    
    case 'voiceLeader':
      return `${safeName}${FILE_EXTENSIONS.VOICE_LEADER}`;
    
    case 'chordProgression':
      return `${safeName}${FILE_EXTENSIONS.CHORD_PROGRESSION}`;
    
    case 'favorites':
      return `${safeName}-Favorites${FILE_EXTENSIONS.FAVORITES}`;
    
    case 'migration':
      return `PSG-Compass-Backup-${dateStr}${FILE_EXTENSIONS.MIGRATION}`;
    
    case 'pdf':
      return `${safeName}-Chords-${dateStr}${FILE_EXTENSIONS.PDF}`;
    
    default:
      return `${safeName}.json`;
  }
};

// File validation functions
export const validateFileExtension = (fileName, expectedType) => {
  const extension = getFileExtension(fileName);
  const expectedExtension = FILE_EXTENSIONS[expectedType.toUpperCase()];
  
  return extension === expectedExtension;
};

export const getFileExtension = (fileName) => {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot !== -1 ? fileName.substring(lastDot) : '';
};

export const getFileType = (fileName) => {
  const extension = getFileExtension(fileName);
  
  for (const [type, ext] of Object.entries(FILE_EXTENSIONS)) {
    if (ext === extension) {
      return type.toLowerCase();
    }
  }
  
  return 'unknown';
};

// Accept attributes for file input elements
export const getFileAcceptAttribute = (fileTypes) => {
  if (typeof fileTypes === 'string') {
    fileTypes = [fileTypes];
  }
  
  const extensions = fileTypes.map(type => {
    const ext = FILE_EXTENSIONS[type.toUpperCase()];
    return ext || '.json';
  });
  
  return extensions.join(',');
};

// File size formatting
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Export type mapping for UI display
export const EXPORT_TYPES = {
  copedent: {
    name: 'Copedent Configuration',
    extension: FILE_EXTENSIONS.COPEDENT,
    description: 'String tunings, pedals, and lever configurations',
    icon: '🎛️'
  },
  
  voiceLeader: {
    name: 'Voice Leader Arrangement',
    extension: FILE_EXTENSIONS.VOICE_LEADER,
    description: 'Chord progressions with voice leading calculations', 
    icon: '🎼'
  },
  
  favorites: {
    name: 'Favorite Chords',
    extension: FILE_EXTENSIONS.FAVORITES,
    description: 'Personal favorite chord voicings collection',
    icon: '⭐'
  },
  
  migration: {
    name: 'Complete Backup',
    extension: FILE_EXTENSIONS.MIGRATION,
    description: 'Full app data backup including all customizations',
    icon: '💾'
  },
  
  pdf: {
    name: 'Chord Charts',
    extension: FILE_EXTENSIONS.PDF,
    description: 'Printable chord diagrams and tablature',
    icon: '📄'
  }
};

export default {
  FILE_EXTENSIONS,
  FILE_DESCRIPTIONS,
  MIME_TYPES,
  generateFileName,
  validateFileExtension,
  getFileExtension,
  getFileType,
  getFileAcceptAttribute,
  formatFileSize,
  EXPORT_TYPES
};