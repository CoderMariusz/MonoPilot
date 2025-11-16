// Phase 1 Planning Status Machine
// Frontend-first validation logic for PO/TO status transitions

import { POHeader, POLine, TOHeader, TOLine, POStatus, TOStatus } from '../types';

// =============================================
// PO STATUS MACHINE
// =============================================

export type POAction = 'approve' | 'close' | 'reopen';

export interface POStatusTransition {
  from: POStatus;
  to: POStatus;
  action: POAction;
  requiredFields: string[];
  validationRules: string[];
}

// PO workflow: draft -> submitted -> confirmed -> received -> closed
export const PO_STATUS_TRANSITIONS: POStatusTransition[] = [
  {
    from: 'draft',
    to: 'submitted',
    action: 'approve',
    requiredFields: ['approved_by'],
    validationRules: [
      'po_has_lines',
      'all_lines_have_prices',
      'all_lines_have_uom',
      'all_lines_have_items'
    ]
  },
  {
    from: 'submitted',
    to: 'closed',
    action: 'close',
    requiredFields: ['close_reason'],
    validationRules: [
      'po_has_lines',
      'close_reason_provided'
    ]
  },
  {
    from: 'confirmed',
    to: 'closed',
    action: 'close',
    requiredFields: ['close_reason'],
    validationRules: [
      'po_has_lines',
      'close_reason_provided'
    ]
  },
  {
    from: 'received',
    to: 'closed',
    action: 'close',
    requiredFields: [],
    validationRules: [
      'po_has_lines'
    ]
  },
  {
    from: 'submitted',
    to: 'draft',
    action: 'reopen',
    requiredFields: ['reopen_reason'],
    validationRules: [
      'reopen_reason_provided',
      'user_has_approver_role'
    ]
  },
  {
    from: 'closed',
    to: 'draft',
    action: 'reopen',
    requiredFields: ['reopen_reason'],
    validationRules: [
      'reopen_reason_provided',
      'user_has_approver_role'
    ]
  }
];

// =============================================
// TO STATUS MACHINE
// =============================================

export type TOAction = 'approve' | 'close' | 'reopen';

export interface TOStatusTransition {
  from: TOStatus;
  to: TOStatus;
  action: TOAction;
  requiredFields: string[];
  validationRules: string[];
}

// TO workflow: draft -> submitted -> in_transit -> received -> closed
// Can be cancelled at any stage before closed
export const TO_STATUS_TRANSITIONS: TOStatusTransition[] = [
  {
    from: 'draft',
    to: 'submitted',
    action: 'approve',
    requiredFields: ['approved_by'],
    validationRules: [
      'to_has_lines',
      'all_lines_have_items',
      'all_lines_have_quantities'
    ]
  },
  {
    from: 'received',
    to: 'closed',
    action: 'close',
    requiredFields: [],
    validationRules: [
      'to_has_lines'
    ]
  },
  {
    from: 'submitted',
    to: 'draft',
    action: 'reopen',
    requiredFields: ['reopen_reason'],
    validationRules: [
      'reopen_reason_provided',
      'user_has_approver_role'
    ]
  },
  {
    from: 'received',
    to: 'draft',
    action: 'reopen',
    requiredFields: ['reopen_reason'],
    validationRules: [
      'reopen_reason_provided',
      'user_has_approver_role'
    ]
  },
  {
    from: 'closed',
    to: 'draft',
    action: 'reopen',
    requiredFields: ['reopen_reason'],
    validationRules: [
      'reopen_reason_provided',
      'user_has_approver_role'
    ]
  }
];

// =============================================
// VALIDATION FUNCTIONS
// =============================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface POValidationData {
  po: POHeader;
  lines: POLine[];
  userRole: string;
  action: POAction;
  formData?: any;
}

export interface TOValidationData {
  to: TOHeader;
  lines: TOLine[];
  userRole: string;
  action: TOAction;
  formData?: any;
}

// PO Validation Functions
export function validatePOAction(data: POValidationData): ValidationResult {
  const { po, lines, userRole, action, formData } = data;
  const errors: string[] = [];
  const warnings: string[] = [];

  // Find the transition
  const transition = PO_STATUS_TRANSITIONS.find(
    t => t.from === po.status && t.action === action
  );

  if (!transition) {
    errors.push(`Invalid action '${action}' for PO status '${po.status}'`);
    return { isValid: false, errors, warnings };
  }

  // Check required fields
  for (const field of transition.requiredFields) {
    if (!formData?.[field]) {
      errors.push(`Required field '${field}' is missing`);
    }
  }

  // Run validation rules
  for (const rule of transition.validationRules) {
    const result = validatePORule(rule, { po, lines, userRole, formData });
    if (!result.isValid) {
      errors.push(...result.errors);
    }
    if (result.warnings.length > 0) {
      warnings.push(...result.warnings);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// TO Validation Functions
export function validateTOAction(data: TOValidationData): ValidationResult {
  const { to, lines, userRole, action, formData } = data;
  const errors: string[] = [];
  const warnings: string[] = [];

  // Find the transition
  const transition = TO_STATUS_TRANSITIONS.find(
    t => t.from === to.status && t.action === action
  );

  if (!transition) {
    errors.push(`Invalid action '${action}' for TO status '${to.status}'`);
    return { isValid: false, errors, warnings };
  }

  // Check required fields
  for (const field of transition.requiredFields) {
    if (!formData?.[field]) {
      errors.push(`Required field '${field}' is missing`);
    }
  }

  // Run validation rules
  for (const rule of transition.validationRules) {
    const result = validateTORule(rule, { to, lines, userRole, formData });
    if (!result.isValid) {
      errors.push(...result.errors);
    }
    if (result.warnings.length > 0) {
      warnings.push(...result.warnings);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// =============================================
// RULE VALIDATORS
// =============================================

function validatePORule(
  rule: string,
  data: { po: POHeader; lines: POLine[]; userRole: string; formData?: any }
): ValidationResult {
  const { po, lines, userRole, formData } = data;
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (rule) {
    case 'po_has_lines':
      if (!lines || lines.length === 0) {
        errors.push('PO must have at least one line item');
      }
      break;

    case 'all_lines_have_prices':
      const linesWithoutPrices = lines.filter(line => !line.unit_price || line.unit_price <= 0);
      if (linesWithoutPrices.length > 0) {
        errors.push(`${linesWithoutPrices.length} line(s) missing valid unit prices`);
      }
      break;

    case 'all_lines_have_uom':
      const linesWithoutUom = lines.filter(line => !line.uom);
      if (linesWithoutUom.length > 0) {
        errors.push(`${linesWithoutUom.length} line(s) missing UoM`);
      }
      break;

    case 'all_lines_have_items':
      const linesWithoutItems = lines.filter(line => !line.item_id);
      if (linesWithoutItems.length > 0) {
        errors.push(`${linesWithoutItems.length} line(s) missing items`);
      }
      break;

    case 'close_reason_provided':
      if (!formData?.close_reason?.trim()) {
        errors.push('Close reason is required');
      }
      break;

    case 'reopen_reason_provided':
      if (!formData?.reopen_reason?.trim()) {
        errors.push('Reopen reason is required');
      }
      break;

    case 'user_has_approver_role':
      if (userRole !== 'planner_approver' && userRole !== 'Admin') {
        errors.push('Only planner approvers can reopen orders');
      }
      break;

    default:
      errors.push(`Unknown validation rule: ${rule}`);
  }

  return { isValid: errors.length === 0, errors, warnings };
}

function validateTORule(
  rule: string,
  data: { to: TOHeader; lines: TOLine[]; userRole: string; formData?: any }
): ValidationResult {
  const { to, lines, userRole, formData } = data;
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (rule) {
    case 'to_has_lines':
      if (!lines || lines.length === 0) {
        errors.push('TO must have at least one line item');
      }
      break;

    case 'all_lines_have_items':
      const linesWithoutItems = lines.filter(line => !line.item_id);
      if (linesWithoutItems.length > 0) {
        errors.push(`${linesWithoutItems.length} line(s) missing items`);
      }
      break;

    case 'all_lines_have_quantities':
      const linesWithoutQuantities = lines.filter(line => !line.qty_planned || line.qty_planned <= 0);
      if (linesWithoutQuantities.length > 0) {
        errors.push(`${linesWithoutQuantities.length} line(s) missing valid quantities`);
      }
      break;

    case 'close_reason_provided':
      if (!formData?.close_reason?.trim()) {
        errors.push('Close reason is required');
      }
      break;

    case 'reopen_reason_provided':
      if (!formData?.reopen_reason?.trim()) {
        errors.push('Reopen reason is required');
      }
      break;

    case 'user_has_approver_role':
      if (userRole !== 'planner_approver' && userRole !== 'Admin') {
        errors.push('Only planner approvers can reopen orders');
      }
      break;

    default:
      errors.push(`Unknown validation rule: ${rule}`);
  }

  return { isValid: errors.length === 0, errors, warnings };
}

// =============================================
// CONVENIENCE FUNCTIONS
// =============================================

export function canApprovePO(po: POHeader, lines: POLine[], userRole: string): boolean {
  const result = validatePOAction({
    po,
    lines,
    userRole,
    action: 'approve',
    formData: { approved_by: 'current_user' }
  });
  return result.isValid;
}

export function canClosePO(po: POHeader, lines: POLine[], userRole: string): boolean {
  const result = validatePOAction({
    po,
    lines,
    userRole,
    action: 'close',
    formData: { close_reason: 'test' }
  });
  return result.isValid;
}

export function canReopenPO(po: POHeader, userRole: string): boolean {
  const result = validatePOAction({
    po,
    lines: [],
    userRole,
    action: 'reopen',
    formData: { reopen_reason: 'test' }
  });
  return result.isValid;
}

export function canApproveTO(to: TOHeader, lines: TOLine[], userRole: string): boolean {
  const result = validateTOAction({
    to,
    lines,
    userRole,
    action: 'approve',
    formData: { approved_by: 'current_user' }
  });
  return result.isValid;
}

export function canCloseTO(to: TOHeader, lines: TOLine[], userRole: string): boolean {
  const result = validateTOAction({
    to,
    lines,
    userRole,
    action: 'close',
    formData: {}
  });
  return result.isValid;
}

export function canReopenTO(to: TOHeader, userRole: string): boolean {
  const result = validateTOAction({
    to,
    lines: [],
    userRole,
    action: 'reopen',
    formData: { reopen_reason: 'test' }
  });
  return result.isValid;
}

// =============================================
// STATUS HELPERS
// =============================================

export function getNextPOStatus(currentStatus: POStatus, action: POAction): POStatus | null {
  const transition = PO_STATUS_TRANSITIONS.find(
    t => t.from === currentStatus && t.action === action
  );
  return transition?.to || null;
}

export function getNextTOStatus(currentStatus: TOStatus, action: TOAction): TOStatus | null {
  const transition = TO_STATUS_TRANSITIONS.find(
    t => t.from === currentStatus && t.action === action
  );
  return transition?.to || null;
}

export function getAvailablePOActions(status: POStatus, userRole: string): POAction[] {
  return PO_STATUS_TRANSITIONS
    .filter(t => t.from === status)
    .filter(t => {
      // Check role-based permissions
      if (t.action === 'reopen') {
        return userRole === 'planner_approver' || userRole === 'Admin';
      }
      return true;
    })
    .map(t => t.action);
}

export function getAvailableTOActions(status: TOStatus, userRole: string): TOAction[] {
  return TO_STATUS_TRANSITIONS
    .filter(t => t.from === status)
    .filter(t => {
      // Check role-based permissions
      if (t.action === 'reopen') {
        return userRole === 'planner_approver' || userRole === 'Admin';
      }
      return true;
    })
    .map(t => t.action);
}
