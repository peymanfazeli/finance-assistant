import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Payable, PayableInstallment, Transaction } from '../../core/models/types'
import { PayableService } from '../../core/services/PayableService'
import { PayableInstallmentService, MAX_INSTALLMENTS } from '../../core/services/PayableInstallmentService'
import { formatCurrency } from '../../core/utils/format'
import {
  colors,
  spacing,
  padding,
  fontSize,
  fontWeight,
  borderRadius,
  borderWidth,
  shadow
} from '../../core/utils/styles'
import { getTodayJalali, jalaliToGregorianDateStrFromParts } from '../../core/utils/jalali'
import PersianCalendar from './PersianCalendar'

interface InstallmentScheduleEditorProps {
  totalAmount: number
  installments: PayableInstallment[]
  firstDueDate?: string
  currency: string
  payableId?: string
  transactions?: Transaction[]
  onChange: (installments: PayableInstallment[]) => void
}

function InstallmentScheduleEditor({
  totalAmount,
  installments,
  firstDueDate,
  currency,
  payableId = '',
  transactions = [],
  onChange
}: InstallmentScheduleEditorProps): JSX.Element {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US'
  const [countInput, setCountInput] = useState(installments.length > 0 ? String(installments.length) : '')
  const [historyError, setHistoryError] = useState(false)
  const validation = PayableInstallmentService.validateSchedule(totalAmount, installments)
  const allocated = PayableInstallmentService.getScheduledTotal(installments)
  const todayJalali = getTodayJalali()
  const todayStr = jalaliToGregorianDateStrFromParts(todayJalali.jy, todayJalali.jm, todayJalali.jd)
  const payableLike = {
    id: payableId,
    title: '',
    categoryId: '',
    totalAmount,
    to: '',
    notes: '',
    installments,
    createdAt: '',
    updatedAt: ''
  } as Payable

  const applySchedule = (next: PayableInstallment[]): void => {
    const removedWithPayments = installments.some((item) =>
      !next.some((candidate) => candidate.id === item.id) &&
      PayableService.getInstallmentNetPaid(payableLike, item, transactions) > 0
    )
    setHistoryError(removedWithPayments)
    if (removedWithPayments) return
    onChange(next)
  }

  const handleCountChange = (raw: string): void => {
    setCountInput(raw)
    const count = Number(raw)
    if (
      Number.isInteger(count) &&
      count >= 1 &&
      count <= MAX_INSTALLMENTS &&
      Number.isFinite(totalAmount) &&
      totalAmount > 0
    ) {
      applySchedule(PayableInstallmentService.createSchedulePreservingIds(installments, totalAmount, count, firstDueDate))
    }
  }

  const handleGenerate = (): void => {
    const count = Number(countInput)
    if (Number.isInteger(count) && count >= 1 && count <= MAX_INSTALLMENTS && totalAmount > 0) {
      applySchedule(PayableInstallmentService.createSchedulePreservingIds(installments, totalAmount, count, firstDueDate))
    }
  }

  const handleRedistribute = (): void => {
    if (installments.length > 0 && totalAmount > 0) {
      applySchedule(PayableInstallmentService.redistributeEvenly(installments, totalAmount))
    }
  }

  const handleAmountChange = (id: string, raw: string): void => {
    onChange(
      installments.map((installment) =>
        installment.id === id ? { ...installment, amount: raw === '' ? 0 : Number(raw) } : installment
      )
    )
  }

  const handleDateChange = (id: string, date: string): void => {
    onChange(
      installments.map((installment) =>
        installment.id === id ? { ...installment, dueDate: date } : installment
      )
    )
  }

  const balanceText =
    validation.difference === 0
      ? t('installment.balanced')
      : validation.difference < 0
        ? `${t('installment.remaining')}: ${formatCurrency(Math.abs(validation.difference), currency, locale)}`
        : `${t('installment.overAllocated')}: ${formatCurrency(validation.difference, currency, locale)}`
  const countInvalid = !Number.isInteger(Number(countInput)) || Number(countInput) < 1 || Number(countInput) > MAX_INSTALLMENTS
  const hasDateError = validation.codes.includes('date')
  const hasAmountError = validation.codes.includes('amount')

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <label style={styles.label} htmlFor="installment-count">
          {t('installment.count')}
        </label>
        <div style={styles.countRow}>
          <input
            id="installment-count"
            aria-invalid={countInvalid}
            style={styles.countInput}
            type="number"
            min={1}
            max={MAX_INSTALLMENTS}
            step={1}
            value={countInput}
            placeholder={t('installment.countPlaceholder')}
            onChange={(event) => handleCountChange(event.target.value)}
          />
          <button type="button" style={styles.secondaryButton} onClick={handleGenerate}>
            {t('installment.generate')}
          </button>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={handleRedistribute}
            disabled={installments.length === 0 || totalAmount <= 0}
          >
            {t('installment.redistribute')}
          </button>
        </div>
        {countInvalid && countInput !== '' && (
          <span style={styles.errorText}>{t('installment.errorCount')}</span>
        )}
      </div>

      <p style={styles.note}>{t('installment.note')}</p>

      <div style={styles.balanceRow}>
        <span>{t('payable.totalAmount')}: {formatCurrency(totalAmount, currency, locale)}</span>
        <span>{t('installment.allocated')}: {formatCurrency(allocated, currency, locale)}</span>
        <span style={{ color: validation.difference === 0 ? colors.text.income : colors.text.error }}>
          {balanceText}
        </span>
      </div>
      {hasDateError && <div style={styles.errorText}>{t('installment.errorDate')}</div>}
      {hasAmountError && <div style={styles.errorText}>{t('installment.errorAmount')}</div>}
      {historyError && <div style={styles.errorText}>{t('installment.errorHistory')}</div>}

      <div style={styles.tableHeader}>
        <span style={styles.numberCell}>{t('installment.number')}</span>
        <span style={styles.fieldCell}>{t('installment.amount')}</span>
        <span style={styles.fieldCell}>{t('installment.dueDate')}</span>
        <span style={styles.statusCell}>{t('installment.status')}</span>
      </div>

      {installments.length === 0 ? (
        <div style={styles.empty}>{t('installment.empty')}</div>
      ) : (
        <div data-installment-rows style={styles.rows}>
          {installments.map((installment, index) => (
            <div key={installment.id} style={styles.row}>
              <span style={styles.numberCell}>{index + 1}</span>
              <input
                aria-label={`${t('installment.amount')} ${index + 1}`}
                aria-invalid={!Number.isFinite(installment.amount) || installment.amount <= 0}
                style={{
                  ...styles.input,
                  ...(!Number.isFinite(installment.amount) || installment.amount <= 0 ? styles.invalidInput : {}),
                }}
                type="number"
                min="0"
                step="0.01"
                value={installment.amount}
                onChange={(event) => handleAmountChange(installment.id, event.target.value)}
              />
              <PersianCalendar
                value={installment.dueDate}
                onChange={(date) => handleDateChange(installment.id, date)}
                compact
              />
               <span style={styles.statusCell}>
                 {(() => {
                   const paid = PayableService.getInstallmentNetPaid(payableLike, installment, transactions)
                   if (paid >= installment.amount - 0.005 && installment.amount > 0) return t('installment.statePaid')
                   if (paid > 0) return t('installment.statePartial')
                   if (installment.dueDate < todayStr) return t('installment.stateOverdue')
                   return t('installment.statePending')
                 })()}
               </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    border: `${borderWidth.default} solid ${colors.border.default}`,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    backgroundColor: colors.bg.muted,
    boxShadow: shadow.card
  },
  header: { marginBottom: spacing.xs },
  label: {
    display: 'block',
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.muted,
    marginBottom: spacing.xs
  },
  countRow: { display: 'flex', gap: spacing.xs, flexWrap: 'wrap' },
  countInput: {
    width: '90px',
    padding: padding.input,
    fontSize: fontSize.base,
    border: `${borderWidth.default} solid ${colors.border.input}`,
    borderRadius: borderRadius.md,
    boxSizing: 'border-box'
  },
  secondaryButton: {
    padding: padding.chip,
    fontSize: fontSize.sm,
    color: colors.text.inverse,
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer'
  },
  note: {
    fontSize: fontSize.sm,
    color: colors.text.subtle,
    margin: `0 0 ${spacing.sm} 0`,
    lineHeight: 1.5
  },
  balanceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: spacing.xs,
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottom: `${borderWidth.default} solid ${colors.border.divider}`,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium
  },
  errorText: {
    display: 'block',
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.text.error
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr) minmax(0, 1.4fr) auto',
    gap: spacing.xs,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.muted,
    padding: `0 0 ${spacing.xs} 0`
  },
  rows: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    maxHeight: '35vh',
    overflowY: 'auto',
    overflowX: 'hidden',
    overscrollBehavior: 'contain',
    direction: 'inherit',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr) minmax(0, 1.4fr) auto',
    gap: spacing.xs,
    alignItems: 'center',
    padding: spacing.xs,
    border: `${borderWidth.default} solid ${colors.border.light}`,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.card
  },
  numberCell: { fontSize: fontSize.sm, color: colors.text.muted, textAlign: 'center' },
  fieldCell: { fontSize: fontSize.sm },
  statusCell: { fontSize: fontSize.xs, color: colors.text.subtle, textAlign: 'center' },
  input: {
    width: '100%',
    padding: padding.input,
    fontSize: fontSize.base,
    border: `${borderWidth.default} solid ${colors.border.input}`,
    borderRadius: borderRadius.md,
    boxSizing: 'border-box'
  },
  invalidInput: { borderColor: colors.text.error },
  empty: {
    padding: spacing.md,
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.text.subtle,
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md
  }
}

export default InstallmentScheduleEditor
