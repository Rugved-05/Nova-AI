import OpenAI from 'openai';
import config from '../config/default.js';
import { userProfileService } from '../ml/services/user-profile.js';
import { behavioralAnalysisService } from '../ml/services/behavioral-analysis.js';
import { adaptiveResponseService } from '../ml/services/adaptive-response.js';

const client = new OpenAI({
  apiKey: config.deepseek.apiKey,
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
});

const SYSTEM_PROMPT = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), Tony Stark's personal AI assistant from Iron Man. You embody the perfect blend of British sophistication, technical brilliance, and dry wit. You speak with calm authority, subtle sarcasm, and effortless intelligence.`;

function toChatMessages(messages) {
  return messages.map((m) => {
    const entry = { role: m.role, content: m.content };
    if (m.images && m.images.length) {
      entry.content = [
        { type: 'text', text: m.content },
        ...m.images.map((img) => ({ type: 'input_image', image_url: img })),
      ];
    }
    return entry;
  });
}

export async function generateResponse(messages, images = [], userId = 'default') {
  const userProfile = userProfileService.getProfile(userId);
  const personalizationPrompt = userProfileService.getPersonalizationPrompt(userId);

  let enhancedSystemPrompt = SYSTEM_PROMPT;
  if (personalizationPrompt) {
    enhancedSystemPrompt += `\n\nPersonalization Instructions:\n${personalizationPrompt}`;
  }

  const formatted = [{ role: 'system', content: enhancedSystemPrompt }, ...messages];
  if (images.length > 0) {
    const idx = formatted.findLastIndex((m) => m.role === 'user');
    if (idx >= 0) {
      formatted[idx] = { ...formatted[idx], images };
    }
  }

  const model =
    images.length > 0
      ? process.env.DEEPSEEK_VISION_MODEL || 'deepseek-vl'
      : config.deepseek.model;

  const payloadMessages = toChatMessages(formatted);
  const completion = await client.chat.completions.create({
    model,
    messages: payloadMessages,
    stream: false,
  });

  const content = completion.choices?.[0]?.message?.content || '';
  const adaptiveResponse = await adaptiveResponseService.generateAdaptiveResponse(
    userId,
    'default_conversation',
    content,
    { messages, images }
  );
  return adaptiveResponse;
}

export async function generateStreamResponse(messages, onChunk, images = [], userId = 'default') {
  const userProfile = userProfileService.getProfile(userId);
  const personalizationPrompt = userProfileService.getPersonalizationPrompt(userId);

  let enhancedSystemPrompt = SYSTEM_PROMPT;
  if (personalizationPrompt) {
    enhancedSystemPrompt += `\n\nPersonalization Instructions:\n${personalizationPrompt}`;
  }

  const formatted = [{ role: 'system', content: enhancedSystemPrompt }, ...messages];
  if (images.length > 0) {
    const idx = formatted.findLastIndex((m) => m.role === 'user');
    if (idx >= 0) {
      formatted[idx] = { ...formatted[idx], images };
    }
  }

  const model =
    images.length > 0
      ? process.env.DEEPSEEK_VISION_MODEL || 'deepseek-vl'
      : config.deepseek.model;

  const payloadMessages = toChatMessages(formatted);
  const stream = await client.chat.completions.create({
    model,
    messages: payloadMessages,
    stream: true,
  });

  let full = '';
  for await (const part of stream) {
    const delta = part.choices?.[0]?.delta?.content || '';
    if (delta) {
      full += delta;
      onChunk(delta);
    }
  }
  return full;
}

export async function checkDeepseekStatus() {
  try {
    const list = await client.models.list();
    const models = list.data?.map((m) => m.id) || [];
    return { running: true, models };
  } catch {
    return { running: false, models: [] };
  }
}
