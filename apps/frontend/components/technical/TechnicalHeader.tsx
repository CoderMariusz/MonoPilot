'use client'

/**
 * Technical Module Header Component
 * Story: 2.25 Technical Header Layout
 * AC-2.25.1: Reusable header with navigation tabs
 * AC-2.25.2: Active tab highlighting
 * AC-2.25.4: Applied to all technical pages
 */

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Menu, X, Settings } from 'lucide-react'

export type TechnicalPage = 'dashboard' | 'products' | 'boms' | 'routings' | 'tracing' | 'traceability'

interface TechnicalHeaderProps {
  currentPage?: TechnicalPage
}

const navItems = [
  { key: 'dashboard' as const, label: 'Technical', href: '/technical' },
  { key: 'products' as const, label: 'Products', href: '/technical/products' },
  { key: 'boms' as const, label: 'BOMs', href: '/technical/boms' },
  { key: 'routings' as const, label: 'Routings', href: '/technical/routings' },
  { key: 'traceability' as const, label: 'Traceability', href: '/technical/traceability' },
]

export function TechnicalHeader({ currentPage }: TechnicalHeaderProps) {
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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navItems.map((item) => (
            <Link key={item.key} href={item.href}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'text-sm font-medium rounded-none border-b-2 border-transparent hover:border-primary/50 px-3',
                  activePage === item.key && 'border-primary bg-primary/5'
                )}
              >
                {item.label}
              </Button>
            </Link>
          ))}
          {/* Settings button */}
          <Link href="/settings/product-types">
            <Button variant="ghost" size="sm" className="px-2">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
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
          <Link href="/settings/product-types" onClick={() => setMobileMenuOpen(false)}>
            <div className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
              Settings
            </div>
          </Link>
        </nav>
      )}
    </header>
  )
}

function detectCurrentPage(pathname: string): TechnicalPage {
  if (pathname.includes('/products')) return 'products'
  if (pathname.includes('/boms')) return 'boms'
  if (pathname.includes('/routings')) return 'routings'
  if (pathname.includes('/traceability')) return 'traceability'
  if (pathname.includes('/tracing')) return 'tracing'
  return 'dashboard'
}
