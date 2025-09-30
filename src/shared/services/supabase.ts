import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://csmkihhubfemcvwtakix.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbWtpaGh1YmZlbWN2d3Rha2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMTQ3NjEsImV4cCI6MjA3NDU5MDc2MX0.uzuXTK1UgPJOQR-G77IknRFRu4PHzqo-Wl-y5XDwjX8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para la base de datos
export interface Profile {
  id: string
  email: string
  first_name: string
  last_name: string
  company_name?: string
  created_at: string
  updated_at: string
}

export interface Process {
  id: string
  recruiter_id: string
  title: string
  company_name: string
  description: string
  requirements: any[]
  mandatory_requirements?: any[]
  optional_requirements?: any[]
  custom_prompt?: string
  form_questions: any[]
  candidate_limit?: number
  status: 'active' | 'closed' | 'paused'
  unique_link: string
  created_at: string
  updated_at: string
}

export interface Candidate {
  id: string
  process_id: string
  first_name: string
  last_name: string
  email: string
  linkedin_url?: string
  cv_url?: string
  cv_text?: string
  cv_analysis?: any
  scoring_details?: any
  status: 'registered' | 'cv_uploaded' | 'questions_answered' | 'completed'
  score?: number
  parsing_failed?: boolean
  parsing_error?: string
  ai_analysis_failed?: boolean
  created_at: string
  updated_at: string
}

export interface AIQuestion {
  id: string
  candidate_id: string
  question_text: string
  question_reason?: string
  is_mandatory: boolean
  answer_text?: string
  is_answered: boolean
  created_at: string
}

export interface RecruiterQuestion {
  id: string
  process_id: string
  question_text: string
  question_order?: number
  created_at: string
}

export interface RecruiterAnswer {
  id: string
  candidate_id: string
  question_id: string
  answer_text?: string
  created_at: string
}