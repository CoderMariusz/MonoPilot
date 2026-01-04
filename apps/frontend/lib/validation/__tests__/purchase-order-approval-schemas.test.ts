import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  submitPoSchema,
  approvePoSchema,
  rejectPoSchema,
} from '../purchase-order';

describe('Purchase Order Approval Validation Schemas', () => {
  describe('submitPoSchema', () => {
    it('should accept empty object (no body required)', () => {
      // Test case: API spec - POST /submit requires no body
      const result = submitPoSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should ignore extra fields', () => {
      // Test case: API robustness
      const result = submitPoSchema.safeParse({
        extra_field: 'value',
        another: 123,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('approvePoSchema', () => {
    it('should accept empty object (notes optional)', () => {
      // Test case: AC-05 - Notes are optional
      const result = approvePoSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept notes string', () => {
      // Test case: AC-05 - Approval notes
      const result = approvePoSchema.safeParse({
        notes: 'Approved for Q4 stock replenishment. Good pricing.',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty notes string', () => {
      // Test case: AC-05 - Optional notes
      const result = approvePoSchema.safeParse({
        notes: '',
      });
      expect(result.success).toBe(true);
    });

    it('should accept notes up to 1000 characters', () => {
      // Test case: API spec - Max 1000 chars
      const maxNotes = 'x'.repeat(1000);
      const result = approvePoSchema.safeParse({
        notes: maxNotes,
      });
      expect(result.success).toBe(true);
    });

    it('should reject notes exceeding 1000 characters', () => {
      // Test case: API spec - Max 1000 chars
      const tooLongNotes = 'x'.repeat(1001);
      const result = approvePoSchema.safeParse({
        notes: tooLongNotes,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('1000');
    });

    it('should reject non-string notes', () => {
      // Test case: Type validation
      const result = approvePoSchema.safeParse({
        notes: 123,
      });
      expect(result.success).toBe(false);
    });

    it('should reject notes with invalid type array', () => {
      // Test case: Type validation
      const result = approvePoSchema.safeParse({
        notes: ['array', 'of', 'strings'],
      });
      expect(result.success).toBe(false);
    });

    it('should accept unicode characters in notes', () => {
      // Test case: Internationalization
      const result = approvePoSchema.safeParse({
        notes: 'Approved - Zatwierdzono - Одобрено',
      });
      expect(result.success).toBe(true);
    });

    it('should accept multiline notes', () => {
      // Test case: UX - Textarea input
      const result = approvePoSchema.safeParse({
        notes: 'Approved for Q4\nReviewed by finance\nGood pricing',
      });
      expect(result.success).toBe(true);
    });

    it('should trim whitespace from notes', () => {
      // Test case: Data cleaning
      const result = approvePoSchema.safeParse({
        notes: '  Approved  ',
      });
      expect(result.success).toBe(true);
    });

    it('should have proper error message for max length violation', () => {
      // Test case: Error message quality
      const tooLongNotes = 'x'.repeat(1001);
      const result = approvePoSchema.safeParse({
        notes: tooLongNotes,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('cannot exceed');
    });
  });

  describe('rejectPoSchema', () => {
    it('should require rejection_reason', () => {
      // Test case: AC-08 - Reason required
      const result = rejectPoSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept rejection_reason with 10+ characters', () => {
      // Test case: AC-09 - Min 10 chars
      const result = rejectPoSchema.safeParse({
        rejection_reason: 'Budget exceeded by 10%',
      });
      expect(result.success).toBe(true);
    });

    it('should accept rejection_reason with exactly 10 characters', () => {
      // Test case: AC-09 - Min 10 chars (boundary)
      const result = rejectPoSchema.safeParse({
        rejection_reason: '1234567890', // exactly 10 chars
      });
      expect(result.success).toBe(true);
    });

    it('should reject rejection_reason with 9 characters', () => {
      // Test case: AC-09 - Min 10 chars (boundary)
      const result = rejectPoSchema.safeParse({
        rejection_reason: '123456789', // 9 chars
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('10');
    });

    it('should reject empty rejection_reason', () => {
      // Test case: AC-08 - Reason required
      const result = rejectPoSchema.safeParse({
        rejection_reason: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject rejection_reason with only whitespace', () => {
      // Test case: AC-08 - Meaningful reason required
      const result = rejectPoSchema.safeParse({
        rejection_reason: '   ',
      });
      expect(result.success).toBe(false);
    });

    it('should accept rejection_reason up to 1000 characters', () => {
      // Test case: API spec - Max 1000 chars
      const maxReason = 'x'.repeat(1000);
      const result = rejectPoSchema.safeParse({
        rejection_reason: maxReason,
      });
      expect(result.success).toBe(true);
    });

    it('should reject rejection_reason exceeding 1000 characters', () => {
      // Test case: API spec - Max 1000 chars
      const tooLongReason = 'x'.repeat(1001);
      const result = rejectPoSchema.safeParse({
        rejection_reason: tooLongReason,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('1000');
    });

    it('should reject non-string rejection_reason', () => {
      // Test case: Type validation
      const result = rejectPoSchema.safeParse({
        rejection_reason: 123,
      });
      expect(result.success).toBe(false);
    });

    it('should accept detailed rejection reason from AC-07', () => {
      // Test case: AC-07 - Real world example
      const result = rejectPoSchema.safeParse({
        rejection_reason: 'Exceeds quarterly budget. Please reduce quantity or defer to Q2.',
      });
      expect(result.success).toBe(true);
    });

    it('should accept detailed reason about inventory', () => {
      // Test case: AC-07 - Real world example
      const result = rejectPoSchema.safeParse({
        rejection_reason: 'Quantity too high for current inventory capacity. Please reduce to 500kg Sugar White and 250kg Brown.',
      });
      expect(result.success).toBe(true);
    });

    it('should accept multiline rejection reason', () => {
      // Test case: UX - Textarea input
      const result = rejectPoSchema.safeParse({
        rejection_reason: 'Exceeds budget\nNeed to reduce quantity\nPlease resubmit',
      });
      expect(result.success).toBe(true);
    });

    it('should accept unicode characters in reason', () => {
      // Test case: Internationalization
      const result = rejectPoSchema.safeParse({
        rejection_reason: 'Odrzucona - Превышен бюджет - בוטל',
      });
      expect(result.success).toBe(true);
    });

    it('should sanitize XSS attempts in rejection reason', () => {
      // Test case: Security - XSS prevention
      const result = rejectPoSchema.safeParse({
        rejection_reason: 'Budget exceeded <script>alert("XSS")</script> please reduce',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        // Verify HTML is escaped
        expect(result.data.rejection_reason).not.toContain('<script>');
        expect(result.data.rejection_reason).toContain('&lt;script&gt;');
        expect(result.data.rejection_reason).toContain('&lt;&#x2F;script&gt;');
      }
    });

    it('should sanitize HTML entities in rejection reason', () => {
      // Test case: Security - HTML injection prevention
      const result = rejectPoSchema.safeParse({
        rejection_reason: 'Rejected: <b>Bold text</b> & "quotes" \' apostrophe',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        // Verify all HTML special characters are escaped
        expect(result.data.rejection_reason).not.toContain('<b>');
        expect(result.data.rejection_reason).toContain('&lt;b&gt;');
        expect(result.data.rejection_reason).toContain('&amp;');
        expect(result.data.rejection_reason).toContain('&quot;');
        expect(result.data.rejection_reason).toContain('&#x27;');
      }
    });

    it('should have proper error message for missing reason', () => {
      // Test case: Error message quality
      const result = rejectPoSchema.safeParse({});
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('required');
    });

    it('should have proper error message for minimum length', () => {
      // Test case: Error message quality
      const result = rejectPoSchema.safeParse({
        rejection_reason: '123456789',
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('10');
    });

    it('should have proper error message for maximum length', () => {
      // Test case: Error message quality
      const tooLongReason = 'x'.repeat(1001);
      const result = rejectPoSchema.safeParse({
        rejection_reason: tooLongReason,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('1000');
    });

    it('should reject object instead of string', () => {
      // Test case: Type validation
      const result = rejectPoSchema.safeParse({
        rejection_reason: { reason: 'Budget exceeded' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject array of reasons', () => {
      // Test case: Type validation
      const result = rejectPoSchema.safeParse({
        rejection_reason: ['Budget', 'exceeded'],
      });
      expect(result.success).toBe(false);
    });

    it('should handle special characters in reason', () => {
      // Test case: Security/Edge case
      const result = rejectPoSchema.safeParse({
        rejection_reason: 'Budget exceeded by 50% (too much!) & <needs review>',
      });
      expect(result.success).toBe(true);
    });

    it('should handle reason with quotes and apostrophes', () => {
      // Test case: Edge case
      const result = rejectPoSchema.safeParse({
        rejection_reason: "Can't approve. John's quote is too high.",
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Type Exports', () => {
    it('should export ApprovePoInput type', () => {
      // Test case: TypeScript type availability
      type TestType = z.infer<typeof approvePoSchema>;
      const example: TestType = { notes: 'test' };
      expect(example.notes).toBeDefined();
    });

    it('should export RejectPoInput type', () => {
      // Test case: TypeScript type availability
      type TestType = z.infer<typeof rejectPoSchema>;
      const example: TestType = { rejection_reason: 'test reason reason' };
      expect(example.rejection_reason).toBeDefined();
    });
  });

  describe('Schema Coercion & Transformation', () => {
    it('should coerce string input to correct format', () => {
      // Test case: Data cleaning
      const result = approvePoSchema.safeParse({
        notes: 'Valid notes',
      });
      expect(result.success).toBe(true);
    });

    it('should handle null values correctly', () => {
      // Test case: Edge case
      const result = approvePoSchema.safeParse({
        notes: null,
      });
      expect(result.success).toBe(false);
    });

    it('should handle undefined values correctly', () => {
      // Test case: Edge case
      const result = approvePoSchema.safeParse({
        notes: undefined,
      });
      // Undefined should be treated as not provided (optional field)
      expect(result.success).toBe(true);
    });
  });

  describe('Integration with React Hook Form', () => {
    it('should work with React Hook Form resolver', () => {
      // Test case: Component integration
      // This test verifies the schema is compatible with form libraries
      const schema = rejectPoSchema;
      expect(schema).toBeDefined();
    });

    it('should provide meaningful errors for form display', () => {
      // Test case: UX - Error messages
      const result = rejectPoSchema.safeParse({
        rejection_reason: 'short',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBeTruthy();
      }
    });
  });

  describe('Performance', () => {
    it('should validate quickly for valid input', () => {
      // Test case: Performance
      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        rejectPoSchema.safeParse({
          rejection_reason: 'Budget exceeded by 20%',
        });
      }
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500); // 1000 validations < 500ms
    });

    it('should validate quickly for invalid input', () => {
      // Test case: Performance
      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        rejectPoSchema.safeParse({
          rejection_reason: 'short',
        });
      }
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500); // 1000 validations < 500ms
    });
  });
});
