import { supabase } from './supabase';

// Hello World: Servicio básico para subir y obtener CVs en Supabase Storage
export class StorageService {
  private static BUCKET_NAME = 'candidate-cvs';

  // Upload básico de archivo
  static async uploadCV(file: File, candidateId: string): Promise<string | null> {
    try {
      // Limpiar nombre de archivo: solo alfanuméricos, guiones y puntos
      const cleanFileName = file.name
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Reemplazar caracteres especiales con _
        .replace(/_{2,}/g, '_') // Reemplazar múltiples _ con uno solo
        .replace(/^_|_$/g, ''); // Remover _ al inicio y final

      const fileName = `${candidateId}-${Date.now()}-${cleanFileName}`;

      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading CV:', error);
        return null;
      }

      return data.path;
    } catch (error) {
      console.error('Storage service error:', error);
      return null;
    }
  }

  // Obtener URL pública del archivo
  static getPublicUrl(path: string): string {
    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(path);

    return data.publicUrl;
  }
}