/**
 * Settings Navigation Service
 * Story: 01.2 - Settings Shell: Navigation + Role Guards
 *
 * Builds navigation schema filtered by user role and enabled modules.
 *
 * Navigation Structure:
 * - 6 sections: Organization, Users & Roles, Infrastructure, Master Data, Integrations, System
 * - 14 total items
 * - Role-based visibility
 * - Module-based visibility
 */

import {
  Building2,
  Users,
  Shield,
  Mail,
  Warehouse,
  Cpu,
  Factory,
  AlertTriangle,
  Calculator,
  Key,
  Webhook,
  Package,
  Lock,
  FileText,
  type LucideIcon,
} from 'lucide-react'
import type { OrgContext } from '@/lib/types/organization'

/**
 * Navigation item interface
 *
 * Represents a single navigation entry in the settings sidebar.
 *
 * @property name - Display label for the navigation item
 * @property path - Route path (e.g., '/settings/users')
 * @property icon - Lucide React icon component to display
 * @property implemented - Whether the route is implemented (false shows "Soon" badge)
 * @property roles - Optional array of role codes that can access this item.
 *                   If undefined, item is visible to all roles.
 * @property module - Optional module key for module-based filtering.
 *                    Item only visible if module is enabled in org permissions.
 */
export interface NavigationItem {
  name: string
  path: string
  icon: LucideIcon
  implemented: boolean
  roles?: string[]
  module?: string
}

/**
 * Navigation section interface
 *
 * Groups related navigation items under a section header.
 *
 * @property section - Section header text displayed in the sidebar
 * @property items - Array of navigation items in this section
 */
export interface NavigationSection {
  section: string
  items: NavigationItem[]
}

/**
 * Full navigation schema (14 items, 6 sections)
 * Statically defined, dynamically filtered by buildSettingsNavigation
 */
const NAVIGATION_SCHEMA: NavigationSection[] = [
  {
    section: 'Organization',
    items: [
      {
        name: 'Organization Profile',
        path: '/settings/organization',
        icon: Building2,
        implemented: true,
        roles: ['owner', 'admin'],
      },
    ],
  },
  {
    section: 'Users & Roles',
    items: [
      {
        name: 'Users',
        path: '/settings/users',
        icon: Users,
        implemented: true,
        roles: ['owner', 'admin'],
      },
      {
        name: 'Roles & Permissions',
        path: '/settings/roles',
        icon: Shield,
        implemented: true,
        roles: ['owner', 'admin'],
      },
      {
        name: 'Invitations',
        path: '/settings/invitations',
        icon: Mail,
        implemented: false,
        roles: ['owner', 'admin'],
      },
    ],
  },
  {
    section: 'Infrastructure',
    items: [
      {
        name: 'Warehouses',
        path: '/settings/warehouses',
        icon: Warehouse,
        implemented: true,
        roles: ['owner', 'admin', 'warehouse_manager'],
        module: 'warehouse',
      },
      {
        name: 'Machines',
        path: '/settings/machines',
        icon: Cpu,
        implemented: true,
        roles: ['owner', 'admin', 'production_manager'],
        module: 'production',
      },
      {
        name: 'Production Lines',
        path: '/settings/production-lines',
        icon: Factory,
        implemented: true,
        roles: ['owner', 'admin', 'production_manager'],
        module: 'production',
      },
    ],
  },
  {
    section: 'Master Data',
    items: [
      {
        name: 'Allergens',
        path: '/settings/allergens',
        icon: AlertTriangle,
        implemented: true,
        roles: ['owner', 'admin', 'quality_manager'],
        module: 'quality',
      },
      {
        name: 'Tax Codes',
        path: '/settings/tax-codes',
        icon: Calculator,
        implemented: true,
        roles: ['owner', 'admin'],
      },
    ],
  },
  {
    section: 'Integrations',
    items: [
      {
        name: 'API Keys',
        path: '/settings/api-keys',
        icon: Key,
        implemented: false,
        roles: ['owner', 'admin'],
      },
      {
        name: 'Webhooks',
        path: '/settings/webhooks',
        icon: Webhook,
        implemented: false,
        roles: ['owner', 'admin'],
      },
    ],
  },
  {
    section: 'System',
    items: [
      {
        name: 'Modules',
        path: '/settings/modules',
        icon: Package,
        implemented: true,
        roles: ['owner', 'admin'],
      },
      {
        name: 'Security',
        path: '/settings/security',
        icon: Lock,
        implemented: true,
        roles: ['owner', 'admin'],
      },
      {
        name: 'Audit Logs',
        path: '/settings/audit-logs',
        icon: FileText,
        implemented: false,
        roles: ['owner', 'admin'],
      },
    ],
  },
]

/**
 * Builds navigation filtered by user's role and enabled modules
 *
 * Filter Logic:
 * 1. For each item: Check if user's role is in item.roles array
 * 2. For each item: Check if module is enabled (has permission)
 * 3. Remove sections with 0 items after filtering
 *
 * @param context - OrgContext with role and permissions
 * @returns Filtered navigation sections
 *
 * @example
 * ```typescript
 * const context = await getOrgContext(userId);
 * const navigation = buildSettingsNavigation(context);
 * // Admin sees all 6 sections
 * // Viewer sees 0 sections (no role match)
 * ```
 */
export function buildSettingsNavigation(
  context: OrgContext
): NavigationSection[] {
  const { role_code, permissions } = context

  // Filter sections and items
  const filteredSections = NAVIGATION_SCHEMA.map((section) => {
    // Filter items by role and module
    const filteredItems = section.items.filter((item) => {
      // Check role requirement
      if (item.roles && !item.roles.includes(role_code)) {
        return false
      }

      // Check module requirement (if item specifies a module)
      if (item.module) {
        // Module must exist in permissions (module is enabled)
        if (!permissions[item.module]) {
          return false
        }
      }

      return true
    })

    return {
      section: section.section,
      items: filteredItems,
    }
  }).filter((section) => section.items.length > 0) // Remove empty sections

  return filteredSections
}
