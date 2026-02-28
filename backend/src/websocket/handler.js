import { generateStreamResponse } from '../services/ollama-service.js';
import { addMessage, getContext, createConversation } from '../services/memory-service.js';
import { parseCommands, stripCommands, executeCommand } from '../services/command-service.js';
import { getWeather } from '../services/weather-service.js';
import { getNews } from '../services/news-service.js';
import { userProfileService } from '../ml/services/user-profile.js';
import { behavioralAnalysisService } from '../ml/services/behavioral-analysis.js';
import { contextualMemoryService } from '../ml/services/contextual-memory.js';
import { logEvent } from '../services/user-log-service.js';

export function setupWebSocket(io) {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('chat_message', async ({ message, conversationId: cid, image, userId }) => {
      try {
        const conversationId = cid || createConversation();
        addMessage(conversationId, 'user', message);
        if (userId) {
          await logEvent(userId, { type: 'user_message', conversationId, content: message });
        }
        const context = getContext(conversationId);

        socket.emit('ai_response_start', { conversationId });

        const images = image ? [image] : [];
        const fullText = await generateStreamResponse(context, (chunk) => {
          socket.emit('ai_response_chunk', { chunk, conversationId });
        }, images, conversationId);
        
        // Record the interaction for learning
        await userProfileService.recordInteraction(conversationId, {
          question: message,
          response: fullText,
        });
        
        // Perform behavioral analysis
        await behavioralAnalysisService.analyzeUserBehavior(conversationId, [{
          question: message,
          response: fullText,
          timestamp: new Date().toISOString(),
        }]);
        
        // Update contextual memory
        await contextualMemoryService.updateMemory(conversationId, conversationId, {
          question: message,
          response: fullText,
        });

        // Process commands from full response
        const commands = parseCommands(fullText);
        const commandResults = [];

        for (const cmd of commands) {
          if (cmd.type === 'weather') {
            const weather = await getWeather(cmd.arg || 'New York');
            if (!weather.error) {
              commandResults.push({ type: 'weather', data: weather });
              if (userId) {
                await logEvent(userId, { type: 'command', command: 'weather', arg: cmd.arg || 'New York', result: weather });
              }
            }
          } else if (cmd.type === 'news') {
            const news = await getNews(cmd.arg || 'general', 5);
            if (!news.error) {
              commandResults.push({ type: 'news', data: news });
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

        const cleanText = stripCommands(fullText);
        addMessage(conversationId, 'assistant', cleanText);
        if (userId) {
          await logEvent(userId, { type: 'assistant_response', conversationId, content: cleanText });
        }

        socket.emit('ai_response_complete', {
          response: cleanText,
          conversationId,
          commands: commandResults,
        });
      } catch (err) {
        console.error('WebSocket chat error:', err.message);
        socket.emit('error', { message: 'Failed to generate response. Is Ollama running?' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}
