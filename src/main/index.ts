import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { join } from 'path'
import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerDatasetHandlers, cleanupTempFiles } from './datasetHandlers'
import { registerSettingsHandlers } from './settingsHandlers'
import { registerFileHandlers } from './fileHandlers'
import { registerExportHandlers } from './exportHandlers'
import { registerCloseHandlers } from './closeHandlers'
import { registerConfigHandlers } from './configHandlers'
import { createAppMenu, registerMenuHandlers } from './menu'

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: 'Finance Assistant',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function getLogPath(): string {
  return `${app.getPath('userData')}/logs/error.log`
}

function ensureLogDir(): void {
  const logDir = `${app.getPath('userData')}/logs`
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true })
  }
}

function writeErrorLog(context: string, message: string): void {
  try {
    ensureLogDir()
    const timestamp = new Date().toISOString()
    appendFileSync(getLogPath(), `[${timestamp}] ERROR [${context}]: ${message}\n`, 'utf-8')
  } catch { /* silent */ }
}

let mainWindow: BrowserWindow | null = null
let isQuitting = false
let pendingSaves = 0

export function notifySaveStarted(): void {
  pendingSaves++
}

export function notifySaveCompleted(): void {
  pendingSaves--
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.finance.assistant')

  cleanupTempFiles()
  registerDatasetHandlers()
  registerSettingsHandlers()
  registerFileHandlers()
  registerExportHandlers()
  registerConfigHandlers()
  createAppMenu()
  registerMenuHandlers()

  ipcMain.handle('log:error', async (_event, context: string, message: string) => {
    writeErrorLog(context, message)
    return { success: true }
  })

  ipcMain.handle('app:saveStarted', async () => {
    notifySaveStarted()
    return { success: true }
  })

  ipcMain.handle('app:saveCompleted', async () => {
    notifySaveCompleted()
    return { success: true }
  })

  ipcMain.handle('print:pdf', async (_event, html: string) => {
    const printWindow = new BrowserWindow({
      show: false,
      width: 800,
      height: 600,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

    try {
      const pdfData = await printWindow.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        marginTop: 0.4,
        marginBottom: 0.4,
        marginLeft: 0.4,
        marginRight: 0.4
      })
      const base64 = pdfData.toString('base64')
      return { success: true, data: base64 }
    } catch (err) {
      console.error('PDF generation failed:', err)
      return { success: false, error: String(err) }
    } finally {
      printWindow.close()
    }
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  registerCloseHandlers(mainWindow!)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('before-quit', (event) => {
  if (!isQuitting && pendingSaves > 0) {
    isQuitting = true
    event.preventDefault()
    const maxWait = 5000
    const start = Date.now()
    const check = (): void => {
      if (pendingSaves <= 0 || Date.now() - start > maxWait) {
        isQuitting = false
        app.quit()
      } else {
        setTimeout(check, 50)
      }
    }
    check()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
