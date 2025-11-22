'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Settings,
  Wrench,
  Calendar,
  Factory,
  Warehouse,
  ShieldCheck,
  Truck,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

export interface SidebarModule {
  key: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  color: string
}

interface SidebarProps {
  enabledModules?: string[]
}

const allModules: SidebarModule[] = [
  {
    key: 'settings',
    name: 'Settings',
    icon: Settings,
    href: '/settings',
    color: 'text-gray-600',
  },
  {
    key: 'technical',
    name: 'Technical',
    icon: Wrench,
    href: '/technical',
    color: 'text-blue-600',
  },
  {
    key: 'planning',
    name: 'Planning',
    icon: Calendar,
    href: '/planning',
    color: 'text-indigo-600',
  },
  {
    key: 'production',
    name: 'Production',
    icon: Factory,
    href: '/production',
    color: 'text-green-600',
  },
  {
    key: 'warehouse',
    name: 'Warehouse',
    icon: Warehouse,
    href: '/warehouse',
    color: 'text-orange-600',
  },
  {
    key: 'quality',
    name: 'Quality',
    icon: ShieldCheck,
    href: '/quality',
    color: 'text-red-600',
  },
  {
    key: 'shipping',
    name: 'Shipping',
    icon: Truck,
    href: '/shipping',
    color: 'text-purple-600',
  },
  {
    key: 'npd',
    name: 'NPD',
    icon: Lightbulb,
    href: '/npd',
    color: 'text-pink-600',
  },
]

export function Sidebar({ enabledModules = [] }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  // Filter modules based on enabled_modules
  // Settings is always shown (required for configuration)
  const modules = allModules.filter(
    (module) =>
      module.key === 'settings' || enabledModules.includes(module.key)
  )

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname?.startsWith(href)
  }

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-64'
      } transition-all duration-200 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col relative`}
    >
      {/* Collapse Toggle Button */}
      <div className="absolute -right-3 top-4 z-10">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Dashboard Link (always first) */}
      <nav className="flex-1 pt-8 px-2">
        <Link
          href="/dashboard"
          className={`flex items-center h-12 px-3 rounded-lg transition-colors mb-1 ${
            isActive('/dashboard')
              ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Lightbulb
            className={`h-6 w-6 flex-shrink-0 ${
              isActive('/dashboard') ? 'text-blue-600' : 'text-gray-600'
            }`}
          />
          {!collapsed && (
            <span
              className={`ml-3 text-sm font-medium ${
                isActive('/dashboard')
                  ? 'text-blue-600'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              Dashboard
            </span>
          )}
        </Link>

        {/* Divider */}
        <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>

        {/* Module Links */}
        <div className="space-y-1">
          {modules.map((module) => {
            const Icon = module.icon
            const active = isActive(module.href)

            return (
              <Link
                key={module.key}
                href={module.href}
                className={`flex items-center h-12 px-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon
                  className={`h-6 w-6 flex-shrink-0 ${
                    active ? 'text-blue-600' : module.color
                  }`}
                />
                {!collapsed && (
                  <span
                    className={`ml-3 text-sm font-medium ${
                      active
                        ? 'text-blue-600'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {module.name}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer (optional - for future use) */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            MonoPilot MES v1.0
          </p>
        </div>
      )}
    </aside>
  )
}
