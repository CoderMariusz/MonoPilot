# Quality Status Integration Guide

## Overview

This guide shows how to integrate Quality Status features into other modules and pages.

**Supported entities**:
- License Plates (LPs) - Primary use case
- Batches - Future (Story 06.3+)
- Inspections - Future (Story 06.2+)

**Quick start**: 10 minutes to display status + change modal.

---

## Part 1: Display Current Status

### In a Table (ShadCN DataTable)

```typescript
// pages/warehouse/license-plates.tsx
import { QualityStatusBadge } from '@/components/quality'

const columns: ColumnDef<LicensePlate>[] = [
  {
    accessorKey: 'number',
    header: 'LP Number',
  },
  {
    accessorKey: 'qa_status',
    header: 'Quality Status',
    cell: ({ row }) => (
      <QualityStatusBadge status={row.original.qa_status} size="sm" />
    ),
  },
  {
    accessorKey: 'quantity',
    header: 'Qty',
  },
]

export function LicensePlatesTable() {
  const [data, setData] = useState<LicensePlate[]>([])

  useEffect(() => {
    fetchLicensePlates()
  }, [])

  return <DataTable columns={columns} data={data} />
}
```

### In a Card Layout

```typescript
// components/warehouse/LicensePlateCard.tsx
import { QualityStatusBadge } from '@/components/quality'

export function LicensePlateCard({ lp }: { lp: LicensePlate }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{lp.number}</CardTitle>
          <QualityStatusBadge status={lp.qa_status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p>Quantity: {lp.quantity} {lp.unit}</p>
          <p>Product: {lp.product_name}</p>
          <p>Lot: {lp.lot_number}</p>
        </div>
      </CardContent>
    </Card>
  )
}
```

### In a Detail Page (With Size Control)

```typescript
// pages/warehouse/[lpId].tsx
import { QualityStatusBadge } from '@/components/quality'

export default function LicensePlateDetail({ params: { lpId } }) {
  const [lp, setLp] = useState<LicensePlate | null>(null)

  useEffect(() => {
    fetchLicensePlate(lpId)
  }, [lpId])

  if (!lp) return <Loading />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">{lp.number}</h1>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Status:</span>
          <QualityStatusBadge status={lp.qa_status} size="lg" />
        </div>
      </div>

      {/* Rest of detail content */}
    </div>
  )
}
```

---

## Part 2: Add Status Change Modal

### Basic Integration

```typescript
import { useState } from 'react'
import { StatusTransitionModal } from '@/components/quality'
import { Button } from '@/components/ui/button'

export function LicensePlateDetail({ lp }: { lp: LicensePlate }) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div>
      <div className="flex items-center gap-4">
        <QualityStatusBadge status={lp.qa_status} size="lg" />
        <Button onClick={() => setModalOpen(true)}>
          Change Status
        </Button>
      </div>

      <StatusTransitionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        entityType="lp"
        entityId={lp.id}
        currentStatus={lp.qa_status}
        entityDisplayName={lp.number}
        onSuccess={(newStatus, historyId) => {
          // Refetch LP to get updated status
          fetchLicensePlate(lp.id)
        }}
      />
    </div>
  )
}
```

### Full Example with Transitions Fetch

```typescript
import { useState, useEffect } from 'react'
import { StatusTransitionModal } from '@/components/quality'
import { Button } from '@/components/ui/button'
import type { StatusTransition } from '@/lib/services/quality-status-service'

export function LicensePlateDetail({ lp }: { lp: LicensePlate }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [transitions, setTransitions] = useState<StatusTransition[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch valid transitions when modal opens
  useEffect(() => {
    if (modalOpen && transitions.length === 0) {
      fetchTransitions()
    }
  }, [modalOpen])

  const fetchTransitions = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ current: lp.qa_status })
      const res = await fetch(`/api/quality/status/transitions?${params}`)

      if (!res.ok) {
        throw new Error('Failed to load transitions')
      }

      const data = await res.json()
      setTransitions(data.valid_transitions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = (newStatus: string) => {
    // Refetch LP data
    fetchLicensePlate(lp.id)
    // Reset transitions for next change
    setTransitions([])
  }

  return (
    <div>
      <Button
        onClick={() => setModalOpen(true)}
        disabled={transitions.length === 0 && modalOpen}
      >
        Change Status
      </Button>

      <StatusTransitionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        entityType="lp"
        entityId={lp.id}
        currentStatus={lp.qa_status}
        entityDisplayName={lp.number}
        validTransitions={transitions}
        loadingTransitions={loading}
        transitionsError={error}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
```

---

## Part 3: Display Status History

### Basic Timeline

```typescript
import { useState, useEffect } from 'react'
import { StatusHistoryTimeline } from '@/components/quality'
import type { StatusHistoryEntry } from '@/components/quality'

export function LicensePlateHistory({ lpId }: { lpId: string }) {
  const [history, setHistory] = useState<StatusHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/quality/status/history/lp/${lpId}`)

      if (!res.ok) {
        throw new Error('Failed to load history')
      }

      const data = await res.json()
      setHistory(data.history)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [lpId])

  return (
    <StatusHistoryTimeline
      entries={history}
      loading={loading}
      error={error}
      onRetry={fetchHistory}
    />
  )
}
```

### Timeline with Pagination

```typescript
<StatusHistoryTimeline
  entries={history}
  loading={loading}
  error={error}
  onRetry={fetchHistory}
  maxEntries={5}
  expandable={true}
/>
```

---

## Part 4: Permissions Check

### Check Shipment Eligibility

```typescript
import {
  isShipmentAllowed,
  isConsumptionAllowed,
} from '@/components/quality'

export function ShippingButton({ lp }) {
  const canShip = isShipmentAllowed(lp.qa_status)

  return (
    <Button
      disabled={!canShip}
      title={
        !canShip
          ? `Cannot ship material in ${lp.qa_status} status`
          : 'Create shipment'
      }
    >
      Create Shipment
    </Button>
  )
}
```

### Check Consumption Eligibility

```typescript
export function ProductionPickButton({ lp }) {
  const canConsume = isConsumptionAllowed(lp.qa_status)

  return (
    <Button
      disabled={!canConsume}
      onClick={() => addToProductionOrder(lp)}
    >
      Add to Order
    </Button>
  )
}
```

### API-Based Check

```typescript
// Use the service directly in backend code
import { QualityStatusService } from '@/lib/services/quality-status-service'

// In an API route
const canShip = QualityStatusService.isStatusAllowedForShipment(status)
const canConsume = QualityStatusService.isStatusAllowedForConsumption(status)

if (!canShip) {
  return res.status(400).json({
    error: 'Cannot ship - quality status does not allow shipment',
  })
}
```

---

## Part 5: Full Page Integration

### License Plate Detail Page

```typescript
// pages/warehouse/license-plates/[id].tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  QualityStatusBadge,
  StatusTransitionModal,
  StatusHistoryTimeline,
} from '@/components/quality'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function LicensePlatePage() {
  const { id } = useParams()
  const [lp, setLp] = useState<LicensePlate | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [transitions, setTransitions] = useState([])
  const [history, setHistory] = useState([])

  useEffect(() => {
    fetchLicensePlate()
  }, [id])

  const fetchLicensePlate = async () => {
    try {
      const res = await fetch(`/api/warehouse/license-plates/${id}`)
      const data = await res.json()
      setLp(data)
    } catch (error) {
      console.error('Failed to load LP:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransitions = async () => {
    if (!lp) return
    try {
      const params = new URLSearchParams({ current: lp.qa_status })
      const res = await fetch(`/api/quality/status/transitions?${params}`)
      const data = await res.json()
      setTransitions(data.valid_transitions)
    } catch (error) {
      console.error('Failed to load transitions:', error)
    }
  }

  const fetchHistory = async () => {
    if (!lp) return
    try {
      const res = await fetch(`/api/quality/status/history/lp/${lp.id}`)
      const data = await res.json()
      setHistory(data.history)
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }

  useEffect(() => {
    if (modalOpen && !transitions.length) {
      fetchTransitions()
    }
  }, [modalOpen])

  useEffect(() => {
    fetchHistory()
  }, [lp?.id])

  if (loading) return <Loading />
  if (!lp) return <NotFound />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">{lp.number}</h1>
        <div className="flex items-center gap-4">
          <div>
            <span className="text-gray-600">Quality Status:</span>
            <div className="mt-1">
              <QualityStatusBadge status={lp.qa_status} size="lg" />
            </div>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            Change Status
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">Status History</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Product
              </label>
              <p className="mt-1">{lp.product_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Lot
              </label>
              <p className="mt-1">{lp.lot_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Quantity
              </label>
              <p className="mt-1">
                {lp.quantity} {lp.unit}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Expiry
              </label>
              <p className="mt-1">{lp.expiry_date}</p>
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <StatusHistoryTimeline
            entries={history}
            maxEntries={10}
            expandable={true}
          />
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <StatusTransitionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        entityType="lp"
        entityId={lp.id}
        currentStatus={lp.qa_status}
        entityDisplayName={lp.number}
        validTransitions={transitions}
        onSuccess={() => {
          fetchLicensePlate()
          setTransitions([])
        }}
      />
    </div>
  )
}
```

---

## Part 6: Service Layer Integration

### Using QualityStatusService in Backend

```typescript
// lib/services/shipping-service.ts
import { QualityStatusService } from '@/lib/services/quality-status-service'

export class ShippingService {
  /**
   * Get shippable license plates
   */
  static async getShippableLPs(orgId: string): Promise<LicensePlate[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('license_plates')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'active')

    if (error) throw error

    // Filter by quality status
    return data.filter((lp) =>
      QualityStatusService.isStatusAllowedForShipment(lp.qa_status)
    )
  }

  /**
   * Create shipment with status validation
   */
  static async createShipment(request: CreateShipmentRequest): Promise<void> {
    const supabase = createClient()

    for (const lpId of request.lp_ids) {
      const { data: lp } = await supabase
        .from('license_plates')
        .select('qa_status')
        .eq('id', lpId)
        .single()

      // Validate shipment eligibility
      if (!QualityStatusService.isStatusAllowedForShipment(lp.qa_status)) {
        throw new Error(
          `LP ${lpId} status ${lp.qa_status} does not allow shipment`
        )
      }
    }

    // Create shipment...
  }
}
```

### Using in Production Module

```typescript
// lib/services/production-order-service.ts
import { QualityStatusService } from '@/lib/services/quality-status-service'

export class ProductionOrderService {
  /**
   * Check if material can be consumed
   */
  static canConsumeMaterial(status: string): boolean {
    return QualityStatusService.isStatusAllowedForConsumption(status)
  }

  /**
   * Get consumable materials
   */
  static async getConsumableMaterials(
    recipeId: string,
    orgId: string
  ): Promise<LicensePlate[]> {
    const supabase = createClient()

    // Get recipe BOM
    const { data: bom } = await supabase
      .from('recipe_boms')
      .select('required_materials')
      .eq('id', recipeId)
      .single()

    // Find available LPs
    const { data: lps } = await supabase
      .from('license_plates')
      .select('*')
      .eq('org_id', orgId)
      .in('product_id', bom.required_materials)

    // Filter by consumption eligibility
    return lps.filter((lp) =>
      QualityStatusService.isStatusAllowedForConsumption(lp.qa_status)
    )
  }
}
```

---

## Part 7: Validation Integration

### Server-Side Validation

```typescript
// app/api/shipping/create/route.ts
import {
  createServerSupabase,
} from '@/lib/supabase/server'
import { QualityStatusService } from '@/lib/services/quality-status-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const body = await request.json()

    // Validate each LP can be shipped
    for (const lpId of body.lp_ids) {
      const { data: lp } = await supabase
        .from('license_plates')
        .select('qa_status, number')
        .eq('id', lpId)
        .single()

      if (!lp) {
        return NextResponse.json(
          { error: `License plate ${lpId} not found` },
          { status: 404 }
        )
      }

      if (!QualityStatusService.isStatusAllowedForShipment(lp.qa_status)) {
        return NextResponse.json(
          {
            error: `Cannot ship LP ${lp.number} - status is ${lp.qa_status}`,
          },
          { status: 400 }
        )
      }
    }

    // Create shipment...
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

### Client-Side Validation

```typescript
// components/shipping/ShippingForm.tsx
import {
  isShipmentAllowed,
} from '@/components/quality'

export function ShippingForm() {
  const [selectedLPs, setSelectedLPs] = useState<LicensePlate[]>([])

  const handleAddLP = (lp: LicensePlate) => {
    if (!isShipmentAllowed(lp.qa_status)) {
      toast({
        title: 'Cannot ship',
        description: `LP status ${lp.qa_status} does not allow shipment`,
        variant: 'destructive',
      })
      return
    }

    setSelectedLPs([...selectedLPs, lp])
  }

  return (
    <div>
      {/* Form content */}
    </div>
  )
}
```

---

## Part 8: Real-World Example - Warehouse Module

### Complete License Plate Management

```typescript
// pages/warehouse/license-plates.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  QualityStatusBadge,
  StatusTransitionModal,
} from '@/components/quality'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ColumnDef } from '@tanstack/react-table'

interface LPRow extends LicensePlate {
  _selected?: boolean
  _changeStatusId?: string | null
}

export default function LicensePlatesPage() {
  const [data, setData] = useState<LPRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusChangeId, setStatusChangeId] = useState<string | null>(null)

  useEffect(() => {
    fetchLicensePlates()
  }, [])

  const fetchLicensePlates = async () => {
    try {
      const res = await fetch('/api/warehouse/license-plates')
      const items = await res.json()
      setData(items)
    } catch (error) {
      console.error('Failed to load LPs:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnDef<LPRow>[] = [
    {
      accessorKey: 'number',
      header: 'LP Number',
      cell: ({ row }) => (
        <a
          href={`/warehouse/license-plates/${row.original.id}`}
          className="text-blue-600 hover:underline"
        >
          {row.original.number}
        </a>
      ),
    },
    {
      accessorKey: 'product_name',
      header: 'Product',
    },
    {
      accessorKey: 'lot_number',
      header: 'Lot',
    },
    {
      accessorKey: 'quantity',
      header: 'Qty',
      cell: ({ row }) =>
        `${row.original.quantity} ${row.original.unit}`,
    },
    {
      accessorKey: 'qa_status',
      header: 'QA Status',
      cell: ({ row }) => (
        <QualityStatusBadge status={row.original.qa_status} size="sm" />
      ),
    },
    {
      accessorKey: 'expiry_date',
      header: 'Expiry',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              ···
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setStatusChangeId(row.original.id)}
            >
              Change Status
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={`/warehouse/license-plates/${row.original.id}`}>
                View Details
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const currentLP = data.find((lp) => lp.id === statusChangeId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">License Plates</h1>
        <Button asChild>
          <a href="/warehouse/license-plates/new">Create LP</a>
        </Button>
      </div>

      <DataTable columns={columns} data={data} isLoading={loading} />

      {currentLP && (
        <StatusTransitionModal
          open={!!statusChangeId}
          onOpenChange={(open) => !open && setStatusChangeId(null)}
          entityType="lp"
          entityId={currentLP.id}
          currentStatus={currentLP.qa_status}
          entityDisplayName={currentLP.number}
          onSuccess={() => {
            fetchLicensePlates()
            setStatusChangeId(null)
          }}
        />
      )}
    </div>
  )
}
```

---

## Part 9: Testing Integration

### Component Test

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LicensePlateDetail } from '@/components/warehouse/LicensePlateDetail'

describe('License Plate Detail - Quality Status', () => {
  const mockLP = {
    id: 'lp-1',
    number: 'LP-001',
    qa_status: 'PENDING' as const,
    product_name: 'Product A',
    quantity: 100,
    unit: 'kg',
  }

  test('displays current status', () => {
    render(<LicensePlateDetail lp={mockLP} />)

    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  test('opens status change modal', async () => {
    const user = userEvent.setup()

    render(<LicensePlateDetail lp={mockLP} />)

    const changeButton = screen.getByText('Change Status')
    await user.click(changeButton)

    expect(
      screen.getByText('Change Quality Status')
    ).toBeInTheDocument()
  })

  test('calls onSuccess callback', async () => {
    const mockFetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            new_status: 'PASSED',
            history_id: 'hist-1',
          }),
      })
    )

    global.fetch = mockFetch

    render(<LicensePlateDetail lp={mockLP} />)

    // ... test interactions
  })
})
```

### API Test

```typescript
import { POST } from '@/app/api/quality/status/change/route'
import { NextRequest } from 'next/server'

describe('POST /api/quality/status/change', () => {
  test('changes LP status successfully', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/quality/status/change',
      {
        method: 'POST',
        body: JSON.stringify({
          entity_type: 'lp',
          entity_id: 'lp-1',
          to_status: 'PASSED',
          reason: 'Inspection passed successfully',
        }),
      }
    )

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.new_status).toBe('PASSED')
  })

  test('rejects viewer role', async () => {
    // Mock viewer user
    const request = new NextRequest(
      'http://localhost:3000/api/quality/status/change',
      {
        method: 'POST',
        body: JSON.stringify({
          entity_type: 'lp',
          entity_id: 'lp-1',
          to_status: 'PASSED',
          reason: 'Test',
        }),
      }
    )

    const response = await POST(request)

    expect(response.status).toBe(403)
  })
})
```

---

## Part 10: Common Patterns

### Pattern 1: Status-Gated Actions

```typescript
export function LPActions({ lp }) {
  return (
    <div className="space-y-2">
      <ShipButton
        disabled={!isShipmentAllowed(lp.qa_status)}
        lpId={lp.id}
      />
      <PickButton
        disabled={!isConsumptionAllowed(lp.qa_status)}
        lpId={lp.id}
      />
    </div>
  )
}
```

### Pattern 2: Status Change with Refetch

```typescript
const handleStatusChange = async () => {
  try {
    const res = await fetch('/api/quality/status/change', {
      method: 'POST',
      body: JSON.stringify({
        entity_type: 'lp',
        entity_id: lpId,
        to_status: newStatus,
        reason: changeReason,
      }),
    })

    if (res.ok) {
      // Refetch LP data
      const lpRes = await fetch(`/api/warehouse/license-plates/${lpId}`)
      const updated = await lpRes.json()
      setLP(updated)

      toast({
        title: 'Status updated',
        description: `LP status changed to ${newStatus}`,
      })
    }
  } catch (error) {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive',
    })
  }
}
```

### Pattern 3: Batch Status Changes

```typescript
export async function changeSelectedLPStatuses(
  lpIds: string[],
  newStatus: string,
  reason: string
) {
  const results = []

  for (const lpId of lpIds) {
    try {
      const res = await fetch('/api/quality/status/change', {
        method: 'POST',
        body: JSON.stringify({
          entity_type: 'lp',
          entity_id: lpId,
          to_status: newStatus,
          reason,
        }),
      })

      results.push({
        lpId,
        success: res.ok,
        error: !res.ok ? await res.text() : null,
      })
    } catch (error) {
      results.push({
        lpId,
        success: false,
        error: error.message,
      })
    }
  }

  return results
}
```

---

## Checklist: Adding Quality Status to a Module

- [ ] Import `QualityStatusBadge` component
- [ ] Display status in table/card using badge
- [ ] Add "Change Status" button/action
- [ ] Import `StatusTransitionModal` component
- [ ] Fetch valid transitions on modal open
- [ ] Pass transitions to modal
- [ ] Implement onSuccess callback to refetch data
- [ ] Display status history if needed
- [ ] Use `isShipmentAllowed` / `isConsumptionAllowed` for gating
- [ ] Test status change flow
- [ ] Test permission validation
- [ ] Document any module-specific transitions

---

## Support & Troubleshooting

### Modal not showing transitions

**Problem**: Modal shows "No valid transitions available"

**Causes**:
1. Status not in database
2. No transitions configured for that status
3. All transitions set as `is_allowed = false`

**Solution**: Check `quality_status_transitions` table in Supabase.

### Status change fails with 403

**Problem**: "QA Manager approval required"

**Causes**:
1. Transition requires approval
2. User doesn't have QA_MANAGER role

**Solution**: Use QA Manager account or change transition rules.

### History not showing

**Problem**: No status history entries

**Causes**:
1. No status changes made yet
2. Wrong entity ID
3. Wrong entity type

**Solution**: Make a status change first, check entity ID format.

---

## API Reference Quick Links

- Full API Docs: `/docs/3-TECHNICAL/06-quality/api-reference.md`
- Transition Rules: `/docs/3-TECHNICAL/06-quality/status-transition-rules.md`
- Component Guide: `/docs/3-TECHNICAL/06-quality/component-guide.md`

---

## Contact & Support

For issues or questions:
1. Check this guide's "Troubleshooting" section
2. Review test files: `components/quality/__tests__/`
3. Check API tests: `app/api/quality/status/__tests__/`
4. Contact: @dev-team on Slack
