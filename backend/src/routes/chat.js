import { Router } from 'express';
import { generateResponse, generateStreamResponse } from '../services/deepseek-service.js';
import { addMessage, getContext, createConversation } from '../services/memory-service.js';
import { parseCommands, stripCommands, executeCommand } from '../services/command-service.js';
import { getWeather } from '../services/weather-service.js';
import { getNews } from '../services/news-service.js';
import { logEvent } from '../services/user-log-service.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { message, conversationId: cid, image, userId } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const conversationId = cid || createConversation();
    addMessage(conversationId, 'user', message);
    if (userId) {
      await logEvent(userId, { type: 'user_message', conversationId, content: message });
    }
    const context = getContext(conversationId);

    const images = image ? [image] : [];
    let aiText = await generateResponse(context, images, conversationId);

    // Parse and execute embedded commands
    const commands = parseCommands(aiText);
    const commandResults = [];

    for (const cmd of commands) {
      if (cmd.type === 'weather') {
        const weather = await getWeather(cmd.arg || 'New York');
        if (!weather.error) {
          const weatherInfo = `Weather in ${weather.city}: ${weather.temperature}°C, ${weather.description}, Humidity: ${weather.humidity}%, Wind: ${weather.windSpeed} km/h`;
          commandResults.push({ type: 'weather', data: weather, message: weatherInfo });
          if (userId) {
            await logEvent(userId, { type: 'command', command: 'weather', arg: cmd.arg || 'New York', result: weather });
          }
        }
      } else if (cmd.type === 'news') {
        const news = await getNews(cmd.arg || 'general', 5);
        if (!news.error && news.articles.length > 0) {
          const headlines = news.articles.map((a) => a.title).join('; ');
          commandResults.push({ type: 'news', data: news, message: `Headlines: ${headlines}` });
          if (userId) {
            await logEvent(userId, { type: 'command', command: 'news', arg: cmd.arg || 'general', result: news });
          }
        }
      } else {
        const result = await executeCommand(cmd);
        commandResults.push({ type: cmd.type, ...result });
        if (userId) {
          await logEvent(userId, { type: 'command', command: cmd.type, arg: cmd.arg || '', result });
        }
      }
    }

    const cleanText = stripCommands(aiText);
    addMessage(conversationId, 'assistant', cleanText);
    if (userId) {
      await logEvent(userId, { type: 'assistant_response', conversationId, content: cleanText });
    }

    res.json({
      response: cleanText,
      conversationId,
      commands: commandResults,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Failed to generate response.' });
  }
});

// Streaming endpoint for real-time speech
router.post('/stream', async (req, res) => {
  try {
    const { message, conversationId: cid, image } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const conversationId = cid || createConversation();
    addMessage(conversationId, 'user', message);
    const context = getContext(conversationId);
    const images = image ? [image] : [];

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    let fullResponse = '';
    const commands = [];
    let commandBuffer = '';

    try {
      // Stream the AI response
      await generateStreamResponse(context, (chunk) => {
        // Buffer for command parsing
        commandBuffer += chunk;
        fullResponse += chunk;
        
        // Send the chunk to client
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      }, images, conversationId);

      // Parse commands from the complete response
      const parsedCommands = parseCommands(fullResponse);
      const commandResults = [];

      for (const cmd of parsedCommands) {
        if (cmd.type === 'weather') {
          const weather = await getWeather(cmd.arg || 'New York');
          if (!weather.error) {
            const weatherInfo = `Weather in ${weather.city}: ${weather.temperature}°C, ${weather.description}, Humidity: ${weather.humidity}%, Wind: ${weather.windSpeed} km/h`;
            commandResults.push({ type: 'weather', data: weather, message: weatherInfo });
          }
        } else if (cmd.type === 'news') {
          const news = await getNews(cmd.arg || 'general', 5);
          if (!news.error && news.articles.length > 0) {
            const headlines = news.articles.map((a) => a.title).join('; ');
            commandResults.push({ type: 'news', data: news, message: `Headlines: ${headlines}` });
          }
        } else {
          const result = await executeCommand(cmd);
          commandResults.push({ type: cmd.type, ...result });
        }
      }

      const cleanText = stripCommands(fullResponse);
      addMessage(conversationId, 'assistant', cleanText);

      // Send final message with metadata
      res.write(`data: ${JSON.stringify({
        type: 'complete',
        content: cleanText,
        conversationId,
        commands: commandResults,
        timestamp: new Date().toISOString()
      })}\n\n`);
      
      res.end();
    } catch (streamError) {
      console.error('Stream error:', streamError);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Stream failed' })}\n\n`);
      res.end();
    }
  } catch (err) {
    console.error('Streaming chat error:', err);
    res.status(500).json({ error: 'Failed to generate streaming response' });
  }
});

export default router;
