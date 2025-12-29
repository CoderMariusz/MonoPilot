/**
 * CostSummaryEmpty Component (Story 02.9)
 * Empty state when no cost data available
 */

'use client'

import { Calculator } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRecalculateCost } from '@/lib/hooks/use-recalculate-cost'
import { useToast } from '@/hooks/use-toast'

interface CostSummaryEmptyProps {
  bomId: string
}

export function CostSummaryEmpty({ bomId }: CostSummaryEmptyProps) {
  const { mutateAsync: recalculate, isPending } = useRecalculateCost()
  const { toast } = useToast()

  const handleCalculate = async () => {
    try {
      await recalculate(bomId)
      toast({
        title: 'Success',
        description: 'Cost calculation completed',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to calculate costs',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Costing Data Available</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            This product doesn&apos;t have cost data configured yet.
            To calculate recipe costing:
          </p>

          <ol className="text-sm text-muted-foreground text-left mb-6 space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-medium text-foreground">1.</span>
              Assign routing to BOM
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-foreground">2.</span>
              Add ingredient costs
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-foreground">3.</span>
              Click &quot;Calculate Costing&quot; below
            </li>
          </ol>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleCalculate} disabled={isPending}>
              {isPending ? 'Calculating...' : 'Calculate Costing'}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/technical/products">
                Configure Ingredient Costs
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
