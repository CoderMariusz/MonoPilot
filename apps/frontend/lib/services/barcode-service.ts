/**
 * Barcode Service (Story 02.16)
 * Handles barcode generation and validation
 *
 * Supported formats:
 * - Code128: Any string, alphanumeric
 * - EAN-13: 13 digits with valid check digit
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { validateEAN13, validateCode128, type BarcodeFormat } from '@/lib/validation/product-advanced'

export interface BarcodeValidationResult {
  valid: boolean
  error?: string
}

export interface BarcodeGenerationResult {
  url: string
  format: BarcodeFormat
  value: string
}

/**
 * Validate a barcode value for a given format
 */
export function validate(format: BarcodeFormat, value: string): BarcodeValidationResult {
  if (!value || value.length === 0) {
    return { valid: false, error: 'Barcode value is required' }
  }

  switch (format) {
    case 'ean13':
      return validateEAN13(value)
    case 'code128':
      return validateCode128(value)
    default:
      return { valid: false, error: 'Unsupported barcode format' }
  }
}

/**
 * Generate a barcode for a product
 * Returns a URL to the generated barcode image
 */
export async function generate(
  supabase: SupabaseClient,
  orgId: string,
  productId: string,
  format: BarcodeFormat,
  value: string
): Promise<BarcodeGenerationResult> {
  // Validate the barcode value first
  const validation = validate(format, value)
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid barcode value')
  }

  // Generate barcode SVG
  const svg = generateBarcodeSVG(format, value)

  // Store the barcode URL/reference in the product
  const barcodeUrl = `data:image/svg+xml;base64,${btoa(svg)}`

  // Update product with barcode info
  const { error } = await supabase
    .from('products')
    .update({
      barcode: value,
      barcode_url: barcodeUrl,
      barcode_format: format,
    })
    .eq('id', productId)

  if (error) {
    throw new Error(`Failed to save barcode: ${error.message}`)
  }

  return {
    url: barcodeUrl,
    format,
    value,
  }
}

/**
 * Generate EAN-13 check digit
 */
export function calculateEAN13CheckDigit(digits12: string): string {
  if (!/^\d{12}$/.test(digits12)) {
    throw new Error('EAN-13 check digit calculation requires exactly 12 digits')
  }

  const digits = digits12.split('').map(Number)
  let sum = 0

  for (let i = 0; i < 12; i++) {
    if (i % 2 === 0) {
      sum += digits[i] * 1
    } else {
      sum += digits[i] * 3
    }
  }

  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit.toString()
}

/**
 * Generate complete EAN-13 from 12 digits
 */
export function generateEAN13(digits12: string): string {
  const checkDigit = calculateEAN13CheckDigit(digits12)
  return digits12 + checkDigit
}

/**
 * Generate barcode SVG
 * This creates a simple Code128 or EAN-13 representation
 */
function generateBarcodeSVG(format: BarcodeFormat, value: string): string {
  if (format === 'code128') {
    return generateCode128SVG(value)
  } else {
    return generateEAN13SVG(value)
  }
}

/**
 * Generate Code128 barcode SVG
 * Simplified representation - in production use a proper barcode library
 */
function generateCode128SVG(value: string): string {
  const width = Math.max(200, value.length * 12)
  const height = 100
  
  // Create a pattern of bars based on the value
  // This is a simplified representation
  let bars = ''
  const barWidth = width / (value.length * 11)
  
  for (let i = 0; i < value.length; i++) {
    const charCode = value.charCodeAt(i)
    const x = i * 11 * barWidth
    
    // Generate bars based on character code
    for (let j = 0; j < 11; j++) {
      const isBar = ((charCode >> (j % 7)) & 1) === 1
      if (isBar) {
        bars += `<rect x="${x + j * barWidth}" y="0" width="${barWidth * 0.8}" height="${height - 20}" fill="black"/>`
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  ${bars}
  <text x="${width / 2}" y="${height - 5}" text-anchor="middle" font-family="monospace" font-size="12">${value}</text>
</svg>`
}

/**
 * Generate EAN-13 barcode SVG
 * Simplified representation - in production use a proper barcode library
 */
function generateEAN13SVG(value: string): string {
  const width = 200
  const height = 100
  const barWidth = width / 95 // EAN-13 has 95 modules

  // EAN-13 guard patterns
  const leftGuard = [1, 0, 1]
  const centerGuard = [0, 1, 0, 1, 0]
  const rightGuard = [1, 0, 1]

  // Simplified pattern generation
  let bars = ''
  let x = 10

  // Left guard
  leftGuard.forEach((bit) => {
    if (bit) {
      bars += `<rect x="${x}" y="0" width="${barWidth}" height="${height - 20}" fill="black"/>`
    }
    x += barWidth
  })

  // Generate pseudo-bars from digits
  for (let i = 0; i < value.length; i++) {
    const digit = parseInt(value[i], 10)
    const pattern = ((digit * 7) % 2 === 0) ? [1, 0, 1, 0] : [0, 1, 0, 1]
    
    pattern.forEach((bit) => {
      if (bit) {
        bars += `<rect x="${x}" y="0" width="${barWidth}" height="${height - 20}" fill="black"/>`
      }
      x += barWidth
    })

    // Add center guard after 6th digit
    if (i === 5) {
      centerGuard.forEach((bit) => {
        if (bit) {
          bars += `<rect x="${x}" y="0" width="${barWidth}" height="${height - 20}" fill="black"/>`
        }
        x += barWidth
      })
    }
  }

  // Right guard
  rightGuard.forEach((bit) => {
    if (bit) {
      bars += `<rect x="${x}" y="0" width="${barWidth}" height="${height - 20}" fill="black"/>`
    }
    x += barWidth
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width + 20}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white"/>
  ${bars}
  <text x="${(width + 20) / 2}" y="${height - 5}" text-anchor="middle" font-family="monospace" font-size="12">${value}</text>
</svg>`
}

/**
 * Get barcode for a product
 */
export async function getByProductId(
  supabase: SupabaseClient,
  productId: string
): Promise<BarcodeGenerationResult | null> {
  const { data, error } = await supabase
    .from('products')
    .select('barcode, barcode_url, barcode_format')
    .eq('id', productId)
    .single()

  if (error || !data || !data.barcode) {
    return null
  }

  return {
    url: data.barcode_url,
    format: data.barcode_format || 'code128',
    value: data.barcode,
  }
}

/**
 * Clear barcode from product
 */
export async function clear(
  supabase: SupabaseClient,
  productId: string
): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({
      barcode: null,
      barcode_url: null,
      barcode_format: null,
    })
    .eq('id', productId)

  if (error) {
    throw new Error(`Failed to clear barcode: ${error.message}`)
  }
}

// Export service as class with static methods for compatibility
export const BarcodeService = {
  validate,
  generate: (supabase: SupabaseClient, orgId: string, productId: string, format: BarcodeFormat, value: string) =>
    generate(supabase, orgId, productId, format, value),
  calculateEAN13CheckDigit,
  generateEAN13,
  getByProductId: (supabase: SupabaseClient, productId: string) => getByProductId(supabase, productId),
  clear: (supabase: SupabaseClient, productId: string) => clear(supabase, productId),
}