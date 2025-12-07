/**
 * Scanner Terminal Page
 * Story 5.26: Scanner Operations Menu
 * Main entry point for scanner/terminal operations with lookup
 */

'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Package,
  ArrowRightLeft,
  ClipboardCheck,
  ScanBarcode,
  Truck,
  Factory,
  Search,
  PackageOpen,
} from 'lucide-react'
import { ScannerInput } from '@/components/scanner/ScannerInput'
import { ScannerFeedback } from '@/components/scanner/ScannerFeedback'
import { useToast } from '@/hooks/use-toast'

const scannerModules = [
  {
    title: 'Receive',
    description: 'Receive purchase orders and ASNs',
    href: '/scanner/receive',
    icon: PackageOpen,
    color: 'bg-blue-500',
  },
  {
    title: 'Move',
    description: 'Move license plates between locations',
    href: '/scanner/move',
    icon: ArrowRightLeft,
    color: 'bg-purple-500',
  },
  {
    title: 'Pick',
    description: 'Pick items for orders',
    href: '/scanner/pick',
    icon: Package,
    color: 'bg-green-500',
  },
  {
    title: 'Putaway',
    description: 'Put items away to storage',
    href: '/scanner/putaway',
    icon: Package,
    color: 'bg-indigo-500',
  },
  {
    title: 'Count',
    description: 'Perform inventory counts',
    href: '/scanner/count',
    icon: ClipboardCheck,
    color: 'bg-orange-500',
  },
  {
    title: 'Lookup',
    description: 'Look up any barcode',
    href: '/scanner/lookup',
    icon: Search,
    color: 'bg-cyan-500',
  },
  {
    title: 'Output Registration',
    description: 'Register production output',
    href: '/scanner/output',
    icon: Factory,
    color: 'bg-emerald-500',
  },
  {
    title: 'Reserve Materials',
    description: 'Reserve materials for work orders',
    href: '/scanner/reserve',
    icon: Truck,
    color: 'bg-red-500',
  },
]

export default function ScannerPage() {
  const router = useRouter()
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  const [feedback, setFeedback] = useState<{
    show: boolean
    type: 'success' | 'error' | 'warning'
    message: string
  }>({ show: false, type: 'success', message: '' })

  // Quick lookup handler (Story 5.26 - AC3)
  const handleQuickLookup = async (barcode: string) => {
    if (!barcode.trim()) return

    try {
      // Try to auto-detect entity type from barcode
      const response = await fetch(`/api/scanner/lookup?barcode=${encodeURIComponent(barcode)}`)

      if (!response.ok) {
        setFeedback({ show: true, type: 'error', message: 'Not Found' })
        return
      }

      const { data } = await response.json()

      // Navigate to appropriate page based on entity type
      if (data.type === 'license_plate') {
        router.push(`/scanner/lookup?lp=${data.id}`)
      } else if (data.type === 'location') {
        router.push(`/scanner/lookup?location=${data.id}`)
      } else if (data.type === 'product') {
        router.push(`/scanner/lookup?product=${data.id}`)
      } else if (data.type === 'work_order') {
        router.push(`/scanner/output?wo=${data.id}`)
      } else {
        router.push(`/scanner/lookup?barcode=${barcode}`)
      }

      setFeedback({ show: true, type: 'success', message: 'Found!' })
    } catch (error) {
      console.error('Quick lookup error:', error)
      setFeedback({ show: true, type: 'error', message: 'Lookup Failed' })
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ScanBarcode className="h-8 w-8 text-cyan-600" />
        <div>
          <h1 className="text-2xl font-bold">Scanner Terminal</h1>
          <p className="text-muted-foreground text-sm">
            Select an operation or scan any barcode
          </p>
        </div>
      </div>

      {/* Quick Scan Section - Top priority */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ScanBarcode className="h-5 w-5" />
            Quick Lookup
          </CardTitle>
          <CardDescription>
            Scan any barcode to automatically look it up
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScannerInput
            ref={inputRef}
            onSubmit={handleQuickLookup}
            placeholder="Scan any barcode..."
            variant="large"
          />
        </CardContent>
      </Card>

      {/* Module Cards - Touch-optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {scannerModules.map((module) => {
          const Icon = module.icon
          return (
            <Link key={module.href} href={module.href}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer active:scale-95 transition-transform">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${module.color}`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-base sm:text-lg">{module.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">{module.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Feedback overlay */}
      <ScannerFeedback
        show={feedback.show}
        type={feedback.type}
        message={feedback.message}
        onHide={() => setFeedback({ ...feedback, show: false })}
      />
    </div>
  )
}
