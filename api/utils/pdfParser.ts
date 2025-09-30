import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { supabaseAdmin } from './supabase';

export interface ParseResult {
  success: boolean;
  text?: string;
  error?: string;
  metadata?: {
    fileType: string;
    characterCount: number;
  };
}

/**
 * Extrae texto de un CV (PDF o DOCX) desde Supabase Storage
 * @param cvUrl - URL del CV en Supabase Storage (ejemplo: "cvs/uuid-filename.pdf")
 * @returns Texto extraído del CV
 */
export async function extractTextFromCV(cvUrl: string): Promise<ParseResult> {
  try {
    // Detectar tipo de archivo por extensión
    const fileExtension = cvUrl.split('.').pop()?.toLowerCase();

    if (!fileExtension) {
      return {
        success: false,
        error: 'No se pudo detectar el tipo de archivo'
      };
    }

    // Descargar archivo desde Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('cvs')
      .download(cvUrl.replace('cvs/', '')); // Remover prefijo si existe

    if (error || !data) {
      return {
        success: false,
        error: `Error descargando CV: ${error?.message || 'Archivo no encontrado'}`
      };
    }

    // Convertir Blob a Buffer
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extraer texto según tipo de archivo
    let extractedText: string;

    if (fileExtension === 'pdf') {
      extractedText = await extractPDF(buffer);
    } else if (fileExtension === 'docx') {
      extractedText = await extractDOCX(buffer);
    } else {
      return {
        success: false,
        error: `Formato no soportado: .${fileExtension}. Solo se aceptan PDF y DOCX`
      };
    }

    // Validar que el texto extraído no esté vacío
    const cleanedText = extractedText.trim();

    if (cleanedText.length < 50) {
      return {
        success: false,
        error: 'CV parece estar vacío o ilegible (menos de 50 caracteres extraídos)'
      };
    }

    return {
      success: true,
      text: cleanedText,
      metadata: {
        fileType: fileExtension,
        characterCount: cleanedText.length
      }
    };

  } catch (error) {
    console.error('Error extracting text from CV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al procesar CV'
    };
  }
}

/**
 * Extrae texto de un archivo PDF
 */
async function extractPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error(`Error extrayendo texto de PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Extrae texto de un archivo DOCX
 */
async function extractDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    throw new Error(`Error extrayendo texto de DOCX: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}
