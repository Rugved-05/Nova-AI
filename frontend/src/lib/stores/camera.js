import { writable } from 'svelte/store';

function createCameraStore() {
  const { subscribe, update } = writable({
    enabled: false,
    stream: null,
    hasPermission: false,
    error: null,
  });

  return {
    subscribe,
    setEnabled(val) {
      update((s) => ({ ...s, enabled: val }));
    },
    setStream(stream) {
      update((s) => ({ ...s, stream, hasPermission: !!stream }));
    },
    setError(err) {
      update((s) => ({ ...s, error: err }));
    },
  };
}

export const camera = createCameraStore();
