/**
 * Import Wizard Step 4: Results
 * Story: 03.6 - PO Bulk Operations
 * Display creation results with success/partial failure states per PLAN-007
 */

'use client'

import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Download,
  Plus,
  Eye,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { BulkCreatePOResult, POSummary, BulkError } from '@/lib/types/po-bulk'

interface ImportWizardStepResultsProps {
  result: BulkCreatePOResult
  onViewPO?: (poId: string) => void
  onSubmitPO?: (poId: string) => void
  onSubmitAll?: () => void
  onViewPOList?: () => void
  onDownloadResults?: () => void
  onImportMore?: () => void
  onClose?: () => void
  className?: string
}

function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(value)
}

interface SuccessfulPOsTableProps {
  pos: POSummary[]
  onViewPO?: (poId: string) => void
  onSubmitPO?: (poId: string) => void
}

function SuccessfulPOsTable({ pos, onViewPO, onSubmitPO }: SuccessfulPOsTableProps) {
  if (pos.length === 0) return null

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>PO Number</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead className="text-center">Lines</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pos.map((po) => (
          <TableRow key={po.po_id}>
            <TableCell className="font-mono">{po.po_number}</TableCell>
            <TableCell>{po.supplier_name}</TableCell>
            <TableCell className="text-center">{po.line_count}</TableCell>
            <TableCell className="text-right">
              {formatCurrency(po.total, po.currency)}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="bg-gray-100 text-gray-700">
                {po.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                {onViewPO && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewPO(po.po_id)}
                    className="h-8 px-2"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                )}
                {onSubmitPO && po.status === 'draft' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSubmitPO(po.po_id)}
                    className="h-8 px-2"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Submit
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

interface FailedPOsListProps {
  errors: BulkError[]
  onRetry?: (groupIndex: number) => void
  onEdit?: (groupIndex: number) => void
}

function FailedPOsList({ errors, onRetry, onEdit }: FailedPOsListProps) {
  if (errors.length === 0) return null

  return (
    <div className="space-y-3">
      {errors.map((error, index) => (
        <Card key={index} className="border-l-4 border-l-red-500 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="font-medium">
                    {error.supplier_name
                      ? `PO Group: ${error.supplier_name}`
                      : error.po_number
                      ? `${error.po_number}`
                      : `Row ${error.row_number}`}
                  </span>
                  {error.code && (
                    <Badge variant="destructive" className="text-xs">
                      {error.code}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-red-700">{error.error}</p>
                {error.resolutions && error.resolutions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Resolution:</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                      {error.resolutions.map((resolution, idx) => (
                        <li key={idx}>{resolution}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                {onRetry && error.group_index !== undefined && (
                  <Button variant="outline" size="sm" onClick={() => onRetry(error.group_index!)}>
                    Retry
                  </Button>
                )}
                {onEdit && error.group_index !== undefined && (
                  <Button variant="ghost" size="sm" onClick={() => onEdit(error.group_index!)}>
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ImportWizardStepResults({
  result,
  onViewPO,
  onSubmitPO,
  onSubmitAll,
  onViewPOList,
  onDownloadResults,
  onImportMore,
  onClose,
  className,
}: ImportWizardStepResultsProps) {
  const isFullSuccess = result.success && result.errors.length === 0
  const isPartialSuccess = result.pos_created.length > 0 && result.errors.length > 0
  const isFullFailure = result.pos_created.length === 0 && result.errors.length > 0

  const hasDraftPOs = result.pos_created.some((po) => po.status === 'draft')

  return (
    <div className={className}>
      {/* Result Banner */}
      {isFullSuccess && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800 text-lg">
            Import Completed Successfully!
          </AlertTitle>
          <AlertDescription className="text-green-700">
            {result.pos_created.length} Purchase Order{result.pos_created.length !== 1 ? 's' : ''} created
            ({result.total_lines} line items)
          </AlertDescription>
        </Alert>
      )}

      {isPartialSuccess && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <AlertTitle className="text-yellow-800 text-lg">
            Import Completed with Errors
          </AlertTitle>
          <AlertDescription className="text-yellow-700">
            {result.pos_created.length} of {result.pos_created.length + result.errors.length} POs created successfully.
            {result.errors.length} PO{result.errors.length !== 1 ? 's' : ''} failed to create.
          </AlertDescription>
        </Alert>
      )}

      {isFullFailure && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-5 w-5" />
          <AlertTitle className="text-lg">Import Failed</AlertTitle>
          <AlertDescription>
            No Purchase Orders were created. Please review the errors below and try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Successful POs */}
      {result.pos_created.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Successful ({result.pos_created.length})
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Total Value: {formatCurrency(result.total_value)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <SuccessfulPOsTable
              pos={result.pos_created}
              onViewPO={onViewPO}
              onSubmitPO={onSubmitPO}
            />
          </CardContent>
        </Card>
      )}

      {/* Failed POs */}
      {result.errors.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Failed ({result.errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <FailedPOsList errors={result.errors} />
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card className="mb-6 bg-muted/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Successful</p>
              <p className="text-lg font-medium text-green-600">
                {result.pos_created.length} POs
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Failed</p>
              <p className="text-lg font-medium text-red-600">
                {result.errors.length} POs
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Lines</p>
              <p className="text-lg font-medium">{result.total_lines}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Value</p>
              <p className="text-lg font-medium">
                {formatCurrency(result.total_value)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground mb-4">
            What would you like to do next?
          </p>
          <div className="flex flex-wrap gap-3">
            {hasDraftPOs && onSubmitAll && (
              <Button onClick={onSubmitAll} className="gap-2">
                <Send className="h-4 w-4" />
                Submit All POs
              </Button>
            )}
            {onViewPOList && (
              <Button variant="outline" onClick={onViewPOList} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View PO List
              </Button>
            )}
            {onDownloadResults && (
              <Button variant="outline" onClick={onDownloadResults} className="gap-2">
                <Download className="h-4 w-4" />
                Download Results
              </Button>
            )}
            {onImportMore && (
              <Button variant="outline" onClick={onImportMore} className="gap-2">
                <Plus className="h-4 w-4" />
                Import More
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ImportWizardStepResults
