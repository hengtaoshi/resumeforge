import React from 'react'
import type { Resume } from '@/types/resume'
import { COLOR_SWATCHES, FONT_OPTIONS, VERSION_OPTIONS } from './SectionRenderers'
import toast from '@/lib/toast'

interface Props {
  width?: number; activeResume: Resume; templateOptions: {id:string;name:string}[]
  updateResume: (id: string, data: Partial<Resume>) => void
  handleExport: (format: string) => void
}

export default function EditorProperties(props: Props) {
  const { width, activeResume, templateOptions, updateResume, handleExport } = props

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
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">主题色</label>
          <div className="grid grid-cols-6 gap-2">{COLOR_SWATCHES.map(color => (
            <button key={color} onClick={() => updateResume(activeResume.id, { theme: { ...activeResume.theme, primary: color } })}
              className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${activeResume.theme.primary === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
              style={{ backgroundColor: color }} title={color} />
          ))}</div>
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
              className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors ${activeResume.version === v.value ? 'bg-teal-500 text-white border-teal-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{v.label}</button>
          ))}</div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">模板</label>
          <div className="max-h-[200px] overflow-y-auto border rounded-lg p-1 space-y-0.5">{templateOptions.map(t => (
            <button key={t.id} onClick={() => updateResume(activeResume.id, { template: t.id }) }
              className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${(activeResume.template || 'classic') === t.id ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>{t.name}</button>
          ))}</div>
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
