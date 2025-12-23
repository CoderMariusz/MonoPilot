/**
 * TaxCodeCountryBadge Component
 * Story: 01.13 - Tax Codes CRUD
 *
 * Displays country code with tooltip showing full country name
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getCountryName } from '@/lib/types/tax-code'

interface TaxCodeCountryBadgeProps {
  countryCode: string
}

export function TaxCodeCountryBadge({ countryCode }: TaxCodeCountryBadgeProps) {
  const countryName = getCountryName(countryCode)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="font-mono cursor-help">
            {countryCode}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{countryName}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
