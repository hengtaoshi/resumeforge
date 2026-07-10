/**
 * AI Provider abstraction for ResumeForge.
 * Defines a common AIProvider interface and implements
 * OpenRouter, OpenAI, and Anthropic providers.
 *
 * Each provider reads API key and config from the Zustand settings store
 * (which is persisted to localStorage via zustand/middleware/persist).
 */

import { processStream } from './stream'
import { useSettingsStore } from '@/stores/settingsStore'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AIProviderType = 'openrouter' | 'openai' | 'anthropic' | 'deepseek' | 'qwen' | 'kimi' | 'minimax' | 'glm' | 'doubao' | 'google'

export interface AIConfig {
  provider: AIProviderType
  apiKey: string
  model: string
  baseUrl?: string
}

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIGenerateOpts {
  model?: string
  /** When true (default), returns AsyncIterable<string>. Otherwise returns string. */
  stream?: boolean
  /** Optional system prompt. */
  system?: string
  maxTokens?: number
  /** Pass-through for cancellation. */
  signal?: AbortSignal
}

export interface AIProvider {
  readonly name: string
  /**
   * Generate a completion.
   * If opts.stream is true (default), returns an AsyncIterable<string>.
   * Otherwise returns the full response text.
   */
  generate(prompt: string, opts?: AIGenerateOpts): Promise<string | AsyncIterable<string>>
}

/** Callback-based callbacks for the legacy streamAI / askAI wrappers. */
export interface AIStreamCallbacks {
  onToken: (text: string) => void
  onDone: (fullText: string) => void
  onError: (error: Error) => void
}

// ---------------------------------------------------------------------------
// Provider metadata
// ---------------------------------------------------------------------------

export interface ProviderInfo {
  name: string
  label: string
  models: string[]
}

export function getAvailableProviders(): ProviderInfo[] {
  return [
    {
      name: 'openrouter',
      label: 'OpenRouter',
      models: [
        'openai/gpt-4o', 'openai/gpt-4o-mini',
        'anthropic/claude-sonnet-4-20250514', 'anthropic/claude-3-5-sonnet-20241022',
        'google/gemini-2.0-flash-001', 'deepseek/deepseek-chat',
      ],
    },
    {
      name: 'openai', label: 'OpenAI',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    },
    {
      name: 'anthropic', label: 'Anthropic',
      models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    },
    {
      name: 'deepseek', label: 'DeepSeek',
      models: ['deepseek-v4-pro', 'deepseek-v4-flash', 'deepseek-v3.2', 'deepseek-r1'],
    },
    {
      name: 'qwen', label: '通义千问 (Qwen)',
      models: ['qwen3.7-max', 'qwen3.5-flash', 'qwen3.5-plus', 'qwen3.5-122b-a10b'],
    },
    {
      name: 'kimi', label: 'Kimi (Moonshot)',
      models: ['kimi-k2.7-code', 'kimi-k2.6', 'kimi-k2.5'],
    },
    {
      name: 'minimax', label: 'MiniMax',
      models: ['minimax-m3', 'minimax-m2.7', 'minimax-m2.5'],
    },
    {
      name: 'glm', label: '智谱 (GLM)',
      models: ['glm-5.1', 'glm-5', 'glm-5-turbo', 'glm-4.6'],
    },
    {
      name: 'doubao', label: '豆包 (ByteDance)',
      models: ['doubao-seed-2-0-pro-260215', 'doubao-seed-1-6-251015', 'doubao-seed-1-6-flash-250828', 'doubao-seed-code-preview'],
    },
  ]
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create an AI provider by name.
 * Throws if the provider name is unknown.
 */
export function getProvider(name: string, config?: AIConfig): AIProvider {
  switch (name) {
    case 'openrouter': return new OpenRouterProvider(config)
    case 'openai':     return new OpenAIProvider(config)
    case 'anthropic':  return new AnthropicProvider(config)
    case 'deepseek':   return new OpenAICompatibleProvider('deepseek', config, 'https://api.deepseek.com', 'deepseek-v4-pro')
    case 'qwen':       return new OpenAICompatibleProvider('qwen', config, 'https://dashscope.aliyuncs.com/compatible-mode/v1', 'qwen3.5-plus')
    case 'kimi':       return new OpenAICompatibleProvider('kimi', config, 'https://api.moonshot.cn/v1', 'kimi-k2.6')
    case 'minimax':    return new OpenAICompatibleProvider('minimax', config, 'https://api.minimaxi.com/v1', 'minimax-m2.5')
    case 'glm':        return new OpenAICompatibleProvider('glm', config, 'https://open.bigmodel.cn/api/paas/v4', 'glm-5')
    case 'doubao':     return new OpenAICompatibleProvider('doubao', config, 'https://ark.cn-beijing.volces.com/api/v3', 'doubao-seed-2-0-pro-260215')
    default:
      throw new Error(`Unknown AI provider: "${name}". Valid options: openrouter, openai, anthropic, deepseek, qwen, kimi, minimax, glm`)
  }
}

// ---------------------------------------------------------------------------
// Configuration helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'resumeforge-ai-config'

/**
 * Read all provider configs from localStorage.
 * Used by the direct (non-Zustand) path.
 */
export function getProviderConfigs(): Record<string, { apiKey: string; baseUrl?: string; model?: string; maxTokens?: number }> {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveProviderConfig(
  provider: string,
  cfg: { apiKey: string; baseUrl?: string; model?: string; maxTokens?: number },
): void {
  if (typeof localStorage === 'undefined') return
  const all = getProviderConfigs()
  all[provider] = cfg
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

/**
 * Resolve an effective API key by checking (in order):
 * 1. The override passed in config
 * 2. The Zustand settings store (from persist / localStorage)
 * 3. The standalone localStorage config
 * 4. An environment variable
 */
export function resolveApiKey(providerName: string, overrideKey?: string): string {
  if (overrideKey) return overrideKey

  // Try Zustand persisted store first
  try {
    const state = useSettingsStore.getState()
    const fromStore = (state.apiKeys as unknown as Record<string, string>)[providerName]
    if (fromStore) return fromStore
  } catch {
    // fall through
  }

  // Try standalone localStorage config
  const fromStorage = getProviderConfigs()[providerName]?.apiKey
  if (fromStorage) return fromStorage

  // Try environment variables
  const envMap: Record<string, string> = {
    openrouter: 'OPENROUTER_API_KEY',
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    deepseek: 'DEEPSEEK_API_KEY',
    qwen: 'QWEN_API_KEY',
    kimi: 'KIMI_API_KEY',
    minimax: 'MINIMAX_API_KEY',
    glm: 'GLM_API_KEY',
    doubao: 'DOUBAO_API_KEY',
  }
  const envVar = envMap[providerName]
  if (envVar && typeof process !== 'undefined' && process.env?.[envVar]) {
    return process.env[envVar]!
  }

  return ''
}

// ---------------------------------------------------------------------------
// Provider implementations
// ---------------------------------------------------------------------------

/* ========== OpenRouter ========== */

class OpenRouterProvider implements AIProvider {
  readonly name = 'openrouter'
  private apiKey: string
  private baseUrl: string
  private defaultModel: string

  constructor(config?: AIConfig) {
    this.apiKey = config?.apiKey ?? resolveApiKey('openrouter')
    this.baseUrl = getProviderConfigs().openrouter?.baseUrl ?? 'https://openrouter.ai/api/v1/chat/completions'
    this.defaultModel = config?.model ?? 'openai/gpt-4o'
  }

  async generate(prompt: string, opts?: AIGenerateOpts): Promise<string | AsyncIterable<string>> {
    if (!this.apiKey) throw new Error('OpenRouter API key is not configured. Set it in Settings.')

    const model = opts?.model || this.defaultModel
    const maxTokens = opts?.maxTokens || 4096
    const stream = opts?.stream ?? true
    const messages: { role: string; content: string }[] = []

    if (opts?.system) messages.push({ role: 'system', content: opts.system })
    messages.push({ role: 'user', content: prompt })

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://resumeforge.app',
        'X-Title': 'ResumeForge',
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens, stream }),
      signal: opts?.signal,
    })

    if (!response.ok) {
      const err = await response.text().catch(() => 'unknown error')
      throw new Error(`OpenRouter API error ${response.status}: ${err}`)
    }

    if (stream) return processStream(response)

    const data = await response.json()
    return data.choices?.[0]?.message?.content ?? ''
  }
}

/* ========== OpenAI ========== */

class OpenAIProvider implements AIProvider {
  readonly name = 'openai'
  private apiKey: string
  private baseUrl: string
  private defaultModel: string

  constructor(config?: AIConfig) {
    this.apiKey = config?.apiKey ?? resolveApiKey('openai')
    this.baseUrl = 'https://api.openai.com/v1'
    this.defaultModel = config?.model ?? 'gpt-4o'
  }

  async generate(prompt: string, opts?: AIGenerateOpts): Promise<string | AsyncIterable<string>> {
    if (!this.apiKey) throw new Error('OpenAI API key is not configured. Set it in Settings.')

    const model = opts?.model || this.defaultModel
    const maxTokens = opts?.maxTokens || 4096
    const stream = opts?.stream ?? true
    const messages: { role: string; content: string }[] = []

    if (opts?.system) messages.push({ role: 'system', content: opts.system })
    messages.push({ role: 'user', content: prompt })

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens, stream }),
      signal: opts?.signal,
    })

    if (!response.ok) {
      const err = await response.text().catch(() => 'unknown error')
      throw new Error(`OpenAI API error ${response.status}: ${err}`)
    }

    if (stream) return processStream(response)

    const data = await response.json()
    return data.choices?.[0]?.message?.content ?? ''
  }
}

/* ========== OpenAI-Compatible (DeepSeek, Qwen, Kimi, MiniMax, GLM) ========== */

class OpenAICompatibleProvider implements AIProvider {
  readonly name: string
  private apiKey: string
  private baseUrl: string
  private defaultModel: string

  constructor(name: string, config?: AIConfig, baseUrl?: string, defaultModel?: string) {
    this.name = name
    this.apiKey = config?.apiKey ?? resolveApiKey(name)
    this.baseUrl = baseUrl ?? getProviderConfigs()[name]?.baseUrl ?? 'https://api.openai.com/v1'
    this.defaultModel = defaultModel ?? config?.model ?? 'default'
  }

  async generate(prompt: string, opts?: AIGenerateOpts): Promise<string | AsyncIterable<string>> {
    if (!this.apiKey) throw new Error(`${this.name} API key is not configured. Set it in Settings.`)

    const model = opts?.model || this.defaultModel
    const maxTokens = opts?.maxTokens || 4096
    const stream = opts?.stream ?? true
    const messages: { role: string; content: string }[] = []

    if (opts?.system) messages.push({ role: 'system', content: opts.system })
    messages.push({ role: 'user', content: prompt })

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens, stream }),
      signal: opts?.signal,
    })

    if (!response.ok) {
      const err = await response.text().catch(() => 'unknown error')
      throw new Error(`${this.name} API error ${response.status}: ${err}`)
    }

    if (stream) return processStream(response)

    const data = await response.json()
    return data.choices?.[0]?.message?.content ?? ''
  }
}

/* ========== Anthropic ========== */

class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic'
  private apiKey: string
  private baseUrl: string
  private defaultModel: string

  constructor(config?: AIConfig) {
    this.apiKey = config?.apiKey ?? resolveApiKey('anthropic')
    this.baseUrl = 'https://api.anthropic.com/v1'
    this.defaultModel = config?.model ?? 'claude-sonnet-4-20250514'
  }

  async generate(prompt: string, opts?: AIGenerateOpts): Promise<string | AsyncIterable<string>> {
    if (!this.apiKey) throw new Error('Anthropic API key is not configured. Set it in Settings.')

    const model = opts?.model || this.defaultModel
    const maxTokens = opts?.maxTokens || 4096
    const stream = opts?.stream ?? true

    const body: Record<string, unknown> = {
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user' as const, content: prompt }],
      stream,
    }
    if (opts?.system) body.system = opts.system

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal: opts?.signal,
    })

    if (!response.ok) {
      const err = await response.text().catch(() => 'unknown error')
      throw new Error(`Anthropic API error ${response.status}: ${err}`)
    }

    if (stream) return processStream(response)

    const data = await response.json()
    return data.content?.[0]?.text ?? ''
  }
}

// ---------------------------------------------------------------------------
// Legacy callback‑based streaming (kept for backward compatibility)
// ---------------------------------------------------------------------------

async function streamOpenAI(
  messages: AIChatMessage[],
  config: AIConfig,
  callbacks: AIStreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1'
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: true,
      max_tokens: 8192,
    }),
    signal,
  })

  if (!response.ok) {
    const err = await response.text().catch(() => 'unknown error')
    throw new Error(`OpenAI API error (${response.status}): ${err.slice(0, 300)}`)
  }

  const gen = processStream(response)
  let fullText = ''
  try {
    for await (const chunk of gen) {
      fullText += chunk
      callbacks.onToken(chunk)
    }
    callbacks.onDone(fullText)
  } catch (err) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)))
  }
}

async function streamAnthropic(
  messages: AIChatMessage[],
  config: AIConfig,
  callbacks: AIStreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const systemMsg = messages.find((m) => m.role === 'system')
  const chatMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  const body: Record<string, unknown> = {
    model: config.model,
    messages: chatMessages,
    max_tokens: 8192,
    stream: true,
  }
  if (systemMsg) body.system = systemMsg.content

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    const err = await response.text().catch(() => 'unknown error')
    throw new Error(`Anthropic API error (${response.status}): ${err.slice(0, 300)}`)
  }

  const gen = processStream(response)
  let fullText = ''
  try {
    for await (const chunk of gen) {
      fullText += chunk
      callbacks.onToken(chunk)
    }
    callbacks.onDone(fullText)
  } catch (err) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)))
  }
}

async function streamGoogle(
  messages: AIChatMessage[],
  config: AIConfig,
  callbacks: AIStreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const contents: { role: string; parts: { text: string }[] }[] = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  const systemInstruction = messages.find((m) => m.role === 'system')?.content
  const body: Record<string, unknown> = { contents }
  if (systemInstruction) body.system_instruction = { parts: [{ text: systemInstruction }] }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:streamGenerateContent?alt=sse&key=${config.apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    const err = await response.text().catch(() => 'unknown error')
    throw new Error(`Google AI error (${response.status}): ${err.slice(0, 300)}`)
  }

  const gen = processStream(response)
  let fullText = ''
  try {
    for await (const chunk of gen) {
      fullText += chunk
      callbacks.onToken(chunk)
    }
    callbacks.onDone(fullText)
  } catch (err) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)))
  }
}

/**
 * Callback‑based AI streaming (legacy API, kept for existing pages).
 */
export async function callAIStream(
  messages: AIChatMessage[],
  config: AIConfig,
  callbacks: AIStreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  switch (config.provider) {
    case 'openai':
      return streamOpenAI(messages, config, callbacks, signal)
    case 'anthropic':
      return streamAnthropic(messages, config, callbacks, signal)
    case 'openrouter': {
      // Route OpenRouter through the OpenAI‑compatible endpoint
      const openRouterConfig: AIConfig = {
        ...config,
        provider: 'openai',
        model: config.model,
      }
      return streamOpenAI(messages, openRouterConfig, callbacks, signal)
    }
    case 'google':
      return streamGoogle(messages, config, callbacks, signal)
    case 'deepseek':
      return streamOpenAI(messages, { ...config, baseUrl: config.baseUrl || 'https://api.deepseek.com' }, callbacks, signal)
    case 'qwen':
      return streamOpenAI(messages, { ...config, baseUrl: config.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1' }, callbacks, signal)
    case 'kimi':
      return streamOpenAI(messages, { ...config, baseUrl: config.baseUrl || 'https://api.moonshot.cn/v1' }, callbacks, signal)
    case 'minimax':
      return streamOpenAI(messages, { ...config, baseUrl: config.baseUrl || 'https://api.minimaxi.com/v1' }, callbacks, signal)
    case 'glm':
      return streamOpenAI(messages, { ...config, baseUrl: config.baseUrl || 'https://open.bigmodel.cn/api/paas/v4' }, callbacks, signal)
    case 'doubao':
      return streamOpenAI(messages, { ...config, baseUrl: config.baseUrl || 'https://ark.cn-beijing.volces.com/api/v3' }, callbacks, signal)
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`)
  }
}

/**
 * Non‑streaming convenience wrapper (legacy API, kept for backward compatibility).
 */
export async function callAI(
  messages: AIChatMessage[],
  config: AIConfig,
  signal?: AbortSignal,
): Promise<string> {
  let full = ''
  await callAIStream(
    messages,
    config,
    {
      onToken: (t) => {
        full += t
      },
      onDone: () => {},
      onError: (err) => {
        throw err
      },
    },
    signal,
  )
  return full
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Test an AI connection by sending a minimal greeting.
 */
export async function testConnection(config: AIConfig): Promise<boolean> {
  const testMessages: AIChatMessage[] = [
    { role: 'user', content: '回复"ok"表示连接正常。' },
  ]
  try {
    const result = await callAI(testMessages, config)
    return result.length > 0
  } catch {
    return false
  }
}

/**
 * Extract JSON from an AI response, handling markdown code blocks.
 */
export function extractJSON<T = unknown>(text: string): T | null {
  try {
    return JSON.parse(text) as T
  } catch {
    // fall through
  }

  const blockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (blockMatch) {
    try {
      return JSON.parse(blockMatch[1].trim()) as T
    } catch {
      // ignore
    }
  }

  const braceMatch = text.match(/\{[\s\S]*\}/)
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]) as T
    } catch {
      // ignore
    }
  }

  return null
}
