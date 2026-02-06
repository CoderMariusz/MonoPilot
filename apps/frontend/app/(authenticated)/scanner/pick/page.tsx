/**
 * Scanner Pick Page
 * Route: /scanner/pick
 * Purpose: Mobile-friendly page for order picking via barcode scanning
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScanLine, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Pick | Scanner | MonoPilot',
  description: 'Scan and pick items for order fulfillment',
}

export default function ScannerPickPage() {
  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto">
      {/* Mobile-optimized Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/scanner">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Pick Items</h1>
          <p className="text-sm text-muted-foreground">
            Scan items to fulfill orders
          </p>
        </div>
      </div>

      {/* Placeholder Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ScanLine className="h-5 w-5" />
            Scanner Pick Mode
          </CardTitle>
          <CardDescription>
            This feature is under development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ScanLine className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">Coming Soon</h3>
            <p className="text-sm text-muted-foreground mt-2">
              The pick scanner will guide you through order fulfillment with 
              optimized pick paths and barcode verification.
            </p>
            <Button variant="outline" className="mt-6" asChild>
              <Link href="/scanner">
                Back to Scanner
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
