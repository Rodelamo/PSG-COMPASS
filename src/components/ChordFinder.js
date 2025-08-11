// src/components/ChordFinder.js

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '../App';
import { CHORD_CATEGORIES, CHORD_TYPES } from '../data/DefaultChordTypes';
import { CHROMATIC_SCALE_SHARPS, CHROMATIC_SCALE_FLATS, SHARP_TO_FLAT_MAP, FLAT_TO_SHARP_MAP } from '../data/Notes';
import { getContextualIntervalName } from '../logic/NoteUtils';
import { findChordVoicingsWithCache, findScalesForChord, clearChordCacheForCopedent } from '../logic/ChordCalculator';
import { isFavoriteChord, toggleFavoriteStatus } from '../utils/FavoriteChordUtils';
import FretboardVisualizer from './FretboardVisualizer';
import CopedentManager from './CopedentManager';
import SelectionModal from './SelectionModal';

function ChordFinder(props) {
  const { selectedCopedent, pdfExportList, onTogglePdfSelect, onFindScales, appState, setAppState, onResetState } = props;
  const { selectedRootNote, selectedChordType, resultsPerFret, chordResults, activeIntervalFilters, useSharps, searchQueryDisplay } = appState;
  const showToast = useToast();
  // ChordFinder is available to all users regardless of tier
  
  const [isFinding, setIsFinding] = useState(false);
  const [isChordModalOpen, setIsChordModalOpen] = useState(false);

  const prevCopedentId = useRef(selectedCopedent.id);
  const prevChordType = useRef(selectedChordType);

  const uniqueChordIntervals = useMemo(() => {
    const intervals = CHORD_TYPES[selectedChordType] || [];
    return Array.from(new Set(intervals.map(i => i % 12))).sort((a, b) => a - b);
  }, [selectedChordType]);

  useEffect(() => {
    if (prevCopedentId.current !== selectedCopedent.id || prevChordType.current !== selectedChordType) {
      // Clear cache when copedent changes to prevent stale results
      if (prevCopedentId.current !== selectedCopedent.id) {
        clearChordCacheForCopedent(prevCopedentId.current);
      }
      
      setAppState(prev => ({ ...prev, activeIntervalFilters: uniqueChordIntervals, chordResults: [], searchQueryDisplay: '' }));
      prevCopedentId.current = selectedCopedent.id;
      prevChordType.current = selectedChordType;
    }
  }, [selectedCopedent, selectedChordType, uniqueChordIntervals, setAppState]);

  const handleEnharmonicToggle = () => {
    const newUseSharps = !useSharps;
    const conversionMap = newUseSharps ? FLAT_TO_SHARP_MAP : SHARP_TO_FLAT_MAP;
    const newRootNote = conversionMap[selectedRootNote] || selectedRootNote;
    setAppState(prev => ({ ...prev, useSharps: newUseSharps, selectedRootNote: newRootNote }));
  };

  const handleIntervalToggle = (intervalSemitone) => {
    const newFilters = activeIntervalFilters.includes(intervalSemitone) ? activeIntervalFilters.filter(i => i !== intervalSemitone) : [...activeIntervalFilters, intervalSemitone].sort((a,b) => a - b);
    setAppState(prev => ({ ...prev, activeIntervalFilters: newFilters }));
  };

  const getDisplayChordName = () => {
    const allOriginalIntervals = CHORD_TYPES[selectedChordType] || [];
    const uniqueOriginalIntervalClasses = Array.from(new Set(allOriginalIntervals.map(i => i % 12)));
    if (activeIntervalFilters.length === uniqueOriginalIntervalClasses.length) return `${selectedRootNote} ${selectedChordType}`;
    const omittedIntervals = uniqueOriginalIntervalClasses.filter(interval => !activeIntervalFilters.includes(interval));
    if (omittedIntervals.length > 0) {
      const omittedNames = omittedIntervals.map(interval => getContextualIntervalName(interval, selectedChordType));
      return `${selectedRootNote} ${selectedChordType} (no ${omittedNames.join(', no ')})`;
    }
    return `${selectedRootNote} ${selectedChordType}`;
  };

  const handleFindChords = () => {
    if (activeIntervalFilters.length === 0) {
      showToast('Please select at least one interval to search for.', 'error');
      return;
    }
    setIsFinding(true);
    const currentSearchName = getDisplayChordName();

    setTimeout(() => {
        const fullRootNote = selectedRootNote + '4';
        // ChordFinder is a basic tier feature - all users get full copedent access for chord finding
        const foundVoicings = findChordVoicingsWithCache(selectedCopedent, fullRootNote, activeIntervalFilters, resultsPerFret, true);
        const voicingsWithId = foundVoicings.map((voicing, index) => ({ ...voicing, id: `${voicing.fret}-${voicing.pedalCombo.join('')}-${voicing.leverCombo.join('')}-${voicing.mecCombo.join('')}-${index}` }));
        const voicingsWithCopedentRef = voicingsWithId.map(voicing => ({ ...voicing, selectedCopedent: selectedCopedent, chordName: currentSearchName, selectedChordType: selectedChordType }));
        
        setAppState(prev => ({...prev, chordResults: voicingsWithCopedentRef, searchQueryDisplay: currentSearchName}));

        if (foundVoicings.length === 0) showToast(`No voicings found with the current settings.`, 'info');
        setIsFinding(false);
    }, 10);
  };

  const handleFindScalesClick = () => {
      const chordIntervals = CHORD_TYPES[selectedChordType] || [];
      const matchingScales = findScalesForChord(chordIntervals);
      if (matchingScales.length > 0) onFindScales({ rootNote: selectedRootNote, scales: matchingScales, chordName: getDisplayChordName() });
      else showToast('No common scales found containing all notes of this chord.', 'info');
  };

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
        
        // Force re-render to update favorite status
        setAppState(prev => ({ ...prev }));
      } else {
        showToast(`Failed to ${result.action === 'added' ? 'add' : 'remove'} favorite`, 'error');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showToast('Error updating favorite status', 'error');
    }
  };

  const chordModalCategories = CHORD_CATEGORIES.map(cat => ({ name: cat.name, items: cat.chords }));
  const rootNoteOptions = useSharps ? CHROMATIC_SCALE_SHARPS : CHROMATIC_SCALE_FLATS;

  return (
    <>
      <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
        <CopedentManager {...props} />
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center mb-6">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 flex-grow">Find Your Chords</h2>
              <button onClick={onResetState} className="px-3 py-1 bg-gray-700 text-white text-xs font-semibold rounded-md hover:bg-gray-600">Reset</button>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-4 mb-4">
            <div className="flex flex-col items-center">
                <label className="text-md font-medium text-gray-700 mb-1">Root Note:</label>
                <div className="flex items-center">
                    <button onClick={handleEnharmonicToggle} className="px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-green-600 text-white hover:bg-green-700 font-mono text-sm" title="Toggle between Sharps (#) and Flats (b)">
                        {useSharps ? '#' : 'b'}
                    </button>
                    <span className="mx-1 font-bold">-</span>
                    <select className="p-2 border border-gray-300 rounded-md shadow-sm" value={selectedRootNote} onChange={(e) => setAppState(prev => ({...prev, selectedRootNote: e.target.value}))}>
                        {rootNoteOptions.map(note => (<option key={note} value={note}>{note}</option>))}
                    </select>
                </div>
            </div>
            <div className="flex flex-col items-center"><label className="text-md font-medium text-gray-700 mb-1">Chord Type:</label><button onClick={() => setIsChordModalOpen(true)} className="p-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 min-w-[150px]">{selectedChordType}</button></div>
            <div className="flex flex-col items-center"><label className="text-md font-medium text-gray-700 mb-1">Results/Fret:</label><input type="number" min="1" max="10" value={resultsPerFret} onChange={(e) => setAppState(prev => ({...prev, resultsPerFret: parseInt(e.target.value, 10)}))} className="w-20 p-2 border border-gray-300 rounded-md shadow-sm text-center" /></div>
          </div>
          <button className="mt-4 px-8 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:opacity-50" onClick={handleFindChords} disabled={isFinding}>
            {isFinding ? 'Searching...' : 'Find Chords'}
          </button>
        </div>
        {uniqueChordIntervals.length >= 4 && (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Filter Chord Intervals</h2>
            <p className="text-gray-600 mb-4">Uncheck intervals you wish to omit from the search.</p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-4">
              {uniqueChordIntervals.map(intervalSemitone => {
                const intervalLabel = getContextualIntervalName(intervalSemitone, selectedChordType);
                return (
                  <label key={intervalSemitone} className="inline-flex items-center cursor-pointer" title={`Include or exclude the ${intervalLabel} from the search`}><input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600 rounded" checked={activeIntervalFilters.includes(intervalSemitone)} onChange={() => handleIntervalToggle(intervalSemitone)} /><span className="ml-2 text-gray-700">{intervalLabel}</span></label>
                );
              })}
            </div>
            <button className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" onClick={handleFindChords}>Refresh Results</button>
          </div>
        )}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {chordResults.length > 0 && searchQueryDisplay ? `Chord Results (${searchQueryDisplay}) - ${chordResults.length} found` : 'Chord Results'}
              </h2>
              {chordResults.length > 0 && (<button onClick={handleFindScalesClick} className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600">Find Scales for this Chord</button>)}
          </div>
          {chordResults.length === 0 ? (<p className="text-gray-600">No voicings found. Adjust your search or copedent.</p>) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {chordResults.map((voicing, index) => {
                const isFavorite = isFavoriteChord(selectedCopedent.id, voicing);
                return (
                  <FretboardVisualizer 
                    key={`${voicing.id}-${index}`} 
                    voicing={voicing} 
                    chordName={voicing.chordName} 
                    selectedForPdf={pdfExportList.some(v => v.id === voicing.id)} 
                    onTogglePdfSelect={onTogglePdfSelect} 
                    onFindScales={onFindScales}
                    isFavorite={isFavorite}
                    onToggleFavorite={handleToggleFavorite}
                    currentCopedent={selectedCopedent}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
      {isChordModalOpen && (
        <SelectionModal
          title="Select Chord Type"
          categories={chordModalCategories}
          selectedValue={selectedChordType}
          onSelect={(chordName) => setAppState(prev => ({...prev, selectedChordType: chordName}))}
          onClose={() => setIsChordModalOpen(false)}
        />
      )}
    </>
  );
}

export default ChordFinder;