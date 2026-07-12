import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import type { AIProviderType } from '@/stores/settingsStore';
// ponytail: test connection goes through IPC to avoid CORS from file://
async function testConnectionIPC(opts: { provider: string; apiKey: string; model: string }) {
  try {
    return !!(await window.electronAPI?.testConnection(opts))
  } catch { return false }
}
import toast from '@/lib/toast';

const Toggle: React.FC<{ active: boolean; onClick: () => void }> = ({ active, onClick }) => (
  <button onClick={onClick} className={`relative w-9 h-5 rounded-full transition-colors shrink-0 border ${active ? 'bg-brand-500 border-brand-500' : 'bg-slate-200 dark:bg-slate-600 border-slate-300 dark:border-slate-500'}`}>
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-4' : ''}`} />
  </button>
);

const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI', anthropic: 'Anthropic', openrouter: 'OpenRouter',
  deepseek: 'DeepSeek', qwen: '通义千问', kimi: 'Kimi', minimax: 'MiniMax', glm: '智谱GLM', doubao: '豆包',
};

const MODELS: Record<string, { value: string; label: string }[]> = {
  openai: [{value:'gpt-4o',label:'GPT-4o'},{value:'gpt-4o-mini',label:'GPT-4o Mini'},{value:'gpt-4-turbo',label:'GPT-4 Turbo'}],
  anthropic: [{value:'claude-sonnet-4-20250514',label:'Claude Sonnet 4'},{value:'claude-3-5-sonnet-20241022',label:'Claude 3.5 Sonnet'},{value:'claude-3-5-haiku-20241022',label:'Claude 3.5 Haiku'}],
  openrouter: [{value:'openai/gpt-4o',label:'GPT-4o'},{value:'anthropic/claude-sonnet-4',label:'Claude Sonnet 4'},{value:'google/gemini-2.0-flash',label:'Gemini 2.0 Flash'},{value:'deepseek/deepseek-chat',label:'DeepSeek Chat'}],
  deepseek: [{value:'deepseek-v4-pro',label:'DeepSeek V4 Pro'},{value:'deepseek-v4-flash',label:'DeepSeek V4 Flash'},{value:'deepseek-v3.2',label:'DeepSeek V3.2'},{value:'deepseek-r1',label:'DeepSeek R1'}],
  qwen: [{value:'qwen3.7-max',label:'Qwen 3.7 Max'},{value:'qwen3.5-flash',label:'Qwen 3.5 Flash'},{value:'qwen3.5-plus',label:'Qwen 3.5 Plus'},{value:'qwen3.5-122b-a10b',label:'Qwen 3.5 122B'}],
  kimi: [{value:'kimi-k2.7-code',label:'Kimi K2.7 Code'},{value:'kimi-k2.6',label:'Kimi K2.6'},{value:'kimi-k2.5',label:'Kimi K2.5'}],
  minimax: [{value:'minimax-m3',label:'MiniMax M3'},{value:'minimax-m2.7',label:'MiniMax M2.7'},{value:'minimax-m2.5',label:'MiniMax M2.5'}],
  glm: [{value:'glm-5.1',label:'GLM 5.1'},{value:'glm-5',label:'GLM 5'},{value:'glm-5-turbo',label:'GLM 5 Turbo'},{value:'glm-4.6',label:'GLM 4.6'}],
  doubao: [{value:'doubao-seed-2-0-pro-260215',label:'豆包2.1 Pro'},{value:'doubao-seed-1-6-251015',label:'豆包1.6'},{value:'doubao-seed-1-6-flash-250828',label:'豆包1.6 Flash'},{value:'doubao-seed-code-preview',label:'豆包 Coding'}],
};

const providerOrder = ['openai','anthropic','deepseek','qwen','kimi','minimax','glm','doubao','openrouter'] as const;

const API_KEY_URLS: Record<string, string> = {
  openai: 'https://platform.openai.com/api-keys',
  anthropic: 'https://console.anthropic.com/settings/keys',
  deepseek: 'https://platform.deepseek.com/api-keys',
  qwen: 'https://www.aliyun.com/product/bailian',
  kimi: 'https://platform.kimi.ai/console/api-keys',
  minimax: 'https://platform.minimaxi.com/user-center/basic-information/interface-key',
  glm: 'https://bigmodel.cn/usercenter/apikeys',
  doubao: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey',
  openrouter: 'https://openrouter.ai/keys',
};

const Settings: React.FC = () => {
  const { aiProvider, apiKeys, model, theme, language, defaultTemplate, autoSave, exportLimit,
    setApiKey, setProvider, setModel, toggleTheme, setLanguage, setDefaultTemplate, setAutoSave, setExportLimit } = useSettingsStore();
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const currentKey = apiKeys[aiProvider];

  // Apply dark mode class to html element
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const testConn = async () => {
    if (!currentKey) { toast.warning('请先输入 API 密钥'); return }
    setTesting(true);
    try {
      if (await testConnectionIPC({ provider: aiProvider, apiKey: currentKey, model }))
        toast.success(`${PROVIDER_LABELS[aiProvider]} 连接成功`);
      else toast.error('连接失败，请检查密钥');
    } catch { toast.error('连接测试失败'); }
    finally { setTesting(false); }
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-[#F8F7F4] dark:bg-slate-900 h-full">
      <div className="mb-3">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 mb-2">
          <i className="ph-light ph-gear-six text-sm" /> Settings
        </span>
        <h1 className="text-xl font-bold font-display text-slate-800">设置</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 col-span-2">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
            <i className="ph-light ph-cpu text-brand-500" /> AI 提供商
          </h2>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {providerOrder.map(p => (
              <button key={p} onClick={() => setProvider(p)}
                className={`px-2.5 py-1 rounded-md text-sm font-medium transition-colors ${
                  aiProvider === p ? 'bg-teal-500 text-white shadow-sm' : 'bg-slate-50 text-slate-500 dark:text-slate-400 border border-slate-200 hover:bg-slate-100'
                }`}>{PROVIDER_LABELS[p]}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={model} onChange={e => setModel(e.target.value)}
              className="text-sm px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
              {(MODELS[aiProvider] || []).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <input type={showKey ? 'text' : 'password'} value={currentKey || ''}
                onChange={e => setApiKey(aiProvider, e.target.value)}
                placeholder={`输入 ${PROVIDER_LABELS[aiProvider]} API Key`}
                className="w-full text-sm px-2.5 py-1.5 rounded-md border border-slate-200 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-500 outline-none focus:border-brand-300"/>
              <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 dark:text-slate-400">
                <i className={`ph-light text-sm ${showKey ? 'ph-eye-slash' : 'ph-eye'}`} />
              </button>
            </div>
            <button onClick={testConn} disabled={!currentKey || testing}
              className="text-sm px-2.5 py-1.5 rounded-md border border-slate-200 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 shrink-0">
              {testing ? '测试中...' : '测试连接'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
            <i className="ph-light ph-plug text-brand-500" /> 连接状态
          </h2>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${apiKeys[aiProvider] ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {PROVIDER_LABELS[aiProvider]}
              <span className="text-slate-300 ml-1">{apiKeys[aiProvider] ? '已配置' : '未配置'}</span>
            </span>
            <button onClick={() => window.electronAPI?.openExternal(API_KEY_URLS[aiProvider])}
              className="text-[11px] px-2 py-1 rounded-md bg-teal-500 text-white hover:bg-teal-600 border-none cursor-pointer transition-colors shrink-0 ml-2">
              获取 Key ↗
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
            <i className="ph-light ph-palette text-brand-500" /> 主题与偏好
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">深色模式</span>
              <Toggle active={theme === 'dark'} onClick={toggleTheme} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">界面语言</span>
              <select value={language} onChange={e => setLanguage(e.target.value)}
                className="text-sm px-2 py-1 rounded-md border border-slate-200 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:text-slate-300">
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">默认模板</span>
              <select value={defaultTemplate} onChange={e => setDefaultTemplate(e.target.value)}
                className="text-sm px-2 py-1 rounded-md border border-slate-200 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:text-slate-300">
                <option value="modern">现代简约</option>
                <option value="classic">经典商务</option>
                <option value="minimal">极简风格</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">自动保存</span>
              <Toggle active={autoSave} onClick={() => setAutoSave(!autoSave)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">PDF导出页数</span>
              <select value={exportLimit ? String(exportLimit) : '不限'} onChange={e => setExportLimit(e.target.value === '不限' ? false : Number(e.target.value))}
                className="text-sm px-2 py-1 rounded-md border border-slate-200 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 dark:text-slate-300">
                <option value="1">1 页</option>
                <option value="2">2 页</option>
                <option value="3">3 页</option>
                <option value="不限">不限</option>
              </select>
            </div>
          </div>

          {/* 账户安全 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 mt-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              账户安全
            </h2>
            <ChangePassword />
          </div>
        </div>
      </div>
    </div>
  );
};

function ChangePassword() {
  const { changePassword } = useAuthStore()
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSave = async () => {
    if (!oldPw) { setMsg('请输入当前密码'); return }
    if (newPw.length < 8 || !/[a-zA-Z]/.test(newPw) || !/[0-9]/.test(newPw)) { setMsg('新密码需至少8位，包含字母和数字'); return }
    if (newPw !== confirmPw) { setMsg('两次密码不一致'); return }
    setSaving(true); setMsg('')
    try {
      await changePassword(oldPw, newPw)
      setMsg('密码修改成功')
      setOldPw(''); setNewPw(''); setConfirmPw('')
    } catch (e: any) { setMsg(e?.message || '修改失败') }
    setSaving(false)
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-slate-500 mb-1">当前密码</label>
        <input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)}
          className="w-full max-w-xs px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500" />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">新密码</label>
        <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
          className="w-full max-w-xs px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500" />
        <p className="text-[11px] text-slate-400 mt-1">至少8位，需包含字母和数字</p>
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">确认新密码</label>
        <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
          className="w-full max-w-xs px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500" />
      </div>
      {msg && <p className={`text-xs ${msg.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>}
      <button onClick={handleSave} disabled={saving}
        className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 disabled:opacity-50 transition-colors">
        {saving ? '修改中...' : '修改密码'}
      </button>
    </div>
  )
}

export default Settings;
