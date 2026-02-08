import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'
import type {
  CreateLocationInput as BaseCreateLocationInput,
  UpdateLocationInput as BaseUpdateLocationInput,
  LocationListParams as BaseLocationFilters,
  LocationLevel,
} from '../validation/location-schemas'
import type {
  Location as HierarchicalLocation,
  LocationNode,
  LocationTreeResponse,
  CanDeleteResult,
  MoveValidationResult,
} from '../types/location'

// Extended filters type with additional fields
type LocationFilters = BaseLocationFilters & {
  warehouse_id?: string
  is_active?: boolean
}

// Extended input type for hierarchical locations (Story 01.9)
type CreateLocationInput = BaseCreateLocationInput & {
  warehouse_id?: string
}

// Extended update input type
type UpdateLocationInput = BaseUpdateLocationInput

/**
 * Location Management Service
 * Story: 01.9 - Warehouse Locations Management (Hierarchical)
 *
 * Handles hierarchical location CRUD operations with tree structure
 * Supports: zone > aisle > rack > bin hierarchy
 */

// Re-export Location type from types/location for consistency
export type { HierarchicalLocation as Location }

export interface LocationServiceResult {
  success: boolean
  data?: HierarchicalLocation
  error?: string
}

export interface LocationsListResult {
  success: boolean
  data?: HierarchicalLocation[]
  error?: string
}

export interface LocationTreeResult {
  success: boolean
  data?: LocationTreeResponse
  error?: string
}

export interface DeleteResult {
  success: boolean
  error?: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Valid hierarchy: what level can be under what parent level */
const HIERARCHY_RULES: Record<string, string> = {
  zone: 'aisle',
  aisle: 'rack',
  rack: 'bin',
}

/** Human-readable names for hierarchy error messages */
const LEVEL_CHILD_NAMES: Record<string, string> = {
  zone: 'aisles',
  aisle: 'racks',
  rack: 'bins',
  bin: 'nothing (bins are leaf nodes)',
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate capacity percentage for a location
 */
function calculateCapacityPercent(currentPallets: number, maxPallets: number | null): number | null {
  if (!maxPallets || maxPallets === 0) return null
  return Math.round((currentPallets / maxPallets) * 100)
}

/**
 * Convert raw location data to LocationNode with computed fields
 */
function toLocationNode(loc: HierarchicalLocation): LocationNode {
  return {
    ...loc,
    children: [],
    children_count: 0,
    capacity_percent: calculateCapacityPercent(loc.current_pallets, loc.max_pallets),
  }
}

/**
 * Build tree structure from flat location array
 * Returns root nodes with nested children
 */
function buildLocationTree(locations: HierarchicalLocation[]): LocationNode[] {
  const locationMap = new Map<string, LocationNode>()
  const rootNodes: LocationNode[] = []

  // First pass: create nodes
  for (const loc of locations) {
    locationMap.set(loc.id, toLocationNode(loc))
  }

  // Second pass: build hierarchy
  for (const loc of locations) {
    const node = locationMap.get(loc.id)!
    if (loc.parent_id && locationMap.has(loc.parent_id)) {
      const parent = locationMap.get(loc.parent_id)!
      parent.children.push(node)
      parent.children_count = (parent.children_count || 0) + 1
    } else if (!loc.parent_id) {
      rootNodes.push(node)
    }
  }

  return rootNodes
}

/**
 * Get subtree starting from a specific node
 */
function getSubtree(locationMap: Map<string, LocationNode>, parentId: string): LocationNode[] {
  const subtreeRoot = locationMap.get(parentId)
  return subtreeRoot ? [subtreeRoot] : []
}

// =============================================================================
// HIERARCHICAL TREE OPERATIONS (Story 01.9)
// =============================================================================

/**
 * Get location tree for a warehouse
 * Returns nested structure with children
 *
 * @param warehouseId - Warehouse UUID
 * @param orgId - Organization ID from JWT
 * @param parentId - Optional parent ID to get subtree
 */
export async function getTree(
  warehouseId: string,
  orgId: string,
  parentId?: string | null
): Promise<LocationTreeResult> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Fetch all locations for the warehouse
    const { data: locations, error } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('org_id', orgId)
      .eq('warehouse_id', warehouseId)
      .order('full_path', { ascending: true })

    if (error) {
      console.error('Failed to fetch location tree:', error)
      return { success: false, error: 'Failed to fetch location tree' }
    }

    const typedLocations = (locations || []) as HierarchicalLocation[]

    // Build tree and optionally get subtree
    const rootNodes = buildLocationTree(typedLocations)
    let resultNodes = rootNodes

    if (parentId) {
      // Create map for subtree lookup
      const locationMap = new Map<string, LocationNode>()
      for (const loc of typedLocations) {
        locationMap.set(loc.id, toLocationNode(loc))
      }
      // Rebuild to get the node with children
      const fullTree = buildLocationTree(typedLocations)
      const findNode = (nodes: LocationNode[], id: string): LocationNode | null => {
        for (const node of nodes) {
          if (node.id === id) return node
          const found = findNode(node.children, id)
          if (found) return found
        }
        return null
      }
      const subtreeRoot = findNode(fullTree, parentId)
      resultNodes = subtreeRoot ? [subtreeRoot] : []
    }

    return {
      success: true,
      data: {
        locations: resultNodes,
        total_count: typedLocations.length,
      },
    }
  } catch (error) {
    console.error('Error in getTree:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get ancestors (parent chain) for a location
 *
 * @param locationId - Location UUID
 * @param orgId - Organization ID from JWT
 */
export async function getAncestors(
  locationId: string,
  orgId: string
): Promise<LocationsListResult> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    const ancestors: HierarchicalLocation[] = []
    let currentId: string | null = locationId

    // Walk up the tree
    while (currentId) {
      const { data: locationData, error } = await supabaseAdmin
        .from('locations')
        .select('*')
        .eq('id', currentId)
        .eq('org_id', orgId)
        .single()

      if (error || !locationData) break

      const typedLocation = locationData as HierarchicalLocation

      if (currentId !== locationId) {
        ancestors.unshift(typedLocation) // Add to front
      }
      currentId = typedLocation.parent_id
    }

    return { success: true, data: ancestors }
  } catch (error) {
    console.error('Error in getAncestors:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get descendants (all children recursively) for a location
 *
 * @param locationId - Location UUID
 * @param orgId - Organization ID from JWT
 */
export async function getDescendants(
  locationId: string,
  orgId: string
): Promise<LocationsListResult> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Get the location's full_path
    const { data: location, error: locError } = await supabaseAdmin
      .from('locations')
      .select('full_path')
      .eq('id', locationId)
      .eq('org_id', orgId)
      .single()

    if (locError || !location) {
      return { success: false, error: 'Location not found' }
    }

    // Get all descendants by matching full_path prefix
    const { data: descendants, error } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('org_id', orgId)
      .like('full_path', `${location.full_path}/%`)
      .order('full_path', { ascending: true })

    if (error) {
      console.error('Failed to fetch descendants:', error)
      return { success: false, error: 'Failed to fetch descendants' }
    }

    return { success: true, data: (descendants || []) as HierarchicalLocation[] }
  } catch (error) {
    console.error('Error in getDescendants:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Move a location to a new parent
 * Validates hierarchy rules before moving
 *
 * @param locationId - Location UUID to move
 * @param newParentId - New parent location UUID (null for root)
 * @param userId - User making the change
 * @param orgId - Organization ID from JWT
 */
export async function moveLocation(
  locationId: string,
  newParentId: string | null,
  userId: string,
  orgId: string
): Promise<LocationServiceResult> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Get current location
    const { data: location, error: locError } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .eq('org_id', orgId)
      .single()

    if (locError || !location) {
      return { success: false, error: 'Location not found' }
    }

    // Validate hierarchy
    const validationResult = await validateHierarchy(
      newParentId,
      location.level as LocationLevel,
      orgId
    )

    if (!validationResult.valid) {
      return { success: false, error: validationResult.reason || 'Invalid hierarchy' }
    }

    // Check for circular reference
    if (newParentId) {
      const { data: descendants } = await supabaseAdmin
        .from('locations')
        .select('id')
        .eq('org_id', orgId)
        .like('full_path', `${location.full_path}/%`)

      const descendantIds = (descendants || []).map((d) => d.id)
      if (descendantIds.includes(newParentId)) {
        return { success: false, error: 'Cannot move location under its own descendant' }
      }
    }

    // Update location
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('locations')
      .update({
        parent_id: newParentId,
        updated_by: userId,
      })
      .eq('id', locationId)
      .eq('org_id', orgId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to move location:', updateError)
      return { success: false, error: 'Failed to move location' }
    }

    return { success: true, data: updated as HierarchicalLocation }
  } catch (error) {
    console.error('Error in moveLocation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Validate hierarchy rules for parent-child relationship
 *
 * @param parentId - Parent location UUID (null for root)
 * @param level - Level of the child location
 * @param orgId - Organization ID from JWT
 */
export async function validateHierarchy(
  parentId: string | null,
  level: LocationLevel,
  orgId: string
): Promise<MoveValidationResult> {
  try {
    // Root locations must be zones
    if (!parentId) {
      if (level !== 'zone') {
        return {
          valid: false,
          can_move: false,
          reason: 'Root locations must be zones',
          conflicts: [
            {
              type: 'LEVEL_MISMATCH',
              message: 'Root locations must be zones',
              blocking: true,
            },
          ],
          warnings: [],
        }
      }
      return { valid: true, can_move: true, conflicts: [], warnings: [] }
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Get parent location
    const { data: parent, error } = await supabaseAdmin
      .from('locations')
      .select('level')
      .eq('id', parentId)
      .eq('org_id', orgId)
      .single()

    if (error || !parent) {
      return {
        valid: false,
        can_move: false,
        reason: 'Parent location not found',
        conflicts: [],
        warnings: [],
      }
    }

    // Validate hierarchy: zone > aisle > rack > bin
    const expectedLevel = HIERARCHY_RULES[parent.level as string]
    if (!expectedLevel || expectedLevel !== level) {
      return {
        valid: false,
        can_move: false,
        reason: `Locations under ${parent.level}s must be ${LEVEL_CHILD_NAMES[parent.level as string] || 'invalid'}`,
        conflicts: [
          {
            type: 'LEVEL_MISMATCH',
            message: `Invalid hierarchy: ${level} cannot be under ${parent.level}`,
            blocking: true,
          },
        ],
        warnings: [],
      }
    }

    return { valid: true, can_move: true, conflicts: [], warnings: [] }
  } catch (error) {
    console.error('Error in validateHierarchy:', error)
    return {
      valid: false,
      can_move: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
      conflicts: [],
      warnings: [],
    }
  }
}

/**
 * Check if a location can be deleted
 * Returns reason if deletion is blocked
 *
 * @param locationId - Location UUID
 * @param orgId - Organization ID from JWT
 */
export async function canDelete(
  locationId: string,
  orgId: string
): Promise<CanDeleteResult> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check for children
    const { data: children, error: childError } = await supabaseAdmin
      .from('locations')
      .select('id')
      .eq('parent_id', locationId)
      .eq('org_id', orgId)
      .limit(1)

    if (childError) {
      console.error('Error checking children:', childError)
      return { can: false, reason: 'HAS_CHILDREN' }
    }

    if (children && children.length > 0) {
      return { can: false, reason: 'HAS_CHILDREN' }
    }

    // Check for inventory (license plates)
    const { data: lps, error: lpError } = await supabaseAdmin
      .from('license_plates')
      .select('id')
      .eq('location_id', locationId)
      .limit(1)

    // If table doesn't exist or no data, allow deletion
    if (!lpError && lps && lps.length > 0) {
      const { count } = await supabaseAdmin
        .from('license_plates')
        .select('id', { count: 'exact', head: true })
        .eq('location_id', locationId)

      return { can: false, reason: 'HAS_INVENTORY', count: count || 0 }
    }

    return { can: true }
  } catch (error) {
    console.error('Error in canDelete:', error)
    return { can: false }
  }
}

// =============================================================================
// ORIGINAL CRUD OPERATIONS (updated for hierarchical schema)
// =============================================================================

/**
 * Creates a new hierarchical location
 * Story: 01.9 - Warehouse Locations Management
 *
 * Validates hierarchy rules and code uniqueness
 *
 * @param warehouseId - Warehouse UUID
 * @param input - CreateLocationInput from form
 * @param userId - UUID of current user (for created_by)
 * @param orgId - Organization ID from JWT
 * @returns LocationServiceResult with created location
 */
export async function createLocation(
  warehouseId: string,
  input: CreateLocationInput,
  userId: string,
  orgId: string
): Promise<LocationServiceResult> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Step 1: Validate warehouse exists and belongs to org
    const { data: warehouse, error: warehouseError } = await supabaseAdmin
      .from('warehouses')
      .select('id, code')
      .eq('id', warehouseId)
      .eq('org_id', orgId)
      .single()

    if (warehouseError || !warehouse) {
      console.error('Warehouse not found:', warehouseError)
      return { success: false, error: 'Warehouse not found' }
    }

    // Step 2: Validate code uniqueness within warehouse
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('locations')
      .select('id')
      .eq('org_id', orgId)
      .eq('warehouse_id', warehouseId)
      .eq('code', input.code)
      .limit(1)

    if (checkError) {
      console.error('Error checking location code uniqueness:', checkError)
      return { success: false, error: 'Failed to validate location code' }
    }

    if (existing && existing.length > 0) {
      return {
        success: false,
        error: `Location code "${input.code}" already exists in this warehouse`,
      }
    }

    // Step 3: Validate hierarchy rules
    const validationResult = await validateHierarchy(
      input.parent_id || null,
      input.level,
      orgId
    )

    if (!validationResult.valid) {
      return { success: false, error: validationResult.reason || 'Invalid hierarchy' }
    }

    // Step 4: If parent specified, verify it belongs to same warehouse
    if (input.parent_id) {
      const { data: parent, error: parentError } = await supabaseAdmin
        .from('locations')
        .select('warehouse_id')
        .eq('id', input.parent_id)
        .eq('org_id', orgId)
        .single()

      if (parentError || !parent) {
        return { success: false, error: 'Parent location not found' }
      }

      if (parent.warehouse_id !== warehouseId) {
        return { success: false, error: 'Parent location must be in the same warehouse' }
      }
    }

    // Step 5: Insert location record
    const { data: location, error: insertError } = await supabaseAdmin
      .from('locations')
      .insert({
        org_id: orgId,
        warehouse_id: warehouseId,
        parent_id: input.parent_id || null,
        code: input.code,
        name: input.name,
        description: input.description || null,
        level: input.level,
        location_type: input.location_type || 'shelf',
        max_pallets: input.max_pallets || null,
        max_weight_kg: input.max_weight_kg || null,
        is_active: input.is_active ?? true,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single()

    if (insertError || !location) {
      console.error('Failed to insert location:', insertError)
      // Check for specific database errors
      if (insertError?.message?.includes('Root locations must be zones')) {
        return { success: false, error: 'Root locations must be zones' }
      }
      if (insertError?.message?.includes('must be')) {
        return { success: false, error: insertError.message }
      }
      return { success: false, error: 'Failed to create location' }
    }

    console.log(`Location created: ${location.id} (${location.code})`)

    return { success: true, data: location as HierarchicalLocation }
  } catch (error) {
    console.error('Error in createLocation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Updates an existing hierarchical location
 * Story: 01.9 - Warehouse Locations Management
 *
 * Note: code, level, parent_id are immutable (cannot be changed)
 *
 * @param warehouseId - Warehouse UUID
 * @param id - Location UUID
 * @param input - UpdateLocationInput from form
 * @param userId - UUID of current user (for updated_by)
 * @param orgId - Organization ID from JWT
 * @returns LocationServiceResult with updated location
 */
export async function updateLocation(
  warehouseId: string,
  id: string,
  input: UpdateLocationInput,
  userId: string,
  orgId: string
): Promise<LocationServiceResult> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Step 1: Verify location exists and belongs to org/warehouse
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .eq('warehouse_id', warehouseId)
      .single()

    if (fetchError || !existing) {
      console.error('Location not found:', fetchError)
      return { success: false, error: 'Location not found' }
    }

    // Step 2: Build update data (only allowed fields)
    const updateData: Record<string, unknown> = {
      updated_by: userId,
    }

    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.location_type !== undefined) updateData.location_type = input.location_type
    if (input.max_pallets !== undefined) updateData.max_pallets = input.max_pallets
    if (input.max_weight_kg !== undefined) updateData.max_weight_kg = input.max_weight_kg
    if (input.is_active !== undefined) updateData.is_active = input.is_active

    // Step 3: Update location record
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('locations')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', orgId)
      .eq('warehouse_id', warehouseId)
      .select()
      .single()

    if (updateError || !updated) {
      console.error('Failed to update location:', updateError)
      return { success: false, error: 'Failed to update location' }
    }

    console.log(`Location updated: ${updated.id} (${updated.code})`)

    return { success: true, data: updated as HierarchicalLocation }
  } catch (error) {
    console.error('Error in updateLocation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Gets locations with optional filtering (flat list or tree)
 * Story: 01.9 - Warehouse Locations Management
 *
 * @param warehouseId - Warehouse UUID
 * @param filters - Optional filters (level, type, parent_id, search)
 * @param orgId - Organization ID from JWT
 * @returns LocationTreeResult with locations tree or flat list
 */
export async function getLocations(
  warehouseId: string,
  filters: LocationFilters,
  orgId: string
): Promise<LocationTreeResult> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    let query = supabaseAdmin
      .from('locations')
      .select(`
        *,
        warehouse:warehouses(id, code, name)
      `)
      .eq('org_id', orgId)
      .eq('warehouse_id', warehouseId)

    // Apply filters
    if (filters.level) {
      query = query.eq('level', filters.level)
    }

    if (filters.type) {
      query = query.eq('location_type', filters.type)
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    if (filters.parent_id !== undefined) {
      if (filters.parent_id === null) {
        query = query.is('parent_id', null)
      } else {
        query = query.eq('parent_id', filters.parent_id)
      }
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`
      query = query.or(`code.ilike.${searchTerm},name.ilike.${searchTerm},full_path.ilike.${searchTerm}`)
    }

    // Sort by full_path for consistent hierarchy
    query = query.order('full_path', { ascending: true })

    const { data: locations, error } = await query

    if (error) {
      console.error('Failed to fetch locations:', error)
      return { success: false, error: 'Failed to fetch locations' }
    }

    const typedLocations = (locations || []) as HierarchicalLocation[]

    // If view is 'flat', return as-is with computed fields
    if (filters.view === 'flat') {
      return {
        success: true,
        data: {
          locations: typedLocations.map(toLocationNode),
          total_count: typedLocations.length,
        },
      }
    }

    // Build tree structure (default)
    const rootNodes = buildLocationTree(typedLocations)

    return {
      success: true,
      data: {
        locations: rootNodes,
        total_count: typedLocations.length,
      },
    }
  } catch (error) {
    console.error('Error in getLocations:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Gets a single location by ID
 * Story: 01.9 - Warehouse Locations Management
 *
 * @param warehouseId - Warehouse UUID
 * @param id - Location UUID
 * @param orgId - Organization ID from JWT
 * @returns LocationServiceResult with location
 */
export async function getLocationById(
  warehouseId: string,
  id: string,
  orgId: string
): Promise<LocationServiceResult> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .eq('warehouse_id', warehouseId)
      .single()

    if (error || !data) {
      console.error('Location not found:', error)
      return { success: false, error: 'Location not found' }
    }

    return { success: true, data: data as HierarchicalLocation }
  } catch (error) {
    console.error('Error in getLocationById:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Deletes a hierarchical location
 * Story: 01.9 - Warehouse Locations Management
 *
 * Validates that location has no children or inventory before deletion
 *
 * @param warehouseId - Warehouse UUID
 * @param id - Location UUID
 * @param orgId - Organization ID from JWT
 * @returns DeleteResult with success status
 */
export async function deleteLocation(
  warehouseId: string,
  id: string,
  orgId: string
): Promise<DeleteResult> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Step 1: Verify location exists
    const { data: location, error: locError } = await supabaseAdmin
      .from('locations')
      .select('id, code')
      .eq('id', id)
      .eq('org_id', orgId)
      .eq('warehouse_id', warehouseId)
      .single()

    if (locError || !location) {
      return { success: false, error: 'Location not found' }
    }

    // Step 2: Check if deletion is allowed
    const canDeleteResult = await canDelete(id, orgId)

    if (!canDeleteResult.can) {
      if (canDeleteResult.reason === 'HAS_CHILDREN') {
        return { success: false, error: 'Delete child locations first' }
      }
      if (canDeleteResult.reason === 'HAS_INVENTORY') {
        return {
          success: false,
          error: `Location has inventory (${canDeleteResult.count} items). Relocate first.`,
        }
      }
      return { success: false, error: 'Cannot delete location' }
    }

    // Step 3: Delete location
    const { error: deleteError } = await supabaseAdmin
      .from('locations')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)
      .eq('warehouse_id', warehouseId)

    if (deleteError) {
      console.error('Failed to delete location:', deleteError)
      // Check for FK constraint errors
      if (deleteError.code === '23503') {
        return {
          success: false,
          error: 'Location is referenced by other records. Remove references first.',
        }
      }
      return { success: false, error: 'Failed to delete location' }
    }

    console.log(`Location deleted: ${id} (${location.code})`)

    return { success: true }
  } catch (error) {
    console.error('Error in deleteLocation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
