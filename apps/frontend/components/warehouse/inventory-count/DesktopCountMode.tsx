'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, Search, CheckSquare } from 'lucide-react'

interface CountItem {
  id: string
  lp_id: string
  expected: boolean
  scanned_at?: string
  variance?: 'found' | 'missing' | 'extra'
  lp?: {
    lp_number: string
    current_qty: number
    status: string
    product?: {
      code: string
      name: string
    }
  }
}

interface DesktopCountModeProps {
  items: CountItem[]
  onCheckItem: (lpId: string) => Promise<void>
  disabled?: boolean
}

export function DesktopCountMode({ items, onCheckItem, disabled }: DesktopCountModeProps) {
  const [search, setSearch] = useState('')
  const [checkingId, setCheckingId] = useState<string | null>(null)

  const filteredItems = items.filter((item) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      item.lp?.lp_number.toLowerCase().includes(searchLower) ||
      item.lp?.product?.code.toLowerCase().includes(searchLower) ||
      item.lp?.product?.name.toLowerCase().includes(searchLower)
    )
  })

  // Sort: unchecked expected first, then checked, then extra
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.expected && !a.scanned_at && (!b.expected || b.scanned_at)) return -1
    if (b.expected && !b.scanned_at && (!a.expected || a.scanned_at)) return 1
    if (a.scanned_at && !b.scanned_at) return 1
    if (b.scanned_at && !a.scanned_at) return -1
    return 0
  })

  async function handleCheck(item: CountItem) {
    if (disabled || item.scanned_at || checkingId) return

    setCheckingId(item.lp_id)
    try {
      await onCheckItem(item.lp_id)
    } finally {
      setCheckingId(null)
    }
  }

  const uncheckedCount = items.filter((i) => i.expected && !i.scanned_at).length
  const checkedCount = items.filter((i) => i.scanned_at).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            LP Checklist
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{checkedCount} checked</span>
            <span>/</span>
            <span>{items.length} total</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search LP, product..."
            className="pl-9"
          />
        </div>

        {/* Quick Stats */}
        {uncheckedCount > 0 && (
          <div className="text-sm text-muted-foreground">
            {uncheckedCount} LP(s) remaining to check
          </div>
        )}

        {/* Table */}
        <div className="border rounded-lg max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>LP Number</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="w-24">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No items found
                  </TableCell>
                </TableRow>
              ) : (
                sortedItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className={item.scanned_at ? 'bg-muted/30' : 'cursor-pointer hover:bg-muted/50'}
                    onClick={() => handleCheck(item)}
                  >
                    <TableCell>
                      {checkingId === item.lp_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Checkbox
                          checked={!!item.scanned_at}
                          disabled={disabled || !!item.scanned_at}
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-mono">{item.lp?.lp_number}</TableCell>
                    <TableCell>
                      {item.lp?.product ? (
                        <div>
                          <div className="font-medium">{item.lp.product.code}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.lp.product.name}
                          </div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.lp?.current_qty}
                    </TableCell>
                    <TableCell>
                      {item.variance ? (
                        <Badge
                          variant={
                            item.variance === 'found'
                              ? 'default'
                              : item.variance === 'extra'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {item.variance}
                        </Badge>
                      ) : item.expected ? (
                        <Badge variant="outline">pending</Badge>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Bulk Check Button */}
        {uncheckedCount > 0 && !disabled && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={checkingId !== null}
              onClick={async () => {
                // Check items one by one
                for (const item of items.filter((i) => i.expected && !i.scanned_at)) {
                  await handleCheck(item)
                }
              }}
            >
              Check All Remaining ({uncheckedCount})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
