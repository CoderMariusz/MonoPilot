'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { AlertTriangle, XCircle, TrendingDown, TrendingUp } from 'lucide-react'

interface CountItem {
  id: string
  lp_id: string
  variance?: 'found' | 'missing' | 'extra'
  lp?: {
    lp_number: string
    current_qty: number
    product?: {
      code: string
      name: string
    }
  }
}

interface VarianceReportProps {
  countNumber: string
  location: { code: string; name: string }
  expectedLps: number
  foundLps: number
  missingLps: number
  extraLps: number
  variancePct: number
  missingItems: CountItem[]
  extraItems: CountItem[]
  completedAt: string
}

export function VarianceReport({
  countNumber,
  location,
  expectedLps,
  foundLps,
  missingLps,
  extraLps,
  variancePct,
  missingItems,
  extraItems,
  completedAt,
}: VarianceReportProps) {
  const hasVariance = missingLps > 0 || extraLps > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Variance Report</CardTitle>
          <Badge variant={hasVariance ? 'destructive' : 'default'}>
            {hasVariance ? 'Variance Detected' : 'No Variance'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <div className="text-sm text-muted-foreground">Count Number</div>
            <div className="font-mono font-medium">{countNumber}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Location</div>
            <div className="font-medium">{location.code}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="font-medium">
              {new Date(completedAt).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Variance</div>
            <div className="flex items-center gap-1">
              {variancePct < 0 ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : variancePct > 0 ? (
                <TrendingUp className="h-4 w-4 text-yellow-500" />
              ) : null}
              <span
                className={`font-mono font-medium ${
                  variancePct !== 0 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {variancePct > 0 ? '+' : ''}
                {variancePct.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-3xl font-bold">{expectedLps}</div>
            <div className="text-sm text-muted-foreground">Expected</div>
          </div>
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="text-3xl font-bold text-green-600">{foundLps}</div>
            <div className="text-sm text-muted-foreground">Found</div>
          </div>
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="text-3xl font-bold text-red-600">{missingLps}</div>
            <div className="text-sm text-muted-foreground">Missing</div>
          </div>
          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="text-3xl font-bold text-yellow-600">{extraLps}</div>
            <div className="text-sm text-muted-foreground">Extra</div>
          </div>
        </div>

        {/* Details */}
        {hasVariance && (
          <Accordion type="multiple" defaultValue={['missing', 'extra']}>
            {/* Missing Items */}
            {missingItems.length > 0 && (
              <AccordionItem value="missing">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span>Missing LPs ({missingItems.length})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>LP Number</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {missingItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono">
                            {item.lp?.lp_number}
                          </TableCell>
                          <TableCell>
                            {item.lp?.product ? (
                              <>
                                {item.lp.product.code} - {item.lp.product.name}
                              </>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {item.lp?.current_qty}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Extra Items */}
            {extraItems.length > 0 && (
              <AccordionItem value="extra">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span>Extra LPs ({extraItems.length})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>LP Number</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {extraItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono">
                            {item.lp?.lp_number}
                          </TableCell>
                          <TableCell>
                            {item.lp?.product ? (
                              <>
                                {item.lp.product.code} - {item.lp.product.name}
                              </>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {item.lp?.current_qty}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}
