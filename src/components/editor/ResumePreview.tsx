import React, { useEffect, useRef, useState } from 'react'
import type { Resume as EditorResume } from '@/types/resume'
import { convertResumeForTemplate } from '@/lib/resume-converter'
import { initTemplates, getRegisteredTemplates, getTemplate, type RegisteredTemplate } from './template-registry'

interface Props {
  resume: EditorResume
}

export default function ResumePreview({ resume }: Props) {
  const [templates, setTemplates] = useState<RegisteredTemplate[]>([])
  const [selectedId, setSelectedId] = useState('classic')
  const [loaded, setLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    initTemplates().then(() => {
      setTemplates(getRegisteredTemplates())
      setLoaded(true)
    })
  }, [])

  // Calculate scale to fit A4 width inside container
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

  const templateDef = getTemplate(selectedId)
  const templateData = convertResumeForTemplate(resume)
  const TemplateComponent = templateDef?.component

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        加载模板中...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Template selector */}
      <div className="px-3 py-2 border-b">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white"
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} — {t.description}
            </option>
          ))}
        </select>
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
            }}
            className="shadow-xl bg-white"
          >
            {TemplateComponent && <TemplateComponent resume={templateData} />}
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
