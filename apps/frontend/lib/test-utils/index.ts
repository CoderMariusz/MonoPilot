/**
 * Test Utilities Index
 *
 * Re-exports all test utilities for convenient imports:
 * ```ts
 * import { createMockGanttWO, createMockSupabaseClient } from '@/lib/test-utils'
 * ```
 */

// Factory functions for type-safe mock data
export {
  // Gantt factories
  createMockGanttProduct,
  createMockGanttWO,
  createMockGanttWOBatch,

  // Organization factories
  createMockOrganization,

  // Purchase Order factories
  createMockPOStatusHistory,

  // Type helper functions
  createMockWOStatus,
  createMockWOPriority,
  createMockMaterialStatus,

  // Re-exported types
  type GanttWorkOrder,
  type GanttProduct,
  type WOStatus,
  type MaterialStatus,
  type Organization,
  type POStatusHistory,
  type WOPriority,
} from './factories'

// Supabase mock utilities
export {
  createChainableMock,
  createMockSupabaseClient,
} from './supabase-mock'
