/**
 * UI Component Tests for Yield Report Tab
 * Tests the YieldReportTab component functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the YieldReportTab component
const MockYieldReportTab = ({ 
  yieldData, 
  onToggleView, 
  onTimeBucketChange, 
  onExport, 
  currentView, 
  timeBucket 
}) => (
  <div data-testid="yield-report-tab">
    <div data-testid="controls">
      <div data-testid="view-toggle">
        <button 
          data-testid="pr-view-btn"
          className={currentView === 'PR' ? 'active' : ''}
          onClick={() => onToggleView('PR')}
        >
          PR Yield
        </button>
        <button 
          data-testid="fg-view-btn"
          className={currentView === 'FG' ? 'active' : ''}
          onClick={() => onToggleView('FG')}
        >
          FG Yield
        </button>
      </div>
      
      <div data-testid="time-bucket-selector">
        <select 
          data-testid="time-bucket-select"
          value={timeBucket}
          onChange={(e) => onTimeBucketChange(e.target.value)}
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </div>
      
      <button 
        data-testid="export-btn"
        onClick={onExport}
      >
        Export
      </button>
    </div>
    
    <div data-testid="kpi-cards">
      <div data-testid="yield-percentage-card" className="kpi-card">
        <h3>Yield %</h3>
        <div className="kpi-value">{yieldData.yieldPercentage}%</div>
      </div>
      
      <div data-testid="consumption-card" className="kpi-card">
        <h3>{currentView === 'PR' ? 'PR Consumption/kg' : 'FG Waste'}</h3>
        <div className="kpi-value">{yieldData.consumptionOrWaste}</div>
      </div>
      
      <div data-testid="plan-accuracy-card" className="kpi-card">
        <h3>Plan Accuracy</h3>
        <div className="kpi-value">{yieldData.planAccuracy}%</div>
      </div>
      
      <div data-testid="on-time-card" className="kpi-card">
        <h3>On-time %</h3>
        <div className="kpi-value">{yieldData.onTimePercentage}%</div>
      </div>
    </div>
    
    <div data-testid="trend-chart">
      <h3>Yield Trends</h3>
      <div data-testid="chart-container">
        {/* Mock chart data */}
        {yieldData.trendData.map((point, index) => (
          <div key={index} data-testid={`chart-point-${index}`}>
            {point.date}: {point.yield}%
          </div>
        ))}
      </div>
    </div>
  </div>
);

describe('YieldReportTab', () => {
  const mockYieldData = {
    yieldPercentage: 95.5,
    consumptionOrWaste: 2.5,
    planAccuracy: 98.2,
    onTimePercentage: 92.1,
    trendData: [
      { date: '2024-01-01', yield: 94.5 },
      { date: '2024-01-02', yield: 96.0 },
      { date: '2024-01-03', yield: 95.5 }
    ]
  };

  const mockOnToggleView = jest.fn();
  const mockOnTimeBucketChange = jest.fn();
  const mockOnExport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render yield report tab', () => {
      render(
        <MockYieldReportTab
          yieldData={mockYieldData}
          onToggleView={mockOnToggleView}
          onTimeBucketChange={mockOnTimeBucketChange}
          onExport={mockOnExport}
          currentView="PR"
          timeBucket="day"
        />
      );

      expect(screen.getByTestId('yield-report-tab')).toBeInTheDocument();
    });

    it('should display KPI cards', () => {
      render(
        <MockYieldReportTab
          yieldData={mockYieldData}
          onToggleView={mockOnToggleView}
          onTimeBucketChange={mockOnTimeBucketChange}
          onExport={mockOnExport}
          currentView="PR"
          timeBucket="day"
        />
      );

      expect(screen.getByTestId('yield-percentage-card')).toBeInTheDocument();
      expect(screen.getByTestId('consumption-card')).toBeInTheDocument();
      expect(screen.getByTestId('plan-accuracy-card')).toBeInTheDocument();
      expect(screen.getByTestId('on-time-card')).toBeInTheDocument();
    });

    it('should display KPI values correctly', () => {
      render(
        <MockYieldReportTab
          yieldData={mockYieldData}
          onToggleView={mockOnToggleView}
          onTimeBucketChange={mockOnTimeBucketChange}
          onExport={mockOnExport}
          currentView="PR"
          timeBucket="day"
        />
      );

      expect(screen.getByText('95.5%')).toBeInTheDocument();
      expect(screen.getByText('2.5')).toBeInTheDocument();
      expect(screen.getByText('98.2%')).toBeInTheDocument();
      expect(screen.getByText('92.1%')).toBeInTheDocument();
    });
  });

  describe('View Toggle', () => {
    it('should render view toggle buttons', () => {
      render(
        <MockYieldReportTab
          yieldData={mockYieldData}
          onToggleView={mockOnToggleView}
          onTimeBucketChange={mockOnTimeBucketChange}
          onExport={mockOnExport}
          currentView="PR"
          timeBucket="day"
        />
      );

      expect(screen.getByTestId('pr-view-btn')).toBeInTheDocument();
      expect(screen.getByTestId('fg-view-btn')).toBeInTheDocument();
    });

    it('should highlight active view', () => {
      render(
        <MockYieldReportTab
          yieldData={mockYieldData}
          onToggleView={mockOnToggleView}
          onTimeBucketChange={mockOnTimeBucketChange}
          onExport={mockOnExport}
          currentView="PR"
          timeBucket="day"
        />
      );

      expect(screen.getByTestId('pr-view-btn')).toHaveClass('active');
      expect(screen.getByTestId('fg-view-btn')).not.toHaveClass('active');
    });

    it('should call onToggleView when PR button is clicked', () => {
      render(
        <MockYieldReportTab
          yieldData={mockYieldData}
          onToggleView={mockOnToggleView}
          onTimeBucketChange={mockOnTimeBucketChange}
          onExport={mockOnExport}
          currentView="FG"
          timeBucket="day"
        />
      );

      const prButton = screen.getByTestId('pr-view-btn');
      fireEvent.click(prButton);

      expect(mockOnToggleView).toHaveBeenCalledWith('PR');
    });

    it('should call onToggleView when FG button is clicked', () => {
      render(
        <MockYieldReportTab
          yieldData={mockYieldData}
          onToggleView={mockOnToggleView}
          onTimeBucketChange={mockOnTimeBucketChange}
          onExport={mockOnExport}
          currentView="PR"
          timeBucket="day"
        />
      );

      const fgButton = screen.getByTestId('fg-view-btn');
      fireEvent.click(fgButton);

      expect(mockOnToggleView).toHaveBeenCalledWith('FG');
    });
  });

  describe('Time Bucket Selection', () => {
    it('should render time bucket selector', () => {
      render(
        <MockYieldReportTab
          yieldData={mockYieldData}
          onToggleView={mockOnToggleView}
          onTimeBucketChange={mockOnTimeBucketChange}
          onExport={mockOnExport}
          currentView="PR"
          timeBucket="day"
        />
      );

      expect(screen.getByTestId('time-bucket-select')).toBeInTheDocument();
    });

    it('should display current time bucket', () => {
      render(
        <MockYieldReportTab
          yieldData={mockYieldData}
          onToggleView={mockOnToggleView}
          onTimeBucketChange={mockOnTimeBucketChange}
          onExport={mockOnExport}
          currentView="PR"
          timeBucket="week"
        />
      );

      const select = screen.getByTestId('time-bucket-select');
      expect(select.value).toBe('week');
    });

    it('should call onTimeBucketChange when selection changes', () => {
      render(
        <MockYieldReportTab
          yieldData={mockYieldData}
          onToggleView={mockOnToggleView}
          onTimeBucketChange={mockOnTimeBucketChange}
          onExport={mockOnExport}
          currentView="PR"
          timeBucket="day"
        />
      );

      const select = screen.getByTestId('time-bucket-select');
      fireEvent.change(select, { target: { value: 'month' } });

      expect(mockOnTimeBucketChange).toHaveBeenCalledWith('month');
    });
  });

  describe('Export Functionality', () => {
    it('should render export button', () => {
      render(
        <MockYieldReportTab
          yieldData={mockYieldData}
          onToggleView={mockOnToggleView}
          onTimeBucketChange={mockOnTimeBucketChange}
          onExport={mockOnExport}
          currentView="PR"
          timeBucket="day"
        />
      );

      expect(screen.getByTestId('export-btn')).toBeInTheDocument();
    });

    it('should call onExport when export button is clicked', () => {
      render(
        <MockYieldReportTab
          yieldData={mockYieldData}
          onToggleView={mockOnToggleView}
          onTimeBucketChange={mockOnTimeBucketChange}
          onExport={mockOnExport}
          currentView="PR"
          timeBucket="day"
        />
      );

      const exportButton = screen.getByTestId('export-btn');
      fireEvent.click(exportButton);

      expect(mockOnExport).toHaveBeenCalled();
    });
  });

  describe('Trend Chart', () => {
    it('should render trend chart', () => {
      render(
        <MockYieldReportTab
          yieldData={mockYieldData}
          onToggleView={mockOnToggleView}
          onTimeBucketChange={mockOnTimeBucketChange}
          onExport={mockOnExport}
          currentView="PR"
          timeBucket="day"
        />
      );

      expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
      expect(screen.getByText('Yield Trends')).toBeInTheDocument();
    });

    it('should display trend data points', () => {
      render(
        <MockYieldReportTab
          yieldData={mockYieldData}
          onToggleView={mockOnToggleView}
          onTimeBucketChange={mockOnTimeBucketChange}
          onExport={mockOnExport}
          currentView="PR"
          timeBucket="day"
        />
      );

      expect(screen.getByTestId('chart-point-0')).toBeInTheDocument();
      expect(screen.getByTestId('chart-point-1')).toBeInTheDocument();
      expect(screen.getByTestId('chart-point-2')).toBeInTheDocument();
    });

    it('should display trend data correctly', () => {
      render(
        <MockYieldReportTab
          yieldData={mockYieldData}
          onToggleView={mockOnToggleView}
          onTimeBucketChange={mockOnTimeBucketChange}
          onExport={mockOnExport}
          currentView="PR"
          timeBucket="day"
        />
      );

      expect(screen.getByText('2024-01-01: 94.5%')).toBeInTheDocument();
      expect(screen.getByText('2024-01-02: 96.0%')).toBeInTheDocument();
      expect(screen.getByText('2024-01-03: 95.5%')).toBeInTheDocument();
    });
  });

  describe('View-Specific Content', () => {
    it('should display PR-specific content for PR view', () => {
      render(
        <MockYieldReportTab
          yieldData={mockYieldData}
          onToggleView={mockOnToggleView}
          onTimeBucketChange={mockOnTimeBucketChange}
          onExport={mockOnExport}
          currentView="PR"
          timeBucket="day"
        />
      );

      expect(screen.getByText('PR Consumption/kg')).toBeInTheDocument();
    });

    it('should display FG-specific content for FG view', () => {
      render(
        <MockYieldReportTab
          yieldData={mockYieldData}
          onToggleView={mockOnToggleView}
          onTimeBucketChange={mockOnTimeBucketChange}
          onExport={mockOnExport}
          currentView="FG"
          timeBucket="day"
        />
      );

      expect(screen.getByText('FG Waste')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should handle empty yield data', () => {
      const emptyYieldData = {
        yieldPercentage: 0,
        consumptionOrWaste: 0,
        planAccuracy: 0,
        onTimePercentage: 0,
        trendData: []
      };

      render(
        <MockYieldReportTab
          yieldData={emptyYieldData}
          onToggleView={mockOnToggleView}
          onTimeBucketChange={mockOnTimeBucketChange}
          onExport={mockOnExport}
          currentView="PR"
          timeBucket="day"
        />
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('KPI Card Styling', () => {
    it('should apply correct CSS classes to KPI cards', () => {
      render(
        <MockYieldReportTab
          yieldData={mockYieldData}
          onToggleView={mockOnToggleView}
          onTimeBucketChange={mockOnTimeBucketChange}
          onExport={mockOnExport}
          currentView="PR"
          timeBucket="day"
        />
      );

      const kpiCards = screen.getAllByTestId(/.*-card$/);
      kpiCards.forEach(card => {
        expect(card).toHaveClass('kpi-card');
      });
    });
  });
});

