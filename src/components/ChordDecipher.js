// src/components/ChordDecipher.js

import React, { useEffect, useRef } from 'react';
import { useToast } from '../App';
import { decipherChord } from '../logic/ChordCalculator';
import FretboardVisualizer from './FretboardVisualizer';
import CopedentManager from './CopedentManager';
import { isFullCombinationValid } from '../logic/CopedentUtils';
import { useTier } from '../context/TierContext';
import { isFavoriteChord, toggleFavoriteStatus } from '../utils/FavoriteChordUtils';

const InfoIcon = () => ( <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: '8px', backgroundColor: '#3B82F6', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontFamily: 'serif', fontStyle: 'italic', fontWeight: 'bold', cursor: 'help', userSelect: 'none' }}>i</span> );

// MODIFIED: Replaced the SVG with a simpler, clearer icon.
const SwapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
);


function ChordDecipher(props) {
  const { selectedCopedent, pdfExportList, onTogglePdfSelect, onFindScales, appState, setAppState, onResetState } = props;
  const { fret, selectedStrings, selectedPedals, selectedLevers, selectedMechanisms, decipherResults, stringOrderReversed } = appState;
  const showToast = useToast();
  const { isPro } = useTier();
  
  const [isDeciphering, setIsDeciphering] = React.useState(false);

  const prevCopedentId = useRef(selectedCopedent.id);

  useEffect(() => {
    if (prevCopedentId.current !== selectedCopedent.id) {
      onResetState();
      prevCopedentId.current = selectedCopedent.id;
    }
  }, [selectedCopedent, onResetState]);

  const activeLevers = selectedCopedent.kneeLevers.filter(l => l.active);
  const availableMechanisms = selectedCopedent.mechanisms || [];

  const getControlTooltip = (control) => {
    const changes = Object.entries(control.changes).map(([stringId, semitones]) => `S${stringId}: ${semitones > 0 ? '+' : ''}${semitones}st`).join(', ');
    return changes || 'No changes defined';
  };

  const handleStringToggle = (stringId) => {
    const newStrings = selectedStrings.includes(stringId) ? selectedStrings.filter(id => id !== stringId) : [...selectedStrings, stringId];
    setAppState(prev => ({...prev, selectedStrings: newStrings}));
  };

  const handlePedalToggle = (pedalId) => {
    const newPedals = selectedPedals.includes(pedalId) ? selectedPedals.filter(id => id !== pedalId) : [...selectedPedals, pedalId];
    const validation = isFullCombinationValid(newPedals, selectedLevers, selectedMechanisms, selectedCopedent);
    if (!validation.valid) {
      showToast(validation.message, 'error');
      return;
    }
    setAppState(prev => ({...prev, selectedPedals: newPedals}));
  };

  const handleLeverToggle = (leverId) => {
    const newLevers = selectedLevers.includes(leverId) ? selectedLevers.filter(id => id !== leverId) : [...selectedLevers, leverId];
    const validation = isFullCombinationValid(selectedPedals, newLevers, selectedMechanisms, selectedCopedent);
    if (!validation.valid) { 
        showToast(validation.message, 'error'); 
        return; 
    }
    setAppState(prev => ({...prev, selectedLevers: newLevers}));
  };
  
  const handleMechanismToggle = (mecId) => {
    const newMechanisms = selectedMechanisms.includes(mecId)
      ? selectedMechanisms.filter(id => id !== mecId)
      : [...selectedMechanisms, mecId];
    const validation = isFullCombinationValid(selectedPedals, selectedLevers, newMechanisms, selectedCopedent);
    if (!validation.valid) {
      showToast(validation.message, 'error');
      return;
    }
    setAppState(prev => ({...prev, selectedMechanisms: newMechanisms}));
  };

  const handleDecipher = () => {
    if (selectedStrings.length < 3) {
      showToast('Please select at least three strings to decipher a chord.', 'error');
      return;
    }
    setIsDeciphering(true);
    setAppState(prev => ({...prev, decipherResults: []}));
    setTimeout(() => {
      const results = decipherChord(selectedCopedent, fret, selectedStrings, selectedPedals, selectedLevers, selectedMechanisms);
      setAppState(prev => ({...prev, decipherResults: results}));
      if (results.length === 0 && selectedStrings.length >= 3) {
        showToast('Could not identify a common chord with the selected notes.', 'info');
      }
      setIsDeciphering(false);
    }, 10);
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
  
  const stringsToDisplay = stringOrderReversed ? [...selectedCopedent.strings].reverse() : selectedCopedent.strings;

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <CopedentManager {...props} />
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 flex-grow">Chord Decipher</h2>
            <button onClick={onResetState} className="px-3 py-1 bg-gray-700 text-white text-xs font-semibold rounded-md hover:bg-gray-600">Reset</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <div className="flex flex-col items-center">
            <label htmlFor="fret-input" className="text-lg font-medium text-gray-700 mb-2">Fret Number</label>
            <input id="fret-input" type="number" min="0" max="24" value={fret} onChange={(e) => setAppState(prev => ({...prev, fret: parseInt(e.target.value, 10)}))} className="w-24 p-2 border border-gray-300 rounded-md shadow-sm text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div className="flex flex-col items-center">
            <label className="text-lg font-medium text-gray-700 mb-2 flex items-center" title="You can select one pedal, or two adjacent pedals (e.g., P1+P2).">Pedals Engaged <InfoIcon /></label>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
              {selectedCopedent.pedals.map(pedal => (<div key={pedal.id} title={getControlTooltip(pedal)}><label className="inline-flex items-center cursor-pointer"><input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600 rounded" checked={selectedPedals.includes(pedal.id)} onChange={() => handlePedalToggle(pedal.id)} /><span className="ml-2 text-gray-700">{pedal.name}</span></label></div>))}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <label className="text-lg font-medium text-gray-700 mb-2 flex items-center" title="Select any physically possible combination.">Levers Engaged <InfoIcon /></label>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
              {activeLevers.map(lever => (<div key={lever.id} title={getControlTooltip(lever)}><label className="inline-flex items-center cursor-pointer"><input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600 rounded" checked={selectedLevers.includes(lever.id)} onChange={() => handleLeverToggle(lever.id)} /><span className="ml-2 text-gray-700">{lever.name}</span></label></div>))}
            </div>
          </div>
        </div>
        
        {availableMechanisms.length > 0 && (
            <div className="flex flex-col items-center border-t pt-4">
                <label className="text-lg font-medium text-gray-700 mb-2 flex items-center" title="Select any defined mechanisms.">Mechanisms Engaged <InfoIcon /></label>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                {availableMechanisms.map(mec => (<div key={mec.id} title={getControlTooltip(mec)}><label className="inline-flex items-center cursor-pointer"><input type="checkbox" className="form-checkbox h-5 w-5 text-orange-600 rounded" checked={selectedMechanisms.includes(mec.id)} onChange={() => handleMechanismToggle(mec.id)} /><span className="ml-2 text-gray-700">{mec.name}</span></label></div>))}
                </div>
            </div>
        )}

        <div className="flex flex-col items-center border-t pt-4 mt-4">
          <div className="flex items-center mb-2">
            <label className="text-lg font-medium text-gray-700">Strings Played</label>
            <button 
                onClick={() => setAppState(prev => ({...prev, stringOrderReversed: !prev.stringOrderReversed}))}
                className="ml-4 p-1.5 bg-gray-200 rounded-full hover:bg-gray-300"
                title="Reverse String Order"
            >
                <SwapIcon />
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-2">
            {stringsToDisplay.map(string => (<label key={string.id} className={`inline-flex items-center cursor-pointer px-3 py-1 rounded-full border-2 transition-colors ${selectedStrings.includes(string.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}><input type="checkbox" className="sr-only" checked={selectedStrings.includes(string.id)} onChange={() => handleStringToggle(string.id)} /><span className="font-medium">S{string.id}</span></label>))}
          </div>
        </div>
      </div>
      <div className="text-center mb-6">
        <button className="px-8 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleDecipher} disabled={isDeciphering}>
          {isDeciphering ? 'Deciphering...' : 'Decipher Chord'}
        </button>
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Possible Chord Interpretations ({decipherResults.length} found)</h2>
        {decipherResults.length === 0 ? (<p className="text-gray-600">Enter your parameters above and click "Decipher Chord" to see results.</p>) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {decipherResults.map((voicing, index) => {
              const isFavorite = isFavoriteChord(selectedCopedent.id, voicing);
              return (
                <FretboardVisualizer 
                  key={`${voicing.chordName}-${index}`} 
                  voicing={voicing} 
                  chordName={voicing.chordName} 
                  selectedForPdf={pdfExportList.some(v => v.fret === voicing.fret && JSON.stringify(v.pedalCombo) === JSON.stringify(voicing.pedalCombo) && JSON.stringify(v.leverCombo) === JSON.stringify(voicing.leverCombo) && v.chordName === voicing.chordName)} 
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
  );
}

export default ChordDecipher;