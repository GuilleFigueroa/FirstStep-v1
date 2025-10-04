import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Endpoint de prueba para verificar /api/analyze-cv
 * Uso: POST /api/test-analyze con body: { candidateId: "uuid" }
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { candidateId } = req.body;

  if (!candidateId) {
    return res.status(400).json({
      error: 'Falta candidateId en el body',
      usage: 'POST /api/test-analyze con body: { candidateId: "uuid" }'
    });
  }

  // Llamar al endpoint real
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/analyze-cv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ candidateId })
    });

    const data = await response.json();

    return res.status(response.status).json({
      status: response.status,
      data
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error al llamar /api/analyze-cv',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
