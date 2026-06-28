import { useEffect, useCallback, useRef } from 'react'

interface UseBeforeUnloadOptions {
  shouldWarn: () => boolean
  onClose: () => void
}

export default function useBeforeUnload({ shouldWarn, onClose }: UseBeforeUnloadOptions) {
  const shouldWarnRef = useRef(shouldWarn)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    shouldWarnRef.current = shouldWarn
  }, [shouldWarn])

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (shouldWarnRef.current()) {
      e.preventDefault()
      e.returnValue = ''
    }
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'F4' && e.altKey && shouldWarnRef.current()) {
      e.preventDefault()
      onCloseRef.current()
    }
  }, [])

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleBeforeUnload, handleKeyDown])
}
