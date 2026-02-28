import { Router } from 'express';
import { getNews } from '../services/news-service.js';

const router = Router();

router.get('/', async (req, res) => {
  const category = req.query.category || 'general';
  const count = parseInt(req.query.count || '5', 10);
  const data = await getNews(category, count);
  res.json(data);
});

export default router;
