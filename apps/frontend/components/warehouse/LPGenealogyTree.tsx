/**
 * LP Genealogy Tree Component
 * Story 5.7: LP Genealogy
 * AC-5.7.1: Display parent/child LP relationships
 * AC-5.7.2: Show relationship types (split, merge, production, consumption)
 * AC-5.7.3: Clickable LP numbers for navigation
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LPStatusBadge } from '@/components/warehouse/LPStatusBadge'
import { useToast } from '@/hooks/use-toast'
import {
  GitBranch,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Package,
  Calendar,
} from 'lucide-react'
import { format } from 'date-fns'

interface GenealogyRecord {
  id: string
  lp_number: string
  product_id: string
  current_qty: number
  batch_number?: string
  expiry_date?: string
  status: string
  quantity_used: number
  relationship_type: string
}

interface GenealogyTree {
  lp: {
    id: string
    lp_number: string
    product_id: string
    current_qty: number
    batch_number?: string
    expiry_date?: string
    status: string
  }
  parents: GenealogyRecord[]
  children: GenealogyRecord[]
}

interface LPGenealogyTreeProps {
  lpId: string
  className?: string
}

const relationshipTypeLabels: Record<string, string> = {
  split: 'Split from',
  merge: 'Merged into',
  production: 'Produced from',
  consumption: 'Consumed by',
  derived: 'Derived from',
}

export function LPGenealogyTree({ lpId, className = '' }: LPGenealogyTreeProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [genealogy, setGenealogy] = useState<GenealogyTree | null>(null)

  useEffect(() => {
    fetchGenealogy()
  }, [lpId])

  const fetchGenealogy = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/warehouse/license-plates/${lpId}/genealogy`)

      if (!response.ok) {
        throw new Error('Failed to fetch genealogy')
      }

      const result = await response.json()
      setGenealogy(result.data || null)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load genealogy tree',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLPClick = (id: string) => {
    router.push(`/warehouse/inventory/${id}`)
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!genealogy) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-6 text-muted-foreground">
          No genealogy data available
        </CardContent>
      </Card>
    )
  }

  const hasParents = genealogy.parents.length > 0
  const hasChildren = genealogy.children.length > 0

  if (!hasParents && !hasChildren) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Genealogy Tree
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6 text-muted-foreground">
          No related license plates found
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          Genealogy Tree
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Parents Section */}
        {hasParents && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Source License Plates ({genealogy.parents.length})
            </div>
            <div className="space-y-2 pl-6 border-l-2 border-muted">
              {genealogy.parents.map((parent) => (
                <div
                  key={parent.id}
                  className="group hover:bg-muted/50 rounded-lg p-3 transition-colors cursor-pointer"
                  onClick={() => handleLPClick(parent.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-mono font-medium group-hover:text-primary">
                          {parent.lp_number}
                        </span>
                        <LPStatusBadge status={parent.status as any} />
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1 ml-6">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {relationshipTypeLabels[parent.relationship_type] || parent.relationship_type}
                          </span>
                          <span>•</span>
                          <span>{parent.quantity_used} used</span>
                        </div>

                        {parent.batch_number && (
                          <div>Batch: {parent.batch_number}</div>
                        )}

                        {parent.expiry_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Expires: {format(new Date(parent.expiry_date), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-medium">
                        {parent.current_qty}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        current qty
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current LP */}
        <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-5 w-5 text-primary" />
            <span className="font-mono font-bold text-lg">{genealogy.lp.lp_number}</span>
            <LPStatusBadge status={genealogy.lp.status as any} />
          </div>
          <div className="text-sm text-muted-foreground ml-7">
            Current License Plate
          </div>
          {genealogy.lp.batch_number && (
            <div className="text-xs text-muted-foreground ml-7 mt-1">
              Batch: {genealogy.lp.batch_number}
            </div>
          )}
        </div>

        {/* Children Section */}
        {hasChildren && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ArrowRight className="h-4 w-4" />
              Derived License Plates ({genealogy.children.length})
            </div>
            <div className="space-y-2 pl-6 border-l-2 border-muted">
              {genealogy.children.map((child) => (
                <div
                  key={child.id}
                  className="group hover:bg-muted/50 rounded-lg p-3 transition-colors cursor-pointer"
                  onClick={() => handleLPClick(child.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-mono font-medium group-hover:text-primary">
                          {child.lp_number}
                        </span>
                        <LPStatusBadge status={child.status as any} />
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1 ml-6">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {relationshipTypeLabels[child.relationship_type] || child.relationship_type}
                          </span>
                          <span>•</span>
                          <span>{child.quantity_used} used</span>
                        </div>

                        {child.batch_number && (
                          <div>Batch: {child.batch_number}</div>
                        )}

                        {child.expiry_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Expires: {format(new Date(child.expiry_date), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-medium">
                        {child.current_qty}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        current qty
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {hasParents && `${genealogy.parents.length} source${genealogy.parents.length !== 1 ? 's' : ''}`}
              {hasParents && hasChildren && ' • '}
              {hasChildren && `${genealogy.children.length} derived`}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchGenealogy}
              className="h-6 px-2"
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
