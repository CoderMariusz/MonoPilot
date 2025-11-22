/**
 * Module Configuration
 * Story: 1.11 Module Activation
 * AC-010.1: Module definitions
 */

export interface Module {
  code: string
  name: string
  description: string
  defaultEnabled: boolean
  epic: number | null
}

export const MODULES: Module[] = [
  {
    code: 'technical',
    name: 'Technical',
    description: 'Products, BOMs, Routings',
    defaultEnabled: true,
    epic: 2,
  },
  {
    code: 'planning',
    name: 'Planning',
    description: 'POs, TOs, WOs',
    defaultEnabled: true,
    epic: 3,
  },
  {
    code: 'production',
    name: 'Production',
    description: 'WO Execution',
    defaultEnabled: true,
    epic: 4,
  },
  {
    code: 'warehouse',
    name: 'Warehouse',
    description: 'LPs, Moves, Pallets',
    defaultEnabled: true,
    epic: 5,
  },
  {
    code: 'quality',
    name: 'Quality',
    description: 'QA Workflows',
    defaultEnabled: false,
    epic: 6,
  },
  {
    code: 'shipping',
    name: 'Shipping',
    description: 'SOs, Pick Lists',
    defaultEnabled: false,
    epic: 7,
  },
  {
    code: 'npd',
    name: 'NPD',
    description: 'Formulation',
    defaultEnabled: false,
    epic: 8,
  },
  {
    code: 'finance',
    name: 'Finance',
    description: 'Costing, Margin Analysis',
    defaultEnabled: false,
    epic: null,
  },
]

export const DEFAULT_MODULES = MODULES.filter(m => m.defaultEnabled).map(m => m.code)

export function getModuleByCode(code: string): Module | undefined {
  return MODULES.find(m => m.code === code)
}

export function isValidModuleCode(code: string): boolean {
  return MODULES.some(m => m.code === code)
}
