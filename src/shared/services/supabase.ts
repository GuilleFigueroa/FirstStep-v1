import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para la base de datos
export interface Profile {
  id: string
  email: string
  first_name: string
  last_name: string
  company_name?: string
  account_status?: 'pending' | 'approved' | 'rejected'
  approved_at?: string
  approved_by?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export interface Process {
  id: string
  recruiter_id: string
  title: string
  company_name: string
  description: string
  mandatory_requirements: any[]
  optional_requirements: any[]
  custom_prompt?: string
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
  status: 'registered' | 'cv_uploaded' | 'questions_answered' | 'completed' | 'rejected'
  score?: number
  parsing_failed?: boolean
  parsing_error?: string
  ai_analysis_failed?: boolean
  rejection_reason?: string
  action_status?: 'none' | 'reviewed' | 'contacted' | 'sent'
  is_favorite?: boolean
  candidate_feedback?: string
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
  question_type: 'open' | 'multiple-choice'
  question_options?: string[]
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