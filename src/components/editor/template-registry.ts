import type { ComponentType } from 'react'
import type { Resume } from '@/lib/jadeai/templates/resume-types'

export interface RegisteredTemplate {
  id: string
  name: string
  description: string
  component: ComponentType<{ resume: Resume }>
}

// ponytail: only three templates registered; add more when user requests them
const registry: RegisteredTemplate[] = []

export function registerTemplate(t: RegisteredTemplate): void {
  if (!registry.find((r) => r.id === t.id)) registry.push(t)
}

export function getRegisteredTemplates(): RegisteredTemplate[] {
  return [...registry]
}

export function getTemplate(id: string): RegisteredTemplate | undefined {
  return registry.find((t) => t.id === id)
}

// Lazy-load and register templates
export async function initTemplates(): Promise<void> {
  const [classic, modern, compact] = await Promise.all([
    import('@/lib/jadeai/templates/classic').then((m) => m.ClassicTemplate),
    import('@/lib/jadeai/templates/modern').then((m) => m.ModernTemplate),
    import('@/lib/jadeai/templates/compact').then((m) => m.CompactTemplate),
  ])

  registerTemplate({ id: 'classic', name: '经典', description: '经典简洁布局，适合各类职业', component: classic })
  registerTemplate({ id: 'modern', name: '现代', description: '现代渐变风格，色彩鲜明', component: modern })
  registerTemplate({ id: 'compact', name: '紧凑', description: '紧凑排版，信息密度高', component: compact })
}
