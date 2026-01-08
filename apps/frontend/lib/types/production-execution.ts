/**
 * Production Execution Types
 * Story: 04.2a - WO Start
 */

export type UUID = string;

export enum WorkOrderStatus {
  DRAFT = 'draft',
  RELEASED = 'released',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface WorkOrder {
  id: UUID;
  org_id: UUID;
  wo_number: string;
  product_id: UUID;
  product_name?: string;
  status: WorkOrderStatus;
  production_line_id: UUID | null;
  machine_id: UUID | null;
  planned_qty: number;
  started_at: string | null;
  started_by: UUID | null;
  completed_at: string | null;
  completed_by: UUID | null;
  updated_at: string;
  updated_by: UUID | null;
}

export interface StartWorkOrderOptions {
  line_id?: UUID;
  machine_id?: UUID;
  force?: boolean;
}

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
  warnings?: string[];
}

export interface MaterialAvailabilityItem {
  wo_material_id: UUID;
  product_id: UUID;
  product_name: string;
  required_qty: number;
  available_qty: number;
  availability_percent: number;
  uom: string;
}

export interface MaterialAvailability {
  overall_percent: number;
  materials: MaterialAvailabilityItem[];
}

export interface LineAvailabilityStatus {
  available: boolean;
  current_wo?: string;
}
