import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Category } from '../../core/models/types'
import { formatCurrency } from '../../core/utils/format'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, borderWidth } from '../../core/utils/styles'
import Modal from './Modal'

export function amountToPercent(amount: number, base: number): number {
  if (base <= 0 || !isFinite(amount) || amount <= 0) return 0
  return Math.min(Math.round((amount / base) * 100), 100)
}

interface BudgetAmountDialogProps {
  categories: Category[]
  base: number
  currency: string
  locale: string
  percentOf: (categoryId: string) => number
  onSave: (percentages: Record<string, number>) => void
  onClose: () => void
}

function BudgetAmountDialog({
  categories,
  base,
  currency,
  locale,
  percentOf,
  onSave,
  onClose,
}: BudgetAmountDialogProps): JSX.Element {
  const { t } = useTranslation()
  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      categories.map((c) => [c.id, String(Math.round((base * percentOf(c.id)) / 100))])
    )
  )

  const blocked = base <= 0
  const enteredTotal = Object.values(amounts).reduce((sum, v) => sum + (Number(v) || 0), 0)

  const handleSave = (): void => {
    const next: Record<string, number> = {}
    for (const c of categories) {
      const pct = amountToPercent(Number(amounts[c.id]) || 0, base)
      if (pct > 0) next[c.id] = pct
    }
    onSave(next)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={t('budget.amountsTitle')} width="440px">
      {blocked ? (
        <p style={styles.blocked}>{t('budget.noIncomeBase')}</p>
      ) : (
        <>
          <div style={styles.list}>
            {categories.map((c) => (
              <label key={c.id} style={styles.row}>
                <span style={styles.label}>
                  <span style={{ ...styles.swatch, backgroundColor: c.color }} />
                  {c.name}
                </span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={amounts[c.id] ?? ''}
                  onChange={(e) => setAmounts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  style={styles.input}
                />
              </label>
            ))}
          </div>

          <div style={styles.total}>
            <span style={styles.totalLabel}>{t('budget.enteredTotal')}</span>
            <span
              style={{
                ...styles.totalValue,
                color: enteredTotal > base ? colors.text.error : colors.text.primary,
              }}
            >
              {formatCurrency(enteredTotal, currency, locale)} / {formatCurrency(base, currency, locale)}
            </span>
          </div>
        </>
      )}

      <div style={styles.buttons}>
        <button style={styles.cancelBtn} onClick={onClose}>
          {t('common.cancel')}
        </button>
        {!blocked && (
          <button style={styles.saveBtn} onClick={handleSave}>
            {t('common.save')}
          </button>
        )}
      </div>
    </Modal>
  )
}

const styles: Record<string, React.CSSProperties> = {
  list: { maxHeight: '300px', overflowY: 'auto', marginBottom: spacing.md },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: `${spacing.xs} 0`,
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  swatch: {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: borderRadius.sm,
    marginInlineEnd: spacing.sm,
    flexShrink: 0,
  },
  input: {
    width: '150px',
    padding: padding.input,
    fontSize: fontSize.base,
    border: `${borderWidth.default} solid ${colors.border.input}`,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.input,
    textAlign: 'end',
    fontVariantNumeric: 'tabular-nums',
  },
  blocked: { fontSize: fontSize.base, color: colors.text.subtle, marginBottom: spacing.md },
  total: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: colors.bg.muted,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  totalLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text.muted },
  totalValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, fontVariantNumeric: 'tabular-nums' },
  buttons: { display: 'flex', justifyContent: 'flex-end', gap: spacing.sm },
  cancelBtn: {
    padding: padding.button,
    fontSize: fontSize.base,
    color: colors.text.muted,
    backgroundColor: colors.bg.hover,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
  },
  saveBtn: {
    padding: padding.button,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
  },
}

export default BudgetAmountDialog
