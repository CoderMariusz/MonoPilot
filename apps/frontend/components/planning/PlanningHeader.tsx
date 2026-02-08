'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Settings, Menu, X } from 'lucide-react'
import { UserMenu } from '@/components/auth/UserMenu'
import { createClient } from '@/lib/supabase/client'

export type PlanningPage = 'dashboard' | 'po' | 'to' | 'wo' | 'suppliers'

interface PlanningHeaderProps {
  currentPage?: PlanningPage
}

interface UserData {
  email: string
  name?: string
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
  const [user, setUser] = useState<UserData | null>(null)
  const [mounted, setMounted] = useState(false)

  // Fetch current user on mount
  useEffect(() => {
    setMounted(true)
    const fetchUser = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (authUser) {
          setUser({
            email: authUser.email || '',
            name: authUser.user_metadata?.first_name
              ? `${authUser.user_metadata.first_name} ${authUser.user_metadata.last_name || ''}`.trim()
              : undefined,
          })
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
      }
    }

    fetchUser()
  }, [])

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

        {/* Right side: Settings, Mobile Menu, and User Menu */}
        <div className="flex items-center gap-2">
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
            className="md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          {/* User Menu with Logout - Only render after mount to prevent hydration mismatch */}
          {mounted && user && <UserMenu user={user} />}
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
