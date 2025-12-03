/**
 * Scanner Terminal Page
 * Main entry point for scanner/terminal operations
 */

'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Package,
  ArrowRightLeft,
  ClipboardCheck,
  ScanBarcode,
  Truck,
  Factory,
} from 'lucide-react'

const scannerModules = [
  {
    title: 'Output Registration',
    description: 'Register production output and print labels',
    href: '/scanner/output',
    icon: Package,
    color: 'bg-emerald-500',
  },
  {
    title: 'Reserve LP',
    description: 'Reserve License Plates for Transfer Orders',
    href: '/scanner/reserve',
    icon: Package,
    color: 'bg-blue-500',
  },
  {
    title: 'Ship TO',
    description: 'Ship Transfer Order items',
    href: '/scanner/ship',
    icon: Truck,
    color: 'bg-green-500',
  },
  {
    title: 'Receive TO',
    description: 'Receive Transfer Order items',
    href: '/scanner/receive',
    icon: ArrowRightLeft,
    color: 'bg-orange-500',
  },
  {
    title: 'Production',
    description: 'Scan materials for Work Orders',
    href: '/scanner/production',
    icon: Factory,
    color: 'bg-purple-500',
  },
  {
    title: 'Inventory Count',
    description: 'Perform inventory counts',
    href: '/scanner/count',
    icon: ClipboardCheck,
    color: 'bg-red-500',
  },
]

export default function ScannerPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ScanBarcode className="h-8 w-8 text-cyan-600" />
        <div>
          <h1 className="text-2xl font-bold">Scanner Terminal</h1>
          <p className="text-muted-foreground text-sm">
            Select an operation to begin scanning
          </p>
        </div>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scannerModules.map((module) => {
          const Icon = module.icon
          return (
            <Link key={module.href} href={module.href}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${module.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{module.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Scan Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanBarcode className="h-5 w-5" />
            Quick Scan
          </CardTitle>
          <CardDescription>
            Scan a barcode to automatically detect the operation type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Scan barcode or enter LP number..."
              className="flex-1 px-4 py-3 border rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              autoFocus
            />
            <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700">
              <ScanBarcode className="h-5 w-5 mr-2" />
              Scan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
