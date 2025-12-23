/**
 * Warehouse Card Component
 * Story: 1.5 Warehouse Configuration
 * AC-004.7: Card view for warehouses
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Archive, CheckCircle, MapPin } from 'lucide-react'
import type { Warehouse } from '@/lib/validation/warehouse-schemas'

interface WarehouseCardProps {
  warehouse: Warehouse
  onEdit: (warehouse: Warehouse) => void
  onToggleActive: (warehouse: Warehouse) => void
}

export function WarehouseCard({ warehouse, onEdit, onToggleActive }: WarehouseCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{warehouse.code}</h3>
            <p className="text-sm text-gray-600 mt-1">{warehouse.name}</p>
          </div>
          <Badge variant={warehouse.is_active ? 'default' : 'secondary'}>
            {warehouse.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Address */}
          {warehouse.address && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-600">{warehouse.address}</p>
            </div>
          )}

          {/* Default Locations */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase">Default Locations</p>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Receiving:</span>
                <span className="font-medium">
                  {warehouse.default_receiving_location?.code || (
                    <span className="text-gray-400 italic">Not set</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-medium">
                  {warehouse.default_shipping_location?.code || (
                    <span className="text-gray-400 italic">Not set</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Transit:</span>
                <span className="font-medium">
                  {warehouse.transit_location?.code || (
                    <span className="text-gray-400 italic">Not set</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(warehouse)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onToggleActive(warehouse)}
          >
            {warehouse.is_active ? (
              <>
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Activate
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
