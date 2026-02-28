const API_BASE = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export async function sendMessage(message, conversationId, userId) {
  return request('/chat', {
    method: 'POST',
    body: JSON.stringify({ message, conversationId, userId }),
  });
}

export async function getHealth() {
  return request('/health');
}

export async function getHistory(conversationId) {
  return request(`/history/${conversationId}`);
}

export async function getConversations() {
  return request('/history/conversations');
}

export async function getWeather(city) {
  return request(`/weather?city=${encodeURIComponent(city)}`);
}

export async function getNews(category = 'general') {
  return request(`/news?category=${encodeURIComponent(category)}`);
}

export async function registerUser(name, email) {
  return request('/users/register', {
    method: 'POST',
    body: JSON.stringify({ name, email }),
  });
}
