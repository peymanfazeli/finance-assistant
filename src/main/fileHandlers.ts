import { ipcMain, dialog } from 'electron'
import { readFileSync } from 'fs'

export function registerFileHandlers(): void {
  ipcMain.handle('file:read', async (_event, filePath: string) => {
    try {
      const buffer = readFileSync(filePath)
      const ext = filePath.toLowerCase().split('.').pop() || ''
      return {
        success: true,
        data: buffer.toString('base64'),
        ext
      }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Spreadsheets', extensions: ['xlsx', 'xls', 'csv'] }
      ]
    })
    return result
  })
}
