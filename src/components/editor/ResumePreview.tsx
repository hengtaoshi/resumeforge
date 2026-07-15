import React, { useEffect, useRef, useState } from 'react'
import type { Resume as EditorResume } from '@/types/resume'
import { convertResumeForTemplate } from '@/lib/resume-converter'
import { initTemplates, getTemplate } from './template-registry'

interface Props {
  resume: EditorResume
}

export default function ResumePreview({ resume }: Props) {
  const [loaded, setLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    initTemplates().then(() => setLoaded(true))
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
      <div className="px-3 py-2 border-b text-xs text-gray-500">
        当前模板: <span className="font-medium text-gray-700">{templateDef?.name || selectedId}</span>
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
            className="shadow-xl bg-white p-6 relative"
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
