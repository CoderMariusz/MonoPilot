import QRCode from 'qrcode'
import { createServerSupabase } from '../supabase/server'

/**
 * Barcode Generation Service
 * Story: 1.6 Location Management
 * Task 2: Barcode Generation Service (AC-005.3)
 *
 * Handles location barcode generation and QR code creation
 */

export interface BarcodeGenerationResult {
  success: boolean
  barcode?: string
  error?: string
}

export interface QRCodeGenerationResult {
  success: boolean
  dataUrl?: string
  error?: string
}

/**
 * Generates auto-incremented barcode for a location
 * Format: LOC-{warehouse_code}-{sequence}
 * Example: warehouse code = WH-01, sequence = 1 → LOC-WH-01-001
 *
 * AC-005.3: Barcode auto-generated with format LOC-{warehouse_code}-{sequence}
 * AC-005.3: Sequence auto-increments per warehouse (1, 2, 3, ...)
 * AC-005.3: Barcode globally unique (validated before creation)
 *
 * @param warehouseCode - Warehouse code (e.g., "WH-01", "MAIN")
 * @param orgId - Organization ID for filtering
 * @returns BarcodeGenerationResult with generated barcode
 */
export async function generateLocationBarcode(
  warehouseCode: string,
  orgId: string
): Promise<BarcodeGenerationResult> {
  try {
    const supabase = await createServerSupabase()

    // Step 1: Get warehouse ID from warehouse code
    const { data: warehouse, error: warehouseError } = await supabase
      .from('warehouses')
      .select('id')
      .eq('code', warehouseCode)
      .eq('org_id', orgId)
      .single()

    if (warehouseError || !warehouse) {
      console.error('Failed to find warehouse:', warehouseCode, warehouseError)
      return {
        success: false,
        error: `Warehouse not found: ${warehouseCode}`,
      }
    }

    // Step 2: Query max sequence number for this warehouse
    // Extract sequence from existing barcodes (format: LOC-{warehouse}-{seq})
    const { data: existingLocations, error: queryError } = await supabase
      .from('locations')
      .select('barcode')
      .eq('warehouse_id', warehouse.id)
      .like('barcode', `LOC-${warehouseCode}-%`)
      .order('created_at', { ascending: false })
      .limit(100) // Get recent barcodes to find max sequence

    if (queryError) {
      console.error('Failed to query existing locations:', queryError)
      return {
        success: false,
        error: 'Failed to query existing locations',
      }
    }

    // Step 3: Calculate next sequence number
    let maxSequence = 0

    if (existingLocations && existingLocations.length > 0) {
      // Parse sequence from barcodes like "LOC-WH-01-042"
      existingLocations.forEach((loc) => {
        const match = loc.barcode.match(/-(\d+)$/)
        if (match) {
          const seq = parseInt(match[1], 10)
          if (seq > maxSequence) {
            maxSequence = seq
          }
        }
      })
    }

    const nextSequence = maxSequence + 1

    // Step 4: Format barcode with zero-padded sequence
    const barcode = `LOC-${warehouseCode}-${nextSequence.toString().padStart(3, '0')}`

    // Step 5: Validate barcode uniqueness globally (across all orgs)
    const isUnique = await validateBarcodeUniqueness(barcode)

    if (!isUnique) {
      console.error('Generated barcode is not unique:', barcode)
      return {
        success: false,
        error: 'Generated barcode already exists (collision)',
      }
    }

    console.log(`Generated location barcode: ${barcode} (sequence: ${nextSequence})`)

    return {
      success: true,
      barcode,
    }
  } catch (error) {
    console.error('Error in generateLocationBarcode:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Validates that a barcode is globally unique
 * Checks across all organizations to prevent conflicts
 *
 * AC-005.3: User can override barcode (manual input), must be globally unique
 * AC-005.3: Barcode globally unique across all orgs
 *
 * @param barcode - Barcode string to validate
 * @returns Promise<boolean> - true if unique, false if exists
 */
export async function validateBarcodeUniqueness(barcode: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabase()

    // Query locations table WITHOUT RLS filter (check global uniqueness)
    // Use service role to bypass RLS
    const { data, error } = await supabase
      .from('locations')
      .select('id')
      .eq('barcode', barcode)
      .limit(1)

    if (error) {
      console.error('Error validating barcode uniqueness:', error)
      // On error, assume not unique for safety
      return false
    }

    // If data exists, barcode is NOT unique
    return !data || data.length === 0
  } catch (error) {
    console.error('Error in validateBarcodeUniqueness:', error)
    // On error, assume not unique for safety
    return false
  }
}

/**
 * Generates QR code as base64 data URL
 * Used for printing location labels and scanner integration
 *
 * AC-005.3: QR code generation using qrcode library
 * AC-005.6: QR code displayed on location detail page
 * AC-005.6: QR code scannable, contains location barcode
 *
 * @param barcode - Location barcode to encode
 * @returns QRCodeGenerationResult with base64 data URL
 */
export async function generateQRCode(barcode: string): Promise<QRCodeGenerationResult> {
  try {
    // Generate QR code as data URL
    // Size: 300x300px, Error correction: Medium
    const dataUrl = await QRCode.toDataURL(barcode, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M', // Medium error correction
      color: {
        dark: '#000000', // Black foreground
        light: '#FFFFFF', // White background
      },
    })

    console.log(`Generated QR code for barcode: ${barcode}`)

    return {
      success: true,
      dataUrl,
    }
  } catch (error) {
    console.error('Error generating QR code:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Generates large QR code for printing (600x600px)
 * Used for physical location labels
 *
 * AC-005.6: Print QR Code functionality
 *
 * @param barcode - Location barcode to encode
 * @returns QRCodeGenerationResult with large base64 data URL
 */
export async function generatePrintableQRCode(
  barcode: string
): Promise<QRCodeGenerationResult> {
  try {
    // Generate larger QR code for printing
    const dataUrl = await QRCode.toDataURL(barcode, {
      width: 600, // Larger size for printing
      margin: 4, // More margin for printing
      errorCorrectionLevel: 'H', // High error correction for printing
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    console.log(`Generated printable QR code for barcode: ${barcode}`)

    return {
      success: true,
      dataUrl,
    }
  } catch (error) {
    console.error('Error generating printable QR code:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
