import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DashboardCustomizationDialog from '../../src/renderer/components/DashboardCustomizationDialog'
import { DashboardPeriod } from '../../src/core/utils/dashboardPeriod'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string) => {
      const map: Record<string, string> = {
        'dashboard.customize': 'Customize Dashboard',
        'dashboard.timePeriod': 'Time Period',
        'dashboard.period.all': 'All time',
        'dashboard.period.today': 'Today',
        'dashboard.period.thisWeek': 'This week',
        'dashboard.period.thisMonth': 'This month',
        'dashboard.period.lastMonth': 'Last month',
        'dashboard.period.thisQuarter': 'This quarter',
        'dashboard.period.thisYear': 'This year',
        'dashboard.period.custom': 'Custom range',
        'dashboard.period.from': 'From',
        'dashboard.period.to': 'To',
        'dashboard.period.invalidRange': 'From must be before or equal to To',
        'dashboard.totalIncome': 'Total Income',
        'dashboard.totalExpenses': 'Total Expenses',
        'dashboard.netBalance': 'Net Balance',
        'dashboard.transactionCount': 'Transactions',
        'dashboard.avgDailySpending': 'Avg Daily Spending',
        'dashboard.avgWeeklySpending': 'Avg Weekly Spending',
        'dashboard.cardsDescription': 'Choose which cards to display.',
        'common.done': 'Done'
      }
      return map[key] ?? key
    }
  })
}))

const allCards = ['totalIncome', 'totalExpenses', 'netBalance', 'transactionCount', 'avgDailySpending', 'avgWeeklySpending']

describe('DashboardCustomizationDialog', () => {
  it('renders period presets and card toggles when open', () => {
    render(
      <DashboardCustomizationDialog
        open={true}
        visibleCards={allCards}
        period={{ preset: 'all' }}
        onPeriodChange={() => {}}
        onToggle={() => {}}
        onClose={() => {}}
      />
    )
    expect(screen.getByText('Time Period')).toBeDefined()
    expect(screen.getByText('All time')).toBeDefined()
    expect(screen.getByText('Today')).toBeDefined()
    expect(screen.getByText('Total Income')).toBeDefined()
  })

  it('does not render when closed', () => {
    const { container } = render(
      <DashboardCustomizationDialog
        open={false}
        visibleCards={allCards}
        period={{ preset: 'all' }}
        onPeriodChange={() => {}}
        onToggle={() => {}}
        onClose={() => {}}
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('calls onPeriodChange when a preset is clicked', () => {
    const onPeriodChange = vi.fn()
    render(
      <DashboardCustomizationDialog
        open={true}
        visibleCards={allCards}
        period={{ preset: 'all' }}
        onPeriodChange={onPeriodChange}
        onToggle={() => {}}
        onClose={() => {}}
      />
    )
    fireEvent.click(screen.getByText('This month'))
    expect(onPeriodChange).toHaveBeenCalledWith({ preset: 'thisMonth' })
  })

  it('switches to custom mode and preserves existing custom dates', () => {
    const onPeriodChange = vi.fn()
    render(
      <DashboardCustomizationDialog
        open={true}
        visibleCards={allCards}
        period={{ preset: 'all', customFrom: '2025-01-01', customTo: '2025-02-01' }}
        onPeriodChange={onPeriodChange}
        onToggle={() => {}}
        onClose={() => {}}
      />
    )
    fireEvent.click(screen.getByText('Custom range'))
    expect(onPeriodChange).toHaveBeenCalledWith({ preset: 'custom', customFrom: '2025-01-01', customTo: '2025-02-01' })
  })

  it('shows the From/To pickers in custom mode', () => {
    render(
      <DashboardCustomizationDialog
        open={true}
        visibleCards={allCards}
        period={{ preset: 'custom', customFrom: '2025-01-01', customTo: '2025-02-01' }}
        onPeriodChange={() => {}}
        onToggle={() => {}}
        onClose={() => {}}
      />
    )
    expect(screen.getAllByText('📅').length).toBeGreaterThan(0)
  })

  it('calls onClose when Done is clicked', () => {
    const onClose = vi.fn()
    render(
      <DashboardCustomizationDialog
        open={true}
        visibleCards={allCards}
        period={{ preset: 'all' }}
        onPeriodChange={() => {}}
        onToggle={() => {}}
        onClose={onClose}
      />
    )
    fireEvent.click(screen.getByText('Done'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
