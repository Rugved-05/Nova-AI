import { Router } from 'express';
import { getWeather } from '../services/weather-service.js';

const router = Router();

router.get('/', async (req, res) => {
  const city = req.query.city || 'New York';
  const data = await getWeather(city);
  res.json(data);
});

export default router;
