// src/components/VoiceLeader.js

import React, { useState, useMemo, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import ProgressionTablature from './ProgressionTablature';
import ManualEditModal from './ManualEditModal';
import MeasureGrid from './MeasureGrid';
import RadialChordMenu from './RadialChordMenu';
import ExtendedChordMenu from './ExtendedChordMenu';
import VLKeyDropdown from './VLKeyDropdown';
import ProgressionSelectionMenu from './ProgressionSelectionMenu';
import VLDirectionalControls from './VLDirectionalControls';
import VoiceLeadingAlternativesModal from './VoiceLeadingAlternativesModal';
import VLFileModal from './VLFileModal';
import { useToast } from '../App';
import { useTier } from '../context/TierContext';
import { findChordVoicingsWithCache } from '../logic/ChordCalculator';
import { CHORD_TYPES } from '../data/DefaultChordTypes';
// Removed unused getContextualIntervalName import
import { transposeProgression } from '../utils/KeyTransposition';
import { isFavoriteChord, toggleFavoriteStatus } from '../utils/FavoriteChordUtils';
import { 
  createVLFileData, 
  exportVLFileToDownload, 
  importVLFileFromUpload,
  saveVLFileToStorage,
  getAllCategories,
  extractVLState
} from '../utils/VLFileStorage';
// Removed unused VoiceLeadingManager imports
import { applyDirectionalSelection } from '../logic/DirectionalSelection';
import {
  getAvailableCategories,
  saveProgression,
  confirmSaveProgression,
  exportProgression,
  importProgression,
  loadDefaultProgression
} from '../utils/VLFileOperations';
import {
  buildProgressionFromMeasures,
  smartRecalculateProgression
} from '../utils/ProgressionBuilder';
import {
  stopPlaybackAndCleanup,
  handlePlayProgression,
  handleStopProgression,
  handlePlayPause,
  handlePlayChord
} from '../logic/AudioController';
import {
  handleSlotClick,
  handleChordSelect,
  handleEraseChord,
  handleCopyMeasures,
  handlePasteMeasures
} from '../utils/MeasureOperations';
import {
  handleCycleAlternative,
  handleRefreshChordWithFilters,
  handleToggleString,
  handleToggleAllStrings,
  handleStringMask
} from '../utils/StringOperations';

// Helper function to shift a note up one octave for audio playback  
const shiftNoteUpOctave = (noteName) => {
  if (!noteName) return noteName;
  const match = noteName.match(/^([A-G][#b]?)(\d+)$/);
  if (!match) return noteName;
  const [, noteBase, octave] = match;
  return `${noteBase}${parseInt(octave) + 1}`;
};

const VoiceLeader = forwardRef((props, ref) => {
  const { selectedCopedent, appState, setAppState, onResetState, onOpenVLExport } = props;
  const { 
    results, 
    measures, 
    displayMode, 
    useSymbols, 
    // useSharps, // Not used in VL context
    tonalCenter, 
    tempo, 
    timeSignature, 
    clickVolume,
    metronomeEnabled,
    activeIntervalFilters,
    chordIntervalFilters,
    resultsPerFret,
    maskedStrings,
    stringOrderReversed,
    // Voice Leading State
    lockedVoicings
  } = appState;
  const showToast = useToast();
  const { isPro } = useTier();
  console.log('🎚️ Current tier - isPro:', isPro);

  const [isCalculating, setIsCalculating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [useFavorites, setUseFavorites] = useState(false);
  
  const [isManualEditModalOpen, setIsManualEditModalOpen] = useState(false);
  const [editingChordIndex, setEditingChordIndex] = useState(null);
  const [editingChordType, setEditingChordType] = useState(null);
  
  const [currentPlayingSlot, setCurrentPlayingSlot] = useState(null);
  
  // Tap tempo state
  const [tapTimes, setTapTimes] = useState([]);
  const [isHighlighted, setIsHighlighted] = useState(false);
  
  // Chord selection state
  const [isRadialMenuOpen, setIsRadialMenuOpen] = useState(false);
  const [isExtendedMenuOpen, setIsExtendedMenuOpen] = useState(false);
  const [isProgressionMenuOpen, setIsProgressionMenuOpen] = useState(false);
  const [progressionMenuPosition, setProgressionMenuPosition] = useState({ x: 0, y: 0 });
  const [radialMenuPosition, setRadialMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedSlot, setSelectedSlot] = useState(null); // { measureIndex, slotIndex }
  
  // Copy/paste state
  const [copiedMeasures, setCopiedMeasures] = useState(null); // Store copied measure data
  
  // Voice Leading Directional Controls state
  const [fretStart, setFretStart] = useState(0);
  const [fretRange, setFretRange] = useState([0, 24]);
  const [jumpSize, setJumpSize] = useState(0);
  const [alternativesModalOpen, setAlternativesModalOpen] = useState(false);
  const [alternativesModalData, setAlternativesModalData] = useState({
    chordIndex: null,
    currentVoicing: null,
    chord: null
  });
  
  // VL File Modal state
  const [isVLModalOpen, setIsVLModalOpen] = useState(false);
  const [vlModalMode, setVlModalMode] = useState('load'); // 'load', 'manage'
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveFormData, setSaveFormData] = useState({
    name: '',
    description: '',
    author: '',
    tags: '',
    category: 'User Arrangements'
  });
  
  // VL file handlers
  const handleLoadVLFileWrapper = (vlFileData) => {
    try {
      // Stop playback before loading new arrangement
      stopPlaybackAndCleanupWrapper();
      
      // Extract state from VL file
      const newState = extractVLState(vlFileData);
      
      // Update app state with VL file data
      setAppState(prev => ({
        ...prev,
        ...newState
      }));

      // Smart auto-refresh: recalculate progression if tablature exists
      setTimeout(() => {
        smartRecalculateProgressionWrapper();
      }, 100);
      
      showToast(`Loaded VL arrangement: ${vlFileData.name}`, 'success');
    } catch (error) {
      showToast('Error loading VL file: ' + error.message, 'error');
    }
  };

  const confirmSaveVLFile = async () => {
    try {
      // Validate form data
      if (!saveFormData.name.trim()) {
        showToast('Please enter a name for the arrangement', 'error');
        return;
      }

      // Prepare metadata
      const metadata = {
        name: saveFormData.name.trim(),
        description: saveFormData.description.trim(),
        author: saveFormData.author.trim(),
        tags: saveFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        category: saveFormData.category
      };

      // Create VL file data
      const vlFileData = createVLFileData(appState, selectedCopedent, metadata);

      // Save to localStorage
      const result = saveVLFileToStorage(vlFileData);
      
      if (result.success) {
        showToast(result.message, 'success');
        setIsSaveModalOpen(false);
        setSaveFormData({
          name: '',
          description: '',
          author: '',
          tags: '',
          category: 'User Arrangements'
        });
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('Error saving VL file: ' + error.message, 'error');
    }
  };
  
  const [progressionInterval, setProgressionInterval] = useState(null);
  
  // Time signature change states
  const [showTimeSignatureDialog, setShowTimeSignatureDialog] = useState(false);
  const [pendingTimeSignature, setPendingTimeSignature] = useState(null);
  
  // Reset confirmation states
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showMeasureResetDialog, setShowMeasureResetDialog] = useState(false);
  const [showTablatureResetDialog, setShowTablatureResetDialog] = useState(false);
  
  // Save progression dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveProgressionName, setSaveProgressionName] = useState('');
  const [saveProgressionCategory, setSaveProgressionCategory] = useState('Custom');
  
  // Comprehensive cleanup handler for playback
  const stopPlaybackAndCleanupWrapper = useCallback(() => {
    stopPlaybackAndCleanup({
      progressionInterval,
      setProgressionInterval,
      setIsPlaying,
      setCurrentPlayingSlot
    });
  }, [progressionInterval]);

  // Expose stopPlayback function to parent component
  useImperativeHandle(ref, () => ({
    stopPlayback: stopPlaybackAndCleanupWrapper,
    isPlaying: isPlaying
  }), [stopPlaybackAndCleanupWrapper, isPlaying]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Ensure cleanup when component unmounts
      if (progressionInterval) {
        clearInterval(progressionInterval);
        if (process.env.NODE_ENV === 'development') {
          console.log('🧹 Voice Leader cleanup on unmount');
        }
      }
    };
  }, [progressionInterval]);

  // Check if any measures contain chords
  const hasExistingChords = () => {
    return measures.some(measure => 
      measure.slots && measure.slots.some(slot => slot.chord !== null && slot.chord !== undefined)
    );
  };
  
  // Time signature toggle with confirmation
  const toggleTimeSignature = () => {
    const newTimeSignature = timeSignature === '4/4' ? '3/4' : '4/4';
    
    // Check if there are existing chords and show dialog
    if (hasExistingChords()) {
      setPendingTimeSignature(newTimeSignature);
      setShowTimeSignatureDialog(true);
    } else {
      // No chords, safe to change directly
      setAppState(prev => ({ ...prev, timeSignature: newTimeSignature }));
    }
  };
  
  const handleConfirmTimeSignatureChange = () => {
    if (pendingTimeSignature) {
      // Clear progression and change time signature
      const beatsPerMeasure = pendingTimeSignature === '3/4' ? 3 : 4;
      const initialMeasures = Array.from({ length: 4 }, (_, i) => ({
        id: i,
        slots: Array.from({ length: beatsPerMeasure }, (_, j) => ({
          beat: j + 1,
          chord: null
        }))
      }));
      
      setAppState(prev => ({ 
        ...prev, 
        timeSignature: pendingTimeSignature,
        measures: initialMeasures,
        results: []
      }));
      
      showToast(`Time signature changed to ${pendingTimeSignature}. Progression cleared.`, 'info');
    }
    setShowTimeSignatureDialog(false);
    setPendingTimeSignature(null);
  };
  
  // VL File handling functions removed - now handled directly in button handlers
  
  // Reset functions with confirmation
  const handleResetConfirm = () => {
    onResetState();
    setShowResetDialog(false);
    showToast('Voice Leader reset to default state', 'info');
  };
  
  const handleMeasureResetConfirm = () => {
    const beatsPerMeasure = timeSignature === '3/4' ? 3 : 4;
    const initialMeasures = Array.from({ length: 4 }, (_, i) => ({
      id: i,
      slots: Array.from({ length: beatsPerMeasure }, (_, j) => ({
        beat: j + 1,
        chord: null
      }))
    }));
    
    setAppState(prev => ({ 
      ...prev, 
      measures: initialMeasures,
      results: []
    }));
    
    setShowMeasureResetDialog(false);
    showToast('Measures and tablature cleared', 'info');
  };

  // Handle tablature reset (clear only results, keep measures)
  const handleTablatureResetConfirm = () => {
    stopPlaybackAndCleanupWrapper();
    
    setAppState(prev => ({ 
      ...prev, 
      results: [],
      alternativesByStep: []
    }));
    
    setShowTablatureResetDialog(false);
    showToast('Chord results cleared', 'info');
  };

  // Calculate unique intervals for the chord being edited (for interval filtering)
  const uniqueChordIntervals = useMemo(() => {
    if (!editingChordType) return [];
    const intervals = CHORD_TYPES[editingChordType] || [];
    return Array.from(new Set(intervals.map(i => i % 12))).sort((a, b) => a - b);
  }, [editingChordType]);

  // Removed unused metronome wrapper

  // Time signature changes are now handled by MetronomeControls dialog
  // This effect has been removed to prevent "[object Object]" display bugs
  // When time signature changes are confirmed, handleClearProgression rebuilds measures properly

  // Tap tempo functionality
  const handleTapTempo = useCallback(() => {
    const now = Date.now();
    
    // Visual feedback
    setIsHighlighted(true);
    setTimeout(() => setIsHighlighted(false), 100);
    
    setTapTimes(prevTimes => {
      // Keep only the last 4 taps and add current tap
      const newTimes = [...prevTimes.slice(-3), now];
      
      // Need at least 2 taps to calculate tempo
      if (newTimes.length >= 2) {
        // Calculate intervals between taps
        const intervals = [];
        for (let i = 1; i < newTimes.length; i++) {
          intervals.push(newTimes[i] - newTimes[i - 1]);
        }
        
        // Calculate average interval in milliseconds
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        
        // Convert to BPM (60000 ms = 1 minute)
        const calculatedBPM = Math.round(60000 / avgInterval);
        
        // Only update if within reasonable range
        if (calculatedBPM >= 40 && calculatedBPM <= 500) {
          setAppState(prev => ({ ...prev, tempo: calculatedBPM }));
        }
      }
      
      return newTimes;
    });
  }, [setAppState]);

  // Favorite chord handler (imported from ChordFinder pattern)
  const handleToggleFavorite = async (chordData) => {
    try {
      // Check if this is a removal action and show confirmation
      const isCurrentlyFavorite = isFavoriteChord(selectedCopedent.id, chordData);
      
      if (isCurrentlyFavorite) {
        // Show confirmation dialog for favorite deletion
        const chordName = chordData.chordName || `${chordData.selectedChordType || 'Unknown'} chord`;
        const confirmed = window.confirm(
          `Delete "${chordName}" from favorites?\n\n` +
          `This will permanently remove the favorite chord and ALL its customizations.\n\n` +
          `This action cannot be undone.`
        );
        
        if (!confirmed) {
          return; // User cancelled the deletion
        }
      }

      const result = toggleFavoriteStatus(selectedCopedent.id, chordData, {
        name: selectedCopedent.name,
        copedentName: selectedCopedent.name
      });
      
      if (result.success) {
        const action = result.action === 'added' ? 'added to' : 'removed from';
        showToast(`Chord ${action} favorites`, 'success');
      } else {
        showToast(`Failed to ${result.action === 'added' ? 'add' : 'remove'} favorite`, 'error');
      }
    } catch (error) {
      console.error('Error toggling favorite status:', error);
      showToast('Failed to update favorite status', 'error');
    }
  };

  // Auto-clear tap times after inactivity (separate effect to avoid infinite loops)
  useEffect(() => {
    if (tapTimes.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      const timeSinceLastTap = Date.now() - Math.max(...tapTimes);
      if (timeSinceLastTap >= 3000) {
        setTapTimes([]);
      }
    }, 3000);
    
    return () => clearTimeout(timeoutId);
  }, [tapTimes]);

  // Per-chord interval filtering handlers
  const handleIntervalToggle = (intervalSemitone) => {
    if (editingChordIndex === null) return;
    
    const currentFilters = chordIntervalFilters[editingChordIndex] || uniqueChordIntervals;
    const newFilters = currentFilters.includes(intervalSemitone)
      ? currentFilters.filter(i => i !== intervalSemitone)
      : [...currentFilters, intervalSemitone].sort((a,b) => a - b);
    
    setAppState(prev => ({ 
      ...prev, 
      chordIntervalFilters: {
        ...prev.chordIntervalFilters,
        [editingChordIndex]: newFilters
      }
    }));
  };

  // Initialize interval filters when editing a NEW chord (only when editingChordType changes)
  React.useEffect(() => {
    if (editingChordIndex !== null && editingChordType && uniqueChordIntervals.length > 0) {
      // Only initialize if no filters exist for this chord yet
      if (!chordIntervalFilters[editingChordIndex]) {
        setAppState(prev => ({ 
          ...prev, 
          chordIntervalFilters: {
            ...prev.chordIntervalFilters,
            [editingChordIndex]: [...uniqueChordIntervals]
          }
        }));
      }
    }
  }, [editingChordIndex, editingChordType, uniqueChordIntervals, chordIntervalFilters, setAppState]);

  // New measure-based handlers
  const handleSlotClickWrapper = (measureIndex, slotIndex) => {
    handleSlotClick({
      measureIndex,
      slotIndex,
      setSelectedSlot,
      setRadialMenuPosition,
      setIsRadialMenuOpen
    });
  };

  const handleChordSelectWrapper = (chordInput) => {
    handleChordSelect({
      chordInput,
      selectedSlot,
      measures,
      setAppState,
      stopPlaybackAndCleanupFn: stopPlaybackAndCleanupWrapper,
      smartRecalculateProgressionFn: smartRecalculateProgressionWrapper,
      setIsRadialMenuOpen,
      setIsExtendedMenuOpen,
      setSelectedSlot
    });
  };

  const handleMoreChordsClick = () => {
    setIsRadialMenuOpen(false);
    setIsExtendedMenuOpen(true);
  };

  const handleEraseChordWrapper = () => {
    handleEraseChord({
      selectedSlot,
      measures,
      setAppState,
      stopPlaybackAndCleanupFn: stopPlaybackAndCleanupWrapper,
      smartRecalculateProgressionFn: smartRecalculateProgressionWrapper,
      setIsRadialMenuOpen,
      setSelectedSlot
    });
  };

  // Get available custom categories for save dialog
  // Imported from VLFileOperations
  
  // Save/Load/Import/Export functionality
  const saveProgressionWrapper = () => {
    saveProgression({
      setSaveProgressionName,
      setSaveProgressionCategory,
      setShowSaveDialog
    });
  };
  
  const confirmSaveProgressionWrapper = () => {
    confirmSaveProgression({
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
    });
  };


  const loadProgression = (event) => {
    // Open progression selection menu
    const rect = event.target.getBoundingClientRect();
    setProgressionMenuPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10
    });
    setIsProgressionMenuOpen(true);
  };

  const handleProgressionSelect = (progression) => {
    loadDefaultProgressionWrapper(progression);
  };

  const exportProgressionWrapper = () => {
    exportProgression({
      measures,
      timeSignature,
      tonalCenter,
      tempo,
      showToast
    });
  };

  const importProgressionWrapper = () => {
    importProgression({
      stopPlaybackAndCleanup: stopPlaybackAndCleanupWrapper,
      setAppState,
      smartRecalculateProgression: smartRecalculateProgressionWrapper,
      showToast
    });
  };

  const loadDefaultProgressionWrapper = (progression) => {
    loadDefaultProgression({
      progression,
      tonalCenter,
      timeSignature,
      stopPlaybackAndCleanup: stopPlaybackAndCleanupWrapper,
      setAppState,
      smartRecalculateProgression: smartRecalculateProgressionWrapper,
      showToast
    });
  };

  // Imported from ProgressionBuilder

  // Voice Leading Optimization Functions
  
  const buildProgressionFromMeasuresWrapper = () => {
    return buildProgressionFromMeasures(measures);
  };

  // Removed unused convertToStringIds wrapper

  // Removed old transition cost wrapper - no longer needed

  const smartRecalculateProgressionWrapper = async () => {
    return smartRecalculateProgression({
      results,
      measures,
      selectedCopedent,
      chordIntervalFilters,
      resultsPerFret,
      lockedVoicings, // CRITICAL: Pass lockedVoicings to respect locks
      findChordVoicingsFn: findChordVoicingsWithFavorites, // Use favorites-aware function
      setIsCalculating,
      setAppState,
      showToast
    });
  };

  // Removed old optimization wrapper functions

  const handleDirectionalSelection = async (direction, settings) => {
    console.log('🎯 DIRECTIONAL SELECTION TRIGGERED:', direction, settings);
    
    // Always recalculate with extended fret range for directional selection
    // This ensures we have the full 0-24 fret range available
    await handleCalculateWithDirectionalSelection(direction, settings);
  };

  const handleToggleUseFavorites = () => {
    setUseFavorites(prev => !prev);
    showToast(useFavorites ? 'Favorite chord priority disabled' : 'Favorite chord priority enabled', 'info');
  };

  // Favorites-aware chord finding wrapper
  const findChordVoicingsWithFavorites = (copedent, rootNote, intervals, maxResults, useFullCopedent) => {
    // Get all voicings using the standard method
    const allVoicings = findChordVoicingsWithCache(copedent, rootNote, intervals, maxResults * 3, useFullCopedent);
    
    if (!useFavorites || allVoicings.length === 0) {
      // If favorites not enabled or no voicings found, return standard results
      return allVoicings.slice(0, maxResults);
    }

    // Separate favorites from non-favorites
    const favoriteVoicings = [];
    const regularVoicings = [];
    
    allVoicings.forEach(voicing => {
      if (isFavoriteChord(copedent.id, voicing)) {
        favoriteVoicings.push(voicing);
      } else {
        regularVoicings.push(voicing);
      }
    });

    // Prioritize favorites: take favorites first, then fill with regular voicings
    const prioritizedVoicings = [
      ...favoriteVoicings,
      ...regularVoicings
    ];

    return prioritizedVoicings.slice(0, maxResults);
  };

  const handleCalculateWithDirectionalSelection = async (direction, settings) => {
    // Stop playback before calculation
    stopPlaybackAndCleanupWrapper();
    
    // Build progression from measures
    const progression = [];
    measures.forEach(measure => {
      measure.slots.forEach(slot => {
        if (slot.chord) {
          progression.push(slot.chord);
        }
      });
    });
    
    if (progression.length < 1) {
      showToast('Please add chords to your progression first.', 'error');
      return;
    }
    
    setIsCalculating(true);
    
    try {
      // Calculate full chord pool for all chords
      const alternativesByStep = [];
      let failedChord = null;
      
      for (let i = 0; i < progression.length; i++) {
        const chord = progression[i];
        const chordIntervals = CHORD_TYPES[chord.type];
        
        if (!chordIntervals) {
          failedChord = chord;
          break;
        }
        
        const intervalsToUse = activeIntervalFilters.length > 0 ? activeIntervalFilters : chordIntervals;
        const rootNoteWithOctave = `${chord.root}4`;
        
        // Find chord voicings using favorites-aware cache
        const chordVoicings = findChordVoicingsWithFavorites(selectedCopedent, rootNoteWithOctave, intervalsToUse, resultsPerFret, true);
        
        if (chordVoicings.length === 0) {
          failedChord = chord;
          break;
        }
        
        // For Voice Leader: Extend to fret 23 by duplicating 0-11 range (+12 fret offset)
        // Note: Base calculation is 0-11, so duplicate 0-11 to create 12-23
        const extendedVoicings = [...chordVoicings];
        
        chordVoicings.forEach(voicing => {
          if (voicing.fret <= 11) { // Only duplicate frets 0-11 to create 12-23
            const octaveVoicing = {
              ...voicing,
              fret: voicing.fret + 12, // Add 12 frets for octave: 0→12, 1→13, ... 11→23
              notes: voicing.notes?.map(note => ({
                ...note,
                finalNote: shiftNoteUpOctave(note.finalNote) // Shift audio up one octave
              }))
            };
            extendedVoicings.push(octaveVoicing);
          }
        });
        
        // Add chord name to each voicing
        const voicingsWithChordName = extendedVoicings.map((voicing, index) => ({
          ...voicing,
          chordName: `${chord.root} ${chord.type}`,
          id: `${voicing.fret}-${voicing.pedalCombo.join('')}-${voicing.leverCombo.join('')}-${voicing.mecCombo.join('')}-${index}`
        }));
        
        alternativesByStep.push(voicingsWithChordName);
      }

      if (failedChord) {
        showToast(`Could not calculate voicing for ${failedChord.root} ${failedChord.type}`, 'error');
        setIsCalculating(false);
        return;
      }

      // Apply directional selection to get the results
      const selectedResults = applyDirectionalSelection(
        alternativesByStep,
        direction,
        settings,
        lockedVoicings
      );

      if (selectedResults.length === 0) {
        showToast('No chord voicings could be selected with current settings', 'error');
        setIsCalculating(false);
        return;
      }

      // Update app state with both results and alternatives
      setAppState(prev => ({
        ...prev,
        results: selectedResults,
        alternativesByStep: alternativesByStep
      }));

      showToast(`Applied ${direction} direction to ${selectedResults.length} chords`, 'success');
      
    } catch (error) {
      console.error('Error in calculate with directional selection:', error);
      showToast('Error calculating progression', 'error');
    } finally {
      setIsCalculating(false);
    }
  };

  // Removed unused optimization reset wrapper

  // Removed old scoring system handlers

  const handleToggleLock = (chordIndex) => {
    setAppState(prev => {
      const newLockedVoicings = [...prev.lockedVoicings];
      const isLocked = newLockedVoicings.includes(chordIndex);
      
      if (isLocked) {
        // Unlock - remove from array
        const indexToRemove = newLockedVoicings.indexOf(chordIndex);
        newLockedVoicings.splice(indexToRemove, 1);
        showToast(`Chord ${chordIndex + 1} unlocked - will be re-optimized`, 'info');
      } else {
        // Lock - add to array
        newLockedVoicings.push(chordIndex);
        showToast(`Chord ${chordIndex + 1} locked - preserved during optimization`, 'success');
      }
      
      return {
        ...prev,
        lockedVoicings: newLockedVoicings
      };
    });
  };

  // Removed old chord direction handler

  const handleOpenAlternativesModal = (chordIndex, currentVoicing) => {
    const progression = buildProgressionFromMeasuresWrapper();
    const chord = progression[chordIndex];
    
    if (!chord) return;

    setAlternativesModalData({
      chordIndex,
      currentVoicing,
      chord
    });
    setAlternativesModalOpen(true);
  };

  const handleSelectAlternative = (newVoicing) => {
    const { chordIndex } = alternativesModalData;
    
    if (chordIndex !== null && results[chordIndex]) {
      const newResults = [...results];
      newResults[chordIndex] = newVoicing;
      
      // Update results without quality metrics
      setAppState(prev => ({
        ...prev,
        results: newResults
      }));
      
      showToast(`Updated chord ${chordIndex + 1} with selected alternative`, 'success');
    }
  };

  // Removed old transition cost calculation
  
  // Removed unused calculate wrapper
  
  const handlePlayProgressionWrapper = () => {
    handlePlayProgression({
      results,
      tempo,
      measures,
      timeSignature,
      maskedStrings,
      metronomeEnabled,
      clickVolume,
      setIsPlaying,
      setProgressionInterval,
      setCurrentPlayingSlot,
      stopPlaybackAndCleanupFn: stopPlaybackAndCleanupWrapper
    });
  };
  
  const handleStopProgressionWrapper = () => {
    handleStopProgression(stopPlaybackAndCleanupWrapper);
  };
  
  const handlePlayPauseWrapper = () => {
    handlePlayPause({
      isPlaying,
      handleStopProgressionFn: handleStopProgressionWrapper,
      handlePlayProgressionFn: handlePlayProgressionWrapper
    });
  };

  const handlePlayChordWrapper = (voicing) => {
    handlePlayChord({
      voicing,
      isPlaying,
      maskedStrings
    });
  };

  const handleCycleAlternativeWrapper = (progressionIndex, direction, currentCustomizations = {}) => {
    handleCycleAlternative({
      progressionIndex,
      direction,
      results,
      alternativesByStep: appState.alternativesByStep,
      setAppState,
      currentCustomizations
    });
  };

  const handleOpenManualEdit = (voicing, index) => {
    setEditingChordIndex(index);
    // Get the chord type from the voicing, removing any filtering annotations like "(no P5)"
    const fullChordName = voicing.chordName?.split(' ').slice(1).join(' ') || 'Major Triad';
    // Remove filtering annotations like "(no P5)", "(no 3rd)", etc.
    const chordType = fullChordName.replace(/\s*\(no\s+[^)]+\)/g, '').trim();
    setEditingChordType(chordType);
    setIsManualEditModalOpen(true);
  };

  const handleRefreshChordWithFiltersWrapper = () => {
    handleRefreshChordWithFilters({
      editingChordIndex,
      editingChordType,
      results,
      alternativesByStep: appState.alternativesByStep,
      selectedCopedent,
      activeIntervalFilters: chordIntervalFilters[editingChordIndex] || [],
      resultsPerFret,
      setAppState,
      showToast,
      findChordVoicingsWithCacheFn: findChordVoicingsWithFavorites,
      CHORD_TYPES,
      setIsManualEditModalOpen
    });
  };

  
  const handleToggleStringWrapper = (chordIndex, stringId) => {
    handleToggleString({
      chordIndex,
      stringId,
      results,
      selectedCopedent,
      setAppState,
      showToast
    });
  };

  const handleToggleAllStringsWrapper = (stringId) => {
    handleToggleAllStrings({
      stringId,
      results,
      setAppState,
      showToast
    });
  };

  // Bulk chord update function for customization switching
  const handleBulkUpdateChord = (chordIndex, newVoicing) => {
    if (!newVoicing || chordIndex < 0 || chordIndex >= results.length) return;
    
    const newResults = [...results];
    newResults[chordIndex] = newVoicing;
    setAppState(prev => ({ ...prev, results: newResults }));
  };

  // String masking handlers
  const handleStringMaskWrapper = (stringId) => {
    handleStringMask({
      stringId,
      maskedStrings,
      setAppState,
      showToast
    });
  };

  const handleStringOrderSwap = () => {
    setAppState(prev => ({ ...prev, stringOrderReversed: !prev.stringOrderReversed }));
  };

  const handleExportToPdf = (progression) => {
    if (onOpenVLExport) {
      onOpenVLExport(progression);
    }
  };


  // Copy/paste handlers
  const handleCopyMeasuresWrapper = (numMeasures, startMeasureIndex) => {
    handleCopyMeasures({
      numMeasures,
      startMeasureIndex,
      measures,
      setCopiedMeasures,
      showToast
    });
  };

  const handlePasteMeasuresWrapper = (numMeasures, startMeasureIndex) => {
    handlePasteMeasures({
      numMeasures,
      startMeasureIndex,
      measures,
      copiedMeasures,
      setAppState,
      stopPlaybackAndCleanupFn: stopPlaybackAndCleanupWrapper,
      smartRecalculateProgressionFn: smartRecalculateProgressionWrapper,
      showToast
    });
  };

  // Imported from VoiceLeadingManager

  // Imported from ProgressionBuilder

  return (
    <>
      <div className="container mx-auto p-4 bg-gray-50 min-h-screen">

        {/* Copedent Section */}
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-6">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <label htmlFor="copedent-select" className="text-lg font-semibold text-gray-700">Current Copedent:</label>
            <select
              id="copedent-select"
              className="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCopedent ? selectedCopedent.id : ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'create-new') {
                  props.onCreateNewCopedent();
                } else {
                  const newCopedent = props.allCopedents.find(c => c.id === value);
                  if (newCopedent) {
                    props.onCopedentSelect(newCopedent);
                  }
                }
              }}
            >
              {props.allCopedents.map(copedent => {
                const isDefault = !copedent.id.startsWith('custom-');
                return (
                  <option key={copedent.id} value={copedent.id}>
                    {isDefault ? `Def - ${copedent.name}` : copedent.name}
                  </option>
                );
              })}
              <option value="create-new" className="font-bold text-blue-600">Create New...</option>
            </select>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm" 
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    try {
                      const importedData = JSON.parse(e.target.result);
                      props.onImportCopedent(importedData);
                    } catch (error) {
                      console.error("Import error:", error);
                    }
                  };
                  reader.readAsText(file);
                  e.target.value = null;
                };
                input.click();
              }}
              title="Import a copedent from a .json file"
            >
              Import Copedent
            </button>
            <button 
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm" 
              onClick={props.onExportCopedent} 
              title="Export the current copedent to a .json file"
            >
              Export Copedent
            </button>
            <button 
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 text-sm" 
              onClick={props.onEditCurrentCopedent} 
              title="Edit the currently selected copedent"
            >
              Edit Copedent
            </button>
            <button 
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={() => props.onDeleteCopedent(selectedCopedent)} 
              disabled={!selectedCopedent?.id?.startsWith('custom-')} 
              title={selectedCopedent?.id?.startsWith('custom-') ? "Delete the current custom copedent" : "Only custom copedents can be deleted"}
            >
              Delete Copedent
            </button>
          </div>
        </div>

        {/* Key and Tempo + Load and Save Side-by-Side */}
        <div className="grid grid-cols-12 gap-6 mb-6">
          {/* Key and Tempo Box */}
          <div className="col-span-9 bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 italic">Key and Tempo</h3>
            {/* Horizontal layout matching screenshot */}
            <div className="flex items-center space-x-4">
              {/* Reset Button */}
              <button 
                onClick={() => setShowResetDialog(true)} 
                disabled={isPlaying}
                className={`px-3 py-1 text-white text-sm font-semibold rounded-md transition-colors ${
                  isPlaying ? 'bg-gray-400 cursor-not-allowed opacity-60' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={isPlaying ? "Stop playback to reset Voice Leader" : "Reset Voice Leader to default state"}
              >
                Reset
              </button>
              
              {/* Key Controls */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Key:</span>
                <VLKeyDropdown
                  selectedKey={tonalCenter}
                  onKeyChange={(newTonalCenter) => {
                    const oldTonalCenter = tonalCenter;
                    
                    // Transpose existing measures to new key
                    const transposedMeasures = transposeProgression(measures, oldTonalCenter, newTonalCenter);
                    
                    setAppState(prev => ({ 
                      ...prev, 
                      tonalCenter: newTonalCenter,
                      measures: transposedMeasures
                    }));
                    
                    if (oldTonalCenter !== newTonalCenter) {
                      showToast(`Key changed to ${newTonalCenter}`, 'info');
                    }
                    
                    // Stop playback before recalculating with new key
                    stopPlaybackAndCleanupWrapper();
                    
                    setTimeout(() => {
                      smartRecalculateProgressionWrapper();
                    }, 100);
                  }}
                />
              </div>

              {/* Time Signature */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Time:</span>
                <button
                  onClick={toggleTimeSignature}
                  disabled={isPlaying}
                  className={`px-3 py-1 text-white text-m font-medium rounded-md transition-colors min-w-[50px] ${
                    isPlaying ? 'bg-gray-400 cursor-not-allowed opacity-60' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  title={isPlaying ? "Stop playback to change time signature" : "Toggle time signature"}
                >
                  {timeSignature}
                </button>
              </div>

              {/* Tempo Controls */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Tempo:</span>
                <input
                  type="range"
                  min="40"
                  max="500"
                  value={tempo}
                  onChange={(e) => setAppState(prev => ({ ...prev, tempo: parseInt(e.target.value) }))}
                  className="w-35 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <input
                  type="number"
                  min="40"
                  max="500"
                  value={tempo}
                  onChange={(e) => {
                    const value = Math.max(40, Math.min(500, parseInt(e.target.value) || 40));
                    setAppState(prev => ({ ...prev, tempo: value }));
                  }}
                  className="w-14 px-1 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {/* Tap Tempo Button with Label */}
                <div className="flex flex-col items-center -mt-5">
                  <span className="text-xs text-gray-500 mb-0.5">Tap</span>
                  <button
                    onClick={handleTapTempo}
                    className={`px-3 py-2 text-sm font-medium rounded transition-colors ${
                      isHighlighted
                        ? 'bg-blue-800 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    title="Tap repeatedly to set tempo"
                  >
                    BPM
                  </button>
                </div>
              </div>

              {/* Click Controls */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Click:</span>
                <button
                  onClick={() => setAppState(prev => ({ ...prev, metronomeEnabled: !prev.metronomeEnabled }))}
                  className={`px-2 py-1 text-sm font-medium rounded-md transition-colors ${
                    metronomeEnabled ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  {/* Metronome Icon */}
                  <svg width="20" height="26" viewBox="0 0 24 24" fill="currentColor" className="inline">
                    {/* Metronome body (triangular) */}
                    <path d="M8 4h8l3 14H5L8 4z" fill="currentColor"/>
                    {/* Inner triangle (negative space) */}
                    <path d="M9.5 6h5l2 10H7.5L9.5 6z" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                    {/* Pendulum arm */}
                    <line x1="12" y1="6" x2="16" y2="10" stroke="currentColor" strokeWidth="1.5"/>
                    {/* Pendulum weight */}
                    <circle cx="16" cy="10" r="2" fill="currentColor"/>
                    {/* Base platform */}
                    <rect x="4" y="18" width="16" height="2" rx="1" fill="currentColor"/>
                    {/* Base feet */}
                    <circle cx="6" cy="21" r="1.5" fill="currentColor"/>
                    <circle cx="18" cy="21" r="1.5" fill="currentColor"/>
                  </svg>
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={clickVolume}
                  onChange={(e) => setAppState(prev => ({ ...prev, clickVolume: parseFloat(e.target.value) }))}
                  className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Play Button with Status Indicator */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handlePlayPauseWrapper}
                  className={`px-4 py-2 text-white font-medium rounded-md transition-colors ${
                    isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isPlaying ? '⏸ Stop' : '▶ Play'}
                </button>
                
                {/* Play Status Indicator */}
                {isPlaying && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <div className="animate-pulse w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Playing...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Load and Save Box */}
          <div className="col-span-3 bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 italic">Load and Save</h3>
            <div className="grid grid-cols-2 gap-2">
              {/* Left Column: All CP buttons */}
              <div className="space-y-1">
                <button
                  onClick={loadProgression}
                  disabled={isPlaying}
                  className={`w-full px-1 py-0.5 text-white text-sm font-medium rounded transition-colors ${
                    isPlaying ? 'bg-gray-400 cursor-not-allowed opacity-60' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  title={isPlaying ? "Stop playback to load progression" : "Load progression from defaults or saved progressions"}
                >
                  Load CP
                </button>
                <button
                  onClick={saveProgressionWrapper}
                  disabled={isPlaying}
                  className={`w-full px-1 py-0.5 text-white text-sm font-medium rounded transition-colors ${
                    isPlaying ? 'bg-gray-400 cursor-not-allowed opacity-60' : 'bg-green-600 hover:bg-green-700'
                  }`}
                  title={isPlaying ? "Stop playback to save progression" : "Save progression to file"}
                >
                  Save CP
                </button>
                <button
                  onClick={exportProgressionWrapper}
                  disabled={isPlaying}
                  className={`w-full px-1 py-0.5 text-white text-sm font-medium rounded transition-colors ${
                    isPlaying ? 'bg-gray-400 cursor-not-allowed opacity-60' : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                  title={isPlaying ? "Stop playback to export progression" : "Export progression to JSON"}
                >
                  Export CP
                </button>
                <button
                  onClick={importProgressionWrapper}
                  disabled={isPlaying}
                  className={`w-full px-1 py-0.5 text-white text-sm font-medium rounded transition-colors ${
                    isPlaying ? 'bg-gray-400 cursor-not-allowed opacity-60' : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                  title={isPlaying ? "Stop playback to import progression" : "Import progression from JSON"}
                >
                  Import CP
                </button>
              </div>
              
              {/* Right Column: All VL buttons */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setVlModalMode('load');
                    setIsVLModalOpen(true);
                  }}
                  className="w-full px-1 py-0.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                  title="Load Voice Leader arrangement"
                >
                  Load VL
                </button>
                <button
                  onClick={() => {
                    setSaveFormData({
                      name: `VL Arrangement ${new Date().toLocaleDateString()}`,
                      description: '',
                      author: '',
                      tags: '',
                      category: 'User Arrangements'
                    });
                    setIsSaveModalOpen(true);
                  }}
                  className="w-full px-1 py-0.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors"
                  title="Save Voice Leader arrangement"
                >
                  Save VL
                </button>
                <button
                  onClick={() => {
                    // Export current VL state to .vlead file
                    try {
                      const metadata = {
                        name: `VL Export ${new Date().toLocaleDateString()}`,
                        description: 'Exported Voice Leader arrangement',
                        author: '',
                        tags: ['export'],
                        category: 'Exports'
                      };
                      const vlFileData = createVLFileData(appState, selectedCopedent, metadata);
                      exportVLFileToDownload(vlFileData);
                      showToast('VL file exported successfully', 'success');
                    } catch (error) {
                      showToast('Failed to export VL file', 'error');
                    }
                  }}
                  className="w-full px-1 py-0.5 bg-orange-600 text-white text-sm font-medium rounded hover:bg-orange-700 transition-colors"
                  title="Export Voice Leader arrangement to file"
                >
                  Export VL
                </button>
                <button
                  onClick={async () => {
                    // Import VL File with proper validation
                    try {
                      const result = await importVLFileFromUpload();
                      if (result.success) {
                        // Confirm import with user
                        const confirmImport = window.confirm(
                          `Import VL arrangement "${result.data.name}"?\n` +
                          `This will replace your current arrangement.`
                        );
                        
                        if (confirmImport) {
                          handleLoadVLFileWrapper(result.data);
                        }
                      }
                    } catch (error) {
                      showToast('Error importing VL file: ' + error.message, 'error');
                    }
                  }}
                  className="w-full px-1 py-0.5 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 transition-colors"
                  title="Import Voice Leader arrangement from file"
                >
                  Import VL
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Measure Grid */}
        <div className="mb-6">
          <MeasureGrid
            measures={measures}
            onMeasureChange={(newMeasures) => {
              setAppState(prev => ({ ...prev, measures: newMeasures }));
              // Smart auto-refresh: only for reasonably-sized progressions
              const totalChords = newMeasures.reduce((count, measure) => 
                count + measure.slots.filter(slot => slot.chord).length, 0
              );
              
              if (totalChords <= 50) {
                setTimeout(() => {
                  smartRecalculateProgressionWrapper();
                }, 100);
              }
            }}
            timeSignature={timeSignature}
            onSlotClick={handleSlotClickWrapper}
            displayMode={displayMode}
            useSymbols={useSymbols}
            currentPlayingSlot={currentPlayingSlot}
            tonalCenter={tonalCenter}
            onReset={() => setShowMeasureResetDialog(true)}
            onDisplayModeChange={(newDisplayMode) => setAppState(prev => ({ ...prev, displayMode: newDisplayMode }))}
            onToggleSymbols={() => setAppState(prev => ({ ...prev, useSymbols: !prev.useSymbols }))}
          />
        </div>

        {/* Voice Leading Directional Controls - Unified UI */}
        {isPro && (
          <div className="mb-6">
            <VLDirectionalControls
              fretStart={fretStart}
              fretRange={fretRange}
              jumpSize={jumpSize}
              resultsPerFret={resultsPerFret}
              isCalculating={isCalculating}
              useFavorites={useFavorites}
              onDirectionSelect={handleDirectionalSelection}
              onFretStartChange={setFretStart}
              onFretRangeChange={setFretRange}
              onJumpSizeChange={setJumpSize}
              onResultsPerFretChange={(value) => setAppState(prev => ({...prev, resultsPerFret: value}))}
              onToggleUseFavorites={handleToggleUseFavorites}
              className="max-w-2xl mx-auto"
            />
          </div>
        )}

        {/* Resulting Tablature */}
        {results.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Resulting Tablature</h2>
            </div>
            <ProgressionTablature
              progression={results}
              alternativesByStep={appState.alternativesByStep}
              onPlayChord={handlePlayChordWrapper}
              onChordClick={() => {}}
              onManualEditClick={handleOpenManualEdit}
              onCycleAlternative={handleCycleAlternativeWrapper}
              onToggleString={handleToggleStringWrapper}
              onBulkUpdateChord={handleBulkUpdateChord}
              selectedCopedent={selectedCopedent}
              displayMode={displayMode}
              useSymbols={useSymbols}
              tonalCenter={tonalCenter}
              measures={measures}
              onToggleAllStrings={handleToggleAllStringsWrapper}
              maskedStrings={maskedStrings}
              stringOrderReversed={stringOrderReversed}
              onStringMask={handleStringMaskWrapper}
              onStringOrderSwap={handleStringOrderSwap}
              onExportToPdf={handleExportToPdf}
              onResetResults={() => setShowTablatureResetDialog(true)}
              // Voice Leading Optimization props
              lockedVoicings={lockedVoicings}
              onToggleLock={handleToggleLock}
              // Favorite chord props
              onToggleFavorite={handleToggleFavorite}
              currentCopedent={selectedCopedent}
              // Removed old scoring system props
              onOpenAlternativesModal={handleOpenAlternativesModal}
            />
          </div>
        )}
      </div>

      {/* Chord Selection Menus */}
      <RadialChordMenu
        isOpen={isRadialMenuOpen}
        onClose={() => setIsRadialMenuOpen(false)}
        onChordSelect={handleChordSelectWrapper}
        onMoreChordsClick={handleMoreChordsClick}
        onEraseChord={handleEraseChordWrapper}
        tonalCenter={tonalCenter}
        position={radialMenuPosition}
        onCopyMeasures={handleCopyMeasuresWrapper}
        onPasteMeasures={handlePasteMeasuresWrapper}
        measures={measures}
        selectedSlot={selectedSlot}
        copiedMeasures={copiedMeasures}
      />

      <ExtendedChordMenu
        isOpen={isExtendedMenuOpen}
        onClose={() => setIsExtendedMenuOpen(false)}
        onChordSelect={handleChordSelectWrapper}
        tonalCenter={tonalCenter}
        position={radialMenuPosition}
      />

      <ProgressionSelectionMenu
        isOpen={isProgressionMenuOpen}
        onClose={() => setIsProgressionMenuOpen(false)}
        onProgressionSelect={handleProgressionSelect}
        position={progressionMenuPosition}
      />

      {/* Interval Filtering Modal */}
      <ManualEditModal 
        isOpen={isManualEditModalOpen} 
        onClose={() => setIsManualEditModalOpen(false)} 
        chordType={editingChordType}
        uniqueChordIntervals={uniqueChordIntervals}
        activeIntervalFilters={chordIntervalFilters[editingChordIndex] || uniqueChordIntervals}
        onIntervalToggle={handleIntervalToggle}
        onRefreshResults={handleRefreshChordWithFiltersWrapper}
      />

      {/* Time Signature Change Confirmation Dialog */}
      {showTimeSignatureDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Time Signature?</h3>
            <p className="text-gray-600 mb-6">
              Changing the time signature will clear all existing chords in your progression. 
              Are you sure you want to continue?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowTimeSignatureDialog(false);
                  setPendingTimeSignature(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTimeSignatureChange}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Yes, Change & Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Voice Leader Confirmation Dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Reset Voice Leader?</h3>
            <p className="text-gray-600 mb-6">
              This will reset the entire Voice Leader mode to its default state, including all 
              settings, chords, and calculated results. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowResetDialog(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Measures Confirmation Dialog */}
      {showMeasureResetDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Clear Progression?</h3>
            <p className="text-gray-600 mb-6">
              This will clear all chords from the measure grid and remove all calculated 
              tablature results. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowMeasureResetDialog(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMeasureResetConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Tablature Results Confirmation Dialog */}
      {showTablatureResetDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Clear Chord Results?</h3>
            <p className="text-gray-600 mb-6">
              This will clear all calculated tablature results while keeping your chord progression intact. 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowTablatureResetDialog(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTablatureResetConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Yes, Clear Results
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Save Progression Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Save Progression</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progression Name
              </label>
              <input
                type="text"
                value={saveProgressionName}
                onChange={(e) => setSaveProgressionName(e.target.value)}
                placeholder="Enter progression name"
                maxLength={50}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && confirmSaveProgressionWrapper()}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={saveProgressionCategory}
                onChange={(e) => setSaveProgressionCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {getAvailableCategories().map(categoryName => (
                  <option key={categoryName} value={categoryName}>{categoryName}</option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveProgressionName('');
                  setSaveProgressionCategory('Custom');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSaveProgressionWrapper}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Leading Alternatives Modal */}
      <VoiceLeadingAlternativesModal
        isOpen={alternativesModalOpen}
        onClose={() => setAlternativesModalOpen(false)}
        chordIndex={alternativesModalData.chordIndex}
        currentVoicing={alternativesModalData.currentVoicing}
        chord={alternativesModalData.chord}
        previousVoicing={alternativesModalData.chordIndex > 0 ? results[alternativesModalData.chordIndex - 1] : null}
        nextVoicing={alternativesModalData.chordIndex < results.length - 1 ? results[alternativesModalData.chordIndex + 1] : null}
        selectedCopedent={selectedCopedent}
        resultsPerFret={resultsPerFret}
        isPro={isPro}
        onSelectAlternative={handleSelectAlternative}
        // Removed old directionalHints prop
        useSymbols={useSymbols}
      />

      {/* VL File Management Modal */}
      <VLFileModal
        isOpen={isVLModalOpen}
        onClose={() => setIsVLModalOpen(false)}
        onLoadVLFile={handleLoadVLFileWrapper}
        mode={vlModalMode}
      />

      {/* Save VL File Modal */}
      {isSaveModalOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
            onClick={() => setIsSaveModalOpen(false)}
          />
          
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl border border-gray-300 w-full max-w-md">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">Save VL Arrangement</h3>
                <button
                  onClick={() => setIsSaveModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={saveFormData.name}
                    onChange={(e) => setSaveFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter arrangement name"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={saveFormData.description}
                    onChange={(e) => setSaveFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of the arrangement"
                    rows={3}
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                  <input
                    type="text"
                    value={saveFormData.author}
                    onChange={(e) => setSaveFormData(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your name"
                    maxLength={30}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={saveFormData.category}
                    onChange={(e) => setSaveFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {getAllCategories().map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags <span className="text-gray-500">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={saveFormData.tags}
                    onChange={(e) => setSaveFormData(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="jazz, ballad, practice"
                    maxLength={100}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSaveVLFile}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Save Arrangement
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
});

export default VoiceLeader;