import { Transaction, TransactionType } from '../models/types'

export interface DashboardStats {
  totalIncome: number
  totalExpenses: number
  netBalance: number
  transactionCount: number
  avgDailySpending: number
  avgWeeklySpending: number
}

export class StatsService {
  static calculate(transactions: Transaction[]): DashboardStats {
    const totalIncome = transactions
      .filter((t) => t.type === TransactionType.Income)
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = transactions
      .filter((t) => t.type === TransactionType.Expense)
      .reduce((sum, t) => sum + t.amount, 0)

    const refunds = transactions
      .filter((t) => t.type === TransactionType.Refund)
      .reduce((sum, t) => sum + t.amount, 0)

    const netBalance = totalIncome + refunds - totalExpenses
    const transactionCount = transactions.length

    const expenseTransactions = transactions.filter(
      (t) => t.type === TransactionType.Expense
    )

    let avgDailySpending = 0
    let avgWeeklySpending = 0

    if (expenseTransactions.length > 0) {
      const dates = expenseTransactions.map((t) => new Date(t.date).getTime())
      const minDate = new Date(Math.min(...dates))
      const maxDate = new Date(Math.max(...dates))
      const dayDiff = Math.max(
        1,
        Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
      )

      const totalExpenseAmount = expenseTransactions.reduce((sum, t) => sum + t.amount, 0)
      avgDailySpending = Math.round((totalExpenseAmount / dayDiff) * 100) / 100
      avgWeeklySpending = Math.round(avgDailySpending * 7 * 100) / 100
    }

    return {
      totalIncome,
      totalExpenses,
      netBalance,
      transactionCount,
      avgDailySpending,
      avgWeeklySpending
    }
  }
}
