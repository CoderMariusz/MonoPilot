// apps/frontend/lib/validation/license-plate-schemas.ts
/**
 * License Plate Query Validation Schemas
 * 
 * This file contains Zod validation schemas for License Plate query parameters
 * in the MonoPilot Warehouse module. It follows Story 05.1 (basic schema) 
 * and Story 05.5 (advanced search and filters).
 * 
 * Patterns:
 * - Query param numbers: Use z.coerce.number()
 * - Optional filters: Use .optional()
 * - Defaults: Use .default() for pagination/sort
 * - Date format: Use regex for YYYY-MM-DD, z.string().datetime() for ISO 8601
 * - Array filters: Use z.array(z.string().uuid()) for IDs, z.array(enumType) for enums
 * - Cross-field validation: Use .refine() with clear error messages
 */

import { z } from 'zod';

// Enum definitions (reused across schemas)
export const lpStatusEnum = z.enum(['available', 'reserved', 'consumed', 'blocked']);
export const qaStatusEnum = z.enum(['pending', 'passed', 'failed', 'quarantine']);

// Main License Plate Query Schema (Story 05.1 + 05.5)
export const lpQuerySchema = z.object({
  // ===== SEARCH FIELDS =====
  search: z.string().min(2, "Search term must be at least 2 characters").optional(),
  batch_number: z.string().max(100, "Batch number cannot exceed 100 characters").optional(),

  // ===== FILTERS - SINGLE VALUES =====
  product_id: z.string().uuid().optional(),
  warehouse_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  status: lpStatusEnum.optional(),
  qa_status: qaStatusEnum.optional(),

  // ===== FILTERS - ARRAY VALUES =====
  product_ids: z.array(z.string().uuid()).optional(),
  location_ids: z.array(z.string().uuid()).optional(),
  statuses: z.array(lpStatusEnum).optional(),
  qa_statuses: z.array(qaStatusEnum).optional(),

  // ===== DATE RANGE FILTERS =====
  expiry_before: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  expiry_after: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  created_before: z.string().datetime().optional(),
  created_after: z.string().datetime().optional(),

  // ===== PAGINATION & SORTING =====
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(200, "Maximum page size is 200").default(20),
  sort: z.enum(['lp_number', 'created_at', 'expiry_date', 'quantity', 'batch_number']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
})
// Cross-field validation for expiry date range
.refine(
  (data) => {
    if (data.expiry_before && data.expiry_after) {
      return new Date(data.expiry_before) >= new Date(data.expiry_after);
    }
    return true;
  },
  {
    message: "expiry_before must be greater than or equal to expiry_after",
    path: ["expiry_before"],
  }
);

// Type inference for use in service layer
export type LPQueryParams = z.infer<typeof lpQuerySchema>;

/*
// ===== EXAMPLE USAGE =====

// Valid API calls:
// Basic search
GET /api/license-plates?search=ABC123

// Batch number filter
GET /api/license-plates?batch_number=BATCH-2024-001

// Array filters
GET /api/license-plates?product_ids=uuid1,uuid2&statuses=available,reserved

// Date ranges
GET /api/license-plates?expiry_after=2024-01-01&expiry_before=2024-12-31

// Pagination and sorting
GET /api/license-plates?page=2&limit=50&sort=batch_number&order=asc

// Invalid API calls (would fail validation):
// Search too short
GET /api/license-plates?search=A

// Invalid date format
GET /api/license-plates?expiry_before=2024/01/01

// Invalid expiry range
GET /api/license-plates?expiry_after=2024-12-31&expiry_before=2024-01-01

// Invalid limit
GET /api/license-plates?limit=300
*/