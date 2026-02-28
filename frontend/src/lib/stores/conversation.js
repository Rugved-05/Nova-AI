import { writable } from 'svelte/store';

function createConversationStore() {
  const { subscribe, set, update } = writable({
    conversationId: null,
    messages: [],
    isLoading: false,
  });

  return {
    subscribe,
    init(id) {
      update((s) => ({ ...s, conversationId: id }));
    },
    addMessage(role, content, commands = []) {
      update((s) => ({
        ...s,
        messages: [
          ...s.messages,
          { role, content, commands, timestamp: new Date().toISOString() },
        ],
      }));
    },
    // Add streaming message (initially empty)
    addStreamingMessage() {
      update((s) => ({
        ...s,
        messages: [
          ...s.messages,
          { role: 'assistant', content: '', commands: [], timestamp: new Date().toISOString(), streaming: true },
        ],
      }));
    },
    // Update streaming message content
    updateStreamingMessage(content) {
      update((s) => {
        const msgs = [...s.messages];
        const lastIndex = msgs.length - 1;
        if (lastIndex >= 0 && msgs[lastIndex].streaming) {
          msgs[lastIndex] = { ...msgs[lastIndex], content };
        }
        return { ...s, messages: msgs };
      });
    },
    // Complete streaming message
    completeStreamingMessage(content, commands = []) {
      update((s) => {
        const msgs = [...s.messages];
        const lastIndex = msgs.length - 1;
        if (lastIndex >= 0 && msgs[lastIndex].streaming) {
          msgs[lastIndex] = { 
            ...msgs[lastIndex], 
            content, 
            commands, 
            streaming: false 
          };
        }
        return { ...s, messages: msgs };
      });
    },
    updateLastAssistant(content) {
      update((s) => {
        const msgs = [...s.messages];
        for (let i = msgs.length - 1; i >= 0; i--) {
          if (msgs[i].role === 'assistant') {
            msgs[i] = { ...msgs[i], content };
            break;
          }
        }
        return { ...s, messages: msgs };
      });
    },
    setLoading(loading) {
      update((s) => ({ ...s, isLoading: loading }));
    },
    clear() {
      set({ conversationId: null, messages: [], isLoading: false });
    },
    loadMessages(conversationId, messages) {
      set({ conversationId, messages, isLoading: false });
    },
  };
}

export const conversation = createConversationStore();
