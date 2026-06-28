import { Category } from '../models/types'
import { generateId } from '../utils/id'

const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt'>[] = [
  { name: 'Food & Drinks', color: '#FF6B6B', icon: 'restaurant', isDefault: true },
  { name: 'Transportation', color: '#4ECDC4', icon: 'directions_car', isDefault: true },
  { name: 'Internet', color: '#45B7D1', icon: 'wifi', isDefault: true },
  { name: 'Shopping', color: '#96CEB4', icon: 'shopping_bag', isDefault: true },
  { name: 'Education', color: '#FFEAA7', icon: 'school', isDefault: true },
  { name: 'Software & Subscriptions', color: '#DDA0DD', icon: 'computer', isDefault: true },
  { name: 'Bills', color: '#98D8C8', icon: 'receipt', isDefault: true },
  { name: 'Investment', color: '#F7DC6F', icon: 'trending_up', isDefault: true },
  { name: 'Other', color: '#BDC3C7', icon: 'category', isDefault: true }
]

export class CategoryService {
  static createDefaultCategories(): Category[] {
    return DEFAULT_CATEGORIES.map((cat) => ({
      ...cat,
      id: generateId(),
      createdAt: new Date().toISOString()
    }))
  }

  static create(categories: Category[], name: string, color: string, icon: string): Category[] {
    const now = new Date().toISOString()
    const newCategory: Category = {
      id: generateId(),
      name,
      color,
      icon,
      isDefault: false,
      createdAt: now
    }
    return [...categories, newCategory]
  }

  static update(
    categories: Category[],
    id: string,
    updates: Partial<Pick<Category, 'name' | 'color' | 'icon'>>
  ): Category[] {
    return categories.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat))
  }

  static delete(
    categories: Category[],
    id: string
  ): { updatedCategories: Category[]; deletedCategory: Category | null } {
    const category = categories.find((c) => c.id === id)
    if (!category) {
      return { updatedCategories: categories, deletedCategory: null }
    }
    if (category.isDefault) {
      throw new Error('Cannot delete default categories')
    }
    return {
      updatedCategories: categories.filter((c) => c.id !== id),
      deletedCategory: category
    }
  }

  static findById(categories: Category[], id: string): Category | undefined {
    return categories.find((c) => c.id === id)
  }
}
