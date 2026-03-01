import { generateStreamResponse } from '../services/deepseek-service.js';
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
        console.log("---- NEW CHAT MESSAGE ----");
        console.log("Message:", message);
        console.log("User ID:", userId);

        const conversationId = cid || createConversation();
        addMessage(conversationId, 'user', message);

        if (userId) {
          await logEvent(userId, {
            type: 'user_message',
            conversationId,
            content: message,
          });
        }

        const context = getContext(conversationId);

        socket.emit('ai_response_start', { conversationId });

        const images = image ? [image] : [];

        console.log("Generating streaming response...");
        console.log("Context length:", context.length);

        const fullText = await generateStreamResponse(
          context,
          (chunk) => {
            socket.emit('ai_response_chunk', { chunk, conversationId });
          },
          images,
          userId || 'default'
        );

        console.log("Full response received from model.");
        console.log("Response length:", fullText?.length);

        await userProfileService.recordInteraction(conversationId, {
          question: message,
          response: fullText,
        });

        await behavioralAnalysisService.analyzeUserBehavior(conversationId, [{
          question: message,
          response: fullText,
          timestamp: new Date().toISOString(),
        }]);

        await contextualMemoryService.updateMemory(conversationId, conversationId, {
          question: message,
          response: fullText,
        });

        const commands = parseCommands(fullText);
        const commandResults = [];

        for (const cmd of commands) {
          try {
            if (cmd.type === 'weather') {
              const weather = await getWeather(cmd.arg || 'New York');
              if (!weather.error) {
                commandResults.push({ type: 'weather', data: weather });
              }
            } else if (cmd.type === 'news') {
              const news = await getNews(cmd.arg || 'general', 5);
              if (!news.error) {
                commandResults.push({ type: 'news', data: news });
              }
            } else {
              const result = await executeCommand(cmd);
              commandResults.push({ type: cmd.type, ...result });
            }
          } catch (cmdErr) {
            console.error("Command execution error:", cmdErr);
          }
        }

        const cleanText = stripCommands(fullText);
        addMessage(conversationId, 'assistant', cleanText);

        socket.emit('ai_response_complete', {
          response: cleanText,
          conversationId,
          commands: commandResults,
        });

      } catch (err) {
        console.error("🚨 FULL WEBSOCKET ERROR:");
        console.error(err);
        console.error("Stack:", err?.stack);

        socket.emit('error', {
          message:
            err?.response?.data?.error?.message ||
            err?.message ||
            'Unknown server error',
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}