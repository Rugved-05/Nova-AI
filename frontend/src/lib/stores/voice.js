import { writable } from 'svelte/store';

function createVoiceStore() {
  const { subscribe, update } = writable({
    isListening: false,
    isSpeaking: false,
    interimTranscript: '',
    volume: 0,
    error: null,
    supported: true,
  });

  return {
    subscribe,
    setListening(val) {
      update((s) => ({ ...s, isListening: val, error: null }));
    },
    setSpeaking(val) {
      update((s) => ({ ...s, isSpeaking: val }));
    },
    setInterim(text) {
      update((s) => ({ ...s, interimTranscript: text }));
    },
    setVolume(vol) {
      update((s) => ({ ...s, volume: vol }));
    },
    setError(err) {
      update((s) => ({ ...s, error: err, isListening: false }));
    },
    setSupported(val) {
      update((s) => ({ ...s, supported: val }));
    },
  };
}

export const voice = createVoiceStore();
