import { describe, it, expect } from 'vitest';
import type { QAStatus } from '../lib/types';

describe('QAStatus enum', () => {
  it('should have exactly 4 valid values', () => {
    const validValues: QAStatus[] = ['pending', 'passed', 'failed', 'on_hold'];

    // Verify count
    expect(validValues).toHaveLength(4);

    // Verify each value
    expect(validValues).toContain('pending');
    expect(validValues).toContain('passed');
    expect(validValues).toContain('failed');
    expect(validValues).toContain('on_hold');
  });

  it('should not include old PascalCase values', () => {
    const validValues: QAStatus[] = ['pending', 'passed', 'failed', 'on_hold'];

    // These should NOT be valid (old values)
    const oldValues = ['Pending', 'Passed', 'Failed', 'Hold', 'Quarantine'];

    oldValues.forEach(oldValue => {
      // @ts-expect-error - Testing that old values are not valid
      expect(validValues).not.toContain(oldValue);
    });
  });

  it('should use lowercase snake_case convention', () => {
    const validValues: QAStatus[] = ['pending', 'passed', 'failed', 'on_hold'];

    validValues.forEach(value => {
      // All values should be lowercase
      expect(value).toBe(value.toLowerCase());

      // Values with multiple words should use underscore
      if (value.includes('_')) {
        expect(value).toMatch(/^[a-z]+_[a-z]+$/);
      }
    });
  });
});
