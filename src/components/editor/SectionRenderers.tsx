import React, { useState } from 'react'
import type { SectionType, ResumeSection } from '@/types/resume'

export const SECTION_ICONS: Record<SectionType, string> = {
  personal: 'ph-user', summary: 'ph-file-text', experience: 'ph-briefcase',
  education: 'ph-book-open', skills: 'ph-lightning', projects: 'ph-folder-open',
  certifications: 'ph-certificate',
}

export const SECTION_LABELS: Record<SectionType, string> = {
  personal: '个人信息', summary: '个人简介', experience: '工作经历',
  education: '教育背景', skills: '专业技能', projects: '项目/作品经验',
  certifications: '证书资质',
}

export const SECTION_BG_COLORS: Record<SectionType, string> = {
  personal: 'bg-blue-50', summary: 'bg-green-50', experience: 'bg-purple-50',
  education: 'bg-yellow-50', skills: 'bg-pink-50', projects: 'bg-indigo-50',
  certifications: 'bg-orange-50',
}

export const COLOR_SWATCHES = [
  '#D4875E', '#0ea5e9', '#6366f1', '#a855f7',
  '#ec4899', '#f43f5e', '#f97316', '#eab308',
  '#22c55e', '#06b6d4', '#8b5cf6', '#64748b',
]

export const FONT_OPTIONS = [
  { value: 'Noto Sans SC', label: 'Noto Sans SC' },
  { value: 'Source Han Sans', label: '思源黑体' },
  { value: 'Noto Serif SC', label: 'Noto Serif SC' },
  { value: 'Source Han Serif', label: '思源宋体' },
]

export const VERSION_OPTIONS: { value: string; label: string }[] = [
  { value: 'general', label: '通用版' }, { value: 'big', label: '大厂版' },
  { value: 'mid', label: '中厂版' }, { value: 'small', label: '小厂版' },
]

export const ADDABLE_SECTIONS: { type: SectionType; label: string }[] = [
  { type: 'personal', label: '个人信息' }, { type: 'summary', label: '个人简介' },
  { type: 'experience', label: '工作经历' }, { type: 'education', label: '教育背景' },
  { type: 'skills', label: '专业技能' }, { type: 'projects', label: '项目/作品经验' },
  { type: 'certifications', label: '证书资质' },
]

export const TrashIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </svg>
)

interface RendererProps { section: ResumeSection; onUpdate: (sectionId: string, content: Record<string, any>) => void }

const PersonalRenderer = ({ section, onUpdate }: RendererProps) => {
  const c = section.content; const set = (k: string, v: string) => onUpdate(section.id, { [k]: v })
  const fields = [
    { key: 'name', label: '姓名', placeholder: '请输入姓名' },
    { key: 'title', label: '求职意向', placeholder: '例如：高级前端工程师' },
    { key: 'email', label: '邮箱', placeholder: 'email@example.com' },
    { key: 'phone', label: '电话', placeholder: '138-0000-0000' },
    { key: 'location', label: '地址', placeholder: '城市 / 地址', colSpan: true },
  ]
  return (<div className="grid grid-cols-2 gap-3">{fields.map(f => (
    <div key={f.key} className={f.colSpan ? 'col-span-2' : ''}>
      <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
      <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" value={c[f.key] || ''} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} />
    </div>
  ))}</div>)
}

const SummaryRenderer = ({ section, onUpdate }: RendererProps) => (
  <div><textarea className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 min-h-[100px] resize-y" value={section.content.summary ?? section.content.text ?? ''} onChange={e => onUpdate(section.id, { summary: e.target.value })} placeholder="请输入个人简介..." /></div>
)

const ExperienceRenderer = ({ section, onUpdate }: RendererProps) => {
  const items: any[] = section.content.items || []
  const addItem = () => onUpdate(section.id, { items: [...items, { company: '', role: '', startDate: '', endDate: '', description: '' }] })
  const removeItem = (idx: number) => onUpdate(section.id, { items: items.filter((_, i) => i !== idx) })
  const updateItem = (idx: number, key: string, value: string) => onUpdate(section.id, { items: items.map((item, i) => i === idx ? { ...item, [key]: value } : item) })
  return (<div className="space-y-4">{items.map((item, idx) => (
    <div key={idx} className="relative border rounded-lg pt-6 p-3 space-y-2">
      <button onClick={() => removeItem(idx)} className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="删除此项">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div className="grid grid-cols-2 gap-2">
        <input className="border rounded px-2 py-1.5 text-sm" value={item.company || ''} onChange={e => updateItem(idx, 'company', e.target.value)} placeholder="公司名称" />
        <input className="border rounded px-2 py-1.5 text-sm" value={item.role || ''} onChange={e => updateItem(idx, 'role', e.target.value)} placeholder="职位" />
        <div><label className="block text-xs text-gray-400 mb-1">开始时间</label><input type="date" className="w-full border rounded px-2 py-1.5 text-sm" value={item.startDate || ''} onChange={e => updateItem(idx, 'startDate', e.target.value)} /></div>
        <div><label className="block text-xs text-gray-400 mb-1">结束时间</label><input type="date" className="w-full border rounded px-2 py-1.5 text-sm" value={item.endDate || ''} onChange={e => updateItem(idx, 'endDate', e.target.value)} /></div>
      </div>
      <textarea className="w-full border rounded px-2 py-1.5 text-sm min-h-[60px] resize-y" value={item.description || ''} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="工作描述，每行一条" />
    </div>
  ))}<button onClick={addItem} className="flex items-center gap-1 text-sm text-[#D4875E] hover:text-teal-700"><i className="ph-light ph-plus text-base"></i> 添加工作经历</button></div>)
}

const EducationRenderer = ({ section, onUpdate }: RendererProps) => {
  let items: any[] = section.content.items || []
  if (items.length === 0 && (section.content.school || section.content.degree || section.content.major)) items = [section.content]
  const addItem = () => onUpdate(section.id, { items: [...items, { school: '', degree: '', major: '', startDate: '', endDate: '' }] })
  const removeItem = (idx: number) => onUpdate(section.id, { items: items.filter((_, i) => i !== idx) })
  const updateItem = (idx: number, key: string, value: string) => onUpdate(section.id, { items: items.map((item, i) => i === idx ? { ...item, [key]: value } : item) })
  return (<div className="space-y-4">{items.map((item, idx) => (
    <div key={idx} className="relative border rounded-lg pt-6 p-3 space-y-2">
      <button onClick={() => removeItem(idx)} className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="删除此项">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div className="grid grid-cols-2 gap-2">
        <input className="border rounded px-2 py-1.5 text-sm" value={item.school || ''} onChange={e => updateItem(idx, 'school', e.target.value)} placeholder="学校名称" />
        <select value={item.degree || ''} onChange={e => updateItem(idx, 'degree', e.target.value)} className="border rounded px-2 py-1.5 text-sm bg-white">
          <option value="">选择学历</option><option value="博士">博士</option><option value="硕士">硕士</option><option value="本科">本科</option><option value="大专">大专</option><option value="高中">高中</option>
        </select>
      </div>
      <input className="w-full border rounded px-2 py-1.5 text-sm" value={item.major || ''} onChange={e => updateItem(idx, 'major', e.target.value)} placeholder="专业" />
      <div className="flex gap-2">
        <div className="flex-1"><label className="block text-xs text-gray-400 mb-1">开始时间</label><input type="date" className="w-full border rounded px-2 py-1.5 text-sm" value={item.startDate || ''} onChange={e => updateItem(idx, 'startDate', e.target.value)} /></div>
        <div className="flex-1"><label className="block text-xs text-gray-400 mb-1">结束时间</label><input type="date" className="w-full border rounded px-2 py-1.5 text-sm" value={item.endDate || ''} onChange={e => updateItem(idx, 'endDate', e.target.value)} /></div>
      </div>
    </div>
  ))}<button onClick={addItem} className="flex items-center gap-1 text-sm text-[#D4875E] hover:text-teal-700"><i className="ph-light ph-plus text-base"></i> 添加教育经历</button></div>)
}

const SkillsRenderer = ({ section, onUpdate }: RendererProps) => {
  const skills: string[] = section.content.skills || []; const [inputVal, setInputVal] = useState('')
  const addSkill = () => { const t = inputVal.trim(); if (t && !skills.includes(t)) { onUpdate(section.id, { skills: [...skills, t] }); setInputVal('') } }
  return (<div>
    <div className="flex gap-2 mb-3">
      <input className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }} placeholder="输入技能后回车添加" />
      <button onClick={addSkill} className="px-3 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover">添加</button>
    </div>
    <div className="flex flex-wrap gap-2">{skills.map((s, i) => (
      <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm">{s}<button onClick={() => onUpdate(section.id, { skills: skills.filter((_, j) => j !== i) })} className="hover:text-red-500"><i className="ph-light ph-x text-sm"></i></button></span>
    ))}</div>
    {skills.length === 0 && <p className="text-xs text-gray-400 mt-1">暂无技能，请输入并添加</p>}
  </div>)
}

const ProjectsRenderer = ({ section, onUpdate }: RendererProps) => {
  const items: any[] = section.content.items || []
  const addItem = () => onUpdate(section.id, { items: [...items, { name: '', role: '', tech: '', description: '', link: '' }] })
  const removeItem = (idx: number) => onUpdate(section.id, { items: items.filter((_, i) => i !== idx) })
  const updateItem = (idx: number, key: string, value: string) => onUpdate(section.id, { items: items.map((item, i) => i === idx ? { ...item, [key]: value } : item) })
  return (<div className="space-y-4">{items.map((item, idx) => (
    <div key={idx} className="relative border rounded-lg pt-6 p-3 space-y-2">
      <button onClick={() => removeItem(idx)} className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="删除此项">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div className="grid grid-cols-2 gap-2">
        <input className="border rounded px-2 py-1.5 text-sm" value={item.name || ''} onChange={e => updateItem(idx, 'name', e.target.value)} placeholder="项目名称" />
        <input className="border rounded px-2 py-1.5 text-sm" value={item.role || ''} onChange={e => updateItem(idx, 'role', e.target.value)} placeholder="担任角色" />
        <input className="border rounded px-2 py-1.5 text-sm" value={item.tech || ''} onChange={e => updateItem(idx, 'tech', e.target.value)} placeholder="使用技术" />
        <input className="border rounded px-2 py-1.5 text-sm" value={item.link || ''} onChange={e => updateItem(idx, 'link', e.target.value)} placeholder="项目链接" />
      </div>
      <textarea className="w-full border rounded px-2 py-1.5 text-sm min-h-[60px] resize-y" value={item.description || ''} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="项目描述" />
    </div>
  ))}<button onClick={addItem} className="flex items-center gap-1 text-sm text-[#D4875E] hover:text-teal-700"><i className="ph-light ph-plus text-base"></i> 添加项目</button></div>)
}

const CertificationsRenderer = ({ section, onUpdate }: RendererProps) => {
  const items: any[] = section.content.items || []
  const addItem = () => onUpdate(section.id, { items: [...items, { name: '', issuer: '', date: '' }] })
  const removeItem = (idx: number) => onUpdate(section.id, { items: items.filter((_, i) => i !== idx) })
  const updateItem = (idx: number, key: string, value: string) => onUpdate(section.id, { items: items.map((item, i) => i === idx ? { ...item, [key]: value } : item) })
  return (<div className="space-y-3">{items.map((item, idx) => (
    <div key={idx} className="relative border rounded-lg pt-6 p-3 space-y-2">
      <button onClick={() => removeItem(idx)} className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="删除此项">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div className="grid grid-cols-2 gap-2">
        <input className="border rounded px-2 py-1.5 text-sm" value={item.name || ''} onChange={e => updateItem(idx, 'name', e.target.value)} placeholder="证书名称" />
        <input className="border rounded px-2 py-1.5 text-sm" value={item.issuer || ''} onChange={e => updateItem(idx, 'issuer', e.target.value)} placeholder="颁发机构" />
        <input type="date" className="border rounded px-2 py-1.5 text-sm" value={item.date || ''} onChange={e => updateItem(idx, 'date', e.target.value)} />
      </div>
    </div>
  ))}<button onClick={addItem} className="flex items-center gap-1 text-sm text-[#D4875E] hover:text-teal-700"><i className="ph-light ph-plus text-base"></i> 添加证书</button></div>)
}

export const SectionContentEditor = ({ section, onUpdate }: RendererProps) => {
  switch (section.type) {
    case 'personal': return <PersonalRenderer section={section} onUpdate={onUpdate} />
    case 'summary': return <SummaryRenderer section={section} onUpdate={onUpdate} />
    case 'experience': return <ExperienceRenderer section={section} onUpdate={onUpdate} />
    case 'education': return <EducationRenderer section={section} onUpdate={onUpdate} />
    case 'skills': return <SkillsRenderer section={section} onUpdate={onUpdate} />
    case 'projects': return <ProjectsRenderer section={section} onUpdate={onUpdate} />
    case 'certifications': return <CertificationsRenderer section={section} onUpdate={onUpdate} />
    default: return null
  }
}

export const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="flex flex-col items-center justify-center h-full text-gray-400">
    <i className="ph-light ph-file-text text-6xl mb-4"></i>
    <p className="text-lg mb-4">还没有选择简历</p>
    <button onClick={onCreate} className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors">创建新简历</button>
  </div>
)
