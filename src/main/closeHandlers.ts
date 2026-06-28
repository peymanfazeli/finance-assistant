import { ipcMain, app, BrowserWindow } from 'electron'
import { readFileSync, existsSync } from 'fs'
import { SettingsService } from '../core/services/SettingsService'

let closeRequested = false

function getSettingsPath(): string {
  return `${app.getPath('userData')}/settings.json`
}

export function registerCloseHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle('export:get-last-timestamp', async () => {
    try {
      const settingsPath = getSettingsPath()
      if (!existsSync(settingsPath)) {
        return { timestamp: null }
      }
      const content = readFileSync(settingsPath, 'utf-8')
      const settings = SettingsService.deserialize(content)
      return { timestamp: settings.lastExportTimestamp ?? null }
    } catch {
      return { timestamp: null }
    }
  })

  ipcMain.handle('export:save-last-timestamp', async (_event, timestamp: string) => {
    try {
      const settingsPath = getSettingsPath()
      const content = readFileSync(settingsPath, 'utf-8')
      const settings = SettingsService.deserialize(content)
      settings.lastExportTimestamp = timestamp
      const { writeFileSync, renameSync, mkdirSync } = require('fs')
      const { dirname } = require('path')
      const dir = dirname(settingsPath)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      const tmpPath = settingsPath + '.tmp'
      writeFileSync(tmpPath, JSON.stringify(settings, null, 2), 'utf-8')
      renameSync(tmpPath, settingsPath)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('app:confirm-close', async () => {
    closeRequested = true
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close()
    } else {
      app.quit()
    }
  })

  ipcMain.handle('app:cancel-close', async () => {
    closeRequested = false
    return { success: true }
  })

  mainWindow.on('close', (e) => {
    if (!closeRequested) {
      e.preventDefault()
      mainWindow.webContents.send('app:will-close')
    }
  })
}
