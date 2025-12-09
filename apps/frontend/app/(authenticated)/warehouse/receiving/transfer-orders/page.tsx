/**
 * Transfer Orders Receiving Page - Story 5.33
 * Desktop UI for receiving goods from Transfer Orders
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { PackageCheck, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TOListForReceiving } from '@/components/warehouse/TOListForReceiving'
import { ReceiveFromTOModal } from '@/components/warehouse/ReceiveFromTOModal'
import type { SourceDocument, ReceiveFromTOResult } from '@/lib/types/receiving'

export default function TransferOrdersReceivingPage() {
  const { toast } = useToast()

  const [documents, setDocuments] = useState<SourceDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTO, setSelectedTO] = useState<SourceDocument | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetchTransferOrders()
  }, [])

  const fetchTransferOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/warehouse/source-documents/to')
      if (!response.ok) throw new Error('Failed to fetch Transfer Orders')

      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load Transfer Orders',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReceive = (to: SourceDocument) => {
    setSelectedTO(to)
    setModalOpen(true)
  }

  const handleReceiveSuccess = (result: ReceiveFromTOResult) => {
    toast({
      title: 'Transfer Order Received',
      description: `Successfully received ${result.lp_count} license plates. Status: ${result.to_status}`,
    })

    // Refresh list
    fetchTransferOrders()
    setModalOpen(false)
    setSelectedTO(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <PackageCheck className="h-8 w-8" />
            Receive from Transfer Orders
          </h1>
          <p className="text-muted-foreground mt-1">
            Receive goods from Transfer Orders in &quot;Shipped&quot; status
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchTransferOrders}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Transfer Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Transfer Orders Ready for Receiving</CardTitle>
          <CardDescription>
            Click on a row to expand and view items, then click &quot;Receive&quot; to process
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <TOListForReceiving documents={documents} onReceive={handleReceive} />
          )}
        </CardContent>
      </Card>

      {/* Receive Modal */}
      <ReceiveFromTOModal
        open={modalOpen}
        to={selectedTO}
        onClose={() => {
          setModalOpen(false)
          setSelectedTO(null)
        }}
        onSuccess={handleReceiveSuccess}
      />
    </div>
  )
}
