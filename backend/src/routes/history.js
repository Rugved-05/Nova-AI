import { Router } from 'express';
import { getMessages, listConversations, clearConversation } from '../services/memory-service.js';

const router = Router();

router.get('/conversations', (_req, res) => {
  res.json({ conversations: listConversations() });
});

router.get('/:id', (req, res) => {
  const messages = getMessages(req.params.id);
  res.json({ conversationId: req.params.id, messages });
});

router.delete('/:id', (req, res) => {
  clearConversation(req.params.id);
  res.json({ success: true });
});

export default router;
