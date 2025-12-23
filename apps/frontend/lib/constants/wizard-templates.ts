/**
 * Wizard Location Templates
 * Story: 01.14 - Wizard Steps Complete
 * Purpose: Pre-defined location templates for wizard step 3
 *
 * Templates:
 * - Simple: 1 zone (RECEIVING)
 * - Basic: 3 zones (RECEIVING, STORAGE, SHIPPING)
 * - Full: 9 locations with 3-level hierarchy
 * - Custom: User-defined locations
 */

export interface TemplateLocation {
  code: string
  name: string
  level: 'zone' | 'aisle' | 'rack' | 'bin'
  location_type: 'bulk' | 'pallet' | 'shelf' | 'floor' | 'staging'
  parent_code?: string // null for root zones
}

export interface LocationTemplate {
  id: string
  name: string
  description: string
  locations: TemplateLocation[]
}

export const LOCATION_TEMPLATES: LocationTemplate[] = [
  {
    id: 'simple',
    name: 'Simple - 1 Zone',
    description: 'Single location for small operations',
    locations: [
      {
        code: 'RECEIVING',
        name: 'Receiving Area',
        level: 'zone',
        location_type: 'staging',
      },
    ],
  },
  {
    id: 'basic',
    name: 'Basic - 3 Zones',
    description: 'Receiving, Storage, Shipping areas',
    locations: [
      {
        code: 'RECEIVING',
        name: 'Receiving Area',
        level: 'zone',
        location_type: 'staging',
      },
      {
        code: 'STORAGE',
        name: 'Storage Area',
        level: 'zone',
        location_type: 'bulk',
      },
      {
        code: 'SHIPPING',
        name: 'Shipping Area',
        level: 'zone',
        location_type: 'staging',
      },
    ],
  },
  {
    id: 'full',
    name: 'Full - 9 Locations',
    description: '3 zones with aisle and rack structure',
    locations: [
      // Raw Materials Zone
      {
        code: 'RAW-ZONE',
        name: 'Raw Materials',
        level: 'zone',
        location_type: 'bulk',
      },
      {
        code: 'RAW-A1',
        name: 'Raw Aisle 1',
        level: 'aisle',
        location_type: 'pallet',
        parent_code: 'RAW-ZONE',
      },
      {
        code: 'RAW-A1-R1',
        name: 'Raw Rack 1',
        level: 'rack',
        location_type: 'pallet',
        parent_code: 'RAW-A1',
      },
      // Production Zone
      {
        code: 'PROD-ZONE',
        name: 'Production',
        level: 'zone',
        location_type: 'floor',
      },
      {
        code: 'PROD-A1',
        name: 'Prod Aisle 1',
        level: 'aisle',
        location_type: 'floor',
        parent_code: 'PROD-ZONE',
      },
      {
        code: 'PROD-A1-R1',
        name: 'Prod Rack 1',
        level: 'rack',
        location_type: 'shelf',
        parent_code: 'PROD-A1',
      },
      // Finished Goods Zone
      {
        code: 'FG-ZONE',
        name: 'Finished Goods',
        level: 'zone',
        location_type: 'bulk',
      },
      {
        code: 'FG-A1',
        name: 'FG Aisle 1',
        level: 'aisle',
        location_type: 'pallet',
        parent_code: 'FG-ZONE',
      },
      {
        code: 'FG-A1-R1',
        name: 'FG Rack 1',
        level: 'rack',
        location_type: 'pallet',
        parent_code: 'FG-A1',
      },
    ],
  },
]
