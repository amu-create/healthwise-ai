// Pose Analysis API 타입 정의

export interface Exercise {
  id: number;
  name: string;
  name_en?: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  target_muscles: string[];
  key_points: string[];
  instructions?: string[];
  common_mistakes?: string[];
  is_active: boolean;
}

export interface AnalysisSession {
  id: number;
  user?: number;
  guest_id?: string;
  exercise: Exercise;
  mode: 'realtime' | 'upload';
  video_file?: string;
  started_at: string;
  completed_at?: string;
  duration?: number;
  total_frames?: number;
  average_score?: number;
  max_score?: number;
  min_score?: number;
  total_reps?: number;
  feedback_summary?: string[];
  corrections_summary?: string[];
}

export interface AnalysisFrame {
  id: number;
  session: number;
  timestamp: number;
  frame_index: number;
  angles: Record<string, number>;
  scores: Record<string, number>;
  overall_score: number;
  feedback: string[];
  corrections: string[];
  is_in_position: boolean;
}

export interface UserExerciseStats {
  id: number;
  user: number;
  exercise: Exercise;
  total_sessions: number;
  total_duration: number;
  average_score: number;
  best_score: number;
  total_reps: number;
  last_session_date?: string;
  improvement_rate?: number;
}

export interface ExerciseSummary {
  total_exercises: number;
  total_sessions: number;
  total_duration: number;
  total_reps: number;
  average_score: number;
  best_exercise?: {
    name: string;
    score: number;
    sessions: number;
  };
  most_improved?: {
    name: string;
    improvement: number;
    current_score: number;
  };
  recent_sessions: Array<{
    exercise: string;
    date: string;
    score: number;
    duration: number;
  }>;
}
