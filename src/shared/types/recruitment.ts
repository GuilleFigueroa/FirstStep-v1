/**
 * Tipos compartidos para el sistema de reclutamiento
 *
 * Este archivo contiene todas las interfaces y tipos relacionados
 * con perfiles de trabajo, requisitos y postulaciones.
 */

export interface ProfileRequirement {
  id: string;
  category:
    | "experience"
    | "tools"
    | "technical"
    | "certifications"
    | "other-skills";
  title: string;
  level?: "básico" | "intermedio" | "avanzado";
  required: boolean;
  years?: number;
}

export interface FormQuestion {
  id: string;
  question: string;
  type: 'open' | 'multiple-choice';
  options?: string[];
}

export interface JobProfile {
  title: string;
  mandatoryRequirements: ProfileRequirement[];
  optionalRequirements: ProfileRequirement[];
  customPrompt?: string;
  customQuestion?: string;
  formQuestions?: FormQuestion[]; // Solo en memoria, NO se guarda en BD
}

export interface JobPosting {
  profile: JobProfile;
  companyName: string;
  jobTitle: string;
  candidateLimit?: number;
}

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
}
