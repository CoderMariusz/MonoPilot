# OEE-005: Energy Consumption Dashboard

**Module**: OEE (Overall Equipment Effectiveness)
**Feature**: Energy Monitoring & Cost Tracking (PRD Section 10.5)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop - Energy Dashboard)

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Energy Dashboard                  Period: [Today v]  View: [All Machines v]  [Export]    |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Energy Overview                                                  Last Updated: 2 mins ago  |   |
|  |                                                                                            |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  |  | Total Consumption  |  | Peak Demand        |  | Energy Cost        |  | Efficiency    | |   |
|  |  | 1,247 kWh          |  | 185 kW             |  | $124.70            |  | 82%           | |   |
|  |  | Today (6AM-2PM)    |  | at 11:30 AM        |  | @ $0.10/kWh        |  | ▆▆▆▆▆▆▆▆░░    | |   |
|  |  | ▲ +8.5% vs avg     |  | ▲ +12% vs avg      |  | ▲ +8.5% vs budget  |  | Target: 85%   | |   |
|  |  +--------------------+  +--------------------+  +--------------------+  +---------------+ |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Real-Time Power Consumption                                                [Refresh]      |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | kW                                                                                         |   |
|  | 200 |                                                                                      |   |
|  | 180 |                     ●─────●─────●                                                   |   |
|  | 160 |              ●─────╱                 ╲                                             |   |
|  | 140 |         ●───╱                          ╲                                            |   |
|  | 120 |    ●───╱                                 ╲─────●                                     |   |
|  | 100 |   ╱                                            ╲─────●                              |   |
|  |  80 | ●                                                      ╲─────●                       |   |
|  |  60 +─────+─────+─────+─────+─────+─────+─────+─────+─────+─────+─────+─────+────>        |   |
|  |     6AM   7AM   8AM   9AM   10AM  11AM  12PM  1PM   2PM   3PM   4PM   5PM   6PM            |   |
|  |                                                                                            |   |
|  | Current: 165 kW  |  Peak Today: 185 kW (11:30 AM)  |  Average: 148 kW                    |   |
|  |                                                                                            |   |
|  | Legend: ● Real-time power  ----- Peak demand threshold (200 kW)                          |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Machine Energy Consumption                                        [Sort: Consumption v]   |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  | Machine           | Status  | Power (kW) | Energy (kWh) | Cost ($) | Efficiency | Actions  |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Oven Line 1       | 🟢 Run  | 45.2       | 362.4        | $36.24   | 88% ▆▆▆▆▆▆▆▆▆░ | [📊] |   |
|  |                   |         | ████████░░ High         |          | Above Target   |      |   |
|  |                   |         | Trend: ▲ +5% vs yesterday          |                 |      |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Packaging Line 1  | 🟢 Run  | 38.5       | 308.0        | $30.80   | 85% ▆▆▆▆▆▆▆▆░░ | [📊] |   |
|  |                   |         | ███████░░░ Medium       |          | On Target      |      |   |
|  |                   |         | Trend: ▼ -2% vs yesterday          |                 |      |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Mixer Line 1      | 🟢 Run  | 32.8       | 262.4        | $26.24   | 82% ▆▆▆▆▆▆▆▆░░ | [📊] |   |
|  |                   |         | ██████░░░░ Medium       |          | Below Target   |      |   |
|  |                   |         | Trend: ▲ +3% vs yesterday          |                 |      |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Proofer Line 1    | 🟢 Run  | 28.4       | 227.2        | $22.72   | 80% ▆▆▆▆▆▆▆▆░░ | [📊] |   |
|  |                   |         | ██████░░░░ Medium       |          | Below Target   |      |   |
|  |                   |         | Trend: ─ 0% vs yesterday           |                 |      |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Cooling Conveyor  | 🟢 Run  | 15.6       | 124.8        | $12.48   | 78% ▆▆▆▆▆▆▆░░░ | [📊] |   |
|  |                   |         | ███░░░░░░░ Low          |          | Below Target   |      |   |
|  |                   |         | Trend: ▼ -8% vs yesterday          |                 |      |   |
|  | ---------------------------------------------------------------------------------          |   |
|  | Slicer Line 1     | 🔴 Down | 0.0        | 0.0          | $0.00    | N/A            | [📊] |   |
|  |                   |         | Down for 2h 15m         |          |                |      |   |
|  |                   |         | Last energy: 22.4 kW               |                 |      |   |
|  |                                                                                            |   |
|  | Totals:                     | 160.5 kW   | 1,284.8 kWh  | $128.48  | Avg: 82%       |      |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Energy Consumption by Period                                                               |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | kWh                                                                                        |   |
|  | 300 |                                                                                      |   |
|  | 250 |     ▄▄▄                                      ▄▄▄                                     |   |
|  | 200 |     ███                ▄▄▄                   ███                                     |   |
|  | 150 |     ███     ▄▄▄        ███        ▄▄▄        ███        ▄▄▄                          |   |
|  | 100 |     ███     ███        ███        ███        ███        ███                          |   |
|  |  50 |     ███     ███        ███        ███        ███        ███                          |   |
|  |   0 +─────────────────────────────────────────────────────────────────>                   |   |
|  |     6-7AM  7-8AM  8-9AM  9-10AM  10-11AM 11-12PM 12-1PM  1-2PM                            |   |
|  |                                                                                            |   |
|  | Peak Period: 11AM-12PM (284 kWh)  |  Low Period: 7-8AM (142 kWh)                         |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Energy Cost Analysis                                                                       |   |
|  |                                                                                            |   |
|  | Rate Structure: Time-of-Use (TOU) Pricing                                                 |   |
|  |                                                                                            |   |
|  | Peak Hours (11AM-5PM):      $0.15/kWh  |  Usage: 542 kWh  |  Cost: $81.30 (65%)          |   |
|  | Off-Peak (5PM-11AM):        $0.08/kWh  |  Usage: 542 kWh  |  Cost: $43.36 (35%)          |   |
|  | Super Off-Peak (11PM-5AM):  $0.05/kWh  |  Usage: 0 kWh    |  Cost: $0.00 (0%)            |   |
|  |                                                                                            |   |
|  | Daily Budget: $130.00  |  Actual: $124.66  |  Variance: -$5.34 (4% under budget) ✓        |   |
|  |                                                                                            |   |
|  | Projected Monthly Cost: $3,610.20 (based on current usage)                                |   |
|  | Monthly Budget: $3,900.00  |  Variance: -$289.80 (7% under budget)                       |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Energy Efficiency Opportunities                                                            |   |
|  |                                                                                            |   |
|  | 💡 Recommendations:                                                                        |   |
|  | 1. Shift 15% of production to off-peak hours → Save ~$12/day (~$360/month)                |   |
|  | 2. Oven Line 1 consuming 5% above baseline → Check insulation, save ~$50/month            |   |
|  | 3. Cooling Conveyor efficiency 78% → Maintenance check, potential 8% energy reduction     |   |
|  |                                                                                            |   |
|  | [View Detailed Analysis] [Schedule Energy Audit] [Set Alerts]                             |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  [Export CSV] [Export PDF] [Email Report] [Configure Alerts]                  [Refresh Dashboard] |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Machine Energy Detail Modal

```
+--------------------------------------------------------------------------------------------------+
|  Energy Detail: Oven Line 1                                                            [x Close] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Current Status                                                  Last Updated: 30 sec ago   |   |
|  |                                                                                            |   |
|  | Status: 🟢 Running  |  Current Power: 45.2 kW  |  Efficiency: 88%                         |   |
|  | Work Order: WO-2026-00138 (Premium Burger)                                                |   |
|  | Running Time: 4h 42m  |  Energy Consumed: 362.4 kWh  |  Cost: $36.24                      |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Power Consumption (Today)                                                                  |   |
|  |                                                                                            |   |
|  | kW                                                                                         |   |
|  |  50 |                                                                                      |   |
|  |  45 |         ●─────●─────●─────●─────●─────●                                             |   |
|  |  40 |    ●───╱                                ╲                                            |   |
|  |  35 |   ╱                                      ╲─────●                                     |   |
|  |  30 | ●                                              ╲─────●                              |   |
|  |  25 +─────+─────+─────+─────+─────+─────+─────+─────+─────+─────+─────+─────+────>        |   |
|  |     6AM   7AM   8AM   9AM   10AM  11AM  12PM  1PM   2PM   3PM   4PM   5PM   6PM            |   |
|  |                                                                                            |   |
|  | Current: 45.2 kW  |  Peak: 48.5 kW (11:15 AM)  |  Average: 42.8 kW                        |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Energy Metrics                                                                             |   |
|  |                                                                                            |   |
|  | Total Energy: 362.4 kWh  |  Cost: $36.24  |  kWh per Unit: 0.152 kWh/unit                 |   |
|  |                                                                                            |   |
|  | Efficiency: 88% (Above Target 85%)                                                        |   |
|  | Specific Energy Consumption (SEC): 0.152 kWh/unit (Target: 0.160 kWh/unit) ✓              |   |
|  |                                                                                            |   |
|  | Comparison:                                                                                |   |
|  | Yesterday: 345.2 kWh (-4.7%) | Last Week Avg: 352.8 kWh (-2.7%) | Baseline: 340 kWh (+6.6%)|   |
|  |                                                                                            |   |
|  | Peak Demand:                                                                               |   |
|  | Today: 48.5 kW | Avg: 46.2 kW (+5%)                                                       |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Hourly Breakdown                                                                           |   |
|  |                                                                                            |   |
|  | Hour      | Power (kW) | Energy (kWh) | Cost ($) | Rate     | Efficiency                  |   |
|  | ----------------------------------------------------------------------------------         |   |
|  | 6-7 AM    | 38.5       | 38.5         | $3.08    | Off-Peak | 85%                         |   |
|  | 7-8 AM    | 42.0       | 42.0         | $3.36    | Off-Peak | 86%                         |   |
|  | 8-9 AM    | 45.2       | 45.2         | $3.62    | Off-Peak | 88%                         |   |
|  | 9-10 AM   | 46.8       | 46.8         | $3.74    | Off-Peak | 89%                         |   |
|  | 10-11 AM  | 47.5       | 47.5         | $3.80    | Off-Peak | 90%                         |   |
|  | 11-12 PM  | 48.5       | 48.5         | $7.28    | Peak     | 91%                         |   |
|  | 12-1 PM   | 46.2       | 46.2         | $6.93    | Peak     | 88%                         |   |
|  | 1-2 PM    | 47.7       | 47.7         | $7.16    | Peak     | 89%                         |   |
|  |                                                                                            |   |
|  | Total: 362.4 kWh | Cost: $36.24 | Avg Efficiency: 88%                                    |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Alerts & Recommendations                                                                   |   |
|  |                                                                                            |   |
|  | ⚠️ Consumption 6.6% above baseline                                                         |   |
|  |    Recommendation: Check oven insulation and door seals                                   |   |
|  |    Potential Savings: ~$50/month                                                          |   |
|  |                                                                                            |   |
|  | 💡 Peak demand during high-rate period (11AM-2PM)                                          |   |
|  |    Recommendation: Consider shifting production to off-peak hours                         |   |
|  |    Potential Savings: ~$120/month                                                         |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  [Export Data] [Schedule Maintenance] [Set Alert]                                    [Close]     |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Success State (Mobile: < 768px)

```
+----------------------------------+
|  < Energy Dashboard              |
|  [Today v] [All v]               |
+----------------------------------+
|                                  |
|  Overview                        |
|  +----------------------------+  |
|  | Consumption: 1,247 kWh     |  |
|  | Peak: 185 kW (11:30 AM)    |  |
|  | Cost: $124.70              |  |
|  | Efficiency: 82%            |  |
|  +----------------------------+  |
|                                  |
|  Real-Time: 165 kW               |
|  [Chart Preview]                 |
|  Current | Peak | Average         |
|  165 kW  | 185  | 148             |
|                                  |
|  Machines (6)                    |
|  +----------------------------+  |
|  | Oven Line 1        [🟢]    |  |
|  | 45.2 kW | 362.4 kWh        |  |
|  | Cost: $36.24 | Eff: 88%    |  |
|  | [View]                     |  |
|  +----------------------------+  |
|  | Packaging Line 1   [🟢]    |  |
|  | 38.5 kW | 308.0 kWh        |  |
|  | Cost: $30.80 | Eff: 85%    |  |
|  | [View]                     |  |
|  +----------------------------+  |
|  | [View All (6)]             |  |
|                                  |
|  Cost Analysis                   |
|  +----------------------------+  |
|  | Peak: $81.30 (65%)         |  |
|  | Off-Peak: $43.36 (35%)     |  |
|  | Budget: $130 | -$5.34 ✓    |  |
|  +----------------------------+  |
|                                  |
|  Recommendations                 |
|  +----------------------------+  |
|  | 💡 Shift production        |  |
|  | Save ~$12/day              |  |
|  +----------------------------+  |
|                                  |
|  [Export] [Alerts] [Refresh]     |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Energy Dashboard                  Period: [Today v]  View: [All Machines v]  [Export]    |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]           |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]        |
|                                                                                                  |
|  Loading energy data...                                                                          |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Energy Dashboard                  Period: [Today v]  View: [All Machines v]  [Export]    |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                         [Energy Icon]                                            |
|                                                                                                  |
|                                  Energy Monitoring Not Configured                                |
|                                                                                                  |
|                     Energy monitoring is not set up for your production lines.                   |
|                     Configure energy meters and sensors to start tracking.                       |
|                                                                                                  |
|                                                                                                  |
|                                    [Configure Energy Monitoring]                                 |
|                                                                                                  |
|                                                                                                  |
|                     Setup Requirements:                                                          |
|                     1. Connect energy meters to production machines                              |
|                     2. Configure energy rate structure (peak/off-peak)                           |
|                     3. Set baseline consumption and efficiency targets                           |
|                     4. Enable real-time monitoring                                               |
|                                                                                                  |
|                              [View Setup Guide]                                                  |
|                                                                                                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Energy Dashboard                  Period: [Today v]  View: [All Machines v]  [Export]    |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                         [Warning Icon]                                           |
|                                                                                                  |
|                               Failed to Load Energy Data                                         |
|                                                                                                  |
|                     Unable to retrieve energy consumption data.                                  |
|                     Please check your connection and try again.                                  |
|                                                                                                  |
|                                Error: ENERGY_DASHBOARD_FETCH_FAILED                              |
|                                                                                                  |
|                                                                                                  |
|                                  [Retry]    [Contact Support]                                    |
|                                                                                                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Energy Overview Metrics

Plant-level energy summary.

| Metric | Calculation | Display |
|--------|-------------|---------|
| Total Consumption | SUM(machine kWh) | "1,247 kWh" |
| Peak Demand | MAX(machine kW) | "185 kW at 11:30 AM" |
| Energy Cost | SUM(kWh × rate) | "$124.70" |
| Efficiency | AVG(machine efficiency) | "82%" |
| Trend | Compare to average | ▲ +8.5% vs avg |

### 2. Real-Time Power Consumption Chart

Line chart showing real-time plant power usage.

**Chart Elements:**
- X-axis: Time (shift hours)
- Y-axis: Power (kW)
- Line: Real-time power consumption
- Threshold line: Peak demand limit
- Current/Peak/Average annotations

### 3. Machine Energy Table

Individual machine energy consumption.

| Column | Source | Display |
|--------|--------|---------|
| Machine Name | machines.name | "Oven Line 1" |
| Status | real_time_status | 🟢 Running / 🔴 Down |
| Power (kW) | Current power | "45.2" with bar chart |
| Energy (kWh) | Total consumed | "362.4" |
| Cost ($) | kWh × rate | "$36.24" |
| Efficiency | Calculated | "88%" with progress bar |
| Trend | vs yesterday | ▲ +5% / ▼ -2% / ─ 0% |

**Power Level Indicators:**
- High: >40 kW (red bar)
- Medium: 20-40 kW (orange bar)
- Low: <20 kW (green bar)

### 4. Energy Consumption by Period

Bar chart showing hourly energy usage.

**Chart Elements:**
- X-axis: Hour intervals
- Y-axis: Energy (kWh)
- Bars: Hourly consumption
- Peak/Low period labels

### 5. Energy Cost Analysis

Cost breakdown by rate structure.

| Period | Rate | Usage (kWh) | Cost ($) | % of Total |
|--------|------|-------------|----------|------------|
| Peak Hours (11AM-5PM) | $0.15/kWh | 542 | $81.30 | 65% |
| Off-Peak (5PM-11AM) | $0.08/kWh | 542 | $43.36 | 35% |
| Super Off-Peak (11PM-5AM) | $0.05/kWh | 0 | $0.00 | 0% |

**Budget Tracking:**
- Daily Budget vs Actual
- Monthly Projection
- Variance analysis

### 6. Energy Efficiency Opportunities

AI-driven recommendations for energy savings.

**Recommendation Format:**
- Issue description
- Root cause
- Action item
- Potential savings ($/month)

---

## Main Actions

### Primary Actions

| Action | Location | Behavior |
|--------|----------|----------|
| Refresh Dashboard | Header [Refresh] | Reload all energy data |
| Export CSV | Footer [Export CSV] | Download machine energy data |
| Export PDF | Footer [Export PDF] | Generate energy report PDF |
| Email Report | Footer [Email Report] | Email energy report |
| Configure Alerts | Footer [Configure Alerts] | Set energy alert thresholds |
| View Machine Detail | Table [📊] | Opens MachineEnergyDetailModal |

### Machine Actions

| Action | Behavior |
|--------|----------|
| View Details | Opens MachineEnergyDetailModal |
| Schedule Maintenance | Creates maintenance task |
| Set Alert | Configure energy alert for machine |

---

## States

### Loading State
- Skeleton overview metrics
- Skeleton chart
- Skeleton table
- "Loading energy data..." text

### Empty State
- Energy illustration
- "Energy Monitoring Not Configured" headline
- Setup requirements and steps
- [Configure Energy Monitoring] CTA
- [View Setup Guide] link

### Populated State (Success)
- Overview metrics visible
- Real-time chart updating
- Machine table populated
- Cost analysis visible
- Recommendations displayed

### Error State
- Warning icon
- "Failed to Load Energy Data" headline
- Error code: ENERGY_DASHBOARD_FETCH_FAILED
- [Retry] and [Contact Support] buttons

---

## Data Fields

### Energy Dashboard Response

```json
{
  "overview": {
    "total_consumption_kwh": 1247,
    "peak_demand_kw": 185,
    "peak_demand_time": "2026-01-15T11:30:00Z",
    "total_cost": 124.70,
    "avg_efficiency_pct": 82,
    "trend_pct": 8.5,
    "trend_direction": "up"
  },
  "realtime_power": {
    "current_kw": 165,
    "peak_kw": 185,
    "average_kw": 148,
    "hourly_data": [
      { "hour": "06:00", "power_kw": 95 },
      { "hour": "07:00", "power_kw": 120 }
    ]
  },
  "machines": [
    {
      "machine_id": "uuid-1",
      "machine_name": "Oven Line 1",
      "status": "running",
      "current_power_kw": 45.2,
      "energy_consumed_kwh": 362.4,
      "cost": 36.24,
      "efficiency_pct": 88,
      "trend_pct": 5,
      "trend_direction": "up",
      "power_level": "high"
    }
  ],
  "cost_analysis": {
    "peak_hours": {
      "rate_per_kwh": 0.15,
      "usage_kwh": 542,
      "cost": 81.30,
      "pct_of_total": 65
    },
    "off_peak": {
      "rate_per_kwh": 0.08,
      "usage_kwh": 542,
      "cost": 43.36,
      "pct_of_total": 35
    },
    "daily_budget": 130.00,
    "actual_cost": 124.66,
    "variance": -5.34,
    "monthly_projection": 3610.20,
    "monthly_budget": 3900.00
  },
  "recommendations": [
    {
      "type": "load_shift",
      "description": "Shift 15% of production to off-peak hours",
      "savings_per_day": 12,
      "savings_per_month": 360
    }
  ]
}
```

---

## API Endpoints

### Get Energy Dashboard

```
GET /api/oee/energy/dashboard
Query: ?period=today&machines=all

Response: { ... } (see Data Fields above)
```

### Get Machine Energy Detail

```
GET /api/oee/energy/machines/:id
Query: ?period=today

Response: { ... }
```

---

## Permissions

| Role | View Dashboard | View Details | Export Data | Configure Alerts |
|------|---------------|--------------|-------------|------------------|
| Production Manager | Yes | Yes | Yes | Yes |
| Energy Manager | Yes | Yes | Yes | Yes |
| Operator | Yes | Yes (assigned) | No | No |
| Admin | Yes | Yes | Yes | Yes |

---

## Validation

### Period Selection

| Rule | Error Message |
|------|---------------|
| Valid period | "Invalid period selected" |
| Date range max 90 days | "Date range cannot exceed 90 days" |

---

## Business Rules

### Energy Efficiency Calculation

```
Efficiency = (Actual Output × Baseline Energy per Unit) / Actual Energy Consumed × 100

Example:
Output: 2,375 units
Baseline: 0.160 kWh/unit
Actual Energy: 362.4 kWh

Efficiency = (2,375 × 0.160) / 362.4 × 100 = 104.8% (capped at 100%)
Or using SEC: 362.4 / 2,375 = 0.152 kWh/unit (vs baseline 0.160) = 95% efficiency
```

### Rate Structure (Time-of-Use)

| Period | Hours | Rate |
|--------|-------|------|
| Peak | 11AM-5PM weekdays | $0.15/kWh |
| Off-Peak | 5PM-11AM weekdays | $0.08/kWh |
| Super Off-Peak | 11PM-5AM weekdays | $0.05/kWh |
| Weekend | All hours Sat-Sun | $0.06/kWh |

---

## Accessibility

### Touch Targets
- Chart elements: 48dp
- Table rows: 48dp height
- Buttons: 48x48dp

### Contrast
- Chart lines: 4.5:1
- Table text: 4.5:1
- Progress bars: 3:1

### Screen Reader
- **Dashboard**: `aria-label="Energy Dashboard, total consumption 1,247 kWh"`
- **Chart**: `aria-label="Real-time power consumption chart"`
- **Table**: `role="table"` with proper headers

### Keyboard Navigation
| Key | Action |
|-----|--------|
| Tab | Navigate table, buttons |
| Enter | View details, export |
| Arrow keys | Navigate chart, table |

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| **Desktop (>1024px)** | Full dashboard, all charts visible |
| **Tablet (768-1024px)** | Condensed table, scrollable charts |
| **Mobile (<768px)** | Simplified cards, essential data only |

---

## Performance Notes

### Caching

```typescript
'org:{orgId}:oee:energy:dashboard:{period}'     // 2 min TTL
'org:{orgId}:oee:energy:machine:{id}:{period}'  // 2 min TTL
'org:{orgId}:oee:energy:rates'                  // 1 hour TTL
```

### Load Time Targets

| Operation | Target |
|-----------|--------|
| Initial dashboard load | < 2s |
| Machine detail load | < 1s |
| Chart refresh | < 500ms |

---

## Testing Requirements

### Unit Tests
```typescript
describe('Energy Dashboard', () => {
  it('calculates total consumption correctly', async () => {});
  it('calculates energy cost with TOU rates', async () => {});
  it('identifies peak demand correctly', async () => {});
});
```

### E2E Tests
```typescript
describe('Energy Dashboard E2E', () => {
  it('loads energy dashboard', async () => {});
  it('opens machine energy detail', async () => {});
  it('exports energy report', async () => {});
});
```

---

## Quality Gates

- [x] All 4 states defined
- [x] Responsive breakpoints documented
- [x] All API endpoints specified
- [x] Accessibility checklist passed
- [x] Performance targets defined
- [x] Energy calculations documented
- [x] TOU rate structure defined

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**Estimated Effort**: 12-14 hours
**Quality Target**: 95/100
**PRD Coverage**: 100% (OEE PRD Section 10.5)
