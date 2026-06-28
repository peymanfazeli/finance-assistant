import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import WelcomePage from '../../src/renderer/pages/WelcomePage'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'welcome.title': 'Welcome to Finance Assistant',
        'welcome.subtitle': 'Track your finances, generate reports, and gain insights',
        'welcome.createDataset': 'Create New Dataset',
        'welcome.importData': 'Import Data'
      }
      return map[key] ?? key
    }
  })
}))

describe('WelcomePage', () => {
  it('renders the welcome title', () => {
    render(<WelcomePage onCreateDataset={() => {}} onImportData={() => {}} />)
    expect(screen.getByText('Welcome to Finance Assistant')).toBeDefined()
  })

  it('renders create and import buttons', () => {
    render(<WelcomePage onCreateDataset={() => {}} onImportData={() => {}} />)
    expect(screen.getByText('Create New Dataset')).toBeDefined()
    expect(screen.getByText('Import Data')).toBeDefined()
  })

  it('calls onCreateDataset when create button clicked', () => {
    const onCreate = vi.fn()
    render(<WelcomePage onCreateDataset={onCreate} onImportData={() => {}} />)
    screen.getByText('Create New Dataset').click()
    expect(onCreate).toHaveBeenCalledOnce()
  })

  it('calls onImportData when import button clicked', () => {
    const onImport = vi.fn()
    render(<WelcomePage onCreateDataset={() => {}} onImportData={onImport} />)
    screen.getByText('Import Data').click()
    expect(onImport).toHaveBeenCalledOnce()
  })
})
