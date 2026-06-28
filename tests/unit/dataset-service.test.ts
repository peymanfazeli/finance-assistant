import { describe, it, expect } from 'vitest'
import { DatasetService } from '../../src/core/services/DatasetService'
import { CategoryService } from '../../src/core/services/CategoryService'

describe('DatasetService', () => {
  it('creates a new dataset', () => {
    const categories = CategoryService.createDefaultCategories()
    const dataset = DatasetService.create('Test', 'USD', categories)
    expect(dataset.name).toBe('Test')
    expect(dataset.currency).toBe('USD')
    expect(dataset.version).toBe(1)
    expect(dataset.transactions).toHaveLength(0)
    expect(dataset.categories).toHaveLength(9)
  })

  it('serializes and deserializes a dataset', () => {
    const categories = CategoryService.createDefaultCategories()
    const dataset = DatasetService.create('SerTest', 'EUR', categories)
    const json = DatasetService.serialize(dataset)
    const parsed = JSON.parse(json)
    expect(parsed.name).toBe('SerTest')
    expect(parsed.currency).toBe('EUR')

    const loaded = DatasetService.deserialize(json)
    expect(loaded.name).toBe('SerTest')
    expect(loaded.currency).toBe('EUR')
  })

  it('throws on invalid JSON during deserialize', () => {
    expect(() => DatasetService.deserialize('not json')).toThrow()
  })

  it('throws when version field is missing', () => {
    expect(() => DatasetService.deserialize(JSON.stringify({}))).toThrow(
      'Invalid dataset file: missing version field'
    )
  })
})
