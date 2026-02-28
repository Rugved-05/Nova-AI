import { voice } from '../stores/voice.js';

let currentUtterance = null;

// Preferred voices ranked for Jarvis-like sound (deep, male, British/natural)
const PREFERRED_VOICE_KEYWORDS = [
  'Google UK English Male',
  'Microsoft Ryan',
  'Microsoft George',
  'Daniel',
  'James',
  'Google UK English',
  'English United Kingdom',
  'en-GB',
  'Male',
];

export function isSupported() {
  return !!(typeof window !== 'undefined' && window.speechSynthesis);
}

export function getVoices() {
  if (!isSupported()) return [];
  return window.speechSynthesis.getVoices();
}

/**
 * Finds the best Jarvis-like voice available.
 * Prefers: British male > any male > Google UK > any English voice.
 */
export function findBestVoice() {
  const voices = getVoices();
  if (!voices.length) return null;

  for (const keyword of PREFERRED_VOICE_KEYWORDS) {
    const match = voices.find(
      (v) => v.name.includes(keyword) || v.lang.includes(keyword)
    );
    if (match) return match;
  }

  // Fallback to any English voice
  return voices.find((v) => v.lang.startsWith('en')) || voices[0];
}

export function speak(text, options = {}) {
  if (!isSupported() || !text) return;

  stop();

  const utterance = new SpeechSynthesisUtterance(text);

  // Jarvis defaults: slightly lower pitch, measured pace
  utterance.rate = options.rate ?? 0.95;
  utterance.pitch = options.pitch ?? 0.85;
  utterance.volume = options.volume ?? 1.0;
  utterance.lang = options.lang || 'en-GB';

  // Use specified voice or auto-detect best Jarvis voice
  if (options.voiceName) {
    const voices = getVoices();
    const match = voices.find((v) => v.name === options.voiceName);
    if (match) utterance.voice = match;
  } else {
    const best = findBestVoice();
    if (best) utterance.voice = best;
  }

  utterance.onstart = () => voice.setSpeaking(true);
  utterance.onend = () => voice.setSpeaking(false);
  utterance.onerror = () => voice.setSpeaking(false);

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stop() {
  if (isSupported()) {
    window.speechSynthesis.cancel();
  }
  voice.setSpeaking(false);
  currentUtterance = null;
}

export function pause() {
  if (isSupported()) window.speechSynthesis.pause();
}

export function resume() {
  if (isSupported()) window.speechSynthesis.resume();
}
