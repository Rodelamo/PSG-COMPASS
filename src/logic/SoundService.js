// src/logic/SoundService.js

/**
 * SOUND SERVICE MODULE
 *
 * This module provides functionalities for playing musical notes and chords
 * using the Web Audio API. The sound has been modified from a simple sine
 * wave to a richer, more guitar-like tone using a custom PeriodicWave
 * and a more natural volume envelope.
 */

import { noteToFrequency } from './NoteUtils';

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let guitarWave;

const createCustomWave = () => {
  if (guitarWave) {
    return;
  }
  const real = new Float32Array([0, 0, 0, 0, 0]);
  const imag = new Float32Array([0, 1, 0.6, 0.4, 0.2]);
  guitarWave = audioContext.createPeriodicWave(real, imag, { disableNormalization: false });
};

const playSingleNote = (noteName, durationSec = 1.5) => {
  if (!noteName) {
    console.warn("Attempted to play an invalid note (null or undefined).");
    return;
  }

  try {
    createCustomWave();
    const frequency = noteToFrequency(noteName);
    const oscillator = audioContext.createOscillator();
    oscillator.setPeriodicWave(guitarWave);
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.7, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + durationSec);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + durationSec + 0.01);
  } catch (error) {
    console.error(`Error playing note ${noteName}:`, error);
  }
};

const playChord = (notes, noteDurationSec = 1/3, delayBetweenNotesSec = 1/35) => {
  if (!notes || notes.length === 0) {
    console.warn("Attempted to play an empty chord.");
    return;
  }

  createCustomWave();
  let startTime = audioContext.currentTime;
  const sortedPlayableNotes = notes.sort((a, b) => b.stringId - a.stringId);

  sortedPlayableNotes.forEach((note, index) => {
    const scheduledTime = startTime + (index * delayBetweenNotesSec);

    try {
      const frequency = noteToFrequency(note.finalNote);
      const oscillator = audioContext.createOscillator();
      oscillator.setPeriodicWave(guitarWave);
      oscillator.frequency.setValueAtTime(frequency, scheduledTime);

      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0, scheduledTime);
      gainNode.gain.linearRampToValueAtTime(0.7, scheduledTime + (noteDurationSec * 0.1));
      gainNode.gain.exponentialRampToValueAtTime(0.0001, scheduledTime + noteDurationSec);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(scheduledTime);
      oscillator.stop(scheduledTime + noteDurationSec + (noteDurationSec * 0.1));
    } catch (error) {
      console.error(`Error scheduling note ${note.finalNote} for chord playback:`, error);
    }
  });
};

// MODIFIED: Added volume scaling to prevent distortion.
const playBlockChord = (notes, durationSec = 1.5) => {
    if (!notes || notes.length === 0) {
        console.warn("Attempted to play an empty block chord.");
        return;
    }

    createCustomWave();
    const startTime = audioContext.currentTime;

    // Calculate a volume factor to prevent clipping/distortion
    const noteCount = notes.length;
    let volumeFactor = 1.0;
    if (noteCount >= 3) {
        volumeFactor = 0.33; // 75% reduction for 3 notes
        const additionalNotes = noteCount - 3;
        // Each additional note reduces volume by 7.5%
        volumeFactor *= Math.pow(1 - 0.075, additionalNotes);
    }
    const maxGain = 0.7 * volumeFactor;


    notes.forEach(note => {
        try {
            const frequency = noteToFrequency(note.finalNote);
            const oscillator = audioContext.createOscillator();
            oscillator.setPeriodicWave(guitarWave);
            oscillator.frequency.setValueAtTime(frequency, startTime);

            const gainNode = audioContext.createGain();
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(maxGain, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.start(startTime);
            oscillator.stop(startTime + durationSec + 0.01);
        } catch (error) {
            console.error(`Error scheduling note ${note.finalNote} for block chord playback:`, error);
        }
    });
};


const resumeAudioContext = () => {
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
};

const SoundService = {
  playSingleNote,
  playChord,
  playBlockChord,
  resumeAudioContext,
  audioContext,
};

export default SoundService;