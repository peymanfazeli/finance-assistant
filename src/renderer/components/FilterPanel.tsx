import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { TransactionType, Category, Wallet, TransactionFilter } from '../../core/models/types'
import PersianCalendar from './PersianCalendar'
import { getTodayJalali, jalaliToGregorianDateStr, jalaliToGregorianDateStrFromParts } from '../../core/utils/jalali'
import { colors, spacing, fontSize, fontWeight, borderRadius, borderWidth } from '../../core/utils/styles'

interface FilterPanelProps {
  categories: Category[]
  wallets?: Wallet[]
  onApply: (filter: TransactionFilter) => void
  onClearSearch?: () => void
  vertical?: boolean
  initialFilters?: TransactionFilter
}

function FilterPanel({ categories, wallets = [], onApply, onClearSearch, vertical, initialFilters }: FilterPanelProps): JSX.Element {
  const { t } = useTranslation()
  const today = getTodayJalali()
  const [dateFrom, setDateFrom] = useState(
    initialFilters?.dateFrom ?? jalaliToGregorianDateStrFromParts(today.jy, today.jm, 1)
  )
  const [dateTo, setDateTo] = useState(
    initialFilters?.dateTo ?? jalaliToGregorianDateStr(today)
  )
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialFilters?.categoryIds ?? []
  )
  const [selectedWallets, setSelectedWallets] = useState<string[]>(
    initialFilters?.walletIds ?? []
  )
  const [selectedTypes, setSelectedTypes] = useState<TransactionType[]>(
    initialFilters?.types ?? []
  )
  const [amountMin, setAmountMin] = useState(
    initialFilters?.amountMin !== undefined ? String(initialFilters.amountMin) : ''
  )
  const [amountMax, setAmountMax] = useState(
    initialFilters?.amountMax !== undefined ? String(initialFilters.amountMax) : ''
  )

  const apply = (): void => {
    onApply({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
      walletIds: selectedWallets.length > 0 ? selectedWallets : undefined,
      types: selectedTypes.length > 0 ? selectedTypes : undefined,
      amountMin: amountMin ? parseFloat(amountMin) : undefined,
      amountMax: amountMax ? parseFloat(amountMax) : undefined
    })
  }

  useEffect(() => {
    if (!initialFilters?.dateFrom && !initialFilters?.dateTo) {
      apply()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clear = (): void => {
    setDateFrom('')
    setDateTo('')
    setSelectedCategories([])
    setSelectedWallets([])
    setSelectedTypes([])
    setAmountMin('')
    setAmountMax('')
    onClearSearch?.()
    onApply({})
  }

  const toggleCategory = (id: string): void => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const toggleWallet = (id: string): void => {
    setSelectedWallets((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    )
  }

  const toggleType = (type: TransactionType): void => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  return (
    <div style={styles.container}>
      <div style={{ ...styles.row, ...(vertical ? { flexDirection: 'column' as const } : {}) }}>
        <div style={styles.field}>
          <label style={styles.label}>{t('common.filter')} Date</label>
          <PersianCalendar value={dateFrom} onChange={setDateFrom} placeholder="From" compact />
          <span style={styles.separator}>-</span>
          <PersianCalendar value={dateTo} onChange={setDateTo} placeholder="To" compact />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>{t('transaction.amount')}</label>
          <input
            style={styles.smallInput}
            type="number"
            placeholder="Min"
            value={amountMin}
            onChange={(e) => setAmountMin(e.target.value)}
          />
          <span style={styles.separator}>-</span>
          <input
            style={styles.smallInput}
            type="number"
            placeholder="Max"
            value={amountMax}
            onChange={(e) => setAmountMax(e.target.value)}
          />
        </div>
      </div>
      <div style={styles.chips}>
        {categories.map((c) => (
          <button
            key={c.id}
            style={{
              ...styles.chip,
              backgroundColor: selectedCategories.includes(c.id) ? c.color : colors.bg.muted,
              color: selectedCategories.includes(c.id) ? colors.text.inverse : colors.text.muted,
              borderColor: selectedCategories.includes(c.id) ? c.color : colors.border.light,
            }}
            onClick={() => toggleCategory(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>
      {wallets.length > 0 && (
        <div style={styles.chipSection}>
          <span style={styles.chipLabel}>{t('wallet.title')}</span>
          <div style={styles.chips}>
            {wallets.map((w) => (
              <button
                key={w.id}
                style={{
                  ...styles.chip,
                  backgroundColor: selectedWallets.includes(w.id) ? w.color : colors.bg.muted,
                  color: selectedWallets.includes(w.id) ? colors.text.inverse : colors.text.muted,
                  borderColor: selectedWallets.includes(w.id) ? w.color : colors.border.light,
                }}
                onClick={() => toggleWallet(w.id)}
              >
                {w.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={styles.chips}>
        {[TransactionType.Income, TransactionType.Expense, TransactionType.Refund, TransactionType.Investment, TransactionType.Transfer].map((type) => (
          <button
            key={type}
            style={{
              ...styles.chip,
              backgroundColor: selectedTypes.includes(type) ? colors.primary : colors.bg.muted,
              color: selectedTypes.includes(type) ? colors.text.inverse : colors.text.muted,
              borderColor: selectedTypes.includes(type) ? colors.primary : colors.border.light,
            }}
            onClick={() => toggleType(type)}
          >
            {t(`transaction.${type}`)}
          </button>
        ))}
      </div>
      <div style={styles.buttons}>
        <button style={styles.applyBtn} onClick={apply}>{t('common.filter')}</button>
        <button style={styles.clearBtn} onClick={clear}>{t('common.clear')}</button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  },
  row: {
    display: 'flex',
    gap: spacing.xxl,
  },
  field: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.text.disabled,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginRight: spacing.xs,
  },
  smallInput: {
    padding: `${spacing.xs} ${spacing.sm}`,
    fontSize: fontSize.sm,
    border: `${borderWidth.default} solid ${colors.border.input}`,
    borderRadius: borderRadius.sm,
    width: '80px',
    outline: 'none',
    backgroundColor: colors.bg.muted,
  },
  separator: {
    color: colors.text.disabled,
    fontSize: fontSize.sm,
  },
  chipSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  chipLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.text.disabled,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    padding: `${spacing.xs} ${spacing.md}`,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    border: `${borderWidth.default} solid ${colors.border.light}`,
    borderRadius: borderRadius.sm,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  buttons: {
    display: 'flex',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  applyBtn: {
    padding: `${spacing.xs} ${spacing.lg}`,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
  },
  clearBtn: {
    padding: `${spacing.xs} ${spacing.lg}`,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.muted,
    backgroundColor: colors.bg.muted,
    border: `${borderWidth.default} solid ${colors.border.light}`,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
  },
}

export default FilterPanel
