import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Payable, PayableInstallment, Category } from '../../core/models/types'
import { colors, spacing, borderRadius, borderWidth, fontSize } from '../../core/utils/styles'
import { uiStyles } from '../uiStyles'
import {
  PayableInstallmentService,
  InstallmentValidationCode
} from '../../core/services/PayableInstallmentService'
import Modal from './Modal'
import PersianCalendar from './PersianCalendar'
import InstallmentScheduleEditor from './InstallmentScheduleEditor'

export const PAYABLE_FORM_ID = 'payable-form'

interface PayableFormProps {
  payable?: Payable
  categories: Category[]
  currency: string
  onSave: (data: {
    title: string
    categoryId: string
    totalAmount: number
    to: string
    notes: string
    dueDate?: string
    installments?: PayableInstallment[]
  }) => void
}

function PayableForm({ payable, categories, currency, onSave }: PayableFormProps): JSX.Element {
  const { t } = useTranslation()
  const [title, setTitle] = useState(payable?.title ?? '')
  const [categoryId, setCategoryId] = useState(payable?.categoryId ?? categories[0]?.id ?? '')
  const [totalAmount, setTotalAmount] = useState(payable?.totalAmount?.toString() ?? '')
  const [to, setTo] = useState(payable?.to ?? '')
  const [notes, setNotes] = useState(payable?.notes ?? '')
  const [dueDate, setDueDate] = useState((payable as any)?.dueDate ?? '')
  const [useInstallments, setUseInstallments] = useState(
    Array.isArray(payable?.installments) && payable.installments.length > 0
  )
  const [installments, setInstallments] = useState<PayableInstallment[]>(
    payable?.installments ? [...payable.installments] : []
  )
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])

  const handleTotalChange = (raw: string): void => {
    setTotalAmount(raw)
    const parsed = Number(raw)
    if (useInstallments && Number.isFinite(parsed) && parsed > 0) {
      setInstallments((previous) => PayableInstallmentService.rebalanceAfterTotalChange(previous, parsed))
    }
  }

  const handleToggleInstallments = (enabled: boolean): void => {
    setUseInstallments(enabled)
    if (!enabled) {
      setInstallments([])
      return
    }
    const parsed = Number(totalAmount)
    if (installments.length === 0 && Number.isFinite(parsed) && parsed > 0) {
      setInstallments(PayableInstallmentService.createInstallments(parsed, 1, dueDate || undefined))
    }
  }

  const handleSubmit = (): void => {
    const parsedAmount = parseFloat(totalAmount)
    const fields: string[] = []
    if (!title.trim()) fields.push(t('payable.titleLabel'))
    if (!categoryId) fields.push(t('payable.category'))
    if (!totalAmount || isNaN(parsedAmount) || parsedAmount <= 0) fields.push(t('payable.totalAmount'))
    if (!to.trim()) fields.push(t('payable.to'))

    if (useInstallments) {
      const validation = PayableInstallmentService.validateSchedule(parsedAmount, installments)
      if (!validation.valid) {
        const errorKeys: Record<InstallmentValidationCode, string> = {
          total: 'installment.errorTotal',
          count: 'installment.errorCount',
          date: 'installment.errorDate',
          amount: 'installment.errorAmount',
          balance: 'installment.errorBalance'
        }
        for (const code of validation.codes) {
          if (code === 'total' && (!Number.isFinite(parsedAmount) || parsedAmount <= 0)) continue
          fields.push(t(errorKeys[code]))
        }
      }
    }

    if (fields.length > 0) {
      setMissingFields(Array.from(new Set(fields)))
      setShowValidationModal(true)
      return
    }
    try {
      onSave({
        title: title.trim(),
        categoryId,
        totalAmount: parsedAmount,
        to: to.trim(),
        notes,
        dueDate: dueDate || undefined,
        installments: useInstallments ? installments : undefined
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed')
    }
  }

  return (
    <form
      id={PAYABLE_FORM_ID}
      style={styles.form}
      onSubmit={(event) => {
        event.preventDefault()
        handleSubmit()
      }}
    >
      <div style={styles.field}>
        <label style={styles.label}>{t('payable.titleLabel')}</label>
        <input
          aria-label={t('payable.titleLabel')}
          style={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('payable.titlePlaceholder')}
        />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>{t('payable.category')}</label>
        <select style={styles.select} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div style={styles.field}>
        <label style={styles.label}>{t('payable.to')}</label>
        <input
          aria-label={t('payable.to')}
          style={styles.input}
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder={t('payable.toPlaceholder')}
        />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>{t('payable.totalAmount')}</label>
        <input
          aria-label={t('payable.totalAmount')}
          style={styles.input}
          type="number"
          step="0.01"
          min="0"
          value={totalAmount}
          onChange={(e) => handleTotalChange(e.target.value)}
        />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>{t('payable.dueDate')}</label>
        <PersianCalendar value={dueDate} onChange={setDueDate} compact />
      </div>
      <div
        style={{
          ...styles.toggleField,
          borderColor: useInstallments ? colors.primary : colors.border.default,
          backgroundColor: useInstallments ? colors.bg.active : colors.bg.muted,
        }}
      >
        <label style={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={useInstallments}
            onChange={(event) => handleToggleInstallments(event.target.checked)}
          />
          {t('installment.enable')}
        </label>
      </div>
      {useInstallments && (
        <div style={styles.field}>
          <InstallmentScheduleEditor
            totalAmount={Number(totalAmount) || 0}
            installments={installments}
            firstDueDate={dueDate || undefined}
            currency={currency}
            onChange={setInstallments}
          />
        </div>
      )}
      <div style={styles.field}>
        <label style={styles.label}>{t('payable.notes')}</label>
        <textarea
          style={styles.textarea}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('payable.notesPlaceholder')}
        />
      </div>
      <Modal
        open={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title={t('payable.validationTitle')}
      >
        <p>{t('payable.validationMessage')}</p>
        <ul>
          {missingFields.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: spacing.lg }}>
          <button
            type="button"
            onClick={() => setShowValidationModal(false)}
            style={styles.primaryButton}
          >
            {t('common.ok')}
          </button>
        </div>
      </Modal>
    </form>
  )
}

const styles: Record<string, React.CSSProperties> = {
  form: { padding: 0 },
  field: { marginBottom: spacing.md },
  toggleField: {
    display: 'flex',
    alignItems: 'center',
    padding: `${spacing.sm} ${spacing.md}`,
    border: `${borderWidth.default} solid ${colors.border.default}`,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text.muted,
    cursor: 'pointer',
  },
  label: uiStyles.label,
  input: uiStyles.input,
  select: uiStyles.input,
  textarea: uiStyles.textarea,
  primaryButton: uiStyles.button,
}

export default PayableForm
