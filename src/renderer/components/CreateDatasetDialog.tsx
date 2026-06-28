import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, borderWidth } from '../../core/utils/styles'
import Modal from './Modal'

interface CreateDatasetDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (name: string, currency: string) => void
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'IRR', 'CAD', 'AUD', 'JPY']

function CreateDatasetDialog({ open, onClose, onCreate }: CreateDatasetDialogProps): JSX.Element | null {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('USD')

  const handleCreate = (): void => {
    if (!name.trim()) return
    onCreate(name.trim(), currency)
    setName('')
    setCurrency('USD')
  }

  return (
    <Modal open={open} onClose={onClose} title={t('dataset.createTitle')}>
      <div style={styles.field}>
        <label style={styles.label}>{t('dataset.name')}</label>
        <input
          style={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('dataset.namePlaceholder')}
          autoFocus
        />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>{t('dataset.currency')}</label>
        <select
          style={styles.select}
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div style={styles.buttons}>
        <motion.button
          style={styles.cancelButton}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
        >
          {t('common.cancel')}
        </motion.button>
        <motion.button
          style={styles.createButton}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleCreate}
          disabled={!name.trim()}
        >
          {t('common.create')}
        </motion.button>
      </div>
    </Modal>
  )
}

const styles: Record<string, React.CSSProperties> = {
  field: { marginBottom: spacing.lg },
  label: { display: 'block', fontSize: fontSize.base, fontWeight: fontWeight.medium, marginBottom: spacing.sm, color: colors.text.muted },
  input: { width: '100%', padding: padding.inputLg, fontSize: fontSize.base, border: `${borderWidth.default} solid ${colors.border.input}`, borderRadius: borderRadius.md, outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: padding.inputLg, fontSize: fontSize.base, border: `${borderWidth.default} solid ${colors.border.input}`, borderRadius: borderRadius.md, outline: 'none', backgroundColor: colors.bg.input, boxSizing: 'border-box' },
  buttons: { display: 'flex', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.xxl },
  cancelButton: { padding: padding.buttonLg, fontSize: fontSize.base, color: colors.text.subtle, backgroundColor: colors.bg.hover, border: 'none', borderRadius: borderRadius.md, cursor: 'pointer' },
  createButton: { padding: padding.buttonLg, fontSize: fontSize.base, color: colors.text.inverse, backgroundColor: colors.primary, border: 'none', borderRadius: borderRadius.md, cursor: 'pointer' },
}

export default CreateDatasetDialog
