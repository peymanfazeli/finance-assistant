import { Dataset, Category } from '../models/types'

const SCHEMA_VERSION = 1

export class DatasetService {
  static create(name: string, currency: string, categories: Category[]): Dataset {
    const now = new Date().toISOString()
    return {
      version: SCHEMA_VERSION,
      name,
      currency,
      createdAt: now,
      updatedAt: now,
      transactions: [],
      categories
    }
  }

  static serialize(dataset: Dataset): string {
    dataset.updatedAt = new Date().toISOString()
    return JSON.stringify(dataset, null, 2)
  }

  static deserialize(content: string): Dataset {
    const data = JSON.parse(content) as Dataset
    if (!data.version) {
      throw new Error('Invalid dataset file: missing version field')
    }
    return data
  }
}
