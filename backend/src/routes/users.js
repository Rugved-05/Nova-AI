import { Router } from 'express';
import { registerUser, getUserEvents } from '../services/user-log-service.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
    const profile = await registerUser(name, email);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:userId/events', async (req, res) => {
  try {
    const events = await getUserEvents(req.params.userId);
    res.json({ userId: req.params.userId, events });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
