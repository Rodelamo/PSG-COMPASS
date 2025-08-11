// src/logic/PDFGenerator.js

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import React from 'react';
import { createRoot } from 'react-dom/client';
import FretboardVisualizer from '../components/FretboardVisualizer';
import { formatControlCombination } from './CopedentUtils';

import FretboardDiagram from '../components/FretboardDiagram';

import { save } from '@tauri-apps/api/dialog';
import { writeBinaryFile } from '@tauri-apps/api/fs';

const A4_WIDTH_PTS = 595.28;
const A4_HEIGHT_PTS = 841.89;
const PAGE_MARGIN_HORIZONTAL = 30;
const PAGE_MARGIN_VERTICAL = 30;

const DIAGRAM_GRID_COLS = 2;
const DIAGRAM_GRID_ROWS = 3;
const MAX_DIAGRAMS_PER_PAGE = DIAGRAM_GRID_COLS * DIAGRAM_GRID_ROWS;

const TAB_STAVES_PER_PAGE = 4;
const TAB_CHORDS_PER_STAFF = 5;
const MAX_TABS_PER_PAGE = TAB_STAVES_PER_PAGE * TAB_CHORDS_PER_STAFF;

const SCALE_GRID_COLS = 1;
const SCALE_GRID_ROWS = 4;
const MAX_SCALES_PER_PAGE = SCALE_GRID_COLS * SCALE_GRID_ROWS;

const drawHeader = (pdf, headerText, copedentName) => {
    if (headerText) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(headerText, A4_WIDTH_PTS / 2, PAGE_MARGIN_VERTICAL, { align: 'center' });
    }
    if (copedentName) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        const yPos = headerText ? PAGE_MARGIN_VERTICAL + 15 : PAGE_MARGIN_VERTICAL;
        pdf.text(`Copedent: ${copedentName}`, A4_WIDTH_PTS / 2, yPos, { align: 'center' });
    }
};

const drawTablaturePageGrid = (pdf, copedent, pageVoicings, maskedStrings = []) => {
    const numStrings = copedent.strings.length;
    const contentStartY = PAGE_MARGIN_VERTICAL + 40;
    const contentHeight = A4_HEIGHT_PTS - contentStartY - PAGE_MARGIN_VERTICAL;
    const contentWidth = A4_WIDTH_PTS - PAGE_MARGIN_HORIZONTAL * 2;
    const staffHeight = contentHeight / TAB_STAVES_PER_PAGE;
    
    for (let staffIndex = 0; staffIndex < TAB_STAVES_PER_PAGE; staffIndex++) {
        const staffY = contentStartY + (staffIndex * staffHeight);
        
        const spaceHeight = (staffHeight * 0.7) / numStrings;
        const staffLinesYStart = staffY + (staffHeight * 0.15);
        pdf.setLineWidth(1.0);
        for (let i = 0; i <= numStrings; i++) {
            const lineY = staffLinesYStart + (i * spaceHeight);
            pdf.line(PAGE_MARGIN_HORIZONTAL, lineY, A4_WIDTH_PTS - PAGE_MARGIN_HORIZONTAL, lineY);
        }

        const staffEndX = A4_WIDTH_PTS - PAGE_MARGIN_HORIZONTAL;
        const cellWidth = contentWidth / TAB_CHORDS_PER_STAFF;
        for (let i = 0; i <= TAB_CHORDS_PER_STAFF; i++) {
            const lineX = PAGE_MARGIN_HORIZONTAL + (i * cellWidth);
            pdf.line(lineX, staffLinesYStart, lineX, staffLinesYStart + (numStrings * spaceHeight));
        }

        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        for (let i = 0; i < numStrings; i++) {
            const string = copedent.strings[i];
            const labelY = staffLinesYStart + (i * spaceHeight) + (spaceHeight / 2) + 2;
            const openNote = string.openNote.replace(/\d+$/, '');
            pdf.text(`${string.id} ${openNote}`, PAGE_MARGIN_HORIZONTAL - 25, labelY);
            pdf.text(String(string.id), staffEndX + 5, labelY);
        }

        for (let cellIndex = 0; cellIndex < TAB_CHORDS_PER_STAFF; cellIndex++) {
            const voicingIndex = (staffIndex * TAB_CHORDS_PER_STAFF) + cellIndex;
            const voicing = pageVoicings[voicingIndex];
            if (!voicing) continue;

            const cellX = PAGE_MARGIN_HORIZONTAL + (cellIndex * cellWidth);
            const cellCenterX = cellX + (cellWidth / 2);

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.text(voicing.chordName, cellCenterX, staffY + 10, { align: 'center' });
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7);
            // MODIFIED: Correctly pass mecCombo to the formatting function
            const controlText = formatControlCombination(voicing.pedalCombo, voicing.leverCombo, voicing.mecCombo, copedent);
            pdf.text(controlText, cellCenterX, staffY + 20, { align: 'center' });

            for (let i = 0; i < numStrings; i++) {
                const stringId = i + 1;
                const isMasked = maskedStrings.includes(stringId);
                const note = voicing.notes.find(n => n.stringId === stringId);
                
                // Only draw fret numbers and controls if string is not masked
                if (note && note.isPlayedInVoicing && !isMasked) {
                    const stringY = staffLinesYStart + (i * spaceHeight) + (spaceHeight / 2) + 4;
                    
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(10);
                    const fretNumX = cellX + (cellWidth / 3);
                    pdf.text(String(voicing.fret), fretNumX, stringY, { align: 'center' });

                    if (note.activeControls && note.activeControls.length > 0) {
                        // MODIFIED: Correctly extract and pass mecIds to the formatting function
                        const pedalIds = note.activeControls.filter(id => id.startsWith('P'));
                        const leverIds = note.activeControls.filter(id => !id.startsWith('P') && !id.startsWith('M'));
                        const mecIds = note.activeControls.filter(id => id.startsWith('M'));
                        const activeControlText = formatControlCombination(pedalIds, leverIds, mecIds, copedent).replace(/[()]/g, '');

                        pdf.setFont('helvetica', 'italic');
                        pdf.setFontSize(7);
                        const controlTextX = fretNumX + 15;
                        pdf.text(activeControlText, controlTextX, stringY, { align: 'left' });
                    }
                }
            }
        }
    }
}

const webDownload = (blob, fileName) => {
    try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
    } catch (error) {
        console.error("Error with web download:", error);
        return false;
    }
};

export const generatePdfFromVoicings = async (exportList, copedent, format = 'diagram', headerText = '', maskedStrings = []) => {
  const pdf = new jsPDF('p', 'pt', 'a4');
  const fileName = 'Pedal_Steel_Chords.pdf';

  if (format === 'tablature') {
    for (let i = 0; i < exportList.length; i += MAX_TABS_PER_PAGE) {
        if (i > 0) pdf.addPage();
        drawHeader(pdf, headerText, copedent.name);
        const pageVoicings = exportList.slice(i, i + MAX_TABS_PER_PAGE);
        drawTablaturePageGrid(pdf, copedent, pageVoicings, maskedStrings);
    }
  } else {
    const diagramMargin = 10;
    for (let i = 0; i < exportList.length; i += MAX_DIAGRAMS_PER_PAGE) {
        if (i > 0) pdf.addPage();
        drawHeader(pdf, headerText, copedent.name);
        const pageVoicings = exportList.slice(i, i + MAX_DIAGRAMS_PER_PAGE);
        const contentStartY = diagramMargin + 40;
        const diagramContentWidth = A4_WIDTH_PTS - diagramMargin * 2;
        const diagramContentHeight = A4_HEIGHT_PTS - contentStartY - diagramMargin;
        const diagramWidth = diagramContentWidth / DIAGRAM_GRID_COLS;
        const diagramHeight = diagramContentHeight / DIAGRAM_GRID_ROWS;

        for (let j = 0; j < pageVoicings.length; j++) {
            const voicing = pageVoicings[j];
            const imgData = await captureComponentAsImage(<FretboardVisualizer voicing={voicing} chordName={voicing.chordName} isPdfMode={true} />, 750);
            
            const col = j % DIAGRAM_GRID_COLS;
            const row = Math.floor(j / DIAGRAM_GRID_COLS);
            const x = diagramMargin + (col * diagramWidth);
            const y = contentStartY + (row * diagramHeight);
            
            pdf.addImage(imgData, 'PNG', x, y, diagramWidth, diagramHeight);
        }
    }
  }

  if (window.__TAURI__) {
    try {
      const filePath = await save({
          title: 'Save PDF As',
          defaultPath: fileName,
          filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
      });
      if (filePath) {
          await writeBinaryFile(filePath, pdf.output('arraybuffer'));
          return true;
      }
      return false;
    } catch (error) {
      console.error("Error saving PDF via Tauri JS API:", error);
      return false;
    }
  } else {
    const blob = pdf.output('blob');
    return webDownload(blob, fileName);
  }
};

const ScalePdfComponent = ({ scaleData }) => {
    const pdfTextFix = { position: 'relative', top: '-12px' };
    const { rootNote, scaleName, copedent, notesOnFretboard, activePedals, activeLevers, activeMechanisms } = scaleData;
    
    // MODIFIED: Correctly pass activeMechanisms to the formatting function
    const controlText = formatControlCombination(activePedals, activeLevers, activeMechanisms, copedent);

    return (
        <div className="bg-white p-4">
            <h3 className="text-xl font-bold text-center" style={pdfTextFix}>{rootNote} {scaleName}</h3>
            {controlText !== 'Open' && ( <p className="text-md font-bold text-center text-blue-700" style={pdfTextFix}> {controlText} </p> )}
            <p className="text-sm text-center text-gray-600 mb-2" style={pdfTextFix}>Copedent: {copedent.name}</p>
            <FretboardDiagram notesToDisplay={notesOnFretboard} copedent={copedent} isPdfMode={true} />
        </div>
    );
};

export const generateScalesPdf = async (scaleList) => {
    const pdf = new jsPDF('p', 'pt', 'a4');
    const diagramMargin = 10;
    const fileName = 'Pedal_Steel_Scales.pdf';

    for (let i = 0; i < scaleList.length; i += MAX_SCALES_PER_PAGE) {
        if (i > 0) pdf.addPage();
        const pageScales = scaleList.slice(i, i + MAX_SCALES_PER_PAGE);
        const diagramContentWidth = A4_WIDTH_PTS - diagramMargin * 2;
        const diagramContentHeight = A4_HEIGHT_PTS - diagramMargin * 2;
        
        const diagramWidth = diagramContentWidth;
        const diagramHeight = diagramContentHeight / SCALE_GRID_ROWS;

        for (let j = 0; j < pageScales.length; j++) {
            const scaleData = pageScales[j];
            const imgData = await captureComponentAsImage(<ScalePdfComponent scaleData={scaleData} />, 1000);
            
            const x = diagramMargin;
            const y = diagramMargin + (j * diagramHeight);

            pdf.addImage(imgData, 'PNG', x, y, diagramWidth, diagramHeight);
        }
    }

    if (window.__TAURI__) {
        try {
            const filePath = await save({
                title: 'Save PDF As',
                defaultPath: fileName,
                filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
            });
            if (filePath) {
                await writeBinaryFile(filePath, pdf.output('arraybuffer'));
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error saving PDF via Tauri JS API:", error);
            return false;
        }
    } else {
        const blob = pdf.output('blob');
        return webDownload(blob, fileName);
    }
};

const createHiddenContainer = () => {
  let container = document.getElementById('pdf-render-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'pdf-render-container';
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '1200px';
    container.style.zIndex = '-1';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);
  }
  return container;
};

const captureComponentAsImage = async (component, width) => {
  const hiddenContainer = createHiddenContainer();
  const tempDiv = document.createElement('div');
  tempDiv.style.width = `${width}px`;
  hiddenContainer.appendChild(tempDiv);

  const root = createRoot(tempDiv);
  await new Promise((resolve) => {
    root.render(component);
    setTimeout(resolve, 50);
  });

  const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true, logging: false });
  const imgData = canvas.toDataURL('image/png');

  root.unmount();
  hiddenContainer.removeChild(tempDiv);

  return imgData;
};