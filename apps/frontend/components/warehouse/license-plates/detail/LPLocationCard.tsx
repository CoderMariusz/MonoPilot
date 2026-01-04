/**
 * LP Location Card Component
 * Story 05.6: LP Detail Page
 *
 * Location section - warehouse, location path
 */

import React from 'react'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { LPFieldLabel } from './LPFieldLabel'

interface LPLocationCardProps {
  warehouse: {
    id: string
    name: string
    code: string
  }
  location: {
    id: string
    full_path: string
  }
}

export function LPLocationCard({ warehouse, location }: LPLocationCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="location-card">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900">Location</h3>
      </div>

      <div className="space-y-4">
        <LPFieldLabel
          label="Warehouse"
          value={
            <Link
              href={`/settings/warehouses/${warehouse.id}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
              data-testid="link-warehouse"
            >
              {warehouse.name} ({warehouse.code})
            </Link>
          }
        />

        <LPFieldLabel
          label="Location"
          value={<span data-testid="location-path">{location.full_path}</span>}
        />
      </div>
    </div>
  )
}
