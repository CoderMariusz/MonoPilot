/**
 * Import Wizard Step 3: Validation Results
 * Story: 03.6 - PO Bulk Operations
 * Display validation errors/warnings with resolution options per PLAN-007
 */

'use client'

import { useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ValidationResult, ImportRowWithValidation } from '@/lib/types/po-bulk'

interface ImportWizardStepValidateProps {
  validationResult: ValidationResult
  onResolveError?: (rowNumber: number, action: string, value?: string) => void
  onSkipWarning?: (rowNumber: number) => void
  onSkipAllWarnings?: () => void
  className?: string
}

interface ValidationIssueCardProps {
  row: ImportRowWithValidation
  type: 'error' | 'warning'
  onResolve?: (action: string, value?: string) => void
  onSkip?: () => void
}

function ValidationIssueCard({ row, type, onResolve, onSkip }: ValidationIssueCardProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<string>('')

  const isError = type === 'error'
  const issues = isError ? row.errors : row.warnings

  if (!issues || issues.length === 0) return null

  return (
    <Card
      className={`mb-3 border-l-4 ${
        isError ? 'border-l-red-500 bg-red-50' : 'border-l-yellow-500 bg-yellow-50'
      }`}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="py-3 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                {isError ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                )}
                <span className="font-medium">
                  Row {row.row_number}: {isError ? 'Error' : 'Warning'}
                </span>
              </div>
              <Badge variant={isError ? 'destructive' : 'outline'} className="text-xs">
                {row.product_code}
              </Badge>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-3">
            {/* Issue Messages */}
            <div className="mb-3 space-y-1">
              {issues.map((issue, idx) => (
                <p key={idx} className="text-sm">
                  {issue}
                </p>
              ))}
            </div>

            {/* Resolution Actions */}
            <div className="flex flex-wrap gap-2">
              {isError && onResolve && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onResolve('create_product')}
                  >
                    Create Product
                  </Button>
                  <div className="flex items-center gap-2">
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger className="w-48 h-8">
                        <SelectValue placeholder="Map to existing..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RM-FLOUR-001">RM-FLOUR-001 - Flour Type A</SelectItem>
                        <SelectItem value="RM-SUGAR-001">RM-SUGAR-001 - White Sugar</SelectItem>
                        <SelectItem value="RM-SALT-001">RM-SALT-001 - Industrial Salt</SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedProduct && (
                      <Button
                        size="sm"
                        onClick={() => onResolve('map_product', selectedProduct)}
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onResolve('remove_row')}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove Row
                  </Button>
                </>
              )}
              {!isError && onSkip && (
                <>
                  <Button variant="outline" size="sm" onClick={() => onSkip()}>
                    Ignore Warning
                  </Button>
                  <Button variant="outline" size="sm">
                    Use Default Supplier
                  </Button>
                  <Button variant="outline" size="sm">
                    Use File Supplier
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export function ImportWizardStepValidate({
  validationResult,
  onResolveError,
  onSkipWarning,
  onSkipAllWarnings,
  className,
}: ImportWizardStepValidateProps) {
  const [showValidRows, setShowValidRows] = useState(false)

  const { summary, error_rows, warning_rows, valid_rows } = validationResult
  const hasErrors = error_rows.length > 0
  const hasWarnings = warning_rows.length > 0
  const hasIssues = hasErrors || hasWarnings
  const totalIssues = error_rows.length + warning_rows.length

  return (
    <div className={className}>
      {/* Summary Banner */}
      {hasIssues ? (
        <Alert
          variant={hasErrors ? 'destructive' : 'default'}
          className="mb-4"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {totalIssues} Issue{totalIssues !== 1 ? 's' : ''} Found
            {hasErrors && hasWarnings && ` (${error_rows.length} Error${error_rows.length !== 1 ? 's' : ''}, ${warning_rows.length} Warning${warning_rows.length !== 1 ? 's' : ''})`}
            {hasErrors && !hasWarnings && ` (${error_rows.length} Error${error_rows.length !== 1 ? 's' : ''})`}
            {!hasErrors && hasWarnings && ` (${warning_rows.length} Warning${warning_rows.length !== 1 ? 's' : ''})`}
          </AlertTitle>
          <AlertDescription>
            {hasErrors
              ? 'Fix all errors before proceeding. Warnings can be skipped.'
              : 'Review warnings or skip to proceed.'}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">All Rows Valid</AlertTitle>
          <AlertDescription className="text-green-700">
            {summary.valid} rows validated successfully. Ready to create POs.
          </AlertDescription>
        </Alert>
      )}

      {/* Global Actions */}
      {hasIssues && (
        <div className="flex justify-end gap-2 mb-4">
          {hasWarnings && onSkipAllWarnings && (
            <Button variant="outline" size="sm" onClick={onSkipAllWarnings}>
              Skip All Warnings
            </Button>
          )}
        </div>
      )}

      {/* Errors Section */}
      {hasErrors && (
        <div className="mb-6">
          <h4 className="flex items-center gap-2 font-medium text-red-700 mb-3">
            <AlertCircle className="h-4 w-4" />
            ERRORS (must fix to continue)
          </h4>
          {error_rows.map((row) => (
            <ValidationIssueCard
              key={row.row_number}
              row={row}
              type="error"
              onResolve={
                onResolveError
                  ? (action, value) => onResolveError(row.row_number, action, value)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Warnings Section */}
      {hasWarnings && (
        <div className="mb-6">
          <h4 className="flex items-center gap-2 font-medium text-yellow-700 mb-3">
            <AlertTriangle className="h-4 w-4" />
            WARNINGS (review recommended)
          </h4>
          {warning_rows.map((row) => (
            <ValidationIssueCard
              key={row.row_number}
              row={row}
              type="warning"
              onSkip={
                onSkipWarning ? () => onSkipWarning(row.row_number) : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Valid Rows Section */}
      <Card className="border-green-200 bg-green-50/50">
        <Collapsible open={showValidRows} onOpenChange={setShowValidRows}>
          <CollapsibleTrigger asChild>
            <CardHeader className="py-3 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {showValidRows ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">
                    VALID ROWS
                  </span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {valid_rows.length} of {summary.total}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" className="text-green-700">
                  {showValidRows ? 'Hide' : 'Show Valid Rows'}
                </Button>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-green-50">
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-4">Row</th>
                      <th className="py-2 pr-4">Product</th>
                      <th className="py-2 pr-4">Qty</th>
                      <th className="py-2 pr-4">Supplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valid_rows.slice(0, 50).map((row) => (
                      <tr key={row.row_number} className="border-t border-green-200">
                        <td className="py-2 pr-4">{row.row_number}</td>
                        <td className="py-2 pr-4">
                          {row.product_name || row.product_code}
                        </td>
                        <td className="py-2 pr-4">{row.quantity}</td>
                        <td className="py-2 pr-4">{row.supplier_name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {valid_rows.length > 50 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Showing first 50 of {valid_rows.length} valid rows
                  </p>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  )
}

export default ImportWizardStepValidate
