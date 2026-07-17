import { useState, useMemo } from 'react';
import toast from '@/lib/toast';
import { useInterviewCalendarStore } from '@/stores/interviewCalendarStore';
import type { Interview } from '@/stores/interviewCalendarStore';

const inputCls =
  'w-full px-3 py-2 text-sm border border-[rgba(0,0,0,0.10)] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-white';
const labelCls = 'block text-xs font-medium text-slate-500 mb-1';

const typeLabels: Record<Interview['type'], string> = {
  phone: '电话',
  video: '视频',
  onsite: '现场',
};

const typeColors: Record<Interview['type'], string> = {
  phone: 'bg-cyan-50 text-cyan-600',
  video: 'bg-purple-50 text-purple-600',
  onsite: 'bg-orange-50 text-orange-600',
};

const statusLabels: Record<Interview['status'], string> = {
  pending: '待确认',
  confirmed: '已确认',
  done: '已完成',
};

const statusColors: Record<Interview['status'], string> = {
  pending: 'bg-slate-100 text-slate-600',
  confirmed: 'bg-blue-50 text-blue-600',
  done: 'bg-green-50 text-green-600',
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${month}月${day}日 ${hh}:${mm}`;
}

const InterviewCalendar: React.FC = () => {
  const { interviews, addInterview, updateInterview, removeInterview } = useInterviewCalendarStore();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // form state
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [type, setType] = useState<Interview['type']>('video');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Interview['status']>('pending');

  const resetForm = () => {
    setCompany('');
    setRole('');
    setDateTime('');
    setType('video');
    setNotes('');
    setStatus('pending');
    setEditingId(null);
  };

  const openEdit = (item: Interview) => {
    setCompany(item.company);
    setRole(item.role);
    // Convert ISO to datetime-local value
    const d = new Date(item.dateTime);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setDateTime(local);
    setType(item.type);
    setNotes(item.notes);
    setStatus(item.status);
    setEditingId(item.id);
    setShowForm(true);
    setDeleteConfirm(null);
  };

  const handleSubmit = () => {
    if (!company.trim()) {
      toast.warning('请输入公司名称');
      return;
    }
    if (!role.trim()) {
      toast.warning('请输入职位名称');
      return;
    }
    if (!dateTime) {
      toast.warning('请选择面试时间');
      return;
    }

    const isoDateTime = new Date(dateTime).toISOString();

    if (editingId) {
      updateInterview(editingId, {
        company: company.trim(),
        role: role.trim(),
        dateTime: isoDateTime,
        type,
        notes: notes.trim(),
        status,
      });
      toast.success('已更新');
    } else {
      addInterview({
        company: company.trim(),
        role: role.trim(),
        dateTime: isoDateTime,
        type,
        notes: notes.trim(),
        status,
      });
      toast.success('已添加面试');
    }

    resetForm();
    setShowForm(false);
  };

  const handleMarkDone = (id: string) => {
    updateInterview(id, { status: 'done' });
    toast.success('已标记为已完成');
  };

  const handleDelete = (id: string) => {
    removeInterview(id);
    setDeleteConfirm(null);
    toast.info('已删除');
  };

  // sorted interviews by dateTime ascending
  const sorted = useMemo(
    () => [...interviews].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()),
    [interviews],
  );

  return (
    <div>
      {/* add button */}
      {!showForm && (
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="mb-5 px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
        >
          + 添加面试
        </button>
      )}

      {/* inline form */}
      {showForm && (
        <div className="mb-5 p-5 bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.06)]">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            {editingId ? '编辑面试' : '添加面试'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className={labelCls}>公司 *</label>
              <input className={inputCls} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="公司名称" />
            </div>
            <div>
              <label className={labelCls}>职位 *</label>
              <input className={inputCls} value={role} onChange={(e) => setRole(e.target.value)} placeholder="职位名称" />
            </div>
            <div>
              <label className={labelCls}>面试时间 *</label>
              <input className={inputCls} type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>面试类型</label>
              <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as Interview['type'])}>
                <option value="phone">电话</option>
                <option value="video">视频</option>
                <option value="onsite">现场</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>状态</label>
              <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as Interview['status'])}>
                <option value="pending">待确认</option>
                <option value="confirmed">已确认</option>
                <option value="done">已完成</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className={labelCls}>备注</label>
              <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="面试注意事项、联系人等" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors">
              {editingId ? '保存' : '添加'}
            </button>
            <button onClick={() => { resetForm(); setShowForm(false); }} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
              取消
            </button>
          </div>
        </div>
      )}

      {/* empty state */}
      {sorted.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-sm">还没有面试安排</p>
        </div>
      )}

      {/* interview list */}
      <div className="space-y-3">
        {sorted.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.06)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span className="text-sm font-semibold text-amber-600 whitespace-nowrap">
                    {formatDateTime(item.dateTime)}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[item.type]}`}>
                    {typeLabels[item.type]}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                    {statusLabels[item.status]}
                  </span>
                </div>
                <h4 className="text-base font-semibold text-slate-700">
                  {item.company}
                  <span className="text-sm font-normal text-slate-400 ml-2">{item.role}</span>
                </h4>
                {item.notes && (
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">{item.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {item.status !== 'done' && (
                  <button
                    onClick={() => handleMarkDone(item.id)}
                    className="text-xs text-green-500 hover:text-green-700 transition-colors"
                  >
                    标记完成
                  </button>
                )}
                <button
                  onClick={() => openEdit(item)}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  编辑
                </button>
                {deleteConfirm === item.id ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-red-400">确认?</span>
                    <button onClick={() => handleDelete(item.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">是</button>
                    <button onClick={() => setDeleteConfirm(null)} className="text-xs text-slate-400 hover:text-slate-600">否</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(item.id)}
                    className="text-xs text-red-300 hover:text-red-500 transition-colors"
                  >
                    删除
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterviewCalendar;
