/**
 * Product Image Service (Story 02.16)
 * Handles image upload, retrieval, deletion, and thumbnail generation
 *
 * Business Rules:
 * - Max file size: 5MB
 * - Allowed formats: JPG, PNG, WebP
 * - Auto-generate 200x200 thumbnail
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES } from '@/lib/validation/product-advanced'

export interface ProductImage {
  id: string
  org_id: string
  product_id: string
  storage_path: string
  thumbnail_path: string | null
  filename: string
  mime_type: string
  file_size_bytes: number
  width: number | null
  height: number | null
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface UploadResult {
  id: string
  url: string
  thumbnailUrl: string | null
  filename: string
  width: number | null
  height: number | null
}

const STORAGE_BUCKET = 'product-images'
const THUMBNAIL_SIZE = 200

/**
 * Upload an image for a product
 */
export async function upload(
  supabase: SupabaseClient,
  orgId: string,
  productId: string,
  file: File,
  isPrimary: boolean = false
): Promise<UploadResult> {
  // Validate file size
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`Image size must be less than 5MB`)
  }

  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
    throw new Error('Image must be JPG, PNG, or WebP format')
  }

  // Generate unique filename
  const timestamp = Date.now()
  const extension = file.name.split('.').pop() || 'jpg'
  const filename = `${timestamp}.${extension}`
  const storagePath = `products/${productId}/${filename}`

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`)
  }

  // Get image dimensions
  const dimensions = await getImageDimensions(file)

  // Generate thumbnail (in production, this would be done via edge function or sharp)
  const thumbnailPath = await generateThumbnail(supabase, storagePath, file)

  // If setting as primary, unset other primary images
  if (isPrimary) {
    await supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', productId)
      .eq('is_primary', true)
  }

  // Insert record
  const { data: imageRecord, error: insertError } = await supabase
    .from('product_images')
    .insert({
      org_id: orgId,
      product_id: productId,
      storage_path: storagePath,
      thumbnail_path: thumbnailPath,
      filename: file.name,
      mime_type: file.type,
      file_size_bytes: file.size,
      width: dimensions.width,
      height: dimensions.height,
      is_primary: isPrimary,
    })
    .select()
    .single()

  if (insertError) {
    // Rollback storage upload
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath])
    throw new Error(`Failed to save image record: ${insertError.message}`)
  }

  // Get public URLs
  const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath)
  const { data: thumbUrlData } = thumbnailPath
    ? supabase.storage.from(STORAGE_BUCKET).getPublicUrl(thumbnailPath)
    : { data: { publicUrl: null } }

  return {
    id: imageRecord.id,
    url: urlData.publicUrl,
    thumbnailUrl: thumbUrlData?.publicUrl || null,
    filename: file.name,
    width: dimensions.width,
    height: dimensions.height,
  }
}

/**
 * Get all images for a product
 */
export async function getByProductId(
  supabase: SupabaseClient,
  productId: string
): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch images: ${error.message}`)
  }

  return (data || []) as ProductImage[]
}

/**
 * Delete an image
 */
export async function deleteImage(
  supabase: SupabaseClient,
  imageId: string
): Promise<void> {
  // Get image record first
  const { data: image, error: fetchError } = await supabase
    .from('product_images')
    .select('storage_path, thumbnail_path')
    .eq('id', imageId)
    .single()

  if (fetchError || !image) {
    throw new Error('Image not found')
  }

  // Delete from storage
  const pathsToDelete = [image.storage_path]
  if (image.thumbnail_path) {
    pathsToDelete.push(image.thumbnail_path)
  }

  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove(pathsToDelete)

  if (storageError) {
    console.warn('Failed to delete from storage:', storageError)
  }

  // Delete record
  const { error: deleteError } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId)

  if (deleteError) {
    throw new Error(`Failed to delete image: ${deleteError.message}`)
  }
}

/**
 * Delete all images for a product
 */
export async function deleteByProductId(
  supabase: SupabaseClient,
  productId: string
): Promise<void> {
  const { data: images, error: fetchError } = await supabase
    .from('product_images')
    .select('storage_path, thumbnail_path')
    .eq('product_id', productId)

  if (fetchError) {
    throw new Error(`Failed to fetch images: ${fetchError.message}`)
  }

  if (!images || images.length === 0) {
    return
  }

  // Delete all from storage
  const pathsToDelete: string[] = []
  images.forEach((img) => {
    pathsToDelete.push(img.storage_path)
    if (img.thumbnail_path) {
      pathsToDelete.push(img.thumbnail_path)
    }
  })

  await supabase.storage.from(STORAGE_BUCKET).remove(pathsToDelete)

  // Delete all records
  const { error: deleteError } = await supabase
    .from('product_images')
    .delete()
    .eq('product_id', productId)

  if (deleteError) {
    throw new Error(`Failed to delete images: ${deleteError.message}`)
  }
}

/**
 * Generate a thumbnail for an image
 * In production, this would use Sharp or an edge function
 */
export async function generateThumbnail(
  supabase: SupabaseClient,
  storagePath: string,
  file: File
): Promise<string | null> {
  // For now, create a placeholder thumbnail path
  // In production, this would actually resize the image
  const thumbnailPath = storagePath.replace(/\.(\w+)$/, '-thumb.$1')
  
  // Upload a copy as thumbnail (in production, resize first)
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(thumbnailPath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    console.warn('Failed to create thumbnail:', error)
    return null
  }

  return thumbnailPath
}

/**
 * Get image dimensions from file
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => {
      resolve({ width: 0, height: 0 })
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Set an image as primary
 */
export async function setPrimary(
  supabase: SupabaseClient,
  productId: string,
  imageId: string
): Promise<void> {
  // Unset current primary
  await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)
    .eq('is_primary', true)

  // Set new primary
  const { error } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)
    .eq('product_id', productId)

  if (error) {
    throw new Error(`Failed to set primary image: ${error.message}`)
  }
}

// Export service as class with static methods for compatibility
export const ProductImageService = {
  upload: (supabase: SupabaseClient, orgId: string, productId: string, file: File, isPrimary?: boolean) =>
    upload(supabase, orgId, productId, file, isPrimary),
  getByProductId: (supabase: SupabaseClient, productId: string) => getByProductId(supabase, productId),
  delete: (supabase: SupabaseClient, imageId: string) => deleteImage(supabase, imageId),
  deleteByProductId: (supabase: SupabaseClient, productId: string) => deleteByProductId(supabase, productId),
  generateThumbnail: (supabase: SupabaseClient, storagePath: string, file: File) =>
    generateThumbnail(supabase, storagePath, file),
  setPrimary: (supabase: SupabaseClient, productId: string, imageId: string) =>
    setPrimary(supabase, productId, imageId),
}