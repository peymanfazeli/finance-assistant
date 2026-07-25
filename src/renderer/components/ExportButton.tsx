import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ExportService } from '../../core/services/ExportService'
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow, borderWidth, zIndex } from '../../core/utils/styles'
import html2canvas from 'html2canvas'

interface ExportButtonProps {
  data: unknown[]
  filename?: string
  reportTitle?: string
  chartRef?: React.RefObject<HTMLDivElement | null>
  currency?: string
  locale?: string
}

function ExportButton({ data, filename = 'report', reportTitle, chartRef, currency, locale }: ExportButtonProps): JSX.Element {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExport = useCallback(
    async (format: 'csv' | 'excel' | 'pdf') => {
      if (!ExportService.validateData(data as any)) {
        alert(t('export.noData'))
        return
      }

      setExporting(true)

      try {
        const filters: Record<string, Electron.FileFilter[]> = {
          csv: [{ name: 'CSV', extensions: ['csv'] }],
          excel: [{ name: 'Excel', extensions: ['xlsx'] }],
          pdf: [{ name: 'PDF', extensions: ['pdf'] }]
        }

        const defaultName = `${filename}.${format === 'excel' ? 'xlsx' : format}`
        const result = await window.api.export.showSaveDialog(defaultName, filters[format])

        if (result.canceled || !result.filePath) {
          setExporting(false)
          setOpen(false)
          return
        }

        switch (format) {
          case 'csv': {
            const content = ExportService.toCSV(data as any, result.filePath)
            await window.api.export.saveFile(result.filePath, content)
            break
          }
          case 'excel': {
            const base64 = ExportService.toExcelBase64(data as any)
            await window.api.export.saveFileBinary(result.filePath, base64)
            break
          }
          case 'pdf': {
            let chartImage: string | undefined
            if (chartRef?.current) {
              const canvas = await html2canvas(chartRef.current, {
                useCORS: true,
                scale: 2,
                backgroundColor: '#ffffff'
              })
              chartImage = canvas.toDataURL('image/png')
            }
            const pdfBase64 = ExportService.toPDFBase64(data as any, reportTitle || filename, chartImage, currency, locale)
            await window.api.export.saveFileBinary(result.filePath, pdfBase64)
            break
          }
        }
      } catch (err) {
        console.error('Export failed:', err)
        alert(t('errors.generic'))
      } finally {
        setExporting(false)
        setOpen(false)
      }
    },
    [data, filename, reportTitle, chartRef, t, currency, locale]
  )

  return (
    <div style={styles.wrapper}>
      <button style={styles.button} onClick={() => setOpen(!open)} disabled={exporting}>
        {exporting ? t('common.loading') : t('common.export')}
      </button>
      {open && (
        <div style={styles.dropdown}>
          <button style={styles.dropdownItem} onClick={() => handleExport('csv')}>
            {t('export.csv')}
          </button>
          <button style={styles.dropdownItem} onClick={() => handleExport('excel')}>
            {t('export.excel')}
          </button>
          <button style={styles.dropdownItem} onClick={() => handleExport('pdf')}>
            {t('export.pdf')}
          </button>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    display: 'inline-block',
  },
  button: {
    padding: `${spacing.sm} ${spacing.lg}`,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.inverse,
    backgroundColor: colors.success,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: spacing.xs,
    backgroundColor: colors.bg.card,
    border: `${borderWidth.default} solid ${colors.border.light}`,
    borderRadius: borderRadius.md,
    boxShadow: shadow.dropdown,
    zIndex: zIndex.dropdown,
    minWidth: '140px',
    overflow: 'hidden',
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: fontSize.sm,
    textAlign: 'left',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
}

export default ExportButton
