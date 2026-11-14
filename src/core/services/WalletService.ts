import { Transaction, TransactionType, Wallet } from '../models/types'
import { generateId } from '../utils/id'

export class WalletService {
  static create(
    wallets: Wallet[],
    data: { name: string; initialBalance: number; color: string }
  ): Wallet[] {
    const wallet: Wallet = {
      id: generateId(),
      name: data.name,
      initialBalance: data.initialBalance,
      color: data.color,
      createdAt: new Date().toISOString()
    }
    return [...wallets, wallet]
  }

  static update(
    wallets: Wallet[],
    id: string,
    updates: Partial<Pick<Wallet, 'name' | 'initialBalance' | 'color'>>
  ): Wallet[] {
    return wallets.map((w) => (w.id === id ? { ...w, ...updates } : w))
  }

  static delete(wallets: Wallet[], id: string): Wallet[] {
    return wallets.filter((w) => w.id !== id)
  }

  static transactionEffect(transaction: Transaction): number {
    switch (transaction.type) {
      case TransactionType.Income:
      case TransactionType.Refund:
        return transaction.amount
      case TransactionType.Expense:
      case TransactionType.Investment:
        return -transaction.amount
      default:
        return 0
    }
  }

  static calculateBalance(wallet: Wallet, transactions: Transaction[]): number {
    const net = transactions.reduce((sum, t) => {
      if (t.type === TransactionType.Transfer) {
        const out = t.walletId === wallet.id ? -t.amount : 0
        const incoming = t.toWalletId === wallet.id ? t.amount : 0
        return sum + out + incoming
      }
      return t.walletId === wallet.id ? sum + WalletService.transactionEffect(t) : sum
    }, 0)
    return wallet.initialBalance + net
  }

  static calculateBalances(
    wallets: Wallet[],
    transactions: Transaction[]
  ): Record<string, number> {
    return wallets.reduce<Record<string, number>>((acc, wallet) => {
      acc[wallet.id] = WalletService.calculateBalance(wallet, transactions)
      return acc
    }, {})
  }
}
