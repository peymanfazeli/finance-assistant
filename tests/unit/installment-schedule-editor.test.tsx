import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import InstallmentScheduleEditor from '../../src/renderer/components/InstallmentScheduleEditor'
import { PayableInstallmentService } from '../../src/core/services/PayableInstallmentService'
import { TransactionType } from '../../src/core/models/types'
import { jalaliToGregorianDateStrFromParts } from '../../src/core/utils/jalali'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string) => {
      const map: Record<string, string> = {
        'installment.count': 'Number of installments',
        'installment.countPlaceholder': 'e.g. 3',
        'installment.generate': 'Generate schedule',
        'installment.redistribute': 'Redistribute evenly',
        'installment.note': 'Tracked separately from transactions.',
        'installment.number': '#',
        'installment.amount': 'Amount',
        'installment.dueDate': 'Due date',
        'installment.status': 'Status',
        'installment.empty': 'No installments for this payable.',
        'installment.allocated': 'Allocated',
        'installment.remaining': 'Remaining to allocate',
        'installment.overAllocated': 'Over allocated by',
        'installment.balanced': 'Schedule is balanced',
        'installment.statePaid': 'Paid',
        'installment.statePending': 'Pending',
        'installment.statePartial': 'Partially Paid',
        'installment.errorHistory': 'Installments with payment history cannot be removed'
      }
      return map[key] ?? key
    }
  })
}))

const FIRST_DUE = jalaliToGregorianDateStrFromParts(1404, 11, 10)
const NOW = '2026-02-01T10:00:00.000Z'

describe('InstallmentScheduleEditor', () => {
  it('generates rows dynamically when the count changes', () => {
    const onChange = vi.fn()
    render(
      <InstallmentScheduleEditor
        totalAmount={100}
        installments={[]}
        firstDueDate={FIRST_DUE}
        currency="USD"
        onChange={onChange}
      />
    )

    fireEvent.change(screen.getByLabelText('Number of installments'), { target: { value: '3' } })

    expect(onChange).toHaveBeenCalledTimes(1)
    const generated = onChange.mock.calls[0][0]
    expect(generated).toHaveLength(3)
    expect(generated.map((item: { amount: number }) => item.amount)).toEqual([33.33, 33.33, 33.34])
  })

  it('lets the user edit an individual amount without auto-rebalancing the rest', () => {
    const installments = PayableInstallmentService.createInstallments(100, 2, FIRST_DUE)
    const onChange = vi.fn()
    render(
      <InstallmentScheduleEditor
        totalAmount={100}
        installments={installments}
        currency="USD"
        onChange={onChange}
      />
    )

    fireEvent.change(screen.getByLabelText('Amount 1'), { target: { value: '70' } })

    const updated = onChange.mock.calls[0][0]
    expect(updated[0].amount).toBe(70)
    expect(updated[1].amount).toBe(50)
  })

  it('redistributes manually edited amounts on an explicit action', () => {
    const original = PayableInstallmentService.createInstallments(100, 3, FIRST_DUE)
    const custom = original.map((item, index) => ({ ...item, amount: index === 0 ? 80 : 10 }))
    const onChange = vi.fn()
    render(
      <InstallmentScheduleEditor
        totalAmount={150}
        installments={custom}
        currency="USD"
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getByText('Redistribute evenly'))

    const reset = onChange.mock.calls[0][0]
    expect(reset.map((item: { amount: number }) => item.amount)).toEqual([50, 50, 50])
  })

  it('shows the remaining difference while the schedule is unbalanced', () => {
    const installments = PayableInstallmentService.createInstallments(100, 2, FIRST_DUE)
    render(
      <InstallmentScheduleEditor
        totalAmount={100}
        installments={[{ ...installments[0], amount: 40 }, installments[1]]}
        currency="USD"
        onChange={() => {}}
      />
    )

    expect(screen.getByText(/Remaining to allocate/)).toBeDefined()
    expect(screen.getByText(/10\.00/)).toBeDefined()
  })

  it('preserves existing installment ids when regenerating the schedule', () => {
    const installments = PayableInstallmentService.createInstallments(100, 2, FIRST_DUE)
    const onChange = vi.fn()
    render(
      <InstallmentScheduleEditor
        totalAmount={100}
        installments={installments}
        currency="USD"
        onChange={onChange}
      />
    )

    fireEvent.change(screen.getByLabelText('Number of installments'), { target: { value: '3' } })

    const generated = onChange.mock.calls[0][0]
    expect(generated.slice(0, 2).map((item: { id: string }) => item.id)).toEqual(
      installments.map((item) => item.id)
    )
    expect(generated).toHaveLength(3)
  })

  it('blocks removing installments that have payment history', () => {
    const installments = PayableInstallmentService.createInstallments(100, 2, FIRST_DUE)
    const onChange = vi.fn()
    render(
      <InstallmentScheduleEditor
        totalAmount={100}
        installments={installments}
        payableId="p1"
        transactions={[{
          id: 't1',
          date: FIRST_DUE,
          title: 'Installment 1',
          categoryId: 'cat-1',
          type: TransactionType.Expense,
          amount: 50,
          notes: '',
          payableId: 'p1',
          installmentId: installments[1].id,
          createdAt: NOW,
          updatedAt: NOW
        }]}
        currency="USD"
        onChange={onChange}
      />
    )

    fireEvent.change(screen.getByLabelText('Number of installments'), { target: { value: '1' } })

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText('Installments with payment history cannot be removed')).toBeDefined()
  })

  it('scrolls a long schedule inside the rows container', () => {
    const installments = PayableInstallmentService.createInstallments(300, 30, FIRST_DUE)
    const { container } = render(
      <InstallmentScheduleEditor
        totalAmount={300}
        installments={installments}
        currency="USD"
        onChange={() => {}}
      />
    )

    const rows = container.querySelector('[data-installment-rows]') as HTMLElement
    expect(rows.style.maxHeight).toBe('35vh')
    expect(rows.style.overflowY).toBe('auto')
    expect(rows.querySelectorAll('input[aria-label^="Amount "]')).toHaveLength(30)
    expect(rows.textContent).not.toContain('Allocated')
  })
})
