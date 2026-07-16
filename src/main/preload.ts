import { contextBridge, ipcRenderer } from 'electron'
import { Dataset, ApplicationSettings } from '../core/models/types'

const api = {
  send: (channel: string, ...args: unknown[]) => {
    ipcRenderer.send(channel, ...args)
  },
  invoke: (channel: string, ...args: unknown[]): Promise<unknown> => {
    return ipcRenderer.invoke(channel, ...args)
  },
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args))
  },
  receive: (channel: string, callback: (...args: unknown[]) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]): void => callback(...args)
    ipcRenderer.on(channel, handler)
    return () => { ipcRenderer.removeListener(channel, handler) }
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },
  dataset: {
    save: (filePath: string, content: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('dataset:save', filePath, content),
    load: (filePath: string): Promise<{ success: boolean; data?: Dataset; error?: string }> =>
      ipcRenderer.invoke('dataset:load', filePath),
    createDefault: (): Promise<{ success: boolean; path?: string; error?: string }> =>
      ipcRenderer.invoke('dataset:createDefault'),
    createNamed: (name: string, currency: string, categories?: { id: string; name: string; color: string; icon: string; isDefault: boolean; createdAt: string }[], receivables?: { id: string; title: string; categoryId: string; totalAmount: number; from: string; notes: string; createdAt: string; updatedAt: string }[], transactions?: { id: string; date: string; title: string; categoryId: string; type: string; amount: number; notes: string; createdAt: string; updatedAt: string }[]): Promise<{ success: boolean; path?: string; error?: string }> =>
      ipcRenderer.invoke('dataset:createNamed', name, currency, categories, receivables, transactions),
    showSaveDialog: (): Promise<Electron.OpenDialogReturnValue> =>
      ipcRenderer.invoke('dialog:save'),
    showOpenDialog: (): Promise<Electron.OpenDialogReturnValue> =>
      ipcRenderer.invoke('dialog:open')
  },
  settings: {
    load: (): Promise<{ success: boolean; data?: ApplicationSettings | null; error?: string }> =>
      ipcRenderer.invoke('settings:load'),
    save: (content: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('settings:save', content)
  },
  file: {
    read: (filePath: string): Promise<{ success: boolean; data?: string; ext?: string; error?: string }> =>
      ipcRenderer.invoke('file:read', filePath),
    openDialog: (): Promise<Electron.OpenDialogReturnValue> =>
      ipcRenderer.invoke('dialog:openFile')
  },
  menu: {
    updateLanguage: (lang: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('menu:updateLanguage', lang)
  },
  export: {
    saveFile: (filePath: string, content: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('export:saveFile', filePath, content),
    saveFileBinary: (filePath: string, base64: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('export:saveFileBinary', filePath, base64),
    showSaveDialog: (defaultName: string, filters: Electron.FileFilter[]): Promise<Electron.SaveDialogReturnValue> =>
      ipcRenderer.invoke('dialog:saveExport', defaultName, filters),
    getLastExportTimestamp: (): Promise<{ timestamp: string | null }> =>
      ipcRenderer.invoke('export:get-last-timestamp'),
    saveLastExportTimestamp: (timestamp: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('export:save-last-timestamp', timestamp),
    confirmClose: (): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('app:confirm-close'),
    cancelClose: (): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('app:cancel-close')
  },
  config: {
    createDatasetConfigs: (datasetName: string): Promise<{ success: boolean; catPath?: string; recievPath?: string; error?: string }> =>
      ipcRenderer.invoke('config:createDatasetConfigs', datasetName),
    syncReceivables: (datasetName: string, receivables: { title: string; category: string; totalAmount: number; from: string; notes: string }[]): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('config:syncReceivables', datasetName, receivables),
    syncCategories: (datasetName: string, categories: { name: string; color: string; icon: string; isDefault: boolean }[]): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('config:syncCategories', datasetName, categories),
    readConfigForImport: (csvBaseName: string): Promise<{ success: boolean; categories?: { name: string; color: string; icon: string; isDefault: boolean }[]; receivables?: { title: string; category: string; totalAmount: number; from: string; notes: string }[]; source?: string; error?: string }> =>
      ipcRenderer.invoke('config:readConfigForImport', csvBaseName)
  },
  print: {
    toPdf: (html: string): Promise<{ success: boolean; data?: string; error?: string }> =>
      ipcRenderer.invoke('print:pdf', html)
  }
}

contextBridge.exposeInMainWorld('api', api)
