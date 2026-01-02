/**
 * Unit Tests: PO Permissions Utility
 * Story: 03.3 PO CRUD + Lines
 * Fix: MAJOR-02 - Centralized Role Checks
 *
 * Tests the centralized permission system for PO operations.
 */

import { describe, it, expect } from 'vitest'
import {
  hasPOPermission,
  extractRole,
  checkPOPermission,
  getPermissionRequirement,
  PO_PERMISSIONS,
  type POAction,
} from '../po-permissions'

describe('PO Permissions', () => {
  describe('hasPOPermission', () => {
    it('should allow owner all actions', () => {
      expect(hasPOPermission('owner', 'view')).toBe(true)
      expect(hasPOPermission('owner', 'create')).toBe(true)
      expect(hasPOPermission('owner', 'edit')).toBe(true)
      expect(hasPOPermission('owner', 'delete')).toBe(true)
      expect(hasPOPermission('owner', 'submit')).toBe(true)
      expect(hasPOPermission('owner', 'cancel')).toBe(true)
      expect(hasPOPermission('owner', 'addLines')).toBe(true)
    })

    it('should allow admin all actions', () => {
      expect(hasPOPermission('admin', 'view')).toBe(true)
      expect(hasPOPermission('admin', 'create')).toBe(true)
      expect(hasPOPermission('admin', 'delete')).toBe(true)
    })

    it('should allow manager all actions', () => {
      expect(hasPOPermission('manager', 'view')).toBe(true)
      expect(hasPOPermission('manager', 'create')).toBe(true)
      expect(hasPOPermission('manager', 'delete')).toBe(true)
      expect(hasPOPermission('manager', 'cancel')).toBe(true)
    })

    it('should allow planner to create, edit, submit, cancel but not delete', () => {
      expect(hasPOPermission('planner', 'view')).toBe(true)
      expect(hasPOPermission('planner', 'create')).toBe(true)
      expect(hasPOPermission('planner', 'edit')).toBe(true)
      expect(hasPOPermission('planner', 'submit')).toBe(true)
      expect(hasPOPermission('planner', 'cancel')).toBe(true)
      expect(hasPOPermission('planner', 'delete')).toBe(false)
    })

    it('should allow production_manager to create, edit, submit but not delete', () => {
      expect(hasPOPermission('production_manager', 'view')).toBe(true)
      expect(hasPOPermission('production_manager', 'create')).toBe(true)
      expect(hasPOPermission('production_manager', 'submit')).toBe(true)
      expect(hasPOPermission('production_manager', 'delete')).toBe(false)
    })

    it('should allow purchasing to create, edit, submit but not delete or cancel', () => {
      expect(hasPOPermission('purchasing', 'view')).toBe(true)
      expect(hasPOPermission('purchasing', 'create')).toBe(true)
      expect(hasPOPermission('purchasing', 'edit')).toBe(true)
      expect(hasPOPermission('purchasing', 'submit')).toBe(true)
      expect(hasPOPermission('purchasing', 'delete')).toBe(false)
      expect(hasPOPermission('purchasing', 'cancel')).toBe(false)
    })

    it('should allow viewer only to view', () => {
      expect(hasPOPermission('viewer', 'view')).toBe(true)
      expect(hasPOPermission('viewer', 'create')).toBe(false)
      expect(hasPOPermission('viewer', 'edit')).toBe(false)
      expect(hasPOPermission('viewer', 'delete')).toBe(false)
      expect(hasPOPermission('viewer', 'submit')).toBe(false)
      expect(hasPOPermission('viewer', 'cancel')).toBe(false)
    })

    it('should handle case-insensitive role matching', () => {
      expect(hasPOPermission('ADMIN', 'create')).toBe(true)
      expect(hasPOPermission('Admin', 'create')).toBe(true)
      expect(hasPOPermission('OWNER', 'delete')).toBe(true)
    })

    it('should handle null/undefined/empty roles', () => {
      expect(hasPOPermission(null, 'view')).toBe(false)
      expect(hasPOPermission(undefined, 'create')).toBe(false)
      expect(hasPOPermission('', 'edit')).toBe(false)
    })

    it('should reject unknown roles', () => {
      expect(hasPOPermission('unknown_role', 'view')).toBe(false)
      expect(hasPOPermission('superadmin', 'create')).toBe(false)
    })
  })

  describe('extractRole', () => {
    it('should extract role code from nested object', () => {
      const user = { role: { code: 'admin' } }
      expect(extractRole(user)).toBe('admin')
    })

    it('should handle string role directly', () => {
      const user = { role: 'planner' }
      expect(extractRole(user)).toBe('planner')
    })

    it('should normalize role to lowercase', () => {
      const user = { role: { code: 'ADMIN' } }
      expect(extractRole(user)).toBe('admin')
    })

    it('should trim whitespace from role', () => {
      const user = { role: { code: '  manager  ' } }
      expect(extractRole(user)).toBe('manager')
    })

    it('should handle null/undefined user', () => {
      expect(extractRole(null)).toBe('')
      expect(extractRole(undefined)).toBe('')
    })

    it('should handle missing role property', () => {
      expect(extractRole({})).toBe('')
      expect(extractRole({ role: null })).toBe('')
      expect(extractRole({ role: undefined })).toBe('')
    })

    it('should handle empty role code', () => {
      expect(extractRole({ role: { code: '' } })).toBe('')
    })
  })

  describe('checkPOPermission', () => {
    it('should combine extractRole and hasPOPermission', () => {
      const user = { role: { code: 'admin' } }
      expect(checkPOPermission(user, 'create')).toBe(true)
      expect(checkPOPermission(user, 'delete')).toBe(true)
    })

    it('should handle viewer user correctly', () => {
      const user = { role: { code: 'viewer' } }
      expect(checkPOPermission(user, 'view')).toBe(true)
      expect(checkPOPermission(user, 'create')).toBe(false)
    })

    it('should return false for null user', () => {
      expect(checkPOPermission(null, 'view')).toBe(false)
    })
  })

  describe('getPermissionRequirement', () => {
    it('should return human-readable requirement for each action', () => {
      expect(getPermissionRequirement('view')).toBe('Viewer role or higher')
      expect(getPermissionRequirement('create')).toBe('Purchasing role or higher')
      expect(getPermissionRequirement('delete')).toBe('Manager role or higher')
      expect(getPermissionRequirement('cancel')).toBe('Planner role or higher')
    })
  })

  describe('PO_PERMISSIONS constant', () => {
    it('should have all expected actions defined', () => {
      const expectedActions: POAction[] = [
        'view', 'create', 'edit', 'delete', 'submit', 'cancel',
        'addLines', 'editLines', 'deleteLines',
      ]
      for (const action of expectedActions) {
        expect(PO_PERMISSIONS[action]).toBeDefined()
        expect(Array.isArray(PO_PERMISSIONS[action])).toBe(true)
      }
    })

    it('should have delete as most restrictive action', () => {
      // Delete should only allow manager, admin, owner
      expect(PO_PERMISSIONS.delete).toContain('manager')
      expect(PO_PERMISSIONS.delete).toContain('admin')
      expect(PO_PERMISSIONS.delete).toContain('owner')
      expect(PO_PERMISSIONS.delete).not.toContain('planner')
      expect(PO_PERMISSIONS.delete).not.toContain('purchasing')
      expect(PO_PERMISSIONS.delete).not.toContain('viewer')
    })

    it('should have view as least restrictive action', () => {
      // View should allow all roles
      expect(PO_PERMISSIONS.view.length).toBeGreaterThan(PO_PERMISSIONS.delete.length)
      expect(PO_PERMISSIONS.view).toContain('viewer')
    })
  })
})
