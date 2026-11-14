import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Wallet } from '../../core/models/types'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, borderWidth } from '../../core/utils/styles'
import Modal from './Modal'

interface WalletFormDialogProps {
  open: boolean
  wallet?: Wallet
  onSave: (name: string, initialBalance: number, color: string) => void
  onClose: () => void
}

function WalletFormDialog({ open, wallet, onSave, onClose }: WalletFormDialogProps): JSX.Element {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [initialBalance, setInitialBalance] = useState('0')
  const [color, setColor] = useState(colors.categoryPicker[0])

  useEffect(() => {
    if (wallet) {
      setName(wallet.name)
      setInitialBalance(String(wallet.initialBalance))
      setColor(wallet.color)
    } else {
      setName('')
      setInitialBalance('0')
      setColor(colors.categoryPicker[0])
    }
  }, [wallet, open])

  const parsedBalance = parseFloat(initialBalance)
  const balanceValid = !isNaN(parsedBalance)
  const canSave = name.trim().length > 0 && balanceValid

  const handleSave = (): void => {
    if (!canSave) return
    onSave(name.trim(), parsedBalance, color)
  }

  return (
    <Modal open={open} onClose={onClose} title={wallet ? t('wallet.edit') : t('wallet.add')}>
      <div style={styles.field}>
        <label style={styles.label}>{t('wallet.name')}</label>
        <input
          style={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('wallet.namePlaceholder')}
          autoFocus
        />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>{t('wallet.openingBalance')}</label>
        <input
          style={styles.input}
          type="number"
          step="0.01"
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value)}
        />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>{t('wallet.color')}</label>
        <div style={styles.colors}>
          {colors.categoryPicker.map((c) => (
            <motion.button
              key={c}
              type="button"
              style={{
                ...styles.colorBtn,
                backgroundColor: c,
                outline: color === c ? `3px solid ${colors.text.primary}` : 'none',
                outlineOffset: '2px',
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
      <div style={styles.buttons}>
        <motion.button
          style={styles.cancelBtn}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
        >
          {t('common.cancel')}
        </motion.button>
        <motion.button
          style={{
            ...styles.saveBtn,
            opacity: canSave ? 1 : 0.5,
            cursor: canSave ? 'pointer' : 'not-allowed',
          }}
          whileHover={canSave ? { scale: 1.03 } : {}}
          whileTap={canSave ? { scale: 0.97 } : {}}
          onClick={handleSave}
          disabled={!canSave}
        >
          {t('common.save')}
        </motion.button>
      </div>
    </Modal>
  )
}

const styles: Record<string, React.CSSProperties> = {
  field: { marginBottom: spacing.lg },
  label: { display: 'block', fontSize: fontSize.md, fontWeight: fontWeight.medium, marginBottom: spacing.sm, color: colors.text.muted },
  input: { width: '100%', padding: padding.input, fontSize: fontSize.base, border: `${borderWidth.default} solid ${colors.border.input}`, borderRadius: borderRadius.md, boxSizing: 'border-box' },
  colors: { display: 'flex', flexWrap: 'wrap', gap: spacing.sm },
  colorBtn: { width: '28px', height: '28px', borderRadius: borderRadius.full, border: 'none', cursor: 'pointer' },
  buttons: { display: 'flex', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn: { padding: padding.button, fontSize: fontSize.md, color: colors.text.subtle, backgroundColor: colors.bg.hover, border: 'none', borderRadius: borderRadius.md, cursor: 'pointer' },
  saveBtn: { padding: padding.button, fontSize: fontSize.md, color: colors.text.inverse, backgroundColor: colors.primary, border: 'none', borderRadius: borderRadius.md },
}

export default WalletFormDialog
