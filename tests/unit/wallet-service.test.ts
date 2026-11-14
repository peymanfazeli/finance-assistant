import { describe, it, expect } from 'vitest'
import { WalletService } from '../../src/core/services/WalletService'
import { Transaction, TransactionType, Wallet } from '../../src/core/models/types'

function makeWallet(overrides?: Partial<Wallet>): Wallet {
  return {
    id: 'w1',
    name: 'Bank',
    initialBalance: 1000,
    color: '#000',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  }
}

function makeTx(overrides?: Partial<Transaction>): Transaction {
  return {
    id: 't1',
    date: '2026-01-15',
    title: 'Test',
    categoryId: 'cat1',
    type: TransactionType.Expense,
    amount: 100,
    notes: '',
    walletId: 'w1',
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
    ...overrides
  }
}

describe('WalletService', () => {
  it('creates a wallet', () => {
    const result = WalletService.create([], { name: 'Cash', initialBalance: 500, color: '#fff' })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Cash')
    expect(result[0].initialBalance).toBe(500)
  })

  it('updates and deletes wallets', () => {
    const wallets = [makeWallet()]
    expect(WalletService.update(wallets, 'w1', { name: 'Updated' })[0].name).toBe('Updated')
    expect(WalletService.delete(wallets, 'w1')).toHaveLength(0)
  })

  it('calculates the current balance from opening balance and transactions', () => {
    const wallet = makeWallet()
    const transactions = [
      makeTx({ id: 't1', type: TransactionType.Income, amount: 500 }),
      makeTx({ id: 't2', type: TransactionType.Expense, amount: 200 }),
      makeTx({ id: 't3', type: TransactionType.Refund, amount: 50 }),
      makeTx({ id: 't4', type: TransactionType.Investment, amount: 100 }),
      makeTx({ id: 't5', type: TransactionType.Expense, amount: 999, walletId: 'other' }),
      makeTx({ id: 't6', type: TransactionType.Expense, amount: 999, walletId: undefined })
    ]
    expect(WalletService.calculateBalance(wallet, transactions)).toBe(1250)
  })

  it('moves money between wallets without changing the total balance', () => {
    const wallets = [
      makeWallet({ id: 'w1', initialBalance: 1000 }),
      makeWallet({ id: 'w2', initialBalance: 500 })
    ]
    const transactions = [
      makeTx({
        type: TransactionType.Transfer,
        amount: 200,
        walletId: 'w1',
        toWalletId: 'w2'
      })
    ]
    const balances = WalletService.calculateBalances(wallets, transactions)
    expect(balances.w1).toBe(800)
    expect(balances.w2).toBe(700)
    expect(balances.w1 + balances.w2).toBe(1500)
  })

  it('calculates balances for multiple wallets', () => {
    const wallets = [makeWallet(), makeWallet({ id: 'w2', name: 'Cash', initialBalance: 0 })]
    const transactions = [
      makeTx({ id: 't1', type: TransactionType.Income, amount: 100 }),
      makeTx({ id: 't2', type: TransactionType.Expense, amount: 40, walletId: 'w2' })
    ]
    expect(WalletService.calculateBalances(wallets, transactions)).toEqual({
      w1: 1100,
      w2: -40
    })
  })
})
