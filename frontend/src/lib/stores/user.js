import { writable } from 'svelte/store';

function createUserStore() {
  const { subscribe, set, update } = writable({
    userId: null,
    name: '',
    email: ''
  });
  return {
    subscribe,
    setProfile(profile) {
      set({
        userId: profile.id,
        name: profile.name,
        email: profile.email
      });
    }
  };
}

export const user = createUserStore();
