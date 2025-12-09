'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Loader2,
  MoreHorizontal,
  Eye,
  CheckCircle,
  ClipboardList,
  RefreshCw,
} from 'lucide-react'
import {
  StartCountDialog,
  CountProgress,
  ScannerCountMode,
  DesktopCountMode,
  VarianceReport,
  ReconciliationModal,
} from '@/components/warehouse/inventory-count'

interface InventoryCount {
  id: string
  count_number: string
  location_id: string
  status: 'pending' | 'in_progress' | 'completed' | 'adjusted'
  reason?: string
  expected_lps: number
  scanned_lps: number
  found_lps: number
  missing_lps: number
  extra_lps: number
  variance_pct?: number
  initiated_at: string
  completed_at?: string
  location?: {
    id: string
    code: string
    name: string
  }
  initiated_by?: {
    email: string
    first_name?: string
    last_name?: string
  }
  items?: CountItem[]
}

interface CountItem {
  id: string
  lp_id: string
  expected: boolean
  scanned_at?: string
  variance?: 'found' | 'missing' | 'extra'
  lp?: {
    id: string
    lp_number: string
    current_qty: number
    status: string
    product?: {
      id: string
      code: string
      name: string
    }
  }
}

export default function InventoryCountPage() {
  const router = useRouter()
  const [counts, setCounts] = useState<InventoryCount[]>([])
  const [activeCount, setActiveCount] = useState<InventoryCount | null>(null)
  const [loading, setLoading] = useState(true)
  const [showStartDialog, setShowStartDialog] = useState(false)
  const [showReconcileModal, setShowReconcileModal] = useState(false)
  const [countMode, setCountMode] = useState<'scanner' | 'desktop'>('scanner')

  // Load counts
  const loadCounts = useCallback(async () => {
    try {
      const response = await fetch('/api/warehouse/inventory-counts')
      const result = await response.json()
      if (response.ok) {
        setCounts(result.data || [])
      }
    } catch (err) {
      console.error('Failed to load counts:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load specific count with items
  const loadCount = useCallback(async (countId: string) => {
    try {
      const response = await fetch(`/api/warehouse/inventory-counts/${countId}`)
      const result = await response.json()
      if (response.ok) {
        setActiveCount(result.data)
      }
    } catch (err) {
      console.error('Failed to load count:', err)
    }
  }, [])

  useEffect(() => {
    loadCounts()
  }, [loadCounts])

  // Handle new count created
  function handleCountCreated(count: InventoryCount) {
    setCounts((prev) => [count, ...prev])
    setActiveCount(count)
    loadCount(count.id)
  }

  // Handle scan
  async function handleScan(lpNumber: string) {
    if (!activeCount) throw new Error('No active count')

    const response = await fetch(`/api/warehouse/inventory-counts/${activeCount.id}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lp_number: lpNumber }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error)
    }

    // Refresh count
    await loadCount(activeCount.id)

    return result.data
  }

  // Handle check item (desktop mode)
  async function handleCheckItem(lpId: string) {
    if (!activeCount) return

    await fetch(`/api/warehouse/inventory-counts/${activeCount.id}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lp_id: lpId }),
    })

    await loadCount(activeCount.id)
  }

  // Handle complete count
  async function handleCompleteCount() {
    if (!activeCount) return

    const response = await fetch(`/api/warehouse/inventory-counts/${activeCount.id}/complete`, {
      method: 'POST',
    })

    if (response.ok) {
      await loadCount(activeCount.id)
      await loadCounts()
    }
  }

  // Handle reconcile
  async function handleReconcile(action: 'accept_loss' | 'investigate' | 'recount', notes?: string) {
    if (!activeCount) return

    const response = await fetch(`/api/warehouse/inventory-counts/${activeCount.id}/reconcile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, notes }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error)
    }

    if (action === 'recount' && result.data.new_count_id) {
      await loadCount(result.data.new_count_id)
    } else {
      await loadCount(activeCount.id)
    }

    await loadCounts()
  }

  // Status badge
  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>
      case 'completed':
        return <Badge>Completed</Badge>
      case 'adjusted':
        return <Badge variant="default">Adjusted</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const isCountActive = activeCount?.status === 'pending' || activeCount?.status === 'in_progress'
  const isCountCompleted = activeCount?.status === 'completed'

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Count</h1>
          <p className="text-muted-foreground">Physical inventory verification</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadCounts}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowStartDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Start Count
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Counts List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Counts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : counts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No counts yet. Start a new count.
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {counts.map((count) => (
                  <div
                    key={count.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      activeCount?.id === count.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => loadCount(count.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-medium">{count.count_number}</span>
                      {getStatusBadge(count.status)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {count.location?.code} - {count.location?.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(count.initiated_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Count */}
        <div className="lg:col-span-2 space-y-6">
          {!activeCount ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  Select a count or start a new one
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Count Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-mono">{activeCount.count_number}</CardTitle>
                    <div className="flex gap-2">
                      {getStatusBadge(activeCount.status)}
                      {activeCount.reason && (
                        <Badge variant="outline">{activeCount.reason}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Location:</span>{' '}
                      {activeCount.location?.code} - {activeCount.location?.name}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Initiated:</span>{' '}
                      {new Date(activeCount.initiated_at).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress */}
              <CountProgress
                expectedLps={activeCount.expected_lps}
                scannedLps={activeCount.scanned_lps}
                foundLps={activeCount.found_lps}
                missingLps={activeCount.missing_lps}
                extraLps={activeCount.extra_lps}
                status={activeCount.status}
              />

              {/* Count Mode (for active counts) */}
              {isCountActive && (
                <>
                  <Tabs value={countMode} onValueChange={(v) => setCountMode(v as any)}>
                    <TabsList>
                      <TabsTrigger value="scanner">Scanner Mode</TabsTrigger>
                      <TabsTrigger value="desktop">Desktop Mode</TabsTrigger>
                    </TabsList>

                    <TabsContent value="scanner">
                      <ScannerCountMode
                        countId={activeCount.id}
                        onScan={handleScan}
                        disabled={!isCountActive}
                      />
                    </TabsContent>

                    <TabsContent value="desktop">
                      <DesktopCountMode
                        items={activeCount.items || []}
                        onCheckItem={handleCheckItem}
                        disabled={!isCountActive}
                      />
                    </TabsContent>
                  </Tabs>

                  {/* Complete Button */}
                  <div className="flex justify-end">
                    <Button onClick={handleCompleteCount}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Complete Count
                    </Button>
                  </div>
                </>
              )}

              {/* Variance Report (for completed counts) */}
              {(activeCount.status === 'completed' || activeCount.status === 'adjusted') && (
                <>
                  <VarianceReport
                    countNumber={activeCount.count_number}
                    location={activeCount.location || { code: '', name: '' }}
                    expectedLps={activeCount.expected_lps}
                    foundLps={activeCount.found_lps}
                    missingLps={activeCount.missing_lps}
                    extraLps={activeCount.extra_lps}
                    variancePct={activeCount.variance_pct || 0}
                    missingItems={activeCount.items?.filter((i) => i.variance === 'missing') || []}
                    extraItems={activeCount.items?.filter((i) => i.variance === 'extra') || []}
                    completedAt={activeCount.completed_at || activeCount.initiated_at}
                  />

                  {/* Reconciliation Button */}
                  {isCountCompleted && (activeCount.missing_lps > 0 || activeCount.extra_lps > 0) && (
                    <div className="flex justify-end">
                      <Button onClick={() => setShowReconcileModal(true)}>
                        Reconcile Variance
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <StartCountDialog
        open={showStartDialog}
        onOpenChange={setShowStartDialog}
        onSuccess={handleCountCreated}
      />

      {activeCount && (
        <ReconciliationModal
          open={showReconcileModal}
          onOpenChange={setShowReconcileModal}
          countId={activeCount.id}
          missingCount={activeCount.missing_lps}
          onReconcile={handleReconcile}
        />
      )}
    </div>
  )
}
