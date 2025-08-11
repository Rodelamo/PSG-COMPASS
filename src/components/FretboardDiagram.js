// src/components/FretboardDiagram.js

import React from 'react';

const getNoteColor = (intervalName) => {
    if (intervalName === 'R') return 'bg-red-600 text-white';
    if (intervalName.includes('3')) return 'bg-green-600 text-white';
    if (intervalName.includes('5')) return 'bg-yellow-500 text-black';
    return 'bg-blue-500 text-white';
};

function FretboardDiagram({ notesToDisplay = [], copedent, onNoteClick, isPdfMode = false }) {
  const frets = Array.from({ length: 13 }, (_, i) => i);
  const { strings } = copedent;

  const LABEL_WIDTH_PERCENT = 6;
  const FRETBOARD_WIDTH_PERCENT = 100 - LABEL_WIDTH_PERCENT;
  
  const pdfTextFix = isPdfMode ? { position: 'relative', top: '-7px' } : {};
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-inner border border-gray-300 overflow-x-auto">
      <div className="relative w-full min-w-[800px]">
        {/* Fret Numbers Header */}
        <div className="flex w-full">
          <div style={{ width: `${LABEL_WIDTH_PERCENT}%` }} className="flex-shrink-0"></div>
          {frets.map(fret => (
            <div key={fret} style={{ width: `${FRETBOARD_WIDTH_PERCENT / frets.length}%`, ...pdfTextFix }} className="flex-shrink-0 text-center font-bold text-gray-600">{fret}</div>
          ))}
        </div>

        {/* Strings and Notes */}
        <div className="relative">
          {/* String Lines */}
          {strings.map(string => (
            <div key={string.id} className="h-8 border-t border-gray-400 flex items-center">
              <div className="absolute left-0 text-center font-semibold text-gray-700" style={{ width: `${LABEL_WIDTH_PERCENT}%`, ...pdfTextFix }}>
                {string.openNote.replace(/\d+$/, '')}
              </div>
            </div>
          ))}
          <div className="h-0 border-t border-gray-400"></div>

          {/* Fret Lines */}
          {/* This .map function iterates through all numbers from 0 to 12.
              It should not skip any numbers, so all fret lines will be rendered. */}
          {frets.map(fret => (
             <div key={fret} className="absolute top-0 h-full w-[3px] bg-gray-500" style={{ left: `calc(${LABEL_WIDTH_PERCENT}% + ${(fret / frets.length) * FRETBOARD_WIDTH_PERCENT}%)` }}></div>
          ))}
           <div className="absolute top-0 h-full w-1 bg-gray-700" style={{ left: `${LABEL_WIDTH_PERCENT}%` }}></div> {/* Nut */}

          {/* Notes */}
          {notesToDisplay.map((note, index) => {
            const noteLetter = note.noteName.replace(/\d+$/, '');
            const noteColorClass = getNoteColor(note.intervalName);
            return (
              <div 
                key={index} 
                onClick={() => onNoteClick && onNoteClick(note)}
                className={`absolute flex items-center justify-center px-2 py-1 rounded-md font-bold text-xs border-2 border-white shadow-lg whitespace-nowrap ${onNoteClick ? 'cursor-pointer' : ''} ${noteColorClass}`}
                style={{
                  top: `${(note.stringId - 0.5) * 2 - 1}rem`,
                  left: `calc(${LABEL_WIDTH_PERCENT}% + ${((note.fret + 0.5) / frets.length) * FRETBOARD_WIDTH_PERCENT}%)`,
                  transform: 'translateX(-50%) translateY(10%)' 
                }}
                title={`${note.noteName} (${note.intervalName})`}
              >
                <span style={pdfTextFix}>{`${noteLetter}[${note.intervalName}]`}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FretboardDiagram;