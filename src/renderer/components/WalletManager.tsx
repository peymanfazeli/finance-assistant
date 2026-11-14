import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../core/store/useAppStore'
import { TransactionType, Wallet } from '../../core/models/types'
import { WalletService } from '../../core/services/WalletService'
import { formatCurrency } from '../../core/utils/format'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, borderWidth } from '../../core/utils/styles'
import { addToast } from './ToastContainer'
import Modal from './Modal'
import WalletFormDialog from './WalletFormDialog'
import TransactionForm from './TransactionForm'

function WalletManager(): JSX.Element {
  const { t, i18n } = useTranslation()
  const { dataset, addWallet, updateWallet, deleteWallet, addTransaction } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [editWallet, setEditWallet] = useState<Wallet | undefined>()

  const wallets = dataset?.wallets ?? []
  const transactions = dataset?.transactions ?? []
  const categories = dataset?.categories ?? []
  const currency = dataset?.currency || 'toman'
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US'

  const balances = WalletService.calculateBalances(wallets, transactions)
  const totalBalance = wallets.reduce((sum, w) => sum + (balances[w.id] ?? 0), 0)

  const handleSave = (name: string, initialBalance: number, color: string): void => {
    if (editWallet) {
      updateWallet(editWallet.id, { name, initialBalance, color })
      addToast('success', t('wallet.updated'))
    } else {
      addWallet({ name, initialBalance, color })
      addToast('success', t('wallet.created'))
    }
    setShowForm(false)
    setEditWallet(undefined)
  }

  const handleDelete = (wallet: Wallet): void => {
    if (confirm(t('wallet.confirmDelete'))) {
      deleteWallet(wallet.id)
      addToast('success', t('wallet.deleted'))
    }
  }

  return (
    <div style={styles.container}>
      {wallets.length === 0 ? (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>👛</span>
          <p style={styles.emptyText}>{t('wallet.noWallets')}</p>
        </div>
      ) : (
        <>
          <div style={styles.summary}>
            <span style={styles.summaryLabel}>{t('wallet.totalBalance')}</span>
            <span style={styles.summaryValue}>{formatCurrency(totalBalance, currency, locale)}</span>
          </div>
          <div style={styles.list}>
            {wallets.map((wallet) => (
              <div key={wallet.id} style={styles.row}>
                <div style={styles.walletInfo}>
                  <span style={{ ...styles.dot, backgroundColor: wallet.color }} />
                  <div style={styles.walletText}>
                    <span style={styles.name}>{wallet.name}</span>
                    <span style={styles.balance}>
                      {formatCurrency(balances[wallet.id] ?? wallet.initialBalance, currency, locale)}
                    </span>
                  </div>
                </div>
                <div style={styles.rowActions}>
                  <button style={styles.actionBtn} onClick={() => { setEditWallet(wallet); setShowForm(true) }}>
                    {t('common.edit')}
                  </button>
                  <button style={styles.actionBtnDanger} onClick={() => handleDelete(wallet)}>
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={styles.actions}>
        <motion.button
          style={styles.addBtn}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setEditWallet(undefined); setShowForm(true) }}
        >
          + {t('wallet.add')}
        </motion.button>
        <motion.button
          style={{
            ...styles.transferBtn,
            opacity: wallets.length < 2 ? 0.5 : 1,
            cursor: wallets.length < 2 ? 'not-allowed' : 'pointer',
          }}
          whileHover={wallets.length < 2 ? {} : { scale: 1.02 }}
          whileTap={wallets.length < 2 ? {} : { scale: 0.98 }}
          onClick={() => wallets.length >= 2 && setShowTransfer(true)}
          disabled={wallets.length < 2}
          title={wallets.length < 2 ? t('transaction.needTwoWallets') : t('wallet.transfer')}
        >
          {t('wallet.transfer')}
        </motion.button>
      </div>

      <WalletFormDialog
        open={showForm}
        wallet={editWallet}
        onSave={handleSave}
        onClose={() => { setShowForm(false); setEditWallet(undefined) }}
      />

      <Modal open={showTransfer} onClose={() => setShowTransfer(false)} title={t('wallet.transfer')}>
        <p style={styles.transferDescription}>{t('wallet.transferDescription')}</p>
        <TransactionForm
          categories={categories}
          wallets={wallets}
          defaultWalletId={wallets[0]?.id}
          initialType={TransactionType.Transfer}
          categoryTypeMap={dataset?.categoryTypeMap}
          onSave={(data) => {
            addTransaction(data)
            addToast('success', t('transaction.transferCreated'))
            setShowTransfer(false)
          }}
          onCancel={() => setShowTransfer(false)}
        />
      </Modal>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: spacing.md },
  summary: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
    padding: `${spacing.md} ${spacing.lg}`, backgroundColor: colors.bg.muted,
    borderRadius: borderRadius.md,
  },
  summaryLabel: {
    fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.text.disabled,
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  summaryValue: {
    fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text.primary,
    fontVariantNumeric: 'tabular-nums',
  },
  list: { display: 'flex', flexDirection: 'column', gap: spacing.xs },
  row: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm,
    padding: `${spacing.sm} ${spacing.md}`, border: `${borderWidth.default} solid ${colors.border.light}`,
    borderRadius: borderRadius.md, backgroundColor: colors.bg.card,
  },
  walletInfo: { display: 'flex', alignItems: 'center', gap: spacing.sm, minWidth: 0 },
  walletText: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  dot: { width: '10px', height: '10px', borderRadius: borderRadius.full, flexShrink: 0 },
  name: {
    fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.text.primary,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  balance: { fontSize: fontSize.sm, color: colors.text.muted, fontVariantNumeric: 'tabular-nums' },
  rowActions: { display: 'flex', gap: spacing.xs, flexShrink: 0 },
  actionBtn: {
    padding: `${spacing.xs} ${spacing.sm}`, fontSize: fontSize.xs, fontWeight: fontWeight.medium,
    color: colors.text.muted, backgroundColor: 'transparent',
    border: `${borderWidth.default} solid ${colors.border.light}`,
    borderRadius: borderRadius.sm, cursor: 'pointer',
  },
  actionBtnDanger: {
    padding: `${spacing.xs} ${spacing.sm}`, fontSize: fontSize.xs, fontWeight: fontWeight.medium,
    color: colors.danger, backgroundColor: 'transparent',
    border: `${borderWidth.default} solid ${colors.border.light}`,
    borderRadius: borderRadius.sm, cursor: 'pointer',
  },
  actions: { display: 'flex', gap: spacing.sm },
  addBtn: {
    padding: padding.button, fontSize: fontSize.base, fontWeight: fontWeight.semibold,
    color: colors.text.inverse, backgroundColor: colors.primary, border: 'none',
    borderRadius: borderRadius.md, cursor: 'pointer',
  },
  transferBtn: {
    padding: padding.button, fontSize: fontSize.base, fontWeight: fontWeight.medium,
    color: colors.primary, backgroundColor: colors.bg.card,
    border: `${borderWidth.default} solid ${colors.primary}`,
    borderRadius: borderRadius.md,
  },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.sm,
    padding: spacing.xxl, backgroundColor: colors.bg.muted, borderRadius: borderRadius.md,
    textAlign: 'center',
  },
  emptyIcon: { fontSize: '32px', lineHeight: 1 },
  emptyText: { fontSize: fontSize.sm, color: colors.text.disabled, margin: 0, lineHeight: '1.5' },
  transferDescription: {
    fontSize: fontSize.sm, color: colors.text.subtle, margin: `0 0 ${spacing.lg}`,
    lineHeight: '1.5',
  },
}

export default WalletManager
