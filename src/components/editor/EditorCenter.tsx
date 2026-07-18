import React from 'react'
import type { Resume, ResumeSection } from '@/types/resume'
import ResumePreview from './ResumePreview'
import { SectionContentEditor, SECTION_ICONS, SECTION_LABELS, SECTION_BG_COLORS } from './SectionRenderers'

interface CenterProps {
  activeResume: Resume; sortedSections: ResumeSection[]
  updateSectionContent: (id: string, content: Record<string, any>) => void
  onTemplateChange?: (templateId: string) => void
}

export default function EditorCenter({ activeResume, sortedSections, updateSectionContent, onTemplateChange }: CenterProps) {
  return (
    <div className="flex flex-1 min-w-0">
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-3xl mx-auto p-4 space-y-4">
          {sortedSections.filter(s => s.isVisible).map(section => (
            <div key={section.id} className={`${SECTION_BG_COLORS[section.type]} rounded-xl ${section.type === 'personal' ? 'px-5 pb-5 pt-0' : 'p-5'} relative`}>
              {section.type === 'personal' && (() => {
                const ps = sortedSections.find(s => s.type === 'personal' && s.isVisible);
                const av = ps?.content?.avatar;
                return (<div className="absolute top-0 right-5 z-10">
                  {av ? (<div className="relative group"><img src={av} alt="照片" className="w-[96px] h-[120px] border border-gray-200 shadow-sm object-cover" />
                    <button onClick={() => updateSectionContent(ps!.id, { avatar: '' } as any)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" title="删除照片">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
                  ) : (<label className="cursor-pointer w-[96px] h-[120px] border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center gap-1 hover:border-teal-400 hover:bg-teal-50/30 transition-colors">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f || !ps) return; const r = new FileReader(); r.onload = () => updateSectionContent(ps.id, { avatar: r.result as string } as any); r.readAsDataURL(f) }} />
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <span className="text-[10px] text-gray-400">一寸照片</span></label>)}</div>);
              })()}
              <div className={`flex items-center gap-2 ${section.type === 'personal' ? 'pt-[40px] mb-[58px]' : 'mb-4'}`}>
                <i className={`ph-light ${SECTION_ICONS[section.type]} text-lg text-gray-600`}></i>
                <h4 className="font-semibold text-gray-700">{SECTION_LABELS[section.type]}</h4>
              </div>
              <SectionContentEditor section={section} onUpdate={updateSectionContent} />
            </div>
          ))}
          {sortedSections.filter(s => s.isVisible).length === 0 && (
            <div className="text-center text-gray-400 py-12"><i className="ph-light ph-eye-slash text-4xl mb-2"></i><p className="text-sm">所有版块已隐藏，请在左侧面板显示版块</p></div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-gray-100 border-l">
        <ResumePreview resume={activeResume} onTemplateChange={onTemplateChange} />
      </div>
    </div>
  )
}
