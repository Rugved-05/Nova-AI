import 'dotenv/config';

const config = {
  port: parseInt(process.env.BACKEND_PORT || '3001', 10),

  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  },

  cors: {
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
      : [
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:5175'
        ],
  },

  remoteAccess: {
    enabled: process.env.REMOTE_ACCESS_ENABLED === 'true',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
    authRequired: process.env.AUTH_REQUIRED === 'true',
    apiKey: process.env.API_KEY,
  },

  security: {
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 100,
    },
  },
};

export default config;