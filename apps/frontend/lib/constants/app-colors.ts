/**
 * Application Color Palette
 * Story 1.18: Settings Tables Consistency
 * Story 2.27: Technical Tables Consistency
 * Story 3.30: Planning Color Consistency
 *
 * Unified color system for all modules
 */

// ===== Button Colors (shared across all modules) =====
export const BUTTON_COLORS = {
  primary: 'bg-green-600 hover:bg-green-700 text-white',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  outline: 'border border-gray-300 bg-transparent hover:bg-gray-50',
  info: 'bg-blue-600 hover:bg-blue-700 text-white',
}

// ===== Status Badge Colors =====
export const STATUS_COLORS = {
  // Generic statuses
  active: 'bg-green-100 text-green-700',
  enabled: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  disabled: 'bg-gray-100 text-gray-500',
  pending: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  deleted: 'bg-red-100 text-red-700',

  // Planning statuses
  draft: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  closed: 'bg-purple-100 text-purple-700',
  submitted: 'bg-blue-100 text-blue-700',
  receiving: 'bg-yellow-100 text-yellow-700',
  in_transit: 'bg-orange-100 text-orange-700',
  shipped: 'bg-orange-100 text-orange-700',
  received: 'bg-green-100 text-green-700',
  released: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  paused: 'bg-orange-100 text-orange-700',

  // Machine statuses
  down: 'bg-red-100 text-red-700',
  maintenance: 'bg-yellow-100 text-yellow-700',

  // Technical (product) statuses
  current: 'bg-green-100 text-green-700',
  superseded: 'bg-gray-100 text-gray-500',
  archived: 'bg-gray-100 text-gray-500',
}

// ===== Module Accent Colors =====
export const MODULE_COLORS = {
  // Planning module
  planning: {
    primary: '#16a34a', // green-600
    accent: 'border-l-green-500',
    bg: 'bg-green-50/50',
  },
  // Settings module
  settings: {
    primary: '#2563eb', // blue-600
    accent: 'border-l-blue-500',
    bg: 'bg-blue-50/50',
  },
  // Technical module
  technical: {
    primary: '#9333ea', // purple-600
    accent: 'border-l-purple-500',
    bg: 'bg-purple-50/50',
  },
  // Warehouse module
  warehouse: {
    primary: '#ea580c', // orange-600
    accent: 'border-l-orange-500',
    bg: 'bg-orange-50/50',
  },
  // Production module
  production: {
    primary: '#0891b2', // cyan-600
    accent: 'border-l-cyan-500',
    bg: 'bg-cyan-50/50',
  },
  // Quality module
  quality: {
    primary: '#dc2626', // red-600
    accent: 'border-l-red-500',
    bg: 'bg-red-50/50',
  },
}

// ===== Card Type Colors (for Planning) =====
export const CARD_COLORS = {
  po: { accent: 'border-l-blue-500', bg: 'bg-blue-50/50' },
  to: { accent: 'border-l-orange-500', bg: 'bg-orange-50/50' },
  wo: { accent: 'border-l-green-500', bg: 'bg-green-50/50' },
  product: { accent: 'border-l-purple-500', bg: 'bg-purple-50/50' },
  bom: { accent: 'border-l-indigo-500', bg: 'bg-indigo-50/50' },
  routing: { accent: 'border-l-pink-500', bg: 'bg-pink-50/50' },
}

// ===== Action Button Colors (table row actions) =====
export const ACTION_COLORS = {
  view: 'text-gray-600 hover:text-gray-800',
  edit: 'text-gray-600 hover:text-gray-800',
  delete: 'text-red-600 hover:text-red-800',
  archive: 'text-yellow-600 hover:text-yellow-800',
}

// ===== Helper Functions =====

/**
 * Get status badge classes by status code
 */
export function getStatusColor(status: string): string {
  const normalized = status.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
  return STATUS_COLORS[normalized as keyof typeof STATUS_COLORS] || STATUS_COLORS.draft
}

/**
 * Get button classes by type
 */
export function getButtonColor(type: keyof typeof BUTTON_COLORS): string {
  return BUTTON_COLORS[type]
}

/**
 * Get module accent color
 */
export function getModuleColor(module: keyof typeof MODULE_COLORS) {
  return MODULE_COLORS[module]
}

/**
 * Get card accent and background colors
 */
export function getCardColor(type: keyof typeof CARD_COLORS) {
  return CARD_COLORS[type]
}

// ===== Legacy export for backward compatibility =====
export const PLANNING_COLORS = {
  button: BUTTON_COLORS,
  status: STATUS_COLORS,
  card: {
    po: CARD_COLORS.po.accent,
    to: CARD_COLORS.to.accent,
    wo: CARD_COLORS.wo.accent,
  },
  cardBg: {
    po: CARD_COLORS.po.bg,
    to: CARD_COLORS.to.bg,
    wo: CARD_COLORS.wo.bg,
  },
}
