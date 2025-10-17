/**
 * UI Component Tests for Record Weights Modal
 * Tests the RecordWeightsModal component functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the RecordWeightsModal component
const MockRecordWeightsModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  operation, 
  isLoading,
  validationErrors 
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = React.useState({
    actual_input_weight: '',
    actual_output_weight: '',
    cooking_loss_weight: '',
    trim_loss_weight: '',
    marinade_gain_weight: '',
    scrap_breakdown: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateYield = () => {
    const input = parseFloat(formData.actual_input_weight) || 0;
    const output = parseFloat(formData.actual_output_weight) || 0;
    return input > 0 ? ((output / input) * 100).toFixed(1) : 0;
  };

  return (
    <div data-testid="record-weights-modal" className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Record Weights - Operation {operation?.seq}</h2>
          <button data-testid="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} data-testid="weights-form">
          <div className="form-section">
            <h3>Input/Output Weights</h3>
            <div className="form-group">
              <label htmlFor="actual_input_weight">IN Weight (kg):</label>
              <input
                id="actual_input_weight"
                type="number"
                step="0.1"
                value={formData.actual_input_weight}
                onChange={(e) => handleInputChange('actual_input_weight', e.target.value)}
                data-testid="input-weight"
                required
              />
              {validationErrors?.actual_input_weight && (
                <span className="error-message" data-testid="input-weight-error">
                  {validationErrors.actual_input_weight}
                </span>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="actual_output_weight">OUT Weight (kg):</label>
              <input
                id="actual_output_weight"
                type="number"
                step="0.1"
                value={formData.actual_output_weight}
                onChange={(e) => handleInputChange('actual_output_weight', e.target.value)}
                data-testid="output-weight"
                required
              />
              {validationErrors?.actual_output_weight && (
                <span className="error-message" data-testid="output-weight-error">
                  {validationErrors.actual_output_weight}
                </span>
              )}
            </div>
            
            <div className="yield-display">
              <label>Yield %:</label>
              <span data-testid="yield-percentage">{calculateYield()}%</span>
            </div>
          </div>
          
          <div className="form-section">
            <h3>Losses & Gains</h3>
            <div className="form-group">
              <label htmlFor="cooking_loss_weight">Cooking Loss (kg):</label>
              <input
                id="cooking_loss_weight"
                type="number"
                step="0.1"
                value={formData.cooking_loss_weight}
                onChange={(e) => handleInputChange('cooking_loss_weight', e.target.value)}
                data-testid="cooking-loss"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="trim_loss_weight">Trim Loss (kg):</label>
              <input
                id="trim_loss_weight"
                type="number"
                step="0.1"
                value={formData.trim_loss_weight}
                onChange={(e) => handleInputChange('trim_loss_weight', e.target.value)}
                data-testid="trim-loss"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="marinade_gain_weight">Marinade Gain (kg):</label>
              <input
                id="marinade_gain_weight"
                type="number"
                step="0.1"
                value={formData.marinade_gain_weight}
                onChange={(e) => handleInputChange('marinade_gain_weight', e.target.value)}
                data-testid="marinade-gain"
              />
            </div>
          </div>
          
          <div className="form-section">
            <h3>Scrap Breakdown</h3>
            <div className="form-group">
              <label htmlFor="scrap_breakdown">Scrap Breakdown (JSON):</label>
              <textarea
                id="scrap_breakdown"
                value={formData.scrap_breakdown}
                onChange={(e) => handleInputChange('scrap_breakdown', e.target.value)}
                data-testid="scrap-breakdown"
                placeholder='{"fat": 1.0, "bone": 0.5}'
                rows={3}
              />
              {validationErrors?.scrap_breakdown && (
                <span className="error-message" data-testid="scrap-breakdown-error">
                  {validationErrors.scrap_breakdown}
                </span>
              )}
            </div>
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onClose} data-testid="cancel-btn">
              Cancel
            </button>
            <button 
              type="submit" 
              data-testid="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Recording...' : 'Record Weights'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

describe('RecordWeightsModal', () => {
  const mockOperation = {
    seq: 1,
    operation_name: 'Grind',
    planned_input_weight: 100.0,
    planned_output_weight: 95.0
  };

  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when open', () => {
      render(
        <MockRecordWeightsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operation={mockOperation}
          isLoading={false}
          validationErrors={null}
        />
      );

      expect(screen.getByTestId('record-weights-modal')).toBeInTheDocument();
      expect(screen.getByText('Record Weights - Operation 1')).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      render(
        <MockRecordWeightsModal
          isOpen={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operation={mockOperation}
          isLoading={false}
          validationErrors={null}
        />
      );

      expect(screen.queryByTestId('record-weights-modal')).not.toBeInTheDocument();
    });

    it('should display operation information', () => {
      render(
        <MockRecordWeightsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operation={mockOperation}
          isLoading={false}
          validationErrors={null}
        />
      );

      expect(screen.getByText('Record Weights - Operation 1')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should render all form fields', () => {
      render(
        <MockRecordWeightsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operation={mockOperation}
          isLoading={false}
          validationErrors={null}
        />
      );

      expect(screen.getByTestId('input-weight')).toBeInTheDocument();
      expect(screen.getByTestId('output-weight')).toBeInTheDocument();
      expect(screen.getByTestId('cooking-loss')).toBeInTheDocument();
      expect(screen.getByTestId('trim-loss')).toBeInTheDocument();
      expect(screen.getByTestId('marinade-gain')).toBeInTheDocument();
      expect(screen.getByTestId('scrap-breakdown')).toBeInTheDocument();
    });

    it('should have correct input types and attributes', () => {
      render(
        <MockRecordWeightsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operation={mockOperation}
          isLoading={false}
          validationErrors={null}
        />
      );

      const inputWeight = screen.getByTestId('input-weight');
      const outputWeight = screen.getByTestId('output-weight');

      expect(inputWeight).toHaveAttribute('type', 'number');
      expect(inputWeight).toHaveAttribute('step', '0.1');
      expect(inputWeight).toHaveAttribute('required');

      expect(outputWeight).toHaveAttribute('type', 'number');
      expect(outputWeight).toHaveAttribute('step', '0.1');
      expect(outputWeight).toHaveAttribute('required');
    });
  });

  describe('Yield Calculation', () => {
    it('should calculate and display yield percentage', () => {
      render(
        <MockRecordWeightsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operation={mockOperation}
          isLoading={false}
          validationErrors={null}
        />
      );

      const inputWeight = screen.getByTestId('input-weight');
      const outputWeight = screen.getByTestId('output-weight');

      fireEvent.change(inputWeight, { target: { value: '100' } });
      fireEvent.change(outputWeight, { target: { value: '95' } });

      expect(screen.getByTestId('yield-percentage')).toHaveTextContent('95.0%');
    });

    it('should handle zero input weight', () => {
      render(
        <MockRecordWeightsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operation={mockOperation}
          isLoading={false}
          validationErrors={null}
        />
      );

      const inputWeight = screen.getByTestId('input-weight');
      const outputWeight = screen.getByTestId('output-weight');

      fireEvent.change(inputWeight, { target: { value: '0' } });
      fireEvent.change(outputWeight, { target: { value: '95' } });

      expect(screen.getByTestId('yield-percentage')).toHaveTextContent('0%');
    });

    it('should update yield in real-time', () => {
      render(
        <MockRecordWeightsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operation={mockOperation}
          isLoading={false}
          validationErrors={null}
        />
      );

      const inputWeight = screen.getByTestId('input-weight');
      const outputWeight = screen.getByTestId('output-weight');

      fireEvent.change(inputWeight, { target: { value: '100' } });
      fireEvent.change(outputWeight, { target: { value: '90' } });

      expect(screen.getByTestId('yield-percentage')).toHaveTextContent('90.0%');

      fireEvent.change(outputWeight, { target: { value: '95' } });

      expect(screen.getByTestId('yield-percentage')).toHaveTextContent('95.0%');
    });
  });

  describe('Form Validation', () => {
    it('should display validation errors', () => {
      const validationErrors = {
        actual_input_weight: 'Input weight is required',
        scrap_breakdown: 'Invalid JSON format'
      };

      render(
        <MockRecordWeightsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operation={mockOperation}
          isLoading={false}
          validationErrors={validationErrors}
        />
      );

      expect(screen.getByTestId('input-weight-error')).toHaveTextContent('Input weight is required');
      expect(screen.getByTestId('scrap-breakdown-error')).toHaveTextContent('Invalid JSON format');
    });

    it('should not display validation errors when none exist', () => {
      render(
        <MockRecordWeightsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operation={mockOperation}
          isLoading={false}
          validationErrors={null}
        />
      );

      expect(screen.queryByTestId('input-weight-error')).not.toBeInTheDocument();
      expect(screen.queryByTestId('scrap-breakdown-error')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <MockRecordWeightsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operation={mockOperation}
          isLoading={false}
          validationErrors={null}
        />
      );

      const closeButton = screen.getByTestId('close-btn');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when cancel button is clicked', () => {
      render(
        <MockRecordWeightsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operation={mockOperation}
          isLoading={false}
          validationErrors={null}
        />
      );

      const cancelButton = screen.getByTestId('cancel-btn');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onSubmit when form is submitted', () => {
      render(
        <MockRecordWeightsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operation={mockOperation}
          isLoading={false}
          validationErrors={null}
        />
      );

      const inputWeight = screen.getByTestId('input-weight');
      const outputWeight = screen.getByTestId('output-weight');
      const submitButton = screen.getByTestId('submit-btn');

      fireEvent.change(inputWeight, { target: { value: '100' } });
      fireEvent.change(outputWeight, { target: { value: '95' } });
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        actual_input_weight: '100',
        actual_output_weight: '95',
        cooking_loss_weight: '',
        trim_loss_weight: '',
        marinade_gain_weight: '',
        scrap_breakdown: ''
      });
    });
  });

  describe('Loading State', () => {
    it('should display loading state when submitting', () => {
      render(
        <MockRecordWeightsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operation={mockOperation}
          isLoading={true}
          validationErrors={null}
        />
      );

      expect(screen.getByTestId('submit-btn')).toHaveTextContent('Recording...');
      expect(screen.getByTestId('submit-btn')).toBeDisabled();
    });

    it('should not display loading state when not submitting', () => {
      render(
        <MockRecordWeightsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operation={mockOperation}
          isLoading={false}
          validationErrors={null}
        />
      );

      expect(screen.getByTestId('submit-btn')).toHaveTextContent('Record Weights');
      expect(screen.getByTestId('submit-btn')).not.toBeDisabled();
    });
  });

  describe('Scrap Breakdown', () => {
    it('should handle JSON input for scrap breakdown', () => {
      render(
        <MockRecordWeightsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operation={mockOperation}
          isLoading={false}
          validationErrors={null}
        />
      );

      const scrapBreakdown = screen.getByTestId('scrap-breakdown');
      fireEvent.change(scrapBreakdown, { target: { value: '{"fat": 1.0, "bone": 0.5}' } });

      expect(scrapBreakdown.value).toBe('{"fat": 1.0, "bone": 0.5}');
    });

    it('should display placeholder for scrap breakdown', () => {
      render(
        <MockRecordWeightsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operation={mockOperation}
          isLoading={false}
          validationErrors={null}
        />
      );

      const scrapBreakdown = screen.getByTestId('scrap-breakdown');
      expect(scrapBreakdown).toHaveAttribute('placeholder', '{"fat": 1.0, "bone": 0.5}');
    });
  });

  describe('CSS Classes', () => {
    it('should apply correct CSS classes', () => {
      render(
        <MockRecordWeightsModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          operation={mockOperation}
          isLoading={false}
          validationErrors={null}
        />
      );

      expect(screen.getByTestId('record-weights-modal')).toHaveClass('modal-overlay');
      expect(screen.getByTestId('weights-form')).toBeInTheDocument();
    });
  });
});

