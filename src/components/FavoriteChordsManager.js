// src/components/FavoriteChordsManager.js

import React, { useState, useEffect } from 'react';
import { useToast } from '../App';
import { loadFavoriteChordList, saveFavoriteChordList } from '../utils/FavoriteChordStorage';
import { findChordVoicingsWithCache } from '../logic/ChordCalculator';
import { CHORD_TYPES } from '../data/DefaultChordTypes';
import { generateFileName, getFileAcceptAttribute } from '../utils/FileExtensions.js';

function FavoriteChordsManager({ isOpen, onClose, currentCopedent }) {
  const showToast = useToast();
  const [favoriteChords, setFavoriteChords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to calculate where this combo would play C
  const getCReferenceFret = (chordType, pedalCombo, leverCombo, mecCombo) => {
    try {
      // Get chord intervals from CHORD_TYPES
      const intervals = CHORD_TYPES[chordType];
      if (!intervals) return 'Unknown';

      // Find chord voicings for C4 with this chord type
      const cChordVoicings = findChordVoicingsWithCache(
        currentCopedent, 
        'C4', 
        intervals, 
        1, // Just need one result
        true // Full copedent access
      );

      // Find the voicing that matches our pedal/lever combination
      const matchingVoicing = cChordVoicings.find(voicing => 
        JSON.stringify((voicing.pedalCombo || []).sort()) === JSON.stringify((pedalCombo || []).sort()) &&
        JSON.stringify((voicing.leverCombo || []).sort()) === JSON.stringify((leverCombo || []).sort()) &&
        JSON.stringify((voicing.mecCombo || []).sort()) === JSON.stringify((mecCombo || []).sort())
      );

      return matchingVoicing ? matchingVoicing.fret : 'Not found';
    } catch (error) {
      console.error('Error calculating C reference fret:', error);
      return 'Error';
    }
  };

  // Load favorite chords for current copedent
  useEffect(() => {
    if (isOpen && currentCopedent) {
      loadFavoriteChords();
    }
  }, [isOpen, currentCopedent]);

  const loadFavoriteChords = () => {
    setIsLoading(true);
    try {
      const favoritesList = loadFavoriteChordList(currentCopedent.id);
      setFavoriteChords(favoritesList?.favorites || []);
    } catch (error) {
      console.error('Error loading favorite chords:', error);
      showToast('Error loading favorite chords', 'error');
      setFavoriteChords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChord = (chordId) => {
    if (!window.confirm('Are you sure you want to delete this favorite chord and all its customizations?')) {
      return;
    }

    try {
      const favoritesList = loadFavoriteChordList(currentCopedent.id);
      if (!favoritesList) return;

      // Remove the chord
      favoritesList.favorites = favoritesList.favorites.filter(chord => chord.id !== chordId);
      favoritesList.metadata.totalCount = favoritesList.favorites.length;
      favoritesList.metadata.lastModified = new Date().toISOString();

      const success = saveFavoriteChordList(currentCopedent.id, favoritesList);
      if (success) {
        showToast('Favorite chord deleted successfully', 'success');
        loadFavoriteChords(); // Refresh the list
      } else {
        showToast('Failed to delete favorite chord', 'error');
      }
    } catch (error) {
      console.error('Error deleting chord:', error);
      showToast('Error deleting favorite chord', 'error');
    }
  };

  const handleDeleteCustomization = (chordId, customizationId) => {
    if (!window.confirm('Are you sure you want to delete this customization?')) {
      return;
    }

    try {
      const favoritesList = loadFavoriteChordList(currentCopedent.id);
      if (!favoritesList) return;

      // Find the chord and remove the customization
      const chord = favoritesList.favorites.find(c => c.id === chordId);
      if (chord && chord.customizations) {
        chord.customizations = chord.customizations.filter(c => c.id !== customizationId);
        chord.customizationCount = chord.customizations.length;
        chord.hasCustomizations = chord.customizations.length > 0;
        chord.lastModified = new Date().toISOString();
      }

      const success = saveFavoriteChordList(currentCopedent.id, favoritesList);
      if (success) {
        showToast('Customization deleted successfully', 'success');
        loadFavoriteChords(); // Refresh the list
      } else {
        showToast('Failed to delete customization', 'error');
      }
    } catch (error) {
      console.error('Error deleting customization:', error);
      showToast('Error deleting customization', 'error');
    }
  };

  const handleExportAll = () => {
    try {
      const favoritesList = loadFavoriteChordList(currentCopedent.id);
      if (!favoritesList || favoritesList.favorites.length === 0) {
        showToast('No favorite chords to export', 'info');
        return;
      }

      const exportData = {
        copedentId: currentCopedent.id,
        copedentName: currentCopedent.name,
        exportDate: new Date().toISOString(),
        favoriteChords: favoritesList.favorites
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = generateFileName('favorites', currentCopedent.name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Favorite chords exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting favorite chords:', error);
      showToast('Error exporting favorite chords', 'error');
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result);
        
        if (!importData.favoriteChords || !Array.isArray(importData.favoriteChords)) {
          throw new Error('Invalid favorite chords file format');
        }

        const favoritesList = loadFavoriteChordList(currentCopedent.id) || {
          metadata: { totalCount: 0, lastModified: new Date().toISOString() },
          favorites: []
        };

        // Add imported chords (avoid duplicates by ID)
        const existingIds = new Set(favoritesList.favorites.map(c => c.id));
        let addedCount = 0;

        importData.favoriteChords.forEach(chord => {
          if (!existingIds.has(chord.id)) {
            favoritesList.favorites.push(chord);
            addedCount++;
          }
        });

        favoritesList.metadata.totalCount = favoritesList.favorites.length;
        favoritesList.metadata.lastModified = new Date().toISOString();

        const success = saveFavoriteChordList(currentCopedent.id, favoritesList);
        if (success) {
          showToast(`Imported ${addedCount} favorite chords successfully`, 'success');
          loadFavoriteChords(); // Refresh the list
        } else {
          showToast('Failed to import favorite chords', 'error');
        }
      } catch (error) {
        console.error('Error importing favorite chords:', error);
        showToast('Error importing favorite chords: Invalid file format', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = null; // Reset input
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            Manage Favorite Chords - {currentCopedent?.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex space-x-3">
            <button
              onClick={handleExportAll}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={favoriteChords.length === 0}
            >
              📤 Export All
            </button>
            <input
              type="file"
              accept={getFileAcceptAttribute('favorites')}
              onChange={handleImport}
              className="hidden"
              id="import-favorites"
            />
            <label
              htmlFor="import-favorites"
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 cursor-pointer"
            >
              📥 Import
            </label>
          </div>
          <div className="text-sm text-gray-600">
            {favoriteChords.length} favorite chord{favoriteChords.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading favorite chords...</div>
            </div>
          ) : favoriteChords.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">No favorite chords found for this copedent.</div>
              <div className="text-sm text-gray-400 mt-2">
                Add some favorite chords using the star button in the Chord Finder mode!
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {favoriteChords.map(chord => (
                <div key={chord.id} className="border border-gray-200 rounded-lg p-4">
                  {/* Chord Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{chord.chordType}</h3>
                      <div className="text-sm text-gray-600">
                        {chord.pedalCombo?.join('+') || 'No pedals'}
                        {chord.leverCombo?.length > 0 && `+${chord.leverCombo.join('+')}`}
                        {chord.mecCombo?.length > 0 && `+${chord.mecCombo.join('+')}`}
                        {(() => {
                          const cFret = getCReferenceFret(chord.chordType, chord.pedalCombo, chord.leverCombo, chord.mecCombo);
                          return cFret !== 'Unknown' && cFret !== 'Not found' && cFret !== 'Error' 
                            ? ` • C at fret ${cFret}` 
                            : '';
                        })()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Added: {new Date(chord.dateAdded).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteChord(chord.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                    >
                      🗑️ Delete Chord
                    </button>
                  </div>

                  {/* Customizations */}
                  {chord.customizations && chord.customizations.length > 0 && (
                    <div className="ml-4 border-l-2 border-gray-200 pl-4">
                      <h4 className="font-medium text-gray-700 mb-2">
                        Customizations ({chord.customizations.length})
                      </h4>
                      <div className="space-y-2">
                        {chord.customizations.map(customization => (
                          <div key={customization.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <div>
                              <div className="font-medium">{customization.name}</div>
                              <div className="text-xs text-gray-500">
                                Created: {new Date(customization.dateCreated).toLocaleDateString()}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteCustomization(chord.id, customization.id)}
                              className="px-2 py-1 bg-red-400 text-white rounded text-xs hover:bg-red-500"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default FavoriteChordsManager;