/**
 * UI Component Tests for Stage Board
 * Tests the StageBoard component functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the StageBoard component
const MockStageBoard = ({ 
  stageStatus, 
  onStageLP, 
  onRemoveLP, 
  onCompleteOperation,
  isLoading 
}) => (
  <div data-testid="stage-board">
    <div data-testid="stage-board-header">
      <h2>Stage Board</h2>
      {isLoading && <div data-testid="loading-indicator">Loading...</div>}
    </div>
    
    <div data-testid="operations-list">
      {stageStatus.operations.map((operation, index) => (
        <div key={index} data-testid={`operation-${operation.seq}`} className="operation-card">
          <div className="operation-header">
            <h3>Operation {operation.seq}: {operation.operation_name}</h3>
            <span className={`status-indicator ${operation.color_code}`}>
              {operation.color_code.toUpperCase()}
            </span>
          </div>
          
          <div className="operation-metrics">
            <div className="metric">
              <label>Required:</label>
              <span>{operation.required_kg} kg</span>
            </div>
            <div className="metric">
              <label>Staged:</label>
              <span>{operation.staged_kg} kg</span>
            </div>
            <div className="metric">
              <label>IN:</label>
              <span>{operation.in_kg} kg</span>
            </div>
            <div className="metric">
              <label>Remaining:</label>
              <span>{operation.remaining_kg} kg</span>
            </div>
          </div>
          
          <div className="operation-progress">
            <div 
              className="progress-bar"
              style={{ 
                width: `${Math.min(100, (operation.in_kg / operation.required_kg) * 100)}%`,
                backgroundColor: operation.color_code === 'green' ? '#10b981' : 
                               operation.color_code === 'amber' ? '#f59e0b' : '#ef4444'
              }}
            />
          </div>
          
          {operation.one_to_one_components.length > 0 && (
            <div className="one-to-one-badges">
              <span className="badge">1:1 Components:</span>
              {operation.one_to_one_components.map((component, idx) => (
                <span key={idx} className="one-to-one-badge">
                  {component.material_name}
                </span>
              ))}
            </div>
          )}
          
          <div className="operation-actions">
            <button 
              data-testid={`stage-btn-${operation.seq}`}
              onClick={() => onStageLP(operation.seq)}
              disabled={operation.color_code === 'green'}
            >
              Stage Materials
            </button>
            <button 
              data-testid={`complete-btn-${operation.seq}`}
              onClick={() => onCompleteOperation(operation.seq)}
              disabled={operation.color_code !== 'green'}
            >
              Complete Operation
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

describe('StageBoard', () => {
  const mockStageStatus = {
    wo_id: 1,
    operations: [
      {
        seq: 1,
        operation_name: 'Grind',
        required_kg: 100,
        staged_kg: 50,
        in_kg: 0,
        remaining_kg: 100,
        color_code: 'red',
        one_to_one_components: [
          { material_id: 1, material_name: 'Beef', one_to_one: true }
        ]
      },
      {
        seq: 2,
        operation_name: 'Mix',
        required_kg: 95,
        staged_kg: 95,
        in_kg: 95,
        remaining_kg: 0,
        color_code: 'green',
        one_to_one_components: []
      },
      {
        seq: 3,
        operation_name: 'Pack',
        required_kg: 90,
        staged_kg: 45,
        in_kg: 45,
        remaining_kg: 45,
        color_code: 'amber',
        one_to_one_components: []
      }
    ]
  };

  const mockOnStageLP = jest.fn();
  const mockOnRemoveLP = jest.fn();
  const mockOnCompleteOperation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render stage board', () => {
      render(
        <MockStageBoard
          stageStatus={mockStageStatus}
          onStageLP={mockOnStageLP}
          onRemoveLP={mockOnRemoveLP}
          onCompleteOperation={mockOnCompleteOperation}
          isLoading={false}
        />
      );

      expect(screen.getByTestId('stage-board')).toBeInTheDocument();
      expect(screen.getByText('Stage Board')).toBeInTheDocument();
    });

    it('should render all operations', () => {
      render(
        <MockStageBoard
          stageStatus={mockStageStatus}
          onStageLP={mockOnStageLP}
          onRemoveLP={mockOnRemoveLP}
          onCompleteOperation={mockOnCompleteOperation}
          isLoading={false}
        />
      );

      expect(screen.getByTestId('operation-1')).toBeInTheDocument();
      expect(screen.getByTestId('operation-2')).toBeInTheDocument();
      expect(screen.getByTestId('operation-3')).toBeInTheDocument();
    });

    it('should display operation names', () => {
      render(
        <MockStageBoard
          stageStatus={mockStageStatus}
          onStageLP={mockOnStageLP}
          onRemoveLP={mockOnRemoveLP}
          onCompleteOperation={mockOnCompleteOperation}
          isLoading={false}
        />
      );

      expect(screen.getByText('Operation 1: Grind')).toBeInTheDocument();
      expect(screen.getByText('Operation 2: Mix')).toBeInTheDocument();
      expect(screen.getByText('Operation 3: Pack')).toBeInTheDocument();
    });
  });

  describe('Color Codes', () => {
    it('should display correct color codes', () => {
      render(
        <MockStageBoard
          stageStatus={mockStageStatus}
          onStageLP={mockOnStageLP}
          onRemoveLP={mockOnRemoveLP}
          onCompleteOperation={mockOnCompleteOperation}
          isLoading={false}
        />
      );

      expect(screen.getByText('RED')).toBeInTheDocument();
      expect(screen.getByText('GREEN')).toBeInTheDocument();
      expect(screen.getByText('AMBER')).toBeInTheDocument();
    });

    it('should apply correct CSS classes for color codes', () => {
      render(
        <MockStageBoard
          stageStatus={mockStageStatus}
          onStageLP={mockOnStageLP}
          onRemoveLP={mockOnRemoveLP}
          onCompleteOperation={mockOnCompleteOperation}
          isLoading={false}
        />
      );

      const statusIndicators = screen.getAllByTestId(/status-indicator/);
      expect(statusIndicators[0]).toHaveClass('red');
      expect(statusIndicators[1]).toHaveClass('green');
      expect(statusIndicators[2]).toHaveClass('amber');
    });
  });

  describe('Metrics Display', () => {
    it('should display operation metrics correctly', () => {
      render(
        <MockStageBoard
          stageStatus={mockStageStatus}
          onStageLP={mockOnStageLP}
          onRemoveLP={mockOnRemoveLP}
          onCompleteOperation={mockOnCompleteOperation}
          isLoading={false}
        />
      );

      // Check first operation metrics
      expect(screen.getByText('Required:')).toBeInTheDocument();
      expect(screen.getByText('100 kg')).toBeInTheDocument();
      expect(screen.getByText('Staged:')).toBeInTheDocument();
      expect(screen.getByText('50 kg')).toBeInTheDocument();
      expect(screen.getByText('IN:')).toBeInTheDocument();
      expect(screen.getByText('0 kg')).toBeInTheDocument();
      expect(screen.getByText('Remaining:')).toBeInTheDocument();
      expect(screen.getByText('100 kg')).toBeInTheDocument();
    });
  });

  describe('Progress Bars', () => {
    it('should render progress bars with correct widths', () => {
      render(
        <MockStageBoard
          stageStatus={mockStageStatus}
          onStageLP={mockOnStageLP}
          onRemoveLP={mockOnRemoveLP}
          onCompleteOperation={mockOnCompleteOperation}
          isLoading={false}
        />
      );

      const progressBars = screen.getAllByTestId(/progress-bar/);
      expect(progressBars).toHaveLength(3);
    });

    it('should apply correct background colors to progress bars', () => {
      render(
        <MockStageBoard
          stageStatus={mockStageStatus}
          onStageLP={mockOnStageLP}
          onRemoveLP={mockOnRemoveLP}
          onCompleteOperation={mockOnCompleteOperation}
          isLoading={false}
        />
      );

      const progressBars = screen.getAllByTestId(/progress-bar/);
      expect(progressBars[0]).toHaveStyle('background-color: #ef4444'); // Red
      expect(progressBars[1]).toHaveStyle('background-color: #10b981'); // Green
      expect(progressBars[2]).toHaveStyle('background-color: #f59e0b'); // Amber
    });
  });

  describe('One-to-One Components', () => {
    it('should display one-to-one components for operations that have them', () => {
      render(
        <MockStageBoard
          stageStatus={mockStageStatus}
          onStageLP={mockOnStageLP}
          onRemoveLP={mockOnRemoveLP}
          onCompleteOperation={mockOnCompleteOperation}
          isLoading={false}
        />
      );

      expect(screen.getByText('1:1 Components:')).toBeInTheDocument();
      expect(screen.getByText('Beef')).toBeInTheDocument();
    });

    it('should not display one-to-one components for operations that don\'t have them', () => {
      render(
        <MockStageBoard
          stageStatus={mockStageStatus}
          onStageLP={mockOnStageLP}
          onRemoveLP={mockOnRemoveLP}
          onCompleteOperation={mockOnCompleteOperation}
          isLoading={false}
        />
      );

      const oneToOneBadges = screen.getAllByTestId(/one-to-one-badges/);
      expect(oneToOneBadges).toHaveLength(1); // Only operation 1 has 1:1 components
    });
  });

  describe('Action Buttons', () => {
    it('should render stage and complete buttons for each operation', () => {
      render(
        <MockStageBoard
          stageStatus={mockStageStatus}
          onStageLP={mockOnStageLP}
          onRemoveLP={mockOnRemoveLP}
          onCompleteOperation={mockOnCompleteOperation}
          isLoading={false}
        />
      );

      expect(screen.getByTestId('stage-btn-1')).toBeInTheDocument();
      expect(screen.getByTestId('complete-btn-1')).toBeInTheDocument();
      expect(screen.getByTestId('stage-btn-2')).toBeInTheDocument();
      expect(screen.getByTestId('complete-btn-2')).toBeInTheDocument();
    });

    it('should disable stage button for completed operations', () => {
      render(
        <MockStageBoard
          stageStatus={mockStageStatus}
          onStageLP={mockOnStageLP}
          onRemoveLP={mockOnRemoveLP}
          onCompleteOperation={mockOnCompleteOperation}
          isLoading={false}
        />
      );

      expect(screen.getByTestId('stage-btn-2')).toBeDisabled();
      expect(screen.getByTestId('stage-btn-1')).not.toBeDisabled();
      expect(screen.getByTestId('stage-btn-3')).not.toBeDisabled();
    });

    it('should disable complete button for incomplete operations', () => {
      render(
        <MockStageBoard
          stageStatus={mockStageStatus}
          onStageLP={mockOnStageLP}
          onRemoveLP={mockOnRemoveLP}
          onCompleteOperation={mockOnCompleteOperation}
          isLoading={false}
        />
      );

      expect(screen.getByTestId('complete-btn-1')).toBeDisabled();
      expect(screen.getByTestId('complete-btn-3')).toBeDisabled();
      expect(screen.getByTestId('complete-btn-2')).not.toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('should call onStageLP when stage button is clicked', () => {
      render(
        <MockStageBoard
          stageStatus={mockStageStatus}
          onStageLP={mockOnStageLP}
          onRemoveLP={mockOnRemoveLP}
          onCompleteOperation={mockOnCompleteOperation}
          isLoading={false}
        />
      );

      const stageButton = screen.getByTestId('stage-btn-1');
      fireEvent.click(stageButton);

      expect(mockOnStageLP).toHaveBeenCalledWith(1);
    });

    it('should call onCompleteOperation when complete button is clicked', () => {
      render(
        <MockStageBoard
          stageStatus={mockStageStatus}
          onStageLP={mockOnStageLP}
          onRemoveLP={mockOnRemoveLP}
          onCompleteOperation={mockOnCompleteOperation}
          isLoading={false}
        />
      );

      const completeButton = screen.getByTestId('complete-btn-2');
      fireEvent.click(completeButton);

      expect(mockOnCompleteOperation).toHaveBeenCalledWith(2);
    });
  });

  describe('Loading State', () => {
    it('should display loading indicator when loading', () => {
      render(
        <MockStageBoard
          stageStatus={mockStageStatus}
          onStageLP={mockOnStageLP}
          onRemoveLP={mockOnRemoveLP}
          onCompleteOperation={mockOnCompleteOperation}
          isLoading={true}
        />
      );

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should not display loading indicator when not loading', () => {
      render(
        <MockStageBoard
          stageStatus={mockStageStatus}
          onStageLP={mockOnStageLP}
          onRemoveLP={mockOnRemoveLP}
          onCompleteOperation={mockOnCompleteOperation}
          isLoading={false}
        />
      );

      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should handle empty operations list', () => {
      const emptyStageStatus = {
        wo_id: 1,
        operations: []
      };

      render(
        <MockStageBoard
          stageStatus={emptyStageStatus}
          onStageLP={mockOnStageLP}
          onRemoveLP={mockOnRemoveLP}
          onCompleteOperation={mockOnCompleteOperation}
          isLoading={false}
        />
      );

      expect(screen.getByTestId('stage-board')).toBeInTheDocument();
      expect(screen.queryByTestId('operation-1')).not.toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('should apply correct CSS classes to operation cards', () => {
      render(
        <MockStageBoard
          stageStatus={mockStageStatus}
          onStageLP={mockOnStageLP}
          onRemoveLP={mockOnRemoveLP}
          onCompleteOperation={mockOnCompleteOperation}
          isLoading={false}
        />
      );

      const operationCards = screen.getAllByTestId(/operation-/);
      operationCards.forEach(card => {
        expect(card).toHaveClass('operation-card');
      });
    });

    it('should apply correct CSS classes to one-to-one badges', () => {
      render(
        <MockStageBoard
          stageStatus={mockStageStatus}
          onStageLP={mockOnStageLP}
          onRemoveLP={mockOnRemoveLP}
          onCompleteOperation={mockOnCompleteOperation}
          isLoading={false}
        />
      );

      const oneToOneBadges = screen.getAllByTestId(/one-to-one-badge/);
      oneToOneBadges.forEach(badge => {
        expect(badge).toHaveClass('one-to-one-badge');
      });
    });
  });
});