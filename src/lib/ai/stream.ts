/**
 * Streaming response handler for AI providers.
 * Parses Server-Sent Events (SSE) from fetch Response objects
 * and provides utilities for consuming streaming text.
 */

/**
 * Process a fetch Response as an SSE (Server-Sent Events) stream.
 * Handles both OpenAI format (data: {...}) and Anthropic format (event: / data: {...}).
 * Yields text chunks as they arrive.
 */
export async function* processStream(response: Response): AsyncIterable<string> {
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

      // Split on newlines and process each line
      const lines = buffer.split('\n')
      // Keep the last (possibly incomplete) line in the buffer
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed === '') {
          // Empty line = end of an SSE event block
          currentEvent = ''
          continue
        }

        // Comment lines (SSE spec: lines starting with ':')
        if (trimmed.startsWith(':')) continue

        // Event type line: "event: <type>"
        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.slice(6).trim()
          continue
        }

        // Data line: "data: <json string>"
        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.slice(5).trim()

          // OpenAI stream end marker
          if (jsonStr === '[DONE]') return

          try {
            const parsed = JSON.parse(jsonStr)

            // --- OpenAI / OpenRouter format ---
            // data: {"choices":[{"delta":{"content":"text"}}]}
            const openAIChunk = parsed.choices?.[0]?.delta?.content
            if (openAIChunk) {
              yield openAIChunk
              continue
            }

            // --- Anthropic format ---
            // event: content_block_start
            // data: {"type":"content_block_start","content_block":{"type":"text","text":"hello"}}
            if (currentEvent === 'content_block_start' && parsed.type === 'content_block_start') {
              const text = parsed.content_block?.text
              if (text) {
                yield text
                continue
              }
            }

            // event: content_block_delta
            // data: {"type":"content_block_delta","delta":{"type":"text_delta","text":" world"}}
            if (currentEvent === 'content_block_delta' && parsed.type === 'content_block_delta') {
              const text = parsed.delta?.text
              if (text) {
                yield text
                continue
              }
            }

            // --- Google Gemini format ---
            const geminiParts = parsed.candidates?.[0]?.content?.parts
            if (geminiParts) {
              for (const part of geminiParts) {
                if (part.text) {
                  yield part.text
                }
              }
              continue
            }

            // Fallback: any field matching {delta: {text: string}}
            if (parsed.delta?.text && typeof parsed.delta.text === 'string') {
              yield parsed.delta.text
            }
          } catch {
            // Skip unparseable JSON lines
          }
        }
      }
    }

    // Process any remaining data in the buffer
    if (buffer.trim()) {
      const trimmed = buffer.trim()
      if (trimmed.startsWith('data:')) {
        const jsonStr = trimmed.slice(5).trim()
        if (jsonStr !== '[DONE]') {
          try {
            const parsed = JSON.parse(jsonStr)
            if (parsed.choices?.[0]?.delta?.content) {
              yield parsed.choices[0].delta.content
            }
          } catch {
            // ignore trailing garbage
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * Collect an entire async iterable stream into a single string.
 * Useful when you don't need real-time chunks and just want the final result.
 */
export async function streamToText(stream: AsyncIterable<string>): Promise<string> {
  let result = ''
  for await (const chunk of stream) {
    result += chunk
  }
  return result
}

// ===========================================================================
// High-level wrappers for use in pages
// ===========================================================================

import { useSettingsStore } from '@/stores/settingsStore'
import type { AIChatMessage, AIStreamCallbacks } from './provider'

/**
 * Stream an AI response using the current settings from the store.
 * Returns an abort function to cancel the request.
 */
export function streamAI(
  messages: AIChatMessage[],
  callbacks: AIStreamCallbacks,
): { abort: () => void } {
  const settings = useSettingsStore.getState()
  const apiKey = settings.apiKeys[settings.aiProvider]

  if (!apiKey) {
    const label: Record<string, string> = { openai: 'OpenAI', anthropic: 'Anthropic', google: 'Google', openrouter: 'OpenRouter' }
    const err = new Error(
      `未配置 ${label[settings.aiProvider] ?? settings.aiProvider} API 密钥。请先在设置页面配置。`,
    )
    setTimeout(() => callbacks.onError(err), 0)
    return { abort: () => {} }
  }

  const abortController = new AbortController()

  ;(async () => {
    try {
      const { callAIStream } = await import('./provider')
      await callAIStream(messages, { provider: settings.aiProvider, apiKey, model: settings.model }, callbacks, abortController.signal)
    } catch (err) {
      callbacks.onError(err instanceof Error ? err : new Error(String(err)))
    }
  })()

  return { abort: () => abortController.abort() }
}

/**
 * Non-streaming AI call using the current settings from the store.
 */
export async function askAI(messages: AIChatMessage[]): Promise<string> {
  const settings = useSettingsStore.getState()
  const apiKey = settings.apiKeys[settings.aiProvider]

  if (!apiKey) {
    const label: Record<string, string> = { openai: 'OpenAI', anthropic: 'Anthropic', google: 'Google', openrouter: 'OpenRouter' }
    throw new Error(
      `未配置 ${label[settings.aiProvider] ?? settings.aiProvider} API 密钥。请先在设置页面配置。`,
    )
  }

  const { callAI } = await import('./provider')
  return callAI([...messages], { provider: settings.aiProvider, apiKey, model: settings.model })
}

/**
 * Check whether the current AI provider is properly configured.
 */
export function isAIConfigured(): boolean {
  const settings = useSettingsStore.getState()
  return !!settings.apiKeys[settings.aiProvider]
}
