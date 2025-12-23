import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'
import type {
  CreateLocationInput,
  UpdateLocationInput,
  LocationFilters,
} from '../validation/location-schemas'
import {
  generateLocationBarcode,
  generateQRCode,
  validateBarcodeUniqueness,
} from './barcode-generator-service'

/**
 * Location Management Service
 * Story: 1.6 Location Management
 * Task 3: Location Service - Core Logic (AC: 005.1, 005.2, 005.4, 005.5)
 *
 * Handles location CRUD operations with validation and cache events
 */

export interface Location {
  id: string
  org_id: string
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
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  // Joined data
  warehouse?: {
    code: string
    name: string
  }
  qr_code_url?: string // Generated on demand
}

export interface LocationServiceResult {
  success: boolean
  data?: Location
  error?: string
}

export interface LocationsListResult {
  success: boolean
  data?: Location[]
  error?: string
}

export interface DeleteResult {
  success: boolean
  error?: string
}

/**
 * Creates a new location with auto-generated barcode
 *
 * AC-005.1: Admin can create location
 * AC-005.2: Zone/capacity optional fields with toggle validation
 * AC-005.3: Barcode auto-generated
 *
 * @param input - CreateLocationInput from form
 * @param userId - UUID of current user (for created_by)
 * @param orgId - Organization ID from JWT
 * @returns LocationServiceResult with created location
 */
export async function createLocation(
  input: CreateLocationInput,
  userId: string,
  orgId: string
): Promise<LocationServiceResult> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Step 1: Validate code uniqueness within warehouse
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('locations')
      .select('id')
      .eq('org_id', orgId)
      .eq('warehouse_id', input.warehouse_id)
      .eq('code', input.code)
      .limit(1)

    if (checkError) {
      console.error('Error checking location code uniqueness:', checkError)
      return {
        success: false,
        error: 'Failed to validate location code',
      }
    }

    if (existing && existing.length > 0) {
      return {
        success: false,
        error: `Location code "${input.code}" already exists in this warehouse`,
      }
    }

    // Step 2: Get warehouse code for barcode generation
    const { data: warehouse, error: warehouseError } = await supabaseAdmin
      .from('warehouses')
      .select('code')
      .eq('id', input.warehouse_id)
      .eq('org_id', orgId)
      .single()

    if (warehouseError || !warehouse) {
      console.error('Failed to find warehouse:', warehouseError)
      return {
        success: false,
        error: 'Warehouse not found',
      }
    }

    // Step 3: Generate barcode if not provided
    let barcode = input.barcode

    if (!barcode) {
      const barcodeResult = await generateLocationBarcode(warehouse.code, orgId)

      if (!barcodeResult.success || !barcodeResult.barcode) {
        return {
          success: false,
          error: barcodeResult.error || 'Failed to generate barcode',
        }
      }

      barcode = barcodeResult.barcode
    } else {
      // Validate manual barcode is globally unique
      const isUnique = await validateBarcodeUniqueness(barcode)

      if (!isUnique) {
        return {
          success: false,
          error: `Barcode "${barcode}" is already in use`,
        }
      }
    }

    // Step 4: Insert location record - use admin client to bypass RLS
    const { data: location, error: insertError } = await supabaseAdmin
      .from('locations')
      .insert({
        org_id: orgId,
        warehouse_id: input.warehouse_id,
        code: input.code,
        name: input.name,
        type: input.type,
        zone: input.zone_enabled ? input.zone : null,
        zone_enabled: input.zone_enabled,
        capacity: input.capacity_enabled ? input.capacity : null,
        capacity_enabled: input.capacity_enabled,
        barcode,
        is_active: input.is_active ?? true,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single()

    if (insertError || !location) {
      console.error('Failed to insert location:', insertError)
      return {
        success: false,
        error: 'Failed to create location',
      }
    }

    // Step 5: Generate QR code
    const qrResult = await generateQRCode(barcode)
    const locationWithQR = {
      ...location,
      qr_code_url: qrResult.success ? qrResult.dataUrl : undefined,
    }

    // TODO: Step 6: Emit cache invalidation event (AC-005.8)
    // await emitCacheEvent('location.created', orgId, input.warehouse_id, location.id)

    console.log(`Location created: ${location.id} (${location.code})`)

    return {
      success: true,
      data: locationWithQR as Location,
    }
  } catch (error) {
    console.error('Error in createLocation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Updates an existing location
 *
 * AC-005.1: Admin can update location
 * AC-005.2: Zone/capacity validation on update
 *
 * @param id - Location UUID
 * @param input - UpdateLocationInput from form
 * @param userId - UUID of current user (for updated_by)
 * @param orgId - Organization ID from JWT
 * @returns LocationServiceResult with updated location
 */
export async function updateLocation(
  id: string,
  input: UpdateLocationInput,
  userId: string,
  orgId: string
): Promise<LocationServiceResult> {
  try {
    const supabase = await createServerSupabase()

    // Step 1: Verify location exists and belongs to org
    const { data: existing, error: fetchError } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (fetchError || !existing) {
      console.error('Location not found:', fetchError)
      return {
        success: false,
        error: 'Location not found',
      }
    }

    // Step 2: If code is changing, validate uniqueness within warehouse
    if (input.code && input.code !== existing.code) {
      const { data: codeCheck, error: checkError } = await supabase
        .from('locations')
        .select('id')
        .eq('org_id', orgId)
        .eq('warehouse_id', existing.warehouse_id)
        .eq('code', input.code)
        .neq('id', id)
        .limit(1)

      if (checkError) {
        console.error('Error checking code uniqueness:', checkError)
        return {
          success: false,
          error: 'Failed to validate location code',
        }
      }

      if (codeCheck && codeCheck.length > 0) {
        return {
          success: false,
          error: `Location code "${input.code}" already exists in this warehouse`,
        }
      }
    }

    // Step 3: If barcode is changing, validate global uniqueness
    if (input.barcode && input.barcode !== existing.barcode) {
      const isUnique = await validateBarcodeUniqueness(input.barcode)

      if (!isUnique) {
        return {
          success: false,
          error: `Barcode "${input.barcode}" is already in use`,
        }
      }
    }

    // Step 4: Update location record
    const updateData: Partial<typeof existing> = {
      ...input,
      zone: input.zone_enabled === true ? input.zone : (input.zone_enabled === false ? null : existing.zone),
      capacity: input.capacity_enabled === true ? input.capacity : (input.capacity_enabled === false ? null : existing.capacity),
      updated_by: userId,
    }

    const { data: updated, error: updateError } = await supabase
      .from('locations')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (updateError || !updated) {
      console.error('Failed to update location:', updateError)
      return {
        success: false,
        error: 'Failed to update location',
      }
    }

    // Step 5: Generate QR code with updated barcode
    const qrResult = await generateQRCode(updated.barcode)
    const locationWithQR = {
      ...updated,
      qr_code_url: qrResult.success ? qrResult.dataUrl : undefined,
    }

    // TODO: Step 6: Emit cache invalidation event (AC-005.8)
    // await emitCacheEvent('location.updated', orgId, updated.warehouse_id, updated.id)

    console.log(`Location updated: ${updated.id} (${updated.code})`)

    return {
      success: true,
      data: locationWithQR as Location,
    }
  } catch (error) {
    console.error('Error in updateLocation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Gets locations with optional filtering
 *
 * AC-005.4: Locations table with filtering and sorting
 *
 * @param filters - Optional filters (warehouse_id, type, is_active, search)
 * @param orgId - Organization ID from JWT
 * @returns LocationsListResult with locations array
 */
export async function getLocations(
  filters: LocationFilters,
  orgId: string
): Promise<LocationsListResult> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    let query = supabaseAdmin
      .from('locations')
      .select(
        `
        *,
        warehouse:warehouses!locations_warehouse_id_fkey(code, name)
      `
      )
      .eq('org_id', orgId)

    // Apply filters
    if (filters.warehouse_id) {
      query = query.eq('warehouse_id', filters.warehouse_id)
    }

    if (filters.type) {
      query = query.eq('type', filters.type)
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`
      query = query.or(`code.ilike.${searchTerm},name.ilike.${searchTerm}`)
    }

    // Default sort by code
    query = query.order('code', { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch locations:', error)
      return {
        success: false,
        error: 'Failed to fetch locations',
      }
    }

    return {
      success: true,
      data: (data || []) as Location[],
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
 * Gets a single location by ID with QR code
 *
 * AC-005.6: Location detail page with QR code
 *
 * @param id - Location UUID
 * @param orgId - Organization ID from JWT
 * @returns LocationServiceResult with location and QR code
 */
export async function getLocationById(
  id: string,
  orgId: string
): Promise<LocationServiceResult> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('locations')
      .select(
        `
        *,
        warehouse:warehouses!locations_warehouse_id_fkey(code, name)
      `
      )
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (error || !data) {
      console.error('Location not found:', error)
      return {
        success: false,
        error: 'Location not found',
      }
    }

    // Generate QR code
    const qrResult = await generateQRCode(data.barcode)
    const locationWithQR = {
      ...data,
      qr_code_url: qrResult.success ? qrResult.dataUrl : undefined,
    }

    return {
      success: true,
      data: locationWithQR as Location,
    }
  } catch (error) {
    console.error('Error in getLocationById:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Deletes a location (soft or hard delete)
 *
 * AC-005.5: Cannot delete location if used as warehouse default
 * AC-005.5: FK constraint ON DELETE RESTRICT prevents deletion
 * AC-005.5: Archive option (is_active = false)
 *
 * @param id - Location UUID
 * @param orgId - Organization ID from JWT
 * @param softDelete - If true, set is_active = false instead of deleting
 * @returns DeleteResult with success status
 */
export async function deleteLocation(
  id: string,
  orgId: string,
  softDelete = false
): Promise<DeleteResult> {
  try {
    const supabase = await createServerSupabase()

    // Step 1: Check if location is used as warehouse default
    // FIXED: Use parameterized queries - fetch all warehouses then check in JS
    const { data: allWarehouses, error: checkError } = await supabase
      .from('warehouses')
      .select('id, code, name, default_receiving_location_id, default_shipping_location_id, transit_location_id')
      .eq('org_id', orgId)

    if (checkError) {
      console.error('Error checking warehouse defaults:', checkError)
      return {
        success: false,
        error: 'Failed to check dependencies',
      }
    }

    // Check if location is used as warehouse default (application-level, not SQL injection)
    const usedAsDefault = allWarehouses?.filter(w =>
      w.default_receiving_location_id === id ||
      w.default_shipping_location_id === id ||
      w.transit_location_id === id
    ) || []

    if (usedAsDefault && usedAsDefault.length > 0) {
      const warehouse = usedAsDefault[0]
      let defaultType = 'default'

      if (warehouse.default_receiving_location_id === id) {
        defaultType = 'default receiving'
      } else if (warehouse.default_shipping_location_id === id) {
        defaultType = 'default shipping'
      } else if (warehouse.transit_location_id === id) {
        defaultType = 'transit'
      }

      return {
        success: false,
        error: `Cannot delete - this is the ${defaultType} location for Warehouse ${warehouse.name} (${warehouse.code}). Change warehouse default first, then delete or archive this location.`,
      }
    }

    // Step 2: Perform delete or soft delete
    if (softDelete) {
      // Soft delete: set is_active = false
      const { error: updateError } = await supabase
        .from('locations')
        .update({ is_active: false })
        .eq('id', id)
        .eq('org_id', orgId)

      if (updateError) {
        console.error('Failed to archive location:', updateError)
        return {
          success: false,
          error: 'Failed to archive location',
        }
      }

      console.log(`Location archived: ${id}`)
    } else {
      // Hard delete
      const { error: deleteError } = await supabase
        .from('locations')
        .delete()
        .eq('id', id)
        .eq('org_id', orgId)

      if (deleteError) {
        console.error('Failed to delete location:', deleteError)
        return {
          success: false,
          error: 'Failed to delete location. This location may be referenced by other records.',
        }
      }

      console.log(`Location deleted: ${id}`)
    }

    // TODO: Step 3: Emit cache invalidation event (AC-005.8)
    // await emitCacheEvent('location.deleted', orgId, warehouse_id, id)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in deleteLocation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
