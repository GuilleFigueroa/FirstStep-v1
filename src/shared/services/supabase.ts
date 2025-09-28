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
  status: 'registered' | 'cv_uploaded' | 'questions_answered' | 'completed'
  score?: number
  created_at: string
  updated_at: string
}