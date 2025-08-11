// src/components/ScaleFinder.js

import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../App';
import CopedentManager from './CopedentManager';
import FretboardDiagram from './FretboardDiagram';
import { findScaleOnFretboard } from '../logic/ChordCalculator';
import { isFullCombinationValid } from '../logic/CopedentUtils'; // MODIFIED: Import new validation utility
import { getNoteAtOffset } from '../logic/NoteUtils'; 
import SoundService from '../logic/SoundService';
import { CHROMATIC_SCALE_SHARPS, CHROMATIC_SCALE_FLATS, SHARP_TO_FLAT_MAP, FLAT_TO_SHARP_MAP } from '../data/Notes';
import { SCALE_CATEGORIES, SCALES } from '../data/Scales';
import SelectionModal from './SelectionModal';

const PlayIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg> );
const ColorGuide = () => ( <div className="flex justify-center items-center space-x-4 my-4"> <div className="flex items-center"><div className="w-4 h-4 rounded-sm bg-red-600 mr-2"></div><span className="text-xs font-medium">Root</span></div> <div className="flex items-center"><div className="w-4 h-4 rounded-sm bg-green-600 mr-2"></div><span className="text-xs font-medium">3rd</span></div> <div className="flex items-center"><div className="w-4 h-4 rounded-sm bg-yellow-500 mr-2"></div><span className="text-xs font-medium">5th</span></div> <div className="flex items-center"><div className="w-4 h-4 rounded-sm bg-blue-500 mr-2"></div><span className="text-xs font-medium">Other</span></div> </div> );

function ScaleFinder(props) {
  const { selectedCopedent, scaleExportList, onToggleScaleSelect, appState, setAppState, onResetState } = props;
  // MODIFIED: Destructure new state property
  const { selectedRoot, selectedScale, activePedals, activeLevers, activeMechanisms, notesOnFretboard, filteredScales, contextChord, useSharps } = appState;
  const showToast = useToast();
  // Scale Finder is available to all users regardless of tier

  const [isPlaying, setIsPlaying] = useState(false); 
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);
  
  // NOTE: Fractional pedals/levers (half-pushes) are being phased out, so related logic is removed here.
  const availablePedals = useMemo(() => {
    return selectedCopedent.pedals.map(p => ({ id: p.id, name: p.name }));
  }, [selectedCopedent]);

  const availableLevers = useMemo(() => {
    return selectedCopedent.kneeLevers.filter(l => l.active).map(l => ({ id: l.id, name: l.name }));
  }, [selectedCopedent]);
  
  // Available mechanisms for both Basic and Pro tiers
  const availableMechanisms = useMemo(() => {
      return (selectedCopedent.mechanisms || []).map(m => ({ id: m.id, name: m.name }));
  }, [selectedCopedent]);


  const isCurrentScaleSelectedForPdf = scaleExportList.some( item => item.rootNote === selectedRoot && item.scaleName === selectedScale );
  
  useEffect(() => {
    // MODIFIED: Pass active mechanisms to the calculation
    const scaleNotes = findScaleOnFretboard(selectedCopedent, selectedRoot, selectedScale, activePedals, activeLevers, activeMechanisms);
    setAppState(prev => ({...prev, notesOnFretboard: scaleNotes}));
  }, [selectedCopedent, selectedRoot, selectedScale, activePedals, activeLevers, activeMechanisms, setAppState]);
  
  const handleEnharmonicToggle = () => {
    const newUseSharps = !useSharps;
    const conversionMap = newUseSharps ? FLAT_TO_SHARP_MAP : SHARP_TO_FLAT_MAP;
    const newRoot = conversionMap[selectedRoot] || selectedRoot;
    setAppState(prev => ({ ...prev, useSharps: newUseSharps, selectedRoot: newRoot }));
  };

  // MODIFIED: All toggle handlers now use the central validation utility
  const handlePedalToggle = (pedalId) => {
    const newPedals = activePedals.includes(pedalId) ? activePedals.filter(id => id !== pedalId) : [...activePedals, pedalId];
    const validation = isFullCombinationValid(newPedals, activeLevers, activeMechanisms, selectedCopedent);
    if (!validation.valid) {
        showToast(validation.message, 'error');
        return;
    }
    setAppState(prev => ({...prev, activePedals: newPedals}));
  };

  const handleLeverToggle = (leverId) => {
    const newLevers = activeLevers.includes(leverId) ? activeLevers.filter(id => id !== leverId) : [...activeLevers, leverId];
    const validation = isFullCombinationValid(activePedals, newLevers, activeMechanisms, selectedCopedent);
    if (!validation.valid) { 
        showToast(validation.message, 'error'); 
        return; 
    }
    setAppState(prev => ({...prev, activeLevers: newLevers}));
  };

  const handleMechanismToggle = (mecId) => {
    const newMechanisms = activeMechanisms.includes(mecId) ? activeMechanisms.filter(id => id !== mecId) : [...activeMechanisms, mecId];
    const validation = isFullCombinationValid(activePedals, activeLevers, newMechanisms, selectedCopedent);
    if (!validation.valid) {
      showToast(validation.message, 'error');
      return;
    }
    setAppState(prev => ({...prev, activeMechanisms: newMechanisms}));
  };

  const handlePlayScale = (scaleNameToPlay) => {
    const scaleIntervals = SCALES[scaleNameToPlay];
    if (!scaleIntervals || isPlaying) return;
    const rootNoteForPlayback = `${selectedRoot}4`;
    const notesToPlay = scaleIntervals.map(interval => getNoteAtOffset(rootNoteForPlayback, interval));
    notesToPlay.push(getNoteAtOffset(rootNoteForPlayback, 12)); 
    setIsPlaying(true);
    SoundService.resumeAudioContext();
    let delay = 0;
    const noteDurationMs = 300;
    notesToPlay.forEach(note => {
      setTimeout(() => { SoundService.playSingleNote(note); }, delay);
      delay += noteDurationMs;
    });
    setTimeout(() => { setIsPlaying(false); }, delay);
  };

  const handleNoteClick = (note) => {
    if (isPlaying || !note || !note.noteName) return;
    SoundService.resumeAudioContext();
    SoundService.playSingleNote(note.noteName);
  };

  const handleAddToPdfClick = () => {
    const scaleData = {
        // MODIFIED: Include active mechanisms in the exported data
        id: `${selectedRoot}-${selectedScale}-${selectedCopedent.id}-${activePedals.join('')}-${activeLevers.join('')}-${activeMechanisms.join('')}`,
        rootNote: selectedRoot, scaleName: selectedScale,
        notesOnFretboard, copedent: selectedCopedent,
        activePedals: activePedals, activeLevers: activeLevers, activeMechanisms: activeMechanisms
    };
    onToggleScaleSelect(scaleData);
  };

  const handleClearFilter = () => {
    setAppState(prev => ({ ...prev, filteredScales: null, contextChord: null }));
  };

  const scaleModalCategories = SCALE_CATEGORIES.map(cat => ({ name: cat.name, items: cat.scales }));
  const rootNoteOptions = useSharps ? CHROMATIC_SCALE_SHARPS : CHROMATIC_SCALE_FLATS;

  return (
    <>
      <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
        <CopedentManager {...props} />
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 text-center flex-grow">Scale Finder</h2>
              <button onClick={handleAddToPdfClick} disabled={scaleExportList.length >= 20 && !isCurrentScaleSelectedForPdf} className={`px-4 py-2 rounded-md text-sm font-semibold text-white ${isCurrentScaleSelectedForPdf ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-600 hover:bg-purple-700'} disabled:opacity-50`}>
                  {isCurrentScaleSelectedForPdf ? 'Remove from PDF' : 'Add to PDF Export'}
              </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
            <div className="p-4 bg-gray-100 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">Select Scale</h3>
                <button onClick={() => handlePlayScale(selectedScale)} disabled={isPlaying} className="flex items-center px-3 py-1 rounded-md text-white bg-green-500 hover:bg-green-600 disabled:bg-gray-400" title={`Play the ${selectedRoot} ${selectedScale} scale`}> <PlayIcon /> <span className="ml-1">Play</span> </button>
              </div>
              {contextChord && <h3 className="text-2xl font-bold text-purple-700 mb-2 mt-4 text-center">Scale Options for {contextChord}</h3>}
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                    <button onClick={handleEnharmonicToggle} className="px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-green-600 text-white hover:bg-green-700 font-mono text-sm" title="Toggle between Sharps (#) and Flats (b)">
                        {useSharps ? '#' : 'b'}
                    </button>
                    <span className="mx-1 font-bold">-</span>
                    <select value={selectedRoot} onChange={(e) => setAppState(prev => ({...prev, selectedRoot: e.target.value}))} className="p-2 border rounded-md">
                        {rootNoteOptions.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
                {filteredScales ? (
                  <div className="w-full">
                    <div className="flex flex-col space-y-2">
                      {filteredScales.map(scale => (<div key={scale} className="flex items-center justify-between w-full"> <label className="flex items-center"> <input type="radio" name="scale" value={scale} checked={selectedScale === scale} onChange={(e) => setAppState(prev => ({...prev, selectedScale: e.target.value}))} className="form-radio mr-2"/> {scale} </label> <button onClick={() => handlePlayScale(scale)} disabled={isPlaying} className="px-2 py-1 text-xs rounded-md text-white bg-green-500 hover:bg-green-600 disabled:bg-gray-400 ml-4" title={`Play the ${selectedRoot} ${scale} scale`}> Play </button> </div>))}
                    </div>
                    <button onClick={handleClearFilter} className="mt-4 text-sm text-blue-600 hover:underline">Clear Filter & Show All Scales</button>
                  </div>
                ) : (
                  <button onClick={() => setIsScaleModalOpen(true)} className="p-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 min-w-[150px]">{selectedScale}</button>
                )}
              </div>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
               <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg">Engage Pedals & Levers</h3>
                  <button onClick={onResetState} className="px-3 py-1 bg-gray-700 text-white text-xs font-semibold rounded-md hover:bg-gray-600">Reset</button>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <div>
                      <h4 className="font-medium">Pedals:</h4>
                      {availablePedals.map(p => <label key={p.id} className="flex items-center"><input type="checkbox" checked={activePedals.includes(p.id)} onChange={() => handlePedalToggle(p.id)} className="mr-2"/>{p.name}</label>)}
                  </div>
                   <div>
                      <h4 className="font-medium">Levers:</h4>
                      {availableLevers.map(l => <label key={l.id} className="flex items-center"><input type="checkbox" checked={activeLevers.includes(l.id)} onChange={() => handleLeverToggle(l.id)} className="mr-2"/>{l.name}</label>)}
                  </div>
                  {/* NEW: Tier-gated section for mechanisms */}
                  {availableMechanisms.length > 0 && (
                    <div>
                        <h4 className="font-medium">Mechanisms:</h4>
                        {availableMechanisms.map(m => <label key={m.id} className="flex items-center"><input type="checkbox" checked={activeMechanisms.includes(m.id)} onChange={() => handleMechanismToggle(m.id)} className="mr-2"/>{m.name}</label>)}
                    </div>
                  )}
              </div>
            </div>
          </div>
          <ColorGuide />
          <FretboardDiagram notesToDisplay={notesOnFretboard} copedent={selectedCopedent} onNoteClick={handleNoteClick} />
        </div>
      </div>
      {isScaleModalOpen && (
        <SelectionModal
          title="Select Scale Type"
          categories={scaleModalCategories}
          selectedValue={selectedScale}
          onSelect={(scaleName) => setAppState(prev => ({...prev, selectedScale: scaleName}))}
          onClose={() => setIsScaleModalOpen(false)}
        />
      )}
    </>
  );
}

export default ScaleFinder;