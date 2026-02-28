import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import config from './config/default.js';
import { checkStatus } from './services/ollama-service.js';
import chatRouter from './routes/chat.js';
import historyRouter from './routes/history.js';
import commandsRouter from './routes/commands.js';
import weatherRouter from './routes/weather.js';
import newsRouter from './routes/news.js';
import mlRouter from './routes/ml.js';
import usersRouter from './routes/users.js';
import { setupWebSocket } from './websocket/handler.js';

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 10e6,
});

/* ================= SECURITY ================= */

app.use(helmet());

/* ================= RATE LIMIT ================= */

const limiter = rateLimit({
  windowMs: config.security?.rateLimit?.windowMs || 15 * 60 * 1000,
  max: config.security?.rateLimit?.max || 500,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

/* ================= CORS FIX ================= */

app.use(cors({
  origin: "*",
  credentials: false,
}));

app.use(express.json({ limit: '10mb' }));

/* ================= HEALTH ================= */

app.get('/api/health', async (_req, res) => {
  const deepseek = await checkStatus();
  res.json({
    status: 'ok',
    deepseek,
    uptime: process.uptime(),
  });
});

/* ================= ROUTES ================= */

app.use('/api/chat', chatRouter);
app.use('/api/history', historyRouter);
app.use('/api/command', commandsRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/news', newsRouter);
app.use('/api/ml', mlRouter);
app.use('/api/users', usersRouter);

/* ================= WEBSOCKET ================= */

setupWebSocket(io);

/* ================= START ================= */

server.listen(config.port, () => {
  console.log(`NOVA Backend running on port ${config.port}`);
  console.log(`DeepSeek model: ${config.deepseek.model}`);
});