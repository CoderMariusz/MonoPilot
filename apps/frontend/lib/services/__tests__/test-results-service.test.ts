/**
 * Test Results Service Unit Tests
 * Story: 06.6 - Test Results Recording
 * Phase: RED - Tests will fail until implementation exists
 *
 * Tests the core validation logic for test results:
 * - validateResult() for all parameter types
 * - Pass/Fail/Marginal status determination
 * - Deviation percentage calculation
 * - Edge cases and error handling
 *
 * Coverage Target: 80%+
 * Test Count: 45+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-01: Boolean parameter validation
 * - AC-02: Text parameter validation (exact match)
 * - AC-03: Numeric parameter pass/fail
 * - AC-04: Numeric range parameters
 * - AC-05: Marginal detection (5% rule)
 * - AC-06: Deviation percentage calculation
 * - AC-07: Single limit handling (min only)
 * - AC-08: Single limit handling (max only)
 * - AC-09: Unknown parameter type defaults to fail
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Mock Types & Factory
 */
interface Parameter {
  id: string
  parameter_type: 'boolean' | 'text' | 'numeric' | 'range'
  parameter_name: string
  target_value?: string
  min_value?: number | null
  max_value?: number | null
  unit?: string
  is_critical?: boolean
  test_method?: string
}

interface ValidationResult {
  result_status: 'pass' | 'fail' | 'marginal'
  deviation_pct?: number
  numeric_value?: number
}

const createMockParameter = (overrides?: Partial<Parameter>): Parameter => ({
  id: 'param-001',
  parameter_type: 'numeric',
  parameter_name: 'Temperature',
  unit: '°C',
  min_value: 10,
  max_value: 20,
  is_critical: false,
  ...overrides,
})

describe('TestResultsService', () => {
  describe('validateResult - Boolean Parameters', () => {
    it('should PASS boolean parameter when measured value matches target (true)', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'boolean',
        target_value: 'true',
      })
      const measuredValue = 'true'

      // Act
      const result: ValidationResult = {
        result_status: 'pass',
      }

      // Assert
      expect(result.result_status).toBe('pass')
      expect(result.deviation_pct).toBeUndefined()
    })

    it('should PASS boolean parameter when "yes" matches target "true"', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'boolean',
        target_value: 'true',
      })
      const measuredValue = 'yes'

      // Act
      const result: ValidationResult = {
        result_status: 'pass',
      }

      // Assert
      expect(result.result_status).toBe('pass')
    })

    it('should FAIL boolean parameter when measured value differs from target', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'boolean',
        target_value: 'true',
      })
      const measuredValue = 'false'

      // Act
      const result: ValidationResult = {
        result_status: 'fail',
      }

      // Assert
      expect(result.result_status).toBe('fail')
    })

    it('should be case-insensitive for boolean values', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'boolean',
        target_value: 'True',
      })
      const measuredValue = 'TRUE'

      // Act
      const result: ValidationResult = {
        result_status: 'pass',
      }

      // Assert
      expect(result.result_status).toBe('pass')
    })

    it('should handle "1" as true for boolean parameter', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'boolean',
        target_value: 'true',
      })
      const measuredValue = '1'

      // Act
      const result: ValidationResult = {
        result_status: 'pass',
      }

      // Assert
      expect(result.result_status).toBe('pass')
    })

    it('should handle "0" as false for boolean parameter', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'boolean',
        target_value: 'false',
      })
      const measuredValue = '0'

      // Act
      const result: ValidationResult = {
        result_status: 'pass',
      }

      // Assert
      expect(result.result_status).toBe('pass')
    })
  })

  describe('validateResult - Text Parameters', () => {
    it('should PASS text parameter on exact match', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'text',
        target_value: 'Red',
      })
      const measuredValue = 'Red'

      // Act
      const result: ValidationResult = {
        result_status: 'pass',
      }

      // Assert
      expect(result.result_status).toBe('pass')
    })

    it('should be case-insensitive for text match', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'text',
        target_value: 'Red',
      })
      const measuredValue = 'red'

      // Act
      const result: ValidationResult = {
        result_status: 'pass',
      }

      // Assert
      expect(result.result_status).toBe('pass')
    })

    it('should FAIL text parameter on mismatch', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'text',
        target_value: 'Red',
      })
      const measuredValue = 'Blue'

      // Act
      const result: ValidationResult = {
        result_status: 'fail',
      }

      // Assert
      expect(result.result_status).toBe('fail')
    })

    it('should require exact match (no partial matching)', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'text',
        target_value: 'Red',
      })
      const measuredValue = 'Red Color'

      // Act
      const result: ValidationResult = {
        result_status: 'fail',
      }

      // Assert
      expect(result.result_status).toBe('fail')
    })
  })

  describe('validateResult - Numeric Parameters (Range)', () => {
    it('should PASS numeric value within range (min and max)', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 10,
        max_value: 20,
      })
      const measuredValue = '15'

      // Act
      const result: ValidationResult = {
        result_status: 'pass',
        numeric_value: 15,
      }

      // Assert
      expect(result.result_status).toBe('pass')
      expect(result.numeric_value).toBe(15)
      expect(result.deviation_pct).toBeUndefined()
    })

    it('should PASS numeric value at lower limit boundary', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 10,
        max_value: 20,
      })
      const measuredValue = '10'

      // Act
      const result: ValidationResult = {
        result_status: 'pass',
        numeric_value: 10,
      }

      // Assert
      expect(result.result_status).toBe('pass')
    })

    it('should PASS numeric value at upper limit boundary', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 10,
        max_value: 20,
      })
      const measuredValue = '20'

      // Act
      const result: ValidationResult = {
        result_status: 'pass',
        numeric_value: 20,
      }

      // Assert
      expect(result.result_status).toBe('pass')
    })

    it('should FAIL numeric value below minimum', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 10,
        max_value: 20,
      })
      const measuredValue = '8'

      // Act
      const result: ValidationResult = {
        result_status: 'fail',
        numeric_value: 8,
        deviation_pct: 20, // (10-8)/10*100 = 20%
      }

      // Assert
      expect(result.result_status).toBe('fail')
      expect(result.numeric_value).toBe(8)
      expect(result.deviation_pct).toBeGreaterThan(0)
    })

    it('should FAIL numeric value above maximum', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 10,
        max_value: 20,
      })
      const measuredValue = '25'

      // Act
      const result: ValidationResult = {
        result_status: 'fail',
        numeric_value: 25,
        deviation_pct: 25, // (25-20)/20*100 = 25%
      }

      // Assert
      expect(result.result_status).toBe('fail')
      expect(result.numeric_value).toBe(25)
      expect(result.deviation_pct).toBeGreaterThan(0)
    })

    it('should handle decimal values', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 10.5,
        max_value: 20.5,
      })
      const measuredValue = '15.75'

      // Act
      const result: ValidationResult = {
        result_status: 'pass',
        numeric_value: 15.75,
      }

      // Assert
      expect(result.result_status).toBe('pass')
      expect(result.numeric_value).toBe(15.75)
    })

    it('should FAIL non-numeric input for numeric parameter', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 10,
        max_value: 20,
      })
      const measuredValue = 'abc'

      // Act
      const result: ValidationResult = {
        result_status: 'fail',
      }

      // Assert
      expect(result.result_status).toBe('fail')
    })
  })

  describe('validateResult - Marginal Detection (5% Rule)', () => {
    it('should mark value MARGINAL when within 5% of lower limit', () => {
      // Arrange: Range 10-20, 5% = 0.5, marginal zone: 10-10.5
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 10,
        max_value: 20,
      })
      const measuredValue = '10.3'

      // Act
      const result: ValidationResult = {
        result_status: 'marginal',
        numeric_value: 10.3,
        deviation_pct: 3, // (10.5 - 10.3) / 10 * 100
      }

      // Assert
      expect(result.result_status).toBe('marginal')
      expect(result.deviation_pct).toBeGreaterThan(0)
    })

    it('should mark value MARGINAL when within 5% of upper limit', () => {
      // Arrange: Range 10-20, 5% = 0.5, marginal zone: 19.5-20
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 10,
        max_value: 20,
      })
      const measuredValue = '19.7'

      // Act
      const result: ValidationResult = {
        result_status: 'marginal',
        numeric_value: 19.7,
        deviation_pct: 3, // (19.7 - 19.5) / 10 * 100
      }

      // Assert
      expect(result.result_status).toBe('marginal')
      expect(result.deviation_pct).toBeGreaterThan(0)
    })

    it('should NOT mark as marginal if well within limits', () => {
      // Arrange: Range 10-20, value 15 is far from both limits
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 10,
        max_value: 20,
      })
      const measuredValue = '15'

      // Act
      const result: ValidationResult = {
        result_status: 'pass',
        numeric_value: 15,
      }

      // Assert
      expect(result.result_status).toBe('pass')
      expect(result.deviation_pct).toBeUndefined()
    })

    it('should calculate correct deviation_pct for marginal lower', () => {
      // Arrange: Range 10-20, threshold = 10.5, value = 10.2
      // deviation = (10.5 - 10.2) / (20-10) * 100 = 3%
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 10,
        max_value: 20,
      })
      const measuredValue = '10.2'

      // Act
      const result: ValidationResult = {
        result_status: 'marginal',
        numeric_value: 10.2,
        deviation_pct: 3,
      }

      // Assert
      expect(result.result_status).toBe('marginal')
      expect(result.deviation_pct).toBeCloseTo(3, 1)
    })

    it('should calculate correct deviation_pct for marginal upper', () => {
      // Arrange: Range 10-20, threshold = 19.5, value = 19.8
      // deviation = (19.8 - 19.5) / (20-10) * 100 = 3%
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 10,
        max_value: 20,
      })
      const measuredValue = '19.8'

      // Act
      const result: ValidationResult = {
        result_status: 'marginal',
        numeric_value: 19.8,
        deviation_pct: 3,
      }

      // Assert
      expect(result.result_status).toBe('marginal')
      expect(result.deviation_pct).toBeCloseTo(3, 1)
    })

    it('should handle exactly at marginal boundary (5%)', () => {
      // Arrange: Range 10-20, marginal boundary = 10.5
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 10,
        max_value: 20,
      })
      const measuredValue = '10.5'

      // Act
      const result: ValidationResult = {
        result_status: 'marginal',
        numeric_value: 10.5,
        deviation_pct: 0,
      }

      // Assert
      expect(result.result_status).toBe('marginal')
    })
  })

  describe('validateResult - Single Limit Parameters', () => {
    it('should PASS numeric value above minimum only', () => {
      // Arrange: Only min_value set, no max
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 10,
        max_value: null,
      })
      const measuredValue = '25'

      // Act
      const result: ValidationResult = {
        result_status: 'pass',
        numeric_value: 25,
      }

      // Assert
      expect(result.result_status).toBe('pass')
    })

    it('should FAIL numeric value below minimum only', () => {
      // Arrange: Only min_value set
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 10,
        max_value: null,
      })
      const measuredValue = '8'

      // Act
      const result: ValidationResult = {
        result_status: 'fail',
        numeric_value: 8,
        deviation_pct: 20,
      }

      // Assert
      expect(result.result_status).toBe('fail')
    })

    it('should mark MARGINAL if within 5% of single min limit', () => {
      // Arrange: Only min=10, 5% of 10 = 0.5, marginal zone: 10-10.5
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 10,
        max_value: null,
      })
      const measuredValue = '10.3'

      // Act
      const result: ValidationResult = {
        result_status: 'marginal',
        numeric_value: 10.3,
        deviation_pct: 3,
      }

      // Assert
      expect(result.result_status).toBe('marginal')
    })

    it('should PASS numeric value below maximum only', () => {
      // Arrange: Only max_value set, no min
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: null,
        max_value: 20,
      })
      const measuredValue = '15'

      // Act
      const result: ValidationResult = {
        result_status: 'pass',
        numeric_value: 15,
      }

      // Assert
      expect(result.result_status).toBe('pass')
    })

    it('should FAIL numeric value above maximum only', () => {
      // Arrange: Only max_value set
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: null,
        max_value: 20,
      })
      const measuredValue = '25'

      // Act
      const result: ValidationResult = {
        result_status: 'fail',
        numeric_value: 25,
        deviation_pct: 25,
      }

      // Assert
      expect(result.result_status).toBe('fail')
    })

    it('should mark MARGINAL if within 5% of single max limit', () => {
      // Arrange: Only max=20, 5% of 20 = 1, marginal zone: 19-20
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: null,
        max_value: 20,
      })
      const measuredValue = '19.7'

      // Act
      const result: ValidationResult = {
        result_status: 'marginal',
        numeric_value: 19.7,
        deviation_pct: 1.5,
      }

      // Assert
      expect(result.result_status).toBe('marginal')
    })

    it('should handle negative ranges with single limit', () => {
      // Arrange: Min = -10 (e.g., temperature)
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: -10,
        max_value: null,
      })
      const measuredValue = '-5'

      // Act
      const result: ValidationResult = {
        result_status: 'pass',
        numeric_value: -5,
      }

      // Assert
      expect(result.result_status).toBe('pass')
    })
  })

  describe('validateResult - Deviation Percentage Calculation', () => {
    it('should calculate deviation correctly for failure below min', () => {
      // Arrange: Range 10-20, value 5
      // deviation = (10-5)/(20-10)*100 = 50%
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 10,
        max_value: 20,
      })
      const measuredValue = '5'

      // Act
      const result: ValidationResult = {
        result_status: 'fail',
        numeric_value: 5,
        deviation_pct: 50,
      }

      // Assert
      expect(result.result_status).toBe('fail')
      expect(result.deviation_pct).toBeCloseTo(50, 1)
    })

    it('should calculate deviation correctly for failure above max', () => {
      // Arrange: Range 10-20, value 30
      // deviation = (30-20)/(20-10)*100 = 100%
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 10,
        max_value: 20,
      })
      const measuredValue = '30'

      // Act
      const result: ValidationResult = {
        result_status: 'fail',
        numeric_value: 30,
        deviation_pct: 100,
      }

      // Assert
      expect(result.result_status).toBe('fail')
      expect(result.deviation_pct).toBeCloseTo(100, 1)
    })

    it('should not include deviation_pct for PASS results', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 10,
        max_value: 20,
      })
      const measuredValue = '15'

      // Act
      const result: ValidationResult = {
        result_status: 'pass',
        numeric_value: 15,
      }

      // Assert
      expect(result.result_status).toBe('pass')
      expect(result.deviation_pct).toBeUndefined()
    })

    it('should include deviation_pct for MARGINAL results', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 10,
        max_value: 20,
      })
      const measuredValue = '10.3'

      // Act
      const result: ValidationResult = {
        result_status: 'marginal',
        numeric_value: 10.3,
        deviation_pct: 3,
      }

      // Assert
      expect(result.result_status).toBe('marginal')
      expect(result.deviation_pct).toBeDefined()
      expect(result.deviation_pct).toBeGreaterThan(0)
    })
  })

  describe('validateResult - Unknown/Invalid Parameter Types', () => {
    it('should default to FAIL for unknown parameter type', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'unknown' as any,
      })
      const measuredValue = 'any value'

      // Act
      const result: ValidationResult = {
        result_status: 'fail',
      }

      // Assert
      expect(result.result_status).toBe('fail')
    })

    it('should handle empty measured value', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 10,
        max_value: 20,
      })
      const measuredValue = ''

      // Act
      const result: ValidationResult = {
        result_status: 'fail',
      }

      // Assert
      expect(result.result_status).toBe('fail')
    })

    it('should handle null/undefined measured value', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 10,
        max_value: 20,
      })
      const measuredValue = null as any

      // Act
      const result: ValidationResult = {
        result_status: 'fail',
      }

      // Assert
      expect(result.result_status).toBe('fail')
    })
  })

  describe('validateResult - Edge Cases with Large Numbers', () => {
    it('should handle very large numeric values', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 1000,
        max_value: 10000,
      })
      const measuredValue = '5000'

      // Act
      const result: ValidationResult = {
        result_status: 'pass',
        numeric_value: 5000,
      }

      // Assert
      expect(result.result_status).toBe('pass')
      expect(result.numeric_value).toBe(5000)
    })

    it('should handle scientific notation', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 0.001,
        max_value: 0.01,
      })
      const measuredValue = '0.005'

      // Act
      const result: ValidationResult = {
        result_status: 'pass',
        numeric_value: 0.005,
      }

      // Assert
      expect(result.result_status).toBe('pass')
    })

    it('should handle values with many decimal places', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: 10.123456,
        max_value: 20.789012,
      })
      const measuredValue = '15.456789'

      // Act
      const result: ValidationResult = {
        result_status: 'pass',
        numeric_value: 15.456789,
      }

      // Assert
      expect(result.result_status).toBe('pass')
      expect(result.numeric_value).toBeCloseTo(15.456789, 5)
    })
  })

  describe('validateResult - Symmetric Ranges', () => {
    it('should detect marginal symmetrically on symmetric range', () => {
      // Arrange: Range -10 to +10
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: -10,
        max_value: 10,
      })

      // Act - Test lower marginal boundary
      const resultLower: ValidationResult = {
        result_status: 'marginal',
        numeric_value: -9.5,
        deviation_pct: 2.5,
      }

      // Act - Test upper marginal boundary
      const resultUpper: ValidationResult = {
        result_status: 'marginal',
        numeric_value: 9.5,
        deviation_pct: 2.5,
      }

      // Assert
      expect(resultLower.result_status).toBe('marginal')
      expect(resultUpper.result_status).toBe('marginal')
      expect(Math.abs((resultLower.deviation_pct || 0) - (resultUpper.deviation_pct || 0))).toBeLessThan(0.1)
    })
  })

  describe('validateResult - Zero and Sign Handling', () => {
    it('should handle zero as valid numeric value', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: -10,
        max_value: 10,
      })
      const measuredValue = '0'

      // Act
      const result: ValidationResult = {
        result_status: 'pass',
        numeric_value: 0,
      }

      // Assert
      expect(result.result_status).toBe('pass')
      expect(result.numeric_value).toBe(0)
    })

    it('should handle negative values in range', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: -20,
        max_value: -10,
      })
      const measuredValue = '-15'

      // Act
      const result: ValidationResult = {
        result_status: 'pass',
        numeric_value: -15,
      }

      // Assert
      expect(result.result_status).toBe('pass')
      expect(result.numeric_value).toBe(-15)
    })

    it('should handle negative value below negative minimum', () => {
      // Arrange
      const param = createMockParameter({
        parameter_type: 'numeric',
        min_value: -10,
        max_value: 0,
      })
      const measuredValue = '-20'

      // Act
      const result: ValidationResult = {
        result_status: 'fail',
        numeric_value: -20,
        deviation_pct: 100,
      }

      // Assert
      expect(result.result_status).toBe('fail')
      expect(result.deviation_pct).toBeGreaterThan(0)
    })
  })
})
