// src/logic/AudioController.js

import SoundService from './SoundService';

/**
 * Audio Controller utilities for VoiceLeader component
 * Extracted from VoiceLeader.js to improve maintainability and reusability
 */

/**
 * Stop playback and clean up intervals and state
 * @param {Object} params - Cleanup parameters
 */
export const stopPlaybackAndCleanup = ({
  progressionInterval,
  setProgressionInterval,
  setIsPlaying,
  setCurrentPlayingSlot
}) => {
  if (progressionInterval) {
    clearInterval(progressionInterval);
    setProgressionInterval(null);
  }
  setIsPlaying(false);
  setCurrentPlayingSlot(null);
  
  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('🛑 Voice Leader playback stopped and cleaned up');
  }
};

/**
 * Play metronome click sound
 * @param {number} beatInMeasure - Beat position in measure (0-based)
 * @param {boolean} metronomeEnabled - Whether metronome is enabled
 * @param {number} clickVolume - Volume level for metronome click
 */
export const playMetronomeClick = (beatInMeasure, metronomeEnabled, clickVolume) => {
  if (!metronomeEnabled || clickVolume <= 0) return; // Only play if metronome is enabled and has volume
  
  // Debug: Log current states to verify live updates
  console.log(`Metronome: enabled=${metronomeEnabled}, volume=${clickVolume}, beat=${beatInMeasure}`);
  
  // Different pitch for downbeat vs other beats
  const isDownbeat = beatInMeasure === 0;
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
};

/**
 * Handle progression playback with metronome and audio
 * @param {Object} params - Playback parameters
 */
export const handlePlayProgression = ({
  results,
  tempo,
  measures,
  timeSignature,
  maskedStrings,
  metronomeEnabled,
  clickVolume,
  setIsPlaying,
  setProgressionInterval,
  setCurrentPlayingSlot,
  stopPlaybackAndCleanupFn
}) => {
  if (results.length === 0) return;
  
  setIsPlaying(true);
  SoundService.resumeAudioContext();
  
  // Calculate timing based on tempo
  const beatDurationMs = (60 / tempo) * 1000;
  
  // Build the sequence of slots with chords
  const chordSequence = [];
  let resultIndex = 0;
  
  measures.forEach((measure, measureIndex) => {
    measure.slots.forEach((slot, slotIndex) => {
      if (slot.chord && resultIndex < results.length) {
        chordSequence.push({
          measureIndex,
          slotIndex,
          chord: slot.chord,
          voicing: results[resultIndex]
        });
        resultIndex++;
      } else {
        chordSequence.push({
          measureIndex,
          slotIndex,
          chord: null,
          voicing: null
        });
      }
    });
  });
  
  let currentBeatIndex = 0;
  const beatsPerMeasure = timeSignature === '3/4' ? 3 : 4;
  
  const playBeat = () => {
    try {
      // Bounds checking - ensure we haven't exceeded sequence length
      if (currentBeatIndex >= chordSequence.length || currentBeatIndex < 0) {
        // Progression finished or invalid index
        stopPlaybackAndCleanupFn();
        return;
      }
      
      // Safety check - ensure sequence is still valid
      if (!chordSequence || !Array.isArray(chordSequence)) {
        console.error('🚨 Chord sequence became invalid during playback');
        stopPlaybackAndCleanupFn();
        return;
      }
      
      const currentSlot = chordSequence[currentBeatIndex];
      
      // Safety check - ensure slot exists and is valid
      if (!currentSlot || typeof currentSlot !== 'object') {
        console.error(`🚨 Invalid slot at index ${currentBeatIndex}`);
        stopPlaybackAndCleanupFn();
        return;
      }
      
      const beatInMeasure = currentBeatIndex % beatsPerMeasure;
      
      // Play metronome click first (so it's exactly on the beat)
      try {
        playMetronomeClick(beatInMeasure, metronomeEnabled, clickVolume);
      } catch (metronomeError) {
        console.warn('⚠️ Metronome click failed:', metronomeError);
        // Continue without metronome - don't stop entire playback
      }
      
      // Update current playing slot for visual feedback
      if (typeof currentSlot.measureIndex === 'number' && typeof currentSlot.slotIndex === 'number') {
        setCurrentPlayingSlot({
          measureIndex: currentSlot.measureIndex,
          slotIndex: currentSlot.slotIndex
        });
      }
      
      // Play chord if present (slightly after metronome click)
      if (currentSlot.voicing && currentSlot.voicing.notes) {
        try {
          const notesToPlay = currentSlot.voicing.notes.filter(n => n && n.isPlayedInVoicing && !maskedStrings.includes(n.stringId));
          if (notesToPlay.length > 0) {
            SoundService.playBlockChord(notesToPlay, 1.5);
          }
        } catch (audioError) {
          console.warn('⚠️ Audio playback failed for beat:', audioError);
          // Continue playback even if audio fails - don't stop progression
        }
      }
      
      currentBeatIndex++;
      
    } catch (error) {
      console.error('🚨 Critical error in playBeat:', error);
      stopPlaybackAndCleanupFn();
    }
  };
  
  // Set up interval for all beats (including first)
  // This ensures metronome and chords are perfectly synchronized
  const interval = setInterval(playBeat, beatDurationMs);
  setProgressionInterval(interval);
  
  // Play first beat immediately to start right away
  playBeat();
};

/**
 * Stop progression playback
 * @param {Function} stopPlaybackAndCleanupFn - Cleanup function
 */
export const handleStopProgression = (stopPlaybackAndCleanupFn) => {
  stopPlaybackAndCleanupFn();
};

/**
 * Toggle play/pause state
 * @param {Object} params - Play/pause parameters
 */
export const handlePlayPause = ({
  isPlaying,
  handleStopProgressionFn,
  handlePlayProgressionFn
}) => {
  if (isPlaying) {
    handleStopProgressionFn();
  } else {
    handlePlayProgressionFn();
  }
};

/**
 * Play individual chord
 * @param {Object} params - Chord playback parameters
 */
export const handlePlayChord = ({
  voicing,
  isPlaying,
  maskedStrings
}) => {
  if (isPlaying) return;
  const notesToPlay = voicing.notes.filter(n => n.isPlayedInVoicing && !maskedStrings.includes(n.stringId));
  SoundService.resumeAudioContext();
  SoundService.playBlockChord(notesToPlay, 1.5);
};