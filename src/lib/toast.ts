/**
 * Minimal toast utility.
 * Renders toast notifications appended to document.body.
 */

type ToastType = 'success' | 'warning' | 'error' | 'info'

const COLORS: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: '#059669', icon: '✓' },
  warning: { bg: '#d97706', icon: '⚠' },
  error: { bg: '#dc2626', icon: '✕' },
  info: { bg: '#0284c7', icon: 'ℹ' },
}

function showToast(message: string, duration: number = 3000, type: ToastType = 'info'): void {
  const color = COLORS[type]

  const container = document.createElement('div')
  container.style.cssText = [
    'position: fixed; top: 24px; right: 24px; z-index: 99999;',
    'display: flex; align-items: center; gap: 10px;',
    'padding: 12px 20px; border-radius: 10px;',
    `background: ${color.bg}; color: #fff;`,
    'font-size: 14px; font-weight: 500;',
    'box-shadow: 0 8px 24px rgba(0,0,0,0.18);',
    'transform: translateX(120%);',
    'transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);',
    'max-width: 380px; pointer-events: auto;',
    'font-family: system-ui, -apple-system, sans-serif;',
  ].join(' ')

  const iconSpan = document.createElement('span')
  iconSpan.style.cssText = 'font-size: 16px; flex-shrink: 0;'
  iconSpan.textContent = color.icon

  const textSpan = document.createElement('span')
  textSpan.style.cssText = 'flex: 1; line-height: 1.4;'
  textSpan.textContent = message

  container.appendChild(iconSpan)
  container.appendChild(textSpan)
  document.body.appendChild(container)

  requestAnimationFrame(() => {
    container.style.transform = 'translateX(0)'
  })

  setTimeout(() => {
    container.style.transform = 'translateX(120%)'
    container.style.opacity = '0'
    setTimeout(() => container.remove(), 300)
  }, duration)
}

const toast = {
  success: (msg: string, dur?: number) => showToast(msg, dur, 'success'),
  warning: (msg: string, dur?: number) => showToast(msg, dur, 'warning'),
  error: (msg: string, dur?: number) => showToast(msg, dur, 'error'),
  info: (msg: string, dur?: number) => showToast(msg, dur, 'info'),
}

export default toast
