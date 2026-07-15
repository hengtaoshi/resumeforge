import React, { useState } from 'react'
import type { Resume } from '@/types/resume'
import { FONT_OPTIONS, VERSION_OPTIONS } from './SectionRenderers'
import toast from '@/lib/toast'

interface Props {
  width?: number; activeResume: Resume; templateOptions: {id:string;name:string}[]
  updateResume: (id: string, data: Partial<Resume>) => void
  handleExport: (format: string) => void
}

const TEMPLATE_CATEGORIES: Record<string, string> = {
  classic: '经典通用', modern: '经典通用', minimal: '经典通用', professional: '经典通用',
  clean: '经典通用', elegant: '经典通用', compact: '经典通用', euro: '经典通用',
  corporate: '专业商务', formal: '专业商务', executive: '专业商务', consultant: '专业商务',
  finance: '专业商务', ats: '专业商务', bold: '专业商务', legal: '专业商务',
  creative: '创意视觉', artistic: '创意视觉', designer: '创意视觉', magazine: '创意视觉',
  retro: '创意视觉', watercolor: '创意视觉', mosaic: '创意视觉', zigzag: '创意视觉',
  ribbon: '创意视觉', neon: '创意视觉', gradient: '创意视觉', rose: '创意视觉', luxe: '创意视觉', berlin: '创意视觉',
  coder: '技术开发', developer: '技术开发', engineer: '技术开发', startup: '技术开发',
  blocks: '技术开发', metro: '技术开发', material: '技术开发',
  academic: '教育科研', teacher: '教育科研', scientist: '教育科研', medical: '教育科研',
  'two-column': '特色布局', sidebar: '特色布局', card: '特色布局', timeline: '特色布局',
  infographic: '特色布局', architect: '特色布局', swiss: '特色布局', japanese: '特色布局', nordic: '特色布局',
}

const CATEGORY_ORDER = ['经典通用', '专业商务', '创意视觉', '技术开发', '教育科研', '特色布局']

export default function EditorProperties(props: Props) {
  const { width, activeResume, templateOptions, updateResume, handleExport } = props
  const [activeCategory, setActiveCategory] = useState('经典通用')

  return (
    <div className="border-l bg-white flex flex-col shrink-0" style={{ width: width || 280 }}>
      <div className="px-4 py-2.5 border-b text-sm font-medium text-gray-700 shrink-0">属性</div>
      <div className="p-4 space-y-5 overflow-y-auto flex-1">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">简历标题</label>
          <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            value={activeResume.title} onChange={e => updateResume(activeResume.id, { title: e.target.value })} placeholder="简历标题" />
        </div>

        <button onClick={() => { updateResume(activeResume.id, {}); toast.success('简历已保存') }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm hover:shadow-md"
          style={{ backgroundColor: '#14b8a6' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>保存简历
        </button>

        <div className="border-t" />

        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">字体</label>
          <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            value={activeResume.theme.font} onChange={e => updateResume(activeResume.id, { theme: { ...activeResume.theme, font: e.target.value } })}>
            {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">版本</label>
          <div className="flex gap-1">{VERSION_OPTIONS.map(v => (
            <button key={v.value} onClick={() => updateResume(activeResume.id, { version: v.value as Resume['version'] })}
              className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors ${activeResume.version === v.value ? 'bg-teal-500 text-white border-teal-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{v.label}</button>
          ))}</div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">模板</label>
          <div className="flex flex-wrap gap-1 mb-2">{CATEGORY_ORDER.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${activeCategory === cat ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{cat}</button>
          ))}</div>
          <div className="border rounded-lg p-1 max-h-[200px] overflow-y-auto">
            {templateOptions.filter(t => (TEMPLATE_CATEGORIES[t.id] || '其他') === activeCategory).map(t => (
              <button key={t.id} onClick={() => updateResume(activeResume.id, { template: t.id }) }
                className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${(activeResume.template || 'classic') === t.id ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>{t.name}</button>
            ))}
          </div>
        </div>

        <div className="border-t" />

        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">导出</label>
          <button onClick={() => handleExport('PDF')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>导出
          </button>
        </div>
      </div>
    </div>
  )
}
