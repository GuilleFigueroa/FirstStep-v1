import { supabase, Candidate } from './supabase';
import { StorageService } from './storageService';

// Hello World: Servicio básico para candidatos
export class CandidateService {

  // Verificar si candidato ya existe (email o LinkedIn)
  static async checkDuplicateCandidate(processId: string, email: string, linkedinUrl?: string): Promise<{ isDuplicate: boolean; reason?: string }> {
    try {
      // Verificar email duplicado
      const { data: emailExists } = await supabase
        .from('candidates')
        .select('email')
        .eq('process_id', processId)
        .eq('email', email)
        .limit(1);

      if (emailExists && emailExists.length > 0) {
        return { isDuplicate: true, reason: 'Ya te registraste en este proceso con este email' };
      }

      // Verificar LinkedIn duplicado (si se proporciona)
      if (linkedinUrl) {
        const { data: linkedinExists } = await supabase
          .from('candidates')
          .select('linkedin_url')
          .eq('process_id', processId)
          .eq('linkedin_url', linkedinUrl)
          .limit(1);

        if (linkedinExists && linkedinExists.length > 0) {
          return { isDuplicate: true, reason: 'Ya te registraste en este proceso con este LinkedIn' };
        }
      }

      return { isDuplicate: false };
    } catch (error) {
      console.error('Error checking duplicate candidate:', error);
      return { isDuplicate: false };
    }
  }

  // Crear candidato básico
  static async createCandidate(data: {
    process_id: string;
    first_name: string;
    last_name: string;
    email: string;
    linkedin_url?: string;
  }): Promise<Candidate | null> {
    try {
      // Verificar duplicados antes de crear
      const duplicateCheck = await this.checkDuplicateCandidate(
        data.process_id,
        data.email,
        data.linkedin_url
      );

      if (duplicateCheck.isDuplicate) {
        console.error('Duplicate candidate:', duplicateCheck.reason);
        return null;
      }

      const { data: candidate, error } = await supabase
        .from('candidates')
        .insert({
          ...data,
          status: 'registered'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating candidate:', error.message, error.details, error.hint);
        return null;
      }

      return candidate;
    } catch (error) {
      console.error('Candidate service error:', error);
      return null;
    }
  }

  // Actualizar candidato con CV subido
  static async updateCandidateCV(candidateId: string, file: File): Promise<boolean> {
    try {
      // 1. Subir archivo a Storage
      const cvPath = await StorageService.uploadCV(file, candidateId);

      if (!cvPath) {
        return false;
      }

      // 2. Actualizar candidato con la URL
      const cvUrl = StorageService.getPublicUrl(cvPath);

      const { error } = await supabase
        .from('candidates')
        .update({
          cv_url: cvUrl,
          status: 'cv_uploaded'
        })
        .eq('id', candidateId);

      if (error) {
        console.error('Error updating candidate CV:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Update CV error:', error);
      return false;
    }
  }

  // Marcar candidato como rechazado (soft delete)
  static async rejectCandidate(candidateId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({
          status: 'rejected',
          rejection_reason: reason
        })
        .eq('id', candidateId);

      if (error) {
        console.error('Error rejecting candidate:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Reject candidate error:', error);
      return false;
    }
  }
}