import { Dataset, Category, Receivable, Transaction } from '../models/types'

const SCHEMA_VERSION = 3

export class DatasetService {
  static create(
    name: string,
    currency: string,
    categories: Category[],
    receivables: Receivable[] = [],
    transactions: Transaction[] = []
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
      receivables
    }
  }

  static serialize(dataset: Dataset): string {
    dataset.updatedAt = new Date().toISOString()
    return JSON.stringify(dataset, null, 2)
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
    if (!data.categoryTypeMap) {
      data.categoryTypeMap = {}
    }
    return data
  }
}
