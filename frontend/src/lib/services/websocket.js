import { io } from 'socket.io-client';

let socket = null;
const listeners = new Map();

export function connect() {
  if (socket?.connected) return socket;

const backendUrl = import.meta.env.VITE_BACKEND_URL;

socket = io(backendUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    emit('status', { connected: true });
  });

  socket.on('disconnect', () => {
    emit('status', { connected: false });
  });

  socket.on('ai_response_start', (data) => emit('start', data));
  socket.on('ai_response_chunk', (data) => emit('chunk', data));
  socket.on('ai_response_complete', (data) => emit('complete', data));
  socket.on('error', (data) => emit('error', data));

  return socket;
}

export function sendMessage(message, conversationId, image = null, userId = null) {
  if (!socket?.connected) {
    connect();
  }
  socket.emit('chat_message', { message, conversationId, image, userId });
}

export function on(event, callback) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event).add(callback);
  return () => listeners.get(event).delete(callback);
}

function emit(event, data) {
  const cbs = listeners.get(event);
  if (cbs) {
    cbs.forEach((cb) => cb(data));
  }
}

export function disconnect() {
  socket?.disconnect();
  socket = null;
}

export function isConnected() {
  return socket?.connected || false;
}
