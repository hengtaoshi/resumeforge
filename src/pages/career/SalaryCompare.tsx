import { useState } from 'react';
import { askAI, isAIConfigured } from '@/lib/ai/stream';
import { extractJSON } from '@/lib/ai/provider';
import toast from '@/lib/toast';

interface Offer {
  id: string;
  company: string;
  role: string;
  base: number;
  stock: number;
  bonus: number;
  location: string;
  notes: string;
  industry: string;
  growth: number;
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const inputCls =
  'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-white';
const labelCls = 'block text-xs font-medium text-slate-500 mb-1';

const SalaryCompare: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showForm, setShowForm] = useState(false);

  // form state
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [base, setBase] = useState('');
  const [stock, setStock] = useState('');
  const [bonus, setBonus] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [industry, setIndustry] = useState('');
  const [growth, setGrowth] = useState(3);
  const [viewMonthly, setViewMonthly] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const resetForm = () => {
    setCompany('');
    setRole('');
    setBase('');
    setStock('');
    setBonus('');
    setLocation('');
    setNotes('');
    setIndustry('');
    setGrowth(3);
  };

  const handleAdd = () => {
    if (!company.trim() || !role.trim()) {
      toast.warning('请填写公司和职位');
      return;
    }
    const baseNum = parseFloat(base) || 0;
    const stockNum = parseFloat(stock) || 0;
    const bonusNum = parseFloat(bonus) || 0;

    const offer: Offer = {
      id: genId(),
      company: company.trim(),
      role: role.trim(),
      base: baseNum,
      stock: stockNum,
      bonus: bonusNum,
      location: location.trim(),
      notes: notes.trim(),
      industry: industry.trim(),
      growth,
    };

    setOffers((prev) => [...prev, offer]);
    resetForm();
    setShowForm(false);
    toast.success('已添加薪资对比');
  };

  const handleDelete = (id: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== id));
    toast.info('已删除');
  };

  const formatCurrency = (v: number) =>
    v.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const categories: { key: keyof Pick<Offer, 'base' | 'stock' | 'bonus'>; label: string }[] = [
    { key: 'base', label: '基本薪资' },
    { key: 'stock', label: '股票/期权' },
    { key: 'bonus', label: '奖金' },
  ];

  return (
    <div>
      {/* add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-5 px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
        >
          + 添加 Offer
        </button>
      )}

      {/* inline form */}
      {showForm && (
        <div className="mb-5 p-5 bg-white rounded-xl shadow-sm border border-slate-100">
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
              <label className={labelCls}>基本薪资 (年/元)</label>
              <input className={inputCls} type="number" value={base} onChange={(e) => setBase(e.target.value)} placeholder="例如 300000" />
            </div>
            <div>
              <label className={labelCls}>股票/期权 (年/元)</label>
              <input className={inputCls} type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="例如 50000" />
            </div>
            <div>
              <label className={labelCls}>奖金 (年/元)</label>
              <input className={inputCls} type="number" value={bonus} onChange={(e) => setBonus(e.target.value)} placeholder="例如 60000" />
            </div>
            <div>
              <label className={labelCls}>地点</label>
              <input className={inputCls} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="城市" />
            </div>
            <div>
              <label className={labelCls}>行业</label>
              <input className={inputCls} value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="互联网/金融/制造" />
            </div>
            <div>
              <label className={labelCls}>成长前景</label>
              <select className={inputCls} value={growth} onChange={(e) => setGrowth(Number(e.target.value))}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{'⭐'.repeat(n)}{n <= 2 ? ' 一般' : n === 3 ? ' 中等' : n === 4 ? ' 良好' : ' 优秀'}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>备注</label>
              <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="其他说明" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors">
              添加
            </button>
            <button onClick={() => { resetForm(); setShowForm(false); }} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
              取消
            </button>
          </div>
        </div>
      )}

      {/* empty state */}
      {offers.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-sm">还没有添加 Offer，点击上方按钮开始对比薪资</p>
        </div>
      )}

      {/* toggle + AI */}
      {offers.length > 1 && (
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setViewMonthly(v => !v)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${viewMonthly ? 'bg-amber-500 text-white border-amber-500' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            {viewMonthly ? '年薪' : '月薪'}
          </button>
          <button onClick={async () => {
            if (!isAIConfigured()) { toast.warning('请先配置 AI'); return }
            setAiLoading(true)
            try {
              const text = await askAI([{ role: 'user', content: `你是一位置业顾问。分析以下 Offer 并给出推荐建议（中文，100-200字）：

${offers.map(o => `- ${o.company} ${o.role}: 年包 ${(o.base+o.stock+o.bonus).toLocaleString()}元, 行业=${o.industry || '未知'}, 成长${o.growth}/5星`).join('\n')}

按综合价值排序推荐。`}])
              setAiResult(text)
            } catch (e: any) { toast.error(e?.message || '分析失败') }
            finally { setAiLoading(false) }
          }} disabled={aiLoading}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white transition-colors flex items-center gap-1.5">
            {aiLoading ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
            AI 对比分析
          </button>
        </div>
      )}

      {aiResult && (
        <div className="mb-4 p-4 bg-sky-50 rounded-xl text-sm text-slate-700">{aiResult}</div>
      )}

      {/* comparison table */}
      {offers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-4 py-3 text-slate-400 font-medium w-28">类别</th>
                {offers.map((o) => (
                  <th key={o.id} className="text-left px-4 py-3 font-semibold text-slate-700 min-w-[160px]">
                    <div>{o.company}</div>
                    <div className="text-xs font-normal text-slate-400">{o.role}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.key} className="border-b border-slate-50">
                  <td className="px-4 py-3 text-slate-500">{cat.label}</td>
                  {offers.map((o) => (
                    <td key={o.id} className="px-4 py-3 text-slate-700 font-medium">
                      {formatCurrency(o[cat.key])}
                    </td>
                  ))}
                </tr>
              ))}
              {/* total (annual) */}
              <tr className="bg-amber-50/50">
                <td className="px-4 py-3 font-semibold text-slate-700">年包总计</td>
                {offers.map((o) => (
                  <td key={o.id} className="px-4 py-3 font-bold text-amber-600">
                    {formatCurrency(o.base + o.stock + o.bonus)}
                  </td>
                ))}
              </tr>
              {/* monthly */}
              <tr className="bg-amber-50/50 border-t border-amber-100">
                <td className="px-4 py-3 font-semibold text-slate-700">{viewMonthly ? '月均' : '月均(估)'}</td>
                {offers.map((o) => (
                  <td key={o.id} className="px-4 py-3 font-bold text-amber-600">
                    {formatCurrency(Math.round((o.base + o.stock + o.bonus) / 12))}
                  </td>
                ))}
              </tr>
              {/* industry */}
              <tr className="border-b border-slate-50">
                <td className="px-4 py-3 text-slate-500">行业</td>
                {offers.map((o) => (
                  <td key={o.id} className="px-4 py-3 text-slate-600">{o.industry || '-'}</td>
                ))}
              </tr>
              {/* growth */}
              <tr className="border-b border-slate-50">
                <td className="px-4 py-3 text-slate-500">成长前景</td>
                {offers.map((o) => (
                  <td key={o.id} className="px-4 py-3 text-slate-600">{'⭐'.repeat(o.growth)}</td>
                ))}
              </tr>
              {/* location row */}
              <tr className="border-b border-slate-50">
                <td className="px-4 py-3 text-slate-500">地点</td>
                {offers.map((o) => (
                  <td key={o.id} className="px-4 py-3 text-slate-600">
                    {o.location || '-'}
                  </td>
                ))}
              </tr>
              {/* notes row */}
              <tr>
                <td className="px-4 py-3 text-slate-500">备注</td>
                {offers.map((o) => (
                  <td key={o.id} className="px-4 py-3 text-slate-600 text-xs leading-relaxed whitespace-pre-wrap">
                    {o.notes || '-'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          {/* delete buttons row */}
          <div className="flex border-t border-slate-100 bg-slate-50/50">
            <div className="px-4 py-2 w-28" />
            {offers.map((o) => (
              <div key={o.id} className="px-4 py-2 min-w-[160px]">
                <button
                  onClick={() => handleDelete(o.id)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryCompare;
