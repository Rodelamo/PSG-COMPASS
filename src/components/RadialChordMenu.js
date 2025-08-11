// src/components/RadialChordMenu.js

import React from 'react';
import { 
  generateChordCircles
} from '../data/RadialWheelChordRoots';

const RadialChordMenu = ({ 
  isOpen, 
  onClose, 
  onChordSelect, 
  onMoreChordsClick,
  onEraseChord, // New prop for erasing chord
  tonalCenter = 'C',
  position = { x: 0, y: 0 }, // Position to show the menu
  onCopyMeasures = null, // New prop for copy function
  onPasteMeasures = null, // New prop for paste function
  measures = [], // Current measures for validation
  selectedSlot = null, // Current selected slot for context
  copiedMeasures = null // Clipboard state for paste validation
}) => {
  if (!isOpen) return null;

  // Generate context-aware chord circles for the current key
  const chordCircles = generateChordCircles(tonalCenter);
  
  // Note: getRelativeMinor function removed as it's now handled by the new data system

  // Note: Highlighting is now position-based, not chord-name-based

  // No rotation needed - chord arrays are pre-positioned for each key

  // Create chord segments for each ring
  const createChordSegment = (chord, index, innerRadius, outerRadius) => {
    const angle = index * 30; // 30 degrees per segment (360/12)
    const adjustedAngle = angle - 90; // Shift everything 90 degrees counter-clockwise so index 0 is at 12 o'clock
    
    // Convert to radians and calculate arc endpoints
    const startAngleRad = (adjustedAngle - 15) * Math.PI / 180;
    const endAngleRad = (adjustedAngle + 15) * Math.PI / 180;
    
    // Calculate the 4 corners of the segment
    const x1 = Math.cos(startAngleRad) * innerRadius;
    const y1 = Math.sin(startAngleRad) * innerRadius;
    const x2 = Math.cos(endAngleRad) * innerRadius;
    const y2 = Math.sin(endAngleRad) * innerRadius;
    const x3 = Math.cos(endAngleRad) * outerRadius;
    const y3 = Math.sin(endAngleRad) * outerRadius;
    const x4 = Math.cos(startAngleRad) * outerRadius;
    const y4 = Math.sin(startAngleRad) * outerRadius;
    
    // Create SVG path for the segment
    const pathData = `M ${x1} ${y1} A ${innerRadius} ${innerRadius} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${outerRadius} ${outerRadius} 0 0 0 ${x4} ${y4} Z`;
    
    // Text position (center of segment)
    const centerRadius = (innerRadius + outerRadius) / 2;
    const textAngleRad = adjustedAngle * Math.PI / 180;
    const textX = Math.cos(textAngleRad) * centerRadius;
    const textY = Math.sin(textAngleRad) * centerRadius;
    
    // Determine highlight colors based on FIXED SCREEN POSITIONS (not chord names)
    let fillColor = '#f9fafb'; // default light gray
    let strokeColor = '#d1d5db';
    let textColor = '#374151';
    
    // Simple approach: Highlight based on original index, but the chords rotate
    // This way highlights stay at fixed screen positions while wheel rotates
    
    // Determine which ring we're in by checking the outerRadius parameter value
    const isOuterRing = (outerRadius === 431);   // Major chords
    const isMiddleRing = (outerRadius === 318);   // Minor chords  
    const isInnerRing = (outerRadius === 206);    // Diminished chords
    
    // Always highlight the same screen positions regardless of rotation
    if (index === 0) { // Whatever chord is at position 0 after rotation goes to 12 o'clock
      if (isMiddleRing) {
        fillColor = '#60a5fa'; // vi - Light blue
        strokeColor = '#3b82f6';
        textColor = 'white';
      } else if (isInnerRing) {
        fillColor = '#f59e0b'; // vii° - Amber
        strokeColor = '#d97706';
        textColor = 'white';
      } else if (isOuterRing) {
        fillColor = '#1d4ed8'; // I - Blue
        strokeColor = '#1e40af';
        textColor = 'white';
      }
    } else if (index === 11) { // Whatever chord is at position 11 after rotation goes to 11 o'clock
      if (isMiddleRing) {
        fillColor = '#f87171'; // ii - Light red
        strokeColor = '#ef4444';
        textColor = 'white';
      } else if (isOuterRing) {
        fillColor = '#dc2626'; // IV - Red
        strokeColor = '#b91c1c';
        textColor = 'white';
      }
    } else if (index === 1) { // Whatever chord is at position 1 after rotation goes to 1 o'clock
      if (isMiddleRing) {
        fillColor = '#4ade80'; // iii - Light green
        strokeColor = '#22c55e';
        textColor = 'white';
      } else if (isOuterRing) {
        fillColor = '#16a34a'; // V - Green
        strokeColor = '#15803d';
        textColor = 'white';
      }
    }
    
    return (
      <g key={`${chord}-${index}`}>
        <path
          d={pathData}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="2"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onChordSelect(chord)}
        />
        <text
          x={textX}
          y={textY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-base font-bold pointer-events-none select-none"
          fill={textColor}
        >
          {chord}
        </text>
      </g>
    );
  };

  // Copy validation - can we copy numMeasures forward from current position?
  const canCopy = (numMeasures) => {
    if (!selectedSlot || !measures.length) return false;
    const currentMeasureIndex = selectedSlot.measureIndex;
    
    // Need enough measures forward from current position (inclusive)
    return currentMeasureIndex + numMeasures <= measures.length;
  };

  // Paste validation - can we paste numMeasures forward from current position?
  const canPaste = (numMeasures) => {
    if (!selectedSlot || !measures.length || !copiedMeasures) return false;
    
    // Check if clipboard has the right number of measures
    if (copiedMeasures.numMeasures !== numMeasures) return false;
    
    const currentMeasureIndex = selectedSlot.measureIndex;
    
    // Need enough space forward from current position (inclusive)
    return currentMeasureIndex + numMeasures <= measures.length;
  };

  const handleCopy = (numMeasures) => {
    if (!canCopy(numMeasures) || !onCopyMeasures) return;
    
    const currentMeasureIndex = selectedSlot.measureIndex;
    onCopyMeasures(numMeasures, currentMeasureIndex);
    onClose(); // Close the radial menu immediately after copy
  };

  const handlePaste = (numMeasures) => {
    if (!canPaste(numMeasures) || !onPasteMeasures) return;
    
    const currentMeasureIndex = selectedSlot.measureIndex;
    onPasteMeasures(numMeasures, currentMeasureIndex);
    onClose(); // Close the radial menu immediately after paste
  };

  // Full-screen menu with left radial chord selector and right copy/paste panel
  const menuSize = 936; // 87% bigger (500 * 1.87 = 936) - was 780, now +20% = 936
  const centerX = menuSize / 2;
  const centerY = menuSize / 2;

  // Ring dimensions - 87% bigger (was 56%, now +20% = 87%)
  const outerRadius = 431;   // Major chords (outer ring) - 359 * 1.2 = 431
  const middleRadius = 318;  // Minor chords (middle ring) - 265 * 1.2 = 318  
  const innerRadius = 206;   // Diminished chords (inner ring) - 172 * 1.2 = 206
  const centerRadius = 94;   // Central button area - 78 * 1.2 = 94

  // Handle clicks - close only if outside the circle or outside the right panel
  const handleBackgroundClick = (e) => {
    // Check if clicking on the left side (radial area)
    const leftSide = e.target.closest('.radial-left-side');
    if (leftSide) {
      const svg = leftSide.querySelector('svg');
      if (!svg) return;
      
      // Get the SVG's bounding rectangle
      const rect = svg.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate distance from click to center
      const clickX = e.clientX;
      const clickY = e.clientY;
      const distance = Math.sqrt(Math.pow(clickX - centerX, 2) + Math.pow(clickY - centerY, 2));
      
      // Close if click is outside the outer radius (scaled to screen coordinates)
      const screenOuterRadius = (outerRadius / menuSize) * rect.width;
      if (distance > screenOuterRadius) {
        onClose();
      }
      return;
    }
    
    // Check if clicking on the right panel itself - don't close
    const rightPanel = e.target.closest('.copy-paste-panel');
    if (rightPanel) {
      return; // Don't close when clicking inside the panel
    }
    
    // For clicks anywhere else (like right side background), close the menu
    onClose();
  };

  return (
    <>
      {/* Full-screen backdrop - no onClick, we handle it per section */}
      <div className="fixed inset-0 bg-black bg-opacity-40 z-40" />
      
      {/* Full-screen container */}
      <div className="fixed inset-0 z-50 flex" onClick={handleBackgroundClick}>
        {/* Left side: Radial chord selector */}
        <div 
          className="flex-1 flex items-center justify-center radial-left-side"
        >
          <div className="relative">
            <svg 
              width={menuSize} 
              height={menuSize} 
              viewBox={`0 0 ${menuSize} ${menuSize}`}
              className="drop-shadow-lg"
            >
              {/* Transform group to center the menu */}
              <g transform={`translate(${centerX}, ${centerY})`}>
                {/* Outer ring - Major chords */}
                {chordCircles.outer.map((chord, index) => 
                  createChordSegment(chord, index, middleRadius, outerRadius)
                )}
                
                {/* Middle ring - Minor chords */}
                {chordCircles.middle.map((chord, index) => 
                  createChordSegment(chord, index, innerRadius, middleRadius)
                )}
                
                {/* Inner ring - Diminished chords */}
                {chordCircles.inner.map((chord, index) => 
                  createChordSegment(chord, index, centerRadius, innerRadius)
                )}

                {/* Split center circle - Top half: "More Chords..." */}
                <path
                  d={`M -${centerRadius} 0 A ${centerRadius} ${centerRadius} 0 0 1 ${centerRadius} 0 Z`}
                  fill="#3b82f6"
                  stroke="#1e40af"
                  strokeWidth="2"
                  className="cursor-pointer hover:fill-blue-600 transition-colors"
                  onClick={onMoreChordsClick}
                />
                <text
                  x="0"
                  y="-58"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-lg font-semibold fill-white pointer-events-none select-none"
                >
                  More
                </text>
                <text
                  x="8"
                  y="-30"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-lg font-semibold fill-white pointer-events-none select-none"
                >
                  Chords...
                </text>

                {/* Split center circle - Bottom half: "Erase Chord" */}
                <path
                  d={`M ${centerRadius} 0 A ${centerRadius} ${centerRadius} 0 0 1 -${centerRadius} 0 Z`}
                  fill="#dc2626"
                  stroke="#b91c1c"
                  strokeWidth="2"
                  className="cursor-pointer hover:fill-red-700 transition-colors"
                  onClick={onEraseChord}
                />
                <text
                  x="0"
                  y="26"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-lg font-semibold fill-white pointer-events-none select-none"
                >
                  Erase
                </text>
                <text
                  x="0"
                  y="55"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-lg font-semibold fill-white pointer-events-none select-none"
                >
                  Chord
                </text>

                {/* Dividing line between the two halves */}
                <line
                  x1={-centerRadius}
                  y1="0"
                  x2={centerRadius}
                  y2="0"
                  stroke="#374151"
                  strokeWidth="2"
                />
              </g>
            </svg>
          </div>
        </div>

        {/* Right side: Copy & Paste panel */}
        <div 
          className="w-80 bg-white border-l border-gray-300 p-6 flex flex-col copy-paste-panel"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-1">Copy & Paste</h3>
            <p className="text-sm text-gray-600">
              {selectedSlot ? `Current: Measure ${selectedSlot.measureIndex + 1}` : 'No measure selected'}
            </p>
          </div>

          {/* Copy Section */}
          <div className="mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-blue-800 mb-2">📋 Copy Measures</h4>
              <p className="text-xs text-blue-600 mb-3">
                Copy forward from current position
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                {[2, 4, 8, 16].map(numMeasures => {
                  const canDoCopy = canCopy(numMeasures);
                  const currentMeasure = selectedSlot?.measureIndex + 1 || 0;
                  const sourceEnd = currentMeasure + numMeasures - 1;
                  
                  return (
                    <button
                      key={`copy-${numMeasures}`}
                      onClick={() => handleCopy(numMeasures)}
                      disabled={!canDoCopy}
                      className={`py-2 px-3 rounded-md font-medium text-sm transition-colors ${
                        canDoCopy
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title={canDoCopy 
                        ? `Copy measures ${currentMeasure}-${sourceEnd}`
                        : `Need ${numMeasures} measures available forward`
                      }
                    >
                      Copy {numMeasures}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Paste Section */}
          <div className="mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-green-800 mb-2">📌 Paste Measures</h4>
              {copiedMeasures ? (
                <p className="text-xs text-green-600 mb-3">
                  Clipboard: {copiedMeasures.numMeasures} measures
                </p>
              ) : (
                <p className="text-xs text-gray-500 mb-3">
                  No clipboard data - copy first
                </p>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                {[2, 4, 8, 16].map(numMeasures => {
                  const canDoPaste = canPaste(numMeasures);
                  const currentMeasure = selectedSlot?.measureIndex + 1 || 0;
                  const targetEnd = currentMeasure + numMeasures - 1;
                  
                  let tooltipText = '';
                  if (!copiedMeasures) {
                    tooltipText = 'No clipboard data - copy some measures first';
                  } else if (copiedMeasures.numMeasures !== numMeasures) {
                    tooltipText = `Clipboard has ${copiedMeasures.numMeasures} measures, need ${numMeasures}`;
                  } else if (!canDoPaste) {
                    tooltipText = `Not enough space - need ${numMeasures} slots forward`;
                  } else {
                    tooltipText = `Paste to measures ${currentMeasure}-${targetEnd}`;
                  }
                  
                  return (
                    <button
                      key={`paste-${numMeasures}`}
                      onClick={() => handlePaste(numMeasures)}
                      disabled={!canDoPaste}
                      className={`py-2 px-3 rounded-md font-medium text-sm transition-colors ${
                        canDoPaste
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title={tooltipText}
                    >
                      Paste {numMeasures}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors mt-auto"
          >
            Close Menu
          </button>
        </div>
      </div>
    </>
  );
};

export default RadialChordMenu;