import { app, Menu, MenuItemConstructorOptions, BrowserWindow, ipcMain } from 'electron'

const LABELS: Record<string, Record<string, string>> = {
  en: {
    file: 'File',
    edit: 'Edit',
    view: 'View',
    help: 'Help',
    openDataset: 'Open Dataset',
    aboutApp: 'About Finance Assistant'
  },
  fa: {
    file: 'پرونده',
    edit: 'ویرایش',
    view: 'نمایش',
    help: 'راهنما',
    openDataset: 'باز کردن مجموعه داده',
    aboutApp: 'درباره دستیار مالی'
  }
}

function buildMenu(lang: string): void {
  const l = LABELS[lang] || LABELS.en
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [{
          label: app.name,
          submenu: [
            { role: 'about' as const },
            { type: 'separator' as const },
            { role: 'quit' as const }
          ]
        }]
      : []),
    {
      label: l.file,
      submenu: [
        {
          label: l.openDataset,
          accelerator: 'CmdOrCtrl+O',
          click: async (): Promise<void> => {
            const win = BrowserWindow.getFocusedWindow()
            if (win) win.webContents.send('menu:open')
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' as const } : { role: 'quit' as const }
      ]
    },
    {
      label: l.edit,
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { role: 'selectAll' as const }
      ]
    },
    {
      label: l.view,
      submenu: [
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const }
      ]
    },
    {
      label: l.help,
      submenu: [
        {
          label: l.aboutApp,
          click: (): void => {
            const win = BrowserWindow.getFocusedWindow()
            if (win) win.webContents.send('menu:about')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

export function createAppMenu(): void {
  buildMenu('en')
}

export function registerMenuHandlers(): void {
  ipcMain.handle('menu:updateLanguage', async (_event, lang: string) => {
    buildMenu(lang)
    return { success: true }
  })
}
