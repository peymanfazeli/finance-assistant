import { Dataset, Payable, TransactionType } from '../models/types'
import { PayableService } from './PayableService'

const SCHEMA_VERSION = 5

function migrateToV5(data: Dataset): void {
  const fallbackTime = data.updatedAt || data.createdAt || new Date(0).toISOString()
  const payables: Payable[] = (data.payables ?? []).map((payable, payableIndex) => ({
    ...payable,
    installments: (payable.installments ?? []).map((installment, installmentIndex) => ({
      ...installment,
      id: installment.id || `${payable.id}-installment-${installmentIndex + 1}`,
      createdAt: installment.createdAt || payable.createdAt || fallbackTime,
      updatedAt: installment.updatedAt || installment.createdAt || payable.updatedAt || fallbackTime
    }))
  }))
  data.payables = payables

  const isPaymentType = (type: string): boolean =>
    type === TransactionType.Expense || type === TransactionType.Refund

  data.transactions = (data.transactions ?? []).map((transaction) => {
    if (transaction.payableId || !isPaymentType(transaction.type)) return transaction
    const matches = payables.filter(
      (payable) => PayableService.getLegacyTransactions(payable, [transaction], payables).length > 0
    )
    if (matches.length !== 1 || (matches[0].installments ?? []).length > 0) return transaction
    return { ...transaction, payableId: matches[0].id }
  })
}

export class DatasetService {
  static create(
    name: string,
    currency: string,
    categories: Dataset['categories'],
    receivables: Dataset['receivables'] = [],
    transactions: Dataset['transactions'] = [],
    payables: Payable[] = [],
    wallets: Dataset['wallets'] = []
  ): Dataset {
    const now = new Date().toISOString()
    return {
      version: SCHEMA_VERSION,
      name,
      currency,
      createdAt: now,
      updatedAt: now,
      transactions,
      categories,
      receivables,
      wallets,
      payables
    }
  }

  static serialize(dataset: Dataset): string {
    return JSON.stringify({ ...dataset, updatedAt: new Date().toISOString() }, null, 2)
  }

  static deserialize(content: string): Dataset {
    const data = JSON.parse(content) as Dataset
    if (data.currency === 'IRR') data.currency = 'toman'
    if (!data.version) {
      throw new Error('Invalid dataset file: missing version field')
    }
    if (!data.receivables) {
      data.receivables = []
    }
    if (!data.payables) {
      data.payables = []
    }
    if (!data.wallets) {
      data.wallets = []
    }
    if (!data.categoryTypeMap) {
      data.categoryTypeMap = {}
    }
    if (!data.budgetPercentages) {
      data.budgetPercentages = {}
    }
    if (data.version < SCHEMA_VERSION) {
      migrateToV5(data)
      data.version = SCHEMA_VERSION
    }
    return data
  }
}
