/**
 * Settings Dashboard Landing Page
 * Story: 1.15 Settings Dashboard Landing Page
 * Story: 1.16 Settings Header Layout
 *
 * Provides visual overview of all available settings sections,
 * allowing users to discover and navigate to configuration areas.
 */

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SettingsHeader } from '@/components/settings/SettingsHeader'
import { SettingsStatsCards } from '@/components/settings/SettingsStatsCards'
import Link from 'next/link'
import {
  Building2,
  Users,
  Warehouse,
  MapPin,
  Cpu,
  Factory,
  AlertTriangle,
  Receipt,
  Grid3x3,
  Wand2,
} from 'lucide-react'

interface SettingModule {
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  color: string
}

// AC-015.2: Settings Cards/Modules Display
const settingsModules: SettingModule[] = [
  // Organization & Users
  {
    name: 'Organization Settings',
    description: 'Company profile, logo, and basic information',
    icon: Building2,
    href: '/settings/organization',
    color: 'text-blue-600',
  },
  {
    name: 'User Management',
    description: 'Manage users, roles, and permissions',
    icon: Users,
    href: '/settings/users',
    color: 'text-blue-600',
  },
  // Warehouse & Facilities
  {
    name: 'Warehouses',
    description: 'Configure warehouse locations and sites',
    icon: Warehouse,
    href: '/settings/warehouses',
    color: 'text-orange-600',
  },
  {
    name: 'Locations',
    description: 'Manage storage locations and bins',
    icon: MapPin,
    href: '/settings/locations',
    color: 'text-orange-600',
  },
  {
    name: 'Machines',
    description: 'Configure production equipment',
    icon: Cpu,
    href: '/settings/machines',
    color: 'text-amber-600',
  },
  {
    name: 'Production Lines',
    description: 'Set up production line configurations',
    icon: Factory,
    href: '/settings/production-lines',
    color: 'text-amber-600',
  },
  // Product Configuration
  {
    name: 'Allergens',
    description: 'Manage allergen tags for products',
    icon: AlertTriangle,
    href: '/settings/allergens',
    color: 'text-red-600',
  },
  {
    name: 'Tax Codes',
    description: 'Configure VAT and tax codes',
    icon: Receipt,
    href: '/settings/tax-codes',
    color: 'text-pink-600',
  },
  // System Configuration
  {
    name: 'Module Activation',
    description: 'Enable/disable system modules',
    icon: Grid3x3,
    href: '/settings/modules',
    color: 'text-purple-600',
  },
  {
    name: 'Setup Wizard',
    description: 'Initial system setup assistant',
    icon: Wand2,
    href: '/settings/wizard',
    color: 'text-indigo-600',
  },
]

export default function SettingsPage() {
  return (
    <div>
      <SettingsHeader currentPage="dashboard" />

      <div className="px-4 md:px-6 py-6 space-y-6">
        {/* AC-015.1: Page Title and Subtitle */}
        <div>
          <h1 className="text-2xl font-bold">Settings Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Configure your MonoPilot system
          </p>
        </div>

        {/* AC-1.17: Settings Stats Cards */}
        <SettingsStatsCards />

        {/* AC-015.2 & AC-015.4: Responsive Grid of Settings Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsModules.map((module) => {
          const Icon = module.icon

          return (
            // AC-015.3: Card Interaction & Navigation
            <Link
              key={module.href}
              href={module.href}
              className="block transition-transform hover:scale-[1.02]"
            >
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="mt-1">
                      <Icon className={`h-10 w-10 ${module.color}`} />
                    </div>

                    {/* Title and Description */}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-2">
                        {module.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {module.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>

        {/* Helper Text */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Tip:</strong> Click on any card above to configure that area of the system.
          </p>
        </div>
      </div>
    </div>
  )
}
