import { useState } from 'react';
import toast from '@/lib/toast';
import { useCompanyWatchlistStore } from '@/stores/companyWatchlistStore';
import type { Company } from '@/stores/companyWatchlistStore';

const inputCls =
  'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-white';
const labelCls = 'block text-xs font-medium text-slate-500 mb-1';

const statusLabels: Record<Company['status'], string> = {
  watching: '观察中',
  applied: '已投递',
  interviewing: '面试中',
};

const statusColors: Record<Company['status'], string> = {
  watching: 'bg-slate-100 text-slate-600',
  applied: 'bg-blue-50 text-blue-600',
  interviewing: 'bg-amber-50 text-amber-600',
};

const CompanyWatchlist: React.FC = () => {
  const { companies, addCompany, updateCompany, removeCompany } = useCompanyWatchlistStore();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // form state
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<Company['status']>('watching');

  const resetForm = () => {
    setName('');
    setIndustry('');
    setReason('');
    setStatus('watching');
    setEditingId(null);
  };

  const openEdit = (c: Company) => {
    setName(c.name);
    setIndustry(c.industry);
    setReason(c.reason);
    setStatus(c.status);
    setEditingId(c.id);
    setShowForm(true);
    setDeleteConfirm(null);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.warning('请输入公司名称');
      return;
    }
    if (!industry.trim()) {
      toast.warning('请输入所属行业');
      return;
    }

    if (editingId) {
      updateCompany(editingId, { name: name.trim(), industry: industry.trim(), reason: reason.trim(), status });
      toast.success('已更新');
    } else {
      addCompany({ name: name.trim(), industry: industry.trim(), reason: reason.trim(), status });
      toast.success('已添加关注');
    }

    resetForm();
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    removeCompany(id);
    setDeleteConfirm(null);
    toast.info('已删除');
  };

  return (
    <div>
      {/* add button */}
      {!showForm && (
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="mb-5 px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
        >
          + 添加公司
        </button>
      )}

      {/* inline form */}
      {showForm && (
        <div className="mb-5 p-5 bg-white rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            {editingId ? '编辑公司' : '添加关注公司'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className={labelCls}>公司名称 *</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="公司名" />
            </div>
            <div>
              <label className={labelCls}>所属行业 *</label>
              <input className={inputCls} value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="例如 互联网/金融" />
            </div>
            <div>
              <label className={labelCls}>状态</label>
              <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as Company['status'])}>
                <option value="watching">观察中</option>
                <option value="applied">已投递</option>
                <option value="interviewing">面试中</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <label className={labelCls}>关注原因</label>
              <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="为什么关注这家公司" />
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
      {companies.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-sm">还没有关注的公司</p>
        </div>
      )}

      {/* company list */}
      <div className="space-y-3">
        {companies.map((c) => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h4 className="text-base font-semibold text-slate-700">{c.name}</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status]}`}>
                    {statusLabels[c.status]}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-600">
                    {c.industry}
                  </span>
                </div>
                {c.reason && <p className="text-sm text-slate-400 leading-relaxed">{c.reason}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(c)}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  编辑
                </button>
                {deleteConfirm === c.id ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-red-400">确认?</span>
                    <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">是</button>
                    <button onClick={() => setDeleteConfirm(null)} className="text-xs text-slate-400 hover:text-slate-600">否</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(c.id)}
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

export default CompanyWatchlist;
