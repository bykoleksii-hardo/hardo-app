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

// ---- profile / scorecard surfaces ----

export interface UserProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  date_of_birth: string | null;
  country: string | null;
  city: string | null;
  university: string | null;
  major: string | null;
  graduation_year: number | null;
  current_position: string | null;
  target_start_date: string | null;
  cv_summary: string | null;
  bio: string | null;
  use_in_persona: boolean;
  created_at: string;
  updated_at: string;
}

export type HireRecommendation =
  | "no_hire"
  | "leaning_no_hire"
  | "leaning_hire"
  | "hire"
  | string;

export interface InterviewSummaryRow {
  interview_id: string;
  overall_score: number | null;
  hire_recommendation: HireRecommendation | null;
  strengths: string[] | null;
  improvements: string[] | null;
  rationale: string | null;
  created_at: string | null;
}

export interface InterviewHistoryItem {
  id: string;
  candidate_level: CandidateLevel;
  input_mode: string | null;
  status: InterviewStatus;
  started_at: string;
  finished_at: string | null;
  overall_score: number | null;
  hire_recommendation: HireRecommendation | null;
  letter_grade: string | null;
}

export type InterviewPhase =
  | "accounting"
  | "valuation"
  | "corp_finance"
  | "ma"
  | "lbo"
  | "behavioral"
  | "case_study"
  | string;
