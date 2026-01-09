/**
 * Tests for format-quantity utilities
 * Story 03.11b: WO Material Reservations (LP Allocation)
 */

import { describe, it, expect } from 'vitest'
import { formatNumber, formatDate, formatDateTime, getShelfLife } from '../format-quantity'

describe('formatNumber', () => {
  it('should format integer without decimals', () => {
    expect(formatNumber(100)).toBe('100')
    expect(formatNumber(1000)).toBe('1,000')
    expect(formatNumber(1000000)).toBe('1,000,000')
  })

  it('should format decimal with max 2 decimals', () => {
    expect(formatNumber(100.5)).toBe('100.5')
    expect(formatNumber(100.55)).toBe('100.55')
    expect(formatNumber(100.555)).toBe('100.56') // rounds to 2 decimals
  })

  it('should handle zero', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('should handle negative numbers', () => {
    expect(formatNumber(-100)).toBe('-100')
    expect(formatNumber(-1000.5)).toBe('-1,000.5')
  })
})

describe('formatDate', () => {
  it('should format date string to short format', () => {
    expect(formatDate('2025-01-15')).toBe('Jan 15, 2025')
    expect(formatDate('2025-12-31')).toBe('Dec 31, 2025')
    expect(formatDate('2025-06-01')).toBe('Jun 1, 2025')
  })

  it('should return dash for null date', () => {
    expect(formatDate(null)).toBe('-')
  })

  it('should handle ISO datetime strings', () => {
    expect(formatDate('2025-01-15T10:30:00Z')).toBe('Jan 15, 2025')
  })
})

describe('formatDateTime', () => {
  it('should format date with time', () => {
    const result = formatDateTime('2025-01-15T14:30:00Z')
    // Contains date components
    expect(result).toContain('Jan')
    expect(result).toContain('15')
    expect(result).toContain('2025')
    // Contains time component
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })

  it('should handle different times', () => {
    const morning = formatDateTime('2025-01-15T09:00:00Z')
    const evening = formatDateTime('2025-01-15T21:00:00Z')
    expect(morning).not.toBe(evening)
  })
})

describe('getShelfLife', () => {
  it('should return dash for null expiry', () => {
    const result = getShelfLife(null)
    expect(result.text).toBe('-')
    expect(result.isNearExpiry).toBe(false)
  })

  it('should show expired for past dates', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1)
    const result = getShelfLife(pastDate.toISOString())
    expect(result.text).toBe('Expired')
    expect(result.isNearExpiry).toBe(true)
  })

  it('should show days remaining and near expiry for <30 days', () => {
    const nearExpiry = new Date()
    nearExpiry.setDate(nearExpiry.getDate() + 15)
    const result = getShelfLife(nearExpiry.toISOString().split('T')[0])
    expect(result.text).toMatch(/\d+ days/)
    expect(result.isNearExpiry).toBe(true)
  })

  it('should show months remaining for >30 days', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 90)
    const result = getShelfLife(futureDate.toISOString().split('T')[0])
    expect(result.text).toMatch(/\d+ mo/)
    expect(result.isNearExpiry).toBe(false)
  })

  it('should mark exactly 30 days as near expiry', () => {
    const thirtyDays = new Date()
    thirtyDays.setDate(thirtyDays.getDate() + 30)
    const result = getShelfLife(thirtyDays.toISOString().split('T')[0])
    expect(result.isNearExpiry).toBe(true)
  })

  it('should not mark 31 days as near expiry', () => {
    const thirtyOneDays = new Date()
    thirtyOneDays.setDate(thirtyOneDays.getDate() + 31)
    const result = getShelfLife(thirtyOneDays.toISOString().split('T')[0])
    expect(result.isNearExpiry).toBe(false)
  })
})
