// src/components/MetronomeControls.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import SoundService from '../logic/SoundService';
import TonalCenterDropdown from './TonalCenterDropdown';

const MetronomeControls = ({ 
  tempo = 120, 
  onTempoChange, 
  timeSignature = '4/4', 
  onTimeSignatureChange,
  tonalCenter = 'C',
  onTonalCenterChange,
  useSharps = true,
  onToggleSharps,
  clickVolume = 0.3,
  onClickVolumeChange,
  isPlaying = false,
  onPlayPause,
  measures = [],
  onClearProgression
}) => {
  const [internalTempo, setInternalTempo] = useState(tempo);
  const [clickEnabled, setClickEnabled] = useState(true);
  const [showTimeSignatureDialog, setShowTimeSignatureDialog] = useState(false);
  const [pendingTimeSignature, setPendingTimeSignature] = useState(null);
  const intervalRef = useRef(null);
  const beatCountRef = useRef(0);
  const measureCountRef = useRef(0);
  
  // Tap tempo state
  const [tapTimes, setTapTimes] = useState([]);
  const [isHighlighted, setIsHighlighted] = useState(false);

  // Time signature options
  const timeSignatureOptions = [
    { value: '3/4', label: '3/4', beatsPerMeasure: 3 },
    { value: '4/4', label: '4/4', beatsPerMeasure: 4 }
  ];

  const selectedTimeSignature = timeSignatureOptions.find(ts => ts.value === timeSignature);
  const beatsPerMeasure = selectedTimeSignature ? selectedTimeSignature.beatsPerMeasure : 4;

  // Calculate interval between beats in milliseconds
  const beatInterval = (60 / internalTempo) * 1000;

  const playMetronomeClick = useCallback(() => {
    if (!clickEnabled) return;
    
    SoundService.resumeAudioContext();
    
    // Different pitch for downbeat vs other beats
    const isDownbeat = beatCountRef.current === 0;
    const frequency = isDownbeat ? 800 : 600;
    const duration = 0.1;

    try {
      const oscillator = SoundService.audioContext.createOscillator();
      const gainNode = SoundService.audioContext.createGain();
      
      oscillator.frequency.setValueAtTime(frequency, SoundService.audioContext.currentTime);
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0, SoundService.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(clickVolume, SoundService.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, SoundService.audioContext.currentTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(SoundService.audioContext.destination);
      
      oscillator.start(SoundService.audioContext.currentTime);
      oscillator.stop(SoundService.audioContext.currentTime + duration);
    } catch (error) {
      console.error('Error playing metronome click:', error);
    }
  }, [clickEnabled, clickVolume]);

  // Metronome runs during progression playback if enabled
  useEffect(() => {
    if (isPlaying && clickEnabled) {
      // Reset beat count when starting
      beatCountRef.current = 0;
      measureCountRef.current = 0;
      
      intervalRef.current = setInterval(() => {
        playMetronomeClick();
        beatCountRef.current = (beatCountRef.current + 1) % beatsPerMeasure;
        if (beatCountRef.current === 0) {
          measureCountRef.current += 1;
        }
      }, beatInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (!isPlaying) {
        beatCountRef.current = 0;
        measureCountRef.current = 0;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, clickEnabled, beatInterval, beatsPerMeasure, playMetronomeClick]);

  const handleTempoChange = (newTempo) => {
    // Clamp tempo to 40-500 BPM range
    const clampedTempo = Math.max(40, Math.min(500, newTempo));
    setInternalTempo(clampedTempo);
    onTempoChange && onTempoChange(clampedTempo);
  };

  // Tap tempo functionality
  const handleTapTempo = () => {
    const now = Date.now();
    
    // Visual feedback
    setIsHighlighted(true);
    setTimeout(() => setIsHighlighted(false), 100);
    
    setTapTimes(prevTimes => {
      // Keep only the last 4 taps and add current tap
      const newTimes = [...prevTimes.slice(-3), now];
      
      // Need at least 2 taps to calculate tempo
      if (newTimes.length >= 2) {
        // Calculate intervals between taps
        const intervals = [];
        for (let i = 1; i < newTimes.length; i++) {
          intervals.push(newTimes[i] - newTimes[i - 1]);
        }
        
        // Calculate average interval in milliseconds
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        
        // Convert to BPM (60000 ms = 1 minute)
        const calculatedBPM = Math.round(60000 / avgInterval);
        
        // Only update if within reasonable range
        if (calculatedBPM >= 40 && calculatedBPM <= 500) {
          handleTempoChange(calculatedBPM);
        }
      }
      
      return newTimes;
    });
    
    // Clear tap times after 3 seconds of inactivity
    setTimeout(() => {
      setTapTimes(prevTimes => {
        const timeSinceLastTap = Date.now() - Math.max(...prevTimes);
        if (timeSinceLastTap >= 3000) {
          return [];
        }
        return prevTimes;
      });
    }, 3000);
  };

  const handlePlayPause = () => {
    onPlayPause && onPlayPause();
  };

  // Check if any measures contain chords
  const hasExistingChords = () => {
    return measures.some(measure => 
      measure.slots && measure.slots.some(slot => slot.chord !== null && slot.chord !== undefined)
    );
  };

  const toggleTimeSignature = () => {
    const newTimeSignature = timeSignature === '4/4' ? '3/4' : '4/4';
    
    // Check if there are existing chords and show dialog
    if (hasExistingChords()) {
      setPendingTimeSignature(newTimeSignature);
      setShowTimeSignatureDialog(true);
    } else {
      // No chords, safe to change directly
      onTimeSignatureChange && onTimeSignatureChange(newTimeSignature);
    }
  };

  const handleConfirmTimeSignatureChange = () => {
    if (pendingTimeSignature) {
      // Clear progression first
      onClearProgression && onClearProgression();
      // Then change time signature
      onTimeSignatureChange && onTimeSignatureChange(pendingTimeSignature);
    }
    setShowTimeSignatureDialog(false);
    setPendingTimeSignature(null);
  };

  const handleCancelTimeSignatureChange = () => {
    setShowTimeSignatureDialog(false);
    setPendingTimeSignature(null);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Key and Tempo</h3>
      
      <div className="flex items-center justify-center gap-6 flex-wrap">
        {/* 1. Key (Tonal Center) */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Key:</label>
          <TonalCenterDropdown
            selectedKey={tonalCenter}
            onKeyChange={onTonalCenterChange}
            useSharps={useSharps}
            onToggleSharps={onToggleSharps}
          />
        </div>

        {/* 2. Time Signature Toggle */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Time:</label>
          <button
            onClick={toggleTimeSignature}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-mono text-sm min-w-[50px]"
            title={`Current: ${timeSignature}. Click to toggle.`}
          >
            {timeSignature}
          </button>
        </div>

        {/* 3. Tempo Control */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Tempo:</label>
          <input
            type="range"
            min="40"
            max="500"
            value={internalTempo}
            onChange={(e) => handleTempoChange(parseInt(e.target.value))}
            className="w-24"
          />
          <div className="flex items-center">
            <input
              type="number"
              min="40"
              max="500"
              value={internalTempo}
              onChange={(e) => handleTempoChange(parseInt(e.target.value))}
              className="w-16 p-1 border border-gray-300 rounded text-center text-sm"
            />
            <span className="ml-1 text-xs text-gray-600">BPM</span>
          </div>
          {/* Tap Tempo Button */}
          <button
            onClick={handleTapTempo}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
              isHighlighted
                ? 'bg-blue-800 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            title="Tap repeatedly to set tempo"
          >
            Tap
          </button>
        </div>

        {/* 4. Click Controls */}
        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700">Click:</label>
          
          {/* Click On/Off Button with Metronome Icon */}
          <button
            onClick={() => setClickEnabled(!clickEnabled)}
            className={`p-2 rounded-md transition-colors ${
              clickEnabled 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-400 text-white hover:bg-gray-500'
            }`}
            title={`Metronome click: ${clickEnabled ? 'On' : 'Off'}`}
          >
            {/* Classic metronome icon based on provided image */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              {/* Metronome base */}
              <path d="M4 20h16l-2-4H6l-2 4z" fill="currentColor"/>
              {/* Metronome body (trapezoid) */}
              <path d="M8 4h8l4 12H4L8 4z" fill="currentColor"/>
              {/* Inner white space */}
              <path d="M9.5 6h5l2.5 8H7l2.5-8z" fill="white"/>
              {/* Pendulum rod */}
              <line x1="12" y1="7" x2="12" y2="14" stroke="currentColor" strokeWidth="1.5"/>
              {/* Pendulum weight at bottom */}
              <circle cx="12" cy="14.5" r="1" fill="currentColor"/>
              {/* Base feet */}
              <circle cx="6" cy="21" r="1" fill="currentColor"/>
              <circle cx="18" cy="21" r="1" fill="currentColor"/>
            </svg>
          </button>
          
          {/* Volume Slider - 50% Max with Smaller Increments */}
          <div className="flex items-center space-x-1">
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={clickVolume}
              onChange={(e) => onClickVolumeChange && onClickVolumeChange(parseFloat(e.target.value))}
              className="w-12"
              disabled={!clickEnabled}
            />
            <span className="text-xs text-gray-600 w-6">
              {Math.round(clickVolume * 100)}
            </span>
          </div>
        </div>

        {/* 5. Play Button */}
        <div className="flex items-center">
          <button
            onClick={handlePlayPause}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isPlaying
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isPlaying ? '⏹ Stop' : '▶ Play'}
          </button>
        </div>
      </div>

      {/* Beat Indicator - only shows during playback and when click is enabled */}
      {isPlaying && clickEnabled && (
        <div className="mt-4 flex items-center justify-center">
          <div className="flex space-x-1">
            {Array.from({ length: beatsPerMeasure }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i === beatCountRef.current
                    ? (i === 0 ? 'bg-red-500' : 'bg-blue-500')
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="ml-4 text-sm text-gray-600">
            Measure {measureCountRef.current + 1}
          </span>
        </div>
      )}

      {/* Time Signature Change Warning Dialog */}
      {showTimeSignatureDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Change Time Signature?
            </h3>
            <p className="text-gray-600 mb-6">
              Changing the time signature will clear your current chord progression. 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelTimeSignatureChange}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTimeSignatureChange}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Clear & Change to {pendingTimeSignature}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetronomeControls;