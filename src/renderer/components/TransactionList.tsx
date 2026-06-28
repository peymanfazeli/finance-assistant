import { useTranslation } from 'react-i18next'
import { Transaction, TransactionType, SortConfig } from '../../core/models/types'
import { useAppStore } from '../../core/store/useAppStore'
import { formatCurrency } from '../../core/utils/format'

interface TransactionListProps {
  transactions: Transaction[]
  onEdit: (id: string) => void
}

function TransactionList({ transactions, onEdit }: TransactionListProps): JSX.Element {
  const { t, i18n } = useTranslation()
  const { sortConfig, setSortConfig, deleteTransaction, duplicateTransaction, dataset } = useAppStore()
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US'
  const currency = dataset?.currency || 'USD'

  const handleSort = (field: SortConfig['field']): void => {
    setSortConfig({
      field,
      direction:
        sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    })
  }

  const sortIndicator = (field: SortConfig['field']): string => {
    if (sortConfig.field !== field) return '↕'
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  if (transactions.length === 0) {
    return <div style={styles.empty}>{t('transaction.noTransactions')}</div>
  }

  return (
    <div style={styles.container}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th} onClick={() => handleSort('date')}>
              {t('transaction.date')} {sortIndicator('date')}
            </th>
            <th style={styles.th} onClick={() => handleSort('title')}>
              {t('transaction.titleLabel')} {sortIndicator('title')}
            </th>
            <th style={styles.th} onClick={() => handleSort('categoryId')}>
              {t('transaction.category')} {sortIndicator('categoryId')}
            </th>
            <th style={styles.th} onClick={() => handleSort('type')}>
              {t('transaction.type')} {sortIndicator('type')}
            </th>
            <th style={styles.thRight} onClick={() => handleSort('amount')}>
              {t('transaction.amount')} {sortIndicator('amount')}
            </th>
            <th style={styles.th}>{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} style={styles.row}>
              <td style={styles.td}>{tx.date}</td>
              <td style={styles.td}>{tx.title}</td>
              <td style={styles.td}>{tx.categoryId}</td>
              <td style={styles.td}>
                <span
                  style={{
                    ...styles.typeBadge,
                    backgroundColor:
                      tx.type === TransactionType.Income
                        ? '#d4edda'
                        : tx.type === TransactionType.Expense
                          ? '#f8d7da'
                          : '#fff3cd'
                  }}
                >
                  {t(`transaction.${tx.type}`)}
                </span>
              </td>
              <td style={styles.tdRight}>
                <span
                  style={{
                    color:
                      tx.type === TransactionType.Income
                        ? '#155724'
                        : tx.type === TransactionType.Expense
                          ? '#721c24'
                          : '#856404'
                  }}
                >
                  {formatCurrency(
                    tx.type === TransactionType.Expense ? -tx.amount : tx.amount,
                    currency,
                    locale
                  )}
                </span>
              </td>
              <td style={styles.td}>
                <button style={styles.actionBtn} onClick={() => onEdit(tx.id)}>
                  {t('common.edit')}
                </button>
                <button style={styles.actionBtn} onClick={() => duplicateTransaction(tx.id)}>
                  {t('transaction.duplicate')}
                </button>
                <button
                  style={{ ...styles.actionBtn, color: '#dc3545' }}
                  onClick={() => {
                    if (confirm(t('transaction.confirmDelete'))) {
                      deleteTransaction(tx.id)
                    }
                  }}
                >
                  {t('common.delete')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '10px 12px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: '13px',
    color: '#555',
    borderBottom: '2px solid #eee',
    cursor: 'pointer',
    userSelect: 'none'
  },
  thRight: {
    padding: '10px 12px',
    textAlign: 'right',
    fontWeight: 600,
    fontSize: '13px',
    color: '#555',
    borderBottom: '2px solid #eee',
    cursor: 'pointer',
    userSelect: 'none'
  },
  td: { padding: '10px 12px', fontSize: '14px', borderBottom: '1px solid #f0f0f0' },
  tdRight: { padding: '10px 12px', fontSize: '14px', borderBottom: '1px solid #f0f0f0', textAlign: 'right' },
  row: { transition: 'background 0.15s' },
  typeBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500
  },
  actionBtn: {
    padding: '4px 8px',
    marginRight: '4px',
    fontSize: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer'
  },
  empty: { padding: '48px', textAlign: 'center', color: '#888', fontSize: '14px' }
}

export default TransactionList
