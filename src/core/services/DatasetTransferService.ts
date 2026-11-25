import {
  Category,
  Dataset,
  InstallmentStatus,
  Payable,
  PayableInstallment,
  Receivable,
  Transaction,
  TransactionType,
  Wallet
} from '../models/types'
import { DatasetService } from './DatasetService'

export const DATASET_EXPORT_FORMAT_VERSION = 1

export const DATASET_RECORD_TYPES = [
  'metadata',
  'dataset',
  'category',
  'wallet',
  'receivable',
  'payable',
  'payable_installment',
  'transaction'
] as const

export type DatasetRecordType = typeof DATASET_RECORD_TYPES[number]

export class DatasetImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DatasetImportError'
  }
}

export interface DatasetCollectionCounts {
  categories: number
  wallets: number
  receivables: number
  payables: number
  installments: number
  transactions: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringField(value: unknown, label: string, issues: string[]): string {
  if (typeof value !== 'string') {
    issues.push(`${label} must be a string`)
    return ''
  }
  return value
}

function idField(value: unknown, label: string, issues: string[]): string {
  if (typeof value !== 'string' || value.length === 0) {
    issues.push(`${label} must be a non-empty string`)
    return ''
  }
  return value
}

function optionalStringField(value: unknown, label: string, issues: string[]): string | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string') {
    issues.push(`${label} must be a string`)
    return undefined
  }
  return value
}

function numberField(value: unknown, label: string, issues: string[]): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issues.push(`${label} must be a finite number`)
    return Number.NaN
  }
  return value
}

function booleanField(value: unknown, label: string, issues: string[]): boolean {
  if (typeof value !== 'boolean') {
    issues.push(`${label} must be a boolean`)
    return false
  }
  return value
}

function arrayField(value: unknown, label: string, issues: string[]): unknown[] {
  if (!Array.isArray(value)) {
    issues.push(`${label} must be an array`)
    return []
  }
  return value
}

function optionalObjectField(value: unknown, label: string, issues: string[]): Record<string, unknown> {
  if (value === undefined || value === null) return {}
  if (!isRecord(value)) {
    issues.push(`${label} must be an object`)
    return {}
  }
  return value
}

function transactionTypeField(value: unknown, label: string, issues: string[]): TransactionType {
  if (!Object.values(TransactionType).includes(value as TransactionType)) {
    issues.push(`${label} has an invalid transaction type`)
    return TransactionType.Expense
  }
  return value as TransactionType
}

function installmentStatusField(value: unknown, label: string, issues: string[]): InstallmentStatus {
  if (!Object.values(InstallmentStatus).includes(value as InstallmentStatus)) {
    issues.push(`${label} has an invalid installment status`)
    return InstallmentStatus.Pending
  }
  return value as InstallmentStatus
}

function uniqueId(id: string, label: string, seen: Set<string>, issues: string[]): void {
  if (seen.has(id)) {
    issues.push(`${label} has a duplicate id: ${id}`)
    return
  }
  seen.add(id)
}

export function countDatasetRecords(dataset: Dataset): DatasetCollectionCounts {
  const payables = dataset.payables ?? []
  return {
    categories: dataset.categories.length,
    wallets: (dataset.wallets ?? []).length,
    receivables: dataset.receivables.length,
    payables: payables.length,
    installments: payables.reduce((count, payable) => count + (payable.installments ?? []).length, 0),
    transactions: dataset.transactions.length
  }
}

export function validateDataset(input: unknown): Dataset {
  const issues: string[] = []
  if (!isRecord(input)) {
    throw new DatasetImportError('Dataset must be an object')
  }

  if (typeof input.version !== 'number' || !Number.isFinite(input.version) || input.version <= 0) {
    issues.push('Dataset version must be a positive number')
  }
  stringField(input.name, 'Dataset name', issues)
  stringField(input.currency, 'Dataset currency', issues)
  stringField(input.createdAt, 'Dataset createdAt', issues)
  stringField(input.updatedAt, 'Dataset updatedAt', issues)

  const categoryValues = arrayField(input.categories, 'Dataset categories', issues)
  const walletValues = arrayField(input.wallets, 'Dataset wallets', issues)
  const receivableValues = arrayField(input.receivables, 'Dataset receivables', issues)
  const payableValues = arrayField(input.payables, 'Dataset payables', issues)
  const transactionValues = arrayField(input.transactions, 'Dataset transactions', issues)
  const categoryTypeMap = optionalObjectField(input.categoryTypeMap, 'Dataset categoryTypeMap', issues)
  const budgetPercentages = optionalObjectField(input.budgetPercentages, 'Dataset budgetPercentages', issues)

  const categoryIds = new Set<string>()
  const categories = categoryValues.map((value, index) => {
    if (!isRecord(value)) {
      issues.push(`Category ${index + 1} must be an object`)
      return null
    }
    const label = `Category ${index + 1}`
    const id = idField(value.id, `${label} id`, issues)
    if (id) uniqueId(id, label, categoryIds, issues)
    const category: Category = {
      id,
      name: stringField(value.name, `${label} name`, issues),
      color: stringField(value.color, `${label} color`, issues),
      icon: stringField(value.icon, `${label} icon`, issues),
      isDefault: booleanField(value.isDefault, `${label} isDefault`, issues),
      createdAt: stringField(value.createdAt, `${label} createdAt`, issues)
    }
    return category
  }).filter((item): item is Category => item !== null)

  const walletIds = new Set<string>()
  const wallets = walletValues.map((value, index) => {
    if (!isRecord(value)) {
      issues.push(`Wallet ${index + 1} must be an object`)
      return null
    }
    const label = `Wallet ${index + 1}`
    const id = idField(value.id, `${label} id`, issues)
    if (id) uniqueId(id, label, walletIds, issues)
    const wallet: Wallet = {
      id,
      name: stringField(value.name, `${label} name`, issues),
      initialBalance: numberField(value.initialBalance, `${label} initialBalance`, issues),
      color: stringField(value.color, `${label} color`, issues),
      createdAt: stringField(value.createdAt, `${label} createdAt`, issues)
    }
    return wallet
  }).filter((item): item is Wallet => item !== null)

  const receivableIds = new Set<string>()
  const receivables = receivableValues.map((value, index) => {
    if (!isRecord(value)) {
      issues.push(`Receivable ${index + 1} must be an object`)
      return null
    }
    const label = `Receivable ${index + 1}`
    const id = idField(value.id, `${label} id`, issues)
    if (id) uniqueId(id, label, receivableIds, issues)
    const categoryId = stringField(value.categoryId, `${label} categoryId`, issues)
    if (categoryId && !categoryIds.has(categoryId)) {
      issues.push(`${label} references an unknown category: ${categoryId}`)
    }
    const receivable: Receivable = {
      id,
      title: stringField(value.title, `${label} title`, issues),
      categoryId,
      totalAmount: numberField(value.totalAmount, `${label} totalAmount`, issues),
      from: stringField(value.from, `${label} from`, issues),
      notes: stringField(value.notes, `${label} notes`, issues),
      askDate: optionalStringField(value.askDate, `${label} askDate`, issues),
      createdAt: stringField(value.createdAt, `${label} createdAt`, issues),
      updatedAt: stringField(value.updatedAt, `${label} updatedAt`, issues)
    }
    return receivable
  }).filter((item): item is Receivable => item !== null)

  const installmentIds = new Set<string>()
  const payableIds = new Set<string>()
  const payables = payableValues.map((value, index) => {
    if (!isRecord(value)) {
      issues.push(`Payable ${index + 1} must be an object`)
      return null
    }
    const label = `Payable ${index + 1}`
    const id = idField(value.id, `${label} id`, issues)
    if (id) uniqueId(id, label, payableIds, issues)
    const categoryId = stringField(value.categoryId, `${label} categoryId`, issues)
    if (categoryId && !categoryIds.has(categoryId)) {
      issues.push(`${label} references an unknown category: ${categoryId}`)
    }
    const rawInstallments = arrayField(value.installments ?? [], `${label} installments`, issues)
    const installments = rawInstallments.map((installmentValue, installmentIndex) => {
      if (!isRecord(installmentValue)) {
        issues.push(`${label} installment ${installmentIndex + 1} must be an object`)
        return null
      }
      const installmentLabel = `${label} installment ${installmentIndex + 1}`
      const installmentId = idField(installmentValue.id, `${installmentLabel} id`, issues)
      if (installmentId) uniqueId(installmentId, 'Installment', installmentIds, issues)
      const installment: PayableInstallment = {
        id: installmentId,
        amount: numberField(installmentValue.amount, `${installmentLabel} amount`, issues),
        dueDate: stringField(installmentValue.dueDate, `${installmentLabel} dueDate`, issues),
        status: installmentStatusField(installmentValue.status, `${installmentLabel} status`, issues),
        paidAt: optionalStringField(installmentValue.paidAt, `${installmentLabel} paidAt`, issues),
        createdAt: stringField(installmentValue.createdAt, `${installmentLabel} createdAt`, issues),
        updatedAt: stringField(installmentValue.updatedAt, `${installmentLabel} updatedAt`, issues)
      }
      return installment
    }).filter((item): item is PayableInstallment => item !== null)
    const payable: Payable = {
      id,
      title: stringField(value.title, `${label} title`, issues),
      categoryId,
      totalAmount: numberField(value.totalAmount, `${label} totalAmount`, issues),
      to: stringField(value.to, `${label} to`, issues),
      notes: stringField(value.notes, `${label} notes`, issues),
      dueDate: optionalStringField(value.dueDate, `${label} dueDate`, issues),
      installments,
      createdAt: stringField(value.createdAt, `${label} createdAt`, issues),
      updatedAt: stringField(value.updatedAt, `${label} updatedAt`, issues)
    }
    return payable
  }).filter((item): item is Payable => item !== null)

  const installmentsByPayable = new Map<string, Set<string>>()
  for (const payable of payables) {
    installmentsByPayable.set(payable.id, new Set((payable.installments ?? []).map((item) => item.id)))
  }

  const transactionIds = new Set<string>()
  const transactions = transactionValues.map((value, index) => {
    if (!isRecord(value)) {
      issues.push(`Transaction ${index + 1} must be an object`)
      return null
    }
    const label = `Transaction ${index + 1}`
    const id = idField(value.id, `${label} id`, issues)
    if (id) uniqueId(id, label, transactionIds, issues)
    const categoryId = stringField(value.categoryId, `${label} categoryId`, issues)
    if (categoryId && !categoryIds.has(categoryId)) {
      issues.push(`${label} references an unknown category: ${categoryId}`)
    }
    const walletId = optionalStringField(value.walletId, `${label} walletId`, issues)
    const toWalletId = optionalStringField(value.toWalletId, `${label} toWalletId`, issues)
    const payableId = optionalStringField(value.payableId, `${label} payableId`, issues)
    const installmentId = optionalStringField(value.installmentId, `${label} installmentId`, issues)
    if (walletId && !walletIds.has(walletId)) {
      issues.push(`${label} references an unknown wallet: ${walletId}`)
    }
    if (toWalletId && !walletIds.has(toWalletId)) {
      issues.push(`${label} references an unknown toWallet: ${toWalletId}`)
    }
    if (payableId && !payableIds.has(payableId)) {
      issues.push(`${label} references an unknown payable: ${payableId}`)
    }
    if (installmentId && !payableId) {
      issues.push(`${label} has an installmentId without a payableId`)
    }
    if (installmentId && payableId && !installmentsByPayable.get(payableId)?.has(installmentId)) {
      issues.push(`${label} references installment ${installmentId} outside payable ${payableId}`)
    }
    const transaction: Transaction = {
      id,
      date: stringField(value.date, `${label} date`, issues),
      title: stringField(value.title, `${label} title`, issues),
      categoryId,
      type: transactionTypeField(value.type, `${label} type`, issues),
      amount: numberField(value.amount, `${label} amount`, issues),
      notes: stringField(value.notes, `${label} notes`, issues),
      walletId,
      toWalletId,
      payableId,
      installmentId,
      createdAt: stringField(value.createdAt, `${label} createdAt`, issues),
      updatedAt: stringField(value.updatedAt, `${label} updatedAt`, issues)
    }
    return transaction
  }).filter((item): item is Transaction => item !== null)

  for (const [key, value] of Object.entries(categoryTypeMap)) {
    transactionTypeField(value, `categoryTypeMap.${key}`, issues)
  }
  for (const [key, value] of Object.entries(budgetPercentages)) {
    numberField(value, `budgetPercentages.${key}`, issues)
  }

  if (issues.length > 0) {
    throw new DatasetImportError(issues.join('\n'))
  }

  return {
    version: input.version as number,
    name: input.name as string,
    currency: input.currency as string,
    createdAt: input.createdAt as string,
    updatedAt: input.updatedAt as string,
    transactions,
    categories,
    receivables,
    wallets,
    payables,
    categoryTypeMap: categoryTypeMap as Record<string, TransactionType>,
    budgetPercentages: budgetPercentages as Record<string, number>
  }
}

export function normalizeImportedDataset(input: unknown): Dataset {
  if (!isRecord(input)) {
    throw new DatasetImportError('Dataset must be an object')
  }
  if (typeof input.version !== 'number' || !Number.isFinite(input.version) || input.version <= 0) {
    throw new DatasetImportError('Dataset version must be a positive number')
  }

  try {
    const normalized = DatasetService.deserialize(JSON.stringify(input))
    return validateDataset(normalized)
  } catch (error) {
    if (error instanceof DatasetImportError) throw error
    throw new DatasetImportError(`Invalid dataset: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export function cloneDataset(dataset: Dataset): Dataset {
  return JSON.parse(JSON.stringify(dataset)) as Dataset
}
