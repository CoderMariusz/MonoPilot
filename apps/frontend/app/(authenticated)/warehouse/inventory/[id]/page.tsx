/**
 * License Plate Detail Page
 * Stories 5.1-5.4: LP Core UI
 * Shows detailed LP information, status history, and genealogy
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LPStatusBadge } from '@/components/warehouse/LPStatusBadge'
import { LPStatusChangeModal } from '@/components/warehouse/LPStatusChangeModal'
import { LPSplitModal } from '@/components/warehouse/LPSplitModal'
import { LPMergeModal } from '@/components/warehouse/LPMergeModal'
import { LPGenealogyTree } from '@/components/warehouse/LPGenealogyTree'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Package,
  MapPin,
  Calendar,
  TrendingUp,
  Printer,
  AlertTriangle,
  GitBranch,
  Split,
  Merge,
} from 'lucide-react'

interface LicensePlate {
  id: string
  lp_number: string
  batch_number?: string
  supplier_batch_number?: string
  product_id: string
  quantity: number
  current_qty: number
  uom: string
  status: 'available' | 'reserved' | 'consumed' | 'shipped' | 'quarantine' | 'recalled' | 'merged' | 'split'
  qa_status: 'pending' | 'passed' | 'failed' | 'on_hold' | null
  location_id?: string
  warehouse_id?: string
  manufacturing_date?: string
  expiry_date?: string
  received_date?: string
  consumed_by_wo_id?: string
  consumed_at?: string
  created_at: string
  updated_at: string
  product?: {
    id: string
    code: string
    name: string
    type: string
    uom: string
  }
  location?: {
    id: string
    code: string
    name: string
  }
  warehouse?: {
    id: string
    code: string
    name: string
  }
}

interface StatusHistory {
  id: string
  movement_type: string
  qty_before: number
  qty_after: number
  notes?: string
  created_at: string
  created_by?: {
    email: string
  }
}

interface GenealogyRecord {
  id: string
  parent_lp?: {
    lp_number: string
  }
  child_lp?: {
    lp_number: string
  }
  quantity_used: number
  work_order?: {
    wo_number: string
  }
}

export default function LPDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const lpId = params.id as string

  const [lp, setLp] = useState<LicensePlate | null>(null)
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([])
  const [genealogy, setGenealogy] = useState<GenealogyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false)
  const [showSplitModal, setShowSplitModal] = useState(false)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  const fetchLP = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/warehouse/license-plates/${lpId}`)
      if (!response.ok) throw new Error('Failed to fetch LP')
      const data = await response.json()
      setLp(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load license plate',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStatusHistory = async () => {
    try {
      const response = await fetch(`/api/warehouse/license-plates/${lpId}/movements`)
      if (response.ok) {
        const data = await response.json()
        setStatusHistory(data.movements || [])
      }
    } catch (error) {
      // Silent fail for non-critical data
    }
  }

  const fetchGenealogy = async () => {
    try {
      const response = await fetch(`/api/warehouse/license-plates/${lpId}/genealogy`)
      if (response.ok) {
        const data = await response.json()
        setGenealogy(data.records || [])
      }
    } catch (error) {
      // Silent fail for non-critical data
    }
  }

  useEffect(() => {
    fetchLP()
    fetchStatusHistory()
    fetchGenealogy()
  }, [lpId])

  const handleStatusChange = () => {
    setShowStatusChangeModal(false)
    fetchLP()
    fetchStatusHistory()
  }

  const handleSplitSuccess = (newLPs: string[]) => {
    setShowSplitModal(false)
    toast({
      title: 'Success',
      description: `Split into ${newLPs.length} license plates: ${newLPs.join(', ')}`,
    })
    router.push('/warehouse/inventory')
  }

  const handleMergeSuccess = (newLP: string) => {
    setShowMergeModal(false)
    toast({
      title: 'Success',
      description: `License plates merged into ${newLP}`,
    })
    router.push('/warehouse/inventory')
  }

  const handlePrintLabel = async () => {
    try {
      const response = await fetch(`/api/warehouse/license-plates/${lpId}/print`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Print failed')
      toast({
        title: 'Success',
        description: 'Label sent to printer',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to print label',
        variant: 'destructive',
      })
    }
  }

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false
    const date = new Date(expiryDate)
    const today = new Date()
    const daysUntilExpiry = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
  }

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">Loading...</div>
      </div>
    )
  }

  if (!lp) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">License plate not found</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6" />
              {lp.lp_number}
            </h1>
            <p className="text-muted-foreground text-sm">License Plate Details</p>
          </div>
          <LPStatusBadge status={lp.status} />
        </div>
        <div className="flex gap-2">
          {lp.status === 'available' && (
            <>
              <Button variant="outline" onClick={() => setShowSplitModal(true)}>
                <Split className="h-4 w-4 mr-2" />
                Split
              </Button>
              <Button variant="outline" onClick={() => setShowMergeModal(true)}>
                <Merge className="h-4 w-4 mr-2" />
                Merge
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => setShowStatusChangeModal(true)}>
            Change Status
          </Button>
          <Button variant="outline" onClick={handlePrintLabel}>
            <Printer className="h-4 w-4 mr-2" />
            Print Label
          </Button>
        </div>
      </div>

      {/* Expiry Warning */}
      {isExpired(lp.expiry_date) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-red-900 font-medium">This license plate has expired</span>
        </div>
      )}
      {!isExpired(lp.expiry_date) && isExpiringSoon(lp.expiry_date) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <span className="text-yellow-900 font-medium">This license plate is expiring soon</span>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Product</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{lp.product?.code}</p>
            <p className="text-sm text-muted-foreground">{lp.product?.name}</p>
            <p className="text-xs text-muted-foreground mt-1">Type: {lp.product?.type}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{lp.current_qty} {lp.uom}</p>
            <p className="text-sm text-muted-foreground">Original: {lp.quantity} {lp.uom}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{lp.warehouse?.code}</p>
            <p className="text-sm text-muted-foreground">{lp.warehouse?.name}</p>
            {lp.location && (
              <p className="text-xs text-muted-foreground mt-1">{lp.location.code}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {lp.received_date && (
              <div>
                <p className="text-xs text-muted-foreground">Received</p>
                <p className="text-sm">{format(new Date(lp.received_date), 'MMM d, yyyy')}</p>
              </div>
            )}
            {lp.expiry_date && (
              <div>
                <p className="text-xs text-muted-foreground">Expires</p>
                <p className={`text-sm ${isExpired(lp.expiry_date) ? 'text-red-600 font-medium' : isExpiringSoon(lp.expiry_date) ? 'text-yellow-600' : ''}`}>
                  {format(new Date(lp.expiry_date), 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="genealogy">
            <GitBranch className="h-4 w-4 mr-1" />
            Genealogy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          {/* Additional Info */}
          {(lp.batch_number || lp.supplier_batch_number || lp.manufacturing_date) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Batch Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                {lp.batch_number && (
                  <div>
                    <p className="text-xs text-muted-foreground">Batch Number</p>
                    <p className="font-medium">{lp.batch_number}</p>
                  </div>
                )}
                {lp.supplier_batch_number && (
                  <div>
                    <p className="text-xs text-muted-foreground">Supplier Batch</p>
                    <p className="font-medium">{lp.supplier_batch_number}</p>
                  </div>
                )}
                {lp.manufacturing_date && (
                  <div>
                    <p className="text-xs text-muted-foreground">Manufacturing Date</p>
                    <p className="font-medium">{format(new Date(lp.manufacturing_date), 'MMM d, yyyy')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* Status History */}
          {statusHistory.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Status History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statusHistory.slice(0, 10).map((item) => (
                    <div key={item.id} className="flex justify-between items-start border-b pb-2">
                      <div>
                        <p className="text-sm font-medium">{item.movement_type}</p>
                        {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.created_at), 'MMM d, yyyy HH:mm')}
                        </p>
                        {item.created_by && (
                          <p className="text-xs text-muted-foreground">{item.created_by.email}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-6 text-muted-foreground">
                No history available
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="genealogy" className="space-y-4">
          <LPGenealogyTree lpId={lpId} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <LPStatusChangeModal
        open={showStatusChangeModal}
        lpId={lpId}
        currentStatus={lp.status}
        onClose={() => setShowStatusChangeModal(false)}
        onSuccess={handleStatusChange}
      />

      <LPSplitModal
        open={showSplitModal}
        lp={lp}
        onClose={() => setShowSplitModal(false)}
        onSuccess={handleSplitSuccess}
      />

      <LPMergeModal
        open={showMergeModal}
        onClose={() => setShowMergeModal(false)}
        onSuccess={handleMergeSuccess}
      />
    </div>
  )
}
