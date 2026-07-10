import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AIProviderType = 'openai' | 'anthropic' | 'openrouter' | 'deepseek' | 'qwen' | 'kimi' | 'minimax' | 'glm' | 'doubao';

export interface ApiKeys {
  openai: string; anthropic: string; openrouter: string;
  deepseek: string; qwen: string; kimi: string; minimax: string; glm: string; doubao: string;
}

export interface SettingsState {
  aiProvider: AIProviderType;
  apiKeys: ApiKeys;
  model: string;
  theme: 'light' | 'dark';
  language: string;
  defaultTemplate: string;
  autoSave: boolean;
  exportLimit: number | false;
  setApiKey: (provider: AIProviderType, key: string) => void;
  setProvider: (provider: AIProviderType) => void;
  setModel: (model: string) => void;
  toggleTheme: () => void;
  setLanguage: (lang: string) => void;
  setDefaultTemplate: (template: string) => void;
  setAutoSave: (on: boolean) => void;
  setExportLimit: (on: number | false) => void;
}

const DEFAULT_KEYS: ApiKeys = {
  openai: '', anthropic: '', openrouter: '',
  deepseek: '', qwen: '', kimi: '', minimax: '', glm: '', doubao: '',
};

const MODEL_MAP: Record<string, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-20250514',
  openrouter: 'openai/gpt-4o',
  deepseek: 'deepseek-v4-pro',
  qwen: 'qwen3.5-plus',
  kimi: 'kimi-k2.6',
  minimax: 'minimax-m2.5',
  glm: 'glm-5',
  doubao: 'doubao-seed-2-0-pro-260215',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      aiProvider: 'anthropic' as AIProviderType,
      apiKeys: { ...DEFAULT_KEYS },
      model: MODEL_MAP.anthropic,
      theme: 'light' as const,
      language: 'zh-CN',
      defaultTemplate: 'modern',
      autoSave: true,
      exportLimit: false,
      setApiKey: (provider, key) => set((s) => ({ apiKeys: { ...s.apiKeys, [provider]: key } })),
      setProvider: (p) => set(() => ({ aiProvider: p, model: MODEL_MAP[p] || '' })),
      setModel: (model) => set({ model }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      setLanguage: (language) => set({ language }),
      setDefaultTemplate: (t) => set({ defaultTemplate: t }),
      setAutoSave: (v) => set({ autoSave: v }),
      setExportLimit: (v) => set({ exportLimit: v }),
    }),
    {
      name: 'resumeforge-settings',
      partialize: (state) => ({
        aiProvider: state.aiProvider, apiKeys: state.apiKeys, model: state.model,
        theme: state.theme, language: state.language, defaultTemplate: state.defaultTemplate,
        autoSave: state.autoSave, exportLimit: state.exportLimit,
      }),
    },
  ),
);
