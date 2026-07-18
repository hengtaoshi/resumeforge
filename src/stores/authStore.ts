import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  email: string
  nickname: string
  avatar: string
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  checkAuth: () => Promise<void>
  sendCode: (email: string) => Promise<void>
  register: (email: string, code: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
  setLocalUser: (name: string, email: string) => void
  updateLocalUser: (name: string, email: string) => void
}

function cleanError(err: any): string {
  const msg = err?.message || String(err)
  // Strip the full "Error invoking remote method 'xxx': Error: " prefix
  const parts = msg.split('Error: ')
  return parts[parts.length - 1]
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,

      checkAuth: async () => {
        set((s) => ({ loading: false, user: s.user }))
      },

      sendCode: async (email) => {
        try {
          await window.electronAPI.sendCode(email)
        } catch (e: any) {
          throw new Error(cleanError(e))
        }
      },

      register: async (email, code, password) => {
        try {
          const user = await window.electronAPI.register(email, code, password)
          set({ user })
        } catch (e: any) {
          throw new Error(cleanError(e))
        }
      },

      login: async (email, password) => {
        try {
          const user = await window.electronAPI.login(email, password)
          set({ user })
        } catch (e: any) {
          throw new Error(cleanError(e))
        }
      },

      logout: async () => {
        await window.electronAPI.logout()
        set({ user: null })
      },

      changePassword: async (oldPassword, newPassword) => {
        try {
          await window.electronAPI.changePassword(oldPassword, newPassword)
        } catch (e: any) {
          throw new Error(cleanError(e))
        }
      },
      setLocalUser: (name, email) => set({ user: { id: 'local', email, nickname: name, avatar: '' } }),
  updateLocalUser: (name, email) => set((s) => ({ user: s.user ? { ...s.user, nickname: name, email } : null })),
    }),
    { name: 'resumeforge-auth', partialize: (s) => ({ user: s.user }) },
  ),
)
