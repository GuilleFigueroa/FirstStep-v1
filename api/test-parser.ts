import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractTextFromCV } from './utils/pdfParser';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { cvUrl } = req.body;

    // Validar que se envió cvUrl
    if (!cvUrl || typeof cvUrl !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid cvUrl parameter',
        example: { cvUrl: 'cvs/uuid-filename.pdf' }
      });
    }

    // Extraer texto del CV
    const result = await extractTextFromCV(cvUrl);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    // Retornar resultado exitoso
    return res.status(200).json({
      success: true,
      text: result.text,
      metadata: result.metadata,
      preview: result.text?.substring(0, 500) + '...' // Preview de los primeros 500 caracteres
    });

  } catch (error) {
    console.error('Error in test-parser:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
