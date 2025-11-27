'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Menu, X, ChevronRight } from 'lucide-react'

export type SettingsPage =
  | 'dashboard'
  | 'organization'
  | 'users'
  | 'warehouses'
  | 'locations'
  | 'machines'
  | 'lines'
  | 'allergens'
  | 'tax-codes'
  | 'modules'
  | 'wizard'

interface SettingsHeaderProps {
  currentPage?: SettingsPage
  breadcrumb?: { label: string; href?: string }[]
}

const navItems = [
  { key: 'dashboard' as const, label: 'Settings', href: '/settings' },
  { key: 'organization' as const, label: 'Org', href: '/settings/organization' },
  { key: 'users' as const, label: 'Users', href: '/settings/users' },
  { key: 'warehouses' as const, label: 'WH', href: '/settings/warehouses' },
  { key: 'locations' as const, label: 'Loc', href: '/settings/locations' },
  { key: 'machines' as const, label: 'Machines', href: '/settings/machines' },
  { key: 'lines' as const, label: 'Lines', href: '/settings/production-lines' },
  { key: 'allergens' as const, label: 'Allergens', href: '/settings/allergens' },
  { key: 'tax-codes' as const, label: 'Tax', href: '/settings/tax-codes' },
  { key: 'modules' as const, label: 'Modules', href: '/settings/modules' },
  { key: 'wizard' as const, label: 'Wizard', href: '/settings/wizard' },
]

export function SettingsHeader({ currentPage, breadcrumb }: SettingsHeaderProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Auto-detect current page from pathname if not provided
  const activePage = currentPage || detectCurrentPage(pathname)

  return (
    <header className="border-b bg-background">
      {/* Main Header Row - 60px */}
      <div className="h-[60px] flex items-center justify-between px-4 md:px-6">
        {/* Logo / Module Name */}
        <div className="flex items-center gap-2">
          <span className="text-lg md:text-xl font-semibold">MonoPilot</span>
        </div>

        {/* Desktop Navigation - wrap if needed */}
        <nav className="hidden md:flex items-center gap-0.5 flex-wrap justify-center">
          {navItems.map((item) => (
            <Link key={item.key} href={item.href}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'text-sm font-medium rounded-none border-b-2 border-transparent hover:border-primary/50 px-2',
                  activePage === item.key && 'border-primary bg-primary/5'
                )}
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-b bg-background px-4 py-2 space-y-1">
          {navItems.map((item) => (
            <Link key={item.key} href={item.href} onClick={() => setMobileMenuOpen(false)}>
              <div
                className={cn(
                  'block px-3 py-2 rounded-md text-sm font-medium',
                  activePage === item.key
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                {item.label}
              </div>
            </Link>
          ))}
        </nav>
      )}

      {/* Breadcrumb Row (if provided) */}
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="h-[40px] flex items-center px-4 md:px-6 bg-gray-50 border-b">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/settings" className="hover:text-primary">
              Settings
            </Link>
            {breadcrumb.map((item, index) => (
              <span key={index} className="flex items-center">
                <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
                {item.href ? (
                  <Link href={item.href} className="hover:text-primary">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-gray-900 font-medium">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}

function detectCurrentPage(pathname: string): SettingsPage {
  if (pathname.includes('/organization')) return 'organization'
  if (pathname.includes('/users')) return 'users'
  if (pathname.includes('/warehouses')) return 'warehouses'
  if (pathname.includes('/locations')) return 'locations'
  if (pathname.includes('/machines')) return 'machines'
  if (pathname.includes('/production-lines')) return 'lines'
  if (pathname.includes('/allergens')) return 'allergens'
  if (pathname.includes('/tax-codes')) return 'tax-codes'
  if (pathname.includes('/modules')) return 'modules'
  if (pathname.includes('/wizard')) return 'wizard'
  return 'dashboard'
}
