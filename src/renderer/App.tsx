import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import './i18n'
import { useAppStore } from '../core/store/useAppStore'
import { DatasetService } from '../core/services/DatasetService'
import { SettingsService } from '../core/services/SettingsService'
import { CategoryService } from '../core/services/CategoryService'
import WelcomePage from './pages/WelcomePage'
import CreateDatasetDialog from './components/CreateDatasetDialog'
import ErrorBoundary from './components/ErrorBoundary'
import TransactionPage from './pages/TransactionPage'
import DashboardPage from './pages/DashboardPage'
import ImportPage from './pages/ImportPage'
import CategoryPage from './pages/CategoryPage'
import ReportsPage from './pages/ReportsPage'
import CustomReportBuilderPage from './pages/CustomReportBuilderPage'
import SettingsPage from './pages/SettingsPage'
import { ApplicationSettings } from '../core/models/types'

type Page = 'dashboard' | 'transactions' | 'import' | 'categories' | 'reports' | 'customReports' | 'settings'

function App(): JSX.Element {
  const { t } = useTranslation()
  const { dataset, setDataset, setSettings, settings } = useAppStore()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showLoadError, setShowLoadError] = useState(false)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [startupComplete, setStartupComplete] = useState(false)

  useEffect(() => {
    async function loadInitialData(): Promise<void> {
      try {
        const settingsResult = await window.api.settings.load()
        if (settingsResult.success && settingsResult.data) {
          const loadedSettings: ApplicationSettings = settingsResult.data
          setSettings(loadedSettings)
          if (window.api?.menu) {
            window.api.menu.updateLanguage(loadedSettings.language)
          }

          const lastPath = loadedSettings.lastOpenedDataset
          if (lastPath) {
            const datasetResult = await window.api.dataset.load(lastPath)
            if (datasetResult.success && datasetResult.data) {
              setDataset(datasetResult.data, lastPath)
            } else {
              setShowLoadError(true)
              await window.api.invoke('log:error', 'startup', `Failed to load dataset: ${datasetResult.error}`)
            }
          }
        } else {
          const defaultResult = await window.api.dataset.createDefault()
          if (defaultResult.success && defaultResult.path) {
            const datasetResult = await window.api.dataset.load(defaultResult.path)
            if (datasetResult.success && datasetResult.data) {
              setDataset(datasetResult.data, defaultResult.path)
            }
          }
        }
      } catch {
        setShowLoadError(true)
      }
      setStartupComplete(true)
    }
    loadInitialData()
  }, [setDataset, setSettings])

  const handleCreateDefaultDataset = async (): Promise<void> => {
    const defaultResult = await window.api.dataset.createDefault()
    if (defaultResult.success && defaultResult.path) {
      const datasetResult = await window.api.dataset.load(defaultResult.path)
      if (datasetResult.success && datasetResult.data) {
        setDataset(datasetResult.data, defaultResult.path)
        setShowLoadError(false)
      }
    }
  }

  const handleKeyDown = useCallback((e: KeyboardEvent): void => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault()
      setCurrentPage('transactions')
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      const state = useAppStore.getState()
      if (state.currentFilePath) {
        state.saveDataset()
      }
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (window.api?.receive) {
      const removeOpen = window.api.receive('menu:open', () => setCurrentPage('import'))
      return () => { if (removeOpen) removeOpen() }
    }
  }, [])

  const handleCreateDataset = (name: string, currency: string): void => {
    const categories = CategoryService.createDefaultCategories()
    const newDataset = DatasetService.create(name, currency, categories)
    setDataset(newDataset, '')
    setShowCreateDialog(false)
  }

  if (!startupComplete) {
    return (
      <div style={styles.app}>
        <main style={{ ...styles.main, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#888' }}>Loading...</p>
        </main>
      </div>
    )
  }

  if (showLoadError) {
    return (
      <div style={styles.app}>
        <main style={{ ...styles.main, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: '#d32f2f', fontSize: '16px' }}>Failed to load the last opened dataset.</p>
          <p style={{ color: '#666' }}>The file may have been moved, deleted, or corrupted.</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleCreateDefaultDataset}
              style={{
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: 600,
                backgroundColor: '#4A90D9',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Create New Dataset
            </button>
          </div>
        </main>
      </div>
    )
  }

  const handleImportFromWelcome = async (): Promise<void> => {
    try {
      const defaultResult = await window.api.dataset.createDefault()
      if (!defaultResult.success) {
        alert(t('errors.generic') + ': ' + (defaultResult.error || t('import.importError')))
        return
      }
      if (!defaultResult.path) return
      const datasetResult = await window.api.dataset.load(defaultResult.path)
      if (!datasetResult.success) {
        alert(t('errors.generic') + ': ' + (datasetResult.error || t('import.importError')))
        return
      }
      if (!datasetResult.data) return
      setDataset(datasetResult.data, defaultResult.path)
      setCurrentPage('import')
    } catch (err) {
      alert(t('errors.generic') + ': ' + String(err))
    }
  }

  if (!dataset) {
    return (
      <>
        <WelcomePage
          onCreateDataset={() => setShowCreateDialog(true)}
          onImportData={handleImportFromWelcome}
        />
        <CreateDatasetDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreate={handleCreateDataset}
        />
      </>
    )
  }

  const navItems: { page: Page; label: string }[] = [
    { page: 'dashboard', label: t('nav.dashboard') },
    { page: 'transactions', label: t('nav.transactions') },
    { page: 'import', label: t('nav.import') },
    { page: 'categories', label: t('nav.categories') },
    { page: 'reports', label: t('nav.reports') },
    { page: 'customReports', label: t('nav.customReports') },
    { page: 'settings', label: t('nav.settings') }
  ]

  return (
    <div style={styles.app}>
      <nav style={styles.nav}>
        <div style={styles.navTitle}>{t('app.title')}</div>
        <div style={styles.navLinks}>
          {navItems.map((item) => (
            <button
              key={item.page}
              style={{
                ...styles.navButton,
                backgroundColor: currentPage === item.page ? '#e8f0fe' : 'transparent',
                color: currentPage === item.page ? '#4A90D9' : '#555'
              }}
              onClick={() => setCurrentPage(item.page)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
      <main style={styles.main}>
        <ErrorBoundary>
          {currentPage === 'dashboard' && <DashboardPage />}
          {currentPage === 'transactions' && <TransactionPage />}
          {currentPage === 'import' && <ImportPage />}
          {currentPage === 'categories' && <CategoryPage />}
          {currentPage === 'reports' && <ReportsPage />}
          {currentPage === 'customReports' && <CustomReportBuilderPage />}
          {currentPage === 'settings' && <SettingsPage />}
        </ErrorBoundary>
      </main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  app: { display: 'flex', flexDirection: 'column', height: '100vh' },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: '56px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e0e0e0'
  },
  navTitle: { fontSize: '18px', fontWeight: 700, color: '#1a1a1a' },
  navLinks: { display: 'flex', gap: '4px' },
  navButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  main: { flex: 1, overflow: 'auto', backgroundColor: '#f5f5f5' }
}

export default App
