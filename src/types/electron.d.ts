interface AIGenerateParams {
  prompt: string
  provider: string
  model?: string
  apiKey?: string
  baseUrl?: string
  system?: string
}

interface AIProviderInfo {
  name: string
  label: string
  models: string[]
}

interface ElectronAPI {
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  close: () => Promise<void>
  getResumes: () => Promise<unknown[]>
  getResume: (id: string) => Promise<unknown>
  saveResume: (data: unknown) => Promise<{ id: string; created?: boolean; updated?: boolean }>
  deleteResume: (id: string) => Promise<{ success: boolean }>

  /** Start an AI streaming generation. Returns an async iterable of text chunks. */
  generateStream: (params: AIGenerateParams) => AsyncIterable<string>

  /** List available AI providers and their models. */
  getProviders: () => Promise<AIProviderInfo[]>

  /** Open URL in the default system browser. */
  openExternal: (url: string) => void

  /** Export resume as PDF */
  exportPDF: (data: unknown) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>

  /** Export resume as DOCX (HTML-based, Word-compatible) */
  exportDOCX: (data: unknown) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>

  /** Export resume as plain text */
  exportTXT: (data: unknown) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>

  /** Export resume as standalone HTML */
  exportHTML: (data: unknown) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>

  /** Test AI provider connection via main process (avoids CORS from file://) */
  testConnection: (opts: { provider: string; apiKey: string; model: string }) => Promise<boolean>

  /** List available ATS scanner provider names */
  scanProviders: () => Promise<string[]>

  /** Search jobs on a provider platform by keyword */
  searchJobs: (params: { provider: string; keyword: string }) => Promise<ScannedJobResult[]>

  /** Analyze a job description for keyword extraction and match scoring (runs in main process) */
  analyzeJob: (params: { jobText: string; jobTitle: string }) => Promise<AnalyzeJobResult>
}

/** A job listing result from an ATS provider search */
interface ScannedJobResult {
  title: string
  company: string
  platform: string
  url: string
  matchScore: number
}

/** Result of a job analysis (keyword extraction + match scoring) */
interface AnalyzeJobResult {
  matchScore: {
    overall: number
    skills: number
    experience: number
    education: number
  }
  skillGaps: Array<{
    skill: string
    level: 'missing' | 'weak' | 'strong'
    category?: string
  }>
}

// ── Auto-updater types ──────────────────────────────────────

type UpdateStatusType = 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'

interface UpdateStatusPayload {
  status: UpdateStatusType
  version?: string
  percent?: number
  bytesPerSecond?: number
  transferred?: number
  total?: number
  releaseNotes?: string
  releaseDate?: string
  message?: string
}

interface ElectronAPI {
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  close: () => Promise<void>
  getResumes: () => Promise<unknown[]>
  getResume: (id: string) => Promise<unknown>
  saveResume: (data: unknown) => Promise<{ id: string; created?: boolean; updated?: boolean }>
  deleteResume: (id: string) => Promise<{ success: boolean }>

  /** Start an AI streaming generation. Returns an async iterable of text chunks. */
  generateStream: (params: AIGenerateParams) => AsyncIterable<string>

  /** List available AI providers and their models. */
  getProviders: () => Promise<AIProviderInfo[]>

  /** Open URL in the default system browser. */
  openExternal: (url: string) => void

  /** Export resume as PDF */
  exportPDF: (data: unknown) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>

  /** Export resume as DOCX (HTML-based, Word-compatible) */
  exportDOCX: (data: unknown) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>

  /** Export resume as plain text */
  exportTXT: (data: unknown) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>

  /** Export resume as standalone HTML */
  exportHTML: (data: unknown) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>

  /** Test AI provider connection via main process (avoids CORS from file://) */
  testConnection: (opts: { provider: string; apiKey: string; model: string }) => Promise<boolean>

  /** List available ATS scanner provider names */
  scanProviders: () => Promise<string[]>

  /** Search jobs on a provider platform by keyword */
  searchJobs: (params: { provider: string; keyword: string }) => Promise<ScannedJobResult[]>

  /** Analyze a job description for keyword extraction and match scoring (runs in main process) */
  analyzeJob: (params: { jobText: string; jobTitle: string }) => Promise<AnalyzeJobResult>

  // ── App version ──
  getVersion: () => Promise<string>

  // ── Auto-updater ──
  onUpdateStatus: (callback: (status: UpdateStatusPayload) => void) => () => void
  checkForUpdates: () => Promise<void>
  downloadUpdate: () => Promise<void>
  installUpdate: () => Promise<void>

  // ── Auth ──
  sendCode: (email: string) => Promise<void>
  register: (email: string, code: string, password: string) => Promise<{ id: string; email: string; nickname: string; avatar: string }>
  login: (email: string, password: string) => Promise<{ id: string; email: string; nickname: string; avatar: string }>
  getUser: () => Promise<any>
  isLoggedIn: () => Promise<boolean>
  logout: () => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>

  // ── Dashboard tracking ──
  getTrackingStats: () => Promise<{ atsScore: number | null; deliveryCount: number; interviewCount: number }>
  saveATS: (score: number) => Promise<{ ok: boolean }>
  addDelivery: (data: { company: string; role: string; url?: string }) => Promise<{ id: string }>
  getDeliveries: () => Promise<Array<{ id: string; company: string; role: string; url: string | null; created_at: string }>>
  deleteDelivery: (id: string) => Promise<{ ok: boolean }>
  addInterview: (data: { company: string; role: string; type?: string; note?: string }) => Promise<{ id: string }>
  getInterviews: () => Promise<Array<{ id: string; company: string; role: string; type: string; note: string | null; created_at: string }>>
  deleteInterview: (id: string) => Promise<{ ok: boolean }>
}

interface Window {
  electronAPI: ElectronAPI
}
