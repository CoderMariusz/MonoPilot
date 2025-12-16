/**
 * Module Types
 * Story: 01.1 - Org Context + Base RLS
 * ADR-011: Module Toggle Storage
 */

export interface Module {
  id: string
  code: string
  name: string
  dependencies: string[]
  can_disable: boolean
  display_order: number
}

export interface OrganizationModule {
  id: string
  org_id: string
  module_id: string
  enabled: boolean
  enabled_at?: string
  enabled_by?: string
}
