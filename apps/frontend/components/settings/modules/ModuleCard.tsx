/**
 * Module Card Component
 * Story: 1.11 Module Activation
 * Story: TD-104 - Module Grouping and Dependencies
 *
 * Displays a single module with:
 * - Enable/disable toggle
 * - Dependency indicators
 * - Pricing labels
 * - Coming soon badge
 *
 * States:
 * - Enabled: Primary border, green checkmark
 * - Disabled: Muted border, gray icon
 * - Coming Soon: Yellow badge, toggle disabled
 * - Premium: Lock icon with upgrade link
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Module } from '@/lib/config/modules'

interface ModuleCardProps {
  /** Module data */
  module: Module
  /** Whether the module is currently enabled */
  enabled: boolean
  /** Whether the toggle is disabled (e.g., during submission) */
  disabled?: boolean
  /** Callback when toggle is changed */
  onToggle: (module: Module, newState: boolean) => void
  /** Whether to show pricing badge */
  showPricing?: boolean
  /** Whether to show dependencies */
  showDependencies?: boolean
}

/**
 * Get badge color based on pricing
 */
function getPricingVariant(pricing: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (pricing === 'Free') return 'default'
  if (pricing === 'TBD') return 'outline'
  return 'secondary'
}

/**
 * ModuleCard Component
 */
export function ModuleCard({
  module,
  enabled,
  disabled = false,
  onToggle,
  showPricing = true,
  showDependencies = true,
}: ModuleCardProps) {
  const isComingSoon = module.status === 'coming_soon'
  const isPremium = module.pricing !== 'Free' && module.pricing !== 'TBD'
  const hasDependencies = module.dependencies && module.dependencies.length > 0
  const hasRequiredFor = module.required_for && module.required_for.length > 0

  return (
    <Card
      className={cn(
        'transition-colors',
        enabled && !isComingSoon ? 'border-primary' : 'border-muted'
      )}
      data-testid={`module-card-${module.code}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
              <span className="truncate">{module.name}</span>
              {enabled && !isComingSoon ? (
                <CheckCircle2
                  className="h-4 w-4 text-green-600 shrink-0"
                  aria-label="Enabled"
                />
              ) : isComingSoon ? (
                <AlertTriangle
                  className="h-4 w-4 text-yellow-500 shrink-0"
                  aria-label="Coming soon"
                />
              ) : (
                <AlertCircle
                  className="h-4 w-4 text-muted-foreground shrink-0"
                  aria-label="Disabled"
                />
              )}
            </CardTitle>
            <CardDescription className="text-xs line-clamp-2">
              {module.description}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isPremium && !enabled && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Premium module - requires subscription</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Switch
              checked={enabled}
              onCheckedChange={(newState) => onToggle(module, newState)}
              disabled={disabled || isComingSoon}
              aria-label={`Toggle ${module.name} module`}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Badges row */}
        <div className="flex items-center flex-wrap gap-2">
          {module.epic && (
            <Badge variant="outline" className="text-xs">
              Epic {module.epic}
            </Badge>
          )}

          {module.defaultEnabled && (
            <Badge variant="secondary" className="text-xs">
              Recommended
            </Badge>
          )}

          {isComingSoon && (
            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
              Coming Soon
            </Badge>
          )}

          {enabled && !isComingSoon && (
            <Badge variant="default" className="bg-green-600 text-xs">
              Enabled
            </Badge>
          )}
        </div>

        {/* Dependencies section (TD-104) */}
        {showDependencies && (hasDependencies || hasRequiredFor) && (
          <div className="space-y-2 text-xs border-t pt-3">
            {hasDependencies && (
              <div className="flex items-start gap-2">
                <Info className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-muted-foreground">Requires: </span>
                  <span className="text-foreground">
                    {module.dependencies!.join(', ')}
                  </span>
                </div>
              </div>
            )}

            {hasRequiredFor && (
              <div className="flex items-start gap-2">
                <Info className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium text-muted-foreground">Required for: </span>
                  <span className="text-foreground">
                    {module.required_for!.join(', ')}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pricing section (TD-104) */}
        {showPricing && (
          <div className="flex items-center justify-between pt-1">
            <Badge variant={getPricingVariant(module.pricing)} className="text-xs">
              {module.pricing}
            </Badge>

            {isPremium && !enabled && (
              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                UPGRADE
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
