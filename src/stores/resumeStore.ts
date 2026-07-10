import { create } from 'zustand'
import type { Resume, ResumeSection, SectionType } from '@/types/resume'

interface ResumeState {
  resumes: Resume[]
  activeResumeId: string | null
  loading: boolean

  fetchResumes: () => Promise<void>
  createResume: (title?: string) => Promise<Resume | null>
  updateResume: (id: string, data: Partial<Resume>) => Promise<void>
  deleteResume: (id: string) => Promise<void>
  setActiveResume: (id: string | null) => void
  addSection: (type: SectionType) => Promise<void>
  removeSection: (sectionId: string) => Promise<void>
  reorderSections: (sectionIds: string[]) => Promise<void>
  updateSectionContent: (sectionId: string, content: Record<string, any>) => Promise<void>
}

const defaultSections: { type: SectionType; label: string }[] = [
  { type: 'personal', label: '个人信息' },
  { type: 'summary', label: '个人简介' },
  { type: 'experience', label: '工作经历' },
  { type: 'education', label: '教育背景' },
  { type: 'skills', label: '专业技能' },
  { type: 'projects', label: '项目/作品经验' },
  { type: 'certifications', label: '证书资质' },
]

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function buildSections(): ResumeSection[] {
  return defaultSections.map((s, i) => ({
    id: genId(), type: s.type, sortOrder: i, content: {}, isVisible: true,
  }))
}

const api = () => window.electronAPI

export const useResumeStore = create<ResumeState>((set, get) => ({
  resumes: [],
  activeResumeId: null,
  loading: false,

  fetchResumes: async () => {
    set({ loading: true })
    try {
      const rows = api() ? await api()!.getResumes() : []
      const resumes: Resume[] = (rows || []).map((row: any) => {
        // DB rows have {id, title, created_at, updated_at, theme, version, data: ResumeJSON}
        // Transform to proper Resume shape using the data field
        if (row.data && typeof row.data === 'object') {
          return { ...row.data } as Resume
        }
        return row as Resume
      })
      set({ resumes, loading: false })
    } catch { set({ loading: false }) }
  },

  createResume: async (title?: string) => {
    const now = new Date().toISOString()
    const resume: Resume = {
      id: genId(), title: title || '未命名简历',
      createdAt: now, updatedAt: now,
      theme: { primary: '#14b8a6', font: 'Noto Sans SC' },
      version: 'general', sections: buildSections(),
    }
    try {
      if (api()) await api()!.saveResume(resume)
      set((s) => ({ resumes: [...s.resumes, resume], activeResumeId: resume.id }))
      return resume
    } catch { return null }
  },

  updateResume: async (id: string, data: Partial<Resume>) => {
    set((s) => ({
      resumes: s.resumes.map((r) =>
        r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
      ),
    }))
    const updated = get().resumes.find((r) => r.id === id)
    if (updated && api()) try { await api()!.saveResume(updated) } catch {}
  },

  deleteResume: async (id: string) => {
    try {
      if (api()) await api()!.deleteResume(id)
      set((s) => ({
        resumes: s.resumes.filter((r) => r.id !== id),
        activeResumeId: s.activeResumeId === id ? null : s.activeResumeId,
      }))
    } catch {}
  },

  setActiveResume: (id) => set({ activeResumeId: id }),

  addSection: async (type: SectionType) => {
    const { activeResumeId } = get()
    if (!activeResumeId) return
    const resume = get().resumes.find((r) => r.id === activeResumeId)
    if (!resume) return
    const maxOrder = resume.sections.reduce((m, s) => Math.max(m, s.sortOrder), -1)
    const ns: ResumeSection = { id: genId(), type, sortOrder: maxOrder + 1, content: {}, isVisible: true }
    set((s) => ({
      resumes: s.resumes.map((r) =>
        r.id === activeResumeId ? { ...r, sections: [...r.sections, ns], updatedAt: new Date().toISOString() } : r
      ),
    }))
    const updated = get().resumes.find((r) => r.id === activeResumeId)
    if (updated && api()) try { await api()!.saveResume(updated) } catch {}
  },

  removeSection: async (sectionId: string) => {
    const { activeResumeId } = get()
    if (!activeResumeId) return
    set((s) => ({
      resumes: s.resumes.map((r) =>
        r.id === activeResumeId
          ? { ...r, sections: r.sections.filter((sec) => sec.id !== sectionId), updatedAt: new Date().toISOString() }
          : r
      ),
    }))
    const updated = get().resumes.find((r) => r.id === activeResumeId)
    if (updated && api()) try { await api()!.saveResume(updated) } catch {}
  },

  reorderSections: async (sectionIds: string[]) => {
    const { activeResumeId } = get()
    if (!activeResumeId) return
    set((s) => ({
      resumes: s.resumes.map((r) => {
        if (r.id !== activeResumeId) return r
        const reordered = sectionIds.map((id, idx) => ({ ...r.sections.find((s) => s.id === id)!, sortOrder: idx }))
        return { ...r, sections: reordered, updatedAt: new Date().toISOString() }
      }),
    }))
    const updated = get().resumes.find((r) => r.id === activeResumeId)
    if (updated && api()) try { await api()!.saveResume(updated) } catch {}
  },

  updateSectionContent: async (sectionId: string, content: Record<string, any>) => {
    const { activeResumeId } = get()
    if (!activeResumeId) return
    set((s) => ({
      resumes: s.resumes.map((r) => {
        if (r.id !== activeResumeId) return r
        return {
          ...r,
          sections: r.sections.map((sec) =>
            sec.id === sectionId ? { ...sec, content: { ...sec.content, ...content } } : sec
          ),
          updatedAt: new Date().toISOString(),
        }
      }),
    }))
    const updated = get().resumes.find((r) => r.id === activeResumeId)
    if (updated && api()) try { await api()!.saveResume(updated) } catch {}
  },
}))
