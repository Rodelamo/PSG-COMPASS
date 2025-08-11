// src/components/ScaleExportListModal.js

import React, { useState } from 'react';
import SoundService from '../logic/SoundService';
import { SCALES } from '../data/Scales';
import { getNoteAtOffset } from '../logic/NoteUtils';
import FretboardDiagram from './FretboardDiagram';
import { formatControlCombination } from '../logic/CopedentUtils'; // MODIFIED: Import formatter

function ScaleExportListModal({ exportList, onClose, onRemoveItem, onClearAll, onExportPdf, onReorderItem }) {
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [playingScaleId, setPlayingScaleId] = useState(null);

  const handleModalContentClick = (e) => e.stopPropagation();

  const handleLocalExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    await onExportPdf();
    setIsExporting(false);
  };

  const handlePlayScale = (scaleItem) => {
    if (playingScaleId) return;
    const { rootNote, scaleName } = scaleItem;
    const scaleIntervals = SCALES[scaleName];
    if (!scaleIntervals) return;

    const rootNoteForPlayback = `${rootNote}4`;
    const notesToPlay = scaleIntervals.map(interval => getNoteAtOffset(rootNoteForPlayback, interval));
    notesToPlay.push(getNoteAtOffset(rootNoteForPlayback, 12));

    setPlayingScaleId(scaleItem.id);
    SoundService.resumeAudioContext();
    let delay = 0;
    const noteDurationMs = 300;

    notesToPlay.forEach(note => {
      setTimeout(() => SoundService.playSingleNote(note), delay);
      delay += noteDurationMs;
    });

    setTimeout(() => setPlayingScaleId(null), delay);
  };

  const renderContent = () => {
    if (isPreviewVisible) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {exportList.map(scaleData => {
            // MODIFIED: Generate combo text for the preview
            const comboText = formatControlCombination(scaleData.activePedals, scaleData.activeLevers, scaleData.activeMechanisms, scaleData.copedent);
            return (
              <div key={scaleData.id} className="relative border p-4 rounded-lg">
                  <h3 className="text-lg font-bold text-center">{scaleData.rootNote} {scaleData.scaleName}</h3>
                  {comboText !== 'Open' && <p className="text-sm text-blue-700 text-center">{comboText}</p>}
                  <p className="text-xs text-gray-500 text-center mb-2">({scaleData.copedent.name})</p>
                  <FretboardDiagram notesToDisplay={scaleData.notesOnFretboard} copedent={scaleData.copedent} />
                  <button onClick={() => handlePlayScale(scaleData)} disabled={!!playingScaleId} className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 text-sm">
                      {playingScaleId === scaleData.id ? '...' : 'Play'}
                  </button>
              </div>
            );
          })}
        </div>
      );
    }

    // Default List View
    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10">#</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">SCALE</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ROOT</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">COPEDENT</th>
            {/* MODIFIED: Added Combination column */}
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">COMBINATION</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">REORDER</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">PLAY</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">ACTION</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {exportList.map((scaleItem, index) => (
            <tr key={scaleItem.id}>
              <td className="px-3 py-2 text-sm text-gray-900 text-center">{index + 1}</td>
              <td className="px-3 py-2 text-sm text-gray-700 text-center">{scaleItem.scaleName}</td>
              <td className="px-3 py-2 text-sm text-gray-700 text-center">{scaleItem.rootNote}</td>
              <td className="px-3 py-2 text-sm text-gray-700 text-center">{scaleItem.copedent.name}</td>
              {/* MODIFIED: Added cell for combo text */}
              <td className="px-3 py-2 text-sm text-gray-700 text-center">{formatControlCombination(scaleItem.activePedals, scaleItem.activeLevers, scaleItem.activeMechanisms, scaleItem.copedent)}</td>
              <td className="px-3 py-2 text-sm text-center">
                <div className="flex justify-center items-center space-x-2">
                    <button onClick={() => onReorderItem(index, -1)} disabled={index === 0} className="font-bold text-xl text-gray-600 hover:text-black disabled:text-gray-300" title="Move Up">↑</button>
                    <button onClick={() => onReorderItem(index, 1)} disabled={index === exportList.length - 1} className="font-bold text-xl text-gray-600 hover:text-black disabled:text-gray-300" title="Move Down">↓</button>
                </div>
              </td>
              <td className="px-3 py-2 text-sm text-center">
                 <button onClick={() => handlePlayScale(scaleItem)} disabled={!!playingScaleId} className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 text-xs">
                    {playingScaleId === scaleItem.id ? '...' : 'Play'}
                 </button>
              </td>
              <td className="px-3 py-2 text-sm text-center">
                <button onClick={() => onRemoveItem(scaleItem)} className="text-red-600 hover:text-red-800 font-bold text-lg" title="Remove this item">&times;</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col" onClick={handleModalContentClick}>
        <h2 className="text-2xl font-bold mb-4 text-center text-purple-700">Selected Scales for PDF Export</h2>

        <div className="flex justify-end items-center mb-4 p-2 bg-gray-100 rounded-lg">
          <button onClick={() => setIsPreviewVisible(!isPreviewVisible)} className="px-4 py-1 bg-purple-500 text-white rounded-md hover:bg-purple-600 text-sm">
            {isPreviewVisible ? 'Show List' : 'Show Preview'}
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto mb-6 border border-gray-300 rounded-md p-4">
          {exportList.length === 0 ? <p className="text-gray-600 text-center py-8">No scales selected.</p> : renderContent()}
        </div>

        <div className="flex justify-between items-center mt-auto">
          <button className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400" onClick={onClose}>Go Back</button>
          <div className="flex space-x-4">
            <button className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600" onClick={onClearAll}>Clear All</button>
            <button className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50" onClick={handleLocalExport} disabled={exportList.length === 0 || isExporting}>
              {isExporting ? 'Generating...' : 'Export to PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScaleExportListModal;