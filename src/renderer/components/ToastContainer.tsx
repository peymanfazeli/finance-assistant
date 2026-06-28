import React, { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import Toast, { ToastData, ToastType } from './Toast'
import { spacing, zIndex } from '../../core/utils/styles'

type Listener = (toasts: ToastData[]) => void

let toasts: ToastData[] = []
let listeners: Listener[] = []
let nextId = 1

function notify() {
  listeners.forEach((fn) => fn([...toasts]))
}

export function addToast(type: ToastType, message: string) {
  const id = String(nextId++)
  toasts = [...toasts, { id, type, message }]
  if (toasts.length > 5) {
    toasts = toasts.slice(-5)
  }
  notify()

  setTimeout(() => {
    dismissToast(id)
  }, 3000)
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  notify()
}

function subscribe(fn: Listener) {
  listeners.push(fn)
  return () => {
    listeners = listeners.filter((l) => l !== fn)
  }
}

export default function ToastContainer() {
  const [items, setItems] = useState<ToastData[]>([])

  useEffect(() => {
    const unsub = subscribe((t) => setItems(t))
    return unsub
  }, [])

  return (
    <div style={styles.container}>
      <AnimatePresence mode="popLayout">
        {items.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={dismissToast} />
        ))}
      </AnimatePresence>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: spacing.xxl,
    right: spacing.xxl,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    zIndex: zIndex.modal + 1,
    pointerEvents: 'none',
  },
}
