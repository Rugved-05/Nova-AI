import 'dotenv/config';

const config = {
  port: parseInt(process.env.BACKEND_PORT || '3001', 10),
  ollama: {
    url: process.env.OLLAMA_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3',
    visionModel: process.env.OLLAMA_VISION_MODEL || 'llava',
  },
  cors: {
    origin: process.env.FRONTEND_URL ? 
      process.env.FRONTEND_URL.split(',').map(url => url.trim()) : 
      ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  },
  
  // Remote access configuration
  remoteAccess: {
    enabled: process.env.REMOTE_ACCESS_ENABLED === 'true',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
    authRequired: process.env.AUTH_REQUIRED === 'true',
    apiKey: process.env.API_KEY,
  },
  
  // Security configuration
  security: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
    },
  },
};

export default config;
