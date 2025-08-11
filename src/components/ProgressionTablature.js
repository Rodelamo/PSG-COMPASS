// src/components/ProgressionTablature.js

import React, { useState, useRef } from 'react';
import { formatControlCombination } from '../logic/CopedentUtils';
import { calculateFrettedNotesWithEffects } from '../logic/ChordCalculator';
import { CHORD_TYPES } from '../data/DefaultChordTypes';
import StringToggleButton from './StringToggleButton';
import SoundService from '../logic/SoundService';
import { formatChordName } from '../utils/ChordFormatting';
import { getRomanNumeral, getNashvilleNumber } from '../utils/ChordAnalysis';
import { isFavoriteChord, generateFavoriteId } from '../utils/FavoriteChordUtils';
import {
  getAllCustomizations,
  setCurrentCustomization,
  addCustomizationToFavorite,
  removeCustomizationFromFavorite,
  generateSmartCustomizationName
} from '../utils/FavoriteChordStorage';
import StarToggleButton from './StarToggleButton';
import MultiCustomizationButton from './MultiCustomizationButton';
import ExpandableManagementPanel from './ExpandableManagementPanel';
import SaveCustomizationModal from './SaveCustomizationModal';
import { useToast } from '../App';

// Helper function to match voicings by structural properties (ignoring color button states)
const findVoicingIndex = (alternatives, currentVoicing) => {
  return alternatives?.findIndex(v => 
    v.fret === currentVoicing.fret && 
    JSON.stringify(v.pedalCombo) === JSON.stringify(currentVoicing.pedalCombo) && 
    JSON.stringify(v.leverCombo) === JSON.stringify(currentVoicing.leverCombo) && 
    JSON.stringify(v.mecCombo) === JSON.stringify(currentVoicing.mecCombo)
  ) || -1;
};

// Icons copied from FretboardVisualizer
const ArpIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3">
        <path d="M6 18H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M9 14H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M15 6H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

const PluckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3">
        <path d="M7 6H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M7 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M7 14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M7 18H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
    </svg>
);

const SwapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
);

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const UnlockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
);

// Removed DirectionUpIcon, DirectionDownIcon, DirectionMixedIcon - no longer needed

const CompareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
);

// Calculate string availability for each string in a voicing
// eslint-disable-next-line no-unused-vars
const calculateStringAvailability = (voicing, chordIndex, selectedCopedent) => {
  const availability = {};
  
  if (!voicing || !voicing.notes) return availability;
  
  // First, calculate what ALL strings would produce at this fret/pedal/lever combination
  const chordRoot = voicing.chordName?.split(' ')[0] || 'C';
  const rootNoteWithOctave = `${chordRoot}4`;
  
  const allStringNotes = calculateFrettedNotesWithEffects(
    voicing.selectedCopedent?.strings || [], 
    voicing.selectedCopedent || {}, 
    voicing.pedalCombo || [], 
    voicing.leverCombo || [], 
    voicing.mecCombo || [], 
    rootNoteWithOctave, 
    voicing.fret
  );
  
  // For each string, determine its availability and played status
  allStringNotes.forEach(stringNote => {
    const existingNote = voicing.notes.find(n => n.stringId === stringNote.stringId);
    
    availability[stringNote.stringId] = {
      isPlayed: existingNote ? existingNote.isPlayedInVoicing : false,
      isAvailable: stringNote.note && stringNote.note !== 'N/A',
      note: stringNote
    };
  });
  
  return availability;
};

// Removed duplicate calculateUnisonGroups function - proper version defined later in file

function ProgressionTablature({ 
  progression, 
  stringIds, 
  alternativesByStep, 
  onPlayChord, 
  onChordClick, 
  onManualEditClick, 
  onCycleAlternative, 
  onToggleString, 
  selectedCopedent,
  displayMode = 'names', // 'names', 'roman', 'nashville'
  useSymbols = false,
  tonalCenter = 'C',
  measures = [],
  onToggleAllStrings, // New prop for 'TG' button functionality
  maskedStrings = [], // New prop for string masking
  stringOrderReversed = false, // New prop for string order
  onStringMask, // New prop for string masking handler
  onStringOrderSwap, // New prop for string order swap handler
  onExportToPdf, // New prop for PDF export handler
  onResetResults, // New prop for reset tablature results handler
  // Voice Leading Optimization props
  lockedVoicings = [], // Array of locked chord indices
  onToggleLock, // Handler for lock/unlock functionality
  onOpenAlternativesModal, // Handler for opening alternatives comparison modal
  // Favorite chord props
  onToggleFavorite,
  currentCopedent,
  // Bulk chord update function for customizations
  onBulkUpdateChord
}) {
  // eslint-disable-next-line no-unused-vars
  const [playingChordIndex, setPlayingChordIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingNotes, setPlayingNotes] = useState(new Set()); // Track individual playing notes
  const showToast = useToast();
  
  // Multi-customization state for each chord in progression
  const [chordCustomizations, setChordCustomizations] = useState({}); // { chordIndex: [customizations] }
  const [currentCustomizations, setCurrentCustomizations] = useState({}); // { chordIndex: customizationId }

  // Wrapper for cycle alternative that includes customization state
  const handleCycleAlternativeWithCustomizations = (chordIndex, direction) => {
    // Pass current customizations state to help navigation know about active customizations
    onCycleAlternative(chordIndex, direction, currentCustomizations);
  };
  const [managementPanelOpen, setManagementPanelOpen] = useState(null); // chordIndex or null
  const [saveModalOpen, setSaveModalOpen] = useState(null); // chordIndex or null
  
  // Track if we're in the middle of a bulk update to prevent state resets
  const isBulkUpdating = useRef(false);

  // Chord name formatting now uses centralized utility

  // Get display for analysis modes - now uses centralized ChordAnalysis with "Key is King" logic
  const getAnalysisDisplay = (chordName) => {
    if (!chordName) return '';
    
    // Parse chord name to chord object format expected by ChordAnalysis
    const parts = chordName.split(' ');
    const root = parts[0];
    const type = parts.slice(1).join(' ') || 'Major Triad';
    
    const chordObj = { root, type };
    
    switch (displayMode) {
      case 'roman':
        return getRomanNumeral(chordObj, tonalCenter);
      case 'nashville':
        return getNashvilleNumber(chordObj, tonalCenter);
      default:
        return '';
    }
  };

  // Play functions copied from FretboardVisualizer
  const handlePlayArp = (voicing, index) => {
    if (isPlaying) return;
    const notesToPlay = voicing.notes.filter(n => n.isPlayedInVoicing && !maskedStrings.includes(n.stringId)).sort((a, b) => b.stringId - a.stringId);
    if (notesToPlay.length === 0) return;
    
    setIsPlaying(true);
    setPlayingChordIndex(index);
    SoundService.resumeAudioContext();
    
    let delay = 0;
    const strumSpeedMs = 333; 
    notesToPlay.forEach(note => {
      setTimeout(() => {
        SoundService.playSingleNote(note.finalNote, 1.5);
      }, delay);
      delay += strumSpeedMs;
    });
    
    setTimeout(() => {
      setPlayingChordIndex(null);
      setIsPlaying(false);
    }, delay + 300);
  };

  const handlePlayPluck = (voicing, index) => {
    if (isPlaying) return;
    const notesToPlay = voicing.notes.filter(n => n.isPlayedInVoicing && !maskedStrings.includes(n.stringId));
    if (notesToPlay.length === 0) return;
    
    setIsPlaying(true);
    setPlayingChordIndex(index);
    SoundService.resumeAudioContext();
    
    SoundService.playBlockChord(notesToPlay);
    
    setTimeout(() => {
      setPlayingChordIndex(null);
      setIsPlaying(false);
    }, 1000);
  };

  // Individual note playback function (copied from FretboardVisualizer)
  const handlePlayIndividualNote = (note, chordIndex, stringId) => {
    if (!note || !note.isPlayedInVoicing || !note.finalNote || maskedStrings.includes(stringId)) return;
    
    const noteKey = `${chordIndex}-${stringId}`;
    if (playingNotes.has(noteKey)) return; // Prevent multiple plays of same note
    
    SoundService.resumeAudioContext();
    setPlayingNotes(prev => new Set([...prev, noteKey]));
    SoundService.playSingleNote(note.finalNote, 1.5);
    
    setTimeout(() => {
      setPlayingNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(noteKey);
        return newSet;
      });
    }, 300);
  };

  // Load customizations for all favorite chords in progression
  React.useEffect(() => {
    // Skip if we're in the middle of a bulk update to prevent resetting customization states
    if (!onToggleFavorite || !currentCopedent || isBulkUpdating.current) return;

    const newChordCustomizations = {};
    const newCurrentCustomizations = {};

    progression.forEach((voicing, index) => {
      const isFav = isFavoriteChord(currentCopedent.id, voicing);
      if (isFav) {
        // Extract chord type and combo for ID generation
        const chordType = voicing.selectedChordType || voicing.chordName.replace(/^[A-G][#♯b♭𝄫𝄪]*\s*/, '').trim();
        const combo = {
          pedalCombo: voicing.pedalCombo || [],
          leverCombo: voicing.leverCombo || [],
          mecCombo: voicing.mecCombo || []
        };
        
        const favoriteId = generateFavoriteId(chordType, combo);
        const allCustomizations = getAllCustomizations(currentCopedent.id, favoriteId);
        const customizations = allCustomizations.filter(c => c.id !== 0); // Exclude default
        
        newChordCustomizations[index] = customizations;
        // CRITICAL FIX: Preserve existing customization state if it exists, don't always reset to 0
        newCurrentCustomizations[index] = currentCustomizations[index] || 0;
      }
    });

    setChordCustomizations(newChordCustomizations);
    setCurrentCustomizations(newCurrentCustomizations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progression, currentCopedent, onToggleFavorite]);

  // Apply loaded customizations automatically
  React.useEffect(() => {
    Object.keys(currentCustomizations).forEach(chordIndexStr => {
      const chordIndex = parseInt(chordIndexStr);
      const customizationId = currentCustomizations[chordIndex];
      if (customizationId && customizationId !== 0) {
        // Apply this customization (but don't trigger infinite loops)
        setTimeout(() => applyCustomizationToVoicing(chordIndex, customizationId), 100);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chordCustomizations]); // Only when customizations data loads

  // Multi-customization handlers for each chord
  const handleCustomizationCycle = (chordIndex, nextCustomizationId) => {
    const voicing = progression[chordIndex];
    if (!voicing || !currentCopedent) return;
    
    // Extract chord type and combo for ID generation
    const chordType = voicing.selectedChordType || voicing.chordName.replace(/^[A-G][#♯b♭𝄫𝄪]*\s*/, '').trim();
    const combo = {
      pedalCombo: voicing.pedalCombo || [],
      leverCombo: voicing.leverCombo || [],
      mecCombo: voicing.mecCombo || []
    };
    
    const favoriteId = generateFavoriteId(chordType, combo);
    
    // Set new current customization
    setCurrentCustomization(currentCopedent.id, favoriteId, nextCustomizationId);
    setCurrentCustomizations(prev => ({
      ...prev,
      [chordIndex]: nextCustomizationId
    }));
    
    // Apply the customization to the voicing display
    applyCustomizationToVoicing(chordIndex, nextCustomizationId);
  };

  const applyCustomizationToVoicing = (chordIndex, customizationId) => {
    // Use bulk update if available, fallback to individual toggles
    const useBulkUpdate = onBulkUpdateChord && typeof onBulkUpdateChord === 'function';
    
    const voicing = progression[chordIndex];
    if (!voicing) return;

    // Get the customization data
    const customizations = chordCustomizations[chordIndex] || [];
    const customization = customizations.find(c => c.id === customizationId);
    
    if (customizationId === 0 || !customization) {
      // Reset to original chord tone state (like CF does with setModifiedVoicing(voicing))
      if (useBulkUpdate) {
        // Set flag to prevent useEffect from resetting state
        isBulkUpdating.current = true;
        
        // Simple reset like CF: keep existing note structure, just reset isPlayedInVoicing
        const restoredNotes = voicing.notes.map(note => ({
          ...note,
          isPlayedInVoicing: note.isChordTone // Simple reset: chord tones = playing, others = not playing
        }));
        
        const restoredVoicing = {
          ...voicing,
          notes: restoredNotes
        };
        
        onBulkUpdateChord(chordIndex, restoredVoicing);
        
        // Clear flag after a short delay to allow state to settle
        setTimeout(() => {
          isBulkUpdating.current = false;
        }, 100);
      } else {
        // Fallback to individual toggles - reset each note to chord tone state
        voicing.notes.forEach(note => {
          const shouldBePlaying = note.isChordTone;
          if (note.isPlayedInVoicing !== shouldBePlaying && onToggleString) {
            onToggleString(chordIndex, note.stringId);
          }
        });
      }
      return;
    }

    // Apply customization by updating string states to match saved color states
    if (customization.colorStates) {
      if (useBulkUpdate) {
        // Set flag to prevent useEffect from resetting state
        isBulkUpdating.current = true;
        
        // FIXED: Start from current voicing structure but reset chord tones, then apply customization
        const customizedNotes = voicing.notes.map(note => {
          // First, reset this note to its natural chord tone state
          let isPlayedInVoicing = note.isChordTone;
          
          // Then, apply customization if it exists for this string
          const colorState = customization.colorStates[note.stringId];
          if (colorState && colorState.currentState === 'grey') {
            // This string should be grey according to customization
            isPlayedInVoicing = false;
          }
          
          return { ...note, isPlayedInVoicing };
        });
        
        const customizedVoicing = { ...voicing, notes: customizedNotes };
        onBulkUpdateChord(chordIndex, customizedVoicing);
        
        // Clear flag after a short delay to allow state to settle
        setTimeout(() => {
          isBulkUpdating.current = false;
        }, 100);
      } else {
        // Fallback to individual toggles
        // First, ensure all chord tones are playing (reset to default)
        voicing.notes.forEach(note => {
          if (note.isChordTone && !note.isPlayedInVoicing && onToggleString) {
            // Should be playing but isn't - turn it on
            onToggleString(chordIndex, note.stringId);
          } else if (!note.isChordTone && note.isPlayedInVoicing && onToggleString) {
            // Should not be playing but is - turn it off
            onToggleString(chordIndex, note.stringId);
          }
        });
        
        // Then apply customization changes
        Object.keys(customization.colorStates).forEach(stringId => {
          const colorState = customization.colorStates[stringId];
          const stringIdNum = parseInt(stringId);
          const currentNote = voicing.notes.find(n => n.stringId === stringIdNum);
          
          if (colorState.currentState === 'grey' && currentNote && currentNote.isPlayedInVoicing && onToggleString) {
            // Should be grey but currently playing - toggle it off
            onToggleString(chordIndex, stringIdNum);
          }
        });
      }
    }
  };

  const handleSaveCustomization = (chordIndex) => {
    setSaveModalOpen(chordIndex);
  };

  const handleSaveCustomizationConfirm = async (chordIndex, customizationName) => {
    const voicing = progression[chordIndex];
    if (!voicing || !currentCopedent) return;

    // Extract chord type and combo for ID generation
    const chordType = voicing.selectedChordType || voicing.chordName.replace(/^[A-G][#♯b♭𝄫𝄪]*\s*/, '').trim();
    const combo = {
      pedalCombo: voicing.pedalCombo || [],
      leverCombo: voicing.leverCombo || [],
      mecCombo: voicing.mecCombo || []
    };

    const favoriteId = generateFavoriteId(chordType, combo);
    
    // Reconstruct original chord to detect what was modified (turned grey)
    const chordRoot = voicing.chordName?.split(' ')[0] || 'C';
    const rootNoteWithOctave = `${chordRoot}4`;
    
    // Calculate what the original chord should look like
    const originalStringNotes = calculateFrettedNotesWithEffects(
      selectedCopedent.strings,
      selectedCopedent,
      voicing.pedalCombo || [],
      voicing.leverCombo || [],
      voicing.mecCombo || [],
      rootNoteWithOctave,
      voicing.fret
    );
    
    // Detect color state changes by comparing current vs calculated original
    const colorStates = {};
    const mutedStrings = [];
    
    voicing.notes.forEach(note => {
      const originalNote = originalStringNotes.find(n => n.stringId === note.stringId);
      if (originalNote && originalNote.isChordTone) {
        // This string should have been green/yellow originally
        if (!note.isPlayedInVoicing) {
          // But now it's grey (muted)
          colorStates[note.stringId] = {
            originalState: note.isUnison ? 'yellow' : 'green',
            currentState: 'grey'
          };
          mutedStrings.push(note.stringId);
        }
      }
    });

    // Check if there are any actual changes (prevent saving "all default" customizations)
    if (Object.keys(colorStates).length === 0) {
      showToast('No changes to save. Customizations must have at least one grey note.', 'info');
      setSaveModalOpen(null);
      return;
    }
    
    const customizationData = {
      name: customizationName,
      description: generateSmartCustomizationName(colorStates, voicing),
      colorStates,
      mutedStrings
    };

    const success = addCustomizationToFavorite(
      currentCopedent.id,
      favoriteId,
      customizationData
    );

    if (success) {
      // Reload customizations
      const allCustomizations = getAllCustomizations(currentCopedent.id, favoriteId);
      const customizations = allCustomizations.filter(c => c.id !== 0);
      setChordCustomizations(prev => ({
        ...prev,
        [chordIndex]: customizations
      }));
      showToast(`Customization "${customizationName}" saved for ${voicing.chordName}!`, 'success');
    } else {
      showToast('Failed to save customization. Please try again.', 'error');
    }

    setSaveModalOpen(null);
  };

  const handleDeleteCustomization = (chordIndex, customizationId) => {
    const voicing = progression[chordIndex];
    if (!voicing || !currentCopedent || customizationId === 0) return;

    // Extract chord type and combo for ID generation
    const chordType = voicing.selectedChordType || voicing.chordName.replace(/^[A-G][#♯b♭𝄫𝄪]*\s*/, '').trim();
    const combo = {
      pedalCombo: voicing.pedalCombo || [],
      leverCombo: voicing.leverCombo || [],
      mecCombo: voicing.mecCombo || []
    };

    const favoriteId = generateFavoriteId(chordType, combo);
    const customizations = chordCustomizations[chordIndex] || [];
    const customization = customizations.find(c => c.id === customizationId);
    
    if (!customization) return;

    if (window.confirm(`Delete customization "${customization.name}"? This cannot be undone.`)) {
      const success = removeCustomizationFromFavorite(
        currentCopedent.id,
        favoriteId,
        customizationId
      );

      if (success) {
        // Reload customizations
        const allCustomizations = getAllCustomizations(currentCopedent.id, favoriteId);
        const updatedCustomizations = allCustomizations.filter(c => c.id !== 0);
        setChordCustomizations(prev => ({
          ...prev,
          [chordIndex]: updatedCustomizations
        }));
        
        // Reset to default if deleted customization was active
        if (currentCustomizations[chordIndex] === customizationId) {
          setCurrentCustomizations(prev => ({
            ...prev,
            [chordIndex]: 0
          }));
        }
      }
    }
  };

  if (!progression || progression.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center text-gray-500">
        <p>No results to display. Calculate a progression to see the tablature here.</p>
      </div>
    );
  }

  // Get all strings from copedent, not just selected ones
  const allStrings = selectedCopedent.strings.sort((a, b) => a.id - b.id);

  // Function to calculate dynamic controls display (copied from FretboardVisualizer)
  const getDisplayedControls = (voicing) => {
    const activeNotes = voicing.notes.filter(n => n.isPlayedInVoicing && !maskedStrings.includes(n.stringId));
    const activeControlIds = new Set(activeNotes.flatMap(n => n.activeControls));
    
    const pedals = [];
    const levers = [];
    const mecs = [];

    activeControlIds.forEach(id => {
        if (id.startsWith('P')) {
            pedals.push(id);
        } else if (id.startsWith('M')) {
            mecs.push(id);
        } else {
            levers.push(id);
        }
    });

    return { 
        pedalCombo: pedals.sort(), 
        leverCombo: levers.sort(), 
        mecCombo: mecs.sort() 
    };
  };

  // Calculate unison groups for a voicing (similar to FretboardVisualizer)
  // IMPORTANT: Use isChordTone to ensure unison groups stay stable when strings are toggled
  const calculateUnisonGroups = (voicing) => {
    if (!voicing || !voicing.notes || !Array.isArray(voicing.notes)) {
      console.warn('calculateUnisonGroups: Invalid voicing structure:', voicing);
      return [];
    }
    
    const pitches = new Map();
    voicing.notes.forEach(note => {
      // Check if note is a potential chord tone (regardless of current toggle state)
      // This ensures unison groups stay consistent even when users toggle strings
      if (note && note.isChordTone && note.finalNote) {
        if (!pitches.has(note.finalNote)) pitches.set(note.finalNote, []);
        pitches.get(note.finalNote).push(note.stringId);
      }
    });
    return Array.from(pitches.entries())
      .filter(([pitch, stringIds]) => stringIds.length > 1)
      .map(([pitch, stringIds]) => ({ pitch, stringIds: stringIds.sort((a,b) => a - b) }));
  };

  // Calculate string availability for all strings at a given voicing
  const calculateStringAvailability = (voicing, chordIndex) => {
    const chordRoot = voicing.chordName?.split(' ')[0] || 'C';
    const chordType = voicing.chordName?.substring(chordRoot.length + 1) || 'Major Triad';
    const chordIntervals = new Set(CHORD_TYPES[chordType] || []);
    const rootNoteWithOctave = `${chordRoot}4`;

    // Calculate what note each string would produce at this fret/pedal/lever combination
    const allStringNotes = calculateFrettedNotesWithEffects(
      allStrings, 
      selectedCopedent, 
      voicing.pedalCombo || [], 
      voicing.leverCombo || [], 
      voicing.mecCombo || [], 
      rootNoteWithOctave, 
      voicing.fret
    );

    const stringAvailability = {};
    
    allStringNotes.forEach(note => {
      const stringId = note.stringId;
      const isCurrentlyPlayed = voicing.notes.some(n => n.stringId === stringId && n.isPlayedInVoicing);
      
      // Check if this string produces a chord tone
      const isChordTone = note.finalNote && !note.isMuted && 
                         chordIntervals.has((note.semitonesFromRoot % 12 + 12) % 12);
      
      stringAvailability[stringId] = {
        isPlayed: isCurrentlyPlayed,
        isAvailable: isChordTone,
        note: note
      };
    });

    return stringAvailability;
  };

  // Get strings to display with proper order
  const stringsToDisplay = stringOrderReversed ? [...allStrings].reverse() : allStrings;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 relative">
      {/* Reset Results Button */}
      {onResetResults && progression && progression.length > 0 && (
        <button
          onClick={onResetResults}
          className="absolute top-4 right-36 px-3 py-2 bg-gray-700 text-white text-sm font-semibold rounded-md hover:bg-gray-600"
          title="Clear chord results"
        >
          Reset
        </button>
      )}
      
      {/* Export to PDF Button */}
      {onExportToPdf && progression && progression.length > 0 && (
        <button
          onClick={() => onExportToPdf(progression)}
          className="absolute top-4 right-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium shadow-md"
          title="Export arrangement to PDF"
        >
          Export to PDF
        </button>
      )}

      {/* String Masking Controls */}
      {onStringMask && (
        <div className="flex flex-col items-center border-b pb-4 mb-4">
          <div className="flex items-center mb-2">
            <label className="text-lg font-medium text-gray-700">String Controls</label>
            {onStringOrderSwap && (
              <button 
                onClick={onStringOrderSwap}
                className="ml-4 p-1.5 bg-gray-200 rounded-full hover:bg-gray-300"
                title="Reverse String Order"
              >
                <SwapIcon />
              </button>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-2">
            {stringsToDisplay.map(string => {
              const isMasked = maskedStrings.includes(string.id);
              return (
                <label 
                  key={string.id} 
                  className={`inline-flex items-center cursor-pointer px-3 py-1 rounded-full border-2 transition-colors ${
                    isMasked 
                      ? 'bg-gray-400 border-gray-400 text-white' 
                      : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={!isMasked} 
                    onChange={() => onStringMask(string.id)} 
                  />
                  <span className="font-medium">S{string.id}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
      
      {/* String toggle color guide */}
      <div className="flex justify-center items-center space-x-4 mb-4 text-xs text-gray-600">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-sm bg-green-500 mr-1.5"></div>
          <span>Played (Click to mute)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-sm bg-yellow-500 mr-1.5"></div>
          <span>Unison Strings</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-sm bg-gray-400 mr-1.5"></div>
          <span>Available (Click to add)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-sm bg-red-500 mr-1.5"></div>
          <span>Unavailable</span>
        </div>
      </div>
      
      {/* Tablature grid with headers */}
      <div className="overflow-x-auto bg-gray-50 rounded-md p-4">
        {/* Control buttons and chord names - inside the same container */}
        <div className="mb-4">
          <div className="inline-flex space-x-0">
            {/* TG column header */}
            <div className="flex-shrink-0 w-10 bg-white"></div>
            {/* String labels column - same width as tablature */}
            <div className="flex-shrink-0 w-16 bg-white"></div>
            
            {/* Progression headers with buttons - matching tablature column widths exactly */}
            {progression.map((voicing, index) => (
              <div key={index} className="inline-flex">
                {/* Chord column - Expanded width for organized buttons */}
                <div className={`flex-shrink-0 w-40 ${index === 0 ? 'border-l' : ''} border-r border-gray-400 bg-white`}>
                  {/* Organized Control Buttons - 3 row layout */}
                  <div className="text-center mb-1 p-2">
                    {/* Row 1: Favorites */}
                    {onToggleFavorite && currentCopedent && (
                      <div className="flex items-center justify-center mb-1 space-x-1">
                        <StarToggleButton
                          chordData={voicing}
                          copedentId={currentCopedent.id}
                          isFavorite={isFavoriteChord(currentCopedent.id, voicing)}
                          onToggle={onToggleFavorite}
                          size="small"
                        />
                        <MultiCustomizationButton
                          currentCustomization={currentCustomizations[index] || 0}
                          customizationCount={chordCustomizations[index]?.length || 0}
                          onCycle={(nextId) => handleCustomizationCycle(index, nextId)}
                          size="small"
                        />
                        <button
                          onClick={() => setManagementPanelOpen(managementPanelOpen === index ? null : index)}
                          className="text-lg hover:scale-110 transition-transform duration-150 focus:outline-none relative"
                          title="Manage customizations"
                        >
                          ⚙️
                          {managementPanelOpen === index && (
                            <ExpandableManagementPanel
                              isOpen={true}
                              customizations={chordCustomizations[index] || []}
                              currentCustomization={currentCustomizations[index] || 0}
                              onSelect={(customizationId) => {
                                handleCustomizationCycle(index, customizationId);
                                setManagementPanelOpen(null);
                              }}
                              onSave={() => handleSaveCustomization(index)}
                              onDelete={(customizationId) => handleDeleteCustomization(index, customizationId)}
                              onClose={() => setManagementPanelOpen(null)}
                              chordName={voicing.chordName}
                            />
                          )}
                        </button>
                      </div>
                    )}
                    
                    {/* Row 2: Navigation + Tools */}
                    <div className="flex items-center justify-center mb-1 space-x-1">
                      <button 
                        onClick={() => handleCycleAlternativeWithCustomizations(index, -1)}
                        disabled={findVoicingIndex(alternativesByStep[index], voicing) <= 0}
                        className="bg-white border border-gray-300 rounded w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black disabled:text-gray-300 disabled:cursor-not-allowed text-xs"
                        title="Previous Voicing"
                      >
                        ◀
                      </button>
                      <button 
                        onClick={() => handleCycleAlternativeWithCustomizations(index, 1)}
                        disabled={findVoicingIndex(alternativesByStep[index], voicing) >= (alternativesByStep[index]?.length - 1)}
                        className="bg-white border border-gray-300 rounded w-6 h-6 flex items-center justify-center text-gray-500 hover:text-black disabled:text-gray-300 disabled:cursor-not-allowed text-xs"
                        title="Next Voicing"
                      >
                        ▶
                      </button>
                      <button 
                        onClick={() => onManualEditClick(voicing, index)}
                        className="bg-white border border-gray-300 rounded w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-600"
                        title={`Filter intervals for ${voicing.chordName}`}
                      >
                        <EditIcon />
                      </button>
                      {onOpenAlternativesModal && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenAlternativesModal(index, voicing);
                          }}
                          className="bg-white border border-gray-300 rounded w-6 h-6 flex items-center justify-center text-purple-600 hover:text-purple-800 text-xs"
                          title="Choose from Chord Pool"
                        >
                          <CompareIcon />
                        </button>
                      )}
                    </div>

                    {/* Row 3: Audio + State */}
                    <div className="flex items-center justify-center space-x-1">
                      <button 
                        onClick={() => handlePlayArp(voicing, index)}
                        disabled={isPlaying}
                        className="bg-white border border-gray-300 rounded-l w-6 h-6 flex items-center justify-center text-green-500 hover:text-green-700 disabled:opacity-50"
                        title={`Play ${voicing.chordName} as Arpeggio`}
                      >
                        <ArpIcon />
                      </button>
                      <button 
                        onClick={() => handlePlayPluck(voicing, index)}
                        disabled={isPlaying}
                        className="bg-white border border-gray-300 border-l-0 rounded-r w-6 h-6 flex items-center justify-center text-green-500 hover:text-green-700 disabled:opacity-50"
                        title={`Play ${voicing.chordName} as Block Chord`}
                      >
                        <PluckIcon />
                      </button>
                      {onToggleLock && (
                        <button 
                          onClick={() => onToggleLock(index)}
                          className={`border border-gray-300 rounded w-6 h-6 flex items-center justify-center text-xs ${
                            lockedVoicings.includes(index)
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-white text-gray-500 hover:text-black'
                          }`}
                          title={lockedVoicings.includes(index) ? 'Unlock voicing - will be changed during recalculation/optimization' : 'Lock voicing - preserve during recalculation and optimization'}
                        >
                          {lockedVoicings.includes(index) ? <LockIcon /> : <UnlockIcon />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Header with chord name and analysis */}
                  <div className="text-center">
                    <div className="bg-white border border-gray-300 border-t-0 rounded-b-lg p-2">
                      {/* Analysis display (Roman/Nashville) above chord name */}
                      {displayMode !== 'names' && (
                        <p className="text-sm font-bold text-gray-600 mb-1" title={getAnalysisDisplay(voicing.chordName)}>
                          {getAnalysisDisplay(voicing.chordName)}
                        </p>
                      )}
                      {/* Chord name - sync with MeasureGrid display */}
                      <p className="font-bold text-gray-800 text-sm truncate" title={voicing.chordName}>
                        {formatChordName(voicing.chordName, useSymbols)}
                      </p>
                      <p className="text-xs text-blue-700 font-semibold truncate" title={formatControlCombination(getDisplayedControls(voicing).pedalCombo, getDisplayedControls(voicing).leverCombo, getDisplayedControls(voicing).mecCombo, selectedCopedent)}>
                        {formatControlCombination(getDisplayedControls(voicing).pedalCombo, getDisplayedControls(voicing).leverCombo, getDisplayedControls(voicing).mecCombo, selectedCopedent) || 'Open'}
                      </p>
                      {/* Lock indicator - ONLY useful element preserved */}
                      {lockedVoicings.includes(index) && (
                        <div className="mt-1 flex items-center justify-center">
                          <span className="text-xs text-yellow-600" title="Voicing is locked">🔒</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* String toggle buttons column - immediately right of each chord */}
                <div className="flex-shrink-0 w-8 bg-white border-r border-gray-400"></div>
              </div>
            ))}
            
            {/* String numbers column on the far right */}
            <div className="flex-shrink-0 w-8 bg-white"></div>
          </div>
        </div>
        
        <div className="inline-flex space-x-0">
          {/* TG toggle buttons column on the far left */}
          <div className="flex-shrink-0 w-10 bg-white">
            
            {/* TG toggle buttons for each string */}
            {allStrings.map((string, stringIndex) => {
              const isLastString = stringIndex === allStrings.length - 1;
              const isMasked = maskedStrings.includes(string.id);
              
              return (
                <div key={`all-${string.id}`} className={`relative h-8 border-t border-gray-400 flex items-center justify-center ${stringIndex === 0 ? 'border-t-2' : ''} ${isLastString ? 'border-b-2' : ''}`}>
                  {/* String line background */}
                  <div className="absolute inset-0 border-t-2 border-gray-800"></div>
                  {/* Gray overlay for masked strings */}
                  {isMasked && <div className="absolute inset-0 bg-gray-400 opacity-60 z-5"></div>}
                  <div className="relative z-10">
                    <button
                      onClick={() => !isMasked && onToggleAllStrings && onToggleAllStrings(string.id)}
                      disabled={isMasked}
                      className={`w-6 h-6 text-xs font-semibold rounded border transition-colors ${
                        isMasked 
                          ? 'bg-gray-500 text-gray-300 border-gray-500 cursor-not-allowed' 
                          : 'bg-gray-300 text-gray-600 border-gray-400 hover:bg-gray-400'
                      }`}
                      title={isMasked ? `String ${string.id} is masked` : `Toggle all green/yellow notes for string ${string.id} to OFF/ON`}
                    >
                      TG
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* String labels column */}
          <div className="flex-shrink-0 w-16 bg-white">
            {allStrings.map((string, stringIndex) => {
              const isLastString = stringIndex === allStrings.length - 1;
              return (
                <div key={`label-${string.id}`} className={`relative h-8 border-t border-gray-400 flex items-center justify-center ${stringIndex === 0 ? 'border-t-2' : ''} ${isLastString ? 'border-b-2' : ''}`}>
                  {/* String line background */}
                  <div className="absolute inset-0 border-t-2 border-gray-800"></div>
                  <span className="text-xs font-mono text-gray-600 bg-white px-1 z-10">
                    {string.id} {string.openNote.replace(/\d+$/, '')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progression columns with buttons */}
          {progression.map((voicing, chordIndex) => {
            const stringAvailability = calculateStringAvailability(voicing, chordIndex, selectedCopedent);
            const unisonGroups = calculateUnisonGroups(voicing);
            
            return (
              <div key={chordIndex} className="inline-flex">
                {/* Chord tablature column */}
                <div className={`flex-shrink-0 w-32 ${chordIndex === 0 ? 'border-l' : ''} border-r border-gray-400`}>
                  {allStrings.map((string, stringIndex) => {
                    const note = voicing.notes.find(n => n.stringId === string.id);
                    const isPlayed = note && note.isPlayedInVoicing;
                    const fretNumber = isPlayed ? voicing.fret : '';
                    
                    // Get active controls for this specific string
                    let activeControlsForString = '';
                    if (note && note.activeControls && note.activeControls.length > 0) {
                      const pedalIds = note.activeControls.filter(id => id.startsWith('P'));
                      const leverIds = note.activeControls.filter(id => !id.startsWith('P') && !id.startsWith('M'));
                      const mecIds = note.activeControls.filter(id => id.startsWith('M'));
                      activeControlsForString = formatControlCombination(pedalIds, leverIds, mecIds, selectedCopedent).replace(/[()]/g, '');
                    }
                    
                    const isLastString = stringIndex === allStrings.length - 1;
                    const isMasked = maskedStrings.includes(string.id);
                    
                    return (
                      <div key={string.id} className={`relative h-8 border-t border-gray-400 flex items-center ${stringIndex === 0 ? 'border-t-2' : ''} ${isLastString ? 'border-b-2' : ''}`}>
                        {/* String line background */}
                        <div className="absolute inset-0 border-t-2 border-gray-800"></div>
                        {/* Gray overlay for masked strings */}
                        {isMasked && <div className="absolute inset-0 bg-gray-400 opacity-60 z-5"></div>}
                        
                        {/* Fret number and control indicators - only show if not masked */}
                        <div className="w-full flex items-center relative">
                          {isPlayed && !isMasked && (
                            <>
                              {/* Fret number - left side, consistent position, now clickable */}
                              <div className="absolute left-4">
                                <span 
                                  onClick={() => handlePlayIndividualNote(note, chordIndex, string.id)}
                                  className="font-bold text-sm px-1 z-10 transition-all duration-100 rounded text-gray-900 bg-white cursor-pointer hover:bg-blue-100 hover:text-blue-700"
                                  title={`Click to play ${note.finalNote}`}
                                >
                                  {fretNumber}
                                </span>
                              </div>
                              {/* Control indicators - right side of fret number */}
                              {activeControlsForString && (
                                <div className={`absolute ${fretNumber >= 10 ? 'left-12' : 'left-8'}`}>
                                  <span className="text-xs font-bold text-gray-900 bg-white px-1 z-10">
                                    {activeControlsForString}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* String toggle buttons column - immediately right of chord */}
                <div className="flex-shrink-0 w-8 bg-white border-r border-gray-400">
                  {allStrings.map((string, stringIndex) => {
                    const availability = stringAvailability[string.id] || { isPlayed: false, isAvailable: false, note: null };
                    const isLastString = stringIndex === allStrings.length - 1;
                    const chordRoot = voicing.chordName?.split(' ')[0] || 'C';
                    
                    // Check if this string is part of a unison group
                    const isUnisonString = unisonGroups.some(group => group.stringIds.includes(string.id));
                    const isMasked = maskedStrings.includes(string.id);
                    
                    return (
                      <div key={`button-${string.id}-${chordIndex}`} className={`relative h-8 border-t border-gray-400 flex items-center justify-center ${stringIndex === 0 ? 'border-t-2' : ''} ${isLastString ? 'border-b-2' : ''}`}>
                        {/* String line background */}
                        <div className="absolute inset-0 border-t-2 border-gray-800"></div>
                        {/* Gray overlay for masked strings */}
                        {isMasked && <div className="absolute inset-0 bg-gray-400 opacity-60 z-5"></div>}
                        <div className="relative z-10">
                          <StringToggleButton
                            stringId={string.id}
                            stringNote={availability.note?.finalNote}
                            chordRoot={chordRoot}
                            isPlayed={availability.isPlayed}
                            isAvailable={availability.isAvailable}
                            isUnison={isUnisonString}
                            onClick={(stringId) => !isMasked && onToggleString && onToggleString(chordIndex, stringId)}
                            disabled={isMasked}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* String numbers column on the far right */}
          <div className="flex-shrink-0 w-8 bg-white">
            {allStrings.map((string, stringIndex) => {
              const isLastString = stringIndex === allStrings.length - 1;
              return (
                <div key={`right-${string.id}`} className={`relative h-8 border-t border-gray-400 flex items-center justify-center ${stringIndex === 0 ? 'border-t-2' : ''} ${isLastString ? 'border-b-2' : ''}`}>
                  {/* String line background */}
                  <div className="absolute inset-0 border-t-2 border-gray-800"></div>
                  <span className="text-xs font-mono text-gray-600 bg-white px-1 z-10">{string.id}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Save Customization Modal */}
      {saveModalOpen !== null && (
        <SaveCustomizationModal
          isOpen={true}
          onSave={(customizationName) => handleSaveCustomizationConfirm(saveModalOpen, customizationName)}
          onCancel={() => setSaveModalOpen(null)}
          suggestedName={`${progression[saveModalOpen]?.chordName} Custom`}
          currentCount={chordCustomizations[saveModalOpen]?.length || 0}
          chordName={progression[saveModalOpen]?.chordName || 'Chord'}
        />
      )}
    </div>
  );
}

export default ProgressionTablature;