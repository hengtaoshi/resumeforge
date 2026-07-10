export type SectionType =
  | 'personal'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'

export type ResumeVersion = 'general' | 'big' | 'mid' | 'small'

export interface ResumeSection {
  id: string
  type: SectionType
  sortOrder: number
  content: Record<string, any>
  isVisible: boolean
}

export interface Resume {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  theme: { primary: string; font: string }
  version: ResumeVersion
  template?: string
  language?: string
  sections: ResumeSection[]
}
