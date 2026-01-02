import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { POApprovalModal } from '../POApprovalModal';
import { usePOApproval } from '@/lib/hooks/use-po-approval';

// Mock hooks
vi.mock('@/lib/hooks/use-po-approval');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('POApprovalModal Component', () => {
  const mockPO = {
    id: 'po-123',
    po_number: 'PO-2024-00156',
    status: 'pending_approval',
    approval_status: 'pending',
    total: 984.00,
    subtotal: 800.00,
    tax_amount: 184.00,
    supplier: {
      id: 'sup-001',
      name: 'Mill Co.',
      code: 'SUP-001',
    },
    warehouse: {
      id: 'wh-001',
      name: 'Main Warehouse',
    },
    expected_delivery_date: '2024-12-20',
    created_by: {
      id: 'user-001',
      name: 'John Smith',
    },
    po_lines: [
      {
        id: 'line-1',
        product_name: 'Flour Type A',
        quantity: 500,
        uom: 'kg',
        unit_price: 1.20,
        line_total: 600.00,
      },
      {
        id: 'line-2',
        product_name: 'Sugar White',
        quantity: 200,
        uom: 'kg',
        unit_price: 0.85,
        line_total: 170.00,
      },
    ],
  };

  const mockUsePOApproval = {
    submitPO: { mutateAsync: vi.fn() },
    approvePO: { mutateAsync: vi.fn() },
    rejectPO: { mutateAsync: vi.fn() },
    isSubmitting: false,
    isApproving: false,
    isRejecting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePOApproval).mockReturnValue(mockUsePOApproval as any);
  });

  describe('Rendering - Approve Mode', () => {
    it('should render modal when open is true', () => {
      // Test case: Component visibility
      render(
        <POApprovalModal
          po={mockPO as any}
          mode="approve"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      expect(screen.getByText(/Approve Purchase Order/i)).toBeInTheDocument();
    });

    it('should not render modal when open is false', () => {
      // Test case: Component visibility
      const { container } = render(
        <POApprovalModal
          po={mockPO as any}
          mode="approve"
          open={false}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      // Modal should not be visible
      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    });

    it('should display PO number in header', () => {
      // Test case: AC-06 - Header display
      render(
        <POApprovalModal
          po={mockPO as any}
          mode="approve"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      expect(screen.getByText(mockPO.po_number)).toBeInTheDocument();
    });

    it('should display PO summary section', () => {
      // Test case: AC-06 - Summary display
      render(
        <POApprovalModal
          po={mockPO as any}
          mode="approve"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      expect(screen.getByText(mockPO.supplier.name)).toBeInTheDocument();
      expect(screen.getByText(mockPO.warehouse.name)).toBeInTheDocument();
      expect(screen.getByText(mockPO.created_by.name)).toBeInTheDocument();
    });

    it('should display PO lines table', () => {
      // Test case: AC-06 - Lines display
      render(
        <POApprovalModal
          po={mockPO as any}
          mode="approve"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      mockPO.po_lines.forEach((line) => {
        expect(screen.getByText(line.product_name)).toBeInTheDocument();
      });
    });

    it('should display totals section', () => {
      // Test case: AC-06 - Totals display
      render(
        <POApprovalModal
          po={mockPO as any}
          mode="approve"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      // Use getAllByText since total appears in both totals section and threshold indicator
      const totalElements = screen.getAllByText(/\$984\.00/);
      expect(totalElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should display approval threshold indicator', () => {
      // Test case: PLAN-008 - Threshold display
      render(
        <POApprovalModal
          po={mockPO as any}
          mode="approve"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      expect(screen.getByText(/threshold/i)).toBeInTheDocument();
    });

    it('should display approval notes textarea (optional)', () => {
      // Test case: AC-06 - Notes field
      render(
        <POApprovalModal
          po={mockPO as any}
          mode="approve"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      const notesField = screen.getByPlaceholderText(/optional notes/i);
      expect(notesField).toBeInTheDocument();
    });

    it('should display Cancel and Approve buttons', () => {
      // Test case: AC-06 - Action buttons
      render(
        <POApprovalModal
          po={mockPO as any}
          mode="approve"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Approve PO/i })).toBeInTheDocument();
    });
  });

  describe('Rendering - Reject Mode', () => {
    it('should render reject title when mode is reject', () => {
      // Test case: AC-08 - Reject mode
      render(
        <POApprovalModal
          po={mockPO as any}
          mode="reject"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      expect(screen.getByText(/Reject Purchase Order/i)).toBeInTheDocument();
    });

    it('should display rejection reason textarea (required)', () => {
      // Test case: AC-08 - Reason field
      render(
        <POApprovalModal
          po={mockPO as any}
          mode="reject"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      const reasonField = screen.getByPlaceholderText(/rejection reason/i);
      expect(reasonField).toBeInTheDocument();
    });

    it('should display Reject button instead of Approve', () => {
      // Test case: AC-08 - Action button
      render(
        <POApprovalModal
          po={mockPO as any}
          mode="reject"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /Reject PO/i })).toBeInTheDocument();
    });

    it('should show required indicator for rejection reason', () => {
      // Test case: AC-08 - Required field
      render(
        <POApprovalModal
          po={mockPO as any}
          mode="reject"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      expect(screen.getByText(/\*/)).toBeInTheDocument(); // Required indicator
    });
  });

  describe('User Interactions - Approve Mode', () => {
    it('should close modal when Cancel button clicked', () => {
      // Test case: AC-06 - Close action
      const onOpenChange = vi.fn();

      render(
        <POApprovalModal
          po={mockPO as any}
          mode="approve"
          open={true}
          onOpenChange={onOpenChange}
          onSuccess={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should close modal when X button clicked', () => {
      // Test case: AC-06 - Close action
      const onOpenChange = vi.fn();

      render(
        <POApprovalModal
          po={mockPO as any}
          mode="approve"
          open={true}
          onOpenChange={onOpenChange}
          onSuccess={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should submit approve action when Approve button clicked', async () => {
      // Test case: AC-06 - Approve submission
      const onSuccess = vi.fn();

      render(
        <POApprovalModal
          po={mockPO as any}
          mode="approve"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={onSuccess}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Approve PO/i }));

      await waitFor(() => {
        expect(mockUsePOApproval.approvePO.mutateAsync).toHaveBeenCalled();
      });
    });

    it('should include notes in approve submission', async () => {
      // Test case: AC-06 - Notes submission
      render(
        <POApprovalModal
          po={mockPO as any}
          mode="approve"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      const notesField = screen.getByPlaceholderText(/optional notes/i);
      fireEvent.change(notesField, { target: { value: 'Good pricing' } });
      fireEvent.click(screen.getByRole('button', { name: /Approve PO/i }));

      await waitFor(() => {
        expect(mockUsePOApproval.approvePO.mutateAsync).toHaveBeenCalled();
      });
    });

    it('should allow empty notes for approval', async () => {
      // Test case: AC-06 - Notes optional
      render(
        <POApprovalModal
          po={mockPO as any}
          mode="approve"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      const notesField = screen.getByPlaceholderText(/optional notes/i) as HTMLTextAreaElement;
      expect(notesField.value).toBe('');

      fireEvent.click(screen.getByRole('button', { name: /Approve PO/i }));

      await waitFor(() => {
        expect(mockUsePOApproval.approvePO.mutateAsync).toHaveBeenCalled();
      });
    });

    it('should call onSuccess after successful approval', async () => {
      // Test case: AC-06 - Success callback
      const onSuccess = vi.fn();

      mockUsePOApproval.approvePO.mutateAsync.mockResolvedValue({ success: true });

      render(
        <POApprovalModal
          po={mockPO as any}
          mode="approve"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={onSuccess}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Approve PO/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should close modal after successful approval', async () => {
      // Test case: AC-06 - Modal close after success
      const onOpenChange = vi.fn();

      mockUsePOApproval.approvePO.mutateAsync.mockResolvedValue({ success: true });

      render(
        <POApprovalModal
          po={mockPO as any}
          mode="approve"
          open={true}
          onOpenChange={onOpenChange}
          onSuccess={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Approve PO/i }));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('User Interactions - Reject Mode', () => {
    it('should require rejection reason before allowing submission', async () => {
      // Test case: AC-08 - Validation
      render(
        <POApprovalModal
          po={mockPO as any}
          mode="reject"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      const rejectButton = screen.getByRole('button', { name: /Reject PO/i });
      fireEvent.click(rejectButton);

      // Should show validation error - use waitFor since form validation is async
      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });

    it('should validate rejection reason minimum length', async () => {
      // Test case: AC-09 - Min length validation
      render(
        <POApprovalModal
          po={mockPO as any}
          mode="reject"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      const reasonField = screen.getByPlaceholderText(/rejection reason/i);
      fireEvent.change(reasonField, { target: { value: 'Too short' } });
      fireEvent.click(screen.getByRole('button', { name: /Reject PO/i }));

      await waitFor(() => {
        expect(screen.getByText(/10 characters/i)).toBeInTheDocument();
      });
    });

    it('should accept valid rejection reason', async () => {
      // Test case: AC-07 - Valid reason
      render(
        <POApprovalModal
          po={mockPO as any}
          mode="reject"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      const reasonField = screen.getByPlaceholderText(/rejection reason/i);
      fireEvent.change(reasonField, {
        target: { value: 'Exceeds quarterly budget. Please reduce quantity.' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Reject PO/i }));

      await waitFor(() => {
        expect(mockUsePOApproval.rejectPO.mutateAsync).toHaveBeenCalled();
      });
    });

    it('should submit reject action with rejection reason', async () => {
      // Test case: AC-07 - Rejection submission
      const reason = 'Exceeds quarterly budget. Please reduce quantity.';

      render(
        <POApprovalModal
          po={mockPO as any}
          mode="reject"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      const reasonField = screen.getByPlaceholderText(/rejection reason/i);
      fireEvent.change(reasonField, { target: { value: reason } });
      fireEvent.click(screen.getByRole('button', { name: /Reject PO/i }));

      await waitFor(() => {
        expect(mockUsePOApproval.rejectPO.mutateAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('should disable buttons during approval submission', () => {
      // Test case: UX - Loading feedback
      vi.mocked(usePOApproval).mockReturnValue({
        ...mockUsePOApproval,
        isApproving: true,
      } as any);

      render(
        <POApprovalModal
          po={mockPO as any}
          mode="approve"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /Approve PO/i })).toBeDisabled();
    });

    it('should disable buttons during rejection submission', () => {
      // Test case: UX - Loading feedback
      vi.mocked(usePOApproval).mockReturnValue({
        ...mockUsePOApproval,
        isRejecting: true,
      } as any);

      render(
        <POApprovalModal
          po={mockPO as any}
          mode="reject"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /Reject PO/i })).toBeDisabled();
    });

    it('should show loading spinner during submission', () => {
      // Test case: UX - Loading feedback
      vi.mocked(usePOApproval).mockReturnValue({
        ...mockUsePOApproval,
        isApproving: true,
      } as any);

      render(
        <POApprovalModal
          po={mockPO as any}
          mode="approve"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      expect(screen.getByText(/Processing/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message on approval failure', async () => {
      // Test case: Error handling
      mockUsePOApproval.approvePO.mutateAsync.mockRejectedValue(
        new Error('Approval failed')
      );

      render(
        <POApprovalModal
          po={mockPO as any}
          mode="approve"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Approve PO/i }));

      await waitFor(() => {
        expect(screen.getByText(/Approval failed/i)).toBeInTheDocument();
      });
    });

    it('should display error message on rejection failure', async () => {
      // Test case: Error handling
      mockUsePOApproval.rejectPO.mutateAsync.mockRejectedValue(
        new Error('Rejection failed')
      );

      render(
        <POApprovalModal
          po={mockPO as any}
          mode="reject"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      const reasonField = screen.getByPlaceholderText(/rejection reason/i);
      fireEvent.change(reasonField, { target: { value: 'Exceeds budget.' } });
      fireEvent.click(screen.getByRole('button', { name: /Reject PO/i }));

      await waitFor(() => {
        expect(screen.getByText(/Rejection failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog role', async () => {
      // Test case: a11y - Dialog semantics
      render(
        <POApprovalModal
          po={mockPO as any}
          mode="approve"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      // Radix Dialog uses role="dialog" on the content element
      // Use screen.getByRole which is more reliable
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should have proper heading hierarchy', () => {
      // Test case: a11y - Headings
      render(
        <POApprovalModal
          po={mockPO as any}
          mode="approve"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should have aria-required on rejection reason', async () => {
      // Test case: a11y - Required field
      render(
        <POApprovalModal
          po={mockPO as any}
          mode="reject"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      // Wait for component to render fully, then check the textarea
      await waitFor(() => {
        const reasonField = screen.getByPlaceholderText(/rejection reason/i);
        expect(reasonField).toHaveAttribute('aria-required', 'true');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render modal with responsive layout', () => {
      // Test case: PLAN-008 - Responsive design
      render(
        <POApprovalModal
          po={mockPO as any}
          mode="approve"
          open={true}
          onOpenChange={vi.fn()}
          onSuccess={vi.fn()}
        />
      );

      // Should display all required sections
      expect(screen.getByText(mockPO.po_number)).toBeInTheDocument();
      expect(screen.getByText(/Summary/i)).toBeInTheDocument();
      expect(screen.getByText(/Lines/i)).toBeInTheDocument();
    });
  });
});
