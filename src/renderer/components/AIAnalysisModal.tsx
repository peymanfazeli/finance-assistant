import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { marked } from 'marked'
import Modal from './Modal'
import { GAPGPT_API_URL, GAPGPT_API_KEY, GAPGPT_MODEL, ANALYSIS_PROMPT_TEMPLATE } from '../../Configs/Prompts/promptConf'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, borderWidth } from '../../core/utils/styles'
import { formatJalaliDateEn } from '../../core/utils/jalali'

interface AIAnalysisModalProps {
  open: boolean
  onClose: () => void
  reportData: unknown[]
  reportType: string
}

marked.setOptions({
  breaks: true,
  gfm: true
})

function AIAnalysisModal({ open, onClose, reportData, reportType }: AIAnalysisModalProps): JSX.Element {
  const { t } = useTranslation()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setAnalysis(null)
      setError(null)
      setLoading(false)
    }
  }, [open])

  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'ai-analysis-styles'
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .ai-analysis-content {
        direction: rtl;
        text-align: right;
        font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
        line-height: 1.8;
        color: #1a1a1a;
      }
      .ai-analysis-content h1 {
        font-size: 20px;
        font-weight: 700;
        color: #1a1a1a;
        border-bottom: 2px solid #4A90D9;
        padding-bottom: 8px;
        margin: 24px 0 12px 0;
      }
      .ai-analysis-content h2 {
        font-size: 17px;
        font-weight: 600;
        color: #333;
        margin: 20px 0 10px 0;
        border-bottom: 1px solid #eee;
        padding-bottom: 6px;
      }
      .ai-analysis-content h3 {
        font-size: 15px;
        font-weight: 600;
        color: #444;
        margin: 16px 0 8px 0;
      }
      .ai-analysis-content p {
        margin: 6px 0;
      }
      .ai-analysis-content strong {
        font-weight: 600;
        color: #1a1a1a;
      }
      .ai-analysis-content code {
        background: #f0f0f0;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
        font-family: 'Consolas', 'Courier New', monospace;
        direction: ltr;
        unicode-bidi: embed;
      }
      .ai-analysis-content pre {
        background: #f5f5f5;
        padding: 12px;
        border-radius: 6px;
        overflow-x: auto;
        direction: ltr;
        text-align: left;
        border: 1px solid #e0e0e0;
      }
      .ai-analysis-content pre code {
        background: none;
        padding: 0;
        font-size: 12px;
        line-height: 1.5;
      }
      .ai-analysis-content table {
        width: 100%;
        border-collapse: collapse;
        margin: 12px 0;
        font-size: 13px;
      }
      .ai-analysis-content thead th {
        background: #f0f0f0;
        padding: 8px 10px;
        border: 1px solid #ddd;
        font-weight: 600;
        text-align: right;
        white-space: nowrap;
      }
      .ai-analysis-content tbody td {
        padding: 6px 10px;
        border: 1px solid #eee;
        text-align: right;
      }
      .ai-analysis-content tbody tr:hover {
        background: #f9f9f9;
      }
      .ai-analysis-content hr {
        border: none;
        border-top: 1px solid #eee;
        margin: 16px 0;
      }
      .ai-analysis-content ul, .ai-analysis-content ol {
        padding-right: 20px;
        padding-left: 0;
        margin: 8px 0;
      }
      .ai-analysis-content li {
        margin: 4px 0;
      }
      .ai-analysis-content blockquote {
        border-right: 3px solid #4A90D9;
        padding-right: 12px;
        margin: 12px 0;
        color: #555;
        background: #f8f9fa;
        padding: 8px 12px;
        border-radius: 0 6px 6px 0;
      }
    `
    document.head.appendChild(style)
    return () => {
      const el = document.getElementById('ai-analysis-styles')
      if (el) el.remove()
    }
  }, [])

  const analysisHtml = useMemo(() => {
    if (!analysis) return ''
    try {
      return marked.parse(analysis) as string
    } catch {
      return `<p>${analysis}</p>`
    }
  }, [analysis])

  const formatReportData = useCallback((data: unknown[]): string => {
    if (!data || data.length === 0) return 'No data available'

    const firstRow = data[0]
    if ('date' in firstRow) {
      const timeSeriesData = data as { date: string; income?: number; expense: number }[]
      const lines = timeSeriesData.map(row => {
        const parts = [`Date: ${row.date}`]
        if (row.income !== undefined) parts.push(`Income: ${row.income}`)
        parts.push(`Expense: ${row.expense}`)
        return parts.join(', ')
      })
      return lines.join('\n')
    } else {
      const categoryData = data as { name: string; value: number }[]
      return categoryData.map(row => `${row.name}: ${row.value}`).join('\n')
    }
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (!isOnline) {
      setError(t('reports.noInternet'))
      return
    }

    setLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      const formattedData = formatReportData(reportData)
      const prompt = ANALYSIS_PROMPT_TEMPLATE(reportType, formattedData)

      // console.log('FORMATTED DATA IS ', formattedData)
      // const response={ok: false}

      const response = await fetch(GAPGPT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GAPGPT_API_KEY}`
        },
        body: JSON.stringify({
          model: GAPGPT_MODEL,
          messages: [
            { role: 'system', content: 'You are a professional financial analyst.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const result = await response.json()
      const content = result.choices?.[0]?.message?.content

      if (!content) {
        throw new Error('No content in API response')
      }

      setAnalysis(content)
    } catch (err) {
      console.error('AI Analysis failed:', err)
      setError(t('reports.analysisError'))
    } finally {
      setLoading(false)
    }
  }, [isOnline, reportData, reportType, formatReportData, t])

  const handlePrint = useCallback(async () => {
    if (!analysis) return

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <title>AI Analysis - ${reportType}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700&display=swap');
    body {
      font-family: 'Vazirmatn', 'Segoe UI', Tahoma, Arial, sans-serif;
      padding: 40px;
      line-height: 1.8;
      direction: rtl;
      text-align: right;
      color: #1a1a1a;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { font-size: 22px; border-bottom: 2px solid #4A90D9; padding-bottom: 8px; }
    h2 { font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 6px; margin-top: 24px; }
    h3 { font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    th { background: #f0f0f0; padding: 8px 10px; border: 1px solid #ddd; text-align: right; }
    td { padding: 6px 10px; border: 1px solid #eee; text-align: right; }
    pre { background: #f5f5f5; padding: 12px; border-radius: 6px; direction: ltr; text-align: left; border: 1px solid #e0e0e0; overflow-x: auto; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-family: Consolas, monospace; font-size: 12px; }
    pre code { background: none; padding: 0; }
    hr { border: none; border-top: 1px solid #eee; margin: 16px 0; }
    blockquote { border-right: 3px solid #4A90D9; padding: 8px 12px; margin: 12px 0; background: #f8f9fa; border-radius: 0 6px 6px 0; }
    ul, ol { padding-right: 20px; padding-left: 0; }
    .header { margin-bottom: 20px; color: #555; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <strong>${reportType}</strong> &mdash; ${formatJalaliDateEn(new Date().toISOString().split('T')[0])}
  </div>
  ${analysisHtml}
</body>
</html>`

    try {
      const result = await window.api.print.toPdf(html)
      if (!result.success || !result.data) {
        console.error('PDF generation failed:', result.error)
        return
      }

      const saveResult = await window.api.export.showSaveDialog('ai-analysis.pdf', [
        { name: 'PDF', extensions: ['pdf'] }
      ])

      if (saveResult.canceled || !saveResult.filePath) return

      await window.api.export.saveFileBinary(saveResult.filePath, result.data)
    } catch (err) {
      console.error('Save PDF failed:', err)
    }
  }, [analysis, analysisHtml, reportType])

  return (
    <Modal open={open} onClose={onClose} title={t('reports.aiAnalysis')} width="700px">
      <div style={styles.container}>
        {!isOnline && (
          <div style={styles.offlineWarning}>
            {t('reports.noInternet')}
          </div>
        )}

        {!analysis && !loading && (
          <div style={styles.promptSection}>
            <p style={styles.promptText}>{t('reports.aiAnalysisPrompt')}</p>
            <motion.button
              style={{
                ...styles.analyzeBtn,
                opacity: isOnline ? 1 : 0.5
              }}
              whileHover={isOnline ? { scale: 1.03 } : {}}
              whileTap={isOnline ? { scale: 0.97 } : {}}
              onClick={handleAnalyze}
              disabled={!isOnline || loading}
            >
              {t('reports.analyze')}
            </motion.button>
          </div>
        )}

        {loading && (
          <div style={styles.loadingSection}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>{t('reports.analyzing')}</p>
          </div>
        )}

        {error && (
          <div style={styles.errorSection}>
            <p style={styles.errorText}>{error}</p>
            <motion.button
              style={styles.retryBtn}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAnalyze}
            >
              {t('reports.retry')}
            </motion.button>
          </div>
        )}

        {analysis && (
          <div style={styles.resultSection}>
            <div
              style={styles.analysisContent}
              className="ai-analysis-content"
              dangerouslySetInnerHTML={{ __html: analysisHtml }}
            />
            <div style={styles.actions}>
              <motion.button
                style={styles.printBtn}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handlePrint}
              >
                {t('reports.printAnalysis')}
              </motion.button>
              <motion.button
                style={styles.newAnalysisBtn}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAnalyze}
              >
                {t('reports.newAnalysis')}
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg
  },
  offlineWarning: {
    padding: padding.input,
    backgroundColor: colors.bg.warning,
    color: colors.text.warning,
    borderRadius: borderRadius.md,
    fontSize: fontSize.base,
    textAlign: 'center'
  },
  promptSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl
  },
  promptText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    margin: 0
  },
  analyzeBtn: {
    padding: padding.buttonLg,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer'
  },
  loadingSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xxl
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: `4px solid ${colors.border.default}`,
    borderTop: `4px solid ${colors.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    margin: 0
  },
  errorSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl
  },
  errorText: {
    fontSize: fontSize.base,
    color: colors.text.error,
    textAlign: 'center',
    margin: 0
  },
  retryBtn: {
    padding: padding.button,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.inverse,
    backgroundColor: colors.danger,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer'
  },
  resultSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.lg
  },
  analysisContent: {
    padding: spacing.lg,
    backgroundColor: colors.bg.muted,
    borderRadius: borderRadius.md,
    fontSize: fontSize.md,
    maxHeight: '500px',
    overflow: 'auto'
  },
  actions: {
    display: 'flex',
    gap: spacing.sm,
    justifyContent: 'flex-end'
  },
  printBtn: {
    padding: padding.button,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.inverse,
    backgroundColor: colors.success,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer'
  },
  newAnalysisBtn: {
    padding: padding.button,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    backgroundColor: colors.bg.muted,
    border: `${borderWidth.default} solid ${colors.border.default}`,
    borderRadius: borderRadius.md,
    cursor: 'pointer'
  }
}

export default AIAnalysisModal
