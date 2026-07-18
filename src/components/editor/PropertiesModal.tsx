import React, { useState, useRef } from 'react'
import type { Resume } from '@/types/resume'
import { FONT_OPTIONS, VERSION_OPTIONS } from './SectionRenderers'
import NarrativeAuditModal from './NarrativeAuditModal'

interface Props {
  activeResume: Resume; templateOptions: {id:string;name:string}[]
  updateResume: (id: string, data: Partial<Resume>) => void
  handleExport: (format: string) => void
  onClose: () => void
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

export default function PropertiesModal({ activeResume, templateOptions, updateResume, handleExport, onClose }: Props) {
  const initialCat = TEMPLATE_CATEGORIES[activeResume.template || 'classic'] || '经典通用'
  const [activeCategory, setActiveCategory] = useState(initialCat)
  const [showNarrative, setShowNarrative] = useState(false)

  const filteredTemplates = templateOptions.filter(t => (TEMPLATE_CATEGORIES[t.id] || '其他') === activeCategory)
  const [gliderIdx, setGliderIdx] = useState(() => filteredTemplates.findIndex(t => (activeResume.template || 'classic') === t.id))
  const prevTemplateRef = useRef(activeResume.template)
  if (prevTemplateRef.current !== activeResume.template) {
    prevTemplateRef.current = activeResume.template
    const idx = filteredTemplates.findIndex(t => (activeResume.template || 'classic') === t.id)
    if (idx >= 0) setGliderIdx(idx)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl w-[480px] max-h-[85vh] flex flex-col mx-4" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
            <h2 className="text-lg font-semibold text-slate-800">简历属性</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div className="p-5 space-y-5 overflow-y-auto">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">简历标题</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                value={activeResume.title} onChange={e => updateResume(activeResume.id, { title: e.target.value })} placeholder="简历标题" />
            </div>

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
                  className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors ${activeResume.version === v.value ? 'bg-[#D4875E] text-white border-[#D4875E]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{v.label}</button>
              ))}</div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">模板</label>
              <div className="flex flex-wrap gap-1 mb-2">{CATEGORY_ORDER.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${activeCategory === cat ? 'bg-[#D4875E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{cat}</button>
              ))}</div>
              <div className="relative pl-5 border rounded-lg p-1">
                <style>{`
                  .tm-glider { position: absolute; left: 0; top: 0; bottom: 0; width: 1px; background: linear-gradient(0deg,transparent 0%,rgba(0,0,0,0.08) 50%,transparent 100%); }
                  .tm-glider-inner { height: calc(100% / ${filteredTemplates.length || 1}); width: 100%; background: linear-gradient(0deg,transparent 0%,#D4875E 50%,transparent 100%); transition: transform 0.5s cubic-bezier(0.37,1.95,0.66,0.56); position: relative; }
                  .tm-glider-inner::before { content: ''; position: absolute; height: 60%; width: 300%; top: 50%; transform: translateY(-50%); background: #D4875E; filter: blur(10px); }
                  .tm-glider-inner::after { content: ''; position: absolute; left: 0; height: 100%; width: 150px; background: linear-gradient(90deg,rgba(212,135,94,0.12) 0%,transparent 100%); }
                  .tm-item input:checked + span { color: #D4875E; font-weight: 600; }
                `}</style>
                <div className="tm-glider"><div className="tm-glider-inner" style={{ transform: `translateY(${gliderIdx < 0 ? 0 : gliderIdx * 100}%)` }} /></div>
                {filteredTemplates.map(t => (
                  <label key={t.id} className="tm-item flex items-center py-1">
                    <input type="radio" name="tm" checked={(activeResume.template || 'classic') === t.id}
                      onChange={() => { setGliderIdx(filteredTemplates.findIndex(x => x.id === t.id)); updateResume(activeResume.id, { template: t.id }) }} className="hidden" />
                    <span className="text-sm text-gray-600 transition-all duration-300 cursor-pointer">{t.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => { updateResume(activeResume.id, {}); onClose() }}
                className="btn-pill primary flex-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>保存
              </button>
              <button onClick={() => setShowNarrative(true)}
                className="btn-pill secondary flex-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>叙事分析
              </button>
            </div>

            <div className="border-t" />

            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">导出</label>
              <button onClick={() => { handleExport('PDF'); onClose() }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>导出 PDF
              </button>
            </div>
          </div>
        </div>
      </div>
      {showNarrative && <NarrativeAuditModal resume={activeResume} onClose={() => setShowNarrative(false)} />}
    </>
  )
}
