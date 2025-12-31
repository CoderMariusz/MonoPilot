import { describe, it, expect } from 'vitest'
import {
  WOMaterial,
  MaterialStatus,
  getMaterialStatus,
  getConsumptionPercent,
  getRemainingQty,
} from '../wo-materials'

describe('wo-materials type helpers', () => {
  describe('getRemainingQty', () => {
    it('calculates remaining quantity correctly', () => {
      const material: WOMaterial = {
        id: '1',
        wo_id: 'wo-1',
        organization_id: 'org-1',
        product_id: 'p-1',
        material_name: 'Flour',
        required_qty: 100,
        consumed_qty: 60,
        reserved_qty: 0,
        uom: 'kg',
        sequence: 1,
        consume_whole_lp: false,
        is_by_product: false,
        yield_percent: null,
        scrap_percent: 0,
        condition_flags: null,
        bom_item_id: null,
        bom_version: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
      }

      expect(getRemainingQty(material)).toBe(40)
    })

    it('returns 0 when consumed equals required', () => {
      const material: WOMaterial = {
        id: '1',
        wo_id: 'wo-1',
        organization_id: 'org-1',
        product_id: 'p-1',
        material_name: 'Flour',
        required_qty: 100,
        consumed_qty: 100,
        reserved_qty: 0,
        uom: 'kg',
        sequence: 1,
        consume_whole_lp: false,
        is_by_product: false,
        yield_percent: null,
        scrap_percent: 0,
        condition_flags: null,
        bom_item_id: null,
        bom_version: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
      }

      expect(getRemainingQty(material)).toBe(0)
    })

    it('returns 0 when consumed exceeds required (never negative)', () => {
      const material: WOMaterial = {
        id: '1',
        wo_id: 'wo-1',
        organization_id: 'org-1',
        product_id: 'p-1',
        material_name: 'Flour',
        required_qty: 100,
        consumed_qty: 120,
        reserved_qty: 0,
        uom: 'kg',
        sequence: 1,
        consume_whole_lp: false,
        is_by_product: false,
        yield_percent: null,
        scrap_percent: 0,
        condition_flags: null,
        bom_item_id: null,
        bom_version: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
      }

      expect(getRemainingQty(material)).toBe(0)
    })

    it('returns 0 for by-products', () => {
      const material: WOMaterial = {
        id: '1',
        wo_id: 'wo-1',
        organization_id: 'org-1',
        product_id: 'p-1',
        material_name: 'Cocoa Butter',
        required_qty: 0,
        consumed_qty: 0,
        reserved_qty: 0,
        uom: 'kg',
        sequence: 1,
        consume_whole_lp: false,
        is_by_product: true,
        yield_percent: 2,
        scrap_percent: 0,
        condition_flags: null,
        bom_item_id: null,
        bom_version: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
      }

      expect(getRemainingQty(material)).toBe(0)
    })

    it('handles zero consumed quantity', () => {
      const material: WOMaterial = {
        id: '1',
        wo_id: 'wo-1',
        organization_id: 'org-1',
        product_id: 'p-1',
        material_name: 'Flour',
        required_qty: 100,
        consumed_qty: 0,
        reserved_qty: 0,
        uom: 'kg',
        sequence: 1,
        consume_whole_lp: false,
        is_by_product: false,
        yield_percent: null,
        scrap_percent: 0,
        condition_flags: null,
        bom_item_id: null,
        bom_version: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
      }

      expect(getRemainingQty(material)).toBe(100)
    })
  })

  describe('getMaterialStatus', () => {
    it('returns "pending" when consumed is 0', () => {
      const material: WOMaterial = {
        id: '1',
        wo_id: 'wo-1',
        organization_id: 'org-1',
        product_id: 'p-1',
        material_name: 'Flour',
        required_qty: 100,
        consumed_qty: 0,
        reserved_qty: 0,
        uom: 'kg',
        sequence: 1,
        consume_whole_lp: false,
        is_by_product: false,
        yield_percent: null,
        scrap_percent: 0,
        condition_flags: null,
        bom_item_id: null,
        bom_version: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
      }

      expect(getMaterialStatus(material)).toBe('pending')
    })

    it('returns "in_progress" when 0 < consumed < required', () => {
      const material: WOMaterial = {
        id: '1',
        wo_id: 'wo-1',
        organization_id: 'org-1',
        product_id: 'p-1',
        material_name: 'Flour',
        required_qty: 100,
        consumed_qty: 50,
        reserved_qty: 0,
        uom: 'kg',
        sequence: 1,
        consume_whole_lp: false,
        is_by_product: false,
        yield_percent: null,
        scrap_percent: 0,
        condition_flags: null,
        bom_item_id: null,
        bom_version: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
      }

      expect(getMaterialStatus(material)).toBe('in_progress')
    })

    it('returns "complete" when consumed >= required', () => {
      const material: WOMaterial = {
        id: '1',
        wo_id: 'wo-1',
        organization_id: 'org-1',
        product_id: 'p-1',
        material_name: 'Flour',
        required_qty: 100,
        consumed_qty: 100,
        reserved_qty: 0,
        uom: 'kg',
        sequence: 1,
        consume_whole_lp: false,
        is_by_product: false,
        yield_percent: null,
        scrap_percent: 0,
        condition_flags: null,
        bom_item_id: null,
        bom_version: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
      }

      expect(getMaterialStatus(material)).toBe('complete')
    })

    it('returns "complete" when consumed exceeds required', () => {
      const material: WOMaterial = {
        id: '1',
        wo_id: 'wo-1',
        organization_id: 'org-1',
        product_id: 'p-1',
        material_name: 'Flour',
        required_qty: 100,
        consumed_qty: 120,
        reserved_qty: 0,
        uom: 'kg',
        sequence: 1,
        consume_whole_lp: false,
        is_by_product: false,
        yield_percent: null,
        scrap_percent: 0,
        condition_flags: null,
        bom_item_id: null,
        bom_version: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
      }

      expect(getMaterialStatus(material)).toBe('complete')
    })

    it('returns "by_product" for by-product materials', () => {
      const material: WOMaterial = {
        id: '1',
        wo_id: 'wo-1',
        organization_id: 'org-1',
        product_id: 'p-1',
        material_name: 'Cocoa Butter',
        required_qty: 0,
        consumed_qty: 0,
        reserved_qty: 0,
        uom: 'kg',
        sequence: 1,
        consume_whole_lp: false,
        is_by_product: true,
        yield_percent: 2,
        scrap_percent: 0,
        condition_flags: null,
        bom_item_id: null,
        bom_version: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
      }

      expect(getMaterialStatus(material)).toBe('by_product')
    })
  })

  describe('getConsumptionPercent', () => {
    it('calculates consumption percentage correctly', () => {
      const material: WOMaterial = {
        id: '1',
        wo_id: 'wo-1',
        organization_id: 'org-1',
        product_id: 'p-1',
        material_name: 'Flour',
        required_qty: 100,
        consumed_qty: 65,
        reserved_qty: 0,
        uom: 'kg',
        sequence: 1,
        consume_whole_lp: false,
        is_by_product: false,
        yield_percent: null,
        scrap_percent: 0,
        condition_flags: null,
        bom_item_id: null,
        bom_version: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
      }

      expect(getConsumptionPercent(material)).toBe(65)
    })

    it('returns 0 when nothing consumed', () => {
      const material: WOMaterial = {
        id: '1',
        wo_id: 'wo-1',
        organization_id: 'org-1',
        product_id: 'p-1',
        material_name: 'Flour',
        required_qty: 100,
        consumed_qty: 0,
        reserved_qty: 0,
        uom: 'kg',
        sequence: 1,
        consume_whole_lp: false,
        is_by_product: false,
        yield_percent: null,
        scrap_percent: 0,
        condition_flags: null,
        bom_item_id: null,
        bom_version: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
      }

      expect(getConsumptionPercent(material)).toBe(0)
    })

    it('returns 100 when fully consumed', () => {
      const material: WOMaterial = {
        id: '1',
        wo_id: 'wo-1',
        organization_id: 'org-1',
        product_id: 'p-1',
        material_name: 'Flour',
        required_qty: 100,
        consumed_qty: 100,
        reserved_qty: 0,
        uom: 'kg',
        sequence: 1,
        consume_whole_lp: false,
        is_by_product: false,
        yield_percent: null,
        scrap_percent: 0,
        condition_flags: null,
        bom_item_id: null,
        bom_version: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
      }

      expect(getConsumptionPercent(material)).toBe(100)
    })

    it('caps at 100% even when over-consumed', () => {
      const material: WOMaterial = {
        id: '1',
        wo_id: 'wo-1',
        organization_id: 'org-1',
        product_id: 'p-1',
        material_name: 'Flour',
        required_qty: 100,
        consumed_qty: 150,
        reserved_qty: 0,
        uom: 'kg',
        sequence: 1,
        consume_whole_lp: false,
        is_by_product: false,
        yield_percent: null,
        scrap_percent: 0,
        condition_flags: null,
        bom_item_id: null,
        bom_version: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
      }

      expect(getConsumptionPercent(material)).toBe(100)
    })

    it('returns 0 for by-products', () => {
      const material: WOMaterial = {
        id: '1',
        wo_id: 'wo-1',
        organization_id: 'org-1',
        product_id: 'p-1',
        material_name: 'Cocoa Butter',
        required_qty: 0,
        consumed_qty: 0,
        reserved_qty: 0,
        uom: 'kg',
        sequence: 1,
        consume_whole_lp: false,
        is_by_product: true,
        yield_percent: 2,
        scrap_percent: 0,
        condition_flags: null,
        bom_item_id: null,
        bom_version: null,
        notes: null,
        created_at: '2024-01-01T00:00:00Z',
      }

      expect(getConsumptionPercent(material)).toBe(0)
    })
  })
})
