// Core domain types for MonoPilot MES

export interface Organization {
  id: string
  company_name: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  full_name?: string
  role: UserRole
  org_id: string
  created_at: string
}

export type UserRole =
  | 'admin'
  | 'manager'
  | 'operator'
  | 'viewer'
  | 'planner'
  | 'technical'
  | 'purchasing'
  | 'warehouse'
  | 'qc'

// Add more types as needed
