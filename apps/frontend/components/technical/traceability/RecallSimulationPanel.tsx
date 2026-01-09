/**
 * RecallSimulationPanel Component
 * Story 02.10b: Traceability Queries UI
 *
 * Display panel for recall simulation results.
 * Shows comprehensive impact analysis with all 4 UI states.
 * Includes: affected inventory, locations, customers, financial, regulatory.
 */

'use client'

import { useState, useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import {
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  FileWarning,
  Package,
  MapPin,
  Users,
  DollarSign,
  FileText,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { GenealogyTree } from '@/components/technical/GenealogyTree'
import type {
  RecallSimulationResult,
  RecallSummary,
  LocationAnalysis,
  CustomerImpact,
  FinancialImpact,
  RegulatoryInfo,
} from '@/lib/types/traceability'

// ============================================================================
// TYPES
// ============================================================================

interface RecallSimulationPanelProps {
  /** Recall simulation result data */
  data: RecallSimulationResult | null
  /** Loading state */
  loading?: boolean
  /** Error object if any */
  error?: Error | null
  /** Callback to retry failed request */
  onRetry?: () => void
  /** Callback when LP node is clicked */
  onNodeClick?: (nodeId: string) => void
  /** Additional className */
  className?: string
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ============================================================================
// LOADING STATE
// ============================================================================

function RecallSimulationPanelLoading({ className }: { className?: string }) {
  return (
    <div className={className} role="status" aria-label="Loading recall simulation">
      {/* Warning Banner Skeleton */}
      <Skeleton className="h-16 w-full rounded-lg mb-6" />

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// ERROR STATE
// ============================================================================

interface RecallSimulationPanelErrorProps {
  error: Error
  onRetry?: () => void
  className?: string
}

function RecallSimulationPanelError({
  error,
  onRetry,
  className,
}: RecallSimulationPanelErrorProps) {
  return (
    <Card className={className}>
      <CardContent className="p-8">
        <div
          className="flex flex-col items-center justify-center"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="h-16 w-16 text-destructive mb-4" aria-hidden="true" />
          <h3 className="text-xl font-semibold text-destructive mb-2">
            Recall Simulation Failed
          </h3>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            {error.message || 'An unexpected error occurred during the recall simulation.'}
          </p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry Simulation
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function RecallSimulationPanelEmpty({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="p-8">
        <div
          className="flex flex-col items-center justify-center"
          role="status"
          aria-live="polite"
        >
          <FileWarning className="h-16 w-16 text-muted-foreground mb-4" aria-hidden="true" />
          <h3 className="text-xl font-semibold mb-2">No Simulation Data</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Run a recall simulation by entering a License Plate ID or Batch Number above.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            The simulation will trace all affected inventory and calculate potential impact.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// Summary Stats Card
function StatCard({
  icon: Icon,
  label,
  value,
  variant = 'default',
}: {
  icon: React.ElementType
  label: string
  value: string | number
  variant?: 'default' | 'warning' | 'danger'
}) {
  const variantClasses = {
    default: 'bg-background',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200',
  }

  return (
    <Card className={variantClasses[variant]}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Icon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Status Breakdown Bar
function StatusBreakdown({ breakdown }: { breakdown: RecallSummary['status_breakdown'] }) {
  const total =
    breakdown.available +
    breakdown.in_production +
    breakdown.shipped +
    breakdown.consumed +
    breakdown.quarantine

  const items = [
    { key: 'available', label: 'Available', value: breakdown.available, color: 'bg-green-500' },
    {
      key: 'in_production',
      label: 'In Production',
      value: breakdown.in_production,
      color: 'bg-orange-500',
    },
    { key: 'shipped', label: 'Shipped', value: breakdown.shipped, color: 'bg-red-500' },
    { key: 'consumed', label: 'Consumed', value: breakdown.consumed, color: 'bg-gray-500' },
    { key: 'quarantine', label: 'Quarantine', value: breakdown.quarantine, color: 'bg-yellow-500' },
  ]

  return (
    <div className="space-y-3">
      <div className="h-4 rounded-full overflow-hidden flex bg-muted">
        {items.map((item) => {
          const width = total > 0 ? (item.value / total) * 100 : 0
          if (width === 0) return null
          return (
            <div
              key={item.key}
              className={`${item.color} transition-all`}
              style={{ width: `${width}%` }}
              title={`${item.label}: ${item.value}`}
            />
          )
        })}
      </div>
      <div className="grid grid-cols-5 gap-2 text-center">
        {items.map((item) => (
          <div key={item.key} className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <span className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
            <p className="font-semibold">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Financial Impact Summary
function FinancialSummary({ financial }: { financial: FinancialImpact }) {
  const items = [
    { label: 'Product Value', value: financial.product_value },
    { label: 'Retrieval Cost', value: financial.retrieval_cost },
    { label: 'Disposal Cost', value: financial.disposal_cost },
    { label: 'Lost Revenue', value: financial.lost_revenue },
  ]

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label} className="flex justify-between items-center">
          <span className="text-muted-foreground">{item.label}</span>
          <span className="font-medium">{formatCurrency(item.value)}</span>
        </div>
      ))}
      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-lg">Total Estimated Cost</span>
          <span className="font-bold text-xl text-red-600">
            {formatCurrency(financial.total_estimated_cost)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-right">
          Confidence: {financial.confidence_interval}
        </p>
      </div>
    </div>
  )
}

// Regulatory Status
function RegulatoryStatus({ regulatory }: { regulatory: RegulatoryInfo }) {
  return (
    <div className="space-y-4">
      {/* FDA Reportable Status */}
      <div className="flex items-center justify-between p-4 rounded-lg border">
        <div className="flex items-center gap-3">
          {regulatory.reportable_to_fda ? (
            <XCircle className="h-6 w-6 text-red-500" />
          ) : (
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          )}
          <div>
            <p className="font-medium">FDA Reportable</p>
            <p className="text-sm text-muted-foreground">
              {regulatory.reportable_to_fda
                ? 'This recall requires FDA notification'
                : 'No FDA notification required'}
            </p>
          </div>
        </div>
        <Badge variant={regulatory.reportable_to_fda ? 'destructive' : 'default'}>
          {regulatory.reportable_to_fda ? 'YES' : 'NO'}
        </Badge>
      </div>

      {/* Report Due Date */}
      {regulatory.report_due_date && (
        <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-red-500" />
            <div>
              <p className="font-medium text-red-700">Report Due Date</p>
              <p className="text-sm text-red-600">{formatDate(regulatory.report_due_date)}</p>
            </div>
          </div>
          <Badge variant="destructive">{regulatory.report_status.toUpperCase()}</Badge>
        </div>
      )}

      {/* Affected Product Types */}
      <div className="p-4 rounded-lg border">
        <p className="font-medium mb-2">Affected Product Types</p>
        <div className="flex flex-wrap gap-2">
          {regulatory.affected_product_types.map((type) => (
            <Badge key={type} variant="outline">
              {type}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RecallSimulationPanel({
  data,
  loading = false,
  error = null,
  onRetry,
  onNodeClick,
  className,
}: RecallSimulationPanelProps) {
  const [activeTab, setActiveTab] = useState<string>('summary')

  // Handle node click with keyboard support
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      onNodeClick?.(nodeId)
    },
    [onNodeClick]
  )

  // Export handlers
  const handleExportJSON = useCallback(() => {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `recall-simulation-${data.simulation_id}-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(link.href)
  }, [data])

  // Loading state
  if (loading) {
    return <RecallSimulationPanelLoading className={className} />
  }

  // Error state
  if (error) {
    return <RecallSimulationPanelError error={error} onRetry={onRetry} className={className} />
  }

  // Empty state
  if (!data) {
    return <RecallSimulationPanelEmpty className={className} />
  }

  // Success state
  return (
    <div className={className}>
      {/* Warning Banner */}
      <Alert variant="default" className="mb-6 border-yellow-400 bg-yellow-50">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <AlertTitle className="text-yellow-800">Simulation Mode</AlertTitle>
        <AlertDescription className="text-yellow-700">
          This is a recall simulation. No inventory has been affected. Use this data for planning
          and preparedness purposes only.
        </AlertDescription>
      </Alert>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Package}
          label="Affected LPs"
          value={data.summary.total_affected_lps}
          variant={data.summary.total_affected_lps > 0 ? 'warning' : 'default'}
        />
        <StatCard
          icon={MapPin}
          label="Warehouses"
          value={data.summary.affected_warehouses}
        />
        <StatCard
          icon={Users}
          label="Customers"
          value={data.summary.affected_customers}
          variant={data.summary.affected_customers > 0 ? 'danger' : 'default'}
        />
        <StatCard
          icon={DollarSign}
          label="Est. Cost"
          value={formatCurrency(data.financial.total_estimated_cost)}
          variant="danger"
        />
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="summary" className="text-xs sm:text-sm">
            Summary
          </TabsTrigger>
          <TabsTrigger value="genealogy" className="text-xs sm:text-sm">
            Genealogy
          </TabsTrigger>
          <TabsTrigger value="locations" className="text-xs sm:text-sm">
            Locations
          </TabsTrigger>
          <TabsTrigger value="financial" className="text-xs sm:text-sm">
            Financial
          </TabsTrigger>
          <TabsTrigger value="regulatory" className="text-xs sm:text-sm">
            Regulatory
          </TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Affected Inventory Summary</CardTitle>
                  <CardDescription>
                    Root LP: {data.root_lp?.lp_number || data.root_lp?.id || 'N/A'}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportJSON} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export JSON
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Total Quantity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Total Quantity</p>
                  <p className="text-2xl font-bold">
                    {data.summary.total_quantity.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Estimated Value</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(data.summary.total_estimated_value)}
                  </p>
                </div>
              </div>

              {/* Status Breakdown */}
              <div>
                <h4 className="font-semibold mb-3">Status Breakdown</h4>
                <StatusBreakdown breakdown={data.summary.status_breakdown} />
              </div>

              {/* Execution Info */}
              <div className="text-sm text-muted-foreground text-right">
                <p>Simulation ID: {data.simulation_id}</p>
                <p>
                  Completed in {data.execution_time_ms}ms at {formatDateTime(data.created_at)}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Genealogy Tab */}
        <TabsContent value="genealogy">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Backward Trace */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Backward Trace (Sources)</CardTitle>
                <CardDescription>Upstream materials and ingredients</CardDescription>
              </CardHeader>
              <CardContent>
                {data.backward_trace?.length > 0 ? (
                  <GenealogyTree
                    traceTree={data.backward_trace}
                    direction="backward"
                    onNodeClick={handleNodeClick}
                  />
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    No backward trace data
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Forward Trace */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Forward Trace (Products)</CardTitle>
                <CardDescription>Downstream products and destinations</CardDescription>
              </CardHeader>
              <CardContent>
                {data.forward_trace?.length > 0 ? (
                  <GenealogyTree
                    traceTree={data.forward_trace}
                    direction="forward"
                    onNodeClick={handleNodeClick}
                  />
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    No forward trace data
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle>Location Analysis</CardTitle>
              <CardDescription>
                Affected inventory by warehouse location
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.locations?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Warehouse</TableHead>
                      <TableHead className="text-right">Affected LPs</TableHead>
                      <TableHead className="text-right">Total Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.locations.map((loc, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{loc.warehouse_name}</TableCell>
                        <TableCell className="text-right">{loc.affected_lps}</TableCell>
                        <TableCell className="text-right">
                          {loc.total_quantity.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No location data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Impact */}
          {data.customers?.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Customer Impact</CardTitle>
                <CardDescription>
                  Customers who received affected products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Shipped Qty</TableHead>
                      <TableHead>Ship Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.customers.map((customer, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{customer.customer_name}</TableCell>
                        <TableCell>{customer.contact_email || '-'}</TableCell>
                        <TableCell className="text-right">
                          {customer.shipped_quantity.toLocaleString()}
                        </TableCell>
                        <TableCell>{formatDate(customer.ship_date)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              customer.notification_status === 'sent' ? 'default' : 'outline'
                            }
                          >
                            {customer.notification_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>Financial Impact Analysis</CardTitle>
              <CardDescription>
                Estimated costs associated with this recall
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FinancialSummary financial={data.financial} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regulatory Tab */}
        <TabsContent value="regulatory">
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Compliance</CardTitle>
              <CardDescription>
                FDA reporting requirements and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegulatoryStatus regulatory={data.regulatory} />

              {/* Export Buttons */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold mb-3">Export Reports</h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="gap-2" onClick={handleExportJSON}>
                    <FileText className="h-4 w-4" />
                    Export FDA JSON
                  </Button>
                  <Button variant="outline" className="gap-2" disabled>
                    <FileText className="h-4 w-4" />
                    Export FDA XML
                  </Button>
                  <Button variant="outline" className="gap-2" disabled>
                    <FileText className="h-4 w-4" />
                    Export PDF Report
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  XML and PDF exports coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default RecallSimulationPanel
