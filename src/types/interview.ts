/** Interviewer configuration — defines an AI interviewer's persona and behavior */
export interface InterviewerConfig {
  type: string
  name: string
  title: string
  avatar: string
  bio: string
  style: string
  focusAreas: string[]
  personality: string
  systemPrompt: string
}

/** Status of a single interview round */
export type InterviewRoundStatus = 'pending' | 'active' | 'completed' | 'skipped'

/** Status of the entire interview session */
export type InterviewSessionStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled'
