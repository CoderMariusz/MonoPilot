'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Settings, Menu, X } from 'lucide-react'

export type PlanningPage = 'dashboard' | 'po' | 'to' | 'wo' | 'suppliers'

interface PlanningHeaderProps {
  currentPage?: PlanningPage
}

const navItems = [
  { key: 'dashboard' as const, label: 'Planning', href: '/planning' },
  { key: 'po' as const, label: 'PO', href: '/planning/purchase-orders' },
  { key: 'to' as const, label: 'TO', href: '/planning/transfer-orders' },
  { key: 'wo' as const, label: 'WO', href: '/planning/work-orders' },
  { key: 'suppliers' as const, label: 'Suppliers', href: '/planning/suppliers' },
]

export function PlanningHeader({ currentPage }: PlanningHeaderProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Auto-detect current page from pathname if not provided
  const activePage = currentPage || detectCurrentPage(pathname)

  return (
    <header className="h-[60px] border-b bg-background">
      <div className="h-full flex items-center justify-between px-4 md:px-6">
        {/* Logo / Module Name */}
        <div className="flex items-center gap-2">
          <span className="text-lg md:text-xl font-semibold">MonoPilot</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.key} href={item.href}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'text-sm font-medium rounded-none border-b-2 border-transparent hover:border-primary/50',
                  activePage === item.key && 'border-primary bg-primary/5'
                )}
              >
                {item.label}
              </Button>
            </Link>
          ))}

          {/* Settings Button */}
          <Link href="/settings/planning">
            <Button variant="outline" size="sm" className="ml-2">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <Link href="/settings/planning">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
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
    </header>
  )
}

function detectCurrentPage(pathname: string): PlanningPage {
  if (pathname.includes('/purchase-orders')) return 'po'
  if (pathname.includes('/transfer-orders')) return 'to'
  if (pathname.includes('/work-orders')) return 'wo'
  if (pathname.includes('/suppliers')) return 'suppliers'
  return 'dashboard'
}
