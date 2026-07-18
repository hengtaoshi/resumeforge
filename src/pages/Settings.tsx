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

const DarkModeToggle: React.FC<{ active: boolean; onClick: () => void }> = ({ active, onClick }) => (
  <span onClick={onClick} style={{ cursor: 'pointer', margin: 0, fontSize: 17, position: 'relative', display: 'inline-block', width: 64, height: 34 }}>
    <input type="checkbox" checked={active} readOnly style={{ opacity: 0, width: 0, height: 0 }} />
    <span style={{ position: 'absolute', top: 5, left: 36, zIndex: 1, width: 24, height: 24 }}>
      <svg viewBox="0 0 24 24" style={{ width: 24, height: 24 }}><g fill="#ffd43b"><circle r="5" cy="12" cx="12"></circle><path d="m21 13h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 0 2zm-17 0h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 0 2zm13.66-5.66a1 1 0 0 1 -.66-.29 1 1 0 0 1 0-1.41l.71-.71a1 1 0 1 1 1.41 1.41l-.71.71a1 1 0 0 1 -.75.29zm-12.02 12.02a1 1 0 0 1 -.71-.29 1 1 0 0 1 0-1.41l.71-.66a1 1 0 0 1 1.41 1.41l-.71.71a1 1 0 0 1 -.7.24zm6.36-14.36a1 1 0 0 1 -1-1v-1a1 1 0 0 1 2 0v1a1 1 0 0 1 -1 1zm0 17a1 1 0 0 1 -1-1v-1a1 1 0 0 1 2 0v1a1 1 0 0 1 -1 1zm-5.66-14.66a1 1 0 0 1 -.7-.29l-.71-.71a1 1 0 0 1 1.41-1.41l.71.71a1 1 0 0 1 0 1.41 1 1 0 0 1 -.71.29zm12.02 12.02a1 1 0 0 1 -.7-.29l-.66-.71a1 1 0 0 1 1.36-1.36l.71.71a1 1 0 0 1 0 1.41 1 1 0 0 1 -.71.24z"></path></g></svg>
    </span>
    <span style={{ position: 'absolute', top: 5, left: 5, zIndex: 1, width: 24, height: 24 }}>
      <svg viewBox="0 0 384 512" style={{ width: 24, height: 24, fill: '#73C0FC' }}><path d="m223.5 32c-123.5 0-223.5 100.3-223.5 224s100 224 223.5 224c60.6 0 115.5-24.2 155.8-63.4 5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6-96.9 0-175.5-78.8-175.5-176 0-65.8 36-123.1 89.3-153.3 6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z"></path></svg>
    </span>
    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: active ? '#183153' : '#73C0FC', transition: '.4s', borderRadius: 30 }}>
      <span style={{ position: 'absolute', height: 30, width: 30, borderRadius: 20, left: 2, bottom: 2, zIndex: 2, backgroundColor: '#e8e8e8', transition: '.4s', transform: active ? 'translateX(30px)' : 'none' }} />
    </span>
  </span>
);

const Toggle: React.FC<{ active: boolean; onClick: () => void }> = ({ active, onClick }) => (
  <span className="rocker rocker-small" onClick={onClick} style={{ cursor: 'pointer', margin: 0 }}>
    <input type="checkbox" checked={active} readOnly />
    <span className="switch-left">开</span>
    <span className="switch-right">关</span>
  </span>
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
    <div className="flex-1 p-4 overflow-y-auto bg-[#F4F2ED] dark:bg-slate-900 h-full">
      <div className="mb-3">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 mb-2">
          <i className="ph-light ph-gear-six text-sm" /> Settings
        </span>
        <h1 className="text-xl font-bold font-display text-slate-800">设置</h1>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="card-doc p-2 col-span-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
            <i className="ph-light ph-cpu text-brand-500" /> AI 提供商
          </h2>
          {(() => {
            const total = providerOrder.length
            const selectedIdx = providerOrder.indexOf(aiProvider)
            return <>
              <style>{`
                .radio-glider {
                  position: absolute; left: 0; top: 0; bottom: 0; width: 1px;
                  background: linear-gradient(0deg,transparent 0%,rgba(0,0,0,0.08) 50%,transparent 100%);
                }
                .dark .radio-glider {
                  background: linear-gradient(0deg,transparent 0%,rgba(255,255,255,0.08) 50%,transparent 100%);
                }
                .radio-glider-inner {
                  height: calc(100% / ${total}); width: 100%;
                  background: linear-gradient(0deg,transparent 0%,#D4875E 50%,transparent 100%);
                  transition: transform 0.5s cubic-bezier(0.37,1.95,0.66,0.56);
                  position: relative;
                }
                .radio-glider-inner::before {
                  content: ''; position: absolute; height: 60%; width: 300%; top: 50%;
                  transform: translateY(-50%); background: #D4875E; filter: blur(10px);
                }
                .radio-glider-inner::after {
                  content: ''; position: absolute; left: 0; height: 100%; width: 150px;
                  background: linear-gradient(90deg,rgba(212,135,94,0.12) 0%,transparent 100%);
                }
                .radio-item input:checked + span { color: #D4875E; font-weight: 600; }
              `}</style>
              <div className="relative pl-5">
                <div className="radio-glider"><div className="radio-glider-inner" style={{ transform: `translateY(${selectedIdx * 100}%)` }} /></div>
                {providerOrder.map(p => (
                  <label key={p} className="radio-item flex items-center gap-2 py-1.5">
                    <input type="radio" name="ai-provider" checked={aiProvider === p}
                      onChange={() => setProvider(p)} className="hidden" />
                    <span className="text-sm text-slate-500 dark:text-slate-400 transition-all duration-300 cursor-pointer">
                      {PROVIDER_LABELS[p]}
                    </span>
                  </label>
                ))}
              </div>
            </>
          })()}
          <div className="flex items-center gap-2 flex-wrap">
            <select value={model} onChange={e => setModel(e.target.value)}
              className="text-sm px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
              {(MODELS[aiProvider] || []).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <div className="relative flex-1 min-w-[200px]">
              <input type={showKey ? 'text' : 'password'} value={currentKey || ''}
                onChange={e => setApiKey(aiProvider, e.target.value)}
                placeholder={`输入 ${PROVIDER_LABELS[aiProvider]} API Key`}
                className="w-full text-sm px-2.5 py-1.5 pr-8 rounded-md border border-slate-200 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-500 outline-none focus:border-brand-300"/>
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

        <div className="card-doc p-2">
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
              className="text-[11px] px-2 py-1 rounded-md bg-accent text-white hover:bg-accent-hover border-none cursor-pointer transition-colors shrink-0 ml-2">
              获取 Key ↗
            </button>
          </div>
        </div>

        <div className="card-doc p-2">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
            <i className="ph-light ph-palette text-brand-500" /> 主题与偏好
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">深色模式</span>
              <DarkModeToggle active={theme === 'dark'} onClick={toggleTheme} />
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
        </div>

        <div className="card-doc p-2">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            个人信息
          </h2>
          <ChangePassword />
        </div>
      </div>
    </div>
  );
};

function ChangePassword() {
  const user = useAuthStore((s) => s.user)
  const updateLocalUser = useAuthStore((s) => s.updateLocalUser)
  const [name, setName] = useState(user?.nickname || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSave = async () => {
    if (!name.trim()) { setMsg('昵称不能为空'); return }
    if (email.trim() && !/^[^\s@]+@[^\s@]+$/.test(email.trim())) { setMsg('请输入有效邮箱'); return }
    setSaving(true); setMsg('')
    updateLocalUser(name.trim(), email.trim() || 'local@user.com')
    setMsg('保存成功')
    setSaving(false)
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-slate-500 mb-1">昵称</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          className="w-full max-w-xs px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(212,135,94,0.30)] focus:border-[#D4875E]" />
      </div>
      <div>
        <label className="block text-xs text-slate-500 mb-1">邮箱</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full max-w-xs px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(212,135,94,0.30)] focus:border-[#D4875E]" />
      </div>
      {msg && <p className={`text-xs ${msg.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>}
      <button onClick={handleSave} disabled={saving}
        className="btn-pill primary disabled:opacity-50">
        {saving ? '保存中...' : '保存'}
      </button>
    </div>
  )
}

export default Settings;
