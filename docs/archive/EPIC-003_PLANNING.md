# EPIC-003: Production Intelligence & Cost Optimization - Planning

**Epic:** Production Intelligence & Cost Optimization
**Status:** 📋 **PLANNING** - Ready for Kickoff
**Planned Start:** After Supabase Resume + Integration Testing
**Estimated Duration:** 6-8 weeks (4 phases)
**Business Priority:** HIGH - Cost visibility and optimization
**Dependencies:** EPIC-001 (BOM Complexity) complete ✅

---

## 🎯 Epic Vision

Transform the MonoPilot MES from a production execution system into a **production intelligence platform** by adding cost visibility, predictive analytics, and optimization recommendations. This epic provides management with real-time cost insights and actionable recommendations to improve margins and efficiency.

**Business Driver:** Food manufacturing operates on thin margins (3-8%). Real-time cost visibility and optimization can improve profitability by 15-25% through better material sourcing, waste reduction, and recipe optimization.

---

## 📊 Epic Objectives

### **Primary Goals:**

1. **Cost Visibility** - Real-time cost tracking at product, BOM, and WO levels
2. **Decision Support** - BOM preview and condition templates for faster planning
3. **Performance Analytics** - Production KPIs, trends, and insights
4. **Cost Optimization** - AI-powered recommendations for cost reduction

### **Success Metrics:**

- 100% visibility into product costs (currently 0%)
- 50% reduction in BOM configuration time
- 80% faster "what-if" cost analysis
- 15-25% cost reduction through optimization recommendations
- Real-time margin visibility for all products

### **Business Value:**

- **$50K-$200K annual savings** through cost optimization
- **4-6 hours/week saved** in manual cost calculations
- **Better pricing decisions** with real-time cost data
- **Proactive cost management** vs reactive

---

## 🏗️ Epic Architecture

### **4-Phase Approach:**

```
Phase 1: BOM Cost Calculation & Analysis (2 weeks)
   ↓
Phase 2: BOM Preview & Condition Templates (1 week)
   ↓
Phase 3: Advanced Analytics Dashboard (2 weeks)
   ↓
Phase 4: Cost Optimization Engine (2-3 weeks)
```

### **Technical Stack:**

- **Backend:** PostgreSQL views, RPC functions for cost rollups
- **API:** New CostsAPI, AnalyticsAPI classes
- **Frontend:** Chart.js / Recharts for visualizations
- **AI/ML:** TensorFlow.js for predictions (Phase 4)

---

## 📦 Phase 1: BOM Cost Calculation & Analysis

**Duration:** 2 weeks
**Business Value:** HIGH - Foundation for all cost intelligence
**Effort:** Medium

### **Objectives:**

- Track material costs and cost history
- Automatic cost rollup from materials to finished goods
- Cost comparison between BOM versions
- Margin analysis (sell price vs cost)
- Historical cost trends

### **Deliverables:**

#### **1.1 Database Schema**

**New Tables:**

```sql
-- Material cost tracking
material_costs (
  id, product_id, cost, currency, uom, effective_from, effective_to,
  source (manual, supplier, average), notes, created_by, created_at
)

-- BOM cost snapshots
bom_costs (
  id, bom_id, total_cost, material_costs_json, labor_cost, overhead_cost,
  calculated_at, calculated_by, notes
)

-- Product sell prices
product_prices (
  id, product_id, price, currency, effective_from, effective_to,
  price_type (wholesale, retail, export), created_by, created_at
)

-- WO cost tracking
wo_costs (
  id, wo_id, planned_cost, actual_cost, material_cost, labor_cost,
  overhead_cost, variance, calculated_at
)
```

**Indexes:**

```sql
CREATE INDEX idx_material_costs_product_date ON material_costs(product_id, effective_from);
CREATE INDEX idx_bom_costs_bom_id ON bom_costs(bom_id);
CREATE INDEX idx_product_prices_product_date ON product_prices(product_id, effective_from);
CREATE INDEX idx_wo_costs_wo_id ON wo_costs(wo_id);
```

#### **1.2 RPC Functions**

```sql
-- Calculate BOM total cost
calculate_bom_cost(bom_id, as_of_date) RETURNS JSONB

-- Get cost breakdown
get_bom_cost_breakdown(bom_id) RETURNS TABLE

-- Compare BOM version costs
compare_bom_costs(bom_id_1, bom_id_2) RETURNS JSONB

-- Get cost trends
get_product_cost_trend(product_id, days) RETURNS TABLE

-- Calculate WO cost
calculate_wo_cost(wo_id) RETURNS JSONB
```

#### **1.3 API Layer**

**New Class: `CostsAPI.ts`**

```typescript
class CostsAPI {
  // Material Costs
  static async setMaterialCost(
    productId,
    cost,
    effectiveFrom
  ): Promise<MaterialCost>;
  static async getMaterialCostHistory(productId): Promise<MaterialCost[]>;
  static async getMaterialCostAtDate(productId, date): Promise<number>;

  // BOM Costs
  static async calculateBOMCost(bomId, asOfDate?): Promise<BOMCostBreakdown>;
  static async saveBOMCostSnapshot(bomId): Promise<BOMCost>;
  static async getBOMCostHistory(bomId): Promise<BOMCost[]>;
  static async compareBOMCosts(bomId1, bomId2): Promise<CostComparison>;

  // Product Prices & Margins
  static async setProductPrice(
    productId,
    price,
    effectiveFrom
  ): Promise<ProductPrice>;
  static async getMarginAnalysis(productId): Promise<MarginAnalysis>;

  // Work Order Costs
  static async calculateWOCost(woId): Promise<WOCost>;
  static async getWOCostVariance(woId): Promise<CostVariance>;
}
```

**Types:**

```typescript
interface BOMCostBreakdown {
  bomId: number;
  totalCost: number;
  currency: string;
  materials: MaterialCostItem[];
  laborCost: number;
  overheadCost: number;
  calculatedAt: string;
}

interface MaterialCostItem {
  productId: number;
  productName: string;
  quantity: number;
  uom: string;
  unitCost: number;
  totalCost: number;
}

interface MarginAnalysis {
  productId: number;
  productName: string;
  cost: number;
  price: number;
  margin: number;
  marginPercent: number;
}

interface CostComparison {
  bomId1: number;
  bomId2: number;
  costDiff: number;
  costDiffPercent: number;
  changedMaterials: MaterialCostDiff[];
}
```

#### **1.4 UI Components**

**Pages:**

1. **Cost Management** (`/technical/costs`) - Material cost entry and history
2. **BOM Cost Analysis** (`/technical/bom/[id]/costs`) - BOM cost breakdown
3. **Product Margin Analysis** (`/technical/products/[id]/margin`) - Margin visibility

**Components:**

```typescript
// Cost entry form
<MaterialCostForm
  productId={123}
  onSave={handleSave}
/>

// BOM cost breakdown table
<BOMCostBreakdown
  bomId={456}
  showDetails={true}
/>

// Cost comparison chart
<BOMCostComparisonChart
  bomId1={456}
  bomId2={457}
/>

// Margin gauge
<MarginGauge
  cost={10.50}
  price={15.00}
  targetMargin={30}
/>

// Cost trend chart
<CostTrendChart
  productId={123}
  days={90}
/>
```

### **Acceptance Criteria:**

- ✅ Material costs can be entered and tracked over time
- ✅ BOM cost automatically calculates from material costs
- ✅ Cost comparison works between BOM versions
- ✅ Margin analysis shows cost vs price with percentage
- ✅ Cost trends display 90-day history
- ✅ WO planned vs actual cost variance tracked
- ✅ All cost data exportable to Excel
- ✅ 0 TypeScript errors
- ✅ E2E tests for cost entry and calculation

### **Business Impact:**

- **Before:** No cost visibility, manual Excel calculations (4-6 hours/week)
- **After:** Real-time cost data, automatic calculations (<5 min)
- **ROI:** $15K-$30K/year in saved time + better pricing decisions

---

## 📦 Phase 2: BOM Preview & Condition Templates

**Duration:** 1 week
**Business Value:** MEDIUM - Faster BOM configuration
**Effort:** Low-Medium

### **Objectives:**

- Visual preview of which materials will be included for given order flags
- Library of reusable condition templates
- Faster BOM configuration (50% time reduction)
- Reduced configuration errors

### **Deliverables:**

#### **2.1 Database Schema**

**New Table:**

```sql
condition_templates (
  id, name, description, condition_json JSONB,
  category (organic, allergen, customer, region),
  is_global BOOLEAN, org_id, created_by, created_at
)
```

#### **2.2 API Layer**

**Extend `BomsAPI.ts`:**

```typescript
// Condition Templates
static async createConditionTemplate(name, condition): Promise<Template>
static async getConditionTemplates(category?): Promise<Template[]>
static async applyTemplate(bomItemId, templateId): Promise<void>

// BOM Preview
static async previewMaterials(bomId, orderFlags): Promise<MaterialPreview>
static async validateConditions(bomId, orderFlags): Promise<ValidationResult>
```

#### **2.3 UI Components**

**New Components:**

```typescript
// Material preview with inclusion/exclusion
<BOMPreviewPanel
  bomId={456}
  orderFlags={['organic', 'gluten_free']}
  onFlagsChange={handleChange}
/>

// Condition template library
<ConditionTemplateLibrary
  category="allergen"
  onSelect={handleSelect}
/>

// Template editor
<ConditionTemplateEditor
  template={template}
  onSave={handleSave}
/>
```

**Preview UI:**

```
┌────────────────────────────────────────────────┐
│ Preview Materials for Order                    │
│                                                │
│ Order Flags: [organic] [gluten_free]          │
│                                                │
│ ✅ Materials to Include: (8 items)            │
│  • Flour (unconditional)                       │
│  • Organic Sugar (organic=true)                │
│  • Gluten-Free Starch (gluten_free=true)       │
│  ...                                           │
│                                                │
│ ❌ Materials Excluded: (2 items)               │
│  • Regular Sugar (requires organic=false)      │
│  • Wheat Gluten (requires gluten_free=false)   │
│                                                │
│ Total: 10 materials (8 included, 2 excluded)   │
│ Estimated Cost: $45.30 (vs $52.10 full BOM)   │
└────────────────────────────────────────────────┘
```

### **Acceptance Criteria:**

- ✅ Preview shows exactly which materials will be included
- ✅ Preview updates in real-time as flags change
- ✅ Template library with 10+ pre-built templates
- ✅ Custom templates can be created and saved
- ✅ Templates apply to BOM items with one click
- ✅ Preview shows estimated cost difference
- ✅ E2E tests for preview and template application

### **Business Impact:**

- **Before:** 15-20 min to configure BOM for custom order
- **After:** 3-5 min with templates and preview
- **ROI:** 50%+ time reduction in BOM configuration

---

## 📦 Phase 3: Advanced Analytics Dashboard

**Duration:** 2 weeks
**Business Value:** HIGH - Data-driven decision making
**Effort:** Medium-High

### **Objectives:**

- Real-time production KPIs and metrics
- Cost trend analysis
- Yield and efficiency tracking
- Custom reports and exports
- Executive dashboard

### **Deliverables:**

#### **3.1 Database Views**

```sql
-- Production KPIs view
CREATE VIEW v_production_kpis AS
SELECT
  DATE_TRUNC('day', completed_at) as date,
  COUNT(*) as orders_completed,
  SUM(planned_qty) as units_produced,
  AVG(actual_yield_percent) as avg_yield,
  SUM(planned_cost) as planned_cost,
  SUM(actual_cost) as actual_cost
FROM work_orders
WHERE status = 'completed'
GROUP BY DATE_TRUNC('day', completed_at);

-- Cost trends view
CREATE VIEW v_cost_trends AS
SELECT
  p.id as product_id,
  p.name as product_name,
  mc.effective_from as date,
  mc.cost,
  LAG(mc.cost) OVER (PARTITION BY p.id ORDER BY mc.effective_from) as previous_cost
FROM products p
JOIN material_costs mc ON p.id = mc.product_id;

-- Yield analysis view
CREATE VIEW v_yield_analysis AS
SELECT
  p.id as product_id,
  p.name as product_name,
  AVG(wo.actual_yield_percent) as avg_yield,
  STDDEV(wo.actual_yield_percent) as yield_variance,
  COUNT(*) as production_runs
FROM work_orders wo
JOIN products p ON wo.product_id = p.id
WHERE wo.status = 'completed'
GROUP BY p.id, p.name;
```

#### **3.2 API Layer**

**New Class: `AnalyticsAPI.ts`**

```typescript
class AnalyticsAPI {
  // Dashboard KPIs
  static async getProductionKPIs(dateRange): Promise<KPIMetrics>;
  static async getCostTrends(productIds, days): Promise<TrendData>;
  static async getYieldAnalysis(productIds): Promise<YieldStats>;

  // Reports
  static async getTopProducts(metric, limit): Promise<ProductRanking[]>;
  static async getBottomPerformers(metric, limit): Promise<ProductRanking[]>;
  static async getCostVarianceReport(dateRange): Promise<VarianceReport>;

  // Export
  static async exportAnalytics(type, filters): Promise<Blob>;
}
```

#### **3.3 UI Components**

**New Page:** `/analytics` - Analytics Dashboard

**Dashboard Sections:**

1. **KPI Cards** - Today's key metrics
   - Orders Completed
   - Units Produced
   - Avg Yield %
   - Cost Variance

2. **Cost Trends Chart** - Line chart of cost over time
3. **Yield Analysis** - Bar chart of yield by product
4. **Top/Bottom Performers** - Tables of best/worst products
5. **Cost Variance** - Gauge chart of planned vs actual

**Components:**

```typescript
<KPICard
  title="Orders Completed"
  value={47}
  change="+12%"
  trend="up"
/>

<CostTrendsChart
  productIds={[1,2,3]}
  days={30}
  height={400}
/>

<YieldAnalysisChart
  productIds={[1,2,3]}
  showTarget={true}
/>

<TopPerformersTable
  metric="margin"
  limit={10}
/>
```

### **Acceptance Criteria:**

- ✅ Dashboard loads in <2 seconds
- ✅ KPIs update in real-time
- ✅ Charts interactive (zoom, pan, tooltip)
- ✅ All data exportable to Excel/PDF
- ✅ Custom date ranges supported
- ✅ Mobile-responsive dashboard
- ✅ E2E tests for dashboard interactions

### **Business Impact:**

- **Before:** Weekly Excel reports, day-old data
- **After:** Real-time dashboard, instant insights
- **ROI:** 8-10 hours/week saved in reporting

---

## 📦 Phase 4: Cost Optimization Engine

**Duration:** 2-3 weeks
**Business Value:** VERY HIGH - AI-powered cost reduction
**Effort:** High

### **Objectives:**

- AI-powered recommendations for cost reduction
- Material substitution suggestions
- Recipe optimization based on historical data
- Anomaly detection in costs and yield
- "What-if" scenario modeling

### **Deliverables:**

#### **4.1 Machine Learning Models**

**Models:**

1. **Cost Predictor** - Predict future material costs
2. **Yield Optimizer** - Suggest recipe adjustments for better yield
3. **Substitution Recommender** - Find cheaper alternative materials
4. **Anomaly Detector** - Flag unusual costs or yields

**Technology:**

- TensorFlow.js for client-side predictions
- Historical data training (6+ months required)
- Periodic model retraining

#### **4.2 API Layer**

**New Class: `OptimizationAPI.ts`**

```typescript
class OptimizationAPI {
  // Recommendations
  static async getCostOptimizationRecommendations(
    bomId
  ): Promise<Recommendation[]>;
  static async getMaterialSubstitutions(productId): Promise<Substitution[]>;
  static async getYieldImprovements(woId): Promise<YieldSuggestion[]>;

  // What-If Analysis
  static async simulateCostChange(bomId, changes): Promise<Simulation>;
  static async simulateYieldChange(woId, newYield): Promise<YieldSimulation>;

  // Anomaly Detection
  static async detectCostAnomalies(dateRange): Promise<Anomaly[]>;
  static async detectYieldAnomalies(productId): Promise<Anomaly[]>;
}
```

**Types:**

```typescript
interface Recommendation {
  type: 'substitution' | 'recipe_change' | 'process_improvement';
  title: string;
  description: string;
  estimatedSavings: number;
  confidence: number; // 0-100
  effort: 'low' | 'medium' | 'high';
  actions: Action[];
}

interface Substitution {
  currentMaterial: Product;
  suggestedMaterial: Product;
  costSavings: number;
  qualityImpact: 'none' | 'minor' | 'moderate';
  allergenChanges: string[];
}

interface YieldSuggestion {
  currentYield: number;
  targetYield: number;
  suggestedChanges: ProcessChange[];
  estimatedSavings: number;
}
```

#### **4.3 UI Components**

**New Page:** `/optimization` - Cost Optimization Center

**Components:**

```typescript
<RecommendationsList
  bomId={456}
  sortBy="savings"
/>

<SubstitutionCard
  substitution={substitution}
  onApply={handleApply}
/>

<WhatIfSimulator
  bomId={456}
  onSimulate={handleSimulate}
/>

<AnomalyAlerts
  dateRange="last_7_days"
/>
```

**Recommendation Card UI:**

```
┌────────────────────────────────────────────────┐
│ 💡 Material Substitution Recommendation        │
│                                                │
│ Replace: Vanilla Extract (Grade A)             │
│ With: Vanilla Extract (Grade B)                │
│                                                │
│ Est. Savings: $2.30/unit (18% cost reduction)  │
│ Quality Impact: Minor (taste similar)          │
│ Confidence: 87%                                │
│                                                │
│ [View Details] [Apply] [Dismiss]               │
└────────────────────────────────────────────────┘
```

### **Acceptance Criteria:**

- ✅ Recommendations generated for all BOMs
- ✅ Substitutions include quality and allergen impact
- ✅ What-if simulator shows cost/margin changes
- ✅ Anomaly detection runs daily
- ✅ ML models retrain weekly
- ✅ Recommendation acceptance tracking
- ✅ ROI tracking for applied recommendations

### **Business Impact:**

- **Before:** Manual analysis, reactive cost management
- **After:** Proactive recommendations, continuous optimization
- **ROI:** $50K-$200K/year in cost reductions (15-25% of COGS)

---

## 📊 Epic-Level Metrics

### **Technical Metrics:**

- **Database Tables:** 5 new tables (material_costs, bom_costs, product_prices, wo_costs, condition_templates)
- **API Classes:** 3 new classes (CostsAPI, AnalyticsAPI, OptimizationAPI)
- **API Methods:** 35+ new methods
- **UI Pages:** 5 new pages
- **UI Components:** 20+ new components
- **Lines of Code:** ~4,500 estimated
- **E2E Tests:** 25+ tests

### **Business Metrics:**

| Metric                | Before      | After      | Improvement |
| --------------------- | ----------- | ---------- | ----------- |
| **Cost Visibility**   | 0%          | 100%       | +100%       |
| **BOM Config Time**   | 15-20 min   | 3-5 min    | -70%        |
| **Manual Reporting**  | 10 hrs/week | <1 hr/week | -90%        |
| **Cost Analysis**     | Days        | Minutes    | -99%        |
| **Margin Visibility** | None        | Real-time  | ✅          |

### **Financial Impact:**

- **Direct Savings:** $50K-$200K/year from optimization
- **Time Savings:** 15-20 hours/week = $30K-$40K/year
- **Better Decisions:** Pricing, sourcing, recipe changes
- **Total ROI:** $80K-$240K/year
- **Payback Period:** 2-3 months

---

## 🧪 Testing Strategy

### **Unit Tests:**

- Cost calculation functions
- BOM cost rollup logic
- Margin calculations
- ML model predictions

### **Integration Tests:**

- Cost updates propagate to BOMs
- Template application works correctly
- Analytics queries perform well
- Recommendations are valid

### **E2E Tests:**

```typescript
// Phase 1: Cost Calculation
test('should calculate BOM cost from material costs');
test('should compare costs between BOM versions');
test('should track cost history over time');

// Phase 2: Preview & Templates
test('should preview materials based on conditions');
test('should apply template to BOM item');
test('should save custom template');

// Phase 3: Analytics
test('should load dashboard with KPIs');
test('should export analytics to Excel');
test('should filter by date range');

// Phase 4: Optimization
test('should generate cost recommendations');
test('should simulate what-if scenario');
test('should detect cost anomalies');
```

### **Performance Tests:**

- Cost calculation <500ms for 50-item BOM
- Dashboard load <2s
- Analytics queries <1s
- ML predictions <100ms

---

## 🎯 Success Criteria

### **Phase 1: Cost Calculation**

- ✅ Material costs tracked with history
- ✅ BOM cost automatically calculated
- ✅ Cost comparison between versions works
- ✅ Margin analysis accurate
- ✅ WO cost variance tracked

### **Phase 2: Preview & Templates**

- ✅ Material preview shows correct inclusions/exclusions
- ✅ 10+ templates in library
- ✅ Templates apply correctly
- ✅ BOM configuration time reduced 50%+

### **Phase 3: Analytics**

- ✅ Dashboard shows real-time KPIs
- ✅ Cost trends visualized
- ✅ Yield analysis accurate
- ✅ Reports exportable
- ✅ Performance targets met

### **Phase 4: Optimization**

- ✅ Recommendations generated for all BOMs
- ✅ Substitutions include impact analysis
- ✅ What-if simulator functional
- ✅ Anomaly detection catches 90%+ of issues
- ✅ Measurable cost savings achieved

---

## 📋 Dependencies & Prerequisites

### **Technical Prerequisites:**

- ✅ EPIC-001 complete (BOM Complexity)
- ✅ EPIC-002 complete (Scanner & Warehouse)
- ⏳ Supabase resumed and stable
- ⏳ Migration 055 applied (performance indexes)
- ⏳ Integration testing complete

### **Business Prerequisites:**

- Material cost data available (can start with estimates)
- Product sell prices defined
- 3-6 months historical production data (for ML models)
- Management buy-in for cost tracking

### **Data Requirements:**

- Material costs (manual entry or import)
- Labor rates (for labor cost calculations)
- Overhead allocation methodology
- Product pricing data

---

## 🚧 Risks & Mitigation

### **Risk 1: Insufficient Historical Data**

**Impact:** ML models in Phase 4 may be inaccurate
**Mitigation:**

- Phases 1-3 don't require ML
- Start data collection immediately
- Use rule-based recommendations until enough data

### **Risk 2: Cost Data Entry Overhead**

**Impact:** Users don't maintain cost data
**Mitigation:**

- Import from existing systems (ERP, procurement)
- Bulk upload via Excel
- Automatic cost updates from invoices (future enhancement)

### **Risk 3: ML Model Complexity**

**Impact:** Phase 4 may take longer than estimated
**Mitigation:**

- Start with simple models (linear regression)
- Use pre-trained models where possible
- Consider external ML API (OpenAI, etc.)

### **Risk 4: Performance with Large Datasets**

**Impact:** Analytics queries slow on 1000+ BOMs
**Mitigation:**

- Database views for common queries
- Materialized views for expensive calculations
- Caching strategy for dashboard
- Already have 55+ indexes from migration 055

---

## 🎓 Key Design Decisions

### **1. Cost Storage Strategy**

**Decision:** Store cost snapshots at point-in-time
**Rationale:** Need historical accuracy for reporting and analysis
**Alternative:** Only store current costs (loses history)

### **2. ML Technology Choice**

**Decision:** TensorFlow.js for client-side predictions
**Rationale:** No backend ML infrastructure needed, instant predictions
**Alternative:** Backend ML service (more powerful but more complex)

### **3. Analytics Refresh Strategy**

**Decision:** Real-time for KPIs, cached for complex reports
**Rationale:** Balance between freshness and performance
**Alternative:** All real-time (may be slow) or all cached (stale data)

### **4. Template Scope**

**Decision:** Organization-level templates with optional global library
**Rationale:** Balance between reusability and customization
**Alternative:** Only org-specific (less leverage) or only global (less flexibility)

---

## 📅 Recommended Timeline

### **Week 1-2: Phase 1 - Cost Calculation**

- Database schema & migrations
- API implementation
- Basic UI components
- E2E tests

### **Week 3: Phase 2 - Preview & Templates**

- Template system
- Preview component
- Integration with Phase 1
- E2E tests

### **Week 4-5: Phase 3 - Analytics Dashboard**

- Database views
- Analytics API
- Dashboard UI
- Charting components
- E2E tests

### **Week 6-8: Phase 4 - Optimization Engine**

- ML model development
- Optimization API
- Recommendation UI
- What-if simulator
- E2E tests

### **Week 9: Integration Testing & Polish**

- Full epic integration tests
- Performance optimization
- Bug fixes
- Documentation

**Total Duration:** 8-9 weeks (allowing 1 week buffer)

---

## 🔄 Integration with Existing System

### **Integrates with EPIC-001 (BOM Complexity):**

- Cost calculation uses BOM structure
- Multi-version BOMs show cost comparison
- Conditional components affect cost based on flags
- By-products included in cost analysis

### **Integrates with EPIC-002 (Scanner & Warehouse):**

- WO costs use actual LP consumption
- Pallet costs rolled up from LP costs
- Scanner data feeds into yield analysis
- Traceability links cost to specific batches

### **New Capabilities Enabled:**

- Make-vs-buy decisions based on cost
- Dynamic pricing based on current costs
- Cost-driven production planning
- Proactive margin management

---

## 💼 Business Case

### **Problem Statement:**

Currently, MonoPilot tracks production but not costs. Management has:

- No visibility into product costs
- Manual Excel-based cost calculations (4-6 hours/week)
- Reactive pricing (by gut feel)
- No way to optimize costs proactively
- Lost opportunities for savings

### **Solution:**

EPIC-003 provides real-time cost intelligence:

- Automatic cost calculation from materials
- Visual analytics and trends
- AI-powered optimization recommendations
- Proactive cost management

### **ROI Calculation:**

**Year 1 Savings:**

- Cost optimization: $50K-$200K (conservative: $100K)
- Time savings: 15 hrs/week × 52 weeks × $50/hr = $39K
- Better pricing decisions: $20K-$50K (conservative: $30K)
- **Total Year 1 Benefit: $169K**

**Investment:**

- Development: 8 weeks × $8K/week = $64K
- **Net Year 1 ROI: $105K (164% return)**

**Payback Period:** 4-5 months

### **Strategic Value:**

- **Competitive advantage** through better cost management
- **Data-driven culture** vs gut-feel decisions
- **Scalability** as business grows
- **Foundation** for advanced features (AI, predictive analytics)

---

## 🎯 Alternatives Considered

### **Alternative 1: Manual Cost Tracking in Excel**

**Pros:** No development needed
**Cons:** Error-prone, time-consuming, no real-time data, doesn't scale
**Decision:** Not viable long-term

### **Alternative 2: Buy ERP with Cost Module**

**Pros:** Mature, full-featured
**Cons:** $50K-$500K cost, 6-12 month implementation, poor integration
**Decision:** Too expensive and slow

### **Alternative 3: Build Only Basic Cost Tracking**

**Pros:** Faster to implement
**Cons:** Misses optimization opportunities, limited ROI
**Decision:** Doesn't justify development effort

### **Alternative 4: This Epic (Recommended)**

**Pros:** Integrated, AI-powered, high ROI, custom to needs
**Cons:** Requires development time
**Decision:** ✅ **Best value for investment**

---

## 📚 Documentation Plan

### **Technical Docs:**

- Database schema documentation
- API reference (auto-generated)
- Component library (Storybook)
- Cost calculation methodology

### **User Docs:**

- Cost entry guide
- BOM preview tutorial
- Analytics dashboard guide
- Optimization recommendations guide

### **Training Materials:**

- Video tutorials (15 min each)
- Quick reference cards
- FAQ document
- Change management plan

---

## ✅ Readiness Checklist

Before starting EPIC-003:

- ✅ EPIC-001 complete
- ✅ EPIC-002 complete
- ⏳ Supabase resumed and stable
- ⏳ Migration 055 applied
- ⏳ Integration testing complete
- ⏳ Frontend performance optimizations done
- ⏳ Team capacity confirmed (1-2 developers)
- ⏳ Product Owner approval
- ⏳ Initial cost data available

---

## 🎉 Conclusion

**EPIC-003: Production Intelligence & Cost Optimization** transforms MonoPilot from a production execution system into a **production intelligence platform**.

**Key Benefits:**

- 💰 **$169K/year savings** (conservative estimate)
- 📊 **Real-time cost visibility** (currently 0%)
- 🤖 **AI-powered optimization** (15-25% cost reduction)
- ⚡ **90% faster reporting** (10 hrs → 1 hr/week)
- 🎯 **Data-driven decisions** vs gut feel

**Recommended Action:** ✅ **Approve and schedule after integration testing**

---

**Prepared by:** Claude AI Assistant (Sonnet 4.5)
**Date:** November 12, 2025
**Status:** 📋 Ready for Review & Approval
**Next Step:** Product Owner review and planning session
