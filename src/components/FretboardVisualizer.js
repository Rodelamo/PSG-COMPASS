// src/components/FretboardVisualizer.js

import React, { useState, useEffect, useMemo } from 'react';
import SoundService from '../logic/SoundService';
import { getContextualIntervalName, getEnharmonicNoteName } from '../logic/NoteUtils';
import { formatControlCombination } from '../logic/CopedentUtils';
import { findScalesForChord, calculateFrettedNotesWithEffects } from '../logic/ChordCalculator';
import { useToast } from '../App';
import { SHARP_TO_FLAT_MAP, FLAT_TO_SHARP_MAP } from '../data/Notes';
import StarToggleButton from './StarToggleButton';
import MultiCustomizationButton from './MultiCustomizationButton';
import ExpandableManagementPanel from './ExpandableManagementPanel';
import SaveCustomizationModal from './SaveCustomizationModal';
import {
  getAllCustomizations,
  setCurrentCustomization,
  addCustomizationToFavorite,
  removeCustomizationFromFavorite,
  generateSmartCustomizationName
} from '../utils/FavoriteChordStorage';
import { generateFavoriteId } from '../utils/FavoriteChordUtils';

// NEW: SVG Icons for the new split play button
const ArpIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1">
        <path d="M6 18H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M9 14H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M15 6H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);
const PluckIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1">
        <path d="M7 6H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M7 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M7 14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M7 18H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);


const getRootFromChordName = (chordName) => {
    const match = chordName.match(/^[A-G][#b]?/);
    return match ? match[0] : 'C';
}

const ResultColorGuide = () => (
    <div className="flex justify-center items-center space-x-3 mt-4 mb-3 text-xs text-gray-600">
        <div className="flex items-center"><div className="w-3 h-3 rounded-sm bg-green-500 mr-1.5"></div><span>Played (Click to Mute)</span></div>
        <div className="flex items-center"><div className="w-3 h-3 rounded-sm bg-yellow-500 mr-1.5"></div><span>Unison Strings</span></div>
        <div className="flex items-center"><div className="w-3 h-3 rounded-sm bg-gray-400 mr-1.5"></div><span>Muted (Click to Activate)</span></div>
        <div className="flex items-center"><div className="w-3 h-3 rounded-sm bg-red-500 mr-1.5"></div><span>Unused in Voicing</span></div>
    </div>
);


function FretboardVisualizer({ 
  voicing, 
  chordName, 
  selectedForPdf, 
  onTogglePdfSelect, 
  onFindScales, 
  isPdfMode = false,
  isFavorite = false,
  onToggleFavorite,
  currentCopedent
}) {
  const showToast = useToast();
  const [modifiedVoicing, setModifiedVoicing] = useState(voicing);
  const [playingStringIds, setPlayingStringIds] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Multi-customization state
  const [customizations, setCustomizations] = useState([]);
  const [currentCustomization, setCurrentCustomizationState] = useState(0);
  const [isManagementPanelOpen, setIsManagementPanelOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const originalRoot = useMemo(() => getRootFromChordName(chordName), [chordName]);
  const isEnharmonic = useMemo(() => originalRoot.includes('#') || originalRoot.includes('b'), [originalRoot]);
  const [useSharps, setUseSharps] = useState(originalRoot.includes('#') || !originalRoot.includes('b'));
  
  const displayedRoot = useMemo(() => {
    if (!isEnharmonic) return originalRoot;
    return useSharps
      ? (FLAT_TO_SHARP_MAP[originalRoot] || originalRoot)
      : (SHARP_TO_FLAT_MAP[originalRoot] || originalRoot);
  }, [originalRoot, isEnharmonic, useSharps]);

  const displayedChordName = useMemo(() => chordName.replace(originalRoot, displayedRoot), [chordName, originalRoot, displayedRoot]);

  useEffect(() => {
    setModifiedVoicing(voicing);
  }, [voicing]);

  const unisonGroups = useMemo(() => {
    const pitches = new Map();
    voicing.notes.forEach(note => {
      if (note.isPlayedInVoicing) {
        if (!pitches.has(note.finalNote)) pitches.set(note.finalNote, []);
        pitches.get(note.finalNote).push(note.stringId);
      }
    });
    return Array.from(pitches.entries())
      .filter(([pitch, stringIds]) => stringIds.length > 1)
      .map(([pitch, stringIds]) => ({ pitch, stringIds: stringIds.sort((a,b) => a - b) }));
  }, [voicing]);

  const displayedControls = useMemo(() => {
    const activeNotes = modifiedVoicing.notes.filter(n => n.isPlayedInVoicing);
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
  }, [modifiedVoicing.notes]);

  // Load customizations when favorite status changes (after displayedControls is defined)
  useEffect(() => {
    if (isFavorite && currentCopedent && voicing) {
      // Extract chord type from chord name
      const chordType = voicing.selectedChordType || chordName.replace(/^[A-G][#♯b♭𝄫𝄪]*\s*/, '').trim();
      
      // Build combo from ORIGINAL voicing, not displayedControls
      // displayedControls changes when notes are greyed, but favoriteId should stay same
      const combo = {
        pedalCombo: voicing.pedalCombo || [],
        leverCombo: voicing.leverCombo || [],
        mecCombo: voicing.mecCombo || []
      };
      
      const favoriteId = voicing.favoriteId || generateFavoriteId(chordType, combo);
      const allCustomizations = getAllCustomizations(currentCopedent.id, favoriteId);
      setCustomizations(allCustomizations.filter(c => c.id !== 0)); // Exclude default
    }
  }, [isFavorite, currentCopedent, voicing, chordName, displayedControls]);

  const getControlComboText = () => {
    return formatControlCombination(
        displayedControls.pedalCombo, 
        displayedControls.leverCombo, 
        displayedControls.mecCombo, 
        modifiedVoicing.selectedCopedent
    );
  };

  const stringsUsedCount = modifiedVoicing.notes.filter(n => n.isPlayedInVoicing).length;

  const handleEnharmonicToggle = () => setUseSharps(prev => !prev);

  const handleStringToggle = (stringIdToToggle) => {
    const newNotes = modifiedVoicing.notes.map(note => {
      if (note.stringId === stringIdToToggle) {
        const originalNoteVoicing = voicing.notes.find(n => n.stringId === stringIdToToggle);
        if (originalNoteVoicing.isPlayedInVoicing) {
            return { ...note, isPlayedInVoicing: !note.isPlayedInVoicing };
        }
      }
      return note;
    });
    setModifiedVoicing(prev => ({ ...prev, notes: newNotes }));
  };

  const handleUnisonChange = (pitch, stringIdToKeep) => {
    const unisonGroup = unisonGroups.find(g => g.pitch === pitch);
    if (!unisonGroup) return;

    const newNotes = modifiedVoicing.notes.map(note => {
      if (unisonGroup.stringIds.includes(note.stringId)) {
        const shouldBePlayed = (stringIdToKeep === 'all') || (note.stringId === stringIdToKeep);
        return { ...note, isPlayedInVoicing: shouldBePlayed };
      }
      return note;
    });
    setModifiedVoicing({ ...modifiedVoicing, notes: newNotes });
  };
  
  const handlePlayArp = () => {
    if (isPlaying) return;
    const notesToPlay = modifiedVoicing.notes.filter(n => n.isPlayedInVoicing).sort((a, b) => b.stringId - a.stringId);
    if (notesToPlay.length === 0) return;

    setIsPlaying(true);
    SoundService.resumeAudioContext();
    let delay = 0;
    const strumSpeedMs = 333; 
    notesToPlay.forEach(note => {
      setTimeout(() => {
        setPlayingStringIds([note.stringId]);
        // MODIFIED: Increased note duration from 0.5s to 1.5s for a longer decay.
        SoundService.playSingleNote(note.finalNote, 1.5);
      }, delay);
      delay += strumSpeedMs;
    });
    setTimeout(() => {
      setPlayingStringIds([]);
      setIsPlaying(false);
    }, delay + 300);
  };

  const handlePlayPluck = () => {
    if (isPlaying) return;
    const notesToPlay = modifiedVoicing.notes.filter(n => n.isPlayedInVoicing);
    if (notesToPlay.length === 0) return;

    setIsPlaying(true);
    SoundService.resumeAudioContext();
    
    const stringIdsToAnimate = notesToPlay.map(n => n.stringId);
    setPlayingStringIds(stringIdsToAnimate);
    SoundService.playBlockChord(notesToPlay);

    setTimeout(() => {
        setPlayingStringIds([]);
        setIsPlaying(false);
    }, 1000);
  };


  const handlePlayIndividualNote = (note) => {
    if (isPdfMode || !note.isPlayedInVoicing || !note.finalNote) return;
    SoundService.resumeAudioContext();
    setPlayingStringIds([note.stringId]);
    SoundService.playSingleNote(note.finalNote);
    setTimeout(() => setPlayingStringIds([]), 300);
  };

  const handleFindScalesClick = () => {
    if (!onFindScales) return;
    const playedIntervals = new Set(modifiedVoicing.notes.filter(n => n.isPlayedInVoicing).map(n => (n.semitonesFromRoot % 12 + 12) % 12));
    const matchingScales = findScalesForChord([...playedIntervals]);
    
    if (matchingScales.length > 0) {
        onFindScales({
            rootNote: getRootFromChordName(chordName),
            scales: matchingScales,
            chordName: chordName
        });
    } else {
        showToast('No common scales found for this specific voicing.', 'info');
    }
  };

  // Multi-customization handlers
  const handleCustomizationCycle = (nextCustomizationId) => {
    if (!isFavorite || !currentCopedent) return;
    
    // Extract chord type and combo for ID generation
    const chordType = voicing.selectedChordType || chordName.replace(/^[A-G][#♯b♭𝄫𝄪]*\s*/, '').trim();
    const combo = {
      pedalCombo: displayedControls.pedalCombo || [],
      leverCombo: displayedControls.leverCombo || [],
      mecCombo: displayedControls.mecCombo || []
    };
    
    const favoriteId = voicing.favoriteId || generateFavoriteId(chordType, combo);
    
    // Set new current customization
    setCurrentCustomization(currentCopedent.id, favoriteId, nextCustomizationId);
    setCurrentCustomizationState(nextCustomizationId);
    
    // Apply the customization to the current voicing
    applyCustomizationToVoicing(nextCustomizationId);
  };

  const applyCustomizationToVoicing = (customizationId) => {
    if (customizationId === 0) {
      // Reset to original voicing
      setModifiedVoicing(voicing);
      return;
    }

    const customization = customizations.find(c => c.id === customizationId);
    if (!customization || !customization.colorStates) {
      return;
    }

    // Start with original voicing and apply customization changes
    const newNotes = voicing.notes.map(note => {
      const stringState = customization.colorStates[note.stringId];
      if (stringState) {
        if (stringState.currentState === 'grey') {
          return { ...note, isPlayedInVoicing: false };
        } else {
          return { ...note, isPlayedInVoicing: note.isChordTone };
        }
      }
      // No customization for this string - keep original state
      return { ...note, isPlayedInVoicing: note.isChordTone };
    });

    setModifiedVoicing(prev => ({ ...prev, notes: newNotes }));
  };

  const handleManagementPanelToggle = () => {
    setIsManagementPanelOpen(prev => !prev);
  };

  const handleCustomizationSelect = (customizationId) => {
    handleCustomizationCycle(customizationId);
    setIsManagementPanelOpen(false);
  };

  const handleSaveCustomization = () => {
    if (!isFavorite || !currentCopedent || customizations.length >= 5) return;
    setIsSaveModalOpen(true);
  };

  const handleSaveCustomizationConfirm = async (customizationName) => {
    if (!isFavorite || !currentCopedent) return;

    // Extract chord type and combo for ID generation
    // Use ORIGINAL voicing combo, not displayedControls which changes with grey notes
    const chordType = voicing.selectedChordType || chordName.replace(/^[A-G][#♯b♭𝄫𝄪]*\s*/, '').trim();
    const combo = {
      pedalCombo: voicing.pedalCombo || [],
      leverCombo: voicing.leverCombo || [],
      mecCombo: voicing.mecCombo || []
    };

    const favoriteId = voicing.favoriteId || generateFavoriteId(chordType, combo);
    
    // Extract current color states from modified voicing vs original voicing
    // Use the original voicing as the baseline (this contains the correct chord tones)
    const colorStates = {};
    modifiedVoicing.notes.forEach(note => {
      const originalNote = voicing.notes.find(n => n.stringId === note.stringId);
      if (originalNote && originalNote.isChordTone && originalNote.isPlayedInVoicing && !note.isPlayedInVoicing) {
        // Detect both green->grey and yellow->grey changes  
        const originalState = originalNote.isUnison ? 'yellow' : 'green';
        colorStates[note.stringId] = {
          originalState: originalState,
          currentState: 'grey'
        };
      }
    });

    // Check if there are any actual changes (prevent saving "all default" customizations)
    if (Object.keys(colorStates).length === 0) {
      showToast('No changes to save. Customizations must have at least one grey note.', 'info');
      setIsSaveModalOpen(false);
      return;
    }

    const customizationData = {
      name: customizationName,
      description: generateSmartCustomizationName(colorStates, voicing),
      colorStates,
      mutedStrings: Object.keys(colorStates).map(s => parseInt(s))
    };

    const result = addCustomizationToFavorite(
      currentCopedent.id,
      favoriteId,
      customizationData
    );

    if (result.success) {
      // Reload customizations
      const allCustomizations = getAllCustomizations(currentCopedent.id, favoriteId);
      setCustomizations(allCustomizations.filter(c => c.id !== 0));
      showToast(`Customization "${customizationName}" saved successfully!`, 'success');
    } else {
      // Provide specific error messages
      let errorMessage = 'Failed to save customization. Please try again.';
      switch (result.error) {
        case 'duplicate_name':
          errorMessage = 'A customization with this name already exists. Please choose a different name.';
          break;
        case 'duplicate_notes':
          errorMessage = 'A customization with the same grey notes already exists.';
          break;
        case 'limit_reached':
          errorMessage = 'Maximum 5 customizations reached. Delete one to add a new customization.';
          break;
        case 'storage_load_error':
        case 'storage_error':
          errorMessage = 'Storage error. Please try again.';
          break;
        case 'favorite_not_found':
          errorMessage = 'Chord not found in favorites. Please save as favorite first.';
          break;
        default:
          errorMessage = 'Failed to save customization. Please try again.';
      }
      showToast(errorMessage, 'error');
    }

    setIsSaveModalOpen(false);
  };

  const handleDeleteCustomization = (customizationId) => {
    if (!isFavorite || !currentCopedent || customizationId === 0) return;

    // Extract chord type and combo for ID generation
    const chordType = voicing.selectedChordType || chordName.replace(/^[A-G][#♯b♭𝄫𝄪]*\s*/, '').trim();
    const combo = {
      pedalCombo: displayedControls.pedalCombo || [],
      leverCombo: displayedControls.leverCombo || [],
      mecCombo: displayedControls.mecCombo || []
    };

    const favoriteId = voicing.favoriteId || generateFavoriteId(chordType, combo);
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
        setCustomizations(allCustomizations.filter(c => c.id !== 0));
        
        // Reset to default if deleted customization was active
        if (currentCustomization === customizationId) {
          setCurrentCustomizationState(0);
          setModifiedVoicing(voicing);
        }
        
        showToast(`Customization "${customization.name}" deleted.`, 'info');
      } else {
        showToast('Failed to delete customization. Please try again.', 'error');
      }
    }
  };
  
  const { fret, selectedCopedent } = modifiedVoicing;
  const pdfTextFix = isPdfMode ? { position: 'relative', top: '-6px' } : {};

  return (
    <div className={`p-6 rounded-xl border border-gray-200 shadow-md mb-6 transition-colors duration-200 ${
      isFavorite ? 'bg-blue-50 border-blue-200' : 'bg-white'
    }`}>
      <div className="flex items-start mb-4">
        <div className="w-3/4 pr-4">
            <div className="flex items-center">
                <h3 className="font-bold text-xl text-gray-900" style={pdfTextFix}>
                    {displayedChordName} - Fret {fret} ({stringsUsedCount} Strings Used)
                </h3>
                {!isPdfMode && isEnharmonic && (
                    <button onClick={handleEnharmonicToggle} className="ml-3 px-2 py-0.5 border border-gray-300 rounded-md shadow-sm bg-green-600 text-white hover:bg-green-700 font-mono text-xs" title="Toggle between Sharps (#) and Flats (b)">
                        {useSharps ? '#' : 'b'}
                    </button>
                )}
            </div>
        </div>
        <div className="w-1/4">
            <div className="text-base text-center font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-lg">
                <span style={isPdfMode ? { position: 'relative', top: '-10px' } : {}}>{getControlComboText()}</span>
            </div>
        </div>
      </div>
      
      {!isPdfMode && (
          <div className="flex justify-center items-center space-x-4 my-4 border-t border-b py-3">
              {onToggleFavorite && currentCopedent && (
                <div className="flex items-center space-x-1 relative">
                  <StarToggleButton
                    chordData={modifiedVoicing}
                    copedentId={currentCopedent.id}
                    isFavorite={isFavorite}
                    onToggle={onToggleFavorite}
                    size="medium"
                  />
                  {isFavorite && (
                    <>
                      <button
                        onClick={() => handleCustomizationCycle(currentCustomization >= customizations.length ? 0 : currentCustomization + 1)}
                        className="flex items-center text-xl hover:scale-110 transition-transform duration-150 focus:outline-none"
                        title={`Current: ${currentCustomization === 0 ? 'Default' : `Customization ${currentCustomization}`}. Click to cycle.`}
                        style={{ minWidth: '44px', minHeight: '44px' }}
                      >
                        🎛️({currentCustomization})
                      </button>
                      <button
                        onClick={handleManagementPanelToggle}
                        className="text-xl hover:scale-110 transition-transform duration-150 focus:outline-none"
                        title="Manage customizations"
                        style={{ minWidth: '44px', minHeight: '44px' }}
                      >
                        ⚙️
                      </button>
                      
                      <ExpandableManagementPanel
                        isOpen={isManagementPanelOpen}
                        customizations={customizations}
                        currentCustomization={currentCustomization}
                        onSelect={handleCustomizationSelect}
                        onSave={handleSaveCustomization}
                        onDelete={handleDeleteCustomization}
                        onClose={() => setIsManagementPanelOpen(false)}
                        chordName={displayedChordName}
                      />
                    </>
                  )}
                </div>
              )}
              {onTogglePdfSelect && (
                <button onClick={() => onTogglePdfSelect(modifiedVoicing)} className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${selectedForPdf ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                    {selectedForPdf ? '✓ Selected' : 'Export to PDF'}
                </button>
              )}
              <div className="flex rounded-md shadow-sm">
                <button onClick={handlePlayArp} disabled={isPlaying} title="Play as Arpeggio" className="flex items-center px-3 py-2 rounded-l-md text-white bg-green-500 hover:bg-green-600 disabled:bg-gray-400">
                    <ArpIcon /> Arp
                </button>
                <button onClick={handlePlayPluck} disabled={isPlaying} title="Play as Pluck (Block Chord)" className="flex items-center px-3 py-2 rounded-r-md border-l border-green-600 text-white bg-green-500 hover:bg-green-600 disabled:bg-gray-400">
                    <PluckIcon /> Pluck
                </button>
              </div>

              {onFindScales && (
                <button onClick={handleFindScalesClick} className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 text-sm">
                    Find Scales
                </button>
              )}
          </div>
      )}

      {unisonGroups.length > 0 && !isPdfMode && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-bold text-yellow-800 mb-2">Unisons Found:</h4>
          {unisonGroups.map(({ pitch, stringIds }) => {
            const displayPitchName = getEnharmonicNoteName(pitch, displayedRoot, displayedChordName);
            return (
                <div key={pitch} className="flex items-center gap-4 text-sm">
                  <span className="font-medium text-yellow-900">{displayPitchName}:</span>
                  <label className="flex items-center cursor-pointer"><input type="radio" name={`unison-${voicing.id}-${pitch}`} onChange={() => handleUnisonChange(pitch, 'all')} defaultChecked className="form-radio text-yellow-600" /><span className="ml-1">Keep All</span></label>
                  {stringIds.map(id => (
                     <label key={id} className="flex items-center cursor-pointer"><input type="radio" name={`unison-${voicing.id}-${pitch}`} onChange={() => handleUnisonChange(pitch, id)} className="form-radio text-yellow-600" /><span className="ml-1">Keep S{id}</span></label>
                  ))}
                </div>
            );
          })}
        </div>
      )}
      
      <div className="space-y-3 relative">
        {!isPdfMode && <ResultColorGuide />}
        {modifiedVoicing.notes.map(note => {
          const { stringId, originalNote, isPlayedInVoicing, finalNote, activeControls, isOverriddenBySplit, semitonesFromRoot } = note;
          const displayNoteName = finalNote ? getEnharmonicNoteName(finalNote, displayedRoot, displayedChordName) : '';
          
          const isNotePlaying = playingStringIds.includes(stringId);
          const popAnimation = isNotePlaying ? 'scale-110 shadow-lg' : 'shadow-md';

          const originalNoteVoicing = voicing.notes.find(n => n.stringId === stringId);
          const wasOriginallyPlayed = originalNoteVoicing.isPlayedInVoicing;
          const isClickable = !isPdfMode && wasOriginallyPlayed;

          // Check if this string is part of a unison group
          const isUnisonString = unisonGroups.some(group => group.stringIds.includes(stringId));
          
          let stateColorClass, stateContent;
          if (isPlayedInVoicing) {
            // Use yellow for unison strings, green for regular played strings
            if (isUnisonString) {
              stateColorClass = 'bg-yellow-100 border-yellow-300 text-yellow-800';
            } else {
              stateColorClass = 'bg-green-100 border-green-300 text-green-800';
            }
            stateContent = (
                <div className="flex justify-between items-center w-full">
                    <span>{displayNoteName}</span>
                    {activeControls.length > 0 && (<span className={`ml-1 italic ${isUnisonString ? 'text-yellow-900' : 'text-green-900'}`}>{activeControls.map(id => {const control = selectedCopedent?.pedals.find(p => p.id === id) || selectedCopedent?.kneeLevers.find(l => l.id === id) || selectedCopedent?.mechanisms.find(m => m.id === id); return control ? control.name : id;}).join('+')}</span>)}
                </div>
            );
          } else if (wasOriginallyPlayed) {
            stateColorClass = 'bg-gray-200 border-gray-400 text-gray-500';
            stateContent = <span>✗</span>;
          } else {
            stateColorClass = 'bg-red-100 border-red-300 text-red-800';
            stateContent = <span>✗</span>;
          }
          
          return (
            <div key={stringId} className="flex items-center space-x-4 h-8">
              <div className="w-20 text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded flex justify-between items-center"><span>S{stringId}</span><span>•</span><span>{originalNote.replace(/\d+$/, '')}</span></div>
              <div className="flex-1 relative h-1.5 rounded-sm bg-gradient-to-r from-gray-200 to-gray-300 shadow-inner">
                {isPlayedInVoicing && (<div onClick={() => handlePlayIndividualNote(note)} className={`absolute top-1/2 transform -translate-y-1/2 h-8 px-2 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs border-2 border-white cursor-pointer transition-all duration-100 whitespace-nowrap ${popAnimation}`} style={{ left: `calc(9% + ${(fret / 12) * 82}%)`, marginLeft: '-24px' }} title={`${displayNoteName} (${getContextualIntervalName(semitonesFromRoot, displayedChordName)})`}><span>{displayNoteName}[{getContextualIntervalName(semitonesFromRoot, displayedChordName)}]</span></div>)}
              </div>
              <div className="flex items-center w-28">
                <div 
                    onClick={isClickable ? () => handleStringToggle(stringId) : null}
                    className={`flex w-full h-6 text-xs font-medium px-2 rounded-l flex-grow border items-center justify-center ${stateColorClass} ${isClickable ? 'cursor-pointer hover:opacity-80' : ''}`}
                >
                    {stateContent}
                </div>
                {isPlayedInVoicing && isOverriddenBySplit && (
                    <div className="h-6 text-xs font-bold px-2 rounded-r bg-yellow-100 border border-yellow-300 text-yellow-800 border-l-0 flex items-center justify-center" title="Split Override Applied">
                        <span>OR!</span>
                    </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Customization Modal */}
      <SaveCustomizationModal
        isOpen={isSaveModalOpen}
        onSave={handleSaveCustomizationConfirm}
        onCancel={() => setIsSaveModalOpen(false)}
        suggestedName={generateSmartCustomizationName(
          modifiedVoicing.notes.reduce((acc, note) => {
            const originalNote = voicing.notes.find(n => n.stringId === note.stringId);
            if (originalNote && originalNote.isPlayedInVoicing && !note.isPlayedInVoicing) {
              acc[note.stringId] = { currentState: 'grey' };
            }
            return acc;
          }, {}),
          voicing
        )}
        currentCount={customizations.length}
        chordName={displayedChordName}
      />
    </div>
  );
}

export default FretboardVisualizer;