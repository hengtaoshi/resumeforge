import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import { useResumeStore } from '@/stores/resumeStore'
import type { Resume, SectionType } from '@/types/resume'
import { askAI, isAIConfigured } from '@/lib/ai/stream'
import { extractJSON } from '@/lib/ai/provider'
import toast from '@/lib/toast'
import ImportReviewModal, { type ParsedResumeData } from '@/components/editor/ImportReviewModal'
import EditorSidebar from '@/components/editor/EditorSidebar'
import EditorCenter from '@/components/editor/EditorCenter'
import PropertiesModal from '@/components/editor/PropertiesModal'
import { EmptyState } from '@/components/editor/SectionRenderers'

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const clone = [...arr]; const [removed] = clone.splice(from, 1); clone.splice(to, 0, removed); return clone
}

const Editor = () => {
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

  const [deleteMode, setDeleteMode] = useState(false)
  const [selectedForDelete, setSelectedForDelete] = useState<string[]>([])
  const [resumeDeleteMode, setResumeDeleteMode] = useState(false)
  const [selectedResumes, setSelectedResumes] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [showAddDropdown, setShowAddDropdown] = useState(false)
  const [showProps, setShowProps] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(260)

  const useDivider = (onChange: (d: number) => void) => {
    const ref = useRef<HTMLDivElement>(null); const [drag, setDrag] = useState(false)
    useEffect(() => {
      const el = ref.current; if (!el) return
      const down = (e: MouseEvent) => { e.preventDefault(); setDrag(true); const sx = e.clientX
        const move = (e: MouseEvent) => onChange(e.clientX - sx)
        const up = () => { setDrag(false); document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
        document.addEventListener('mousemove', move); document.addEventListener('mouseup', up)
      }
      el.addEventListener('mousedown', down); return () => el.removeEventListener('mousedown', down)
    }, [onChange])
    return { ref, drag }
  }
  const leftDiv = useDivider(d => setSidebarWidth(w => Math.max(160, Math.min(400, w + d))))
  const [importReviewData, setImportReviewData] = useState<ParsedResumeData | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importStatus, setImportStatus] = useState('')
  const [importText, setImportText] = useState('')
  const [showTextImport, setShowTextImport] = useState(false)
  const [templateOptions, setTemplateOptions] = useState<Array<{id:string;name:string}>>([])

  useEffect(() => {
    import('@/components/editor/template-registry').then(async (mod) => {
      await mod.initTemplates()
      setTemplateOptions(mod.getRegisteredTemplates().map((t: any) => ({ id: t.id, name: t.name })))
    }).catch(() => {})
  }, [])

  useEffect(() => { fetchResumes() }, [fetchResumes])

  useEffect(() => {
    if (activeResume) { setShowDeleteConfirm(false); setPendingDeleteId(null) }
  }, [!!activeResume])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !activeResume) return
    const ids = activeResume.sections.map((s) => s.id)
    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    reorderSections(arrayMove(ids, oldIndex, newIndex))
  }, [activeResume, reorderSections])

  const handleToggleVisibility = useCallback((sectionId: string) => {
    if (!activeResume) return
    updateResume(activeResume.id, {
      sections: activeResume.sections.map((s) => s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s),
    })
  }, [activeResume, updateResume])

  const toggleSelectForDelete = useCallback((sectionId: string) => {
    setSelectedForDelete((prev) => prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId])
  }, [])

  const handleDeleteSelected = useCallback(() => { if (selectedForDelete.length > 0) setShowDeleteConfirm(true) }, [selectedForDelete])

  const confirmDelete = useCallback(() => {
    if (pendingDeleteId === 'batch') {
      for (const id of selectedResumes) deleteResume(id)
      toast.success(`已删除 ${selectedResumes.length} 份简历`)
      setSelectedResumes([]); setResumeDeleteMode(false)
    } else if (pendingDeleteId) {
      deleteResume(pendingDeleteId); toast.success('简历已删除'); setPendingDeleteId(null)
    } else {
      for (const id of selectedForDelete) removeSection(id)
    }
    setSelectedForDelete([]); setDeleteMode(false); setShowDeleteConfirm(false)
  }, [selectedForDelete, removeSection, pendingDeleteId, deleteResume, selectedResumes])

  const handleImportResume = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (!isAIConfigured()) { toast.warning('请先在设置中配置 AI 服务'); return }
    if (file.size > 5 * 1024 * 1024) { toast.warning('文件过大，请选择小于 5MB 的文件'); return }
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['txt', 'docx', 'pdf'].includes(ext || '')) { toast.warning('仅支持 .txt、.docx、.pdf 格式'); return }
    setImportLoading(true); setImportStatus('正在提取文件文本...')
    const extractText = async (f: File): Promise<string> => {
      const ext = f.name.split('.').pop()?.toLowerCase()
      if (ext === 'pdf') {
        if (window.electronAPI?.extractPdfText) return window.electronAPI.extractPdfText(await f.arrayBuffer())
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await f.arrayBuffer()), disableFontFace: true }).promise
        const pages: string[] = []
        for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) { try { const p = await pdf.getPage(i); const tc = await p.getTextContent(); pages.push(tc.items.map((item: any) => item.str).join(' ')) } catch { pages.push('') } }
        return pages.filter(Boolean).join('\n')
      }
      return new Promise(r => { const rd = new FileReader(); rd.onload = () => r(rd.result as string); rd.readAsText(f) })
    }
    const input = e.currentTarget; let text: string
    try { text = await Promise.race([extractText(file), new Promise<string>((_, rej) => setTimeout(() => rej(new Error('timeout')), 15000))]) }
    catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setImportLoading(false); setImportStatus(''); setImportText(''); setShowTextImport(true)
      toast.warning(msg.includes('timeout') ? 'PDF 提取超时（15s），请手动粘贴简历文本' : 'PDF 提取失败: ' + msg + '，可手动粘贴文本')
      input.value = ''; return
    }
    if (!text.trim()) { setImportLoading(false); setImportStatus(''); setImportText(''); setShowTextImport(true); toast.warning('PDF 未提取到文本（可能为扫描件/图片），请手动粘贴'); e.target.value = ''; return }
    setImportLoading(false); setImportStatus(''); setImportText(text); setShowTextImport(true); e.target.value = ''
  }, [createResume, updateResume])

  const handleParseText = useCallback(async () => {
    if (!isAIConfigured()) { toast.warning('请先在设置中配置 AI 服务'); return }
    const text = importText.trim(); if (!text) { toast.warning('没有可解析的文本'); return }
    setImportLoading(true); setImportStatus('正在调用 AI 解析...')
    const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(), 60000)
    try {
      const res = await askAI([{ role: 'system', content: `你是一位简历解析专家。从以下文本中提取简历信息，返回纯 JSON（不要 markdown）：
{ "title":"","personal":{"name":"","title":"","email":"","phone":"","location":""},"summary":{"text":""},
"experience":{"items":[{"company":"","role":"","startDate":"","endDate":"","description":""}]},
"education":{"items":[{"school":"","degree":"","major":"","startDate":"","endDate":""}]},"skills":{"skills":[]},
"projects":{"items":[{"name":"","role":"","tech":"","description":""}]},"certifications":{"items":[{"name":"","issuer":"","date":""}]}}
没有的字段填空数组或空字符串。` }, { role: 'user', content: text.slice(0, 30000) }], controller.signal)
      clearTimeout(timeoutId)
      const parsed = extractJSON<any>(res)
      if (!parsed) { setImportLoading(false); setImportStatus(''); toast.error('AI 解析失败，请重试'); return }
      setShowTextImport(false)
      setImportReviewData({
        title: parsed.title || '导入的简历', personal: parsed.personal || {},
        summary: { text: parsed.summary?.text || parsed.summary?.summary || '' },
        experience: { items: parsed.experience?.items || [] }, education: { items: parsed.education?.items || [] },
        skills: { skills: parsed.skills?.skills || [] }, projects: { items: parsed.projects?.items || [] },
        certifications: { items: parsed.certifications?.items || [] },
      })
    } catch (err) {
      clearTimeout(timeoutId)
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg.includes('abort') || msg.includes('timeout') ? '解析超时（超过 60 秒），请检查网络或换用更快的模型' : '解析失败: ' + msg)
    }
    setImportLoading(false); setImportStatus('')
  }, [importText])

  const handleImportConfirm = useCallback(async (data: ParsedResumeData) => {
    setImportReviewData(null)
    const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const sectionData: [string, Record<string, any>][] = [
      ['personal', data.personal], ['summary', { summary: data.summary.text }], ['experience', data.experience],
      ['education', data.education], ['skills', data.skills], ['projects', data.projects], ['certifications', data.certifications],
    ]
    const resume = await createResume(data.title || '导入的简历')
    if (resume) {
      await updateResume(resume.id, { sections: sectionData.map(([type, content], i) => ({ id: genId(), type: type as any, sortOrder: i, content, isVisible: true })) })
      toast.success('简历导入成功')
    }
  }, [createResume, updateResume])

  const handleExport = useCallback(async (format: string) => {
    if (!activeResume || !window.electronAPI) { toast.warning('导出功能仅在桌面客户端可用'); return }
    try {
      const templateId = activeResume.template || 'classic'
      if (format === 'PDF' || format === 'HTML') {
        const { renderStyledHTML } = await import('@/lib/export/styled-export')
        const html = renderStyledHTML(activeResume as any, templateId)
        const key = format === 'PDF' ? 'exportStyledPDF' : 'exportStyledHTML'
        const pi = activeResume.sections.find(s => s.type === 'personal')?.content
        const suggestedName = [pi?.name, pi?.title, '简历'].filter(Boolean).join('-')
        const result = await (window.electronAPI as any)[key](html, suggestedName)
        if (result.success) toast.success(`导出 ${format} 成功`)
        else if (result.error) toast.error(result.error)
      } else {
        const fn = window.electronAPI[`export${format}` as keyof typeof window.electronAPI]
        if (typeof fn !== 'function') return
        const result = await (fn as (data: unknown) => Promise<any>)({ ...activeResume, template: templateId })
        if (result.success) toast.success(`导出 ${format} 成功`)
        else if (result.error) toast.error(result.error)
      }
    } catch (err) { toast.error(`导出 ${format} 失败: ${err instanceof Error ? err.message : String(err)}`) }
  }, [activeResume])

  if (!activeResume) {
    return (
      <div className="flex h-full">
        <div className="w-64 min-w-[256px] border-r bg-gray-50 flex flex-col">
          <div className="p-4 border-b bg-white flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">我的简历</h2>
            <div className="flex items-center gap-1">
              <label className="btn-pill primary !text-xs !px-3 !py-1.5 inline-flex items-center gap-1.5 cursor-pointer" title="导入简历文件">
                <input type="file" accept=".txt,.docx,.pdf" className="hidden" onChange={handleImportResume} />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>导入
              </label>
              <button onClick={() => { setImportText(''); setShowTextImport(true) }} className="btn-pill primary !text-xs !px-3 !py-1.5 inline-flex items-center gap-1.5" title="粘贴文本导入">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/></svg>粘贴
              </button>
              {resumes.length > 0 && <button onClick={() => { setResumeDeleteMode(!resumeDeleteMode); setSelectedResumes([]) }} className={`text-xs px-2 py-1 rounded transition-colors ${resumeDeleteMode ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-gray-600'}`}>{resumeDeleteMode ? '完成' : '批量删除'}</button>}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {resumes.map(r => (
              <div key={r.id} onClick={() => { if (!resumeDeleteMode) setActiveResume(r.id) }}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all group ${resumeDeleteMode ? (selectedResumes.includes(r.id) ? 'bg-red-50' : 'hover:bg-gray-100') : 'hover:bg-white hover:shadow-sm'}`}>
                {resumeDeleteMode ? <input type="checkbox" checked={selectedResumes.includes(r.id)} onChange={() => setSelectedResumes(prev => prev.includes(r.id) ? prev.filter(id => id !== r.id) : [...prev, r.id])} className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-400" />
                  : <i className="ph-light ph-file-text text-base text-teal-500"></i>}
                <span className="flex-1 text-sm text-gray-700 truncate">{r.title}</span>
                {!resumeDeleteMode && <button onClick={(e) => { e.stopPropagation(); setPendingDeleteId(r.id); setShowDeleteConfirm(true) }} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all"><i className="ph-light ph-trash text-sm"></i></button>}
              </div>
            ))}
            {resumes.length === 0 && <p className="text-xs text-gray-400 text-center py-8">暂无简历</p>}
          </div>
          {resumeDeleteMode && selectedResumes.length > 0 && (
            <div className="p-3 border-t">
              <button onClick={() => { setPendingDeleteId('batch'); setShowDeleteConfirm(true) }} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>删除选中 ({selectedResumes.length})</button>
            </div>
          )}
        </div>
        <div className="flex-1"><EmptyState onCreate={async () => { const r = await createResume(); if (r) toast.success('已创建新简历') }} /></div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteConfirm(false)}>
            <div className="bg-white rounded-xl p-6 w-80 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><i className="ph-light ph-warning-circle text-xl text-red-500"></i></div><h3 className="text-lg font-semibold text-gray-800">确认删除</h3></div>
              <p className="text-sm text-gray-600 mb-1">{pendingDeleteId === 'batch' ? `确定要删除选中的 ${selectedResumes.length} 份简历吗？` : pendingDeleteId ? '确定要删除这份简历吗？' : `确定要删除以下 ${selectedForDelete.length} 个版块吗？`}</p>
              <p className="text-xs text-gray-400 mb-4">此操作不可撤销。</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">取消</button>
                <button onClick={confirmDelete} className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600">删除</button>
              </div>
            </div>
          </div>
        )}

        {importLoading && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-8 flex flex-col items-center gap-4">
              <svg className="animate-spin h-8 w-8 text-teal-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              <p className="text-sm text-slate-600">{importStatus || '正在解析...'}</p>
            </div>
          </div>
        )}

        {showTextImport && !importLoading && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-[640px] max-w-[90vw] max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b"><h3 className="font-semibold text-slate-800">导入简历文本</h3>
                <button onClick={() => setShowTextImport(false)} className="text-slate-400 hover:text-slate-600"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
              </div>
              <div className="flex-1 p-6 overflow-auto">
                <p className="text-xs text-slate-500 mb-3">请确认提取的文本无误，也可直接粘贴完整简历文本，然后点击 "AI 解析"。</p>
                <textarea className="w-full h-[300px] border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-teal-300" value={importText} onChange={e => setImportText(e.target.value)} placeholder="在此粘贴简历文本..." />
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50 rounded-b-xl">
                <button onClick={() => setShowTextImport(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">取消</button>
                <button onClick={handleParseText} disabled={!importText.trim()} className="px-5 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed">AI 解析</button>
              </div>
            </div>
          </div>
        )}

        {importReviewData && <ImportReviewModal data={importReviewData} onConfirm={handleImportConfirm} onCancel={() => setImportReviewData(null)} />}
      </div>
    )
  }

  const sortedSections = [...activeResume.sections].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="flex h-full">
      <EditorSidebar width={sidebarWidth} sortedSections={sortedSections} deleteMode={deleteMode} selectedForDelete={selectedForDelete}
        showAddDropdown={showAddDropdown} setDeleteMode={setDeleteMode} setSelectedForDelete={setSelectedForDelete}
        setShowDeleteConfirm={setShowDeleteConfirm} setShowAddDropdown={setShowAddDropdown} handleDragEnd={handleDragEnd}
        toggleSelectForDelete={toggleSelectForDelete} handleToggleVisibility={handleToggleVisibility}
        handleDeleteSelected={handleDeleteSelected} addSection={addSection} />
      <div ref={leftDiv.ref} className={`w-1 shrink-0 cursor-col-resize hover:bg-[#D4875E] active:bg-[#D4875E] transition-colors ${leftDiv.drag ? 'bg-[#D4875E]' : 'bg-gray-200'}`} />
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-white shrink-0">
          <span className="text-sm font-medium text-gray-700">{activeResume.title}</span>
          <button onClick={() => setShowProps(true)} className="btn-pill primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            保存简历
          </button>
        </div>
        <EditorCenter activeResume={activeResume} sortedSections={sortedSections}
          updateSectionContent={updateSectionContent}
          onTemplateChange={(id) => updateResume(activeResume.id, { template: id })} />
      </div>
      {showProps && <PropertiesModal activeResume={activeResume} templateOptions={templateOptions}
        updateResume={updateResume} handleExport={handleExport} onClose={() => setShowProps(false)} />}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><i className="ph-light ph-warning-circle text-xl text-red-500"></i></div><h3 className="text-lg font-semibold text-gray-800">确认删除</h3></div>
            <p className="text-sm text-gray-600 mb-1">{pendingDeleteId === 'batch' ? `确定要删除选中的 ${selectedResumes.length} 份简历吗？` : pendingDeleteId ? '确定要删除这份简历吗？' : `确定要删除以下 ${selectedForDelete.length} 个版块吗？`}</p>
            <p className="text-xs text-gray-400 mb-4">此操作不可撤销。</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={confirmDelete} className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600">删除</button>
            </div>
          </div>
        </div>
      )}

      {importLoading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 flex flex-col items-center gap-4">
            <svg className="animate-spin h-8 w-8 text-teal-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            <p className="text-sm text-slate-600">{importStatus || '正在解析...'}</p>
          </div>
        </div>
      )}

      {showTextImport && !importLoading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[640px] max-w-[90vw] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b"><h3 className="font-semibold text-slate-800">导入简历文本</h3>
              <button onClick={() => setShowTextImport(false)} className="text-slate-400 hover:text-slate-600"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
            <div className="flex-1 p-6 overflow-auto">
              <p className="text-xs text-slate-500 mb-3">请确认提取的文本无误，也可直接粘贴完整简历文本，然后点击 "AI 解析"。</p>
              <textarea className="w-full h-[300px] border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-teal-300" value={importText} onChange={e => setImportText(e.target.value)} placeholder="在此粘贴简历文本..." />
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50 rounded-b-xl">
              <button onClick={() => setShowTextImport(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">取消</button>
              <button onClick={handleParseText} disabled={!importText.trim()} className="px-5 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed">AI 解析</button>
            </div>
          </div>
        </div>
      )}

      {importReviewData && <ImportReviewModal data={importReviewData} onConfirm={handleImportConfirm} onCancel={() => setImportReviewData(null)} />}
    </div>
  )
}

export default Editor
