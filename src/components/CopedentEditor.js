// src/components/CopedentEditor.js

import React, { useState, useEffect } from 'react';
import { getNoteAtOffset, normalizeNote, isValidNote } from '../logic/NoteUtils';
import { detectSplits as detectSplitsLogic, formatControlCombination } from '../logic/CopedentUtils';
import { useToast } from '../App';
import { useTier } from '../context/TierContext';

const deepClone = (data) => JSON.parse(JSON.stringify(data));

function CopedentEditor({ onSaveCopedent, onCancelCopedentCreation, copedentToEdit }) {
  const showToast = useToast();
  const { userTier, setUserTier } = useTier();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [copedentName, setCopedentName] = useState('');
  const [strings, setStrings] = useState([]);
  const [pedals, setPedals] = useState([]);
  const [kneeLevers, setKneeLevers] = useState([]);
  const [detectedSplits, setDetectedSplits] = useState([]);
  const [editingControl, setEditingControl] = useState({ id: null, type: null });

  const [mechanisms, setMechanisms] = useState([]);
  const [mechanismCombinations, setMechanismCombinations] = useState({});


  useEffect(() => {
    if (copedentToEdit) {
      setCopedentName(copedentToEdit.name);
      setStrings(deepClone(copedentToEdit.strings));
      setPedals(deepClone(copedentToEdit.pedals));
      setKneeLevers(deepClone(copedentToEdit.kneeLevers));
      setDetectedSplits(deepClone(copedentToEdit.detectedSplits));
      setMechanisms(deepClone(copedentToEdit.mechanisms || []));
      setMechanismCombinations(deepClone(copedentToEdit.mechanismCombinations || {}));
      setCurrentPage(1);
    } else {
      setCopedentName('New Copedent');
      setStrings([ { id: 1, openNote: 'E3', changes: {} }, { id: 2, openNote: 'G#3', changes: {} }, { id: 3, openNote: 'B3', changes: {} } ]);
      setPedals([ { id: 'P1', name: 'P1', changes: {} } ]);
      setKneeLevers([
        { id: 'LKL', name: 'LKL', active: false, changes: {} }, { id: 'LKR', name: 'LKR', active: false, changes: {} },
        { id: 'VL', name: 'VL', active: false, changes: {} }, { id: 'RKL', name: 'RKL', active: false, changes: {} },
        { id: 'RKR', name: 'RKR', active: false, changes: {} }, { id: 'VR', name: 'VR', active: false, changes: {} },
        { id: 'LKL2', name: 'LKL2', active: false, changes: {} }, { id: 'LKR2', name: 'LKR2', active: false, changes: {} },
        { id: 'VL2', name: 'VL2', active: false, changes: {} }, { id: 'RKL2', name: 'RKL2', active: false, changes: {} },
        { id: 'RKR2', name: 'RKR2', active: false, changes: {} }, { id: 'VR2', name: 'VR2', active: false, changes: {} },
      ]);
      setMechanisms([]);
      setMechanismCombinations({});
      setDetectedSplits([]);
      setCurrentPage(1);
    }
  }, [copedentToEdit]);

  const handleStringOpenNoteChange = (stringId, rawValue) => {
    let value = rawValue.replace(/[^A-Ga-g#b0-9]/g, '');
    if (value.length > 0) {
        value = value.charAt(0).toUpperCase() + value.slice(1);
    }
    setStrings(prev => prev.map(str => str.id === stringId ? { ...str, openNote: value } : str));
  };
  
  const handleStringOpenNoteBlur = (stringId, currentValue) => {
    if (isValidNote(currentValue)) {
      const normalized = normalizeNote(currentValue);
      setStrings(prev => prev.map(str => str.id === stringId ? { ...str, openNote: normalized } : str));
    }
  };

  const adjustStringOpenNoteSemitone = (stringId, semitoneOffset) => {
    setStrings(prev => prev.map(str => {
      if (str.id === stringId && isValidNote(str.openNote)) {
        return { ...str, openNote: getNoteAtOffset(str.openNote, semitoneOffset) };
      }
      return str;
    }));
  };

  const handleControlChange = (type, controlId, stringId, value) => {
    const semitoneValue = parseInt(value, 10);
    const updater = items => items.map(item => {
        if (item.id !== controlId) return item;
        const newChanges = { ...item.changes };
        if (isNaN(semitoneValue) || semitoneValue === 0) delete newChanges[stringId];
        else newChanges[stringId] = semitoneValue;
        return { ...item, changes: newChanges };
    });
    if (type === 'pedal') setPedals(updater);
    else if (type === 'lever') setKneeLevers(updater);
    else if (type === 'mechanism') setMechanisms(updater);
  };

  const addString = () => {
    if (strings.length >= 20) return showToast('Maximum of 20 strings reached.', 'error');
    const newId = strings.length > 0 ? Math.max(...strings.map(s => s.id)) + 1 : 1;
    setStrings(prev => [...prev, { id: newId, openNote: 'A4', changes: {} }]);
  };

  const removeLastString = () => {
    if (strings.length <= 3) return showToast('Minimum of 3 strings required.', 'error');
    const stringIdToRemove = strings[strings.length - 1].id;
    setStrings(prev => prev.slice(0, -1));
    const remover = items => items.map(p => { const newChanges = { ...p.changes }; delete newChanges[stringIdToRemove]; return { ...p, changes: newChanges }; });
    setPedals(remover);
    setKneeLevers(remover);
    setMechanisms(remover);
  };

  const addPedal = () => {
    // Both Basic and Pro tiers get full copedent editor access
    if (pedals.length >= 15) {
      return showToast('Maximum of 15 pedals reached.', 'error');
    }
    const currentPedalNumbers = pedals.map(p => parseInt(p.id.substring(1))).filter(Boolean);
    const maxPedalNum = currentPedalNumbers.length > 0 ? Math.max(...currentPedalNumbers) : 0;
    const newId = `P${maxPedalNum + 1}`;
    setPedals(prev => [...prev, { id: newId, name: newId, changes: {} }]);
  };

  const removeLastPedal = () => {
    if (pedals.length <= 1) return showToast('Minimum of 1 pedal required.', 'error');
    setPedals(prev => prev.slice(0, -1));
  };
  
  const addMechanism = () => {
    if (mechanisms.length >= 10) return showToast('Maximum of 10 mechanisms reached.', 'error');
    const currentMecNumbers = mechanisms.map(m => parseInt(m.id.substring(1))).filter(Boolean);
    const maxMecNum = currentMecNumbers.length > 0 ? Math.max(...currentMecNumbers) : 0;
    const newId = `M${maxMecNum + 1}`;
    setMechanisms(prev => [...prev, { id: newId, name: newId, changes: {} }]);
  };

  const removeLastMechanism = () => {
    if (mechanisms.length === 0) return;
    setMechanisms(prev => prev.slice(0, -1));
  };

  const toggleKneeLeverActive = (leverId) => {
    setKneeLevers(prev => prev.map(l => l.id === leverId ? { ...l, active: !l.active } : l));
  };

  const handleControlRename = (type, controlId, newName) => {
    if (!newName.trim()) {
      showToast('Name cannot be empty.', 'error');
      return;
    }
    const renamer = items => items.map(p => p.id === controlId ? { ...p, name: newName.trim() } : p);
    if (type === 'pedal') setPedals(renamer);
    else if (type === 'lever') setKneeLevers(renamer);
    else if (type === 'mechanism') setMechanisms(renamer);
    setEditingControl({ id: null, type: null });
  };
  
  const handleRenameKeyDown = (e, type, controlId) => {
      if (e.key === 'Enter') {
          handleControlRename(type, controlId, e.target.value);
      } else if (e.key === 'Escape') {
          setEditingControl({ id: null, type: null });
      }
  };
  
  const handleSplitInclusionChange = (splitIndex, newInclusionState) => {
    setDetectedSplits(prev => prev.map((split, idx) => 
      idx === splitIndex ? { ...split, isIncludedInCalculation: newInclusionState } : split
    ));
  };

  const handleSplitSemitoneChange = (splitIndex, value) => {
    const semitoneValue = parseInt(value, 10);
    setDetectedSplits(prev => prev.map((split, idx) => 
      idx === splitIndex ? { ...split, manualSemitoneChange: isNaN(semitoneValue) ? 0 : semitoneValue } : split
    ));
  };

  const handleSetAllSplitsInclusion = (include) => setDetectedSplits(prev => prev.map(split => ({ ...split, isIncludedInCalculation: include ? 'include' : 'exclude' })));

  const handleAcceptAndNext = () => {
    if (strings.length < 3) return showToast('Minimum of 3 strings required.', 'error');
    if (pedals.length < 1) return showToast('You must define at least 1 pedal.', 'error');
    
    const existingSplits = detectedSplits;
    const newlyDetectedSplits = detectSplitsLogic(strings, pedals, kneeLevers, mechanisms, mechanismCombinations);
    
    const existingResolutionMap = new Map();
    existingSplits.forEach(split => {
      const key = `${split.stringId}-${split.conflictingControls.map(c => c.id).sort().join('_')}`;
      existingResolutionMap.set(key, { 
        isIncluded: split.isIncludedInCalculation,
        semitones: split.manualSemitoneChange
      });
    });
    
    const mergedSplits = newlyDetectedSplits.map(newSplit => {
      const key = `${newSplit.stringId}-${newSplit.conflictingControls.map(c => c.id).sort().join('_')}`;
      const preservedData = existingResolutionMap.get(key);
      return { 
        ...newSplit, 
        isIncludedInCalculation: preservedData ? preservedData.isIncluded : 'DEFINE',
        manualSemitoneChange: preservedData ? preservedData.semitones : newSplit.manualSemitoneChange,
      };
    });

    setDetectedSplits(mergedSplits);
    setCurrentPage(2);
  };
  
  const handleFinishMechanismEditing = () => {
    const existingSplits = detectedSplits;
    const newlyDetectedSplits = detectSplitsLogic(strings, pedals, kneeLevers, mechanisms, mechanismCombinations);

    const existingResolutionMap = new Map();
    existingSplits.forEach(split => {
      const key = `${split.stringId}-${split.conflictingControls.map(c => c.id).sort().join('_')}`;
      existingResolutionMap.set(key, { 
        isIncluded: split.isIncludedInCalculation,
        semitones: split.manualSemitoneChange
      });
    });

    const mergedSplits = newlyDetectedSplits.map(newSplit => {
      const key = `${newSplit.stringId}-${newSplit.conflictingControls.map(c => c.id).sort().join('_')}`;
      const preservedData = existingResolutionMap.get(key);
      return { 
        ...newSplit, 
        isIncludedInCalculation: preservedData ? preservedData.isIncluded : 'DEFINE',
        manualSemitoneChange: preservedData ? preservedData.semitones : newSplit.manualSemitoneChange,
      };
    });

    setDetectedSplits(mergedSplits);
    setCurrentPage(2);
  };

  const handleBack = () => {
    if (currentPage === 1) onCancelCopedentCreation();
    else setCurrentPage(currentPage - 1);
  };

  const handleAcceptAndSaveCopedent = () => {
    const undefinedSplits = detectedSplits.filter(s => s.isIncludedInCalculation === 'DEFINE');
    if (undefinedSplits.length > 0) {
        showToast("You must define all splits as 'Include' or 'Exclude' before saving.", 'error');
        return;
    }

    const copedentData = { id: copedentToEdit ? copedentToEdit.id : null, name: copedentName, strings, pedals, kneeLevers, detectedSplits, mechanisms, mechanismCombinations };
    onSaveCopedent(copedentData);
  };
  
  const handleCombinationChange = (mecId, modifierId) => {
    setMechanismCombinations(prev => {
      const newCombinations = deepClone(prev);
      
      if (!newCombinations[mecId]) newCombinations[mecId] = [];
      if (modifierId.startsWith('M') && !newCombinations[modifierId]) newCombinations[modifierId] = [];

      const isCurrentlyAllowed = newCombinations[mecId].includes(modifierId);

      if (isCurrentlyAllowed) {
        newCombinations[mecId] = newCombinations[mecId].filter(id => id !== modifierId);
        if (modifierId.startsWith('M')) {
          newCombinations[modifierId] = newCombinations[modifierId].filter(id => id !== mecId);
        }
      } else {
        newCombinations[mecId].push(modifierId);
        if (modifierId.startsWith('M')) {
          newCombinations[modifierId].push(mecId);
        }
      }
      return newCombinations;
    });
  };

 const handleSelectAllForRow = (mecId, typeToToggle) => {
  const idsToToggle = typeToToggle === 'pedal'
    ? pedals.map(p => p.id)
    : kneeLevers.filter(l => l.active).map(l => l.id);

  setMechanismCombinations(prev => {
    const newCombinations = deepClone(prev);
    const currentPartners = new Set(newCombinations[mecId] || []);
    const allAreSelected = idsToToggle.every(id => currentPartners.has(id));

    if (allAreSelected) {
      // If all are selected, turn them OFF
      const toggledOffPartners = Array.from(currentPartners).filter(id => !idsToToggle.includes(id));
      newCombinations[mecId] = toggledOffPartners;

      idsToToggle.forEach(id => {
        if (newCombinations[id]) {
          newCombinations[id] = newCombinations[id].filter(partnerId => partnerId !== mecId);
        }
      });
    } else {
      // If some or none are selected, turn them ON
      idsToToggle.forEach(id => currentPartners.add(id));
      newCombinations[mecId] = Array.from(currentPartners);

      idsToToggle.forEach(id => {
        const partners = new Set(newCombinations[id] || []);
        partners.add(mecId);
        newCombinations[id] = Array.from(partners);
      });
    }

    return newCombinations;
  });
};

  const InfoIcon = () => <span style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: '8px', backgroundColor: '#3B82F6', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontFamily: 'serif', fontStyle: 'italic', fontWeight: 'bold', cursor: 'help', userSelect: 'none'}}>i</span>;
  
  const CopedentNameEditorJSX = (
    <div className="mb-6 flex items-center justify-center">
        <label htmlFor="copedent-name" className="text-lg font-semibold mr-2">Copedent Name:</label>
        <input id="copedent-name" type="text" value={copedentName} onChange={(e) => setCopedentName(e.target.value)} className="p-2 border border-gray-300 rounded-md shadow-sm w-64"/>
    </div>
  );

if (currentPage === 1) {
    const activeKneeLevers = kneeLevers.filter(l => l.active);
    const firstRowLevers = kneeLevers.slice(0, 6);
    const secondRowLevers = kneeLevers.slice(6, 12);
    const secondRowLeverIds = secondRowLevers.map(l => l.id);

    return (
      <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
        <div className="absolute top-2 left-2 bg-yellow-200 p-2 rounded-lg shadow-lg z-50">
            <label htmlFor="tier-selector" className="block text-xs font-bold text-yellow-800">DEV: Set Tier</label>
            <select id="tier-selector" value={userTier} onChange={(e) => setUserTier(e.target.value)} className="text-xs p-1 rounded">
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
            </select>
        </div>

        <div className="flex justify-between items-center mb-6">
            <button className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400" onClick={handleBack}>Cancel and Go Back</button>
            <h2 className="text-3xl font-bold text-blue-700">Copedent Editor - Page 1: Definition</h2>
            <button className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600" onClick={handleAcceptAndNext}>Accept and Next</button>
        </div>

        {CopedentNameEditorJSX}
        
        <div className="mb-6 bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold mb-3 text-gray-800 flex items-center">Select Active Knee Levers <div title="Activate knee levers to include them in the main table below. Click a lever's name in the table to rename it."><InfoIcon /></div></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-3 gap-4">
                    {firstRowLevers.map(lever => (<label key={lever.id} className="inline-flex items-center cursor-pointer" title={`Toggle the ${lever.name} knee lever`}><input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600 rounded" checked={lever.active} onChange={() => toggleKneeLeverActive(lever.id)}/><span className="ml-2 text-gray-700">{lever.name}</span></label>))}
                </div>
                <div className="relative p-3 border rounded-lg border-gray-200">
                    <div className="grid grid-cols-3 gap-4">
                       {secondRowLevers.map(lever => (<label key={lever.id} className="inline-flex items-center cursor-pointer" title={`Toggle the ${lever.name} knee lever`}><input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600 rounded" checked={lever.active} onChange={() => toggleKneeLeverActive(lever.id)}/><span className="ml-2 text-gray-700">{lever.name}</span></label>))}
                    </div>
                </div>
            </div>
        </div>
        <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-100 z-20"><div className="flex items-center"><span>String #</span><div className="ml-2 flex space-x-1"><button onClick={addString} className="w-6 h-6 bg-green-500 text-white rounded flex items-center justify-center text-lg font-bold hover:bg-green-600" title="Add String">+</button><button onClick={removeLastString} className="w-6 h-6 bg-red-500 text-white rounded flex items-center justify-center text-lg font-bold hover:bg-red-600" title="Remove Last String">-</button></div><div title="Use the +/- buttons to add or remove strings from the bottom of the list."><InfoIcon /></div></div></th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-16 bg-gray-100 z-20">Open Tuning</th>
                <th colSpan={pedals.length} className="relative border-l border-gray-300 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"><div className="flex items-center justify-center"><span>Pedals</span><div className="ml-2 flex space-x-1"><button onClick={addPedal} className="w-6 h-6 bg-green-500 text-white rounded flex items-center justify-center text-lg font-bold hover:bg-green-600" title="Add Pedal">+</button><button onClick={removeLastPedal} className="w-6 h-6 bg-red-500 text-white rounded flex items-center justify-center text-lg font-bold hover:bg-red-600" title="Remove Last Pedal">-</button></div><div title="Use the +/- buttons to add or remove pedals. Click a pedal's name to rename it."><InfoIcon /></div></div></th>
                {activeKneeLevers.length > 0 && (<th colSpan={activeKneeLevers.length} className="border-l border-gray-300 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Knee Levers</th>)}
              </tr>
              <tr>
                <th className="px-4 py-2 sticky left-0 bg-gray-100 z-20"></th><th className="px-4 py-2 sticky left-16 bg-gray-100 z-20"></th>
                {pedals.map((pedal, index) => {
                  const isDisabled = false; // Both Basic and Pro tiers get full pedal access
                  return (
                    <th key={pedal.id} className={`group relative px-2 py-1 text-center text-xs font-medium text-gray-700 uppercase ${isDisabled ? 'opacity-50' : ''}`}>
                      {editingControl.id === pedal.id ? (
                        <input type="text" defaultValue={pedal.name} autoFocus onBlur={(e) => handleControlRename('pedal', pedal.id, e.target.value)} onKeyDown={(e) => handleRenameKeyDown(e, 'pedal', pedal.id)} className="w-16 p-1 text-center border border-blue-500 rounded" disabled={isDisabled}/>
                      ) : (
                        <span className={isDisabled ? '' : 'cursor-pointer hover:underline'} onClick={() => !isDisabled && setEditingControl({id: pedal.id, type: 'pedal'})} title={isDisabled ? "Available in Pro Tier" : "Click to rename"}>{pedal.name}</span>
                      )}
                    </th>
                  );
                })}
                {activeKneeLevers.map(lever => {
  const isDisabled = false; // Both Basic and Pro tiers get full lever access

  return (
    <th key={lever.id} className={`group relative border-l border-gray-300 px-2 py-1 text-center text-xs font-medium text-gray-700 uppercase ${isDisabled ? 'opacity-50' : ''}`}>
      {editingControl.id === lever.id ? (
        <input type="text" defaultValue={lever.name} autoFocus onBlur={(e) => handleControlRename('lever', lever.id, e.target.value)} onKeyDown={(e) => handleRenameKeyDown(e, 'lever', lever.id)} className="w-16 p-1 text-center border border-blue-500 rounded" disabled={isDisabled}/>
      ) : (
        <span className={isDisabled ? '' : 'cursor-pointer hover:underline'} onClick={() => !isDisabled && setEditingControl({id: lever.id, type: 'lever'})} title={isDisabled ? "Available in Pro Tier" : "Click to rename"}>
          {lever.name}
        </span>
      )}
      {/* This is the new part that adds the yellow tag */}
    </th>
  );
})}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {strings.map(string => (
                <tr key={string.id} className="group">
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10"><div className="flex items-center justify-between pr-2"><span>S{string.id}</span></div></td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 sticky left-16 bg-white z-10">
                    <div className="flex items-center space-x-1">
                        <input type="text" value={string.openNote} onChange={(e) => handleStringOpenNoteChange(string.id, e.target.value)} onBlur={(e) => handleStringOpenNoteBlur(string.id, e.target.value)} className="w-20 p-1 border border-gray-300 rounded-sm text-center" title="Enter note (e.g., C4, G#3)"/>
                        <button onClick={() => adjustStringOpenNoteSemitone(string.id, 1)} className="text-blue-500 hover:text-blue-700 text-xl font-bold leading-none" title="Increase semitone by 1">+</button>
                        <button onClick={() => adjustStringOpenNoteSemitone(string.id, -1)} className="text-blue-500 hover:text-blue-700 text-xl font-bold leading-none" title="Decrease semitone by 1">-</button>
                    </div>
                  </td>
                  {pedals.map((pedal, index) => {
                    const isDisabled = false; // Both Basic and Pro tiers get full pedal access
                    const currentChange = pedal.changes[string.id] || '';
                    const resultingNote = isValidNote(string.openNote) && currentChange && getNoteAtOffset(string.openNote, currentChange);
                    return (
                      <td key={pedal.id} className={`px-2 py-1 border-l border-gray-200 whitespace-nowrap text-sm text-center ${isDisabled ? 'bg-gray-100 opacity-60' : (currentChange ? 'bg-orange-200' : '')}`}>
                        <div className="flex flex-row items-center justify-center space-x-1">
                          <input type="number" value={currentChange} onChange={(e) => handleControlChange('pedal', pedal.id, string.id, e.target.value)} className="w-14 p-1 border border-gray-300 rounded-sm text-center" placeholder="0" title={isDisabled ? "Available in Pro Tier" : "Enter semitone change (+/-)"} disabled={isDisabled} />
                          {resultingNote && (<span className="text-xs text-gray-500 w-10 text-left">({resultingNote})</span>)}
                        </div>
                      </td>
                    );
                  })}
                  {activeKneeLevers.map(lever => {
  const isDisabled = false; // Both Basic and Pro tiers get full lever access
  const currentChange = lever.changes[string.id] || '';
  const resultingNote = isValidNote(string.openNote) && currentChange && getNoteAtOffset(string.openNote, currentChange);
  return (
    <td key={lever.id} className={`px-2 py-1 border-l border-gray-200 whitespace-nowrap text-sm text-center ${isDisabled ? 'bg-gray-100 opacity-60' : (currentChange ? 'bg-orange-200' : '')}`}>
      <div className="flex flex-row items-center justify-center space-x-1">
        <input 
          type="number" 
          value={currentChange} 
          onChange={(e) => handleControlChange('lever', lever.id, string.id, e.target.value)} 
          className="w-14 p-1 border border-gray-300 rounded-sm text-center" 
          placeholder="0" 
          title={isDisabled ? "Available in Pro Tier" : "Enter semitone change (+/-)"} 
          disabled={isDisabled}
        />
        {resultingNote && (<span className="text-xs text-gray-500 w-10 text-left">({resultingNote})</span>)}
      </div>
    </td>
  );
})}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (currentPage === 2) {
    const secondRowLeverIds = kneeLevers.slice(6, 12).map(l => l.id);

    return (
      <div key="copedent-editor-page-2" className="container mx-auto p-4 bg-gray-50 min-h-screen">
        <div className="absolute top-2 left-2 bg-yellow-200 p-2 rounded-lg shadow-lg z-50">
            <label htmlFor="tier-selector" className="block text-xs font-bold text-yellow-800">DEV: Set Tier</label>
            <select id="tier-selector" value={userTier} onChange={(e) => setUserTier(e.target.value)} className="text-xs p-1 rounded">
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
            </select>
        </div>
        <div className="flex justify-between items-center mb-6">
            <button className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400" onClick={() => setCurrentPage(1)}>Back</button>
            <h2 className="text-3xl font-bold text-blue-700">Copedent Editor - Page 2: Splits & Advanced</h2>
            <button className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600" onClick={handleAcceptAndSaveCopedent}>Accept and Save Copedent</button>
        </div>
        
        {CopedentNameEditorJSX}

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Splits Table:</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentPage(3)}
                  className="px-6 py-2 bg-orange-500 text-white font-semibold rounded-md hover:bg-orange-600"
                  title="Define custom mechanisms"
                >
                  Custom Mechanisms
                </button>
                {detectedSplits.length > 0 && (
                  <div className="flex space-x-2">
                    <button onClick={() => handleSetAllSplitsInclusion(true)} className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs" title="Set all splits below to be included in calculations.">Include All</button>
                    <button onClick={() => handleSetAllSplitsInclusion(false)} className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-xs" title="Set all splits below to be excluded from calculations.">Exclude All</button>
                  </div>
                )}
              </div>
            </div>
          {detectedSplits.length === 0 ? (<p className="text-gray-600">No Splits detected with current setup.</p>) : (
            <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-300"><thead className="bg-gray-100"><tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STRING - OPEN TUNING</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P/KL Combo</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" title="Enter the final semitone change that results from this combination, relative to the fretted note. For example, enter 0 if the combination cancels out any change.">
                      <div className="flex items-center">Resulting Change (st)<InfoIcon /></div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" title="You must define every split as either 'Include' or 'Exclude' before you can save the copedent.">
                      <div className="flex items-center">Action<InfoIcon /></div>
                    </th>
                    </tr></thead>
                <tbody className="bg-white divide-y divide-gray-200">{detectedSplits.map((split, index) => {
                    const isDisabled = false; // Both Basic and Pro tiers get full split management
                    const pedalIds = split.conflictingControls.filter(c => c.type === 'pedal').map(c => c.id);
                    const leverIds = split.conflictingControls.filter(c => c.type === 'lever').map(c => c.id);
                    const mechanismIds = split.conflictingControls.filter(c => c.type === 'mechanism').map(c => c.id);
                    const tempCopedentForFormatting = { pedals, kneeLevers, mechanisms };
                    return (
                      <tr 
                        key={`${split.stringId}-${split.conflictingControls.map(c => c.id).sort().join('-')}`}
                        className={`${isDisabled ? 'bg-gray-100 opacity-60' : ''} ${!isDisabled && mechanismIds.length > 0 ? 'bg-blue-50' : ''}`}
                        title={isDisabled ? "This split involves controls from the Pro tier and is disabled." : ""}
                      >
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{split.stringId} - {split.openNote}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{formatControlCombination(pedalIds, leverIds, mechanismIds, tempCopedentForFormatting)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex items-center space-x-2">
                            <input 
                              type="number" 
                              value={split.manualSemitoneChange} 
                              onChange={(e) => handleSplitSemitoneChange(index, e.target.value)}
                              className="w-20 p-1 border border-gray-300 rounded-sm text-center"
                              title="Enter final semitone change"
                              disabled={isDisabled}
                            />
                            <span className="text-blue-600 font-medium">
                              {(() => {
                                const semitoneChange = parseInt(split.manualSemitoneChange) || 0;
                                try {
                                  return getNoteAtOffset(split.openNote, semitoneChange);
                                } catch (error) {
                                  return '—';
                                }
                              })()}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex space-x-2">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`split-action-${index}`}
                                value="include"
                                checked={!isDisabled && split.isIncludedInCalculation === 'include'}
                                onChange={(e) => handleSplitInclusionChange(index, e.target.value)}
                                disabled={isDisabled}
                                className="mr-1 text-blue-600"
                              />
                              <span className="text-xs">Include</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`split-action-${index}`}
                                value="exclude"
                                checked={isDisabled || split.isIncludedInCalculation === 'exclude'}
                                onChange={(e) => handleSplitInclusionChange(index, e.target.value)}
                                disabled={isDisabled}
                                className="mr-1 text-gray-600"
                              />
                              <span className="text-xs">Exclude</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={`split-action-${index}`}
                                value="DEFINE"
                                checked={!isDisabled && split.isIncludedInCalculation === 'DEFINE'}
                                onChange={(e) => handleSplitInclusionChange(index, e.target.value)}
                                disabled={isDisabled}
                                className="mr-1 text-red-600"
                              />
                              <span className="text-xs font-bold text-red-700">DEFINE</span>
                            </label>
                          </div>
                        </td>
                      </tr>);
                })}</tbody></table></div>)}
        </div>
      </div>
    );
  }

  if (currentPage === 3) {
     return (
      <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
            <button className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400" onClick={() => setCurrentPage(2)}>Back</button>
            <h2 className="text-3xl font-bold text-blue-700">Copedent Editor - Page 3: Mechanism Definition</h2>
            <button className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600" onClick={() => setCurrentPage(4)}>Next: Define Combinations</button>
        </div>

        {CopedentNameEditorJSX}
        
        <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-100 z-20">String #</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-16 bg-gray-100 z-20">Open Tuning</th>
                <th colSpan={mechanisms.length} className="relative border-l border-gray-300 px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"><div className="flex items-center justify-center"><span>Mechanisms</span><div className="ml-2 flex space-x-1"><button onClick={addMechanism} className="w-6 h-6 bg-green-500 text-white rounded flex items-center justify-center text-lg font-bold hover:bg-green-600" title="Add Mechanism">+</button><button onClick={removeLastMechanism} className="w-6 h-6 bg-red-500 text-white rounded flex items-center justify-center text-lg font-bold hover:bg-red-600" title="Remove Last Mechanism">-</button></div><div title="Use the +/- buttons to add or remove mechanisms. Click a mechanism's name to rename it."><InfoIcon /></div></div></th>
              </tr>
              <tr>
                <th className="px-4 py-2 sticky left-0 bg-gray-100 z-20"></th><th className="px-4 py-2 sticky left-16 bg-gray-100 z-20"></th>
                {mechanisms.map(mec => (<th key={mec.id} className="group relative px-2 py-1 text-center text-xs font-medium text-gray-700 uppercase">{editingControl.id === mec.id ? (<input type="text" defaultValue={mec.name} autoFocus onBlur={(e) => handleControlRename('mechanism', mec.id, e.target.value)} onKeyDown={(e) => handleRenameKeyDown(e, 'mechanism', mec.id)} className="w-16 p-1 text-center border border-blue-500 rounded"/>) : (<span className="cursor-pointer hover:underline" onClick={() => setEditingControl({id: mec.id, type: 'mechanism'})} title="Click to rename">{mec.name}</span>)}</th>))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {strings.map(string => (
                <tr key={string.id} className="group">
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">S{string.id}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 sticky left-16 bg-white z-10">{string.openNote}</td>
                  {mechanisms.map(mec => {
                    const currentChange = mec.changes[string.id] || '';
                    const resultingNote = isValidNote(string.openNote) && currentChange && getNoteAtOffset(string.openNote, currentChange);
                    return (<td key={mec.id} className={`px-2 py-1 border-l border-gray-200 whitespace-nowrap text-sm text-center ${currentChange ? 'bg-orange-200' : ''}`}><div className="flex flex-row items-center justify-center space-x-1"><input type="number" value={currentChange} onChange={(e) => handleControlChange('mechanism', mec.id, string.id, e.target.value)} className="w-14 p-1 border border-gray-300 rounded-sm text-center" placeholder="0" title="Enter semitone change (+/-)" />{resultingNote && (<span className="text-xs text-gray-500 w-10 text-left">({resultingNote})</span>)}</div></td>);
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (currentPage === 4) {
    const allModifiers = [
        ...pedals,
        ...kneeLevers.filter(l => l.active),
        ...mechanisms
    ];

    return (
      <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
            <button className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400" onClick={() => setCurrentPage(3)}>Back</button>
            <h2 className="text-3xl font-bold text-blue-700">Copedent Editor - Page 4: Mechanism Combinations</h2>
            <button className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600" onClick={handleFinishMechanismEditing}>Finish and Return to Splits</button>
        </div>
        
        {CopedentNameEditorJSX}
        
        <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-100 z-20">Mechanism</th>
                {allModifiers.map(mod => (
                    <th key={mod.id} className="px-2 py-1 text-center text-xs font-medium text-gray-700 uppercase">{mod.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mechanisms.map(mec => (
                <tr key={mec.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                    <div className="flex flex-col items-start">
                      <span>{mec.name}</span>
                      <div className="flex space-x-1 mt-1">
                        <button onClick={() => handleSelectAllForRow(mec.id, 'pedal')} className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-800 rounded hover:bg-blue-200">
                          All Pedals
                        </button>
                        <button onClick={() => handleSelectAllForRow(mec.id, 'lever')} className="px-1.5 py-0.5 text-[10px] bg-green-100 text-green-800 rounded hover:bg-green-200">
                          All Levers
                        </button>
                      </div>
                    </div>
                  </td>
                  {allModifiers.map(modifier => {
                    const isChecked = mechanismCombinations[mec.id]?.includes(modifier.id) || false;
                    const isDisabled = mec.id === modifier.id;
                    return (
                      <td key={modifier.id} className="px-2 py-1 border-l border-gray-200 text-center">
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 text-blue-600 rounded"
                          checked={isChecked}
                          disabled={isDisabled}
                          onChange={() => handleCombinationChange(mec.id, modifier.id)}
                          title={isDisabled ? "Cannot combine a mechanism with itself" : `Allow ${mec.name} to combine with ${modifier.name}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return <div className="container mx-auto p-4 bg-red-100 text-red-800"><h2 className="text-3xl font-bold mb-6 text-center">Error: Unknown Copedent Editor Page</h2><p className="text-center">Current page: {currentPage}.</p></div>;
}

export default CopedentEditor;