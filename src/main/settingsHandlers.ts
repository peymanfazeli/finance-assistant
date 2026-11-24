import { ipcMain, app } from 'electron'
import { writeFileSync, renameSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { SettingsService } from '../core/services/SettingsService'
import { Theme } from '../core/models/types'

function getSettingsPath(): string {
  return `${app.getPath('userData')}/settings.json`
}

function getInitialTheme(): Theme {
  try {
    const settingsPath = getSettingsPath()
    if (!existsSync(settingsPath)) return Theme.Dark
    const settings = SettingsService.deserialize(readFileSync(settingsPath, 'utf-8'))
    return settings.theme
  } catch {
    return Theme.Dark
  }
}

function writeAtomic(filePath: string, content: string): void {
  const dir = dirname(filePath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  const tmpPath = filePath + '.tmp'
  writeFileSync(tmpPath, content, 'utf-8')
  renameSync(tmpPath, filePath)
}

export function registerSettingsHandlers(): void {
  ipcMain.on('theme:get', (event) => {
    event.returnValue = getInitialTheme()
  })

  ipcMain.handle('settings:load', async () => {
    try {
      const settingsPath = getSettingsPath()
      if (!existsSync(settingsPath)) {
        return { success: true, data: null }
      }
      const content = readFileSync(settingsPath, 'utf-8')
      const settings = SettingsService.deserialize(content)
      return { success: true, data: settings }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('settings:save', async (_event, content: string) => {
    try {
      writeAtomic(getSettingsPath(), content)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}
