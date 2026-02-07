/**
 * Traceability Search Page
 * Story 02.10b: Traceability Queries UI
 *
 * Full-featured traceability search with:
 * - Search input for LP ID or batch number
 * - Forward/Backward/Recall toggle
 * - Search button
 * - Three result views: List, Tree, Matrix
 * - Recall simulation panel
 *
 * All 4 UI states: loading, error, empty, success
 * Keyboard navigation supported
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TechnicalHeader } from '@/components/technical/TechnicalHeader'
import { TraceResultsList } from '@/components/technical/traceability/TraceResultsList'
import { TraceResultsTree } from '@/components/technical/traceability/TraceResultsTree'
import { TraceResultsMatrix } from '@/components/technical/traceability/TraceResultsMatrix'
import { RecallSimulationPanel } from '@/components/technical/traceability/RecallSimulationPanel'
import { useTraceSearch, useRecallSimulation, type TraceDirection } from '@/lib/hooks/use-trace-search'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  List,
  TreeDeciduous,
  TableIcon,
} from 'lucide-react'

type ViewMode = 'list' | 'tree' | 'matrix'
type TraceMode = 'forward' | 'backward' | 'recall'

export default function TraceabilityPage() {
  const router = useRouter()

  // Form state
  const [lpId, setLpId] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [traceMode, setTraceMode] = useState<TraceMode>('forward')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  // Get direction for trace hooks (recall uses forward internally)
  const direction: TraceDirection = traceMode === 'backward' ? 'backward' : 'forward'

  // Refs for keyboard navigation
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchButtonRef = useRef<HTMLButtonElement>(null)

  // Trace search hook (for forward/backward)
  const {
    mutate: runTrace,
    data: traceResult,
    isPending: isTraceLoading,
    error: traceError,
    reset: resetTrace,
  } = useTraceSearch(direction)

  // Recall simulation hook
  const {
    mutate: runRecall,
    data: recallResult,
    isPending: isRecallLoading,
    error: recallError,
    reset: resetRecall,
  } = useRecallSimulation()

  // Combined loading/error state
  const isLoading = traceMode === 'recall' ? isRecallLoading : isTraceLoading
  const error = traceMode === 'recall' ? recallError : traceError

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  // Handle search submission
  const handleSearch = useCallback(() => {
    if (!lpId && !batchNumber) return

    // Clear previous results
    resetTrace()
    resetRecall()

    if (traceMode === 'recall') {
      runRecall({
        lp_id: lpId || undefined,
        batch_number: batchNumber || undefined,
        max_depth: 20,
        include_shipped: true,
        include_notifications: true,
      })
    } else {
      runTrace({
        lp_id: lpId || undefined,
        batch_number: batchNumber || undefined,
        max_depth: 20,
      })
    }
  }, [lpId, batchNumber, traceMode, runTrace, runRecall, resetTrace, resetRecall])

  // Handle Enter key on inputs
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        handleSearch()
      }
    },
    [handleSearch]
  )

  // Navigate to LP detail page
  const handleLPClick = useCallback(
    (lpId: string) => {
      router.push(`/warehouse/license-plates/${lpId}`)
    },
    [router]
  )

  // Handle mode change
  const handleModeChange = useCallback(
    (newMode: string) => {
      setTraceMode(newMode as TraceMode)
      // Clear results when mode changes
      resetTrace()
      resetRecall()
    },
    [resetTrace, resetRecall]
  )

  // Retry handler
  const handleRetry = useCallback(() => {
    handleSearch()
  }, [handleSearch])

  // Check if search is disabled
  const isSearchDisabled = (!lpId && !batchNumber) || isLoading

  return (
    <div className="min-h-screen bg-background">
      <TechnicalHeader currentPage="traceability" />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Traceability Search</h1>
          <p className="text-muted-foreground mt-1">
            Trace product genealogy forward (where used) or backward (what consumed)
          </p>
        </div>

        {/* Search Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" aria-hidden="true" />
              Search Parameters
            </CardTitle>
            <CardDescription>
              Enter a License Plate ID or Batch Number to trace its genealogy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mode Toggle */}
            <Tabs
              value={traceMode}
              onValueChange={handleModeChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 max-w-xl">
                <TabsTrigger
                  value="forward"
                  className="gap-2"
                  aria-label="Forward trace: find where this lot was used"
                >
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  Forward
                </TabsTrigger>
                <TabsTrigger
                  value="backward"
                  className="gap-2"
                  aria-label="Backward trace: find what went into this lot"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Backward
                </TabsTrigger>
                <TabsTrigger
                  value="recall"
                  className="gap-2"
                  aria-label="Recall simulation: assess full impact"
                >
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  Recall Sim
                </TabsTrigger>
              </TabsList>

              <TabsContent value="forward" className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Find all downstream products that used this material. Traces from raw materials to finished goods.
                </p>
              </TabsContent>
              <TabsContent value="backward" className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Find all upstream sources and ingredients. Traces from finished goods back to raw materials.
                </p>
              </TabsContent>
              <TabsContent value="recall" className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Simulate a full recall: traces both directions, calculates financial impact, and identifies affected customers.
                </p>
              </TabsContent>
            </Tabs>

            {/* Search Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lp-id">License Plate ID</Label>
                <Input
                  id="lp-id"
                  ref={searchInputRef}
                  type="text"
                  placeholder="e.g., LP08528390 or LP-2024-001"
                  value={lpId}
                  onChange={(e) => setLpId(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  aria-describedby="lp-id-help"
                />
                <p id="lp-id-help" className="text-xs text-muted-foreground">
                  Enter the LP number (e.g., LP08528390)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch-number">
                  OR Batch Number
                </Label>
                <Input
                  id="batch-number"
                  type="text"
                  placeholder="e.g., BATCH-2024-11-001"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  aria-describedby="batch-help"
                />
                <p id="batch-help" className="text-xs text-muted-foreground">
                  Alternative: search by batch/lot number
                </p>
              </div>
            </div>

            {/* Search Button */}
            <div className="flex justify-end">
              <Button
                ref={searchButtonRef}
                onClick={handleSearch}
                disabled={isSearchDisabled}
                className="min-w-32"
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2" aria-hidden="true">
                      ...
                    </span>
                    {traceMode === 'recall' ? 'Simulating...' : 'Tracing...'}
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" aria-hidden="true" />
                    {traceMode === 'recall'
                      ? 'Run Recall Simulation'
                      : `Run ${traceMode === 'forward' ? 'Forward' : 'Backward'} Trace`}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section - Recall Mode */}
        {traceMode === 'recall' && (
          <RecallSimulationPanel
            data={recallResult ?? null}
            loading={isRecallLoading}
            error={recallError ?? null}
            onRetry={handleRetry}
            onNodeClick={handleLPClick}
          />
        )}

        {/* Results Section - Forward/Backward Mode */}
        {traceMode !== 'recall' && (
          <>
            {/* View Toggle */}
            {(traceResult || isTraceLoading) && (
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {traceResult
                    ? `Showing ${direction} trace from ${traceResult.root_lp?.lp_number || 'root LP'}`
                    : 'Trace Results'}
                </h2>
                <Tabs
                  value={viewMode}
                  onValueChange={(v) => setViewMode(v as ViewMode)}
                  className="w-auto"
                >
                  <TabsList>
                    <TabsTrigger value="list" className="gap-1.5 px-3" aria-label="List view">
                      <List className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">List</span>
                    </TabsTrigger>
                    <TabsTrigger value="tree" className="gap-1.5 px-3" aria-label="Tree view">
                      <TreeDeciduous className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Tree</span>
                    </TabsTrigger>
                    <TabsTrigger value="matrix" className="gap-1.5 px-3" aria-label="Matrix view">
                      <TableIcon className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Matrix</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <Card>
                <CardHeader>
                  <CardTitle>Trace Results</CardTitle>
                  <CardDescription>
                    {traceResult
                      ? `${direction === 'forward' ? 'Downstream products' : 'Upstream sources'}`
                      : 'Enter search criteria above to view trace results'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TraceResultsList
                    data={traceResult ?? null}
                    loading={isTraceLoading}
                    error={traceError ?? null}
                    onRetry={handleRetry}
                    onLPClick={handleLPClick}
                    direction={direction}
                  />
                </CardContent>
              </Card>
            )}

            {/* Tree View */}
            {viewMode === 'tree' && (
              <TraceResultsTree
                data={traceResult ?? null}
                loading={isTraceLoading}
                error={traceError ?? null}
                onRetry={handleRetry}
                onNodeClick={handleLPClick}
                direction={direction}
              />
            )}

            {/* Matrix View */}
            {viewMode === 'matrix' && (
              <TraceResultsMatrix
                data={traceResult ?? null}
                loading={isTraceLoading}
                error={traceError ?? null}
                onRetry={handleRetry}
                onRowClick={handleLPClick}
                direction={direction}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
