import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import config from './config/default.js';
import { checkDeepseekStatus } from './services/deepseek-service.js';
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
  cors: { origin: config.cors.origin, methods: ['GET', 'POST'] },
  maxHttpBufferSize: 10e6, // 10MB for image frames
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.max,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS and body parsing
app.use(cors({ 
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = Array.isArray(config.cors.origin) ? config.cors.origin : [config.cors.origin];
    const isAllowed = allowedOrigins.includes(origin) || 
      config.remoteAccess.allowedOrigins.includes(origin);
    
    callback(null, isAllowed);
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Authentication middleware for remote access
app.use('/api/*', (req, res, next) => {
  // Skip auth for local requests
  if (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip.startsWith('192.168.') || req.ip.startsWith('10.')) {
    return next();
  }
  
  // Check if auth is required for remote access
  if (config.remoteAccess.authRequired && config.remoteAccess.apiKey) {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== config.remoteAccess.apiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
  }
  
  next();
});

// Health check
app.get('/api/health', async (_req, res) => {
  const deepseek = await checkDeepseekStatus();
  res.json({
    status: 'ok',
    deepseek,
    uptime: process.uptime(),
  });
});

// Routes
app.use('/api/chat', chatRouter);
app.use('/api/history', historyRouter);
app.use('/api/command', commandsRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/news', newsRouter);
app.use('/api/ml', mlRouter);
app.use('/api/users', usersRouter);

// WebSocket with authentication
io.use((socket, next) => {
  // Skip auth for local connections
  const handshakeIp = socket.handshake.address || 'unknown';
  if (handshakeIp === '127.0.0.1' || handshakeIp === '::1' || handshakeIp.startsWith('192.168.') || handshakeIp.startsWith('10.')) {
    return next();
  }
  
  // Check API key for remote connections
  if (config.remoteAccess.authRequired && config.remoteAccess.apiKey) {
    const apiKey = socket.handshake.auth?.apiKey || socket.handshake.headers['x-api-key'];
    if (!apiKey || apiKey !== config.remoteAccess.apiKey) {
      return next(new Error('Authentication error'));
    }
  }
  
  next();
});

setupWebSocket(io);

// Start server
server.listen(config.port, () => {
  console.log(`\n  NOVA Backend running on http://localhost:${config.port}`);
  console.log(`  DeepSeek model: ${config.deepseek.model}\n`);
});
