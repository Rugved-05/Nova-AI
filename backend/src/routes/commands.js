import { Router } from 'express';
import { executeCommand } from '../services/command-service.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { command, arg } = req.body;
    if (!command) return res.status(400).json({ error: 'Command is required' });
    const result = await executeCommand({ type: command, arg: arg || '' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
