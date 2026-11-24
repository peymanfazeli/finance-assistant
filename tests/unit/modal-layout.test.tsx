import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Modal from '../../src/renderer/components/Modal'

describe('Modal viewport layout', () => {
  it('keeps header and footer outside the scrollable body', () => {
    render(
      <Modal
        open
        onClose={vi.fn()}
        title="Payable"
        footer={<button type="button">Footer action</button>}
      >
        <div>Body content</div>
      </Modal>
    )

    const dialog = screen.getByRole('dialog')
    const header = dialog.querySelector('[data-modal-header]') as HTMLElement
    const body = dialog.querySelector('[data-modal-body]') as HTMLElement
    const footer = dialog.querySelector('[data-modal-footer]') as HTMLElement

    expect(dialog.style.maxHeight).toBe('100%')
    expect(dialog.style.display).toBe('flex')
    expect(header.style.flexShrink).toBe('0')
    expect(body.style.overflowY).toBe('auto')
    expect(body.style.minHeight).toBe('0')
    expect(footer.style.flexShrink).toBe('0')
    expect(body.contains(screen.getByText('Footer action'))).toBe(false)
    expect(footer.contains(screen.getByText('Footer action'))).toBe(true)
  })
})
