/**
 * Validation schemas for Product Advanced Features (Story 02.16)
 * Features: Clone, Image, Barcode, Category, Tag
 */

import { z } from 'zod'

// ============================================================================
// Product Clone Schemas
// ============================================================================

export const productCloneOptionsSchema = z.object({
  code: z.string()
    .min(2, 'SKU code must be at least 2 characters')
    .max(50, 'SKU code must be less than 50 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'SKU must be alphanumeric with hyphens or underscores'),
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters'),
  includeAllergens: z.boolean().default(false),
  includeCategoriesTags: z.boolean().default(false),
  includeImage: z.boolean().default(false),
})

export type ProductCloneOptions = z.infer<typeof productCloneOptionsSchema>

export const productCloneCodeSchema = z.object({
  code: z.string()
    .min(2, 'SKU code must be at least 2 characters')
    .max(50, 'SKU code must be less than 50 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'SKU must be alphanumeric with hyphens or underscores'),
})

export type ProductCloneCodeInput = z.infer<typeof productCloneCodeSchema>

// ============================================================================
// Product Image Schemas
// ============================================================================

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export const productImageUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(
      (file) => file.size <= MAX_IMAGE_SIZE,
      `Image size must be less than 5MB`
    )
    .refine(
      (file) => ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number]),
      'Image must be JPG, PNG, or WebP format'
    ),
  isPrimary: z.boolean().default(false),
})

export type ProductImageUploadInput = z.infer<typeof productImageUploadSchema>

export const productImageMetadataSchema = z.object({
  filename: z.string().min(1),
  mime_type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  file_size_bytes: z.number().max(MAX_IMAGE_SIZE),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  is_primary: z.boolean().default(false),
})

export type ProductImageMetadata = z.infer<typeof productImageMetadataSchema>

// ============================================================================
// Barcode Schemas
// ============================================================================

export const BARCODE_FORMATS = ['code128', 'ean13'] as const
export type BarcodeFormat = typeof BARCODE_FORMATS[number]

export const barcodeGenerateSchema = z.object({
  format: z.enum(BARCODE_FORMATS),
  value: z.string().min(1, 'Barcode value is required'),
})

export type BarcodeGenerateInput = z.infer<typeof barcodeGenerateSchema>

export const barcodeValidateSchema = z.object({
  format: z.enum(BARCODE_FORMATS),
  value: z.string().min(1, 'Barcode value is required'),
})

export type BarcodeValidateInput = z.infer<typeof barcodeValidateSchema>

// EAN-13 specific validation (13 digits with valid check digit)
export function validateEAN13(value: string): { valid: boolean; error?: string } {
  // Must be exactly 13 digits
  if (!/^\d{13}$/.test(value)) {
    return { valid: false, error: 'EAN-13 must be exactly 13 digits' }
  }

  // Calculate check digit
  const digits = value.split('').map(Number)
  const checkDigit = digits[12]
  
  // Calculate sum: (sum of odd positions * 3) + sum of even positions
  let sum = 0
  for (let i = 0; i < 12; i++) {
    if (i % 2 === 0) {
      sum += digits[i] * 1  // Odd positions (1, 3, 5... in 1-indexed)
    } else {
      sum += digits[i] * 3  // Even positions (2, 4, 6... in 1-indexed)
    }
  }
  
  const calculatedCheckDigit = (10 - (sum % 10)) % 10
  
  if (checkDigit !== calculatedCheckDigit) {
    return { valid: false, error: 'Invalid EAN-13 check digit' }
  }
  
  return { valid: true }
}

// Code128 validation (any printable ASCII, reasonable length)
export function validateCode128(value: string): { valid: boolean; error?: string } {
  if (value.length === 0) {
    return { valid: false, error: 'Code128 value cannot be empty' }
  }
  
  if (value.length > 128) {
    return { valid: false, error: 'Code128 value too long (max 128 characters)' }
  }
  
  // Code128 supports printable ASCII characters
  if (!/^[!-~\s]+$/.test(value)) {
    return { valid: false, error: 'Code128 contains invalid characters' }
  }
  
  return { valid: true }
}

// ============================================================================
// Product Category Schemas
// ============================================================================

export const productCategoryCreateSchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be less than 100 characters'),
  description: z.string().max(500).optional(),
  parent_id: z.string().uuid().optional().nullable(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
})

export type ProductCategoryCreateInput = z.infer<typeof productCategoryCreateSchema>

export const productCategoryUpdateSchema = productCategoryCreateSchema.partial().omit({ parent_id: true })

export type ProductCategoryUpdateInput = z.infer<typeof productCategoryUpdateSchema>

export interface ProductCategoryNode {
  id: string
  name: string
  description?: string | null
  parent_id?: string | null
  level: number
  sort_order: number
  is_active: boolean
  children: ProductCategoryNode[]
}

// ============================================================================
// Product Tag Schemas
// ============================================================================

export const productTagCreateSchema = z.object({
  name: z.string()
    .min(1, 'Tag name is required')
    .max(50, 'Tag name must be less than 50 characters'),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code (e.g., #22C55E)')
    .default('#6B7280'),
  is_active: z.boolean().default(true),
})

export type ProductTagCreateInput = z.infer<typeof productTagCreateSchema>

export const productTagUpdateSchema = productTagCreateSchema.partial()

export type ProductTagUpdateInput = z.infer<typeof productTagUpdateSchema>

export const productTagAssignmentSchema = z.object({
  product_id: z.string().uuid(),
  tag_ids: z.array(z.string().uuid()).min(1, 'At least one tag is required'),
})

export type ProductTagAssignmentInput = z.infer<typeof productTagAssignmentSchema>

export interface ProductTagWithCount {
  id: string
  name: string
  color: string
  is_active: boolean
  product_count: number
  created_at: string
  updated_at: string
}