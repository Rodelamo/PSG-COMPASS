// src/utils/VLFileOperations.js

import { convertProgressionToChords } from '../data/DefaultProgressions';
import { 
  createVLFileData, 
  exportVLFileToDownload, 
  importVLFileFromUpload
} from './VLFileStorage';

/**
 * File I/O Operations for VoiceLeader component
 * Extracted from VoiceLeader.js to improve maintainability and reusability
 */

/**
 * Handle VL file loading with smart recalculation
 * @param {Object} params - Loading parameters
 */
export const handleLoadVLFile = ({
  vlFileData,
  stopPlaybackAndCleanup,
  smartRecalculateProgression,
  showToast
}) => {
  // Stop playback before loading new arrangement
  stopPlaybackAndCleanup();
  
  // Smart auto-refresh: recalculate progression if tablature exists
  setTimeout(() => {
    smartRecalculateProgression();
  }, 100);
  
  showToast(`Loaded VL arrangement: ${vlFileData.name}`, 'success');
};

/**
 * Handle VL file saving
 * @param {Object} params - Saving parameters
 */
export const handleSaveVLFile = ({
  appState,
  selectedCopedent,
  showToast
}) => {
  try {
    const vlFileData = createVLFileData(appState, selectedCopedent);
    exportVLFileToDownload(vlFileData);
    showToast('VL file exported successfully', 'success');
  } catch (error) {
    showToast('Failed to export VL file', 'error');
  }
};

/**
 * Get available categories from saved progressions
 * @returns {Array} Array of category names
 */
export const getAvailableCategories = () => {
  try {
    const saved = localStorage.getItem('savedProgressions');
    if (saved) {
      const progressions = JSON.parse(saved);
      const categories = ['Custom']; // Always include Custom as first
      const otherCategories = [...new Set(progressions.map(prog => prog.category || 'Custom'))]
        .filter(cat => cat !== 'Custom')
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
      return categories.concat(otherCategories);
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
  return ['Custom'];
};

/**
 * Initialize progression save dialog
 * @param {Object} params - Save dialog parameters
 */
export const saveProgression = ({
  setSaveProgressionName,
  setSaveProgressionCategory,
  setShowSaveDialog
}) => {
  setSaveProgressionName('My Progression');
  setSaveProgressionCategory('Custom');
  setShowSaveDialog(true);
};

/**
 * Confirm and save progression to localStorage
 * @param {Object} params - Save confirmation parameters
 */
export const confirmSaveProgression = ({
  saveProgressionName,
  saveProgressionCategory,
  measures,
  timeSignature,
  tonalCenter,
  tempo,
  setShowSaveDialog,
  setSaveProgressionName,
  setSaveProgressionCategory,
  showToast
}) => {
  try {
    if (!saveProgressionName.trim()) {
      showToast('Progression name cannot be empty', 'error');
      return;
    }
    
    const progressionData = {
      name: saveProgressionName.trim(),
      category: saveProgressionCategory,
      timestamp: new Date().toISOString(),
      measures,
      timeSignature,
      tonalCenter,
      tempo,
      version: "1.0"
    };
    
    // Save internally to localStorage (like copedents)
    const savedProgressions = JSON.parse(localStorage.getItem('savedProgressions') || '[]');
    savedProgressions.push(progressionData);
    localStorage.setItem('savedProgressions', JSON.stringify(savedProgressions));
    
    setShowSaveDialog(false);
    setSaveProgressionName('');
    setSaveProgressionCategory('Custom');
    
    showToast(`Progression "${progressionData.name}" saved to ${saveProgressionCategory}!`, 'success');
  } catch (error) {
    showToast('Error saving progression', 'error');
  }
};

/**
 * Export progression to JSON file
 * @param {Object} params - Export parameters
 */
export const exportProgression = ({
  measures,
  timeSignature,
  tonalCenter,
  tempo,
  showToast
}) => {
  try {
    const progressionName = window.prompt('Enter progression name:', `Progression_${Date.now()}`);
    if (!progressionName) return;
    
    const progressionData = {
      name: progressionName,
      timestamp: new Date().toISOString(),
      measures,
      timeSignature,
      tonalCenter,
      tempo,
      version: "1.0",
      metadata: {
        totalMeasures: measures.length,
        chordsCount: measures.reduce((count, measure) => 
          count + measure.slots.filter(slot => slot.chord).length, 0
        )
      }
    };
    
    const dataStr = JSON.stringify(progressionData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${progressionName}.json`;
    link.click();
    
    showToast(`Exported progression: ${progressionName}`, 'success');
  } catch (error) {
    showToast('Error exporting progression', 'error');
  }
};

/**
 * Import progression from JSON file
 * @param {Object} params - Import parameters
 */
export const importProgression = ({
  stopPlaybackAndCleanup,
  setAppState,
  smartRecalculateProgression,
  showToast
}) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const progressionData = JSON.parse(e.target.result);
        
        // Validate the imported data
        if (!progressionData.measures || !Array.isArray(progressionData.measures)) {
          throw new Error('Invalid progression format');
        }
        
        // Confirm import with user
        const confirmImport = window.confirm(
          `Import progression "${progressionData.name || 'Untitled'}"?\n` +
          `This will replace your current progression.`
        );
        
        if (!confirmImport) return;
        
        // Stop playback before importing new progression
        stopPlaybackAndCleanup();
        
        setAppState(prev => ({
          ...prev,
          measures: progressionData.measures,
          ...(progressionData.timeSignature && { timeSignature: progressionData.timeSignature }),
          ...(progressionData.tonalCenter && { tonalCenter: progressionData.tonalCenter }),
          ...(progressionData.tempo && { tempo: progressionData.tempo })
        }));

        // Smart auto-refresh: recalculate progression if tablature exists
        setTimeout(() => {
          smartRecalculateProgression();
        }, 100);
        
        showToast(`Imported progression: ${progressionData.name || 'Untitled'}`, 'success');
      } catch (error) {
        showToast('Error importing progression - invalid file format', 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
};

/**
 * Load default or saved progression
 * @param {Object} params - Loading parameters
 */
export const loadDefaultProgression = ({
  progression,
  tonalCenter,
  timeSignature,
  stopPlaybackAndCleanup,
  setAppState,
  smartRecalculateProgression,
  showToast
}) => {
  try {
    // Stop playback before loading any progression
    stopPlaybackAndCleanup();
    
    // Check if this is a saved user progression (has measures directly)
    if (progression.measures && Array.isArray(progression.measures)) {
      // This is a saved user progression - load it directly
      setAppState(prev => ({
        ...prev,
        measures: progression.measures,
        ...(progression.timeSignature && { timeSignature: progression.timeSignature }),
        ...(progression.tonalCenter && { tonalCenter: progression.tonalCenter }),
        ...(progression.tempo && { tempo: progression.tempo })
      }));

      // Smart auto-refresh: recalculate progression if tablature exists
      setTimeout(() => {
        smartRecalculateProgression();
      }, 100);
      
      showToast(`Loaded saved progression: ${progression.name}`, 'success');
    } else {
      // This is a default progression - convert it to chord progression in current key
      const chords = convertProgressionToChords(progression, tonalCenter);
      
      // Create measures with the chords
      const newMeasures = [];
      const beatsPerMeasure = timeSignature === '3/4' ? 3 : 4;
      
      // Distribute chords across measures (one chord per measure for now)
      for (let i = 0; i < chords.length; i++) {
        const measureIndex = Math.floor(i / 1); // One chord per measure
        
        if (!newMeasures[measureIndex]) {
          newMeasures[measureIndex] = {
            id: `measure-${measureIndex}`,
            slots: Array.from({ length: beatsPerMeasure }, (_, slotIndex) => ({
              beat: slotIndex + 1,
              chord: null
            }))
          };
        }
        
        // Place chord on first beat of each measure
        newMeasures[measureIndex].slots[0].chord = chords[i];
      }
      
      // Ensure we have at least 4 measures
      while (newMeasures.length < 4) {
        const measureIndex = newMeasures.length;
        newMeasures.push({
          id: `measure-${measureIndex}`,
          slots: Array.from({ length: beatsPerMeasure }, (_, slotIndex) => ({
            beat: slotIndex + 1,
            chord: null
          }))
        });
      }
      
      setAppState(prev => ({ ...prev, measures: newMeasures }));
      
      // Smart auto-refresh: recalculate progression if tablature exists
      setTimeout(() => {
        smartRecalculateProgression();
      }, 100);
      
      showToast(`Loaded progression: ${progression.name}`, 'success');
    }
  } catch (error) {
    showToast('Error loading progression', 'error');
  }
};