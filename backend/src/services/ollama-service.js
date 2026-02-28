import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

export async function chat({ messages, stream = false }) {
  if (!stream) {
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages,
      temperature: 0.7,
    });

    return completion.choices[0].message;
  }

  const response = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages,
    stream: true,
  });

  return response;
}

export async function checkStatus() {
  try {
    await openai.models.list();
    return { status: "online" };
  } catch (err) {
    return { status: "offline", error: err.message };
  }
}