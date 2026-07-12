import React, { useState } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ParsedResumeData {
  title: string
  personal: Record<string, string>
  summary: { text: string }
  experience: { items: Record<string, string>[] }
  education: { items: Record<string, string>[] }
  skills: { skills: string[] }
  projects: { items: Record<string, string>[] }
  certifications: { items: Record<string, string>[] }
}

interface Props {
  data: ParsedResumeData
  onConfirm: (data: ParsedResumeData) => void
  onCancel: () => void
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export default function ImportReviewModal({ data, onConfirm, onCancel }: Props) {
  const [form, setForm] = useState<ParsedResumeData>(() => JSON.parse(JSON.stringify(data)))
  const [tab, setTab] = useState<string>('personal')

  const updatePersonal = (key: string, value: string) =>
    setForm(f => ({ ...f, personal: { ...f.personal, [key]: value } }))

  const updateSummary = (value: string) =>
    setForm(f => ({ ...f, summary: { text: value } }))

  const updateExpItem = (idx: number, key: string, value: string) => {
    setForm(f => {
      const items = [...f.experience.items]
      items[idx] = { ...items[idx], [key]: value }
      return { ...f, experience: { items } }
    })
  }

  const addExpItem = () =>
    setForm(f => ({ ...f, experience: { items: [...f.experience.items, { company: '', role: '', startDate: '', endDate: '', description: '' }] } }))

  const removeExpItem = (idx: number) =>
    setForm(f => ({ ...f, experience: { items: f.experience.items.filter((_, i) => i !== idx) } }))

  const updateEduItem = (idx: number, key: string, value: string) => {
    setForm(f => {
      const items = [...f.education.items]
      items[idx] = { ...items[idx], [key]: value }
      return { ...f, education: { items } }
    })
  }

  const addEduItem = () =>
    setForm(f => ({ ...f, education: { items: [...f.education.items, { school: '', degree: '', major: '', startDate: '', endDate: '' }] } }))

  const removeEduItem = (idx: number) =>
    setForm(f => ({ ...f, education: { items: f.education.items.filter((_, i) => i !== idx) } }))

  const updateSkill = (value: string) =>
    setForm(f => ({ ...f, skills: { skills: value.split(',').map(s => s.trim()).filter(Boolean) } }))

  const updateProjItem = (idx: number, key: string, value: string) => {
    setForm(f => {
      const items = [...f.projects.items]
      items[idx] = { ...items[idx], [key]: value }
      return { ...f, projects: { items } }
    })
  }

  const addProjItem = () =>
    setForm(f => ({ ...f, projects: { items: [...f.projects.items, { name: '', role: '', tech: '', description: '' }] } }))

  const removeProjItem = (idx: number) =>
    setForm(f => ({ ...f, projects: { items: f.projects.items.filter((_, i) => i !== idx) } }))

  const updateCertItem = (idx: number, key: string, value: string) => {
    setForm(f => {
      const items = [...f.certifications.items]
      items[idx] = { ...items[idx], [key]: value }
      return { ...f, certifications: { items } }
    })
  }

  const addCertItem = () =>
    setForm(f => ({ ...f, certifications: { items: [...f.certifications.items, { name: '', issuer: '', date: '' }] } }))

  const removeCertItem = (idx: number) =>
    setForm(f => ({ ...f, certifications: { items: f.certifications.items.filter((_, i) => i !== idx) } }))

  const tabs = [
    { id: 'personal', label: '个人信息' },
    { id: 'summary', label: '个人简介' },
    { id: 'experience', label: '工作经历' },
    { id: 'education', label: '教育背景' },
    { id: 'skills', label: '专业技能' },
    { id: 'projects', label: '项目经历' },
    { id: 'certifications', label: '证书' },
  ]

  const inputClass = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300'
  const labelClass = 'block text-xs text-gray-500 mb-1 font-medium'
  const removeBtnClass = 'absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors'

  const badgeCount = (id: string) => {
    switch (id) {
      case 'experience': return form.experience.items.length
      case 'education': return form.education.items.length
      case 'skills': return form.skills.skills.length
      case 'projects': return form.projects.items.length
      case 'certifications': return form.certifications.items.length
      default: return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl w-[640px] max-h-[85vh] flex flex-col mx-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">导入简历验证</h2>
            <p className="text-xs text-gray-400 mt-0.5">请确认 AI 解析的字段，修改后点击确认创建</p>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
            <i className="ph-light ph-x text-lg" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-4 pt-3 pb-2 overflow-x-auto border-b border-slate-100">
          {tabs.map(t => {
            const count = badgeCount(t.id)
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  tab === t.id ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {t.label}
                {count !== null && (
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                    tab === t.id ? 'bg-teal-200 text-teal-800' : 'bg-gray-200 text-gray-500'
                  }`}>{count}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Resume title */}
          <div>
            <label className={labelClass}>简历标题</label>
            <input className={inputClass} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="简历标题" />
          </div>

          {tab === 'personal' && (
            <div className="grid grid-cols-2 gap-3">
              {[['name', '姓名'], ['title', '求职意向'], ['email', '邮箱'], ['phone', '电话'], ['location', '地址']].map(([key, label]) => (
                <div key={key} className={key === 'location' ? 'col-span-2' : ''}>
                  <label className={labelClass}>{label}</label>
                  <input className={inputClass} value={form.personal[key] || ''} onChange={e => updatePersonal(key, e.target.value)} placeholder={`请输入${label}`} />
                </div>
              ))}
            </div>
          )}

          {tab === 'summary' && (
            <div>
              <label className={labelClass}>个人简介</label>
              <textarea className={`${inputClass} min-h-[120px] resize-y`} value={form.summary.text} onChange={e => updateSummary(e.target.value)} placeholder="请输入个人简介" />
            </div>
          )}

          {tab === 'experience' && (
            <div className="space-y-3">
              {form.experience.items.map((item, idx) => (
                <div key={idx} className="relative border rounded-lg pt-6 p-3 space-y-2">
                  <button onClick={() => removeExpItem(idx)} className={removeBtnClass} title="删除此项">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <input className="border rounded px-2 py-1.5 text-sm" value={item.company || ''} onChange={e => updateExpItem(idx, 'company', e.target.value)} placeholder="公司名称" />
                    <input className="border rounded px-2 py-1.5 text-sm" value={item.role || ''} onChange={e => updateExpItem(idx, 'role', e.target.value)} placeholder="职位" />
                    <input type="date" className="border rounded px-2 py-1.5 text-sm" value={item.startDate || ''} onChange={e => updateExpItem(idx, 'startDate', e.target.value)} />
                    <input type="date" className="border rounded px-2 py-1.5 text-sm" value={item.endDate || ''} onChange={e => updateExpItem(idx, 'endDate', e.target.value)} />
                  </div>
                  <textarea className="w-full border rounded px-2 py-1.5 text-sm min-h-[60px] resize-y" value={item.description || ''} onChange={e => updateExpItem(idx, 'description', e.target.value)} placeholder="工作描述" />
                </div>
              ))}
              <button onClick={addExpItem} className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700">
                <i className="ph-light ph-plus text-base" /> 添加工作经历
              </button>
            </div>
          )}

          {tab === 'education' && (
            <div className="space-y-3">
              {form.education.items.map((item, idx) => (
                <div key={idx} className="relative border rounded-lg pt-6 p-3 space-y-2">
                  <button onClick={() => removeEduItem(idx)} className={removeBtnClass} title="删除此项">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <input className="border rounded px-2 py-1.5 text-sm" value={item.school || ''} onChange={e => updateEduItem(idx, 'school', e.target.value)} placeholder="学校名称" />
                    <select value={item.degree || ''} onChange={e => updateEduItem(idx, 'degree', e.target.value)} className="border rounded px-2 py-1.5 text-sm bg-white">
                      <option value="">选择学历</option>
                      <option value="博士">博士</option>
                      <option value="硕士">硕士</option>
                      <option value="本科">本科</option>
                      <option value="大专">大专</option>
                      <option value="高中">高中</option>
                    </select>
                  </div>
                  <input className="w-full border rounded px-2 py-1.5 text-sm" value={item.major || ''} onChange={e => updateEduItem(idx, 'major', e.target.value)} placeholder="专业" />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-400 mb-1">开始时间</label>
                      <input type="date" className="w-full border rounded px-2 py-1.5 text-sm" value={item.startDate || ''} onChange={e => updateEduItem(idx, 'startDate', e.target.value)} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-400 mb-1">结束时间</label>
                      <input type="date" className="w-full border rounded px-2 py-1.5 text-sm" value={item.endDate || ''} onChange={e => updateEduItem(idx, 'endDate', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addEduItem} className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700">
                <i className="ph-light ph-plus text-base" /> 添加教育经历
              </button>
            </div>
          )}

          {tab === 'skills' && (
            <div>
              <label className={labelClass}>技能（逗号分隔）</label>
              <textarea className={`${inputClass} min-h-[80px] resize-y`} value={form.skills.skills.join(', ')} onChange={e => updateSkill(e.target.value)} placeholder="JavaScript, TypeScript, React, Node.js" />
              {form.skills.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.skills.skills.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm">{s}
                      <button onClick={() => setForm(f => ({ ...f, skills: { skills: f.skills.skills.filter((_, j) => j !== i) } }))} className="hover:text-red-500">
                        <i className="ph-light ph-x text-sm" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'projects' && (
            <div className="space-y-3">
              {form.projects.items.map((item, idx) => (
                <div key={idx} className="relative border rounded-lg pt-6 p-3 space-y-2">
                  <button onClick={() => removeProjItem(idx)} className={removeBtnClass} title="删除此项">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <input className="border rounded px-2 py-1.5 text-sm" value={item.name || ''} onChange={e => updateProjItem(idx, 'name', e.target.value)} placeholder="项目名称" />
                    <input className="border rounded px-2 py-1.5 text-sm" value={item.role || ''} onChange={e => updateProjItem(idx, 'role', e.target.value)} placeholder="担任角色" />
                    <input className="border rounded px-2 py-1.5 text-sm" value={item.tech || ''} onChange={e => updateProjItem(idx, 'tech', e.target.value)} placeholder="使用技术" />
                    <input className="border rounded px-2 py-1.5 text-sm" value={item.link || ''} onChange={e => updateProjItem(idx, 'link', e.target.value)} placeholder="项目链接" />
                  </div>
                  <textarea className="w-full border rounded px-2 py-1.5 text-sm min-h-[60px] resize-y" value={item.description || ''} onChange={e => updateProjItem(idx, 'description', e.target.value)} placeholder="项目描述" />
                </div>
              ))}
              <button onClick={addProjItem} className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700">
                <i className="ph-light ph-plus text-base" /> 添加项目
              </button>
            </div>
          )}

          {tab === 'certifications' && (
            <div className="space-y-3">
              {form.certifications.items.map((item, idx) => (
                <div key={idx} className="relative border rounded-lg pt-6 p-3 space-y-2">
                  <button onClick={() => removeCertItem(idx)} className={removeBtnClass} title="删除此项">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <input className="border rounded px-2 py-1.5 text-sm" value={item.name || ''} onChange={e => updateCertItem(idx, 'name', e.target.value)} placeholder="证书名称" />
                    <input className="border rounded px-2 py-1.5 text-sm" value={item.issuer || ''} onChange={e => updateCertItem(idx, 'issuer', e.target.value)} placeholder="颁发机构" />
                    <input type="date" className="border rounded px-2 py-1.5 text-sm" value={item.date || ''} onChange={e => updateCertItem(idx, 'date', e.target.value)} />
                  </div>
                </div>
              ))}
              <button onClick={addCertItem} className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700">
                <i className="ph-light ph-plus text-base" /> 添加证书
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">取消</button>
          <button onClick={() => onConfirm(form)} className="px-4 py-2 text-sm rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition-colors">确认创建简历</button>
        </div>
      </div>
    </div>
  )
}
