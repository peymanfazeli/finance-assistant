import { ipcMain, app } from 'electron'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

interface ReceivableConfigData {
  title: string
  category: string
  totalAmount: number
  from: string
  notes: string
}

interface CategoryConfigData {
  name: string
  color: string
  icon: string
  isDefault: boolean
}

function getConfigsDir(): string {
  if (is.dev) {
    return join(process.cwd(), 'src', 'Configs')
  }
  return join(app.getAppPath(), 'src', 'Configs')
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_') || 'dataset'
}

function getDefaultCatPath(): string {
  return join(getConfigsDir(), 'def_cat.ts')
}

function getDefaultRecievPath(): string {
  return join(getConfigsDir(), 'def_reciev.ts')
}

function getDatasetCatPath(datasetName: string): string {
  return join(getConfigsDir(), `${sanitizeFileName(datasetName)}_cat.ts`)
}

function getDatasetRecievPath(datasetName: string): string {
  return join(getConfigsDir(), `${sanitizeFileName(datasetName)}_reciev.ts`)
}

function buildReceivablesFileContent(receivables: ReceivableConfigData[]): string {
  const entries = receivables
    .map(
      (r) =>
        `  { title: ${JSON.stringify(r.title)}, category: ${JSON.stringify(r.category)}, totalAmount: ${r.totalAmount}, from: ${JSON.stringify(r.from)}, notes: ${JSON.stringify(r.notes)} }`
    )
    .join(',\n')

  return `export interface ReceivableConfig {
  title: string
  category: string
  totalAmount: number
  from: string
  notes: string
}

export const DEFAULT_RECEIVABLES: ReceivableConfig[] = [
${entries}
]
`
}

function buildCategoriesFileContent(categories: CategoryConfigData[]): string {
  const entries = categories
    .map(
      (c) =>
        `    { name: ${JSON.stringify(c.name)}, color: ${JSON.stringify(c.color)}, icon: ${JSON.stringify(c.icon)}, isDefault: ${c.isDefault} }`
    )
    .join(',\n')

  return `import { Category } from '../core/models/types'
export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt'>[] = [
${entries}
  ]
`
}

function writeAtomically(filePath: string, content: string): void {
  const tmpPath = filePath + '.tmp'
  writeFileSync(tmpPath, content, 'utf-8')
  const { renameSync } = require('fs')
  renameSync(tmpPath, filePath)
}

function parseConfigArray(content: string): string[] {
  const bracketStart = content.indexOf('[')
  const bracketEnd = content.lastIndexOf(']')
  if (bracketStart === -1 || bracketEnd === -1) return []
  const body = content.slice(bracketStart + 1, bracketEnd)
  const entries: string[] = []
  let depth = 0
  let current = ''
  for (const ch of body) {
    if (ch === '{') { depth++; current += ch }
    else if (ch === '}') { depth--; current += ch; if (depth === 0) { entries.push(current); current = '' } }
    else if (depth > 0) { current += ch }
  }
  return entries
}

function extractField(entry: string, field: string): string {
  const m = entry.match(new RegExp(`${field}:\\s*["']([^"']*)["']`))
  return m ? m[1] : ''
}

function extractNumber(entry: string, field: string): number {
  const m = entry.match(new RegExp(`${field}:\\s*(\\d+)`))
  return m ? parseInt(m[1], 10) : 0
}

function extractBool(entry: string, field: string): boolean {
  const m = entry.match(new RegExp(`${field}:\\s*(true|false)`))
  return m ? m[1] === 'true' : false
}

export function registerConfigHandlers(): void {
  ipcMain.handle(
    'config:createDatasetConfigs',
    async (_event, datasetName: string) => {
      try {
        const configsDir = getConfigsDir()
        if (!existsSync(configsDir)) {
          mkdirSync(configsDir, { recursive: true })
        }

        const catPath = getDatasetCatPath(datasetName)
        const recievPath = getDatasetRecievPath(datasetName)

        const defaultCat = getDefaultCatPath()
        const defaultReciev = getDefaultRecievPath()

        if (!existsSync(catPath) && existsSync(defaultCat)) {
          writeFileSync(catPath, readFileSync(defaultCat, 'utf-8'), 'utf-8')
        }
        if (!existsSync(recievPath) && existsSync(defaultReciev)) {
          writeFileSync(recievPath, readFileSync(defaultReciev, 'utf-8'), 'utf-8')
        }

        return { success: true, catPath, recievPath }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'config:syncReceivables',
    async (_event, datasetName: string, receivables: ReceivableConfigData[]) => {
      try {
        const filePath = getDatasetRecievPath(datasetName)
        const content = buildReceivablesFileContent(receivables)
        writeAtomically(filePath, content)
        return { success: true }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'config:syncCategories',
    async (_event, datasetName: string, categories: CategoryConfigData[]) => {
      try {
        const filePath = getDatasetCatPath(datasetName)
        const content = buildCategoriesFileContent(categories)
        writeAtomically(filePath, content)
        return { success: true }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    'config:readConfigForImport',
    async (_event, csvBaseName: string) => {
      try {
        const configsDir = getConfigsDir()

        let catPath = join(configsDir, `${csvBaseName}_cat.ts`)
        let recievPath = join(configsDir, `${csvBaseName}_reciev.ts`)
        let source = csvBaseName

        if (!existsSync(catPath)) {
          catPath = getDefaultCatPath()
          source = 'def'
        }
        if (!existsSync(recievPath)) {
          recievPath = getDefaultRecievPath()
          source = existsSync(join(configsDir, `${csvBaseName}_cat.ts`)) ? csvBaseName : 'def'
        }

        const categories: CategoryConfigData[] = []
        if (existsSync(catPath)) {
          const catContent = readFileSync(catPath, 'utf-8')
          for (const entry of parseConfigArray(catContent)) {
            categories.push({
              name: extractField(entry, 'name'),
              color: extractField(entry, 'color'),
              icon: extractField(entry, 'icon'),
              isDefault: extractBool(entry, 'isDefault')
            })
          }
        }

        const receivables: ReceivableConfigData[] = []
        if (existsSync(recievPath)) {
          const recContent = readFileSync(recievPath, 'utf-8')
          for (const entry of parseConfigArray(recContent)) {
            receivables.push({
              title: extractField(entry, 'title'),
              category: extractField(entry, 'category'),
              totalAmount: extractNumber(entry, 'totalAmount'),
              from: extractField(entry, 'from'),
              notes: extractField(entry, 'notes')
            })
          }
        }

        return { success: true, categories, receivables, source }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )
}
