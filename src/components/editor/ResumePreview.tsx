import React, { useEffect, useRef, useState } from 'react'
import type { Resume as EditorResume } from '@/types/resume'
import { convertResumeForTemplate } from '@/lib/resume-converter'
import { initTemplates, getRegisteredTemplates, getTemplate } from './template-registry'

interface Props {
  resume: EditorResume
  onTemplateChange?: (templateId: string) => void
}

export default function ResumePreview({ resume, onTemplateChange }: Props) {
  const [loaded, setLoaded] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    initTemplates().then(() => setLoaded(true))
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setScale(Math.min(w / 210, 1))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const allTemplates = getRegisteredTemplates()
  const selectedId = resume.template || 'classic'
  const templateDef = getTemplate(selectedId)
  const templateData = convertResumeForTemplate(resume)
  const TemplateComponent = templateDef?.component
  const avatarUrl = resume.sections.find(s => s.type === 'personal')?.content?.avatar || ''

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        加载模板中...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-xs text-gray-500">
          模板: <span className="font-medium text-gray-700">{templateDef?.name || selectedId}</span>
        </span>
        <div className="relative">
          <button onClick={() => setShowPicker(!showPicker)}
            className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            切换
          </button>
          {showPicker && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowPicker(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-20 overflow-y-auto" style={{ maxHeight: 300, width: 180 }}>
                {allTemplates.map(t => (
                  <button key={t.id} onClick={() => { onTemplateChange?.(t.id); setShowPicker(false) }}
                    className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${(resume.template || 'classic') === t.id ? 'text-[#D4875E] font-medium bg-[rgba(212,135,94,0.08)]' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {t.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* A4 preview area */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="flex justify-center">
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              width: '210mm',
              minHeight: '297mm',
              display: 'flex',
              flexDirection: 'column',
            }}
            className="bg-white p-8 relative shadow-sm"
          >
            {TemplateComponent && <TemplateComponent resume={templateData} />}
            {avatarUrl && (
              <div className="absolute top-6 right-6 z-10 w-[96px] h-[120px] border border-gray-200 shadow-sm overflow-hidden rounded-sm">
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
        {scale < 1 && (
          <p className="text-center text-xs text-gray-400 mt-2">
            已缩放至 {Math.round(scale * 100)}%
          </p>
        )}
      </div>
    </div>
  )
}
