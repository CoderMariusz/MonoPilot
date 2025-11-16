import { describe, it, expect } from 'vitest';
import {
  getLPStatusLabel,
  getLPStatusColor,
  getLPStatusDescription,
  getLPStatusPath,
  canConsumeLPStatus,
  canShipLPStatus,
  isTerminalLPStatus,
  isProblemLPStatus,
  LP_STATUS_VALUES,
  LP_STATUS_BY_PATH,
} from '../lpStatus';
import type { LicensePlateStatus } from '../../types';

describe('LP Status Helpers', () => {
  describe('getLPStatusLabel', () => {
    it('converts snake_case status to Title Case', () => {
      expect(getLPStatusLabel('available')).toBe('Available');
      expect(getLPStatusLabel('in_production')).toBe('In Production');
      expect(getLPStatusLabel('qa_passed')).toBe('QA Passed');
      expect(getLPStatusLabel('qa_rejected')).toBe('QA Rejected');
    });

    it('handles all valid LP status values', () => {
      const statusLabels: Record<LicensePlateStatus, string> = {
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

      Object.entries(statusLabels).forEach(([status, expectedLabel]) => {
        expect(getLPStatusLabel(status as LicensePlateStatus)).toBe(expectedLabel);
      });
    });

    it('returns original value for unknown status', () => {
      expect(getLPStatusLabel('unknown_status' as LicensePlateStatus)).toBe('unknown_status');
    });
  });

  describe('getLPStatusColor', () => {
    it('returns green for good states (available, qa_passed)', () => {
      expect(getLPStatusColor('available')).toContain('bg-green-100');
      expect(getLPStatusColor('available')).toContain('text-green-800');
      expect(getLPStatusColor('qa_passed')).toContain('bg-green-100');
    });

    it('returns blue for active workflow states (reserved, in_production)', () => {
      expect(getLPStatusColor('reserved')).toContain('bg-blue-100');
      expect(getLPStatusColor('in_production')).toContain('bg-blue-100');
    });

    it('returns purple for movement state (in_transit)', () => {
      expect(getLPStatusColor('in_transit')).toContain('bg-purple-100');
    });

    it('returns orange for hold/review state (quarantine)', () => {
      expect(getLPStatusColor('quarantine')).toContain('bg-orange-100');
    });

    it('returns red for problem states (qa_rejected, damaged)', () => {
      expect(getLPStatusColor('qa_rejected')).toContain('bg-red-100');
      expect(getLPStatusColor('damaged')).toContain('bg-red-100');
    });

    it('returns gray for final states (consumed, shipped)', () => {
      expect(getLPStatusColor('consumed')).toContain('bg-gray-100');
      expect(getLPStatusColor('shipped')).toContain('bg-gray-100');
    });

    it('returns default gray for unknown status', () => {
      expect(getLPStatusColor('unknown' as LicensePlateStatus)).toContain('bg-gray-100');
    });
  });

  describe('getLPStatusDescription', () => {
    it('returns meaningful descriptions for all statuses', () => {
      expect(getLPStatusDescription('available')).toContain('ready');
      expect(getLPStatusDescription('reserved')).toContain('Work Order');
      expect(getLPStatusDescription('in_production')).toContain('consumed');
      expect(getLPStatusDescription('consumed')).toContain('genealogy');
      expect(getLPStatusDescription('in_transit')).toContain('warehouses');
      expect(getLPStatusDescription('quarantine')).toContain('QA');
      expect(getLPStatusDescription('qa_passed')).toContain('Passed');
      expect(getLPStatusDescription('qa_rejected')).toContain('Failed');
      expect(getLPStatusDescription('shipped')).toContain('customer');
      expect(getLPStatusDescription('damaged')).toContain('damaged');
    });

    it('returns empty string for unknown status', () => {
      expect(getLPStatusDescription('unknown' as LicensePlateStatus)).toBe('');
    });
  });

  describe('getLPStatusPath', () => {
    it('identifies primary workflow path', () => {
      expect(getLPStatusPath('available')).toBe('Primary');
      expect(getLPStatusPath('reserved')).toBe('Primary');
      expect(getLPStatusPath('in_production')).toBe('Primary');
      expect(getLPStatusPath('consumed')).toBe('Primary');
    });

    it('identifies QA workflow path', () => {
      expect(getLPStatusPath('quarantine')).toBe('QA');
      expect(getLPStatusPath('qa_passed')).toBe('QA');
      expect(getLPStatusPath('qa_rejected')).toBe('QA');
    });

    it('identifies shipping workflow path', () => {
      expect(getLPStatusPath('shipped')).toBe('Shipping');
    });

    it('identifies transit workflow path', () => {
      expect(getLPStatusPath('in_transit')).toBe('Transit');
    });

    it('identifies problem workflow path', () => {
      expect(getLPStatusPath('damaged')).toBe('Problem');
    });
  });

  describe('canConsumeLPStatus', () => {
    it('allows consumption for available status', () => {
      expect(canConsumeLPStatus('available')).toBe(true);
    });

    it('allows consumption for reserved status', () => {
      expect(canConsumeLPStatus('reserved')).toBe(true);
    });

    it('allows consumption for qa_passed status', () => {
      expect(canConsumeLPStatus('qa_passed')).toBe(true);
    });

    it('prevents consumption for terminal states', () => {
      expect(canConsumeLPStatus('consumed')).toBe(false);
      expect(canConsumeLPStatus('shipped')).toBe(false);
    });

    it('prevents consumption for problem states', () => {
      expect(canConsumeLPStatus('damaged')).toBe(false);
      expect(canConsumeLPStatus('qa_rejected')).toBe(false);
    });

    it('prevents consumption for transit/quarantine states', () => {
      expect(canConsumeLPStatus('in_transit')).toBe(false);
      expect(canConsumeLPStatus('quarantine')).toBe(false);
    });
  });

  describe('canShipLPStatus', () => {
    it('allows shipping for available status', () => {
      expect(canShipLPStatus('available')).toBe(true);
    });

    it('allows shipping for qa_passed status', () => {
      expect(canShipLPStatus('qa_passed')).toBe(true);
    });

    it('prevents shipping for all other statuses', () => {
      expect(canShipLPStatus('reserved')).toBe(false);
      expect(canShipLPStatus('in_production')).toBe(false);
      expect(canShipLPStatus('consumed')).toBe(false);
      expect(canShipLPStatus('in_transit')).toBe(false);
      expect(canShipLPStatus('quarantine')).toBe(false);
      expect(canShipLPStatus('qa_rejected')).toBe(false);
      expect(canShipLPStatus('shipped')).toBe(false);
      expect(canShipLPStatus('damaged')).toBe(false);
    });
  });

  describe('isTerminalLPStatus', () => {
    it('identifies consumed as terminal', () => {
      expect(isTerminalLPStatus('consumed')).toBe(true);
    });

    it('identifies shipped as terminal', () => {
      expect(isTerminalLPStatus('shipped')).toBe(true);
    });

    it('identifies all other statuses as non-terminal', () => {
      const nonTerminalStatuses: LicensePlateStatus[] = [
        'available',
        'reserved',
        'in_production',
        'in_transit',
        'quarantine',
        'qa_passed',
        'qa_rejected',
        'damaged',
      ];

      nonTerminalStatuses.forEach((status) => {
        expect(isTerminalLPStatus(status)).toBe(false);
      });
    });
  });

  describe('isProblemLPStatus', () => {
    it('identifies damaged as problem status', () => {
      expect(isProblemLPStatus('damaged')).toBe(true);
    });

    it('identifies qa_rejected as problem status', () => {
      expect(isProblemLPStatus('qa_rejected')).toBe(true);
    });

    it('identifies all other statuses as non-problem', () => {
      const nonProblemStatuses: LicensePlateStatus[] = [
        'available',
        'reserved',
        'in_production',
        'consumed',
        'in_transit',
        'quarantine',
        'qa_passed',
        'shipped',
      ];

      nonProblemStatuses.forEach((status) => {
        expect(isProblemLPStatus(status)).toBe(false);
      });
    });
  });

  describe('LP_STATUS_VALUES constant', () => {
    it('contains all 10 valid LP status values', () => {
      expect(LP_STATUS_VALUES).toHaveLength(10);
      expect(LP_STATUS_VALUES).toContain('available');
      expect(LP_STATUS_VALUES).toContain('reserved');
      expect(LP_STATUS_VALUES).toContain('in_production');
      expect(LP_STATUS_VALUES).toContain('consumed');
      expect(LP_STATUS_VALUES).toContain('in_transit');
      expect(LP_STATUS_VALUES).toContain('quarantine');
      expect(LP_STATUS_VALUES).toContain('qa_passed');
      expect(LP_STATUS_VALUES).toContain('qa_rejected');
      expect(LP_STATUS_VALUES).toContain('shipped');
      expect(LP_STATUS_VALUES).toContain('damaged');
    });

    it('contains only unique values', () => {
      const uniqueValues = new Set(LP_STATUS_VALUES);
      expect(uniqueValues.size).toBe(LP_STATUS_VALUES.length);
    });
  });

  describe('LP_STATUS_BY_PATH constant', () => {
    it('groups primary workflow statuses correctly', () => {
      expect(LP_STATUS_BY_PATH.primary).toEqual([
        'available',
        'reserved',
        'in_production',
        'consumed',
      ]);
    });

    it('groups shipping workflow statuses correctly', () => {
      expect(LP_STATUS_BY_PATH.shipping).toEqual(['available', 'shipped']);
    });

    it('groups QA workflow statuses correctly', () => {
      expect(LP_STATUS_BY_PATH.qa).toEqual(['quarantine', 'qa_passed', 'qa_rejected']);
    });

    it('groups transit workflow statuses correctly', () => {
      expect(LP_STATUS_BY_PATH.transit).toEqual(['in_transit']);
    });

    it('groups problem workflow statuses correctly', () => {
      expect(LP_STATUS_BY_PATH.problem).toEqual(['damaged']);
    });

    it('covers all 10 status values across all paths', () => {
      const allPathStatuses = [
        ...LP_STATUS_BY_PATH.primary,
        ...LP_STATUS_BY_PATH.shipping.filter((s) => !LP_STATUS_BY_PATH.primary.includes(s)),
        ...LP_STATUS_BY_PATH.qa,
        ...LP_STATUS_BY_PATH.transit,
        ...LP_STATUS_BY_PATH.problem,
      ];

      const uniqueStatuses = new Set(allPathStatuses);
      expect(uniqueStatuses.size).toBe(10);
    });
  });

  describe('Edge cases', () => {
    it('handles empty string gracefully', () => {
      expect(getLPStatusLabel('' as LicensePlateStatus)).toBe('');
      expect(getLPStatusColor('' as LicensePlateStatus)).toContain('bg-gray-100');
      expect(getLPStatusDescription('' as LicensePlateStatus)).toBe('');
    });

    it('all helpers handle all valid status values without errors', () => {
      LP_STATUS_VALUES.forEach((status) => {
        expect(() => getLPStatusLabel(status)).not.toThrow();
        expect(() => getLPStatusColor(status)).not.toThrow();
        expect(() => getLPStatusDescription(status)).not.toThrow();
        expect(() => getLPStatusPath(status)).not.toThrow();
        expect(() => canConsumeLPStatus(status)).not.toThrow();
        expect(() => canShipLPStatus(status)).not.toThrow();
        expect(() => isTerminalLPStatus(status)).not.toThrow();
        expect(() => isProblemLPStatus(status)).not.toThrow();
      });
    });

    it('color classes are valid Tailwind CSS', () => {
      LP_STATUS_VALUES.forEach((status) => {
        const color = getLPStatusColor(status);

        // Should contain background color class
        expect(color).toMatch(/bg-(green|blue|purple|orange|red|gray)-\d{3}/);

        // Should contain text color class
        expect(color).toMatch(/text-(green|blue|purple|orange|red|gray)-\d{3}/);

        // Should contain border color class
        expect(color).toMatch(/border-(green|blue|purple|orange|red|gray)-\d{3}/);
      });
    });
  });

  describe('Business logic consistency', () => {
    it('consumable statuses should not be terminal', () => {
      LP_STATUS_VALUES.forEach((status) => {
        if (canConsumeLPStatus(status)) {
          expect(isTerminalLPStatus(status)).toBe(false);
        }
      });
    });

    it('shippable statuses should not be terminal', () => {
      LP_STATUS_VALUES.forEach((status) => {
        if (canShipLPStatus(status)) {
          expect(isTerminalLPStatus(status)).toBe(false);
        }
      });
    });

    it('problem statuses should not be consumable or shippable', () => {
      LP_STATUS_VALUES.forEach((status) => {
        if (isProblemLPStatus(status)) {
          expect(canConsumeLPStatus(status)).toBe(false);
          expect(canShipLPStatus(status)).toBe(false);
        }
      });
    });

    it('terminal statuses should not be consumable or shippable', () => {
      LP_STATUS_VALUES.forEach((status) => {
        if (isTerminalLPStatus(status)) {
          expect(canConsumeLPStatus(status)).toBe(false);
          expect(canShipLPStatus(status)).toBe(false);
        }
      });
    });

    it('qa_passed should be consumable and shippable', () => {
      expect(canConsumeLPStatus('qa_passed')).toBe(true);
      expect(canShipLPStatus('qa_passed')).toBe(true);
    });

    it('available should be consumable and shippable', () => {
      expect(canConsumeLPStatus('available')).toBe(true);
      expect(canShipLPStatus('available')).toBe(true);
    });
  });
});
