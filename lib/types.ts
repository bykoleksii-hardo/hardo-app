// Generated/manual types matching the Supabase schema for Hardo

export type CandidateLevel = "intern" | "analyst" | "associate" | "any";
export type InterviewStatus =
  | "pending"
  | "active"
  | "completed"
  | "abandoned";

export interface User {
  id: string;
  email: string | null;
  nickname: string | null;
  candidate_level: CandidateLevel | null;
  created_at: string;
}

export interface Question {
  id: string;
  category: string;
  difficulty: string;
  prompt: string;
  parent_id: string | null;
  candidate_level: CandidateLevel;
  expected_answer: string | null;
  created_at: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  candidate_level: CandidateLevel;
  scenario: string;
  total_time_seconds: number;
  created_at: string;
}

export interface CaseStudyStep {
  id: string;
  case_id: string;
  step_order: number;
  prompt: string;
  expected_concepts: string[];
  time_seconds: number;
}

export interface Interview {
  id: string;
  user_id: string;
  level: CandidateLevel;
  status: InterviewStatus;
  total_tokens: number | null;
  started_at: string;
  completed_at: string | null;
}
