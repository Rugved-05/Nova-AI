import OpenAI from "openai";
import config from "../config/default.js";

const openai = new OpenAI({
  apiKey: config.deepseek.apiKey,
  baseURL: "https://api.deepseek.com",
});

/**
 * Normal (non-streaming) response
 */
export async function generateResponse(context, images = [], conversationId) {
  const completion = await openai.chat.completions.create({
    model: config.deepseek.model,
    messages: context,
    temperature: 0.7,
  });

  return completion.choices[0].message.content;
}

/**
 * Streaming response (for SSE)
 */
export async function generateStreamResponse(
  context,
  onChunk,
  images = [],
  conversationId
) {
  const stream = await openai.chat.completions.create({
    model: config.deepseek.model,
    messages: context,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices?.[0]?.delta?.content;
    if (content) {
      onChunk(content);
    }
  }
}

/**
 * Health check
 */
export async function checkStatus() {
  try {
    await openai.models.list();
    return { status: "online", provider: "deepseek" };
  } catch (error) {
    return { status: "offline", error: error.message };
  }
}