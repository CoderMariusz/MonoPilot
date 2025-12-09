/**
 * Scanner Terminal Page - Hierarchical Menu
 * Main entry point for scanner/terminal operations with categorized menu
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
  ScanBarcode,
  Truck,
  Factory,
  Search,
  PackageOpen,
  ChevronRight,
  ChevronDown,
  Warehouse,
  ClipboardList,
  Package2,
} from 'lucide-react'
import { ScannerInput } from '@/components/scanner/ScannerInput'
import { ScannerFeedback } from '@/components/scanner/ScannerFeedback'
import { LineSelector } from '@/components/scanner/LineSelector'
import { useToast } from '@/hooks/use-toast'

type CategoryType = 'production' | 'warehouse' | null

const productionOperations = [
  {
    title: 'WO Entry',
    description: 'Scan components into work order',
    href: '/scanner/production/entry',
    icon: ClipboardList,
  },
  {
    title: 'WO Output',
    description: 'Register production output',
    href: '/scanner/production/output',
    icon: Package2,
  },
]

const warehouseOperations = [
  {
    title: 'Receive',
    description: 'Receive from PO/TO',
    href: '/scanner/warehouse/receive',
    icon: PackageOpen,
  },
  {
    title: 'Move LP',
    description: 'Move license plates',
    href: '/scanner/warehouse/move',
    icon: ArrowRightLeft,
  },
  {
    title: 'Pick',
    description: 'Pick for transfer order',
    href: '/scanner/warehouse/pick',
    icon: Package,
  },
  {
    title: 'Putaway',
    description: 'Put away to storage',
    href: '/scanner/warehouse/putaway',
    icon: Truck,
  },
]

export default function ScannerPage() {
  const router = useRouter()
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  const [expandedCategory, setExpandedCategory] = useState<CategoryType>(null)
  const [feedback, setFeedback] = useState<{
    show: boolean
    type: 'success' | 'error' | 'warning'
    message: string
  }>({ show: false, type: 'success', message: '' })

  // Quick lookup handler
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
        router.push(`/scanner/production/output?wo=${data.id}`)
      } else {
        router.push(`/scanner/lookup?barcode=${barcode}`)
      }

      setFeedback({ show: true, type: 'success', message: 'Found!' })
    } catch (error) {
      console.error('Quick lookup error:', error)
      setFeedback({ show: true, type: 'error', message: 'Lookup Failed' })
    }
  }

  const toggleCategory = (category: CategoryType) => {
    setExpandedCategory(expandedCategory === category ? null : category)
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ScanBarcode className="h-8 w-8 text-cyan-600" />
        <div>
          <h1 className="text-2xl font-bold">Scanner Terminal</h1>
          <p className="text-muted-foreground text-sm">
            Select your line and operation
          </p>
        </div>
      </div>

      {/* Line Selector */}
      <LineSelector />

      {/* PRODUCTION Category */}
      <Card className="overflow-hidden">
        <CardHeader
          className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => toggleCategory('production')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500">
                <Factory className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Production</CardTitle>
                <CardDescription className="text-sm">
                  Work order operations
                </CardDescription>
              </div>
            </div>
            {expandedCategory === 'production' ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>

        {expandedCategory === 'production' && (
          <CardContent className="pt-0 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {productionOperations.map((operation) => {
                const Icon = operation.icon
                return (
                  <Link key={operation.href} href={operation.href}>
                    <Card className="h-full hover:shadow-md transition-shadow cursor-pointer active:scale-95 transition-transform border-2 hover:border-blue-300">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{operation.title}</CardTitle>
                            <CardDescription className="text-xs">
                              {operation.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* WAREHOUSE Category */}
      <Card className="overflow-hidden">
        <CardHeader
          className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => toggleCategory('warehouse')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-orange-500">
                <Warehouse className="h-7 w-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Warehouse</CardTitle>
                <CardDescription className="text-sm">
                  Inventory operations
                </CardDescription>
              </div>
            </div>
            {expandedCategory === 'warehouse' ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>

        {expandedCategory === 'warehouse' && (
          <CardContent className="pt-0 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {warehouseOperations.map((operation) => {
                const Icon = operation.icon
                return (
                  <Link key={operation.href} href={operation.href}>
                    <Card className="h-full hover:shadow-md transition-shadow cursor-pointer active:scale-95 transition-transform border-2 hover:border-purple-300">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Icon className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{operation.title}</CardTitle>
                            <CardDescription className="text-xs">
                              {operation.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* LOOKUP - Quick Access */}
      <Card className="border-2 border-cyan-200 bg-cyan-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 bg-cyan-500 rounded-lg">
              <Search className="h-5 w-5 text-white" />
            </div>
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
          <div className="mt-3">
            <Link href="/scanner/lookup">
              <Button variant="outline" className="w-full" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Advanced Lookup
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

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
