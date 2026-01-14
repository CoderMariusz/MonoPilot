/**
 * Module Configuration
 * Story: 1.11 Module Activation
 * Story: TD-104 - Module Grouping and Dependencies
 * AC-010.1: Module definitions
 */

export type ModuleGroup = 'core' | 'premium' | 'new'

export type ModuleStatus = 'available' | 'coming_soon'

export interface Module {
  code: string
  name: string
  description: string
  defaultEnabled: boolean
  epic: number | null
  /** Module group: core, premium, or new (TD-104) */
  group: ModuleGroup
  /** Pricing label (TD-104) */
  pricing: string
  /** Modules that must be enabled before this one (TD-104) */
  dependencies?: string[]
  /** Modules that require this module (TD-104) */
  required_for?: string[]
  /** Module availability status (TD-104) */
  status?: ModuleStatus
}

export interface ModuleGroupConfig {
  id: ModuleGroup
  name: string
  description: string
  order: number
}

/**
 * Module Group Definitions (TD-104)
 */
export const MODULE_GROUPS: ModuleGroupConfig[] = [
  {
    id: 'core',
    name: 'Core Modules',
    description: 'Essential features included in all plans',
    order: 1,
  },
  {
    id: 'premium',
    name: 'Premium Modules',
    description: 'Advanced features - $50/user/month',
    order: 2,
  },
  {
    id: 'new',
    name: 'New Modules',
    description: 'Coming soon',
    order: 3,
  },
]

export const MODULES: Module[] = [
  // CORE MODULES
  {
    code: 'settings',
    name: 'Settings',
    description: 'Organization, Users, Warehouses',
    defaultEnabled: true,
    epic: 1,
    group: 'core',
    pricing: 'Free',
    required_for: ['technical', 'planning', 'production', 'quality', 'shipping'],
  },
  {
    code: 'technical',
    name: 'Technical',
    description: 'Products, BOMs, Routings',
    defaultEnabled: true,
    epic: 2,
    group: 'core',
    pricing: 'Free',
    dependencies: ['settings'],
    required_for: ['planning', 'npd'],
  },
  {
    code: 'planning',
    name: 'Planning',
    description: 'POs, TOs, WOs',
    defaultEnabled: true,
    epic: 3,
    group: 'core',
    pricing: 'Free',
    dependencies: ['technical'],
    required_for: ['production'],
  },
  {
    code: 'production',
    name: 'Production',
    description: 'WO Execution',
    defaultEnabled: true,
    epic: 4,
    group: 'core',
    pricing: 'Free',
    dependencies: ['planning'],
  },
  {
    code: 'warehouse',
    name: 'Warehouse',
    description: 'Inventory, LP, ASN, GRN',
    defaultEnabled: true,
    epic: 5,
    group: 'core',
    pricing: 'Free',
    dependencies: ['technical'],
    required_for: ['shipping'],
  },
  {
    code: 'quality',
    name: 'Quality',
    description: 'QA Workflows',
    defaultEnabled: false,
    epic: 6,
    group: 'core',
    pricing: 'Free',
    dependencies: ['settings'],
  },
  {
    code: 'shipping',
    name: 'Shipping',
    description: 'SOs, Pick Lists',
    defaultEnabled: false,
    epic: 7,
    group: 'core',
    pricing: 'Free',
    dependencies: ['warehouse'],
  },
  // PREMIUM MODULES
  {
    code: 'npd',
    name: 'NPD',
    description: 'Formulation, Stage-Gate',
    defaultEnabled: false,
    epic: 8,
    group: 'premium',
    pricing: '$50/user/mo',
    dependencies: ['technical'],
  },
  {
    code: 'finance',
    name: 'Finance',
    description: 'Costing, Margin Analysis',
    defaultEnabled: false,
    epic: 9,
    group: 'premium',
    pricing: '$50/user/mo',
  },
  {
    code: 'integrations',
    name: 'Integrations',
    description: 'ERP, WMS, EDI Connectors',
    defaultEnabled: false,
    epic: 11,
    group: 'premium',
    pricing: '$50/user/mo',
  },
  // NEW MODULES
  {
    code: 'oee',
    name: 'OEE',
    description: 'Equipment Effectiveness',
    defaultEnabled: false,
    epic: 10,
    group: 'new',
    pricing: 'TBD',
    status: 'coming_soon',
  },
]

export const DEFAULT_MODULES = MODULES.filter(m => m.defaultEnabled).map(m => m.code)

export function getModuleByCode(code: string): Module | undefined {
  return MODULES.find(m => m.code === code)
}

export function isValidModuleCode(code: string): boolean {
  return MODULES.some(m => m.code === code)
}

/**
 * Get modules by group (TD-104)
 */
export function getModulesByGroup(group: ModuleGroup): Module[] {
  return MODULES.filter(m => m.group === group)
}

/**
 * Get modules that depend on a given module (TD-104)
 */
export function getDependentModules(moduleCode: string): Module[] {
  return MODULES.filter(m => m.dependencies?.includes(moduleCode))
}

/**
 * Get modules required by a given module (TD-104)
 */
export function getRequiredModules(moduleCode: string): Module[] {
  const targetModule = getModuleByCode(moduleCode)
  if (!targetModule?.dependencies) return []
  return targetModule.dependencies
    .map(code => getModuleByCode(code))
    .filter((m): m is Module => m !== undefined)
}

/**
 * Check if a module can be disabled (TD-104)
 * Returns list of dependent modules that would be affected
 */
export function getDisableBlockers(moduleCode: string, enabledModules: string[]): Module[] {
  const dependentModules = getDependentModules(moduleCode)
  return dependentModules.filter(m => enabledModules.includes(m.code))
}
