/**
 * Location Detail Modal Component
 * Story: 1.6 Location Management
 * Task 8: Location Detail/QR Code Modal (AC-005.6)
 *
 * Modal showing location details with QR code display and print functionality
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Printer, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Location {
  id: string
  warehouse_id: string
  code: string
  name: string
  type: string
  zone: string | null
  zone_enabled: boolean
  capacity: number | null
  capacity_enabled: boolean
  barcode: string
  is_active: boolean
  warehouse?: {
    code: string
    name: string
  }
  qr_code_url?: string
}

interface LocationDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locationId: string | null
}

export function LocationDetailModal({
  open,
  onOpenChange,
  locationId,
}: LocationDetailModalProps) {
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Fetch location detail with QR code
  useEffect(() => {
    const fetchLocation = async () => {
      if (!locationId || !open) return

      try {
        setLoading(true)
        const response = await fetch(`/api/settings/locations/${locationId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch location')
        }

        const data = await response.json()
        setLocation(data.location)
      } catch (error) {
        console.error('Error fetching location:', error)
        toast({
          title: 'Error',
          description: 'Failed to load location details',
          variant: 'destructive',
        })
        onOpenChange(false)
      } finally {
        setLoading(false)
      }
    }

    fetchLocation()
  }, [locationId, open, toast, onOpenChange])

  // Print QR code (AC-005.6)
  const handlePrint = () => {
    if (!location) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast({
        title: 'Error',
        description: 'Failed to open print window. Please allow popups.',
        variant: 'destructive',
      })
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code - ${location.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .label-container {
              text-align: center;
              border: 2px solid #000;
              padding: 20px;
              max-width: 400px;
            }
            h1 {
              font-size: 24px;
              margin: 0 0 10px 0;
            }
            .barcode {
              font-size: 20px;
              font-weight: bold;
              margin: 10px 0;
              font-family: monospace;
            }
            .qr-code {
              margin: 20px 0;
            }
            .details {
              font-size: 14px;
              margin-top: 15px;
              text-align: left;
            }
            .details p {
              margin: 5px 0;
            }
            @media print {
              body {
                background: white;
              }
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <h1>${location.name}</h1>
            <div class="barcode">${location.barcode}</div>
            <div class="qr-code">
              <img src="${location.qr_code_url || ''}" alt="QR Code" style="width: 300px; height: 300px;" />
            </div>
            <div class="details">
              <p><strong>Code:</strong> ${location.code}</p>
              <p><strong>Warehouse:</strong> ${location.warehouse?.name || '-'} (${location.warehouse?.code || '-'})</p>
              <p><strong>Type:</strong> ${location.type.charAt(0).toUpperCase() + location.type.slice(1)}</p>
              ${location.zone_enabled ? `<p><strong>Zone:</strong> ${location.zone || '-'}</p>` : ''}
              ${location.capacity_enabled ? `<p><strong>Capacity:</strong> ${location.capacity?.toFixed(2) || '-'}</p>` : ''}
            </div>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  // Download QR code as PNG (AC-005.6)
  const handleDownload = () => {
    if (!location?.qr_code_url) return

    const link = document.createElement('a')
    link.href = location.qr_code_url
    link.download = `${location.barcode}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Success',
      description: 'QR code downloaded successfully',
    })
  }

  // Get type badge
  const getTypeBadge = (type: string) => {
    const colors: Record<
      string,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      receiving: 'default',
      production: 'secondary',
      storage: 'outline',
      shipping: 'default',
      transit: 'secondary',
      quarantine: 'destructive',
    }

    return (
      <Badge variant={colors[type] || 'default'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="text-center py-8">Loading location details...</div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!location) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{location.name}</span>
            <Badge variant={location.is_active ? 'default' : 'secondary'}>
              {location.is_active ? 'Active' : 'Archived'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Location details and QR code for scanning
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Location Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Code</p>
              <p className="text-lg font-semibold">{location.code}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Type</p>
              <div className="mt-1">{getTypeBadge(location.type)}</div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Warehouse</p>
              <p className="text-base">
                {location.warehouse?.name || '-'} ({location.warehouse?.code || '-'})
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Barcode</p>
              <p className="text-base font-mono">{location.barcode}</p>
            </div>
          </div>

          {/* Optional Fields */}
          {(location.zone_enabled || location.capacity_enabled) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                {location.zone_enabled && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Zone</p>
                    <p className="text-base">{location.zone || '-'}</p>
                  </div>
                )}
                {location.capacity_enabled && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Capacity</p>
                    <p className="text-base">
                      {location.capacity?.toFixed(2) || '-'}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* QR Code Display (AC-005.6) */}
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm font-medium text-gray-500">QR Code</p>
            {location.qr_code_url ? (
              <div className="border-2 border-gray-300 p-4 rounded-lg bg-white">
                <img
                  src={location.qr_code_url}
                  alt={`QR Code for ${location.barcode}`}
                  className="w-64 h-64"
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                QR code not available
              </div>
            )}

            {/* QR Code Actions (AC-005.6) */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrint}
                disabled={!location.qr_code_url}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print Label
              </Button>
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={!location.qr_code_url}
              >
                <Download className="mr-2 h-4 w-4" />
                Download QR
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
