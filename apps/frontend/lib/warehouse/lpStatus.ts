// License Plate Status Helpers
// Helper functions for displaying and styling LP status values
// Synchronized with migration 058_fix_lp_status_enum.sql

import type { LicensePlateStatus } from '../types';

/**
 * Convert snake_case LP status to human-readable Title Case label
 *
 * @param status - LP status value from database (lowercase snake_case)
 * @returns Title Case display label for UI
 *
 * @example
 * getLPStatusLabel('in_production') // → 'In Production'
 * getLPStatusLabel('qa_passed') // → 'QA Passed'
 */
export function getLPStatusLabel(status: LicensePlateStatus): string {
  const labels: Record<LicensePlateStatus, string> = {
    available: 'Available',
    reserved: 'Reserved',
    in_production: 'In Production',
    consumed: 'Consumed',
    in_transit: 'In Transit',
    quarantine: 'Quarantine',
    qa_passed: 'QA Passed',
    qa_rejected: 'QA Rejected',
    shipped: 'Shipped',
    damaged: 'Damaged',
  };

  return labels[status] || status;
}

/**
 * Get Tailwind CSS color classes for LP status badge
 *
 * Color scheme:
 * - Green: available, qa_passed (good states)
 * - Blue: reserved, in_production (active workflow)
 * - Purple: in_transit (movement)
 * - Orange: quarantine (hold/review)
 * - Red: qa_rejected, damaged (problems)
 * - Gray: consumed, shipped (final states)
 *
 * @param status - LP status value
 * @returns Tailwind CSS classes for badge styling
 */
export function getLPStatusColor(status: LicensePlateStatus): string {
  const colors: Record<LicensePlateStatus, string> = {
    // Good states - Green
    available: 'bg-green-100 text-green-800 border-green-200',
    qa_passed: 'bg-green-100 text-green-800 border-green-200',

    // Active workflow - Blue
    reserved: 'bg-blue-100 text-blue-800 border-blue-200',
    in_production: 'bg-blue-100 text-blue-800 border-blue-200',

    // Movement - Purple
    in_transit: 'bg-purple-100 text-purple-800 border-purple-200',

    // Hold/Review - Orange
    quarantine: 'bg-orange-100 text-orange-800 border-orange-200',

    // Problem states - Red
    qa_rejected: 'bg-red-100 text-red-800 border-red-200',
    damaged: 'bg-red-100 text-red-800 border-red-200',

    // Final states - Gray
    consumed: 'bg-gray-100 text-gray-800 border-gray-200',
    shipped: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Get description/tooltip for LP status value
 *
 * @param status - LP status value
 * @returns Human-readable description of what the status means
 */
export function getLPStatusDescription(status: LicensePlateStatus): string {
  const descriptions: Record<LicensePlateStatus, string> = {
    available: 'In warehouse, ready for use or shipping',
    reserved: 'Reserved for specific Work Order',
    in_production: 'Actively being consumed/processed in WO',
    consumed: 'Fully consumed by WO, genealogy locked',
    in_transit: 'Moving between warehouses',
    quarantine: 'Held for QA inspection',
    qa_passed: 'Passed QA inspection, available for use',
    qa_rejected: 'Failed QA inspection, may require rework',
    shipped: 'Shipped to customer (final state)',
    damaged: 'Physically damaged, unusable',
  };

  return descriptions[status] || '';
}

/**
 * Get lifecycle path for LP status
 * Helps visualize which workflow path the status belongs to
 *
 * @param status - LP status value
 * @returns Workflow path name
 */
export function getLPStatusPath(status: LicensePlateStatus): string {
  const paths: Record<LicensePlateStatus, string> = {
    available: 'Primary',
    reserved: 'Primary',
    in_production: 'Primary',
    consumed: 'Primary',
    in_transit: 'Transit',
    quarantine: 'QA',
    qa_passed: 'QA',
    qa_rejected: 'QA',
    shipped: 'Shipping',
    damaged: 'Problem',
  };

  return paths[status] || 'Unknown';
}

/**
 * Check if LP status allows consumption
 *
 * @param status - LP status value
 * @returns true if LP can be consumed in production
 */
export function canConsumeLPStatus(status: LicensePlateStatus): boolean {
  return status === 'available' || status === 'reserved' || status === 'qa_passed';
}

/**
 * Check if LP status allows shipping
 *
 * @param status - LP status value
 * @returns true if LP can be shipped
 */
export function canShipLPStatus(status: LicensePlateStatus): boolean {
  return status === 'available' || status === 'qa_passed';
}

/**
 * Check if LP status is a final/terminal state
 *
 * @param status - LP status value
 * @returns true if status is terminal (no further transitions)
 */
export function isTerminalLPStatus(status: LicensePlateStatus): boolean {
  return status === 'consumed' || status === 'shipped';
}

/**
 * Check if LP status indicates a problem
 *
 * @param status - LP status value
 * @returns true if status indicates damage or QA rejection
 */
export function isProblemLPStatus(status: LicensePlateStatus): boolean {
  return status === 'damaged' || status === 'qa_rejected';
}

/**
 * All valid LP status values in lifecycle order
 */
export const LP_STATUS_VALUES: LicensePlateStatus[] = [
  'available',
  'reserved',
  'in_production',
  'consumed',
  'in_transit',
  'quarantine',
  'qa_passed',
  'qa_rejected',
  'shipped',
  'damaged',
];

/**
 * LP status values grouped by lifecycle path
 */
export const LP_STATUS_BY_PATH = {
  primary: ['available', 'reserved', 'in_production', 'consumed'] as LicensePlateStatus[],
  shipping: ['available', 'shipped'] as LicensePlateStatus[],
  qa: ['quarantine', 'qa_passed', 'qa_rejected'] as LicensePlateStatus[],
  transit: ['in_transit'] as LicensePlateStatus[],
  problem: ['damaged'] as LicensePlateStatus[],
};
