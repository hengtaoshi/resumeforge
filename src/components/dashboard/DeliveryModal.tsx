import React, { useState, useEffect } from 'react'
import toast from '@/lib/toast'

interface Delivery { id: string; company: string; role: string; url: string | null; created_at: string }

interface Props { onClose: () => void; onUpdate: () => void }

export default function DeliveryModal({ onClose, onUpdate }: Props) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [url, setUrl] = useState('')
  const [adding, setAdding] = useState(false)

  const load = () => window.electronAPI!.getDeliveries().then(setDeliveries)

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!company.trim() || !role.trim()) return toast.warning('公司名和职位不能为空')
    setAdding(true)
    try {
      await window.electronAPI!.addDelivery({ company: company.trim(), role: role.trim(), url: url.trim() || undefined })
      setCompany(''); setRole(''); setUrl('')
      await load()
      onUpdate()
      toast.success('投递已记录 ✅')
    } catch { toast.error('保存失败') }
    setAdding(false)
  }

  const handleDelete = async (id: string) => {
    await window.electronAPI!.deleteDelivery(id)
    await load()
    onUpdate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-[520px] max-h-[80vh] flex flex-col mx-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold" style={{ color: '#1E293B' }}>投递记录</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
            <i className="ph-light ph-x text-lg" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 pt-4 pb-3 border-b border-slate-100 space-y-3">
          <div className="flex gap-3">
            <input value={company} onChange={e => setCompany(e.target.value)} placeholder="公司名称" maxLength={100}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-accent transition-colors" />
            <input value={role} onChange={e => setRole(e.target.value)} placeholder="职位" maxLength={100}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-accent transition-colors" />
          </div>
          <div className="flex gap-3">
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="投递链接（选填）" maxLength={500}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-accent transition-colors" />
            <button onClick={handleAdd} disabled={adding}
              className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors whitespace-nowrap">
              {adding ? '保存中...' : '新增投递'}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {deliveries.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">还没有投递记录</p>
          ) : deliveries.map(d => (
            <div key={d.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 group">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                <i className="ph-light ph-paper-plane text-sm text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{d.company} <span className="text-slate-400 font-normal">· {d.role}</span></p>
                {d.url && <a href={d.url} target="_blank" rel="noreferrer" className="text-xs text-teal-500 hover:underline truncate block mt-0.5">{d.url}</a>}
                <p className="text-xs text-slate-400 mt-0.5">{new Date(d.created_at).toLocaleDateString('zh-CN')}</p>
              </div>
              <button onClick={() => handleDelete(d.id)} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded hover:bg-red-50 flex items-center justify-center text-slate-300 hover:text-red-400 transition-all">
                <i className="ph-light ph-trash text-sm" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
