import { voice } from '../stores/voice.js';

let recognition = null;
let audioContext = null;
let analyser = null;
let micStream = null;
let volumeInterval = null;
let continuousMode = false;
let onResultCb = null;
let onErrorCb = null;
let currentLang = 'en-US';
let shouldRestart = false;

export function isSupported() {
  return !!(
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
  );
}

export function create(options = {}) {
  if (!isSupported()) {
    voice.setSupported(false);
    return null;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = options.lang || 'en-US';
  recognition.maxAlternatives = 1;

  return recognition;
}

export async function start(onResult, onError, lang = 'en-US') {
  if (!recognition) create({ lang });
  if (!recognition) return;

  onResultCb = onResult;
  onErrorCb = onError;
  currentLang = lang;
  shouldRestart = true;
  continuousMode = true;

  recognition.lang = lang;

  recognition.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += transcript;
      } else {
        interim += transcript;
      }
    }
    voice.setInterim(interim || final);
    if (final && onResultCb) {
      onResultCb(final.trim());
    }
  };

  recognition.onerror = (event) => {
    if (event.error === 'no-speech' || event.error === 'aborted') {
      // In continuous mode, these are normal - just restart
      return;
    }
    voice.setError(event.error);
    if (onErrorCb) onErrorCb(event.error);
  };

  recognition.onend = () => {
    voice.setInterim('');
    // Auto-restart if continuous mode is still active
    if (shouldRestart && continuousMode) {
      try {
        setTimeout(() => {
          if (shouldRestart && recognition) {
            recognition.start();
          }
        }, 100);
      } catch {}
    } else {
      voice.setListening(false);
      stopVolumeMonitor();
    }
  };

  try {
    recognition.start();
    voice.setListening(true);
    await startVolumeMonitor();
  } catch (err) {
    voice.setError(err.message);
  }
}

export function stop() {
  shouldRestart = false;
  continuousMode = false;
  if (recognition) {
    try {
      recognition.stop();
    } catch {}
  }
  voice.setListening(false);
  voice.setInterim('');
  stopVolumeMonitor();
}

export function isContinuous() {
  return continuousMode;
}

async function startVolumeMonitor() {
  // Reuse existing mic stream if already open
  if (audioContext && micStream) return;
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContext.createMediaStreamSource(micStream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    volumeInterval = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / dataArray.length / 255;
      voice.setVolume(avg);
    }, 50);
  } catch {}
}

function stopVolumeMonitor() {
  if (volumeInterval) {
    clearInterval(volumeInterval);
    volumeInterval = null;
  }
  if (micStream) {
    micStream.getTracks().forEach((t) => t.stop());
    micStream = null;
  }
  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
  }
  voice.setVolume(0);
}
