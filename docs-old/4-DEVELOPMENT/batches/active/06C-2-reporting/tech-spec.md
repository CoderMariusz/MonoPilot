# Batch 06C-2: Quality Reporting - Technical Specification

## Stories
- 6.22: Quality Dashboard
- 6.23: Quality Reports Generation
- 6.24: Export Reports to PDF/Excel

## Dashboard KPIs (Story 6.22)

```typescript
interface QualityDashboardData {
  openHolds: number
  openNcrsBySeverity: { low: number, medium: number, high: number, critical: number }
  avgHoldResolutionDays: number
  failedTestRate: number // % failed / total tests
  pendingCoas: number
  ncrTrend: { month: string, count: number }[]
  topDefectTypes: { type: string, count: number }[]
  supplierDefectRate: { supplier: string, rate: number }[]
}
```

## Report Types (Story 6.23)

1. NCR Summary - by date range, severity, type
2. Test Results Summary - by product, date
3. Quality Hold Report - by status, date
4. CoA Compliance Report - pending/verified/rejected
5. Supplier Quality Performance - defect rates

## API Endpoints

- GET /api/quality/dashboard
- POST /api/quality/reports/generate
- GET /api/quality/reports/:id/download

## Export Libraries

- PDF: jspdf + jspdf-autotable
- Excel: xlsx (SheetJS)
