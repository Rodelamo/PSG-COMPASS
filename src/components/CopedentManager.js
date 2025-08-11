// src/components/CopedentManager.js

import React, { useRef, useState } from 'react';
import FavoriteChordsManager from './FavoriteChordsManager';
import { getFileAcceptAttribute } from '../utils/FileExtensions.js';

function CopedentManager({
  selectedCopedent,
  allCopedents,
  onCopedentSelect,
  onCreateNewCopedent,
  onEditCurrentCopedent,
  onDeleteCopedent,
  onImportCopedent,
  onExportCopedent,
}) {
  const fileInputRef = useRef(null);
  const [isFavoritesManagerOpen, setIsFavoritesManagerOpen] = useState(false);

  const handleCopedentSelectionChange = (e) => {
    const value = e.target.value;
    if (value === 'create-new') {
      onCreateNewCopedent();
    } else {
      const newCopedent = allCopedents.find(c => c.id === value);
      if (newCopedent) {
        onCopedentSelect(newCopedent);
      }
    }
  };

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        onImportCopedent(importedData);
      } catch (error) {
        console.error("Import error:", error);
        // Assuming onImportCopedent shows its own toasts
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  const isCustomCopedentSelected = selectedCopedent && selectedCopedent.id.startsWith('custom-');

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-6">
      {/* Favorite Chords Manager Button - Upper Left Corner */}
      <div className="flex justify-between items-start mb-4">
        <button
          onClick={() => setIsFavoritesManagerOpen(true)}
          className="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-sm font-medium"
          title="Manage all favorite chords and customizations for this copedent"
        >
          ⭐ Manage Favorites
        </button>
      </div>
      
      <div className="flex items-center justify-center space-x-4 mb-4">
        <label htmlFor="copedent-select" className="text-lg font-semibold text-gray-700">Current Copedent:</label>
        <select
          id="copedent-select"
          className="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedCopedent ? selectedCopedent.id : ''}
          onChange={handleCopedentSelectionChange}
        >
          {/* MODIFIED: Removed className and added "Def-" prefix to default copedents. */}
          {allCopedents.map(copedent => {
            const isDefault = !copedent.id.startsWith('custom-');
            return (
              <option
                key={copedent.id}
                value={copedent.id}
              >
                {isDefault ? `Def - ${copedent.name}` : copedent.name}
              </option>
            );
          })}
          <option value="create-new" className="font-bold text-blue-600">Create New...</option>
        </select>
      </div>
      <div className="flex items-center justify-center space-x-2">
        <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm" onClick={() => fileInputRef.current.click()} title="Import a copedent from a .cop file">Import Copedent</button>
        <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm" onClick={onExportCopedent} title="Export the current copedent to a .cop file">Export Copedent</button>
        <button className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 text-sm" onClick={onEditCurrentCopedent} title="Edit the currently selected copedent">Edit Copedent</button>
        <button className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => onDeleteCopedent(selectedCopedent)} disabled={!isCustomCopedentSelected} title={isCustomCopedentSelected ? "Delete the current custom copedent" : "Only custom copedents can be deleted"}>Delete Copedent</button>
        <input type="file" ref={fileInputRef} className="hidden" accept={getFileAcceptAttribute('copedent')} onChange={handleFileImport} />
      </div>
      
      {/* Favorite Chords Manager Modal */}
      {isFavoritesManagerOpen && (
        <FavoriteChordsManager
          isOpen={isFavoritesManagerOpen}
          onClose={() => setIsFavoritesManagerOpen(false)}
          currentCopedent={selectedCopedent}
        />
      )}
    </div>
  );
}

export default CopedentManager;