/**
 * Test Fixtures: Locations
 * Story: TD-206, TD-207 - Track C: Locations Filters + Move Feature
 *
 * Comprehensive hierarchical location tree with LP counts
 * for testing location filters, stats, and move operations.
 */

import type { LocationNode } from '@/lib/types/location'

/**
 * Mock Location Data with LP Counts
 *
 * Tree Structure:
 * WH-001 Main Warehouse
 *   └─ ZONE-RAW (Raw Materials)
 *       ├─ A01 (Aisle 01)
 *       │   ├─ R01 (Rack 01) - 3 LPs
 *       │   │   ├─ B001 - 2 LPs
 *       │   │   └─ B002 - 1 LP
 *       │   └─ R02 (Rack 02) - 5 LPs
 *       │       ├─ B003 - 3 LPs
 *       │       └─ B004 - 2 LPs
 *       └─ A02 (Aisle 02)
 *           └─ R03 (Rack 03) - 0 LPs (empty)
 *   └─ ZONE-FG (Finished Goods)
 *       ├─ A03 (Aisle 03)
 *       │   └─ R04 (Rack 04) - 10 LPs
 *       │       ├─ B005 - 5 LPs
 *       │       └─ B006 - 5 LPs
 *       └─ A04 (Aisle 04)
 *           └─ R05 (Rack 05) - 7 LPs
 *               └─ B007 - 7 LPs
 *   └─ ZONE-BULK (Bulk Storage)
 *       └─ FLOOR-01 - 15 LPs (floor location, no children)
 *   └─ ZONE-SHIPPING (Shipping Dock)
 *       └─ DOCK-01 - 0 LPs (empty staging)
 */

export const mockWarehouse = {
  id: 'wh-test-001',
  org_id: 'org-test-123',
  code: 'WH-001',
  name: 'Main Warehouse',
  type: 'GENERAL',
  is_active: true,
}

// Zone: Raw Materials
export const zoneRaw: LocationNode = {
  id: 'loc-zone-raw',
  org_id: 'org-test-123',
  warehouse_id: 'wh-test-001',
  parent_id: null,
  code: 'ZONE-RAW',
  name: 'Raw Materials Zone',
  level: 'zone',
  full_path: 'WH-001/ZONE-RAW',
  depth: 1,
  location_type: 'bulk',
  max_pallets: null,
  max_weight_kg: null,
  current_pallets: 8, // Aggregated from children
  current_weight_kg: 0,
  lp_count: 8, // Total LPs in this zone
  is_active: true,
  children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

// Aisle A01 under ZONE-RAW
export const aisleA01: LocationNode = {
  id: 'loc-aisle-a01',
  org_id: 'org-test-123',
  warehouse_id: 'wh-test-001',
  parent_id: 'loc-zone-raw',
  code: 'A01',
  name: 'Aisle 01',
  level: 'aisle',
  full_path: 'WH-001/ZONE-RAW/A01',
  depth: 2,
  location_type: 'pallet',
  max_pallets: null,
  max_weight_kg: null,
  current_pallets: 8,
  current_weight_kg: 0,
  lp_count: 8,
  is_active: true,
  children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

// Rack R01 under A01
export const rackR01: LocationNode = {
  id: 'loc-rack-r01',
  org_id: 'org-test-123',
  warehouse_id: 'wh-test-001',
  parent_id: 'loc-aisle-a01',
  code: 'R01',
  name: 'Rack 01',
  level: 'rack',
  full_path: 'WH-001/ZONE-RAW/A01/R01',
  depth: 3,
  location_type: 'shelf',
  max_pallets: 10,
  max_weight_kg: 2000,
  current_pallets: 3,
  current_weight_kg: 750,
  lp_count: 3,
  is_active: true,
  children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

// Bin B001 under R01
export const binB001: LocationNode = {
  id: 'loc-bin-b001',
  org_id: 'org-test-123',
  warehouse_id: 'wh-test-001',
  parent_id: 'loc-rack-r01',
  code: 'B001',
  name: 'Bin 001',
  level: 'bin',
  full_path: 'WH-001/ZONE-RAW/A01/R01/B001',
  depth: 4,
  location_type: 'shelf',
  max_pallets: 4,
  max_weight_kg: 500,
  current_pallets: 2,
  current_weight_kg: 200,
  lp_count: 2,
  is_active: true,
  children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

// Bin B002 under R01
export const binB002: LocationNode = {
  id: 'loc-bin-b002',
  org_id: 'org-test-123',
  warehouse_id: 'wh-test-001',
  parent_id: 'loc-rack-r01',
  code: 'B002',
  name: 'Bin 002',
  level: 'bin',
  full_path: 'WH-001/ZONE-RAW/A01/R01/B002',
  depth: 4,
  location_type: 'shelf',
  max_pallets: 4,
  max_weight_kg: 500,
  current_pallets: 1,
  current_weight_kg: 100,
  lp_count: 1,
  is_active: true,
  children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

// Rack R02 under A01
export const rackR02: LocationNode = {
  id: 'loc-rack-r02',
  org_id: 'org-test-123',
  warehouse_id: 'wh-test-001',
  parent_id: 'loc-aisle-a01',
  code: 'R02',
  name: 'Rack 02',
  level: 'rack',
  full_path: 'WH-001/ZONE-RAW/A01/R02',
  depth: 3,
  location_type: 'shelf',
  max_pallets: 10,
  max_weight_kg: 2000,
  current_pallets: 5,
  current_weight_kg: 1250,
  lp_count: 5,
  is_active: true,
  children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

// Bin B003 under R02
export const binB003: LocationNode = {
  id: 'loc-bin-b003',
  org_id: 'org-test-123',
  warehouse_id: 'wh-test-001',
  parent_id: 'loc-rack-r02',
  code: 'B003',
  name: 'Bin 003',
  level: 'bin',
  full_path: 'WH-001/ZONE-RAW/A01/R02/B003',
  depth: 4,
  location_type: 'shelf',
  max_pallets: 4,
  max_weight_kg: 500,
  current_pallets: 3,
  current_weight_kg: 300,
  lp_count: 3,
  is_active: true,
  children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

// Bin B004 under R02
export const binB004: LocationNode = {
  id: 'loc-bin-b004',
  org_id: 'org-test-123',
  warehouse_id: 'wh-test-001',
  parent_id: 'loc-rack-r02',
  code: 'B004',
  name: 'Bin 004',
  level: 'bin',
  full_path: 'WH-001/ZONE-RAW/A01/R02/B004',
  depth: 4,
  location_type: 'shelf',
  max_pallets: 4,
  max_weight_kg: 500,
  current_pallets: 2,
  current_weight_kg: 200,
  lp_count: 2,
  is_active: true,
  children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

// Aisle A02 under ZONE-RAW
export const aisleA02: LocationNode = {
  id: 'loc-aisle-a02',
  org_id: 'org-test-123',
  warehouse_id: 'wh-test-001',
  parent_id: 'loc-zone-raw',
  code: 'A02',
  name: 'Aisle 02',
  level: 'aisle',
  full_path: 'WH-001/ZONE-RAW/A02',
  depth: 2,
  location_type: 'pallet',
  max_pallets: null,
  max_weight_kg: null,
  current_pallets: 0,
  current_weight_kg: 0,
  lp_count: 0,
  is_active: true,
  children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

// Rack R03 under A02 (empty)
export const rackR03: LocationNode = {
  id: 'loc-rack-r03',
  org_id: 'org-test-123',
  warehouse_id: 'wh-test-001',
  parent_id: 'loc-aisle-a02',
  code: 'R03',
  name: 'Rack 03',
  level: 'rack',
  full_path: 'WH-001/ZONE-RAW/A02/R03',
  depth: 3,
  location_type: 'shelf',
  max_pallets: 10,
  max_weight_kg: 2000,
  current_pallets: 0,
  current_weight_kg: 0,
  lp_count: 0,
  is_active: true,
  children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

// Zone: Finished Goods
export const zoneFG: LocationNode = {
  id: 'loc-zone-fg',
  org_id: 'org-test-123',
  warehouse_id: 'wh-test-001',
  parent_id: null,
  code: 'ZONE-FG',
  name: 'Finished Goods Zone',
  level: 'zone',
  full_path: 'WH-001/ZONE-FG',
  depth: 1,
  location_type: 'pallet',
  max_pallets: null,
  max_weight_kg: null,
  current_pallets: 17,
  current_weight_kg: 0,
  lp_count: 17,
  is_active: true,
  children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

// Aisle A03 under ZONE-FG
export const aisleA03: LocationNode = {
  id: 'loc-aisle-a03',
  org_id: 'org-test-123',
  warehouse_id: 'wh-test-001',
  parent_id: 'loc-zone-fg',
  code: 'A03',
  name: 'Aisle 03',
  level: 'aisle',
  full_path: 'WH-001/ZONE-FG/A03',
  depth: 2,
  location_type: 'pallet',
  max_pallets: null,
  max_weight_kg: null,
  current_pallets: 10,
  current_weight_kg: 0,
  lp_count: 10,
  is_active: true,
  children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

// Rack R04 under A03
export const rackR04: LocationNode = {
  id: 'loc-rack-r04',
  org_id: 'org-test-123',
  warehouse_id: 'wh-test-001',
  parent_id: 'loc-aisle-a03',
  code: 'R04',
  name: 'Rack 04',
  level: 'rack',
  full_path: 'WH-001/ZONE-FG/A03/R04',
  depth: 3,
  location_type: 'shelf',
  max_pallets: 20,
  max_weight_kg: 4000,
  current_pallets: 10,
  current_weight_kg: 2500,
  lp_count: 10,
  is_active: true,
  children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

// Bin B005 under R04
export const binB005: LocationNode = {
  id: 'loc-bin-b005',
  org_id: 'org-test-123',
  warehouse_id: 'wh-test-001',
  parent_id: 'loc-rack-r04',
  code: 'B005',
  name: 'Bin 005',
  level: 'bin',
  full_path: 'WH-001/ZONE-FG/A03/R04/B005',
  depth: 4,
  location_type: 'shelf',
  max_pallets: 10,
  max_weight_kg: 1000,
  current_pallets: 5,
  current_weight_kg: 500,
  lp_count: 5,
  is_active: true,
  children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

// Bin B006 under R04
export const binB006: LocationNode = {
  id: 'loc-bin-b006',
  org_id: 'org-test-123',
  warehouse_id: 'wh-test-001',
  parent_id: 'loc-rack-r04',
  code: 'B006',
  name: 'Bin 006',
  level: 'bin',
  full_path: 'WH-001/ZONE-FG/A03/R04/B006',
  depth: 4,
  location_type: 'shelf',
  max_pallets: 10,
  max_weight_kg: 1000,
  current_pallets: 5,
  current_weight_kg: 500,
  lp_count: 5,
  is_active: true,
  children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

// Aisle A04 under ZONE-FG
export const aisleA04: LocationNode = {
  id: 'loc-aisle-a04',
  org_id: 'org-test-123',
  warehouse_id: 'wh-test-001',
  parent_id: 'loc-zone-fg',
  code: 'A04',
  name: 'Aisle 04',
  level: 'aisle',
  full_path: 'WH-001/ZONE-FG/A04',
  depth: 2,
  location_type: 'pallet',
  max_pallets: null,
  max_weight_kg: null,
  current_pallets: 7,
  current_weight_kg: 0,
  lp_count: 7,
  is_active: true,
  children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

// Rack R05 under A04
export const rackR05: LocationNode = {
  id: 'loc-rack-r05',
  org_id: 'org-test-123',
  warehouse_id: 'wh-test-001',
  parent_id: 'loc-aisle-a04',
  code: 'R05',
  name: 'Rack 05',
  level: 'rack',
  full_path: 'WH-001/ZONE-FG/A04/R05',
  depth: 3,
  location_type: 'shelf',
  max_pallets: 10,
  max_weight_kg: 2000,
  current_pallets: 7,
  current_weight_kg: 1750,
  lp_count: 7,
  is_active: true,
  children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

// Bin B007 under R05
export const binB007: LocationNode = {
  id: 'loc-bin-b007',
  org_id: 'org-test-123',
  warehouse_id: 'wh-test-001',
  parent_id: 'loc-rack-r05',
  code: 'B007',
  name: 'Bin 007',
  level: 'bin',
  full_path: 'WH-001/ZONE-FG/A04/R05/B007',
  depth: 4,
  location_type: 'shelf',
  max_pallets: 10,
  max_weight_kg: 1000,
  current_pallets: 7,
  current_weight_kg: 700,
  lp_count: 7,
  is_active: true,
  children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

// Zone: Bulk Storage (no hierarchy, direct floor location)
export const zoneBulk: LocationNode = {
  id: 'loc-zone-bulk',
  org_id: 'org-test-123',
  warehouse_id: 'wh-test-001',
  parent_id: null,
  code: 'ZONE-BULK',
  name: 'Bulk Storage Zone',
  level: 'zone',
  full_path: 'WH-001/ZONE-BULK',
  depth: 1,
  location_type: 'bulk',
  max_pallets: 100,
  max_weight_kg: 20000,
  current_pallets: 15,
  current_weight_kg: 3750,
  lp_count: 15,
  is_active: true,
  children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

// Floor location under ZONE-BULK
export const floorLocation: LocationNode = {
  id: 'loc-floor-01',
  org_id: 'org-test-123',
  warehouse_id: 'wh-test-001',
  parent_id: 'loc-zone-bulk',
  code: 'FLOOR-01',
  name: 'Floor Location 01',
  level: 'aisle', // Using aisle level for floor locations
  full_path: 'WH-001/ZONE-BULK/FLOOR-01',
  depth: 2,
  location_type: 'bulk',
  max_pallets: 100,
  max_weight_kg: 20000,
  current_pallets: 15,
  current_weight_kg: 3750,
  lp_count: 15,
  is_active: true,
  children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

// Zone: Shipping (empty staging area)
export const zoneShipping: LocationNode = {
  id: 'loc-zone-shipping',
  org_id: 'org-test-123',
  warehouse_id: 'wh-test-001',
  parent_id: null,
  code: 'ZONE-SHIPPING',
  name: 'Shipping Dock',
  level: 'zone',
  full_path: 'WH-001/ZONE-SHIPPING',
  depth: 1,
  location_type: 'staging',
  max_pallets: 50,
  max_weight_kg: 10000,
  current_pallets: 0,
  current_weight_kg: 0,
  lp_count: 0,
  is_active: true,
  children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

// Dock location under ZONE-SHIPPING
export const dockLocation: LocationNode = {
  id: 'loc-dock-01',
  org_id: 'org-test-123',
  warehouse_id: 'wh-test-001',
  parent_id: 'loc-zone-shipping',
  code: 'DOCK-01',
  name: 'Dock 01',
  level: 'aisle',
  full_path: 'WH-001/ZONE-SHIPPING/DOCK-01',
  depth: 2,
  location_type: 'staging',
  max_pallets: 50,
  max_weight_kg: 10000,
  current_pallets: 0,
  current_weight_kg: 0,
  lp_count: 0,
  is_active: true,
  children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

/**
 * Build hierarchical tree structure
 */
export function buildLocationTree(): LocationNode[] {
  // Build R01 with bins
  const r01WithBins: LocationNode = {
    ...rackR01,
    children: [binB001, binB002],
  }

  // Build R02 with bins
  const r02WithBins: LocationNode = {
    ...rackR02,
    children: [binB003, binB004],
  }

  // Build A01 with racks
  const a01WithRacks: LocationNode = {
    ...aisleA01,
    children: [r01WithBins, r02WithBins],
  }

  // Build R03 (empty)
  const r03Empty: LocationNode = {
    ...rackR03,
    children: [],
  }

  // Build A02 with R03
  const a02WithRack: LocationNode = {
    ...aisleA02,
    children: [r03Empty],
  }

  // Build ZONE-RAW with aisles
  const zoneRawWithChildren: LocationNode = {
    ...zoneRaw,
    children: [a01WithRacks, a02WithRack],
  }

  // Build R04 with bins
  const r04WithBins: LocationNode = {
    ...rackR04,
    children: [binB005, binB006],
  }

  // Build A03 with R04
  const a03WithRack: LocationNode = {
    ...aisleA03,
    children: [r04WithBins],
  }

  // Build R05 with bin
  const r05WithBin: LocationNode = {
    ...rackR05,
    children: [binB007],
  }

  // Build A04 with R05
  const a04WithRack: LocationNode = {
    ...aisleA04,
    children: [r05WithBin],
  }

  // Build ZONE-FG with aisles
  const zoneFGWithChildren: LocationNode = {
    ...zoneFG,
    children: [a03WithRack, a04WithRack],
  }

  // Build ZONE-BULK with floor location
  const zoneBulkWithFloor: LocationNode = {
    ...zoneBulk,
    children: [floorLocation],
  }

  // Build ZONE-SHIPPING with dock
  const zoneShippingWithDock: LocationNode = {
    ...zoneShipping,
    children: [dockLocation],
  }

  return [zoneRawWithChildren, zoneFGWithChildren, zoneBulkWithFloor, zoneShippingWithDock]
}

/**
 * Summary Statistics for Test Warehouse
 */
export const expectedStats = {
  total_locations: 25, // 4 zones + 5 aisles + 5 racks + 7 bins + 2 floor/dock + 2 extra
  total_lp_count: 40, // Sum of all LPs
  locations_with_lps: 17, // Locations that have LP count > 0
  empty_locations: 8, // Locations with LP count = 0
  by_type: {
    bulk: { count: 3, lp_count: 23 }, // ZONE-BULK + children
    pallet: { count: 7, lp_count: 17 }, // ZONE-FG + aisles
    shelf: { count: 12, lp_count: 25 }, // Racks + bins
    staging: { count: 2, lp_count: 0 }, // ZONE-SHIPPING + dock
  },
}

/**
 * Export all fixtures
 */
export const locationFixtures = {
  warehouse: mockWarehouse,
  tree: buildLocationTree(),
  stats: expectedStats,
  // Individual locations for targeted testing
  locations: {
    zoneRaw,
    aisleA01,
    rackR01,
    binB001,
    binB002,
    rackR02,
    binB003,
    binB004,
    aisleA02,
    rackR03,
    zoneFG,
    aisleA03,
    rackR04,
    binB005,
    binB006,
    aisleA04,
    rackR05,
    binB007,
    zoneBulk,
    floorLocation,
    zoneShipping,
    dockLocation,
  },
}

/**
 * Helper: Get all locations as flat array
 */
export function getFlatLocations(): LocationNode[] {
  const result: LocationNode[] = []

  const flatten = (nodes: LocationNode[]) => {
    nodes.forEach(node => {
      result.push(node)
      if (node.children && node.children.length > 0) {
        flatten(node.children)
      }
    })
  }

  flatten(buildLocationTree())
  return result
}

/**
 * Helper: Get locations by type
 */
export function getLocationsByType(type: string): LocationNode[] {
  return getFlatLocations().filter(loc => loc.location_type === type)
}

/**
 * Helper: Get locations with LPs only
 */
export function getLocationsWithLPs(): LocationNode[] {
  return getFlatLocations().filter(loc => (loc.lp_count ?? 0) > 0)
}

/**
 * Helper: Get empty locations
 */
export function getEmptyLocations(): LocationNode[] {
  return getFlatLocations().filter(loc => (loc.lp_count ?? 0) === 0)
}
