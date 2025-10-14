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

  // Analizar CV con IA (generar preguntas)
  static async analyzeCVWithAI(candidateId: string, recruiterId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/analyze-cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ candidateId, recruiterId })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Error al analizar CV'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Analyze CV error:', error);
      return {
        success: false,
        error: 'Error de conexión al analizar CV'
      };
    }
  }

  // Obtener todos los candidatos del reclutador con info de sus procesos
  static async getCandidatesByRecruiter(
    recruiterId: string,
    options?: { page?: number; limit?: number }
  ): Promise<{
    success: boolean;
    candidates?: Array<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      linkedin_url?: string;
      cv_url?: string;
      score?: number;
      status: string;
      action_status?: 'none' | 'reviewed' | 'contacted' | 'sent';
      is_favorite?: boolean;
      created_at: string;
      process_id: string;
      process_title: string;
      process_company: string;
      process_status: string;
    }>;
    pagination?: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasMore: boolean;
    };
    error?: string;
  }> {
    try {
      // Inicializar opciones de paginación
      const { page = 0, limit = 50 } = options || {};
      const from = page * limit;
      const to = from + limit - 1;

      // 1. Obtener todos los procesos del reclutador
      const { data: processes, error: processesError } = await supabase
        .from('processes')
        .select('id, title, company_name, status')
        .eq('recruiter_id', recruiterId);

      if (processesError) {
        console.error('Error fetching processes:', processesError);
        return {
          success: false,
          error: 'Error al obtener procesos'
        };
      }

      if (!processes || processes.length === 0) {
        // El reclutador no tiene procesos aún
        return {
          success: true,
          candidates: [],
          pagination: {
            page: 0,
            limit,
            totalCount: 0,
            totalPages: 0,
            hasMore: false
          }
        };
      }

      // 2. Obtener candidatos de todos los procesos
      const processIds = processes.map(p => p.id);

      // 3. Obtener conteo total (para calcular páginas)
      const { count: totalCount, error: countError } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true })
        .in('process_id', processIds)
        .in('status', ['completed', 'rejected']);

      if (countError) {
        console.error('Error fetching candidate count:', countError);
        return {
          success: false,
          error: 'Error al contar candidatos',
          pagination: { page: 0, limit, totalCount: 0, totalPages: 0, hasMore: false }
        };
      }

      // 4. Obtener candidatos paginados
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .in('process_id', processIds)
        .in('status', ['completed', 'rejected']) // Solo candidatos que completaron el proceso
        .order('created_at', { ascending: false })
        .range(from, to);

      if (candidatesError) {
        console.error('Error fetching candidates:', candidatesError);
        return {
          success: false,
          error: 'Error al obtener candidatos'
        };
      }

      // 3. Crear map de procesos para lookup rápido
      const processMap = new Map(processes.map(p => [p.id, p]));

      // 4. Combinar datos de candidatos + proceso
      const candidatesWithProcess = (candidates || []).map(candidate => {
        const process = processMap.get(candidate.process_id);
        return {
          id: candidate.id,
          first_name: candidate.first_name,
          last_name: candidate.last_name,
          email: candidate.email,
          linkedin_url: candidate.linkedin_url,
          cv_url: candidate.cv_url,
          score: candidate.score || 0,
          status: candidate.status,
          action_status: candidate.action_status || 'none',
          is_favorite: candidate.is_favorite || false,
          created_at: candidate.created_at,
          process_id: candidate.process_id,
          process_title: process?.title || 'Proceso desconocido',
          process_company: process?.company_name || 'Empresa desconocida',
          process_status: process?.status || 'unknown'
        };
      });

      // 5. Calcular metadata de paginación
      const totalPages = (totalCount && totalCount > 0) ? Math.ceil(totalCount / limit) : 0;

      return {
        success: true,
        candidates: candidatesWithProcess,
        pagination: {
          page,
          limit,
          totalCount: totalCount || 0,
          totalPages,
          hasMore: page < totalPages - 1
        }
      };
    } catch (error) {
      console.error('Get candidates by recruiter error:', error);
      return {
        success: false,
        error: 'Error al cargar candidatos'
      };
    }
  }

  // Obtener análisis completo de un candidato
  static async getCandidateAnalysis(candidateId: string, recruiterId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const response = await fetch(`/api/get-candidate-analysis?candidateId=${candidateId}&recruiterId=${recruiterId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Error al obtener análisis del candidato'
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Get candidate analysis error:', error);
      return {
        success: false,
        error: 'Error de conexión al obtener análisis'
      };
    }
  }

  // Actualizar action_status de un candidato
  static async updateActionStatus(candidateId: string, actionStatus: 'none' | 'reviewed' | 'contacted' | 'sent'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ action_status: actionStatus })
        .eq('id', candidateId);

      if (error) {
        console.error('Error updating action status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Update action status error:', error);
      return false;
    }
  }

  // Actualizar is_favorite de un candidato
  static async updateFavoriteStatus(candidateId: string, isFavorite: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ is_favorite: isFavorite })
        .eq('id', candidateId);

      if (error) {
        console.error('Error updating favorite status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Update favorite status error:', error);
      return false;
    }
  }
}