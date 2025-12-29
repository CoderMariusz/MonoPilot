/**
 * CostSummaryError Component (Story 02.9)
 * Error state with specific error messages and fix instructions
 */

'use client'

import { AlertCircle, RefreshCw, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface CostSummaryErrorProps {
  error: Error
  bomId: string
  onRetry?: () => void
}

/**
 * Parse error message to determine error type and details
 */
function parseError(error: Error): {
  type: 'routing' | 'costs' | 'generic'
  title: string
  description: string
  missingItems?: string[]
} {
  const message = error.message.toLowerCase()

  // Check for routing-related errors
  if (message.includes('routing') || message.includes('no_routing')) {
    return {
      type: 'routing',
      title: 'Missing Routing',
      description: 'Assign routing to BOM to calculate labor costs',
    }
  }

  // Check for missing cost errors
  if (message.includes('missing') && message.includes('cost')) {
    // Try to extract missing items from error message
    const match = error.message.match(/Missing cost data for:\s*(.+)/i)
    const missingItems = match ? match[1].split(',').map((s) => s.trim()) : undefined

    return {
      type: 'costs',
      title: 'Missing Ingredient Costs',
      description: 'Some ingredients do not have cost data configured',
      missingItems,
    }
  }

  // Generic error
  return {
    type: 'generic',
    title: 'Costing Calculation Failed',
    description: error.message || 'An error occurred while calculating costs',
  }
}

export function CostSummaryError({ error, bomId, onRetry }: CostSummaryErrorProps) {
  const { type, title, description, missingItems } = parseError(error)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{description}</AlertDescription>
        </Alert>

        {/* Missing items list */}
        {type === 'costs' && missingItems && missingItems.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-destructive mb-2">
              Missing cost data for:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              {missingItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-4">
          Please fix these issues and try again.
        </p>

        <div className="flex flex-wrap gap-3">
          {/* Retry button */}
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}

          {/* Context-specific action buttons */}
          {type === 'costs' && (
            <Button variant="outline" asChild>
              <Link href="/technical/products">
                Configure Ingredient Costs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}

          {type === 'routing' && (
            <Button variant="outline" asChild>
              <Link href={`/technical/boms/${bomId}/edit`}>
                Assign Routing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
