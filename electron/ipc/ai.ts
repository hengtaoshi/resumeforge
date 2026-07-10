/**
 * Electron IPC handlers for AI provider calls.
 * Handles streaming completions from OpenRouter, OpenAI, and Anthropic
 * and sends results back to the renderer via event-based IPC.
 *
 * Compiled as CommonJS by tsconfig.electron.json.
 * Uses Node 18+ global fetch (available in Electron 28+).
 */

import { ipcMain, BrowserWindow, IpcMainEvent } from 'electron'

// ---------------------------------------------------------------------------
// Types (local — cannot import from src/ due to separate build pipelines)
// ---------------------------------------------------------------------------

interface ProviderInfo {
  name: string
  label: string
  models: string[]
}

interface GenerateRequest {
  prompt: string
  provider: string
  model?: string
  apiKey?: string
  baseUrl?: string
  system?: string
}

function getAvailableProviders(): ProviderInfo[] {
  return [
    {
      name: 'openrouter',
      label: 'OpenRouter',
      models: [
        'openai/gpt-4o',
        'openai/gpt-4o-mini',
        'anthropic/claude-3.5-sonnet',
        'anthropic/claude-3.5-haiku',
        'google/gemini-2.0-flash-001',
        'deepseek/deepseek-chat',
      ],
    },
    {
      name: 'openai',
      label: 'OpenAI',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    },
    {
      name: 'anthropic',
      label: 'Anthropic',
      models: [
        'claude-sonnet-4-20250514',
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
      ],
    },
  ]
}

// ---------------------------------------------------------------------------
// SSE parsing (local — avoids cross-build-system dependency on src/lib/)
// ---------------------------------------------------------------------------

/**
 * Parse a fetch Response body as SSE and yield text chunks.
 */
async function* sseParser(response: Response): AsyncIterable<string> {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Response body is not readable')

  const decoder = new TextDecoder()
  let buffer = ''
  let currentEvent = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed === '') {
          currentEvent = ''
          continue
        }
        if (trimmed.startsWith(':')) continue

        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.slice(6).trim()
          continue
        }

        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.slice(5).trim()
          if (jsonStr === '[DONE]') return

          try {
            const parsed = JSON.parse(jsonStr)

            // OpenAI / OpenRouter format
            const openAIChunk = parsed.choices?.[0]?.delta?.content
            if (openAIChunk) {
              yield openAIChunk
              continue
            }

            // Anthropic content_block_start
            if (
              currentEvent === 'content_block_start' &&
              parsed.type === 'content_block_start'
            ) {
              const text = parsed.content_block?.text
              if (text) {
                yield text
                continue
              }
            }

            // Anthropic content_block_delta
            if (
              currentEvent === 'content_block_delta' &&
              parsed.type === 'content_block_delta'
            ) {
              const text = parsed.delta?.text
              if (text) {
                yield text
                continue
              }
            }

            // Google Gemini format
            const geminiParts = parsed.candidates?.[0]?.content?.parts
            if (geminiParts) {
              for (const part of geminiParts) {
                if (part.text) yield part.text
              }
              continue
            }

            // Fallback
            if (parsed.delta?.text && typeof parsed.delta.text === 'string') {
              yield parsed.delta.text
            }
          } catch {
            // skip unparseable JSON
          }
        }
      }
    }

    // Flush remaining buffer
    if (buffer.trim() && buffer.trim().startsWith('data:')) {
      const jsonStr = buffer.trim().slice(5).trim()
      if (jsonStr !== '[DONE]') {
        try {
          const parsed = JSON.parse(jsonStr)
          if (parsed.choices?.[0]?.delta?.content) {
            yield parsed.choices[0].delta.content
          }
        } catch {
          // ignore
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// ---------------------------------------------------------------------------
// Provider implementations (main-process, using global fetch)
// ---------------------------------------------------------------------------

type SendChunk = (chunk: string, done: boolean, error?: string) => void

async function generateOpenRouter(
  params: GenerateRequest,
  send: SendChunk,
): Promise<void> {
  const apiKey = params.apiKey || process.env.OPENROUTER_API_KEY || ''
  if (!apiKey) {
    send('', true, 'OpenRouter API key is not configured')
    return
  }

  const model = params.model || 'openai/gpt-4o'
  const baseUrl = params.baseUrl || 'https://openrouter.ai/api/v1/chat/completions'
  const messages: { role: string; content: string }[] = []
  if (params.system) messages.push({ role: 'system', content: params.system })
  messages.push({ role: 'user', content: params.prompt })

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://resumeforge.app',
        'X-Title': 'ResumeForge',
      },
      body: JSON.stringify({ model, messages, max_tokens: 4096, stream: true }),
    })

    if (!response.ok) {
      const err = await response.text().catch(() => 'unknown error')
      send('', true, `OpenRouter API error ${response.status}: ${err}`)
      return
    }

    for await (const chunk of sseParser(response)) {
      send(chunk, false)
    }
    send('', true)
  } catch (err: any) {
    send('', true, String(err))
  }
}

async function generateOpenAI(
  params: GenerateRequest,
  send: SendChunk,
): Promise<void> {
  const apiKey = params.apiKey || process.env.OPENAI_API_KEY || ''
  if (!apiKey) {
    send('', true, 'OpenAI API key is not configured')
    return
  }

  const model = params.model || 'gpt-4o'
  const baseUrl = params.baseUrl || 'https://api.openai.com/v1'
  const messages: { role: string; content: string }[] = []
  if (params.system) messages.push({ role: 'system', content: params.system })
  messages.push({ role: 'user', content: params.prompt })

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: 4096, stream: true }),
    })

    if (!response.ok) {
      const err = await response.text().catch(() => 'unknown error')
      send('', true, `OpenAI API error ${response.status}: ${err}`)
      return
    }

    for await (const chunk of sseParser(response)) {
      send(chunk, false)
    }
    send('', true)
  } catch (err: any) {
    send('', true, String(err))
  }
}

async function generateAnthropic(
  params: GenerateRequest,
  send: SendChunk,
): Promise<void> {
  const apiKey = params.apiKey || process.env.ANTHROPIC_API_KEY || ''
  if (!apiKey) {
    send('', true, 'Anthropic API key is not configured')
    return
  }

  const model = params.model || 'claude-sonnet-4-20250514'
  const baseUrl = params.baseUrl || 'https://api.anthropic.com/v1'

  const body: Record<string, unknown> = {
    model,
    max_tokens: 4096,
    messages: [{ role: 'user', content: params.prompt }],
    stream: true,
  }
  if (params.system) body.system = params.system

  try {
    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const err = await response.text().catch(() => 'unknown error')
      send('', true, `Anthropic API error ${response.status}: ${err}`)
      return
    }

    for await (const chunk of sseParser(response)) {
      send(chunk, false)
    }
    send('', true)
  } catch (err: any) {
    send('', true, String(err))
  }
}

// ---------------------------------------------------------------------------
// Route: pick the right provider implementation
// ---------------------------------------------------------------------------

async function routeGenerate(
  params: GenerateRequest,
  send: SendChunk,
): Promise<void> {
  switch (params.provider) {
    case 'openrouter':
      return generateOpenRouter(params, send)
    case 'openai':
      return generateOpenAI(params, send)
    case 'anthropic':
      return generateAnthropic(params, send)
    default:
      send('', true, `Unknown provider: ${params.provider}`)
  }
}

// ---------------------------------------------------------------------------
// IPC handler registration
// ---------------------------------------------------------------------------

export function registerAIHandlers(): void {
  /**
   * ai:start — initiates streaming generation.
   * The renderer sends this event, and the main process pushes
   * 'ai:chunk' events back to the renderer for each text fragment.
   *
   * Renderer payload: { prompt, provider, model?, apiKey?, baseUrl?, system? }
   */
  ipcMain.on('ai:start', (event: IpcMainEvent, params: GenerateRequest) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return

    const send: SendChunk = (chunk: string, done: boolean, error?: string) => {
      if (win.isDestroyed()) return
      if (error) {
        win.webContents.send('ai:chunk', { chunk: '', done: true, error })
      } else {
        win.webContents.send('ai:chunk', { chunk, done })
      }
    }

    routeGenerate(params, send).catch((err) => {
      send('', true, String(err))
    })
  })

  /**
   * ai:generate — invoke‑based generation (returns the full text at once).
   * Useful for non-streaming callers.
   */
  ipcMain.handle('ai:generate', async (_event, params: GenerateRequest): Promise<string> => {
    let fullText = ''

    const send: SendChunk = (chunk: string, done: boolean, error?: string) => {
      if (error) throw new Error(error)
      fullText += chunk
      if (done) return
    }

    await routeGenerate(params, send)
    return fullText
  })

  /**
   * ai:providers — returns the list of available providers and their models.
   */
  ipcMain.handle('ai:providers', async (): Promise<ProviderInfo[]> => {
    return getAvailableProviders()
  })
}
