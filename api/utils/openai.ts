import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

// Cliente OpenAI usando Vercel AI SDK
// Ventajas: multi-proveedor, optimizado para Vercel, cambiar modelos fácilmente

/**
 * Genera texto usando GPT-4o-mini con Vercel AI SDK
 * @param prompt - Prompt completo para el modelo
 * @param options - Opciones adicionales (temperature, maxTokens, etc.)
 */
export async function generateAIResponse(
  prompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'json' | 'text';
  }
) {
  const model = openai('gpt-4o-mini');

  // Si se requiere JSON, agregarlo al prompt
  const finalPrompt = options?.responseFormat === 'json'
    ? `${prompt}\n\nResponde ÚNICAMENTE con JSON válido, sin texto adicional.`
    : prompt;

  return await generateText({
    model,
    messages: [
      {
        role: 'user',
        content: finalPrompt
      }
    ],
    temperature: options?.temperature ?? 0.7,
    maxCompletionTokens: options?.maxTokens ?? 1500,
  });
}

export { openai };
