import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateAIResponse } from './utils/openai';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // Test simple: pedirle a la IA que responda "Hello World"
    const prompt = 'Responde únicamente con las palabras: "OpenAI configurado correctamente"';

    const response = await generateAIResponse(prompt, {
      temperature: 0,
      maxTokens: 50
    });

    return res.status(200).json({
      success: true,
      message: 'API key OpenAI funcionando',
      aiResponse: response,
      model: 'gpt-4o-mini'
    });

  } catch (error: any) {
    console.error('Test OpenAI error:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Error desconocido',
      details: error.response?.data || null
    });
  }
}
