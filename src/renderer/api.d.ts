import { Dataset, ApplicationSettings } from '../core/models/types'

declare global {
  interface Window {
    api: {
      send: (channel: string, ...args: unknown[]) => void
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
      on: (channel: string, callback: (...args: unknown[]) => void) => void
      receive: (channel: string, callback: (...args: unknown[]) => void) => () => void
      removeAllListeners: (channel: string) => void
      dataset: {
        save: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
        load: (filePath: string) => Promise<{ success: boolean; data?: Dataset; error?: string }>
        createDefault: () => Promise<{ success: boolean; path?: string; error?: string }>
        createNamed: (name: string, currency: string, categories?: { id: string; name: string; color: string; icon: string; isDefault: boolean; createdAt: string }[], receivables?: { id: string; title: string; categoryId: string; totalAmount: number; from: string; notes: string; createdAt: string; updatedAt: string }[], transactions?: { id: string; date: string; title: string; categoryId: string; type: string; amount: number; notes: string; createdAt: string; updatedAt: string }[]) => Promise<{ success: boolean; path?: string; error?: string }>
        showSaveDialog: () => Promise<Electron.OpenDialogReturnValue>
        showOpenDialog: () => Promise<Electron.OpenDialogReturnValue>
      }
      settings: {
        load: () => Promise<{ success: boolean; data?: ApplicationSettings | null; error?: string }>
        save: (content: string) => Promise<{ success: boolean; error?: string }>
      }
      file: {
        read: (filePath: string) => Promise<{ success: boolean; data?: string; ext?: string; error?: string }>
        openDialog: () => Promise<Electron.OpenDialogReturnValue>
      }
      menu: {
        updateLanguage: (lang: string) => Promise<{ success: boolean }>
      }
      export: {
        saveFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
        saveFileBinary: (filePath: string, base64: string) => Promise<{ success: boolean; error?: string }>
        showSaveDialog: (defaultName: string, filters: Electron.FileFilter[]) => Promise<Electron.SaveDialogReturnValue>
      }
      config: {
        createDatasetConfigs: (datasetName: string) => Promise<{ success: boolean; catPath?: string; recievPath?: string; error?: string }>
        syncReceivables: (datasetName: string, receivables: { title: string; category: string; totalAmount: number; from: string; notes: string }[]) => Promise<{ success: boolean; error?: string }>
        syncCategories: (datasetName: string, categories: { name: string; color: string; icon: string; isDefault: boolean }[]) => Promise<{ success: boolean; error?: string }>
        readConfigForImport: (csvBaseName: string) => Promise<{ success: boolean; categories?: { name: string; color: string; icon: string; isDefault: boolean }[]; receivables?: { title: string; category: string; totalAmount: number; from: string; notes: string }[]; source?: string; error?: string }>
      }
      print: {
        toPdf: (html: string) => Promise<{ success: boolean; data?: string; error?: string }>
      }
    }
  }
}

export {}
