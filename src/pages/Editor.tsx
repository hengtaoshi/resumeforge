import React, { useState, useMemo, useCallback, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useResumeStore } from '@/stores/resumeStore'
import type { SectionType, ResumeSection, Resume } from '@/types/resume'
import { askAI, isAIConfigured } from '@/lib/ai/stream'
import { buildGrammarCheckPrompt, buildTranslationPrompt } from '@/lib/ai/prompts'
import type { GrammarCheckResult } from '@/lib/ai/prompts'
import { extractJSON } from '@/lib/ai/provider'
import toast from '@/lib/toast'
import ResumePreview from '@/components/editor/ResumePreview'
import ImportReviewModal, { type ParsedResumeData } from '@/components/editor/ImportReviewModal'

// ─── Inline SVG Trash Icon ──────────────────────────────────────────────────

const TrashIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
)

// ─── Constants ──────────────────────────────────────────────────────────────

const SECTION_ICONS: Record<SectionType, string> = {
  personal: 'ph-user',
  summary: 'ph-file-text',
  experience: 'ph-briefcase',
  education: 'ph-book-open',
  skills: 'ph-lightning',
  projects: 'ph-folder-open',
  certifications: 'ph-certificate',
}

const SECTION_LABELS: Record<SectionType, string> = {
  personal: '个人信息',
  summary: '个人简介',
  experience: '工作经历',
  education: '教育背景',
  skills: '专业技能',
  projects: '项目/作品经验',
  certifications: '证书资质',
}

const SECTION_BG_COLORS: Record<SectionType, string> = {
  personal: 'bg-blue-50',
  summary: 'bg-green-50',
  experience: 'bg-purple-50',
  education: 'bg-yellow-50',
  skills: 'bg-pink-50',
  projects: 'bg-indigo-50',
  certifications: 'bg-orange-50',
}

const COLOR_SWATCHES = [
  '#14b8a6', '#0ea5e9', '#6366f1', '#a855f7',
  '#ec4899', '#f43f5e', '#f97316', '#eab308',
  '#22c55e', '#06b6d4', '#8b5cf6', '#64748b',
]

const FONT_OPTIONS = [
  { value: 'Noto Sans SC', label: 'Noto Sans SC' },
  { value: 'Source Han Sans', label: '思源黑体' },
  { value: 'Noto Serif SC', label: 'Noto Serif SC' },
  { value: 'Source Han Serif', label: '思源宋体' },
]

const VERSION_OPTIONS: { value: string; label: string }[] = [
  { value: 'general', label: '通用版' },
  { value: 'big', label: '大厂版' },
  { value: 'mid', label: '中厂版' },
  { value: 'small', label: '小厂版' },
]

const ADDABLE_SECTIONS: { type: SectionType; label: string }[] = [
  { type: 'personal', label: '个人信息' },
  { type: 'summary', label: '个人简介' },
  { type: 'experience', label: '工作经历' },
  { type: 'education', label: '教育背景' },
  { type: 'skills', label: '专业技能' },
  { type: 'projects', label: '项目/作品经验' },
  { type: 'certifications', label: '证书资质' },
]

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const clone = [...arr]
  const [removed] = clone.splice(from, 1)
  clone.splice(to, 0, removed)
  return clone
}

// ─── SortableSectionItem ────────────────────────────────────────────────────

interface SortableSectionItemProps {
  section: ResumeSection
  deleteMode: boolean
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onToggleVisibility: (sectionId: string) => void
}

const SortableSectionItem = ({
  section,
  deleteMode,
  isSelected,
  onToggleSelect,
  onToggleVisibility,
}: SortableSectionItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-default transition-colors ${
        deleteMode && isSelected
          ? 'bg-red-50 ring-1 ring-red-200'
          : isDragging
            ? 'bg-gray-100 shadow-md'
            : 'hover:bg-gray-50'
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
      >
        <i className="ph-light ph-list text-base"></i>
      </button>

      {/* Delete mode checkbox */}
      {deleteMode && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(section.id)}
          className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-400"
        />
      )}

      {/* Section icon */}
      <i className={`ph-light ${SECTION_ICONS[section.type]} text-base text-gray-500`}></i>

      {/* Section name */}
      <span className="flex-1 text-sm text-gray-700 truncate">
        {SECTION_LABELS[section.type]}
      </span>

      {/* Visibility eye toggle */}
      <button
        onClick={() => onToggleVisibility(section.id)}
        className={`p-1 rounded hover:bg-gray-200 ${
          section.isVisible ? 'text-gray-500' : 'text-gray-300'
        }`}
        title={section.isVisible ? '隐藏' : '显示'}
      >
        <i
          className={`ph-light text-base ${
            section.isVisible ? 'ph-eye' : 'ph-eye-slash'
          }`}
        ></i>
      </button>
    </div>
  )
}

// ─── Section Renderers ──────────────────────────────────────────────────────

interface RendererProps {
  section: ResumeSection
  onUpdate: (sectionId: string, content: Record<string, any>) => void
}

/* ---------- Personal ---------- */

const PersonalRenderer = ({ section, onUpdate }: RendererProps) => {
  const c = section.content
  const set = (key: string, value: string) => onUpdate(section.id, { [key]: value })

  const fields: { key: string; label: string; placeholder: string; colSpan?: boolean }[] = [
    { key: 'name', label: '姓名', placeholder: '请输入姓名' },
    { key: 'title', label: '求职意向', placeholder: '例如：高级前端工程师' },
    { key: 'email', label: '邮箱', placeholder: 'email@example.com' },
    { key: 'phone', label: '电话', placeholder: '138-0000-0000' },
    { key: 'location', label: '地址', placeholder: '城市 / 地址', colSpan: true },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {fields.map((f) => (
        <div key={f.key} className={f.colSpan ? 'col-span-2' : ''}>
          <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            value={c[f.key] || ''}
            onChange={(e) => set(f.key, e.target.value)}
            placeholder={f.placeholder}
          />
        </div>
      ))}
    </div>
  )
}

/* ---------- Summary ---------- */

const SummaryRenderer = ({ section, onUpdate }: RendererProps) => (
  <div>
    <textarea
      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 min-h-[100px] resize-y"
      value={section.content.summary ?? section.content.text ?? ''}
      onChange={(e) => onUpdate(section.id, { summary: e.target.value })}
      placeholder="请输入个人简介..."
    />
  </div>
)

/* ---------- Experience ---------- */

const ExperienceRenderer = ({ section, onUpdate }: RendererProps) => {
  const items: any[] = section.content.items || []

  const addItem = () => {
    onUpdate(section.id, {
      items: [...items, { company: '', role: '', startDate: '', endDate: '', description: '' }],
    })
  }

  const removeItem = (idx: number) => {
    onUpdate(section.id, { items: items.filter((_, i) => i !== idx) })
  }

  const updateItem = (idx: number, key: string, value: string) => {
    const updated = items.map((item: any, i: number) =>
      i === idx ? { ...item, [key]: value } : item
    )
    onUpdate(section.id, { items: updated })
  }

  return (
    <div className="space-y-4">
      {items.map((item: any, idx: number) => (
        <div key={idx} className="relative border rounded-lg pt-6 p-3 space-y-2">
          <button
            onClick={() => removeItem(idx)}
            className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="删除此项"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="grid grid-cols-2 gap-2">
            <input
              className="border rounded px-2 py-1.5 text-sm"
              value={item.company || ''}
              onChange={(e) => updateItem(idx, 'company', e.target.value)}
              placeholder="公司名称"
            />
            <input
              className="border rounded px-2 py-1.5 text-sm"
              value={item.role || ''}
              onChange={(e) => updateItem(idx, 'role', e.target.value)}
              placeholder="职位"
            />
            <div>
              <label className="block text-xs text-gray-400 mb-1">开始时间</label>
              <input
                type="date"
                className="w-full border rounded px-2 py-1.5 text-sm"
                value={item.startDate || ''}
                onChange={(e) => updateItem(idx, 'startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">结束时间</label>
              <input
                type="date"
                className="w-full border rounded px-2 py-1.5 text-sm"
                value={item.endDate || ''}
                onChange={(e) => updateItem(idx, 'endDate', e.target.value)}
              />
            </div>
          </div>
          <textarea
            className="w-full border rounded px-2 py-1.5 text-sm min-h-[60px] resize-y"
            value={item.description || ''}
            onChange={(e) => updateItem(idx, 'description', e.target.value)}
            placeholder="工作描述，每行一条"
          />
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
      >
        <i className="ph-light ph-plus text-base"></i> 添加工作经历
      </button>
    </div>
  )
}

/* ---------- Education ---------- */

const EducationRenderer = ({ section, onUpdate }: RendererProps) => {
  // Normalize: AI guided generation may output flat fields instead of items array
  let items: any[] = section.content.items || []
  if (items.length === 0 && (section.content.school || section.content.degree || section.content.major)) {
    items = [section.content]
  }

  const addItem = () => {
    onUpdate(section.id, {
      items: [...items, { school: '', degree: '', major: '', startDate: '', endDate: '' }],
    })
  }

  const removeItem = (idx: number) => {
    onUpdate(section.id, { items: items.filter((_, i) => i !== idx) })
  }

  const updateItem = (idx: number, key: string, value: string) => {
    const updated = items.map((item: any, i: number) =>
      i === idx ? { ...item, [key]: value } : item
    )
    onUpdate(section.id, { items: updated })
  }

  return (
    <div className="space-y-4">
      {items.map((item: any, idx: number) => (
        <div key={idx} className="relative border rounded-lg pt-6 p-3 space-y-2">
          <button
            onClick={() => removeItem(idx)}
            className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="删除此项"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="grid grid-cols-2 gap-2">
            <input
              className="border rounded px-2 py-1.5 text-sm"
              value={item.school || ''}
              onChange={(e) => updateItem(idx, 'school', e.target.value)}
              placeholder="学校名称"
            />
            <select
              value={item.degree || ''}
              onChange={(e) => updateItem(idx, 'degree', e.target.value)}
              className="border rounded px-2 py-1.5 text-sm bg-white"
            >
              <option value="">选择学历</option>
              <option value="博士">博士</option>
              <option value="硕士">硕士</option>
              <option value="本科">本科</option>
              <option value="大专">大专</option>
              <option value="高中">高中</option>
            </select>
          </div>
          <input
            className="w-full border rounded px-2 py-1.5 text-sm"
            value={item.major || ''}
            onChange={(e) => updateItem(idx, 'major', e.target.value)}
            placeholder="专业"
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">开始时间</label>
              <input
                type="date"
                className="w-full border rounded px-2 py-1.5 text-sm"
                value={item.startDate || ''}
                onChange={(e) => updateItem(idx, 'startDate', e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">结束时间</label>
              <input
                type="date"
                className="w-full border rounded px-2 py-1.5 text-sm"
                value={item.endDate || ''}
                onChange={(e) => updateItem(idx, 'endDate', e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
      >
        <i className="ph-light ph-plus text-base"></i> 添加教育经历
      </button>
    </div>
  )
}

/* ---------- Skills ---------- */

const SkillsRenderer = ({ section, onUpdate }: RendererProps) => {
  const skills: string[] = section.content.skills || []
  const [inputVal, setInputVal] = useState('')

  const addSkill = () => {
    const trimmed = inputVal.trim()
    if (!trimmed || skills.includes(trimmed)) return
    onUpdate(section.id, { skills: [...skills, trimmed] })
    setInputVal('')
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addSkill()
            }
          }}
          placeholder="输入技能后回车添加"
        />
        <button
          onClick={addSkill}
          className="px-3 py-2 bg-teal-500 text-white rounded-lg text-sm hover:bg-teal-600"
        >
          添加
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill: string, idx: number) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm"
          >
            {skill}
            <button
              onClick={() =>
                onUpdate(section.id, { skills: skills.filter((_, i) => i !== idx) })
              }
              className="hover:text-red-500"
            >
              <i className="ph-light ph-x text-sm"></i>
            </button>
          </span>
        ))}
      </div>
      {skills.length === 0 && (
        <p className="text-xs text-gray-400 mt-1">暂无技能，请输入并添加</p>
      )}
    </div>
  )
}

/* ---------- Projects ---------- */

const ProjectsRenderer = ({ section, onUpdate }: RendererProps) => {
  const items: any[] = section.content.items || []

  const addItem = () => {
    onUpdate(section.id, {
      items: [...items, { name: '', role: '', tech: '', description: '', link: '' }],
    })
  }

  const removeItem = (idx: number) => {
    onUpdate(section.id, { items: items.filter((_, i) => i !== idx) })
  }

  const updateItem = (idx: number, key: string, value: string) => {
    const updated = items.map((item: any, i: number) =>
      i === idx ? { ...item, [key]: value } : item
    )
    onUpdate(section.id, { items: updated })
  }

  return (
    <div className="space-y-4">
      {items.map((item: any, idx: number) => (
        <div key={idx} className="relative border rounded-lg pt-6 p-3 space-y-2">
          <button
            onClick={() => removeItem(idx)}
            className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="删除此项"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="grid grid-cols-2 gap-2">
            <input
              className="border rounded px-2 py-1.5 text-sm"
              value={item.name || ''}
              onChange={(e) => updateItem(idx, 'name', e.target.value)}
              placeholder="项目名称"
            />
            <input
              className="border rounded px-2 py-1.5 text-sm"
              value={item.role || ''}
              onChange={(e) => updateItem(idx, 'role', e.target.value)}
              placeholder="担任角色"
            />
            <input
              className="border rounded px-2 py-1.5 text-sm"
              value={item.tech || ''}
              onChange={(e) => updateItem(idx, 'tech', e.target.value)}
              placeholder="使用技术"
            />
            <input
              className="border rounded px-2 py-1.5 text-sm"
              value={item.link || ''}
              onChange={(e) => updateItem(idx, 'link', e.target.value)}
              placeholder="项目链接"
            />
          </div>
          <textarea
            className="w-full border rounded px-2 py-1.5 text-sm min-h-[60px] resize-y"
            value={item.description || ''}
            onChange={(e) => updateItem(idx, 'description', e.target.value)}
            placeholder="项目描述"
          />
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
      >
        <i className="ph-light ph-plus text-base"></i> 添加项目
      </button>
    </div>
  )
}

/* ---------- Certifications ---------- */

const CertificationsRenderer = ({ section, onUpdate }: RendererProps) => {
  const items: any[] = section.content.items || []

  const addItem = () => {
    onUpdate(section.id, {
      items: [...items, { name: '', issuer: '', date: '' }],
    })
  }

  const removeItem = (idx: number) => {
    onUpdate(section.id, { items: items.filter((_, i) => i !== idx) })
  }

  const updateItem = (idx: number, key: string, value: string) => {
    const updated = items.map((item: any, i: number) =>
      i === idx ? { ...item, [key]: value } : item
    )
    onUpdate(section.id, { items: updated })
  }

  return (
    <div className="space-y-3">
      {items.map((item: any, idx: number) => (
        <div key={idx} className="relative border rounded-lg pt-6 p-3 space-y-2">
          <button
            onClick={() => removeItem(idx)}
            className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="删除此项"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="grid grid-cols-2 gap-2">
            <input
              className="border rounded px-2 py-1.5 text-sm"
              value={item.name || ''}
              onChange={(e) => updateItem(idx, 'name', e.target.value)}
              placeholder="证书名称"
            />
            <input
              className="border rounded px-2 py-1.5 text-sm"
              value={item.issuer || ''}
              onChange={(e) => updateItem(idx, 'issuer', e.target.value)}
              placeholder="颁发机构"
            />
            <input
              type="date"
              className="border rounded px-2 py-1.5 text-sm"
              value={item.date || ''}
              onChange={(e) => updateItem(idx, 'date', e.target.value)}
            />
          </div>
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
      >
        <i className="ph-light ph-plus text-base"></i> 添加证书
      </button>
    </div>
  )
}

// ─── SectionContentEditor ───────────────────────────────────────────────────

const SectionContentEditor = ({ section, onUpdate }: RendererProps) => {
  switch (section.type) {
    case 'personal':
      return <PersonalRenderer section={section} onUpdate={onUpdate} />
    case 'summary':
      return <SummaryRenderer section={section} onUpdate={onUpdate} />
    case 'experience':
      return <ExperienceRenderer section={section} onUpdate={onUpdate} />
    case 'education':
      return <EducationRenderer section={section} onUpdate={onUpdate} />
    case 'skills':
      return <SkillsRenderer section={section} onUpdate={onUpdate} />
    case 'projects':
      return <ProjectsRenderer section={section} onUpdate={onUpdate} />
    case 'certifications':
      return <CertificationsRenderer section={section} onUpdate={onUpdate} />
    default:
      return null
  }
}

// ─── EmptyState ─────────────────────────────────────────────────────────────

const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="flex flex-col items-center justify-center h-full text-gray-400">
    <i className="ph-light ph-file-text text-6xl mb-4"></i>
    <p className="text-lg mb-4">还没有选择简历</p>
    <button
      onClick={onCreate}
      className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
    >
      创建新简历
    </button>
  </div>
)

// ─── Editor (main export) ───────────────────────────────────────────────────

const Editor = () => {
  // ── Zustand store ──
  const resumes = useResumeStore((s) => s.resumes)
  const activeResumeId = useResumeStore((s) => s.activeResumeId)
  const fetchResumes = useResumeStore((s) => s.fetchResumes)
  const createResume = useResumeStore((s) => s.createResume)
  const updateResume = useResumeStore((s) => s.updateResume)
  const deleteResume = useResumeStore((s) => s.deleteResume)
  const setActiveResume = useResumeStore((s) => s.setActiveResume)
  const addSection = useResumeStore((s) => s.addSection)
  const removeSection = useResumeStore((s) => s.removeSection)
  const reorderSections = useResumeStore((s) => s.reorderSections)
  const updateSectionContent = useResumeStore((s) => s.updateSectionContent)

  const activeResume = useMemo(() => {
    if (!activeResumeId) return null
    return resumes.find((r) => r.id === activeResumeId) ?? null
  }, [resumes, activeResumeId])

  // ── Local UI state ──
  const [deleteMode, setDeleteMode] = useState(false)
  const [selectedForDelete, setSelectedForDelete] = useState<string[]>([])
  const [resumeDeleteMode, setResumeDeleteMode] = useState(false)
  const [selectedResumes, setSelectedResumes] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [showAddDropdown, setShowAddDropdown] = useState(false)
  const [grammarLoading, setGrammarLoading] = useState(false)
  const [grammarResult, setGrammarResult] = useState<GrammarCheckResult | null>(null)
  const [grammarModalOpen, setGrammarModalOpen] = useState(false)
  const [translationLang, setTranslationLang] = useState('en')
  const [translationLoading, setTranslationLoading] = useState(false)
  const [translationResult, setTranslationResult] = useState<string | null>(null)
  const [showTranslationResult, setShowTranslationResult] = useState(false)
  const [rightPanelMode, setRightPanelMode] = useState<'properties' | 'preview'>('properties')
  const [importReviewData, setImportReviewData] = useState<ParsedResumeData | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importStatus, setImportStatus] = useState('')
  const [importText, setImportText] = useState('')
  const [showTextImport, setShowTextImport] = useState(false)

  // ── DnD sensors ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // ── Effects ──
  useEffect(() => {
    fetchResumes()
  }, [fetchResumes])

  // Clear delete state when switching to edit mode
  useEffect(() => {
    if (activeResume) {
      setShowDeleteConfirm(false)
      setPendingDeleteId(null)
    }
  }, [!!activeResume])

  // ── Drag end handler ──
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id || !activeResume) return
      const ids = activeResume.sections.map((s) => s.id)
      const oldIndex = ids.indexOf(active.id as string)
      const newIndex = ids.indexOf(over.id as string)
      if (oldIndex === -1 || newIndex === -1) return
      reorderSections(arrayMove(ids, oldIndex, newIndex))
    },
    [activeResume, reorderSections],
  )

  // ── Toggle section visibility ──
  const handleToggleVisibility = useCallback(
    (sectionId: string) => {
      if (!activeResume) return
      updateResume(activeResume.id, {
        sections: activeResume.sections.map((s) =>
          s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s,
        ),
      })
    },
    [activeResume, updateResume],
  )

  // ── Section delete flow ──
  const toggleSelectForDelete = useCallback((sectionId: string) => {
    setSelectedForDelete((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId],
    )
  }, [])

  const handleDeleteSelected = useCallback(() => {
    if (selectedForDelete.length > 0) setShowDeleteConfirm(true)
  }, [selectedForDelete])

  const confirmDelete = useCallback(() => {
    if (pendingDeleteId === 'batch') {
      for (const id of selectedResumes) deleteResume(id)
      toast.success(`已删除 ${selectedResumes.length} 份简历`)
      setSelectedResumes([])
      setResumeDeleteMode(false)
    } else if (pendingDeleteId) {
      deleteResume(pendingDeleteId)
      toast.success('简历已删除')
      setPendingDeleteId(null)
    } else {
      for (const id of selectedForDelete) removeSection(id)
    }
    setSelectedForDelete([])
    setDeleteMode(false)
    setShowDeleteConfirm(false)
  }, [selectedForDelete, removeSection, pendingDeleteId, deleteResume, selectedResumes])

  // ── Grammar check ──
  const handleGrammarCheck = useCallback(async () => {
    if (!activeResume) return
    if (!isAIConfigured()) {
      toast.warning('请先在设置中配置 AI 服务')
      return
    }

    const texts: string[] = []
    for (const section of activeResume.sections) {
      if (!section.isVisible) continue
      for (const [, value] of Object.entries(section.content)) {
        if (typeof value === 'string' && value.trim()) {
          texts.push(value)
        } else if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === 'object') {
              for (const v of Object.values(item)) {
                if (v) texts.push(String(v))
              }
            }
          }
        }
      }
    }

    if (texts.length === 0) {
      toast.warning('没有可检查的内容')
      return
    }

    setGrammarLoading(true)
    try {
      const prompt = buildGrammarCheckPrompt(texts.join('\n'))
      const result = await askAI([
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ])
      const parsed = extractJSON<GrammarCheckResult>(result)
      if (parsed) {
        setGrammarResult(parsed)
        setGrammarModalOpen(true)
      } else {
        toast.error('解析检查结果失败')
      }
    } catch (err) {
      toast.error(
        '语法检查失败: ' + (err instanceof Error ? err.message : String(err)),
      )
    } finally {
      setGrammarLoading(false)
    }
  }, [activeResume])

  // ── Import Resume ──
  const handleImportResume = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!isAIConfigured()) { toast.warning('请先在设置中配置 AI 服务'); return }
    if (file.size > 5 * 1024 * 1024) { toast.warning('文件过大，请选择小于 5MB 的文件'); return }
    const ext = file.name.split('.').pop()?.toLowerCase()
    const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!['txt', 'docx', 'pdf'].includes(ext || '') && !allowedTypes.includes(file.type)) {
      toast.warning('仅支持 .txt、.docx、.pdf 格式'); return
    }

    setImportLoading(true)
    setImportStatus('正在提取文件文本...')

    const extractText = async (f: File): Promise<string> => {
      const ext = f.name.split('.').pop()?.toLowerCase()
      if (ext === 'pdf') {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
        const buf = await f.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise
        const pages: string[] = []
        const maxPages = Math.min(pdf.numPages, 20)
        for (let i = 1; i <= maxPages; i++) {
          try {
            const page = await pdf.getPage(i)
            const tc = await page.getTextContent()
            pages.push(tc.items.map((item: any) => item.str).join(' '))
          } catch { pages.push('') }
        }
        return pages.filter(Boolean).join('\n')
      }
      return new Promise(r => { const rd = new FileReader(); rd.onload = () => r(rd.result as string); rd.readAsText(f) })
    }

    let text: string
    try {
      text = await Promise.race([
        extractText(file),
        new Promise<string>((_, rej) => setTimeout(() => rej(new Error('timeout')), 15000)),
      ])
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setImportLoading(false); setImportStatus('')
      setImportText('')
      setShowTextImport(true)
      toast.warning(msg.includes('timeout')
        ? 'PDF 提取超时（15s），请手动粘贴简历文本'
        : 'PDF 提取失败: ' + msg + '，可手动粘贴文本')
      e.target.value = ''; return
    }
    if (!text.trim()) {
      setImportLoading(false); setImportStatus('')
      setImportText('')
      setShowTextImport(true)
      toast.warning('PDF 未提取到文本（可能为扫描件/图片），请手动粘贴')
      e.target.value = ''; return
    }
    setImportLoading(false)
    setImportStatus('')
    setImportText(text)
    setShowTextImport(true)
    e.target.value = ''
  }, [createResume, updateResume, isAIConfigured])

  // ── Parse imported text with AI ──
  const handleParseText = useCallback(async () => {
    if (!isAIConfigured()) { toast.warning('请先在设置中配置 AI 服务'); return }
    const text = importText.trim()
    if (!text) { toast.warning('没有可解析的文本'); return }
    setImportLoading(true)
    setImportStatus('正在调用 AI 解析...')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)
    try {
      const res = await askAI([
        { role: 'system', content: `你是一位简历解析专家。从以下文本中提取简历信息，返回纯 JSON（不要 markdown）：

{
  "title": "简历标题",
  "personal": {"name":"","title":"","email":"","phone":"","location":""},
  "summary": {"text":""},
  "experience": {"items":[{"company":"","role":"","startDate":"","endDate":"","description":""}]},
  "education": {"items":[{"school":"","degree":"","major":"","startDate":"","endDate":""}]},
  "skills": {"skills":[]},
  "projects": {"items":[{"name":"","role":"","tech":"","description":""}]},
  "certifications": {"items":[{"name":"","issuer":"","date":""}]}
}

没有的字段填空数组或空字符串。` },
        { role: 'user', content: text.slice(0, 30000) },
      ], controller.signal)
      clearTimeout(timeoutId)
      const parsed = extractJSON<any>(res)
      if (!parsed) { setImportLoading(false); setImportStatus(''); toast.error('AI 解析失败，请重试'); return }
      setShowTextImport(false)
      setImportReviewData({
        title: parsed.title || '导入的简历',
        personal: parsed.personal || {},
        summary: { text: parsed.summary?.text || parsed.summary?.summary || '' },
        experience: { items: parsed.experience?.items || [] },
        education: { items: parsed.education?.items || [] },
        skills: { skills: parsed.skills?.skills || [] },
        projects: { items: parsed.projects?.items || [] },
        certifications: { items: parsed.certifications?.items || [] },
      })
    } catch (err) {
      clearTimeout(timeoutId)
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('abort') || msg.includes('timeout')) {
        toast.error('解析超时（超过 60 秒），请检查网络或换用更快的模型')
      } else {
        toast.error('解析失败: ' + msg)
      }
    }
    setImportLoading(false)
    setImportStatus('')
  }, [importText])

  // ── Import review confirm ──
  const handleImportConfirm = useCallback(async (data: ParsedResumeData) => {
    setImportReviewData(null)
    const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const sectionData: [string, Record<string, any>][] = [
      ['personal', data.personal],
      ['summary', { summary: data.summary.text }],
      ['experience', data.experience],
      ['education', data.education],
      ['skills', data.skills],
      ['projects', data.projects],
      ['certifications', data.certifications],
    ]
    const resume = await createResume(data.title || '导入的简历')
    if (resume) {
      await updateResume(resume.id, {
        sections: sectionData.map(([type, content], i) => ({
          id: genId(), type: type as any, sortOrder: i, content, isVisible: true,
        })),
      })
      toast.success('简历导入成功')
    }
  }, [createResume, updateResume])

  // ── Translation ──
  const handleTranslate = useCallback(async () => {
    if (!activeResume) return
    if (!isAIConfigured()) {
      toast.warning('请先在设置中配置 AI 服务')
      return
    }

    setTranslationLoading(true)
    try {
      const prompt = buildTranslationPrompt(
        {
          sections: activeResume.sections.map((s) => ({
            type: s.type,
            content: s.content,
          })),
        },
        translationLang,
      )
      const result = await askAI([
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ])
      setTranslationResult(result)
      setShowTranslationResult(true)
    } catch (err) {
      toast.error(
        '翻译失败: ' + (err instanceof Error ? err.message : String(err)),
      )
    } finally {
      setTranslationLoading(false)
    }
  }, [activeResume, translationLang])

  // ── Export handlers ──
  const handleExport = useCallback(
    async (format: string) => {
      if (!activeResume || !window.electronAPI) {
        toast.warning('导出功能仅在桌面客户端可用')
        return
      }
      const key = `export${format}` as keyof typeof window.electronAPI
      const fn = window.electronAPI[key]
      if (typeof fn !== 'function') return
      try {
        const result = await (fn as (data: unknown) => Promise<any>)(activeResume)
        if (result.success) toast.success(`导出 ${format} 成功`)
        else if (result.error) toast.error(result.error)
      } catch (err) {
        toast.error(`导出 ${format} 失败: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
    [activeResume],
  )

  // ==========================================================================
  // Render: No active resume → sidebar list + EmptyState
  // ==========================================================================
  if (!activeResume) {
    return (
      <div className="flex h-full">
        {/* Resume list sidebar */}
        <div className="w-64 min-w-[256px] border-r bg-gray-50 flex flex-col">
          <div className="p-4 border-b bg-white flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">我的简历</h2>
            <div className="flex items-center gap-1">
              <label className="cursor-pointer flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors" title="导入简历文件">
                <input type="file" accept=".txt,.docx,.pdf" className="hidden" onChange={handleImportResume} />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                导入
              </label>
              <button onClick={() => { setImportText(''); setShowTextImport(true); }} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors" title="粘贴文本导入">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/></svg>
                粘贴
              </button>
              {resumes.length > 0 && (
                <button onClick={() => { setResumeDeleteMode(!resumeDeleteMode); setSelectedResumes([]) }}
                  className={`text-xs px-2 py-1 rounded transition-colors ${resumeDeleteMode ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-gray-600'}`}>
                  {resumeDeleteMode ? '完成' : '批量删除'}
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {resumes.map((r) => (
              <div key={r.id}
                onClick={() => { if (!resumeDeleteMode) setActiveResume(r.id) }}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all group ${resumeDeleteMode ? (selectedResumes.includes(r.id) ? 'bg-red-50' : 'hover:bg-gray-100') : 'hover:bg-white hover:shadow-sm'}`}
              >
                {resumeDeleteMode ? (
                  <input type="checkbox" checked={selectedResumes.includes(r.id)}
                    onChange={() => setSelectedResumes(prev => prev.includes(r.id) ? prev.filter(id => id !== r.id) : [...prev, r.id])}
                    className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-400" />
                ) : (
                  <i className="ph-light ph-file-text text-base text-teal-500"></i>
                )}
                <span className="flex-1 text-sm text-gray-700 truncate">{r.title}</span>
                {!resumeDeleteMode && (
                  <button onClick={(e) => { e.stopPropagation(); setPendingDeleteId(r.id); setShowDeleteConfirm(true) }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all">
                    <i className="ph-light ph-trash text-sm"></i>
                  </button>
                )}
              </div>
            ))}
            {resumes.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-8">暂无简历</p>
            )}
          </div>
          {resumeDeleteMode && selectedResumes.length > 0 && (
            <div className="p-3 border-t">
              <button onClick={() => { setPendingDeleteId('batch'); setShowDeleteConfirm(true) }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                删除选中 ({selectedResumes.length})
              </button>
            </div>
          )}
        </div>

        {/* Empty state */}
        <div className="flex-1">
          <EmptyState
            onCreate={async () => {
              const r = await createResume()
              if (r) toast.success('已创建新简历')
            }}
          />
        </div>

        {/* ─── Delete Confirm Modal ─── */}
        {showDeleteConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div
              className="bg-white rounded-xl p-6 w-80 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <i className="ph-light ph-warning-circle text-xl text-red-500"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">确认删除</h3>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                {pendingDeleteId === 'batch' ? `确定要删除选中的 ${selectedResumes.length} 份简历吗？` : pendingDeleteId ? '确定要删除这份简历吗？' : `确定要删除以下 ${selectedForDelete.length} 个版块吗？`}
              </p>
              <p className="text-xs text-gray-400 mb-4">
                此操作不可撤销。
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Import Loading Overlay ─── */}
        {importLoading && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-8 flex flex-col items-center gap-4">
              <svg className="animate-spin h-8 w-8 text-teal-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-slate-600">{importStatus || '正在解析...'}</p>
            </div>
          </div>
        )}

        {/* ─── Text Import Modal ─── */}
        {showTextImport && !importLoading && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-[640px] max-w-[90vw] max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="font-semibold text-slate-800">导入简历文本</h3>
                <button onClick={() => setShowTextImport(false)} className="text-slate-400 hover:text-slate-600">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="flex-1 p-6 overflow-auto">
                <p className="text-xs text-slate-500 mb-3">请确认提取的文本无误，也可直接粘贴完整简历文本，然后点击 "AI 解析"。</p>
                <textarea
                  className="w-full h-[300px] border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-teal-300"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="在此粘贴简历文本..."
                />
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50 rounded-b-xl">
                <button onClick={() => setShowTextImport(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">取消</button>
                <button onClick={handleParseText} disabled={!importText.trim()} className="px-5 py-2 text-sm font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  AI 解析
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Import Review Modal ─── */}
        {importReviewData && (
          <ImportReviewModal
            data={importReviewData}
            onConfirm={handleImportConfirm}
            onCancel={() => setImportReviewData(null)}
          />
        )}
      </div>
    )
  }

  // ==========================================================================
  // Render: Active resume → three-column editor layout
  // ==========================================================================

  const sortedSections = [...activeResume.sections].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  )

  return (
    <div className="flex h-full">
      {/* ─── LEFT PANEL: SectionList (260px) ─────────────────────────────── */}
      <div className="w-[260px] min-w-[260px] border-r bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveResume(null)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors" title="返回简历列表">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>
            <h3 className="font-semibold text-gray-800 text-sm">版块列表</h3>
          </div>
          <button
            onClick={() => {
              setDeleteMode(!deleteMode)
              setSelectedForDelete([])
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              deleteMode
                ? 'bg-red-100 text-red-600'
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            title={deleteMode ? '退出删除模式' : '删除版块'}
          >
            <TrashIcon size={16} />
          </button>
        </div>

        {/* Sortable list */}
        <div className="flex-1 overflow-y-auto p-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedSections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {sortedSections.map((section) => (
                  <SortableSectionItem
                    key={section.id}
                    section={section}
                    deleteMode={deleteMode}
                    isSelected={selectedForDelete.includes(section.id)}
                    onToggleSelect={toggleSelectForDelete}
                    onToggleVisibility={handleToggleVisibility}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Bottom actions */}
        <div className="p-3 border-t space-y-2">
          {/* Add section dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAddDropdown(!showAddDropdown)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-colors"
            >
              <i className="ph-light ph-plus text-base"></i>
              添加版块
            </button>

            {showAddDropdown && (
              <>
                {/* Backdrop to close dropdown */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowAddDropdown(false)}
                />
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border rounded-lg shadow-lg z-20 overflow-hidden">
                  {ADDABLE_SECTIONS.map((s) => (
                    <button
                      key={s.type}
                      onClick={() => {
                        addSection(s.type)
                        setShowAddDropdown(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <i
                        className={`ph-light ${SECTION_ICONS[s.type]} text-base text-gray-500`}
                      ></i>
                      {s.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Delete mode confirm button */}
          {deleteMode && (
            <button
              onClick={handleDeleteSelected}
              disabled={selectedForDelete.length === 0}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedForDelete.length > 0
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <TrashIcon size={14} />
              删除选中 ({selectedForDelete.length})
            </button>
          )}
        </div>
      </div>

      {/* ─── CENTER: ResumePreview (flex-1) ─────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {/* Theme color header bar */}
        <div
          className="h-1.5"
          style={{ backgroundColor: activeResume.theme.primary }}
        />

        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {sortedSections
            .filter((s) => s.isVisible)
            .map((section) => (
              <div
                key={section.id}
                className={`${SECTION_BG_COLORS[section.type]} rounded-xl ${section.type === 'personal' ? 'px-5 pb-5 pt-0' : 'p-5'} relative`}
              >
                {section.type === 'personal' && (() => {
                  const ps = sortedSections.find(s => s.type === 'personal' && s.isVisible);
                  const av = ps?.content?.avatar;
                  return (
                    <div className="absolute top-0 right-5 z-10">
                      {av ? (
                        <div className="relative group">
                          <img src={av} alt="照片" className="w-[96px] h-[120px] border border-gray-200 shadow-sm object-cover" />
                          <button onClick={() => updateSectionContent(ps!.id, { avatar: '' } as any)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" title="删除照片">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer w-[96px] h-[120px] border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center gap-1 hover:border-teal-400 hover:bg-teal-50/30 transition-colors">
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file || !ps) return;
                            const r = new FileReader();
                            r.onload = () => updateSectionContent(ps.id, { avatar: r.result as string } as any);
                            r.readAsDataURL(file);
                          }} />
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          <span className="text-[10px] text-gray-400">一寸照片</span>
                        </label>
                      )}
                    </div>
                  );
                })()}
                <div className={`flex items-center gap-2 ${section.type === 'personal' ? 'pt-[40px] mb-[58px]' : 'mb-4'}`}>
                  <i className={`ph-light ${SECTION_ICONS[section.type]} text-lg text-gray-600`}></i>
                  <h4 className="font-semibold text-gray-700">{SECTION_LABELS[section.type]}</h4>
                </div>
                <SectionContentEditor
                  section={section}
                  onUpdate={updateSectionContent}
                />
              </div>
            ))}

          {sortedSections.filter((s) => s.isVisible).length === 0 && (
            <div className="text-center text-gray-400 py-12">
              <i className="ph-light ph-eye-slash text-4xl mb-2"></i>
              <p className="text-sm">
                所有版块已隐藏，请在左侧面板显示版块
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── RIGHT PANEL (280px) ──────────────────────────────────────── */}
      <div className="w-[280px] min-w-[280px] border-l bg-white flex flex-col">
        {/* Tabs */}
        <div className="flex border-b shrink-0">
          <button
            onClick={() => setRightPanelMode('properties')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              rightPanelMode === 'properties'
                ? 'text-teal-600 border-b-2 border-teal-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            属性
          </button>
          <button
            onClick={() => setRightPanelMode('preview')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              rightPanelMode === 'preview'
                ? 'text-teal-600 border-b-2 border-teal-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            预览
          </button>
        </div>

        {rightPanelMode === 'properties' ? (
        <div className="p-4 space-y-5 overflow-y-auto flex-1">
          {/* Resume title */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">
              简历标题
            </label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
              value={activeResume.title}
              onChange={(e) =>
                updateResume(activeResume.id, { title: e.target.value })
              }
              placeholder="简历标题"
            />
          </div>

          {/* 保存按钮 */}
          <button
            onClick={() => {
              updateResume(activeResume.id, {})
              toast.success('简历已保存')
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm hover:shadow-md transition-all duration-200"
            style={{ backgroundColor: '#14b8a6' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            保存简历
          </button>

          <div className="border-t" />

          {/* Theme color swatches */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">
              主题色
            </label>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_SWATCHES.map((color) => (
                <button
                  key={color}
                  onClick={() =>
                    updateResume(activeResume.id, {
                      theme: { ...activeResume.theme, primary: color },
                    })
                  }
                  className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${
                    activeResume.theme.primary === color
                      ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                      : ''
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Font selector */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">
              字体
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
              value={activeResume.theme.font}
              onChange={(e) =>
                updateResume(activeResume.id, {
                  theme: { ...activeResume.theme, font: e.target.value },
                })
              }
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Version selector */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">
              版本
            </label>
            <div className="flex gap-1">
              {VERSION_OPTIONS.map((v) => (
                <button
                  key={v.value}
                  onClick={() =>
                    updateResume(activeResume.id, {
                      version: v.value as Resume['version'],
                    })
                  }
                  className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors ${
                    activeResume.version === v.value
                      ? 'bg-teal-500 text-white border-teal-500'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t" />

          {/* Export buttons */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">
              导出
            </label>
              <button
                onClick={() => handleExport('PDF')}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                导出
              </button>
          </div>

          {/* AI tools */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">
              AI 工具
            </label>
            <div className="space-y-2">
              {/* Grammar check */}
              <button
                onClick={handleGrammarCheck}
                disabled={grammarLoading}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i
                  className={`ph-light text-base ${
                    grammarLoading ? 'ph-spinner ph-spin' : 'ph-check-circle'
                  }`}
                ></i>
                {grammarLoading ? '检查中...' : '语法检查'}
              </button>

              {/* Translation */}
              <div className="flex gap-2">
                <select
                  value={translationLang}
                  onChange={(e) => setTranslationLang(e.target.value)}
                  className="flex-1 border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                >
                  <option value="en">英文</option>
                  <option value="zh-CN">简体中文</option>
                  <option value="ja">日语</option>
                  <option value="ko">韩语</option>
                </select>
                <button
                  onClick={handleTranslate}
                  disabled={translationLoading}
                  className="flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <i
                    className={`ph-light text-base ${
                      translationLoading ? 'ph-spinner ph-spin' : 'ph-translate'
                    }`}
                  ></i>
                  {translationLoading ? '...' : '翻译'}
                </button>
              </div>
            </div>
          </div>
        </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <ResumePreview resume={activeResume} />
          </div>
        )}
      </div>


      {/* ─── Delete Confirm Modal ─── */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-80 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <i className="ph-light ph-warning-circle text-xl text-red-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">确认删除</h3>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              {pendingDeleteId === 'batch' ? `确定要删除选中的 ${selectedResumes.length} 份简历吗？` : pendingDeleteId ? '确定要删除这份简历吗？' : `确定要删除以下 ${selectedForDelete.length} 个版块吗？`}
            </p>
            <p className="text-xs text-gray-400 mb-4">
              此操作不可撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ─── Grammar Check Results Modal ──────────────────────────────── */}
      {grammarModalOpen && grammarResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => {
            setGrammarModalOpen(false)
            setGrammarResult(null)
          }}
        >
          <div
            className="bg-white rounded-xl p-6 w-[600px] max-h-[80vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                语法检查结果
              </h3>
              <button
                onClick={() => {
                  setGrammarModalOpen(false)
                  setGrammarResult(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ph-light ph-x text-xl"></i>
              </button>
            </div>

            {/* Overall score */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`text-2xl font-bold ${
                  grammarResult.overallScore >= 80
                    ? 'text-green-500'
                    : grammarResult.overallScore >= 60
                      ? 'text-yellow-500'
                      : 'text-red-500'
                }`}
              >
                {grammarResult.overallScore}
              </div>
              <div className="text-sm text-gray-500">/ 100 总体评分</div>
            </div>

            {/* Issues list */}
            {grammarResult.issues.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  发现的问题 ({grammarResult.issues.length})
                </h4>
                <div className="space-y-2">
                  {grammarResult.issues.map((issue, idx) => (
                    <div key={idx} className="border rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            issue.severity === 'high'
                              ? 'bg-red-100 text-red-700'
                              : issue.severity === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {issue.severity === 'high'
                            ? '高'
                            : issue.severity === 'medium'
                              ? '中'
                              : '低'}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {issue.type}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-1">
                        <span className="text-gray-400">原文: </span>
                        <span className="line-through">{issue.text}</span>
                      </p>
                      <p className="text-green-700">
                        <span className="text-gray-400">建议: </span>
                        {issue.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improved text */}
            {grammarResult.improvedText && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  优化后文本
                </h4>
                <div className="border rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap bg-green-50">
                  {grammarResult.improvedText}
                </div>
              </div>
            )}

            {/* Close button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setGrammarModalOpen(false)
                  setGrammarResult(null)
                }}
                className="px-4 py-2 text-sm rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Translation Result Modal ─────────────────────────────────── */}
      {showTranslationResult && translationResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => {
            setShowTranslationResult(false)
            setTranslationResult(null)
          }}
        >
          <div
            className="bg-white rounded-xl p-6 w-[600px] max-h-[80vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">翻译结果</h3>
              <button
                onClick={() => {
                  setShowTranslationResult(false)
                  setTranslationResult(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ph-light ph-x text-xl"></i>
              </button>
            </div>

            {/* Result text */}
            <div className="border rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 max-h-[50vh] overflow-y-auto font-mono">
              {translationResult}
            </div>

            {/* Actions */}
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard
                    .writeText(translationResult)
                    .then(() => toast.success('已复制到剪贴板'))
                }}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                复制
              </button>
              <button
                onClick={() => {
                  setShowTranslationResult(false)
                  setTranslationResult(null)
                }}
                className="px-4 py-2 text-sm rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Editor;
