import { ipcMain, dialog, app } from 'electron'
import { writeFileSync, renameSync, readFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs'
import { dirname, resolve, join } from 'path'
import { DatasetService } from '../core/services/DatasetService'
import { CategoryService } from '../core/services/CategoryService'

export function cleanupTempFiles(): void {
  try {
    const userDataPath = app.getPath('userData')
    const dirs = [userDataPath, process.cwd()]
    for (const dir of dirs) {
      if (!existsSync(dir)) continue
      const files = readdirSync(dir)
      for (const f of files) {
        if (f.endsWith('.tmp')) {
          try {
            unlinkSync(join(dir, f))
          } catch { /* ignore */ }
        }
      }
    }
  } catch { /* ignore */ }
}

export function registerDatasetHandlers(): void {
  ipcMain.handle('dataset:save', async (_event, filePath: string, content: string) => {
    try {
      const dir = dirname(resolve(filePath))
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      const tmpPath = filePath + '.tmp'
      writeFileSync(tmpPath, content, 'utf-8')
      renameSync(tmpPath, filePath)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('dataset:load', async (_event, filePath: string) => {
    try {
      const content = readFileSync(filePath, 'utf-8')
      const dataset = DatasetService.deserialize(content)
      return { success: true, data: dataset }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('dialog:save', async () => {
    const result = await dialog.showSaveDialog({
      filters: [{ name: 'Finance Dataset', extensions: ['fina', 'json'] }]
    })
    return result
  })

  ipcMain.handle('dataset:createDefault', async () => {
    try {
      const datasetsDir = join(app.getPath('userData'), 'datasets')
      if (!existsSync(datasetsDir)) {
        mkdirSync(datasetsDir, { recursive: true })
      }
      const defaultPath = join(datasetsDir, 'default.fina')
      const categories = CategoryService.createDefaultCategories()
      const dataset = DatasetService.create('My Finances', 'USD', categories)
      const content = DatasetService.serialize(dataset)
      const tmpPath = defaultPath + '.tmp'
      writeFileSync(tmpPath, content, 'utf-8')
      renameSync(tmpPath, defaultPath)
      return { success: true, path: defaultPath }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('dialog:open', async () => {
    const result = await dialog.showOpenDialog({
      filters: [{ name: 'Finance Dataset', extensions: ['fina', 'json'] }],
      properties: ['openFile']
    })
    return result
  })
}
