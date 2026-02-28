import { writable } from 'svelte/store';

const STORAGE_KEY = 'nova-settings';

function loadSettings() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

const defaults = {
  autoSpeak: true,
  voiceName: '',
  speechRate: 0.95,
  speechPitch: 0.85,
  speechVolume: 1.0,
  language: 'en-GB',
  continuousListening: true,
  cameraEnabled: false,
  showSettings: false,
};

function createSettingsStore() {
  const initial = { ...defaults, ...loadSettings() };
  const { subscribe, update, set } = writable(initial);

  function save(state) {
    if (typeof localStorage !== 'undefined') {
      const { showSettings, ...toSave } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }

  return {
    subscribe,
    update(key, value) {
      update((s) => {
        const next = { ...s, [key]: value };
        save(next);
        return next;
      });
    },
    toggleSettings() {
      update((s) => ({ ...s, showSettings: !s.showSettings }));
    },
    reset() {
      set({ ...defaults });
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
  };
}

export const settings = createSettingsStore();
