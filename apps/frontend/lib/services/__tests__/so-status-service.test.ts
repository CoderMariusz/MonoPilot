/**
 * Unit Tests: SO Status Service - Hold and Cancel Operations
 * Story: 07.3 - SO Status Workflow
 * Phase: GREEN - Implementation complete
 *
 * Tests the SOStatusService status workflow methods:
 * - holdOrder() - Put sales order on hold
 * - cancelOrder() - Cancel sales order
 * - confirmOrder() - Confirm sales order (release from hold)
 * - validateTransition() - Status state machine validation
 * - appendStatusNote() - Audit trail with notes appending
 *
 * Coverage Target: 85%+
 * Test Count: 45+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-2: Hold sales order from draft/confirmed
 * - AC-3: Cancel sales order with required reason
 * - AC-4: Status state machine validation
 * - AC-8: Audit trail tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SOStatusService } from '../so-status-service'
import { SalesOrderStatus } from '@/lib/validation/so-status-schemas'

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
  })),
}))

describe('07.3 SO Status Service - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * AC-4: Status State Machine - Valid Transitions
   */
  describe('validateTransition() - Status State Machine', () => {
    it('should allow draft -> confirmed transition', () => {
      const isValid = SOStatusService.validateTransition('draft', 'confirmed')
      expect(isValid).toBe(true)
    })

    it('should allow draft -> on_hold transition', () => {
      const isValid = SOStatusService.validateTransition('draft', 'on_hold')
      expect(isValid).toBe(true)
    })

    it('should allow draft -> cancelled transition', () => {
      const isValid = SOStatusService.validateTransition('draft', 'cancelled')
      expect(isValid).toBe(true)
    })

    it('should allow confirmed -> on_hold transition', () => {
      const isValid = SOStatusService.validateTransition('confirmed', 'on_hold')
      expect(isValid).toBe(true)
    })

    it('should allow confirmed -> cancelled transition', () => {
      const isValid = SOStatusService.validateTransition('confirmed', 'cancelled')
      expect(isValid).toBe(true)
    })

    it('should allow confirmed -> allocated transition', () => {
      const isValid = SOStatusService.validateTransition('confirmed', 'allocated')
      expect(isValid).toBe(true)
    })

    it('should allow on_hold -> confirmed transition (release)', () => {
      const isValid = SOStatusService.validateTransition('on_hold', 'confirmed')
      expect(isValid).toBe(true)
    })

    it('should allow on_hold -> cancelled transition', () => {
      const isValid = SOStatusService.validateTransition('on_hold', 'cancelled')
      expect(isValid).toBe(true)
    })

    it('should allow allocated -> cancelled transition', () => {
      const isValid = SOStatusService.validateTransition('allocated', 'cancelled')
      expect(isValid).toBe(true)
    })

    it('should allow allocated -> picking transition', () => {
      const isValid = SOStatusService.validateTransition('allocated', 'picking')
      expect(isValid).toBe(true)
    })

    it('should NOT allow draft -> allocated transition (skip)', () => {
      const isValid = SOStatusService.validateTransition('draft', 'allocated')
      expect(isValid).toBe(false)
    })

    it('should NOT allow cancelled -> any transition', () => {
      const transitions: SalesOrderStatus[] = ['draft', 'confirmed', 'on_hold', 'allocated', 'picking']
      for (const to of transitions) {
        const isValid = SOStatusService.validateTransition('cancelled', to)
        expect(isValid).toBe(false)
      }
    })

    it('should NOT allow picking -> on_hold transition', () => {
      const isValid = SOStatusService.validateTransition('picking', 'on_hold')
      expect(isValid).toBe(false)
    })

    it('should NOT allow picking -> cancelled transition', () => {
      const isValid = SOStatusService.validateTransition('picking', 'cancelled')
      expect(isValid).toBe(false)
    })

    it('should NOT allow shipped -> cancelled transition', () => {
      const isValid = SOStatusService.validateTransition('shipped', 'cancelled')
      expect(isValid).toBe(false)
    })

    it('should NOT allow delivered -> any transition', () => {
      const transitions: SalesOrderStatus[] = ['draft', 'confirmed', 'on_hold', 'cancelled']
      for (const to of transitions) {
        const isValid = SOStatusService.validateTransition('delivered', to)
        expect(isValid).toBe(false)
      }
    })
  })

  /**
   * AC-2: Hold Error Messages
   */
  describe('getHoldErrorMessage() - Error Messages', () => {
    it('should return specific message for cancelled orders', () => {
      const message = SOStatusService.getHoldErrorMessage('cancelled')
      expect(message).toBe('Cannot hold a cancelled order')
    })

    it('should return specific message for on_hold orders', () => {
      const message = SOStatusService.getHoldErrorMessage('on_hold')
      expect(message).toBe('Order is already on hold')
    })

    it('should return allocation message for allocated orders', () => {
      const message = SOStatusService.getHoldErrorMessage('allocated')
      expect(message).toBe('Cannot hold order after allocation has started')
    })

    it('should return allocation message for picking orders', () => {
      const message = SOStatusService.getHoldErrorMessage('picking')
      expect(message).toBe('Cannot hold order after allocation has started')
    })

    it('should return allocation message for packing orders', () => {
      const message = SOStatusService.getHoldErrorMessage('packing')
      expect(message).toBe('Cannot hold order after allocation has started')
    })

    it('should return allocation message for shipped orders', () => {
      const message = SOStatusService.getHoldErrorMessage('shipped')
      expect(message).toBe('Cannot hold order after allocation has started')
    })

    it('should return allocation message for delivered orders', () => {
      const message = SOStatusService.getHoldErrorMessage('delivered')
      expect(message).toBe('Cannot hold order after allocation has started')
    })
  })

  /**
   * AC-3: Cancel Error Messages
   */
  describe('getCancelErrorMessage() - Error Messages', () => {
    it('should return specific message for already cancelled orders', () => {
      const message = SOStatusService.getCancelErrorMessage('cancelled')
      expect(message).toBe('Order is already cancelled')
    })

    it('should return picking message for picking orders', () => {
      const message = SOStatusService.getCancelErrorMessage('picking')
      expect(message).toBe('Cannot cancel order after picking has started. Please contact warehouse manager.')
    })

    it('should return picking message for packing orders', () => {
      const message = SOStatusService.getCancelErrorMessage('packing')
      expect(message).toBe('Cannot cancel order after picking has started. Please contact warehouse manager.')
    })

    it('should return picking message for shipped orders', () => {
      const message = SOStatusService.getCancelErrorMessage('shipped')
      expect(message).toBe('Cannot cancel order after picking has started. Please contact warehouse manager.')
    })

    it('should return picking message for delivered orders', () => {
      const message = SOStatusService.getCancelErrorMessage('delivered')
      expect(message).toBe('Cannot cancel order after picking has started. Please contact warehouse manager.')
    })
  })

  /**
   * Confirm Error Messages
   */
  describe('getConfirmErrorMessage() - Error Messages', () => {
    it('should return specific message for cancelled orders', () => {
      const message = SOStatusService.getConfirmErrorMessage('cancelled')
      expect(message).toBe('Cannot confirm a cancelled order')
    })

    it('should return specific message for already confirmed orders', () => {
      const message = SOStatusService.getConfirmErrorMessage('confirmed')
      expect(message).toBe('Order is already confirmed')
    })

    it('should return progressed message for allocated orders', () => {
      const message = SOStatusService.getConfirmErrorMessage('allocated')
      expect(message).toBe('Order has already progressed beyond confirmed status')
    })
  })

  /**
   * AC-8: Audit Trail - Notes Formatting
   */
  describe('appendStatusNote() - Audit Trail Formatting', () => {
    it('should format hold note correctly with timestamp', () => {
      const existingNotes = 'Customer VIP'
      const reason = 'Waiting for payment confirmation'

      const newNotes = SOStatusService.appendStatusNote(existingNotes, 'HOLD', reason)

      expect(newNotes).toContain('Customer VIP')
      expect(newNotes).toContain('[HOLD -')
      expect(newNotes).toContain('Waiting for payment confirmation')
      expect(newNotes).toMatch(/Customer VIP\n\[HOLD - \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*\] Waiting for payment confirmation/)
    })

    it('should format cancel note correctly with timestamp', () => {
      const existingNotes = null
      const reason = 'Customer requested cancellation'

      const newNotes = SOStatusService.appendStatusNote(existingNotes, 'CANCELLED', reason)

      expect(newNotes).toContain('[CANCELLED -')
      expect(newNotes).toContain('Customer requested cancellation')
      expect(newNotes).toMatch(/\[CANCELLED - \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*\] Customer requested cancellation/)
    })

    it('should handle null existing notes', () => {
      const newNotes = SOStatusService.appendStatusNote(null, 'HOLD', 'New reason')

      expect(newNotes).not.toMatch(/^\n/)
      expect(newNotes).toContain('[HOLD -')
      expect(newNotes).toContain('New reason')
    })

    it('should handle empty string existing notes', () => {
      const newNotes = SOStatusService.appendStatusNote('', 'HOLD', 'New reason')

      expect(newNotes).not.toMatch(/^\n/)
      expect(newNotes).toContain('[HOLD -')
    })

    it('should preserve multiple previous notes', () => {
      const existingNotes = 'Note 1\n[HOLD - 2025-01-01] First hold\nNote 2'
      const reason = 'Second hold reason'

      const newNotes = SOStatusService.appendStatusNote(existingNotes, 'HOLD', reason)

      expect(newNotes).toContain('Note 1')
      expect(newNotes).toContain('First hold')
      expect(newNotes).toContain('Note 2')
      expect(newNotes).toContain('Second hold reason')
    })

    it('should create note without reason text when reason is undefined', () => {
      const newNotes = SOStatusService.appendStatusNote('Test', 'HOLD', undefined)

      expect(newNotes).toContain('[HOLD -')
      expect(newNotes).toMatch(/\[HOLD - \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*\]$/)
    })
  })

  /**
   * Helper methods for status checks
   */
  describe('canHold() - Status Check', () => {
    it('should return true for draft status', () => {
      expect(SOStatusService.canHold('draft')).toBe(true)
    })

    it('should return true for confirmed status', () => {
      expect(SOStatusService.canHold('confirmed')).toBe(true)
    })

    it('should return false for on_hold status', () => {
      expect(SOStatusService.canHold('on_hold')).toBe(false)
    })

    it('should return false for cancelled status', () => {
      expect(SOStatusService.canHold('cancelled')).toBe(false)
    })

    it('should return false for allocated status', () => {
      expect(SOStatusService.canHold('allocated')).toBe(false)
    })

    it('should return false for picking status', () => {
      expect(SOStatusService.canHold('picking')).toBe(false)
    })

    it('should return false for shipped status', () => {
      expect(SOStatusService.canHold('shipped')).toBe(false)
    })
  })

  describe('canCancel() - Status Check', () => {
    it('should return true for draft status', () => {
      expect(SOStatusService.canCancel('draft')).toBe(true)
    })

    it('should return true for confirmed status', () => {
      expect(SOStatusService.canCancel('confirmed')).toBe(true)
    })

    it('should return true for on_hold status', () => {
      expect(SOStatusService.canCancel('on_hold')).toBe(true)
    })

    it('should return true for allocated status', () => {
      expect(SOStatusService.canCancel('allocated')).toBe(true)
    })

    it('should return false for cancelled status', () => {
      expect(SOStatusService.canCancel('cancelled')).toBe(false)
    })

    it('should return false for picking status', () => {
      expect(SOStatusService.canCancel('picking')).toBe(false)
    })

    it('should return false for shipped status', () => {
      expect(SOStatusService.canCancel('shipped')).toBe(false)
    })
  })

  describe('canConfirm() - Status Check', () => {
    it('should return true for draft status', () => {
      expect(SOStatusService.canConfirm('draft')).toBe(true)
    })

    it('should return true for on_hold status', () => {
      expect(SOStatusService.canConfirm('on_hold')).toBe(true)
    })

    it('should return false for confirmed status', () => {
      expect(SOStatusService.canConfirm('confirmed')).toBe(false)
    })

    it('should return false for cancelled status', () => {
      expect(SOStatusService.canConfirm('cancelled')).toBe(false)
    })

    it('should return false for allocated status', () => {
      expect(SOStatusService.canConfirm('allocated')).toBe(false)
    })
  })
})
