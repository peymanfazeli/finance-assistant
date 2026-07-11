import { Category } from '../models/types'
import { generateId } from '../utils/id'

const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt'>[] = [
  { name: 'Food & Drinks', color: '#FF6B6B', icon: '🍵🥪', isDefault: true },
  { name: 'Transportation', color: '#DDA0DD', icon: '🚌', isDefault: true },
  { name: 'Car purchases', color: '#DDA0DD', icon: '🚗', isDefault: true },
  { name: 'Internet', color: '#F5C88B', icon: '🛜', isDefault: true },
  { name: 'Shopping', color: '#FF0909', icon: '🛍️', isDefault: true },
  { name: 'House purchases', color: '#FF0909', icon: '🏠', isDefault: true },
  { name: 'Education', color: '#BAE9FC', icon: 'school', isDefault: true },
  { name: 'Software & Subscriptions', color: '#EEB04C', icon: '💻', isDefault: true },
  { name: 'Bills', color: '#FFA99B', icon: '🧾', isDefault: true },
  { name: 'Investment', color: '#A1F9B0', icon: '💰', isDefault: true },
  { name: 'Project', color: '#1BF13F', icon: '🧑‍💻', isDefault: true },
  { name: 'Salary', color: '#1BF13F', icon: '💵', isDefault: true },
  { name: 'MustNot', color: '#C7C7C7', icon: '❌', isDefault: true },
  { name: 'Bullshit', color: '#BDC3C7', icon: '💩', isDefault: true }
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
