import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddItemModal from '@/components/AddItemModal';
import { Product } from '@/lib/types';

// Mock the clientState
jest.mock('@/lib/clientState', () => ({
  addProduct: jest.fn(),
  updateProduct: jest.fn(),
  getProducts: jest.fn(() => []),
  getSuppliers: jest.fn(() => []),
  getProductionLines: jest.fn(() => []),
  getAllergens: jest.fn(() => [])
}));

// Mock the toast
jest.mock('@/lib/toast', () => ({
  showToast: jest.fn()
}));

describe('AddItemModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Checkbox Toggle Functionality', () => {
    test('should toggle is_optional checkbox correctly', async () => {
      render(
        <AddItemModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          category="PROCESS"
        />
      );

      // Add a BOM component
      const addComponentButton = screen.getByText('Add Component');
      fireEvent.click(addComponentButton);

      // Find the optional checkbox
      const optionalCheckbox = screen.getByRole('checkbox', { name: /optional/i });
      
      // Initially should be unchecked
      expect(optionalCheckbox).not.toBeChecked();

      // Click to check
      fireEvent.click(optionalCheckbox);
      expect(optionalCheckbox).toBeChecked();

      // Click to uncheck
      fireEvent.click(optionalCheckbox);
      expect(optionalCheckbox).not.toBeChecked();
    });

    test('should toggle is_phantom checkbox correctly', async () => {
      render(
        <AddItemModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          category="PROCESS"
        />
      );

      // Add a BOM component
      const addComponentButton = screen.getByText('Add Component');
      fireEvent.click(addComponentButton);

      // Find the phantom checkbox
      const phantomCheckbox = screen.getByRole('checkbox', { name: /phantom/i });
      
      // Initially should be unchecked
      expect(phantomCheckbox).not.toBeChecked();

      // Click to check
      fireEvent.click(phantomCheckbox);
      expect(phantomCheckbox).toBeChecked();

      // Click to uncheck
      fireEvent.click(phantomCheckbox);
      expect(phantomCheckbox).not.toBeChecked();
    });

    test('should toggle one_to_one checkbox correctly', async () => {
      render(
        <AddItemModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          category="PROCESS"
        />
      );

      // Add a BOM component
      const addComponentButton = screen.getByText('Add Component');
      fireEvent.click(addComponentButton);

      // Find the one-to-one checkbox
      const oneToOneCheckbox = screen.getByRole('checkbox', { name: /1:1 LP/i });
      
      // Initially should be unchecked
      expect(oneToOneCheckbox).not.toBeChecked();

      // Click to check
      fireEvent.click(oneToOneCheckbox);
      expect(oneToOneCheckbox).toBeChecked();

      // Click to uncheck
      fireEvent.click(oneToOneCheckbox);
      expect(oneToOneCheckbox).not.toBeChecked();
    });
  });

  describe('Category-Based Field Visibility', () => {
    test('should hide supplier field for PROCESS category', () => {
      render(
        <AddItemModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          category="PROCESS"
        />
      );

      // Supplier field should not be visible
      expect(screen.queryByText('Preferred Supplier')).not.toBeInTheDocument();
    });

    test('should hide supplier field for FINISHED_GOODS category', () => {
      render(
        <AddItemModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          category="FINISHED_GOODS"
        />
      );

      // Supplier field should not be visible
      expect(screen.queryByText('Preferred Supplier')).not.toBeInTheDocument();
    });

    test('should show supplier field for MEAT category', () => {
      render(
        <AddItemModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          category="MEAT"
        />
      );

      // Supplier field should be visible
      expect(screen.getByText('Preferred Supplier')).toBeInTheDocument();
    });

    test('should show supplier field for DRYGOODS category', () => {
      render(
        <AddItemModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          category="DRYGOODS"
        />
      );

      // Supplier field should be visible
      expect(screen.getByText('Preferred Supplier')).toBeInTheDocument();
    });
  });

  describe('BOM Component Validation', () => {
    test('should validate required fields', async () => {
      render(
        <AddItemModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          category="PROCESS"
        />
      );

      // Try to save without filling required fields
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Item Number is required')).toBeInTheDocument();
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
    });

    test('should validate quantity is positive', async () => {
      render(
        <AddItemModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          category="PROCESS"
        />
      );

      // Add a BOM component
      const addComponentButton = screen.getByText('Add Component');
      fireEvent.click(addComponentButton);

      // Enter negative quantity
      const quantityInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(quantityInput, { target: { value: '-1' } });

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('Quantity must be positive')).toBeInTheDocument();
      });
    });

    test('should validate scrap percentage range', async () => {
      render(
        <AddItemModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          category="PROCESS"
        />
      );

      // Add a BOM component
      const addComponentButton = screen.getByText('Add Component');
      fireEvent.click(addComponentButton);

      // Enter invalid scrap percentage
      const scrapInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(scrapInput, { target: { value: '150' } });

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('Scrap percentage must be between 0 and 100')).toBeInTheDocument();
      });
    });
  });

  describe('Product Creation', () => {
    test('should create MEAT product successfully', async () => {
      const { addProduct } = require('@/lib/clientState');
      addProduct.mockResolvedValue({ id: 1, part_number: 'MEAT-001' });

      render(
        <AddItemModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          category="MEAT"
        />
      );

      // Fill in required fields
      fireEvent.change(screen.getByPlaceholderText('Enter item number'), {
        target: { value: 'MEAT-001' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter item name'), {
        target: { value: 'Premium Beef' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter UoM'), {
        target: { value: 'kg' }
      });

      // Save the product
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(addProduct).toHaveBeenCalledWith(
          expect.objectContaining({
            part_number: 'MEAT-001',
            description: 'Premium Beef',
            uom: 'kg',
            category: 'MEAT'
          })
        );
      });
    });

    test('should create PROCESS product with BOM successfully', async () => {
      const { addProduct } = require('@/lib/clientState');
      addProduct.mockResolvedValue({ id: 1, part_number: 'PR-001' });

      render(
        <AddItemModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          category="PROCESS"
        />
      );

      // Fill in required fields
      fireEvent.change(screen.getByPlaceholderText('Enter item number'), {
        target: { value: 'PR-001' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter item name'), {
        target: { value: 'Processed Meat' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter UoM'), {
        target: { value: 'kg' }
      });

      // Add BOM component
      const addComponentButton = screen.getByText('Add Component');
      fireEvent.click(addComponentButton);

      // Fill in BOM component details
      const quantityInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(quantityInput, { target: { value: '1.0' } });

      // Save the product
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(addProduct).toHaveBeenCalledWith(
          expect.objectContaining({
            part_number: 'PR-001',
            description: 'Processed Meat',
            uom: 'kg',
            category: 'PROCESS',
            bom_items: expect.arrayContaining([
              expect.objectContaining({
                quantity: 1.0
              })
            ])
          })
        );
      });
    });
  });

  describe('Product Editing', () => {
    test('should edit existing product successfully', async () => {
      const { updateProduct } = require('@/lib/clientState');
      updateProduct.mockResolvedValue({ id: 1, part_number: 'MEAT-001' });

      const existingProduct: Product = {
        id: 1,
        part_number: 'MEAT-001',
        description: 'Premium Beef',
        uom: 'kg',
        category: 'MEAT',
        type: 'RM',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      render(
        <AddItemModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          product={existingProduct}
          category="MEAT"
        />
      );

      // Modify the product
      fireEvent.change(screen.getByDisplayValue('Premium Beef'), {
        target: { value: 'Premium Beef Updated' }
      });

      // Save the product
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateProduct).toHaveBeenCalledWith(1, expect.objectContaining({
          description: 'Premium Beef Updated'
        }));
      });
    });
  });
});
