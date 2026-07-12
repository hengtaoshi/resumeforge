import { useEffect, useState, useCallback } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import toast from '@/lib/toast'

// ── Types ──
type DeliveryStatus = 'applied' | 'interviewing' | 'offer' | 'rejected'

interface DeliveryItem {
  id: string
  company: string
  role: string
  url: string | null
  status: DeliveryStatus
  interview_at: string | null
  offer_at: string | null
  rejected_at: string | null
  note: string | null
  created_at: string
}

interface KanbanCardProps {
  item: DeliveryItem
  isDragOverlay?: boolean
}

// ── Helpers ──
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} 个月前`
  return `${Math.floor(months / 12)} 年前`
}

const COLUMNS: Record<DeliveryStatus, { title: string; accent: string; bg: string; icon: string }> = {
  applied:     { title: '已投递',     accent: 'border-t-violet-400', bg: 'bg-violet-50',   icon: 'ph-paper-plane' },
  interviewing:{ title: '面试中',     accent: 'border-t-amber-400', bg: 'bg-amber-50',    icon: 'ph-chats' },
  offer:       { title: 'Offer',      accent: 'border-t-emerald-400', bg: 'bg-emerald-50', icon: 'ph-check-circle' },
  rejected:    { title: '未通过',     accent: 'border-t-slate-400', bg: 'bg-slate-50',    icon: 'ph-x-circle' },
}

// ── Draggable Card ──
function KanbanCard({ item, isDragOverlay }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { status: item.status },
  })

  const style: React.CSSProperties = isDragOverlay
    ? { transform: 'rotate(3deg)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }
    : transform
      ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 20, opacity: 0.8 }
      : {}

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`bg-white rounded-lg border border-slate-200 p-3 cursor-grab active:cursor-grabbing
        hover:shadow-md transition-shadow duration-150 ${isDragging ? 'shadow-lg' : ''} ${isDragOverlay ? '' : ''}`}
    >
      <p className="text-sm font-medium text-slate-800 truncate">{item.company}</p>
      <p className="text-xs text-slate-500 truncate mt-0.5">{item.role}</p>
      <p className="text-[11px] text-slate-400 mt-1.5">{relativeTime(item.created_at)}</p>
    </div>
  )
}

// ── Droppable Column ──
function KanbanColumn({ status, items, onCardClick }: {
  status: DeliveryStatus
  items: DeliveryItem[]
  onCardClick: (item: DeliveryItem) => void
}) {
  const col = COLUMNS[status]
  const { isOver, setNodeRef } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-0 flex flex-col rounded-xl border border-slate-200 bg-slate-50/50
        ${isOver ? 'ring-2 ring-sky-400 ring-offset-2 bg-sky-50/30' : ''} transition-all duration-150`}
    >
      {/* Column header */}
      <div className={`flex items-center gap-2 px-4 py-3 border-b border-slate-200 ${col.accent} border-t-[3px] rounded-t-xl bg-white`}>
        <i className={`ph-light ${col.icon} text-sm ${col.bg} p-1.5 rounded-md`} />
        <span className="text-sm font-semibold text-slate-700">{col.title}</span>
        <span className="ml-auto text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{items.length}</span>
      </div>
      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 py-8">
            <i className={`ph-light ${col.icon} text-2xl mb-2 opacity-40`} />
            <p className="text-xs">拖拽卡片到此处</p>
          </div>
        ) : items.map(item => (
          <div key={item.id} onClick={() => onCardClick(item)}>
            <KanbanCard item={item} />
          </div>
        ))}
        {/* Drag over target ghost zone */}
        {isOver && items.length === 0 && (
          <div className="h-20 rounded-lg border-2 border-dashed border-sky-300 bg-sky-50/50" />
        )}
      </div>
    </div>
  )
}

// ── Detail Modal ──
function DetailModal({ item, onClose, onUpdated }: { item: DeliveryItem; onClose: () => void; onUpdated: () => void }) {
  const [company, setCompany] = useState(item.company)
  const [role, setRole] = useState(item.role)
  const [url, setUrl] = useState(item.url ?? '')
  const [note, setNote] = useState(item.note ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!company.trim() || !role.trim()) return toast.warning('公司名和职位不能为空')
    setSaving(true)
    try {
      await window.electronAPI!.updateDelivery(item.id, {
        company: company.trim(),
        role: role.trim(),
        url: url.trim() || null,
        note: note.trim() || null,
      })
      toast.success('已更新')
      onUpdated()
      onClose()
    } catch { toast.error('保存失败') }
    setSaving(false)
  }

  const statusLabel = COLUMNS[item.status]?.title ?? item.status

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-[480px] mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">投递详情</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
            <i className="ph-light ph-x text-lg" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-3">
          {/* Status tag */}
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${COLUMNS[item.status]?.bg} text-slate-600`}>
              {statusLabel}
            </span>
            <span className="text-xs text-slate-400">创建于 {new Date(item.created_at).toLocaleDateString('zh-CN')}</span>
          </div>
          <input value={company} onChange={e => setCompany(e.target.value)} placeholder="公司名称"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-teal-400 transition-colors" />
          <input value={role} onChange={e => setRole(e.target.value)} placeholder="职位"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-teal-400 transition-colors" />
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="投递链接（选填）"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-teal-400 transition-colors" />
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="备注（选填）" rows={3}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-teal-400 transition-colors resize-none" />
          {/* Timestamps */}
          <div className="text-xs text-slate-400 space-y-1 pt-1">
            {item.interview_at && <p>进入面试：{new Date(item.interview_at).toLocaleString('zh-CN')}</p>}
            {item.offer_at && <p>获得 Offer：{new Date(item.offer_at).toLocaleString('zh-CN')}</p>}
            {item.rejected_at && <p>未通过：{new Date(item.rejected_at).toLocaleString('zh-CN')}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors">取消</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 disabled:opacity-50 transition-colors">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──
export default function Kanban() {
  const [items, setItems] = useState<DeliveryItem[]>([])
  const [activeItem, setActiveItem] = useState<DeliveryItem | null>(null)
  const [detailItem, setDetailItem] = useState<DeliveryItem | null>(null)

  const load = useCallback(() => {
    window.electronAPI!.getDeliveries()
      .then((dels: DeliveryItem[]) => setItems(dels))
      .catch(() => {})
  }, [])

  useEffect(() => { load() }, [load])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragStart = (event: any) => {
    const dragged = items.find(i => i.id === event.active.id)
    if (dragged) setActiveItem(dragged)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveItem(null)
    if (!over || active.id === over.id) return

    const overStatus = over.id as DeliveryStatus
    if (!['applied', 'interviewing', 'offer', 'rejected'].includes(overStatus)) return

    const activeData = active.data.current as { status?: DeliveryStatus } | undefined
    if (activeData?.status === overStatus) return

    try {
      await window.electronAPI!.updateDeliveryStatus(active.id as string, overStatus)
      load()
    } catch {
      toast.error('状态更新失败')
    }
  }

  const grouped = {
    applied: items.filter(i => i.status === 'applied'),
    interviewing: items.filter(i => i.status === 'interviewing'),
    offer: items.filter(i => i.status === 'offer'),
    rejected: items.filter(i => i.status === 'rejected'),
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8F7F4]">
      {/* Header */}
      <div className="px-8 pt-8 pb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-600 mb-3">
          <i className="ph-light ph-columns text-sm" />
          求职看板
        </span>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">求职进度看板</h1>
        <p className="text-sm text-slate-500">拖拽卡片到不同列来更新投递状态</p>
      </div>

      {/* Board */}
      <div className="px-8 pb-8 h-[calc(100vh-200px)]">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full">
            {(Object.keys(COLUMNS) as DeliveryStatus[]).map(status => (
              <KanbanColumn key={status} status={status} items={grouped[status]} onCardClick={setDetailItem} />
            ))}
          </div>
          <DragOverlay>
            {activeItem ? <KanbanCard item={activeItem} isDragOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {detailItem && (
        <DetailModal item={detailItem} onClose={() => setDetailItem(null)} onUpdated={load} />
      )}
    </div>
  )
}
