import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import './i18n'
import { useAppStore } from '../core/store/useAppStore'
import { SettingsService } from '../core/services/SettingsService'
import { ConfigService } from '../core/services/ConfigService'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, shadow, zIndex, borderWidth, sizes, transitions } from '../core/utils/styles'
import { ExportService } from '../core/services/ExportService'
import WelcomePage from './pages/WelcomePage'
import CreateDatasetDialog from './components/CreateDatasetDialog'
import ErrorBoundary from './components/ErrorBoundary'
import ToastContainer from './components/ToastContainer'
import ExportOnCloseDialog from './components/ExportOnCloseDialog'
import TransactionPage from './pages/TransactionPage'
import DashboardPage from './pages/DashboardPage'
import CategoryPage from './pages/CategoryPage'
import ReportsPage from './pages/ReportsPage'
import CustomReportBuilderPage from './pages/CustomReportBuilderPage'
import SettingsPage from './pages/SettingsPage'
import ReceivablePage from './pages/ReceivablePage'
import { ApplicationSettings } from '../core/models/types'
import useReducedMotion from './hooks/useReducedMotion'

type Page = 'dashboard' | 'transactions' | 'receivables' | 'categories' | 'reports' | 'customReports' | 'settings'

const pageVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
}

function App(): JSX.Element {
  const { t } = useTranslation()
  const { dataset, setDataset, setConfigBaseName, setSettings, settings, clearDataset } = useAppStore()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showLoadError, setShowLoadError] = useState(false)
  const [showCloseWarning, setShowCloseWarning] = useState(false)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [startupComplete, setStartupComplete] = useState(false)
  const prefersReduced = useReducedMotion()

  const animProps = prefersReduced
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : pageVariants

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
      const removeOpen = window.api.receive('menu:open', () => setCurrentPage('transactions'))
      return () => { if (removeOpen) removeOpen() }
    }
  }, [])

  const shouldWarn = useCallback((): boolean => {
    if (!dataset) return false
    const { lastExportTimestamp } = settings
    if (!lastExportTimestamp) return true
    const maxUpdated = dataset.transactions.reduce(
      (max, t) => (t.updatedAt > max ? t.updatedAt : max),
      ''
    )
    return lastExportTimestamp < maxUpdated
  }, [dataset, settings])

  const handleCloseExport = useCallback(async (): Promise<void> => {
    if (!dataset) return
    const csv = ExportService.toTransactionCSV(dataset.transactions, dataset.categories)
    const result = await window.api.export.showSaveDialog('transactions.csv', [
      { name: 'CSV', extensions: ['csv'] }
    ])
    if (result.canceled || !result.filePath) return
    await window.api.export.saveFile(result.filePath, csv)
    const { updateSettings } = useAppStore.getState()
    updateSettings({ lastExportTimestamp: new Date().toISOString() })
    setShowCloseWarning(false)
  }, [dataset])

  const handleCloseAnyway = useCallback(async (): Promise<void> => {
    setShowCloseWarning(false)
    await window.api.export.confirmClose()
  }, [])

  const handleCancelClose = useCallback((): void => {
    setShowCloseWarning(false)
  }, [])

  useEffect(() => {
    if (!window.api?.receive) return
    const remove = window.api.receive('app:will-close', () => {
      if (shouldWarn()) {
        setShowCloseWarning(true)
      } else {
        window.api.export.confirmClose()
      }
    })
    return () => { remove() }
  }, [shouldWarn])

  const handleCreateDataset = async (name: string, currency: string): Promise<void> => {
    const categories = ConfigService.getCategories()
    const receivables = ConfigService.getReceivables(categories)
    const result = await window.api.dataset.createNamed(name, currency, categories, receivables)
    if (!result.success || !result.path) {
      alert(t('errors.generic') + ': ' + (result.error || t('import.importError')))
      return
    }
    const datasetResult = await window.api.dataset.load(result.path)
    if (!datasetResult.success || !datasetResult.data) {
      alert(t('errors.generic') + ': ' + (datasetResult.error || t('import.importError')))
      return
    }
    setDataset(datasetResult.data, result.path)
    setConfigBaseName(name)
    await window.api.config.createDatasetConfigs(name)
    setShowCreateDialog(false)
  }

  if (!startupComplete) {
    return (
      <div style={styles.app}>
        <main style={{ ...styles.main, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: colors.text.disabled }}>Loading...</p>
        </main>
      </div>
    )
  }

  if (showLoadError) {
    return (
      <div style={styles.app}>
        <main style={{ ...styles.main, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: spacing.lg }}>
          <p style={{ color: colors.text.error, fontSize: fontSize.lg }}>Failed to load the last opened dataset.</p>
          <p style={{ color: colors.text.subtle }}>The file may have been moved, deleted, or corrupted.</p>
          <div style={{ display: 'flex', gap: spacing.md }}>
            <button
              onClick={handleCreateDefaultDataset}
              style={{
                padding: padding.buttonLg,
                fontSize: fontSize.base,
                fontWeight: fontWeight.semibold,
                backgroundColor: colors.primary,
                color: colors.text.inverse,
                border: 'none',
                borderRadius: borderRadius.md,
                cursor: 'pointer',
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
      setCurrentPage('transactions')
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
        <ToastContainer />
      </>
    )
  }

  const navItems: { page: Page; label: string }[] = [
    { page: 'dashboard', label: t('nav.dashboard') },
    { page: 'transactions', label: t('nav.transactions') },
    { page: 'receivables', label: t('nav.receivables') },
    { page: 'categories', label: t('nav.categories') },
    { page: 'reports', label: t('nav.reports') },
    { page: 'customReports', label: t('nav.customReports') },
    { page: 'settings', label: t('nav.settings') }
  ]

  return (
    <div style={styles.app}>
      <ToastContainer />
      {showCloseWarning && (
        <ExportOnCloseDialog
          onExport={handleCloseExport}
          onCloseAnyway={handleCloseAnyway}
          onCancel={handleCancelClose}
        />
      )}
      <nav style={styles.nav}>
        <div style={styles.navTitle}>{t('app.title')}</div>
        <div style={styles.navLinks}>
          {navItems.map((item) => (
            <motion.button
              key={item.page}
              style={{
                ...styles.navButton,
                backgroundColor: currentPage === item.page ? colors.bg.active : 'transparent',
                color: currentPage === item.page ? colors.primary : colors.text.muted,
              }}
              whileHover={prefersReduced ? {} : { scale: 1.03, backgroundColor: colors.bg.hover }}
              whileTap={prefersReduced ? {} : { scale: 0.97 }}
              onClick={() => setCurrentPage(item.page)}
            >
              {item.label}
            </motion.button>
          ))}
          <motion.button
            style={{
              ...styles.navButton,
              color: colors.text.muted,
              marginLeft: spacing.sm,
              borderLeft: `1px solid ${colors.border}`,
              paddingLeft: spacing.sm
            }}
            whileHover={prefersReduced ? {} : { scale: 1.03, backgroundColor: colors.bg.hover }}
            whileTap={prefersReduced ? {} : { scale: 0.97 }}
            onClick={() => clearDataset()}
          >
            {t('nav.close')}
          </motion.button>
        </div>
      </nav>
      <main style={styles.main}>
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              variants={animProps}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ height: '100%', overflow: 'hidden', position: 'relative' }}
            >
              {currentPage === 'dashboard' && <DashboardPage />}
              {currentPage === 'transactions' && <TransactionPage />}
              {currentPage === 'receivables' && <ReceivablePage />}
              {currentPage === 'categories' && <CategoryPage />}
              {currentPage === 'reports' && <ReportsPage />}
              {currentPage === 'customReports' && <CustomReportBuilderPage />}
              {currentPage === 'settings' && <SettingsPage />}
            </motion.div>
          </AnimatePresence>
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
    padding: `0 ${spacing.xxl}`,
    height: sizes.navHeight,
    backgroundColor: colors.bg.card,
    borderBottom: `${borderWidth.default} solid ${colors.border.default}`,
  },
  navTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text.primary },
  navLinks: { display: 'flex', gap: spacing.xs },
  navButton: {
    padding: padding.button,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    transition: transitions.fast,
  },
  main: { flex: 1, overflow: 'auto', backgroundColor: colors.bg.page },
}

export default App
