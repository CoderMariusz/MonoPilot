'use client'

/**
 * WizardStep6Complete Component
 * Story: 01.14 - Wizard Steps Complete
 *
 * Step 6: Wizard completion celebration
 * - Confetti animation on mount
 * - Summary of all created items
 * - Duration display
 * - Speed Champion badge if < 15 minutes
 * - Next steps contextual cards
 * - "Go to Dashboard" button
 */

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Trophy,
  Users,
  Package,
  Calendar,
  Settings,
  ArrowRight,
  Sparkles,
  Clock,
  Warehouse,
  MapPin,
  ClipboardList,
} from 'lucide-react'
import { ConfettiAnimation } from './ConfettiAnimation'
import { SpeedBadge } from './SpeedBadge'
import type { WizardSummary } from '@/lib/services/wizard-service'

interface WizardStep6CompleteProps {
  onComplete: () => void
  summary: WizardSummary
  durationSeconds: number
  badge?: 'speed_champion'
}

/**
 * Format duration in human-readable format
 */
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes === 0) {
    return `${remainingSeconds} seconds`
  }
  return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`
}

/**
 * Next step card configuration
 */
interface NextStep {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  buttonText: string
  primary?: boolean
}

export function WizardStep6Complete({
  onComplete,
  summary,
  durationSeconds,
  badge,
}: WizardStep6CompleteProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(true)

  // Stop confetti after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  // Determine contextual next steps
  const nextSteps: NextStep[] = []

  // Always suggest inviting team
  nextSteps.push({
    title: 'Add Team Members',
    description: 'Invite your team to MonoPilot',
    icon: Users,
    href: '/settings/users',
    buttonText: 'Invite Users',
  })

  // Product-related next step
  if (!summary.product) {
    nextSteps.unshift({
      title: 'Create Your First Product',
      description: 'Build your product catalog',
      icon: Package,
      href: '/technical/products',
      buttonText: 'Go to Products',
      primary: true,
    })
  } else {
    nextSteps.push({
      title: 'Create More Products',
      description: 'Build your product catalog',
      icon: Package,
      href: '/technical/products',
      buttonText: 'Go to Products',
    })
  }

  // Planning next step
  nextSteps.push({
    title: 'Schedule Production',
    description: 'Plan your first production run',
    icon: Calendar,
    href: '/planning',
    buttonText: 'Open Planning',
  })

  // Settings next step (for demo data users)
  if (summary.warehouse?.code === 'DEMO-WH') {
    nextSteps.unshift({
      title: 'Replace Demo Data',
      description: 'Update demo warehouse with your real data',
      icon: Warehouse,
      href: '/settings/warehouses',
      buttonText: 'Edit Warehouse',
      primary: true,
    })
  } else {
    nextSteps.push({
      title: 'Explore Settings',
      description: 'Fine-tune your configuration',
      icon: Settings,
      href: '/settings',
      buttonText: 'Open Settings',
    })
  }

  const handleComplete = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/settings/onboarding/step/6', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete wizard')
      }

      onComplete()
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete wizard')
    } finally {
      setIsLoading(false)
    }
  }, [onComplete, router])

  // Loading state
  if (isLoading && !error) {
    return (
      <div className="space-y-6" role="status" aria-label="Completing wizard">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
        <div className="flex justify-center">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Confetti animation */}
      <ConfettiAnimation active={showConfetti} />

      {/* Celebration header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mx-auto animate-bounce">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">
            Congratulations! <Sparkles className="inline h-6 w-6 text-yellow-500" />
          </h2>
          <p className="text-muted-foreground mt-1">
            MonoPilot is ready for your organization.
          </p>
        </div>

        {/* Speed Champion Badge */}
        {badge === 'speed_champion' && (
          <div className="flex justify-center">
            <SpeedBadge durationSeconds={durationSeconds} />
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Setup Summary</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Completed in {formatDuration(durationSeconds)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Organization */}
          <SummaryItem
            icon={Settings}
            label="Organization"
            value={summary.organization.name}
          />

          {/* Warehouse */}
          <SummaryItem
            icon={Warehouse}
            label="Warehouse"
            value={
              summary.warehouse
                ? `${summary.warehouse.name} (${summary.warehouse.code})`
                : null
            }
            skipped={!summary.warehouse}
          />

          {/* Locations */}
          <SummaryItem
            icon={MapPin}
            label="Locations"
            value={
              summary.locations
                ? `${summary.locations.count} location${summary.locations.count !== 1 ? 's' : ''} (${summary.locations.template})`
                : null
            }
            skipped={!summary.locations}
          />

          {/* Product */}
          <SummaryItem
            icon={Package}
            label="Product"
            value={
              summary.product
                ? `${summary.product.name} (${summary.product.sku})`
                : null
            }
            skipped={!summary.product}
          />

          {/* Work Order */}
          <SummaryItem
            icon={ClipboardList}
            label="Work Order"
            value={
              summary.work_order
                ? `${summary.work_order.code} (${summary.work_order.status})`
                : null
            }
            skipped={!summary.work_order}
            note={!summary.product ? 'Requires product' : undefined}
          />
        </CardContent>
      </Card>

      {/* Next steps */}
      <div className="space-y-3">
        <h3 className="font-medium">Suggested Next Steps</h3>
        <div className="grid grid-cols-2 gap-3">
          {nextSteps.slice(0, 4).map((step) => (
            <NextStepCard key={step.href} step={step} />
          ))}
        </div>
      </div>

      {/* Complete button */}
      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          onClick={handleComplete}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}

/**
 * Summary item component
 */
function SummaryItem({
  icon: Icon,
  label,
  value,
  skipped,
  note,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | null
  skipped?: boolean
  note?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        {skipped ? (
          <p className="text-xs text-muted-foreground">
            {note || '(skipped)'}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{value}</p>
        )}
      </div>
      {!skipped && (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      )}
    </div>
  )
}

/**
 * Next step card component
 */
function NextStepCard({ step }: { step: NextStep }) {
  const router = useRouter()

  return (
    <Card
      className={`cursor-pointer transition-all hover:border-primary/50 ${
        step.primary ? 'border-primary/30 bg-primary/5' : ''
      }`}
      onClick={() => router.push(step.href)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(step.href)
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              step.primary ? 'bg-primary/10' : 'bg-muted'
            }`}
          >
            <step.icon
              className={`h-5 w-5 ${
                step.primary ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{step.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {step.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
