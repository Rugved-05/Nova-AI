import { v4 as uuidv4 } from 'uuid';

const MAX_CONTEXT_MESSAGES = 20;
const conversations = new Map();

export function createConversation() {
  const id = uuidv4();
  conversations.set(id, []);
  return id;
}

export function addMessage(conversationId, role, content) {
  if (!conversations.has(conversationId)) {
    conversations.set(conversationId, []);
  }
  conversations.get(conversationId).push({
    role,
    content,
    timestamp: new Date().toISOString(),
  });
}

export function getMessages(conversationId) {
  return conversations.get(conversationId) || [];
}

export function getContext(conversationId) {
  const msgs = conversations.get(conversationId) || [];
  const sliced = msgs.slice(-MAX_CONTEXT_MESSAGES);
  return sliced.map(({ role, content }) => ({ role, content }));
}

export function clearConversation(conversationId) {
  conversations.set(conversationId, []);
}

export function listConversations() {
  const result = [];
  for (const [id, msgs] of conversations.entries()) {
    if (msgs.length > 0) {
      result.push({
        id,
        messageCount: msgs.length,
        lastMessage: msgs[msgs.length - 1].timestamp,
        preview: msgs[0].content.slice(0, 80),
      });
    }
  }
  return result;
}
