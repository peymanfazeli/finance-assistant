import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import {
  Category,
  Dataset,
  Payable,
  PayableInstallment,
  Receivable,
  Transaction,
  Wallet
} from '../models/types'
import { DatasetService } from './DatasetService'
import {
  countDatasetRecords,
  DATASET_EXPORT_FORMAT_VERSION,
  DATASET_RECORD_TYPES,
  DatasetImportError,
  DatasetRecordType,
  normalizeImportedDataset,
  validateDataset
} from './DatasetTransferService'

const WORKBOOK_METADATA_SHEET = 'Metadata'
const WORKBOOK_DATASET_SHEET = 'Dataset'
const CATEGORY_HEADERS = ['id', 'name', 'color', 'icon', 'isDefault', 'createdAt']
const WALLET_HEADERS = ['id', 'name', 'initialBalance', 'color', 'createdAt']
const RECEIVABLE_HEADERS = ['id', 'title', 'categoryId', 'totalAmount', 'from', 'notes', 'askDate', 'createdAt', 'updatedAt']
const PAYABLE_HEADERS = ['id', 'title', 'categoryId', 'totalAmount', 'to', 'notes', 'dueDate', 'createdAt', 'updatedAt']
const INSTALLMENT_HEADERS = ['payableId', 'id', 'amount', 'dueDate', 'status', 'paidAt', 'createdAt', 'updatedAt']
const TRANSACTION_HEADERS = ['id', 'date', 'title', 'categoryId', 'type', 'amount', 'notes', 'walletId', 'toWalletId', 'payableId', 'installmentId', 'createdAt', 'updatedAt']
const REQUIRED_SHEETS = [
  WORKBOOK_METADATA_SHEET,
  WORKBOOK_DATASET_SHEET,
  'Categories',
  'Wallets',
  'Receivables',
  'Payables',
  'PayableInstallments',
  'Transactions'
]
const CSV_HEADERS = ['record_type', 'record_id', 'parent_id', 'data_json']

interface CsvRecord {
  recordType: DatasetRecordType
  recordId: string
  parentId: string
  data: Record<string, unknown>
}

function cellValue(value: unknown): unknown {
  if (value === undefined || value === null) return ''
  return value
}

function tableSheet(headers: string[], rows: Record<string, unknown>[]): XLSX.WorkSheet {
  return XLSX.utils.aoa_to_sheet([
    headers,
    ...rows.map((row) => headers.map((header) => cellValue(row[header])))
  ])
}

function keyValueSheet(rows: { key: string; value: unknown }[]): XLSX.WorkSheet {
  return tableSheet(['Field', 'Value'], rows.map((row) => ({ Field: row.key, Value: row.value })))
}

function readTable(sheet: XLSX.WorkSheet, requiredHeaders: string[]): Record<string, unknown>[] {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
  const headers = (matrix[0] ?? []).map((header) => String(header))
  for (const header of requiredHeaders) {
    if (!headers.includes(header)) {
      throw new DatasetImportError(`Workbook sheet is missing required column: ${header}`)
    }
  }
  return matrix.slice(1)
    .filter((row) => row.some((value) => value !== '' && value !== undefined && value !== null))
    .map((row) => {
      const record: Record<string, unknown> = {}
      headers.forEach((header, index) => {
        record[header] = row[index] ?? ''
      })
      return record
    })
}

function textValue(value: unknown, label: string): string {
  if (value === undefined || value === null) return ''
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  throw new DatasetImportError(`${label} must be a text value`)
}

function numberValue(value: unknown, label: string): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  throw new DatasetImportError(`${label} must be a finite number`)
}

function booleanValue(value: unknown, label: string): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number' && (value === 0 || value === 1)) return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true' || normalized === '1') return true
    if (normalized === 'false' || normalized === '0' || normalized === '') return false
  }
  throw new DatasetImportError(`${label} must be a boolean`)
}

function optionalTextValue(value: unknown, label: string): string | undefined {
  const text = textValue(value, label)
  return text === '' ? undefined : text
}

function parseJsonRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === '' || value === undefined || value === null) return {}
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      throw new DatasetImportError(`${label} must contain a JSON object`)
    }
  }
  throw new DatasetImportError(`${label} must contain a JSON object`)
}

function workbookFromBase64(base64: string): XLSX.WorkBook {
  try {
    const workbook = XLSX.read(base64, { type: 'base64' })
    const missing = REQUIRED_SHEETS.filter((sheet) => !workbook.SheetNames.includes(sheet))
    if (missing.length > 0) {
      throw new DatasetImportError(`Workbook is missing required sheets: ${missing.join(', ')}`)
    }
    return workbook
  } catch (error) {
    if (error instanceof DatasetImportError) throw error
    throw new DatasetImportError(`Invalid workbook: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseCsvRecord(row: Record<string, string>, index: number): CsvRecord {
  const recordType = String(row.record_type ?? '').trim()
  if (!DATASET_RECORD_TYPES.includes(recordType as DatasetRecordType)) {
    throw new DatasetImportError(`CSV row ${index + 1} has an invalid record_type: ${recordType}`)
  }
  let data: unknown
  try {
    data = JSON.parse(String(row.data_json ?? ''))
  } catch (error) {
    throw new DatasetImportError(`CSV row ${index + 1} has invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
  }
  if (!isRecordObject(data)) {
    throw new DatasetImportError(`CSV row ${index + 1} data_json must contain an object`)
  }
  return {
    recordType: recordType as DatasetRecordType,
    recordId: String(row.record_id ?? '').trim(),
    parentId: String(row.parent_id ?? '').trim(),
    data
  }
}

function readCsvRecords(content: string): CsvRecord[] {
  const normalized = content.replace(/^\uFEFF/, '')
  const headerLine = normalized.split(/\r?\n/, 1)[0] ?? ''
  if (headerLine !== CSV_HEADERS.join(',')) {
    throw new DatasetImportError('CSV header must be record_type,record_id,parent_id,data_json')
  }
  const parsed = Papa.parse<Record<string, string>>(normalized, {
    header: true,
    skipEmptyLines: true
  })
  if (parsed.errors.length > 0) {
    throw new DatasetImportError(`Invalid CSV: ${parsed.errors[0].message}`)
  }
  return parsed.data.map((row, index) => parseCsvRecord(row, index))
}

function payableWithoutInstallments(payable: Payable): Record<string, unknown> {
  const { installments: _installments, ...fields } = payable
  return fields
}

export function exportFinaDataset(dataset: Dataset): string {
  validateDataset(dataset)
  return DatasetService.serialize(dataset)
}

export function importFinaDataset(content: string): Dataset {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch (error) {
    throw new DatasetImportError(`Invalid dataset file: ${error instanceof Error ? error.message : String(error)}`)
  }
  return normalizeImportedDataset(parsed)
}

export function isCompleteDatasetWorkbook(base64: string): boolean {
  try {
    const workbook = XLSX.read(base64, { type: 'base64' })
    if (!workbook.SheetNames.includes(WORKBOOK_METADATA_SHEET)) return false
    const rows = readTable(workbook.Sheets[WORKBOOK_METADATA_SHEET], ['Field', 'Value'])
    return rows.some((row) => row.Field === 'formatVersion' && Number(row.Value) === DATASET_EXPORT_FORMAT_VERSION)
  } catch {
    return false
  }
}

export function exportXlsxDataset(dataset: Dataset): string {
  validateDataset(dataset)
  const payables = dataset.payables ?? []
  const installments = payables.flatMap((payable) =>
    (payable.installments ?? []).map((installment) => ({
      payableId: payable.id,
      ...installment
    }))
  )
  const metadata: { key: string; value: unknown }[] = [
    { key: 'formatVersion', value: DATASET_EXPORT_FORMAT_VERSION },
    { key: 'datasetVersion', value: dataset.version },
    { key: 'name', value: dataset.name },
    { key: 'currency', value: dataset.currency },
    { key: 'createdAt', value: dataset.createdAt },
    { key: 'updatedAt', value: dataset.updatedAt },
    { key: 'categoryCount', value: dataset.categories.length },
    { key: 'walletCount', value: (dataset.wallets ?? []).length },
    { key: 'receivableCount', value: dataset.receivables.length },
    { key: 'payableCount', value: payables.length },
    { key: 'installmentCount', value: installments.length },
    { key: 'transactionCount', value: dataset.transactions.length }
  ]
  const fields: { key: string; value: unknown }[] = [
    { key: 'version', value: dataset.version },
    { key: 'name', value: dataset.name },
    { key: 'currency', value: dataset.currency },
    { key: 'createdAt', value: dataset.createdAt },
    { key: 'updatedAt', value: dataset.updatedAt },
    { key: 'categoryTypeMap', value: JSON.stringify(dataset.categoryTypeMap ?? {}) },
    { key: 'budgetPercentages', value: JSON.stringify(dataset.budgetPercentages ?? {}) }
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, keyValueSheet(metadata), WORKBOOK_METADATA_SHEET)
  XLSX.utils.book_append_sheet(workbook, keyValueSheet(fields), WORKBOOK_DATASET_SHEET)
  XLSX.utils.book_append_sheet(workbook, tableSheet(CATEGORY_HEADERS, dataset.categories as unknown as Record<string, unknown>[]), 'Categories')
  XLSX.utils.book_append_sheet(workbook, tableSheet(WALLET_HEADERS, (dataset.wallets ?? []) as unknown as Record<string, unknown>[]), 'Wallets')
  XLSX.utils.book_append_sheet(workbook, tableSheet(RECEIVABLE_HEADERS, dataset.receivables as unknown as Record<string, unknown>[]), 'Receivables')
  XLSX.utils.book_append_sheet(workbook, tableSheet(PAYABLE_HEADERS, payables.map(({ installments: _installments, ...payable }) => payable) as unknown as Record<string, unknown>[]), 'Payables')
  XLSX.utils.book_append_sheet(workbook, tableSheet(INSTALLMENT_HEADERS, installments as unknown as Record<string, unknown>[]), 'PayableInstallments')
  XLSX.utils.book_append_sheet(workbook, tableSheet(TRANSACTION_HEADERS, dataset.transactions as unknown as Record<string, unknown>[]), 'Transactions')

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' })
}

export function importXlsxDataset(base64: string): Dataset {
  const workbook = workbookFromBase64(base64)
  const metadataRows = readTable(workbook.Sheets[WORKBOOK_METADATA_SHEET], ['Field', 'Value'])
  const metadata = new Map(metadataRows.map((row) => [textValue(row.Field, 'Metadata field'), row.Value]))
  const formatVersion = numberValue(metadata.get('formatVersion'), 'Metadata formatVersion')
  if (formatVersion !== DATASET_EXPORT_FORMAT_VERSION) {
    throw new DatasetImportError(`Unsupported dataset workbook format: ${formatVersion}`)
  }

  const datasetRows = readTable(workbook.Sheets[WORKBOOK_DATASET_SHEET], ['Field', 'Value'])
  const fields = new Map(datasetRows.map((row) => [textValue(row.Field, 'Dataset field'), row.Value]))

  const categories: Category[] = readTable(workbook.Sheets.Categories, CATEGORY_HEADERS).map((row, index) => ({
    id: textValue(row.id, `Category ${index + 1} id`),
    name: textValue(row.name, `Category ${index + 1} name`),
    color: textValue(row.color, `Category ${index + 1} color`),
    icon: textValue(row.icon, `Category ${index + 1} icon`),
    isDefault: booleanValue(row.isDefault, `Category ${index + 1} isDefault`),
    createdAt: textValue(row.createdAt, `Category ${index + 1} createdAt`)
  }))

  const wallets: Wallet[] = readTable(workbook.Sheets.Wallets, WALLET_HEADERS).map((row, index) => ({
    id: textValue(row.id, `Wallet ${index + 1} id`),
    name: textValue(row.name, `Wallet ${index + 1} name`),
    initialBalance: numberValue(row.initialBalance, `Wallet ${index + 1} initialBalance`),
    color: textValue(row.color, `Wallet ${index + 1} color`),
    createdAt: textValue(row.createdAt, `Wallet ${index + 1} createdAt`)
  }))

  const receivables: Receivable[] = readTable(workbook.Sheets.Receivables, RECEIVABLE_HEADERS).map((row, index) => ({
    id: textValue(row.id, `Receivable ${index + 1} id`),
    title: textValue(row.title, `Receivable ${index + 1} title`),
    categoryId: textValue(row.categoryId, `Receivable ${index + 1} categoryId`),
    totalAmount: numberValue(row.totalAmount, `Receivable ${index + 1} totalAmount`),
    from: textValue(row.from, `Receivable ${index + 1} from`),
    notes: textValue(row.notes, `Receivable ${index + 1} notes`),
    askDate: optionalTextValue(row.askDate, `Receivable ${index + 1} askDate`),
    createdAt: textValue(row.createdAt, `Receivable ${index + 1} createdAt`),
    updatedAt: textValue(row.updatedAt, `Receivable ${index + 1} updatedAt`)
  }))

  const payables: Payable[] = readTable(workbook.Sheets.Payables, PAYABLE_HEADERS).map((row, index) => ({
    id: textValue(row.id, `Payable ${index + 1} id`),
    title: textValue(row.title, `Payable ${index + 1} title`),
    categoryId: textValue(row.categoryId, `Payable ${index + 1} categoryId`),
    totalAmount: numberValue(row.totalAmount, `Payable ${index + 1} totalAmount`),
    to: textValue(row.to, `Payable ${index + 1} to`),
    notes: textValue(row.notes, `Payable ${index + 1} notes`),
    dueDate: optionalTextValue(row.dueDate, `Payable ${index + 1} dueDate`),
    installments: [],
    createdAt: textValue(row.createdAt, `Payable ${index + 1} createdAt`),
    updatedAt: textValue(row.updatedAt, `Payable ${index + 1} updatedAt`)
  }))
  const payableMap = new Map(payables.map((payable) => [payable.id, payable]))

  readTable(workbook.Sheets.PayableInstallments, INSTALLMENT_HEADERS).forEach((row, index) => {
    const label = `PayableInstallment ${index + 1}`
    const payableId = textValue(row.payableId, `${label} payableId`)
    const payable = payableMap.get(payableId)
    if (!payable) {
      throw new DatasetImportError(`${label} references an unknown payable: ${payableId}`)
    }
    const installment: PayableInstallment = {
      id: textValue(row.id, `${label} id`),
      amount: numberValue(row.amount, `${label} amount`),
      dueDate: textValue(row.dueDate, `${label} dueDate`),
      status: textValue(row.status, `${label} status`) as PayableInstallment['status'],
      paidAt: optionalTextValue(row.paidAt, `${label} paidAt`),
      createdAt: textValue(row.createdAt, `${label} createdAt`),
      updatedAt: textValue(row.updatedAt, `${label} updatedAt`)
    }
    payable.installments?.push(installment)
  })

  const transactions: Transaction[] = readTable(workbook.Sheets.Transactions, TRANSACTION_HEADERS).map((row, index) => ({
    id: textValue(row.id, `Transaction ${index + 1} id`),
    date: textValue(row.date, `Transaction ${index + 1} date`),
    title: textValue(row.title, `Transaction ${index + 1} title`),
    categoryId: textValue(row.categoryId, `Transaction ${index + 1} categoryId`),
    type: textValue(row.type, `Transaction ${index + 1} type`) as Transaction['type'],
    amount: numberValue(row.amount, `Transaction ${index + 1} amount`),
    notes: textValue(row.notes, `Transaction ${index + 1} notes`),
    walletId: optionalTextValue(row.walletId, `Transaction ${index + 1} walletId`),
    toWalletId: optionalTextValue(row.toWalletId, `Transaction ${index + 1} toWalletId`),
    payableId: optionalTextValue(row.payableId, `Transaction ${index + 1} payableId`),
    installmentId: optionalTextValue(row.installmentId, `Transaction ${index + 1} installmentId`),
    createdAt: textValue(row.createdAt, `Transaction ${index + 1} createdAt`),
    updatedAt: textValue(row.updatedAt, `Transaction ${index + 1} updatedAt`)
  }))

  return normalizeImportedDataset({
    version: numberValue(fields.get('version'), 'Dataset version'),
    name: textValue(fields.get('name'), 'Dataset name'),
    currency: textValue(fields.get('currency'), 'Dataset currency'),
    createdAt: textValue(fields.get('createdAt'), 'Dataset createdAt'),
    updatedAt: textValue(fields.get('updatedAt'), 'Dataset updatedAt'),
    categories,
    wallets,
    receivables,
    payables,
    transactions,
    categoryTypeMap: parseJsonRecord(fields.get('categoryTypeMap'), 'Dataset categoryTypeMap'),
    budgetPercentages: parseJsonRecord(fields.get('budgetPercentages'), 'Dataset budgetPercentages')
  })
}

export function isCompleteDatasetCSV(content: string): boolean {
  try {
    const records = readCsvRecords(content)
    const metadata = records.find((record) => record.recordType === 'metadata')
    return Boolean(metadata && numberValue(metadata.data.formatVersion, 'Metadata formatVersion') === DATASET_EXPORT_FORMAT_VERSION)
  } catch {
    return false
  }
}

export function exportCsvDataset(dataset: Dataset): string {
  validateDataset(dataset)
  const payables = dataset.payables ?? []
  const installments = payables.flatMap((payable) =>
    (payable.installments ?? []).map((installment) => ({ payableId: payable.id, installment }))
  )
  const records: CsvRecord[] = [
    {
      recordType: 'metadata',
      recordId: 'format',
      parentId: '',
      data: {
        formatVersion: DATASET_EXPORT_FORMAT_VERSION,
        datasetVersion: dataset.version,
        name: dataset.name,
        currency: dataset.currency,
        createdAt: dataset.createdAt,
        updatedAt: dataset.updatedAt,
        counts: countDatasetRecords(dataset)
      }
    },
    {
      recordType: 'dataset',
      recordId: 'dataset',
      parentId: '',
      data: {
        version: dataset.version,
        name: dataset.name,
        currency: dataset.currency,
        createdAt: dataset.createdAt,
        updatedAt: dataset.updatedAt,
        categoryTypeMap: dataset.categoryTypeMap ?? {},
        budgetPercentages: dataset.budgetPercentages ?? {}
      }
    },
    ...dataset.categories.map((category) => ({
      recordType: 'category' as const,
      recordId: category.id,
      parentId: '',
      data: category as unknown as Record<string, unknown>
    })),
    ...(dataset.wallets ?? []).map((wallet) => ({
      recordType: 'wallet' as const,
      recordId: wallet.id,
      parentId: '',
      data: wallet as unknown as Record<string, unknown>
    })),
    ...dataset.receivables.map((receivable) => ({
      recordType: 'receivable' as const,
      recordId: receivable.id,
      parentId: '',
      data: receivable as unknown as Record<string, unknown>
    })),
    ...payables.map((payable) => ({
      recordType: 'payable' as const,
      recordId: payable.id,
      parentId: '',
      data: payableWithoutInstallments(payable)
    })),
    ...installments.map(({ payableId, installment }) => ({
      recordType: 'payable_installment' as const,
      recordId: installment.id,
      parentId: payableId,
      data: installment as unknown as Record<string, unknown>
    })),
    ...dataset.transactions.map((transaction) => ({
      recordType: 'transaction' as const,
      recordId: transaction.id,
      parentId: '',
      data: transaction as unknown as Record<string, unknown>
    }))
  ]

  const rows = records.map((record) => [
    record.recordType,
    record.recordId,
    record.parentId,
    JSON.stringify(record.data)
  ])
  return '\uFEFF' + Papa.unparse({ fields: CSV_HEADERS, data: rows })
}

export function importCsvDataset(content: string): Dataset {
  const records = readCsvRecords(content)
  const metadataRecord = records.find((record) => record.recordType === 'metadata')
  if (!metadataRecord) {
    throw new DatasetImportError('CSV backup is missing the metadata record')
  }
  if (numberValue(metadataRecord.data.formatVersion, 'Metadata formatVersion') !== DATASET_EXPORT_FORMAT_VERSION) {
    throw new DatasetImportError(`Unsupported CSV backup format: ${String(metadataRecord.data.formatVersion)}`)
  }

  const datasetRecords = records.filter((record) => record.recordType === 'dataset')
  if (datasetRecords.length !== 1) {
    throw new DatasetImportError('CSV backup must contain exactly one dataset record')
  }
  const datasetData = datasetRecords[0].data
  const categories: Category[] = []
  const wallets: Wallet[] = []
  const receivables: Receivable[] = []
  const payables: Payable[] = []
  const transactions: Transaction[] = []
  const installmentRecords: { payableId: string; data: Record<string, unknown> }[] = []

  for (const record of records) {
    switch (record.recordType) {
      case 'category':
        categories.push(record.data as unknown as Category)
        break
      case 'wallet':
        wallets.push(record.data as unknown as Wallet)
        break
      case 'receivable':
        receivables.push(record.data as unknown as Receivable)
        break
      case 'payable': {
        const payable = { ...record.data, installments: [] } as unknown as Payable
        payables.push(payable)
        break
      }
      case 'payable_installment':
        if (!record.parentId) {
          throw new DatasetImportError(`Installment ${record.recordId} is missing its payable id`)
        }
        installmentRecords.push({ payableId: record.parentId, data: record.data })
        break
      case 'transaction':
        transactions.push(record.data as unknown as Transaction)
        break
      default:
        break
    }
  }

  const payableMap = new Map(payables.map((payable) => [payable.id, payable]))
  for (const { payableId, data } of installmentRecords) {
    const payable = payableMap.get(payableId)
    if (!payable) {
      throw new DatasetImportError(`Installment references an unknown payable: ${payableId}`)
    }
    payable.installments?.push(data as unknown as PayableInstallment)
  }

  const candidate = {
    ...datasetData,
    categories,
    wallets,
    receivables,
    payables,
    transactions
  } as unknown as Dataset
  const expectedCounts = metadataRecord.data.counts
  if (isRecordObject(expectedCounts)) {
    const actualCounts = countDatasetRecords(candidate)
    const mismatch = Object.entries(actualCounts).find(([key, count]) => expectedCounts[key] !== count)
    if (mismatch) {
      throw new DatasetImportError(`CSV record count mismatch for ${mismatch[0]}`)
    }
  }

  return normalizeImportedDataset(candidate)
}
