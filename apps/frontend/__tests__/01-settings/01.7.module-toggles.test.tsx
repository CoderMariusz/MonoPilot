/**
 * Module Toggles Component Tests
 * Story: 01.7 Module Toggles
 * Epic: 01a Settings
 *
 * Tests component rendering, toggle interactions, and dependency validation UI
 *
 * Acceptance Criteria:
 * - AC-01.7.1: Display all 7 toggleable modules
 * - AC-01.7.2: Enable module when toggle clicked
 * - AC-01.7.3: Show confirmation modal on disable with dependencies
 * - AC-01.7.4: Non-admin users see read-only toggles
 * - AC-01.7.5: Navigation reflects module state
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModuleTogglesPage } from '@/app/(authenticated)/settings/modules/page'

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  })),
  auth: {
    getUser: vi.fn(() => Promise.resolve({
      data: { user: { id: 'user-123' } },
      error: null
    }))
  }
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient
}))

describe('01a_7_ModuleToggles_Component', () => {
  const mockModules = [
    {
      id: 'mod-1',
      code: 'technical',
      name: 'Technical',
      description: 'Products, BOMs, Routings',
      dependencies: [],
      can_disable: false,
      display_order: 1
    },
    {
      id: 'mod-2',
      code: 'planning',
      name: 'Planning',
      description: 'Work Orders, Purchase Orders',
      dependencies: ['technical'],
      can_disable: true,
      display_order: 2
    },
    {
      id: 'mod-3',
      code: 'production',
      name: 'Production',
      description: 'Work Order Execution',
      dependencies: ['technical', 'planning'],
      can_disable: true,
      display_order: 3
    },
    {
      id: 'mod-4',
      code: 'warehouse',
      name: 'Warehouse',
      description: 'License Plates, Inventory',
      dependencies: ['technical'],
      can_disable: true,
      display_order: 4
    },
    {
      id: 'mod-5',
      code: 'quality',
      name: 'Quality',
      description: 'QC Holds, Inspections',
      dependencies: ['production'],
      can_disable: true,
      display_order: 5
    },
    {
      id: 'mod-6',
      code: 'shipping',
      name: 'Shipping',
      description: 'Sales Orders, Picking',
      dependencies: ['warehouse'],
      can_disable: true,
      display_order: 6
    }
  ]

  const mockOrgModules = [
    { org_id: 'org-123', module_id: 'mod-1', enabled: true },
    { org_id: 'org-123', module_id: 'mod-2', enabled: true },
    { org_id: 'org-123', module_id: 'mod-3', enabled: true },
    { org_id: 'org-123', module_id: 'mod-4', enabled: true },
    { org_id: 'org-123', module_id: 'mod-5', enabled: false },
    { org_id: 'org-123', module_id: 'mod-6', enabled: false }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC-01.7.1: Display all toggleable modules', () => {
    it('should_display_all_7_modules_with_toggle_switches', async () => {
      // Arrange
      mockSupabaseClient.from = vi.fn((table) => {
        if (table === 'modules') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockModules, error: null }))
            }))
          }
        }
        if (table === 'organization_modules') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: mockOrgModules, error: null }))
            }))
          }
        }
        return { select: vi.fn() }
      })

      // Act
      render(<ModuleTogglesPage />)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Technical')).toBeInTheDocument()
        expect(screen.getByText('Planning')).toBeInTheDocument()
        expect(screen.getByText('Production')).toBeInTheDocument()
        expect(screen.getByText('Warehouse')).toBeInTheDocument()
        expect(screen.getByText('Quality')).toBeInTheDocument()
        expect(screen.getByText('Shipping')).toBeInTheDocument()
      })

      // Verify toggle switches exist (7 modules - 1 non-toggleable = 6 toggles)
      const toggles = screen.getAllByRole('switch')
      expect(toggles).toHaveLength(6)
    })

    it('should_show_module_descriptions_and_dependencies', async () => {
      // Arrange
      mockSupabaseClient.from = vi.fn((table) => {
        if (table === 'modules') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockModules, error: null }))
            }))
          }
        }
        if (table === 'organization_modules') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: mockOrgModules, error: null }))
            }))
          }
        }
        return { select: vi.fn() }
      })

      // Act
      render(<ModuleTogglesPage />)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Products, BOMs, Routings/)).toBeInTheDocument()
        expect(screen.getByText(/Requires: Technical/)).toBeInTheDocument()
        expect(screen.getByText(/Requires: Technical, Planning/)).toBeInTheDocument()
      })
    })

    it('should_show_settings_module_as_always_enabled', async () => {
      // Arrange - Settings module cannot be disabled
      const modulesWithSettings = [
        {
          id: 'mod-0',
          code: 'settings',
          name: 'Settings',
          description: 'Organization and user management',
          dependencies: [],
          can_disable: false,
          display_order: 0
        },
        ...mockModules
      ]

      mockSupabaseClient.from = vi.fn((table) => {
        if (table === 'modules') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: modulesWithSettings, error: null }))
            }))
          }
        }
        return { select: vi.fn() }
      })

      // Act
      render(<ModuleTogglesPage />)

      // Assert
      await waitFor(() => {
        const settingsModule = screen.getByText('Settings').closest('[data-module="settings"]')
        expect(settingsModule).toHaveTextContent('Always Enabled')

        // Settings should not have a toggle switch
        const settingsToggle = within(settingsModule!).queryByRole('switch')
        expect(settingsToggle).not.toBeInTheDocument()
      })
    })
  })

  describe('AC-01.7.2: Enable disabled module', () => {
    it('should_enable_module_when_toggle_clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: { enabled: true }, error: null }))
        }))
      }))

      mockSupabaseClient.from = vi.fn((table) => {
        if (table === 'modules') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockModules, error: null }))
            }))
          }
        }
        if (table === 'organization_modules') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: mockOrgModules, error: null }))
            })),
            update: mockUpdate
          }
        }
        return { select: vi.fn() }
      })

      // Act
      render(<ModuleTogglesPage />)

      await waitFor(() => {
        expect(screen.getByText('Quality')).toBeInTheDocument()
      })

      const qualityToggle = screen.getByLabelText(/Quality.*toggle/i)
      await user.click(qualityToggle)

      // Assert
      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ enabled: true })
        expect(screen.getByText(/Quality module enabled/i)).toBeInTheDocument()
      })
    })

    it('should_show_warning_if_dependencies_not_enabled', async () => {
      // Arrange - Production disabled, Quality disabled
      const user = userEvent.setup()
      const orgModulesWithDisabledProduction = mockOrgModules.map(m =>
        m.module_id === 'mod-3' ? { ...m, enabled: false } : m
      )

      mockSupabaseClient.from = vi.fn((table) => {
        if (table === 'modules') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockModules, error: null }))
            }))
          }
        }
        if (table === 'organization_modules') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: orgModulesWithDisabledProduction, error: null }))
            }))
          }
        }
        return { select: vi.fn() }
      })

      // Act
      render(<ModuleTogglesPage />)

      await waitFor(() => {
        expect(screen.getByText('Quality')).toBeInTheDocument()
      })

      const qualityToggle = screen.getByLabelText(/Quality.*toggle/i)
      await user.click(qualityToggle)

      // Assert - Should show dependency error
      await waitFor(() => {
        expect(screen.getByText(/Cannot enable Quality/i)).toBeInTheDocument()
        expect(screen.getByText(/Production must be enabled first/i)).toBeInTheDocument()
      })
    })

    it('should_update_navigation_sidebar_after_enabling_module', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockNavigationUpdate = vi.fn()

      // Mock navigation context
      vi.mock('@/context/NavigationContext', () => ({
        useNavigation: () => ({
          enabledModules: ['technical', 'planning', 'production', 'warehouse'],
          refreshModules: mockNavigationUpdate
        })
      }))

      mockSupabaseClient.from = vi.fn((table) => {
        if (table === 'modules') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockModules, error: null }))
            }))
          }
        }
        if (table === 'organization_modules') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: mockOrgModules, error: null }))
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ data: { enabled: true }, error: null }))
              }))
            }))
          }
        }
        return { select: vi.fn() }
      })

      // Act
      render(<ModuleTogglesPage />)

      await waitFor(() => {
        expect(screen.getByText('Quality')).toBeInTheDocument()
      })

      const qualityToggle = screen.getByLabelText(/Quality.*toggle/i)
      await user.click(qualityToggle)

      // Assert - Navigation should be refreshed
      await waitFor(() => {
        expect(mockNavigationUpdate).toHaveBeenCalled()
      })
    })
  })

  describe('AC-01.7.3: Disable module with confirmation', () => {
    it('should_show_confirmation_modal_when_disabling_module', async () => {
      // Arrange
      const user = userEvent.setup()

      mockSupabaseClient.from = vi.fn((table) => {
        if (table === 'modules') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockModules, error: null }))
            }))
          }
        }
        if (table === 'organization_modules') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: mockOrgModules, error: null }))
            }))
          }
        }
        return { select: vi.fn() }
      })

      // Act
      render(<ModuleTogglesPage />)

      await waitFor(() => {
        expect(screen.getByText('Planning')).toBeInTheDocument()
      })

      const planningToggle = screen.getByLabelText(/Planning.*toggle/i)
      await user.click(planningToggle)

      // Assert - Confirmation modal should appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText(/Disable Planning Module/i)).toBeInTheDocument()
        expect(screen.getByText(/This will hide the Planning module/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      })
    })

    it('should_prevent_disable_if_dependent_modules_enabled', async () => {
      // Arrange - Try to disable Planning while Production is enabled
      const user = userEvent.setup()

      mockSupabaseClient.from = vi.fn((table) => {
        if (table === 'modules') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockModules, error: null }))
            }))
          }
        }
        if (table === 'organization_modules') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: mockOrgModules, error: null }))
            }))
          }
        }
        return { select: vi.fn() }
      })

      // Act
      render(<ModuleTogglesPage />)

      await waitFor(() => {
        expect(screen.getByText('Planning')).toBeInTheDocument()
      })

      const planningToggle = screen.getByLabelText(/Planning.*toggle/i)
      await user.click(planningToggle)

      // Assert - Should show dependency error
      await waitFor(() => {
        expect(screen.getByText(/Cannot disable Planning/i)).toBeInTheDocument()
        expect(screen.getByText(/Production depends on this module/i)).toBeInTheDocument()
        expect(screen.getByText(/Disable Production first/i)).toBeInTheDocument()
      })
    })

    it('should_show_warning_about_dependent_modules_in_modal', async () => {
      // Arrange - Try to disable Production (Quality depends on it)
      const user = userEvent.setup()
      const orgModulesWithQualityEnabled = mockOrgModules.map(m =>
        m.module_id === 'mod-5' ? { ...m, enabled: true } : m
      )

      mockSupabaseClient.from = vi.fn((table) => {
        if (table === 'modules') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockModules, error: null }))
            }))
          }
        }
        if (table === 'organization_modules') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: orgModulesWithQualityEnabled, error: null }))
            }))
          }
        }
        return { select: vi.fn() }
      })

      // Act
      render(<ModuleTogglesPage />)

      await waitFor(() => {
        expect(screen.getByText('Production')).toBeInTheDocument()
      })

      const productionToggle = screen.getByLabelText(/Production.*toggle/i)
      await user.click(productionToggle)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Quality depends on Production/i)).toBeInTheDocument()
        expect(screen.getByText(/The following modules will also be disabled: Quality/i)).toBeInTheDocument()
      })
    })

    it('should_disable_module_after_confirmation', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: { enabled: false }, error: null }))
        }))
      }))

      mockSupabaseClient.from = vi.fn((table) => {
        if (table === 'modules') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockModules, error: null }))
            }))
          }
        }
        if (table === 'organization_modules') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: mockOrgModules, error: null }))
            })),
            update: mockUpdate
          }
        }
        return { select: vi.fn() }
      })

      // Act
      render(<ModuleTogglesPage />)

      await waitFor(() => {
        expect(screen.getByText('Warehouse')).toBeInTheDocument()
      })

      const warehouseToggle = screen.getByLabelText(/Warehouse.*toggle/i)
      await user.click(warehouseToggle)

      // Confirm in modal
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      // Assert
      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ enabled: false })
        expect(screen.getByText(/Warehouse module disabled/i)).toBeInTheDocument()
      })
    })

    it('should_cancel_disable_when_cancel_clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockUpdate = vi.fn()

      mockSupabaseClient.from = vi.fn((table) => {
        if (table === 'modules') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockModules, error: null }))
            }))
          }
        }
        if (table === 'organization_modules') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: mockOrgModules, error: null }))
            })),
            update: mockUpdate
          }
        }
        return { select: vi.fn() }
      })

      // Act
      render(<ModuleTogglesPage />)

      await waitFor(() => {
        expect(screen.getByText('Warehouse')).toBeInTheDocument()
      })

      const warehouseToggle = screen.getByLabelText(/Warehouse.*toggle/i)
      await user.click(warehouseToggle)

      // Cancel in modal
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Assert
      await waitFor(() => {
        expect(mockUpdate).not.toHaveBeenCalled()
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('AC-01.7.4: Non-admin read-only access', () => {
    it('should_disable_toggles_for_non_admin_users', async () => {
      // Arrange - User with operator role
      mockSupabaseClient.from = vi.fn((table) => {
        if (table === 'modules') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockModules, error: null }))
            }))
          }
        }
        if (table === 'organization_modules') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: mockOrgModules, error: null }))
            }))
          }
        }
        if (table === 'users') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: { role: 'operator' },
                  error: null
                }))
              }))
            }))
          }
        }
        return { select: vi.fn() }
      })

      // Act
      render(<ModuleTogglesPage />)

      // Assert
      await waitFor(() => {
        const toggles = screen.getAllByRole('switch')
        toggles.forEach(toggle => {
          expect(toggle).toBeDisabled()
        })

        expect(screen.getByText(/You do not have permission to modify modules/i)).toBeInTheDocument()
      })
    })

    it('should_show_read_only_badge_for_non_admin', async () => {
      // Arrange
      mockSupabaseClient.from = vi.fn((table) => {
        if (table === 'modules') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockModules, error: null }))
            }))
          }
        }
        if (table === 'organization_modules') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: mockOrgModules, error: null }))
            }))
          }
        }
        if (table === 'users') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: { role: 'viewer' },
                  error: null
                }))
              }))
            }))
          }
        }
        return { select: vi.fn() }
      })

      // Act
      render(<ModuleTogglesPage />)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Read Only/i)).toBeInTheDocument()
      })
    })
  })

  describe('AC-01.7.5: Navigation reflects module state', () => {
    it('should_hide_navigation_item_when_module_disabled', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: { enabled: false }, error: null }))
        }))
      }))

      mockSupabaseClient.from = vi.fn((table) => {
        if (table === 'modules') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockModules, error: null }))
            }))
          }
        }
        if (table === 'organization_modules') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: mockOrgModules, error: null }))
            })),
            update: mockUpdate
          }
        }
        return { select: vi.fn() }
      })

      // Act
      render(<ModuleTogglesPage />)

      await waitFor(() => {
        expect(screen.getByText('Warehouse')).toBeInTheDocument()
      })

      // Verify navigation initially shows warehouse
      expect(document.querySelector('[data-nav-item="warehouse"]')).toBeInTheDocument()

      const warehouseToggle = screen.getByLabelText(/Warehouse.*toggle/i)
      await user.click(warehouseToggle)

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      // Assert - Navigation should remove warehouse item
      await waitFor(() => {
        expect(document.querySelector('[data-nav-item="warehouse"]')).not.toBeInTheDocument()
      })
    })

    it('should_show_navigation_item_when_module_enabled', async () => {
      // Arrange
      const user = userEvent.setup()
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: { enabled: true }, error: null }))
        }))
      }))

      mockSupabaseClient.from = vi.fn((table) => {
        if (table === 'modules') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockModules, error: null }))
            }))
          }
        }
        if (table === 'organization_modules') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: mockOrgModules, error: null }))
            })),
            update: mockUpdate
          }
        }
        return { select: vi.fn() }
      })

      // Act
      render(<ModuleTogglesPage />)

      await waitFor(() => {
        expect(screen.getByText('Quality')).toBeInTheDocument()
      })

      // Verify navigation initially doesn't show quality
      expect(document.querySelector('[data-nav-item="quality"]')).not.toBeInTheDocument()

      const qualityToggle = screen.getByLabelText(/Quality.*toggle/i)
      await user.click(qualityToggle)

      // Assert - Navigation should add quality item
      await waitFor(() => {
        expect(document.querySelector('[data-nav-item="quality"]')).toBeInTheDocument()
      })
    })
  })

  describe('Loading and Error States', () => {
    it('should_show_loading_skeleton_while_fetching_modules', async () => {
      // Arrange - Slow API response
      mockSupabaseClient.from = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => new Promise(resolve => setTimeout(() =>
            resolve({ data: mockModules, error: null }), 1000)))
        }))
      }))

      // Act
      render(<ModuleTogglesPage />)

      // Assert
      expect(screen.getByText(/Loading module configuration/i)).toBeInTheDocument()
      expect(screen.getAllByTestId('skeleton-loader')).toHaveLength(3)
    })

    it('should_show_error_message_on_fetch_failure', async () => {
      // Arrange
      mockSupabaseClient.from = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Network error' }
          }))
        }))
      }))

      // Act
      render(<ModuleTogglesPage />)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Failed to load module configuration/i)).toBeInTheDocument()
        expect(screen.getByText(/Network error/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })

    it('should_retry_fetch_when_retry_button_clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      let attemptCount = 0

      mockSupabaseClient.from = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => {
            attemptCount++
            if (attemptCount === 1) {
              return Promise.resolve({ data: null, error: { message: 'Network error' } })
            }
            return Promise.resolve({ data: mockModules, error: null })
          })
        }))
      }))

      // Act
      render(<ModuleTogglesPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Technical')).toBeInTheDocument()
        expect(attemptCount).toBe(2)
      })
    })
  })

  describe('Module Status Summary', () => {
    it('should_display_enabled_and_disabled_count', async () => {
      // Arrange
      mockSupabaseClient.from = vi.fn((table) => {
        if (table === 'modules') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockModules, error: null }))
            }))
          }
        }
        if (table === 'organization_modules') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: mockOrgModules, error: null }))
            }))
          }
        }
        return { select: vi.fn() }
      })

      // Act
      render(<ModuleTogglesPage />)

      // Assert - 4 enabled, 2 disabled (excluding Settings)
      await waitFor(() => {
        expect(screen.getByText(/Module Status: 4 enabled, 2 disabled/i)).toBeInTheDocument()
      })
    })

    it('should_update_count_after_toggle', async () => {
      // Arrange
      const user = userEvent.setup()
      let orgModulesState = [...mockOrgModules]

      mockSupabaseClient.from = vi.fn((table) => {
        if (table === 'modules') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockModules, error: null }))
            }))
          }
        }
        if (table === 'organization_modules') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: orgModulesState, error: null }))
            })),
            update: vi.fn((updates) => {
              // Simulate state change
              orgModulesState = orgModulesState.map(m =>
                m.module_id === 'mod-5' ? { ...m, enabled: true } : m
              )
              return {
                eq: vi.fn(() => ({
                  eq: vi.fn(() => Promise.resolve({ data: { enabled: true }, error: null }))
                }))
              }
            })
          }
        }
        return { select: vi.fn() }
      })

      // Act
      render(<ModuleTogglesPage />)

      await waitFor(() => {
        expect(screen.getByText(/4 enabled, 2 disabled/i)).toBeInTheDocument()
      })

      const qualityToggle = screen.getByLabelText(/Quality.*toggle/i)
      await user.click(qualityToggle)

      // Assert - Count should update to 5 enabled, 1 disabled
      await waitFor(() => {
        expect(screen.getByText(/5 enabled, 1 disabled/i)).toBeInTheDocument()
      })
    })
  })
})
