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
  const model = openai('gpt-4o-mini', {
    structuredOutputs: options?.responseFormat === 'json',
  });

  return await generateText({
    model,
    prompt,
    temperature: options?.temperature ?? 0.7,
    maxTokens: options?.maxTokens ?? 1500,
    abortSignal: AbortSignal.timeout(30000), // Timeout 30s
  });
}

export { openai };
