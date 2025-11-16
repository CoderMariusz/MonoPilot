// QA Status Helpers
// Helper functions for displaying and styling QA status values
// Synchronized with database CHECK constraint (migration 025)

import type { QAStatus } from '../types';

/**
 * Convert snake_case QA status to human-readable Title Case label
 *
 * @param status - QA status value from database (lowercase snake_case)
 * @returns Title Case display label for UI
 *
 * @example
 * getQAStatusLabel('on_hold') // → 'On Hold'
 * getQAStatusLabel('pending') // → 'Pending'
 */
export function getQAStatusLabel(status: QAStatus): string {
  const labels: Record<QAStatus, string> = {
    pending: 'Pending',
    passed: 'Passed',
    failed: 'Failed',
    on_hold: 'On Hold',
  };

  return labels[status] || status;
}

/**
 * Get Tailwind CSS color classes for QA status badge
 *
 * Color scheme:
 * - Green: passed (approved)
 * - Red: failed (rejected)
 * - Yellow: pending (awaiting inspection)
 * - Orange: on_hold (inspection in progress)
 *
 * @param status - QA status value
 * @returns Tailwind CSS classes for badge styling
 */
export function getQAStatusColor(status: QAStatus): string {
  const colors: Record<QAStatus, string> = {
    passed: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    on_hold: 'bg-orange-100 text-orange-800 border-orange-200',
  };

  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Get description/tooltip for QA status value
 *
 * @param status - QA status value
 * @returns Human-readable description of what the status means
 */
export function getQAStatusDescription(status: QAStatus): string {
  const descriptions: Record<QAStatus, string> = {
    pending: 'Awaiting QA inspection',
    passed: 'Passed QA inspection, approved for use',
    failed: 'Failed QA inspection, rejected',
    on_hold: 'QA inspection in progress or on hold',
  };

  return descriptions[status] || '';
}

/**
 * All valid QA status values in workflow order
 */
export const QA_STATUS_VALUES: QAStatus[] = ['pending', 'on_hold', 'passed', 'failed'];

/**
 * QA status values that allow further processing
 */
export const QA_STATUS_APPROVED: QAStatus[] = ['passed'];

/**
 * QA status values that block further processing
 */
export const QA_STATUS_BLOCKED: QAStatus[] = ['failed', 'on_hold'];

/**
 * Check if QA status allows LP to be used in production
 *
 * @param status - QA status value
 * @returns true if status allows usage
 */
export function isQAApproved(status: QAStatus): boolean {
  return status === 'passed';
}

/**
 * Check if QA status blocks LP from being used
 *
 * @param status - QA status value
 * @returns true if status blocks usage
 */
export function isQABlocked(status: QAStatus): boolean {
  return status === 'failed' || status === 'on_hold';
}
