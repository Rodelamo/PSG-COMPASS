// src/components/ExportListModal.js

import React, { useState } from 'react';
import { formatControlCombination } from '../logic/CopedentUtils';
import SoundService from '../logic/SoundService';
import FretboardVisualizer from './FretboardVisualizer';

const ArpIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
        <path d="M6 18H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M9 14H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M15 6H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);
const PluckIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
        <path d="M7 6H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M7 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M7 14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M7 18H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

const SplitPlayButton = ({ voicing, isPlaying, onPlay }) => {
  const handlePlayArp = (e) => {
    e.stopPropagation();
    onPlay(voicing, 'strum');
  };
  const handlePlayPluck = (e) => {
    e.stopPropagation();
    onPlay(voicing, 'pluck');
  };

  return (
    <div className="flex rounded-md shadow-sm">
      <button onClick={handlePlayArp} disabled={isPlaying} title="Play as Arpeggio" className="flex items-center px-2 py-1 text-xs rounded-l-md text-white bg-green-500 hover:bg-green-600 disabled:bg-gray-400">
        <ArpIcon />
      </button>
      <button onClick={handlePlayPluck} disabled={isPlaying} title="Play as Pluck (Block Chord)" className="flex items-center px-2 py-1 text-xs rounded-r-md border-l border-green-600 text-white bg-green-500 hover:bg-green-600 disabled:bg-gray-400">
        <PluckIcon />
      </button>
    </div>
  );
};


function TabPreview({ voicing, copedent, onPlay, isPlaying }) {
  const allStrings = copedent.strings.sort((a, b) => a.id - b.id);
  
  return (
    <div className="bg-white p-3 border-2 border-gray-400 rounded-lg shadow-sm">
      {/* Header with chord name and controls */}
      <div className="text-center mb-2">
        <div className="flex items-center justify-center space-x-1 bg-gray-200 border border-gray-400 rounded-t-md p-1 mb-1">
          <SplitPlayButton voicing={voicing} isPlaying={isPlaying} onPlay={onPlay} />
        </div>
        <div className="bg-white border border-gray-300 border-t-0 rounded-b-lg p-2">
          <p className="font-bold text-gray-800 text-sm">{voicing.chordName}</p>
          <p className="text-xs text-blue-700 font-semibold">{formatControlCombination(voicing.pedalCombo, voicing.leverCombo, voicing.mecCombo, copedent) || 'Open'}</p>
        </div>
      </div>
      
      {/* Tablature grid matching ProgressionTablature format */}
      <div className="bg-gray-50 rounded-md p-2">
        <div className="inline-flex space-x-0">
          {/* String labels column */}
          <div className="flex-shrink-0 w-12 bg-white">
            {allStrings.map((string, stringIndex) => {
              const isLastString = stringIndex === allStrings.length - 1;
              return (
                <div key={`label-${string.id}`} className={`relative h-6 border-t border-gray-400 flex items-center justify-center text-xs ${stringIndex === 0 ? 'border-t-2' : ''} ${isLastString ? 'border-b-2' : ''}`}>
                  {/* String line background */}
                  <div className="absolute inset-0 border-t-2 border-gray-800"></div>
                  <span className="text-xs font-mono text-gray-600 bg-white px-1 z-10">
                    {string.id} {string.openNote.replace(/\d+$/, '')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Single chord column */}
          <div className="flex-shrink-0">
            <div className="w-24 border-l border-r border-gray-400">
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
                  activeControlsForString = formatControlCombination(pedalIds, leverIds, mecIds, copedent).replace(/[()]/g, '');
                }
                
                const isLastString = stringIndex === allStrings.length - 1;
                
                return (
                  <div key={string.id} className={`relative h-6 border-t border-gray-400 flex items-center ${stringIndex === 0 ? 'border-t-2' : ''} ${isLastString ? 'border-b-2' : ''}`}>
                    {/* String line background */}
                    <div className="absolute inset-0 border-t-2 border-gray-800"></div>
                    
                    {/* Fret number and control indicators - aligned like PDF */}
                    <div className="w-full flex items-center relative">
                      {isPlayed && (
                        <>
                          {/* Fret number - left side, consistent position */}
                          <div className="absolute left-2">
                            <span className="font-bold text-xs text-gray-900 bg-white px-1 z-10">
                              {fretNumber}
                            </span>
                          </div>
                          {/* Control indicators - right side of fret number */}
                          {activeControlsForString && (
                            <div className="absolute left-6">
                              <span className="text-[10px] font-bold text-gray-900 bg-white px-1 z-10">
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
          </div>

          {/* String numbers column */}
          <div className="flex-shrink-0 w-6 bg-white">
            {allStrings.map((string, stringIndex) => {
              const isLastString = stringIndex === allStrings.length - 1;
              return (
                <div key={`right-${string.id}`} className={`relative h-6 border-t border-gray-400 flex items-center justify-center ${stringIndex === 0 ? 'border-t-2' : ''} ${isLastString ? 'border-b-2' : ''}`}>
                  {/* String line background */}
                  <div className="absolute inset-0 border-t-2 border-gray-800"></div>
                  <span className="text-xs font-mono text-gray-600 bg-white px-1 z-10">{string.id}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


function ExportListModal({ exportList, selectedCopedent, onClose, onRemoveItem, onClearAll, onExportPdf, onReorderItem }) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('diagram');
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [playingExportId, setPlayingExportId] = useState(null);
  const [headerText, setHeaderText] = useState('');

  const handleModalContentClick = (e) => e.stopPropagation();

  const handleLocalExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    await onExportPdf(exportFormat, headerText);
    setIsExporting(false);
  };

  // MODIFIED: This now replicates the long-decay strum from the main visualizer.
  const handlePlayChord = (voicing, playType = 'strum') => {
    if (playingExportId) return;
    const notesToPlay = voicing.notes.filter(n => n.isPlayedInVoicing);
    if (notesToPlay.length === 0) return;

    setPlayingExportId(voicing.exportId);
    SoundService.resumeAudioContext();
    
    if (playType === 'pluck') {
        SoundService.playBlockChord(notesToPlay);
        setTimeout(() => setPlayingExportId(null), 1000);
    } else {
        const sortedNotes = notesToPlay.sort((a, b) => b.stringId - a.stringId);
        let delay = 0;
        const strumSpeedMs = 333;
        sortedNotes.forEach(note => {
            setTimeout(() => {
                SoundService.playSingleNote(note.finalNote, 1.5);
            }, delay);
            delay += strumSpeedMs;
        });
        setTimeout(() => {
            setPlayingExportId(null);
        }, delay + 300);
    }
  };

  const renderContent = () => {
    if (isPreviewVisible) {
      if (exportFormat === 'tablature') {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exportList.map(voicing => (
              <TabPreview key={voicing.exportId} voicing={voicing} copedent={selectedCopedent} onPlay={handlePlayChord} isPlaying={playingExportId === voicing.exportId} />
            ))}
          </div>
        );
      } else {
        return (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {exportList.map(voicing => (
                    <div key={voicing.exportId} className="relative">
                        <FretboardVisualizer voicing={voicing} chordName={voicing.chordName} isPdfMode={true} />
                         <div className="absolute top-20 right-4">
                            <SplitPlayButton voicing={voicing} isPlaying={!!playingExportId} onPlay={handlePlayChord} />
                        </div>
                    </div>
                ))}
            </div>
        )
      }
    }

    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10">#</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">CHORD</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">FRET</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">PEDALS/LEVERS</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">REORDER</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">PLAY</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">ACTION</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {exportList.map((voicing, index) => (
            <tr key={voicing.exportId}>
              <td className="px-3 py-2 text-sm text-gray-900 text-center">{index + 1}</td>
              <td className="px-3 py-2 text-sm text-gray-700 text-center">{voicing.chordName}</td>
              <td className="px-3 py-2 text-sm text-gray-700 text-center">{voicing.fret}</td>
              <td className="px-3 py-2 text-sm text-gray-700 text-center">{formatControlCombination(voicing.pedalCombo, voicing.leverCombo, voicing.mecCombo, selectedCopedent)}</td>
              <td className="px-3 py-2 text-sm text-center">
                <div className="flex justify-center items-center space-x-2">
                    <button onClick={() => onReorderItem(index, -1)} disabled={index === 0} className="font-bold text-xl text-gray-600 hover:text-black disabled:text-gray-300" title="Move Up">↑</button>
                    <button onClick={() => onReorderItem(index, 1)} disabled={index === exportList.length - 1} className="font-bold text-xl text-gray-600 hover:text-black disabled:text-gray-300" title="Move Down">↓</button>
                </div>
              </td>
              <td className="px-3 py-2 text-sm text-center">
                 <SplitPlayButton voicing={voicing} isPlaying={playingExportId === voicing.exportId} onPlay={handlePlayChord} />
              </td>
              <td className="px-3 py-2 text-sm text-center">
                <button onClick={() => onRemoveItem(voicing)} className="text-red-600 hover:text-red-800 font-bold text-lg" title="Remove this item">&times;</button>
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
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-700">Selected Results for PDF Export</h2>

        <div className="flex justify-between items-center mb-4 p-2 bg-gray-100 rounded-lg">
          <div className="flex items-center">
            <span className="mr-4 font-semibold text-gray-700">Format:</span>
            <div className="flex space-x-4">
              <label className="flex items-center cursor-pointer"><input type="radio" name="exportFormat" value="diagram" checked={exportFormat === 'diagram'} onChange={() => setExportFormat('diagram')} className="form-radio text-blue-600" /><span className="ml-2 text-gray-800">Diagram</span></label>
              <label className="flex items-center cursor-pointer"><input type="radio" name="exportFormat" value="tablature" checked={exportFormat === 'tablature'} onChange={() => setExportFormat('tablature')} className="form-radio text-blue-600" /><span className="ml-2 text-gray-800">Tablature</span></label>
            </div>
          </div>
          <button onClick={() => setIsPreviewVisible(!isPreviewVisible)} className="px-4 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">
            {isPreviewVisible ? 'Show List' : 'Show Preview'}
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto mb-6 border border-gray-300 rounded-md p-4">
          {exportList.length === 0 ? <p className="text-gray-600 text-center py-8">No results selected.</p> : renderContent()}
        </div>

        <div className="flex justify-between items-center mt-auto">
          <button className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400" onClick={onClose}>Go Back</button>
          <div className="flex-grow mx-4">
            <input 
              type="text"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              placeholder="Add an optional title to your PDF..."
              maxLength="70"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-center text-sm"
            />
          </div>
          <div className="flex space-x-4">
            <button className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600" onClick={onClearAll}>Clear All</button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50" onClick={handleLocalExport} disabled={exportList.length === 0 || isExporting}>
              {isExporting ? 'Generating...' : 'Export to PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExportListModal;