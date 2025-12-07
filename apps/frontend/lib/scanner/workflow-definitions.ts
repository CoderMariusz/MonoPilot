// Scanner Workflow Definitions
// Epic 5 Story 5.23: Scanner Guided Workflows

export type WorkflowType = 'receive' | 'move' | 'pick' | 'putaway' | 'count' | 'lookup'
export type ScanType = 'lp' | 'location' | 'product' | 'pallet' | 'asn' | 'po' | 'wo'

export interface WorkflowStep {
  id: string
  order: number
  name: string
  instruction: string
  expected_scan_type: ScanType
  optional?: boolean
  allow_manual_entry?: boolean
  validation_rules?: {
    required?: boolean
    pattern?: string
    custom?: string
  }
}

export interface WorkflowDefinition {
  type: WorkflowType
  name: string
  description: string
  steps: WorkflowStep[]
  requires_permissions?: string[]
}

// Workflow: Receive from PO/ASN
const RECEIVE_WORKFLOW: WorkflowDefinition = {
  type: 'receive',
  name: 'Receive Material',
  description: 'Receive material from purchase order or ASN',
  steps: [
    {
      id: 'scan_document',
      order: 1,
      name: 'Scan Document',
      instruction: 'Scan PO or ASN barcode',
      expected_scan_type: 'po',
      validation_rules: { required: true },
    },
    {
      id: 'scan_product',
      order: 2,
      name: 'Scan Product',
      instruction: 'Scan product barcode',
      expected_scan_type: 'product',
      validation_rules: { required: true },
    },
    {
      id: 'scan_location',
      order: 3,
      name: 'Scan Location',
      instruction: 'Scan receiving location',
      expected_scan_type: 'location',
      validation_rules: { required: true },
    },
    {
      id: 'confirm_quantity',
      order: 4,
      name: 'Confirm Quantity',
      instruction: 'Enter received quantity',
      expected_scan_type: 'product',
      allow_manual_entry: true,
      validation_rules: { required: true },
    },
  ],
  requires_permissions: ['warehouse', 'admin'],
}

// Workflow: Move LP
const MOVE_WORKFLOW: WorkflowDefinition = {
  type: 'move',
  name: 'Move License Plate',
  description: 'Move license plate to new location',
  steps: [
    {
      id: 'scan_lp',
      order: 1,
      name: 'Scan LP',
      instruction: 'Scan license plate to move',
      expected_scan_type: 'lp',
      validation_rules: { required: true },
    },
    {
      id: 'scan_destination',
      order: 2,
      name: 'Scan Destination',
      instruction: 'Scan destination location',
      expected_scan_type: 'location',
      validation_rules: { required: true },
    },
    {
      id: 'confirm_move',
      order: 3,
      name: 'Confirm Move',
      instruction: 'Confirm move operation',
      expected_scan_type: 'lp',
      optional: true,
    },
  ],
  requires_permissions: ['warehouse', 'admin'],
}

// Workflow: Pick Material
const PICK_WORKFLOW: WorkflowDefinition = {
  type: 'pick',
  name: 'Pick Material',
  description: 'Pick material for work order',
  steps: [
    {
      id: 'scan_wo',
      order: 1,
      name: 'Scan Work Order',
      instruction: 'Scan work order barcode',
      expected_scan_type: 'wo',
      validation_rules: { required: true },
    },
    {
      id: 'scan_lp',
      order: 2,
      name: 'Scan LP',
      instruction: 'Scan license plate to pick',
      expected_scan_type: 'lp',
      validation_rules: { required: true },
    },
    {
      id: 'confirm_quantity',
      order: 3,
      name: 'Confirm Quantity',
      instruction: 'Enter picked quantity',
      expected_scan_type: 'lp',
      allow_manual_entry: true,
      validation_rules: { required: true },
    },
  ],
  requires_permissions: ['warehouse', 'production', 'admin'],
}

// Workflow: Putaway
const PUTAWAY_WORKFLOW: WorkflowDefinition = {
  type: 'putaway',
  name: 'Putaway Material',
  description: 'Put away received material to storage',
  steps: [
    {
      id: 'scan_lp',
      order: 1,
      name: 'Scan LP',
      instruction: 'Scan license plate to putaway',
      expected_scan_type: 'lp',
      validation_rules: { required: true },
    },
    {
      id: 'scan_location',
      order: 2,
      name: 'Scan Storage Location',
      instruction: 'Scan storage location',
      expected_scan_type: 'location',
      validation_rules: { required: true },
    },
  ],
  requires_permissions: ['warehouse', 'admin'],
}

// Workflow: Inventory Count
const COUNT_WORKFLOW: WorkflowDefinition = {
  type: 'count',
  name: 'Inventory Count',
  description: 'Physical inventory count',
  steps: [
    {
      id: 'scan_location',
      order: 1,
      name: 'Scan Location',
      instruction: 'Scan location to count',
      expected_scan_type: 'location',
      validation_rules: { required: true },
    },
    {
      id: 'scan_lp',
      order: 2,
      name: 'Scan LP',
      instruction: 'Scan license plate',
      expected_scan_type: 'lp',
      validation_rules: { required: true },
    },
    {
      id: 'enter_count',
      order: 3,
      name: 'Enter Count',
      instruction: 'Enter physical count',
      expected_scan_type: 'lp',
      allow_manual_entry: true,
      validation_rules: { required: true },
    },
  ],
  requires_permissions: ['warehouse', 'admin'],
}

// Workflow: Lookup
const LOOKUP_WORKFLOW: WorkflowDefinition = {
  type: 'lookup',
  name: 'Lookup Item',
  description: 'Lookup license plate or location details',
  steps: [
    {
      id: 'scan_item',
      order: 1,
      name: 'Scan Item',
      instruction: 'Scan LP, location, or product',
      expected_scan_type: 'lp',
      validation_rules: { required: true },
    },
  ],
  requires_permissions: ['warehouse', 'production', 'admin'],
}

// Workflow Registry
export const WORKFLOW_DEFINITIONS: Record<WorkflowType, WorkflowDefinition> = {
  receive: RECEIVE_WORKFLOW,
  move: MOVE_WORKFLOW,
  pick: PICK_WORKFLOW,
  putaway: PUTAWAY_WORKFLOW,
  count: COUNT_WORKFLOW,
  lookup: LOOKUP_WORKFLOW,
}

export function getWorkflowDefinition(type: WorkflowType): WorkflowDefinition | null {
  return WORKFLOW_DEFINITIONS[type] || null
}

export function getWorkflowStep(type: WorkflowType, stepId: string): WorkflowStep | null {
  const workflow = getWorkflowDefinition(type)
  if (!workflow) return null
  return workflow.steps.find(step => step.id === stepId) || null
}

export function getNextStep(type: WorkflowType, currentStepId: string): WorkflowStep | null {
  const workflow = getWorkflowDefinition(type)
  if (!workflow) return null

  const currentStep = workflow.steps.find(step => step.id === currentStepId)
  if (!currentStep) return null

  const nextStep = workflow.steps.find(step => step.order === currentStep.order + 1)
  return nextStep || null
}
