import { describe, it, expect } from 'vitest'
import { CategoryService } from '../../src/core/services/CategoryService'

describe('CategoryService', () => {
  it('creates default categories', () => {
    const cats = CategoryService.createDefaultCategories()
    expect(cats).toHaveLength(9)
    expect(cats[0].name).toBe('Food & Drinks')
    expect(cats[0].isDefault).toBe(true)
  })

  it('creates a custom category', () => {
    const defaults = CategoryService.createDefaultCategories()
    const result = CategoryService.create(defaults, 'Pet Care', '#00FF00', 'pets')
    expect(result).toHaveLength(10)
    expect(result[9].name).toBe('Pet Care')
    expect(result[9].isDefault).toBe(false)
  })

  it('updates a category', () => {
    const defaults = CategoryService.createDefaultCategories()
    const id = defaults[0].id
    const result = CategoryService.update(defaults, id, { name: 'Food & Dining' })
    const updated = result.find((c) => c.id === id)
    expect(updated?.name).toBe('Food & Dining')
  })

  it('prevents deleting default categories', () => {
    const defaults = CategoryService.createDefaultCategories()
    expect(() => CategoryService.delete(defaults, defaults[0].id)).toThrow(
      'Cannot delete default categories'
    )
  })

  it('deletes a custom category', () => {
    const defaults = CategoryService.createDefaultCategories()
    const withCustom = CategoryService.create(defaults, 'Custom', '#000', 'star')
    const customId = withCustom[withCustom.length - 1].id
    const { updatedCategories, deletedCategory } = CategoryService.delete(withCustom, customId)
    expect(updatedCategories).toHaveLength(9)
    expect(deletedCategory?.name).toBe('Custom')
  })
})
