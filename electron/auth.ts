import { ipcMain } from 'electron'

export function registerAuthHandlers() {
  ipcMain.handle('auth:sendCode', async () => {
    throw new Error('注册功能已移至本地')
  })
  ipcMain.handle('auth:register', async (_e, _email: string, _code: string, _password: string) => {
    return { id: 'local', email: _email, nickname: _email.split('@')[0], avatar: '' }
  })
  ipcMain.handle('auth:login', async (_e, email: string, _password: string) => {
    return { id: 'local', email, nickname: email.split('@')[0], avatar: '' }
  })
  ipcMain.handle('auth:getUser', () => null)
  ipcMain.handle('auth:isLoggedIn', () => false)
  ipcMain.handle('auth:logout', async () => {})
  ipcMain.handle('auth:changePassword', async () => {
    throw new Error('密码修改已移至本地')
  })
}
