import { ipcMain, dialog } from 'electron'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { dirname, resolve } from 'path'

export function registerExportHandlers(): void {
  ipcMain.handle('export:saveFile', async (_event, filePath: string, content: string) => {
    try {
      const dir = dirname(resolve(filePath))
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      writeFileSync(filePath, content, 'utf-8')
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('export:saveFileBinary', async (_event, filePath: string, base64: string) => {
    try {
      const dir = dirname(resolve(filePath))
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      const buffer = Buffer.from(base64, 'base64')
      writeFileSync(filePath, buffer)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('dialog:saveExport', async (_event, defaultName: string, filters: Electron.FileFilter[]) => {
    const result = await dialog.showSaveDialog({
      defaultPath: defaultName,
      filters
    })
    return result
  })
}
