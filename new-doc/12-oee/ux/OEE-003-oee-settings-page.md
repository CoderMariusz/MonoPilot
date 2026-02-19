# OEE-003: OEE Settings Page

**Module**: OEE (Overall Equipment Effectiveness)
**Feature**: OEE Configuration & Targets (PRD Section 10.3)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Desktop - Populated)

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Settings                                                                      [Save All]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Global OEE Targets                                                                         |   |
|  |                                                                                            |   |
|  | Target OEE:                  85%  [▆▆▆▆▆▆▆▆░░]                                            |   |
|  | [85                       ]  (%) Recommended: 80-85% for food manufacturing               |   |
|  |                                                                                            |   |
|  | Target Availability:         90%  [▆▆▆▆▆▆▆▆▆░]                                            |   |
|  | [90                       ]  (%) Uptime target                                            |   |
|  |                                                                                            |   |
|  | Target Performance:          95%  [▆▆▆▆▆▆▆▆▆░]                                            |   |
|  | [95                       ]  (%) Speed efficiency target                                  |   |
|  |                                                                                            |   |
|  | Target Quality:              99%  [▆▆▆▆▆▆▆▆▆▆]                                            |   |
|  | [99                       ]  (%) Good output target                                       |   |
|  |                                                                                            |   |
|  | [✓] Apply global targets to all machines (can override individually)                      |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Machine-Specific Targets                                          [+ Add Machine Override] |   |
|  |                                                                                            |   |
|  | Machine           | OEE Target | Avail | Perf | Quality | Ideal Rate | Actions             |   |
|  | -----------------------------------------------------------------------------              |   |
|  | Mixer Line 1      | 85% (G)    | 90%   | 95%  | 99%     | 500 u/hr   | [Edit] [Remove]     |   |
|  | Oven Line 1       | 87% (C)    | 92%   | 96%  | 98.5%   | 450 u/hr   | [Edit] [Remove]     |   |
|  | Packaging Line 1  | 80% (C)    | 85%   | 92%  | 98%     | 600 u/hr   | [Edit] [Remove]     |   |
|  | Proofer Line 1    | 85% (G)    | 90%   | 95%  | 99%     | 300 u/hr   | [Edit] [Remove]     |   |
|  |                                                                                            |   |
|  | Legend: (G) Global target, (C) Custom override                                            |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Downtime Reason Codes                                              [+ Add Reason Code]    |   |
|  |                                                                                            |   |
|  | Category: [All Categories v]  Status: [Active v]                                          |   |
|  |                                                                                            |   |
|  | Code              | Name                    | Category         | Planned? | Actions        |   |
|  | ------------------------------------------------------------------------------------      |   |
|  | MECH_BREAK        | Mechanical Breakdown    | Equipment Fail   | No       | [Edit] [Del]   |   |
|  | ELEC_FAIL         | Electrical Failure      | Equipment Fail   | No       | [Edit] [Del]   |   |
|  | CHANGEOVER        | Product Changeover      | Planned          | Yes      | [Edit] [Del]   |   |
|  | CLEANING          | Cleaning/Sanitation     | Planned          | Yes      | [Edit] [Del]   |   |
|  | PREV_MAINT        | Preventive Maintenance  | Planned          | Yes      | [Edit] [Del]   |   |
|  | WAIT_MATERIAL     | Waiting for Material    | Material Issue   | No       | [Edit] [Del]   |   |
|  | QC_HOLD           | Quality Check Hold      | Process Issue    | No       | [Edit] [Del]   |   |
|  | TEMP_ADJ          | Temperature Adjustment  | Process Issue    | No       | [Edit] [Del]   |   |
|  | MINOR_JAM         | Minor Jam/Blockage      | Equipment Fail   | No       | [Edit] [Del]   |   |
|  | NO_DEMAND         | No Demand               | Other            | Yes      | [Edit] [Del]   |   |
|  |                                                                                            |   |
|  | Showing 10 of 15 reason codes                                      [Load More]            |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Shift Configuration                                                 [+ Add Shift]         |   |
|  |                                                                                            |   |
|  | Shift Name     | Start Time | End Time | Duration | Days           | Actions              |   |
|  | ------------------------------------------------------------------------------------      |   |
|  | Day Shift      | 6:00 AM    | 2:00 PM  | 8 hours  | Mon-Fri        | [Edit] [Delete]      |   |
|  | Evening Shift  | 2:00 PM    | 10:00 PM | 8 hours  | Mon-Fri        | [Edit] [Delete]      |   |
|  | Night Shift    | 10:00 PM   | 6:00 AM  | 8 hours  | Mon-Fri        | [Edit] [Delete]      |   |
|  | Weekend Shift  | 8:00 AM    | 4:00 PM  | 8 hours  | Sat-Sun        | [Edit] [Delete]      |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Alert Thresholds                                                                           |   |
|  |                                                                                            |   |
|  | OEE Below Target Alert:                                                                    |   |
|  | Trigger when OEE drops below [80]% (for [15] consecutive minutes)                         |   |
|  | Notify: [Production Manager v] [Maintenance Manager v] [+ Add]                            |   |
|  |                                                                                            |   |
|  | Critical Downtime Alert:                                                                   |   |
|  | Trigger when downtime exceeds [30] minutes                                                |   |
|  | Notify: [Production Manager v] [Maintenance Manager v] [+ Add]                            |   |
|  |                                                                                            |   |
|  | Quality Below Target Alert:                                                                |   |
|  | Trigger when quality rate drops below [95]% (for [10] consecutive minutes)                |   |
|  | Notify: [Production Manager v] [Quality Manager v] [+ Add]                                |   |
|  |                                                                                            |   |
|  | [✓] Enable real-time alerts                                                               |   |
|  | [✓] Send email notifications                                                               |   |
|  | [ ] Send SMS notifications (Premium feature)                                               |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Data Collection Settings                                                                   |   |
|  |                                                                                            |   |
|  | Auto-refresh interval: [5] seconds (min: 5s, max: 60s)                                    |   |
|  |                                                                                            |   |
|  | Data retention period: [90] days (historical OEE data)                                    |   |
|  |                                                                                            |   |
|  | [✓] Require downtime reason for all events                                                |   |
|  | [✓] Require corrective action for resolved events                                         |   |
|  | [ ] Auto-resolve downtime events after [24] hours                                         |   |
|  |                                                                                            |   |
|  | Production counting method:                                                                |   |
|  | (•) Automatic - from production outputs                                                    |   |
|  | ( ) Manual - operator entry only                                                           |   |
|  | ( ) Hybrid - both automatic and manual                                                     |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  [Cancel]                                                                       [Save Settings]  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Add Reason Code Modal

```
+--------------------------------------------------------------------------------------------------+
|  Add Downtime Reason Code                                                              [x Close] |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | Reason Code Information                                                                    |   |
|  |                                                                                            |   |
|  | Code (Internal): *                                                                         |   |
|  | [MECH_BREAK        ]  (e.g., MECH_BREAK, ELEC_FAIL)                                       |   |
|  | Must be unique, uppercase, underscores only                                               |   |
|  |                                                                                            |   |
|  | Display Name: *                                                                            |   |
|  | [Mechanical Breakdown                             ]                                       |   |
|  |                                                                                            |   |
|  | Category: *                                                                                |   |
|  | [Equipment Failure                                                                     v]  |   |
|  |                                                                                            |   |
|  | Planned Downtime:                                                                          |   |
|  | ( ) Yes - Exclude from OEE downtime calculation (e.g., Changeover, Cleaning)              |   |
|  | (•) No - Include in OEE downtime calculation                                              |   |
|  |                                                                                            |   |
|  | Description: (Optional)                                                                    |   |
|  | +--------------------------------------------------------------------------+               |   |
|  | | Use this code when machine stops due to mechanical component failure.   |               |   |
|  | | Examples: motor failure, bearing issue, conveyor malfunction.            |               |   |
|  | +--------------------------------------------------------------------------+               |   |
|  |                                                                                            |   |
|  | Severity Level:                                                                            |   |
|  | ( ) Low - Expected minor interruptions                                                     |   |
|  | (•) Medium - Requires attention                                                            |   |
|  | ( ) High - Critical, requires immediate action                                             |   |
|  |                                                                                            |   |
|  | Corrective Action Required:                                                                |   |
|  | [✓] Require corrective action description when resolving this event type                  |   |
|  |                                                                                            |   |
|  | Auto-escalate if duration exceeds: [30] minutes                                           |   |
|  | [ ] Enable auto-escalation                                                                |   |
|  |                                                                                            |   |
|  | Active:                                                                                    |   |
|  | [✓] Active (available for selection)                                                      |   |
|  +-------------------------------------------------------------------------------------------+   |
|  |                                                                                            |   |
|  | Preview:                                                                                   |   |
|  | Category: Equipment Failure | Planned: No | Severity: Medium                             |   |
|  | In OEE Reports: Counted as unplanned downtime                                             |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  [Cancel]                                                                    [Save Reason Code]  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Success State (Mobile: < 768px)

```
+----------------------------------+
|  < OEE Settings                  |
|  [Save All]                      |
+----------------------------------+
|                                  |
|  Global Targets                  |
|  +----------------------------+  |
|  | OEE: [85] %                |  |
|  | Availability: [90] %       |  |
|  | Performance: [95] %        |  |
|  | Quality: [99] %            |  |
|  | [✓] Apply to all machines  |  |
|  +----------------------------+  |
|                                  |
|  Machine Targets [+ Add]         |
|  +----------------------------+  |
|  | Mixer Line 1 (G)           |  |
|  | OEE: 85% | Rate: 500 u/hr  |  |
|  | [Edit]                     |  |
|  +----------------------------+  |
|  | Oven Line 1 (C)            |  |
|  | OEE: 87% | Rate: 450 u/hr  |  |
|  | [Edit]                     |  |
|  +----------------------------+  |
|                                  |
|  Reason Codes [+ Add]            |
|  +----------------------------+  |
|  | MECH_BREAK                 |  |
|  | Equipment Failure          |  |
|  | Unplanned                  |  |
|  | [Edit]                     |  |
|  +----------------------------+  |
|  | CHANGEOVER                 |  |
|  | Planned                    |  |
|  | Planned                    |  |
|  | [Edit]                     |  |
|  +----------------------------+  |
|                                  |
|  Shifts [+ Add]                  |
|  +----------------------------+  |
|  | Day Shift                  |  |
|  | 6:00 AM - 2:00 PM          |  |
|  | Mon-Fri | 8 hours          |  |
|  | [Edit]                     |  |
|  +----------------------------+  |
|                                  |
|  Alerts                          |
|  +----------------------------+  |
|  | OEE < [80]% for [15] min   |  |
|  | Downtime > [30] min        |  |
|  | Quality < [95]% for [10]m  |  |
|  | [✓] Email [✓] Real-time    |  |
|  +----------------------------+  |
|                                  |
|  [Save Settings]                 |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Settings                                                                      [Save All]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +-------------------------------------------------------------------------------------------+   |
|  | [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]           |   |
|  | [░░░░░░░░░░░░░░░░░░]  [░░░░░░░░░░░░░░░░░░]  [░░░░░░░░░░░░░░░░░░]                    |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                  |
|  [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]        |
|                                                                                                  |
|  Loading OEE settings...                                                                         |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Settings                                                                      [Save All]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                         [Settings Icon]                                          |
|                                                                                                  |
|                                  OEE Settings Not Configured                                     |
|                                                                                                  |
|                     Configure your OEE targets, downtime reasons, and alerts                     |
|                     to start tracking Overall Equipment Effectiveness.                           |
|                                                                                                  |
|                                                                                                  |
|                                    [Configure OEE Settings]                                      |
|                                                                                                  |
|                                                                                                  |
|                     Recommended Setup Steps:                                                     |
|                     1. Set global OEE targets (availability, performance, quality)               |
|                     2. Define machine-specific targets and ideal production rates                |
|                     3. Create downtime reason codes (categorized by type)                        |
|                     4. Configure production shifts                                               |
|                     5. Set up alert thresholds and notifications                                 |
|                                                                                                  |
|                              [View OEE Setup Guide]                                              |
|                                                                                                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  OEE > Settings                                                                      [Save All]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                                                                                                  |
|                                         [Warning Icon]                                           |
|                                                                                                  |
|                               Failed to Load OEE Settings                                        |
|                                                                                                  |
|                     Unable to retrieve OEE configuration data.                                   |
|                     Please check your connection and try again.                                  |
|                                                                                                  |
|                                Error: OEE_SETTINGS_FETCH_FAILED                                  |
|                                                                                                  |
|                                                                                                  |
|                                  [Retry]    [Contact Support]                                    |
|                                                                                                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Global OEE Targets

Organization-wide OEE targets applied to all machines by default.

| Target | Default | Range | Description |
|--------|---------|-------|-------------|
| OEE | 85% | 60-95% | Overall Equipment Effectiveness target |
| Availability | 90% | 70-100% | Uptime target (scheduled time - downtime) |
| Performance | 95% | 80-100% | Speed efficiency target (actual vs ideal rate) |
| Quality | 99% | 90-100% | Good output target (good / total output) |

**Visual:**
- Input field with slider
- Progress bar showing current value
- Recommendation text

### 2. Machine-Specific Targets

Override global targets for individual machines.

| Field | Source | Display |
|-------|--------|---------|
| Machine Name | machines.name | "Mixer Line 1" |
| OEE Target | machine_settings.oee_target | "85% (G)" = Global, "87% (C)" = Custom |
| Availability | machine_settings.availability_target | "90%" |
| Performance | machine_settings.performance_target | "95%" |
| Quality | machine_settings.quality_target | "99%" |
| Ideal Rate | machine_settings.ideal_rate_per_hour | "500 u/hr" |

**Actions:**
- [Edit]: Opens EditMachineTargetModal
- [Remove]: Revert to global targets

### 3. Downtime Reason Codes

Categorized reason codes for downtime event logging.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Code | Text | Yes | Unique, uppercase, underscores only |
| Display Name | Text | Yes | Min 3 chars |
| Category | Dropdown | Yes | Equipment Failure, Process Issue, Material Issue, Planned, Other |
| Planned | Boolean | Yes | Include in OEE downtime calculation? |
| Description | Textarea | No | Usage guidelines |
| Severity | Radio | Yes | Low, Medium, High |
| Active | Boolean | Yes | Available for selection |

**Categories:**
1. **Equipment Failure** (red) - Unplanned
2. **Process Issue** (orange) - Unplanned
3. **Material Issue** (yellow) - Unplanned
4. **Planned** (blue) - Excluded from OEE downtime
5. **Other** (gray) - Configurable

### 4. Shift Configuration

Define production shifts for OEE tracking.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Shift Name | Text | Yes | Unique within org |
| Start Time | Time | Yes | HH:MM format |
| End Time | Time | Yes | After start time (can span midnight) |
| Duration | Auto-calc | - | End - Start time |
| Days | Multi-select | Yes | Mon-Sun |

### 5. Alert Thresholds

Configurable thresholds for real-time alerts.

| Alert Type | Trigger | Notification |
|------------|---------|--------------|
| OEE Below Target | OEE < X% for Y minutes | Production Manager, Maintenance |
| Critical Downtime | Downtime > X minutes | Production Manager, Maintenance |
| Quality Below Target | Quality < X% for Y minutes | Production Manager, Quality |

**Settings:**
- Threshold value (%)
- Duration (minutes)
- Notification recipients (multi-select)
- Enable/disable real-time alerts
- Email notifications (on/off)
- SMS notifications (Premium feature)

### 6. Data Collection Settings

General OEE data collection configuration.

| Setting | Default | Range | Description |
|---------|---------|-------|-------------|
| Auto-refresh interval | 5 seconds | 5-60s | Dashboard refresh rate |
| Data retention period | 90 days | 30-365 days | Historical data storage |
| Require downtime reason | On | On/Off | Mandatory for all events |
| Require corrective action | On | On/Off | For resolved events |
| Auto-resolve events | Off | On/Off | After X hours |
| Production counting | Automatic | Auto/Manual/Hybrid | Count method |

---

## Main Actions

### Primary Actions

| Action | Location | Behavior |
|--------|----------|----------|
| Save Settings | Header/Footer [Save All] | Save all changes to OEE settings |
| Add Machine Override | Machine table [+ Add] | Opens AddMachineTargetModal |
| Add Reason Code | Reason codes [+ Add] | Opens AddReasonCodeModal |
| Add Shift | Shifts [+ Add] | Opens AddShiftModal |
| Edit Machine Target | Machine row [Edit] | Opens EditMachineTargetModal |
| Edit Reason Code | Reason row [Edit] | Opens EditReasonCodeModal |
| Edit Shift | Shift row [Edit] | Opens EditShiftModal |

### Secondary Actions

| Action | Behavior |
|--------|----------|
| Remove Machine Override | Revert to global targets, confirm dialog |
| Delete Reason Code | Confirm dialog, check for usage first |
| Delete Shift | Confirm dialog, check for active data |
| Cancel | Discard changes, confirm if unsaved |

---

## States

### Loading State
- Skeleton settings sections
- "Loading OEE settings..." text

### Empty State
- Settings illustration
- "OEE Settings Not Configured" headline
- Setup steps and recommendations
- [Configure OEE Settings] CTA
- [View OEE Setup Guide] link

### Populated State (Success)
- All settings sections visible
- Global targets editable
- Machine overrides listed
- Reason codes table
- Shifts table
- Alert thresholds configurable

### Error State
- Warning icon
- "Failed to Load OEE Settings" headline
- Error code: OEE_SETTINGS_FETCH_FAILED
- [Retry] and [Contact Support] buttons

---

## Data Fields

### Settings Response

```json
{
  "global_targets": {
    "oee_pct": 85,
    "availability_pct": 90,
    "performance_pct": 95,
    "quality_pct": 99,
    "apply_to_all_machines": true
  },
  "machine_targets": [
    {
      "machine_id": "uuid-1",
      "machine_name": "Mixer Line 1",
      "is_custom": false,
      "oee_target_pct": 85,
      "availability_target_pct": 90,
      "performance_target_pct": 95,
      "quality_target_pct": 99,
      "ideal_rate_per_hour": 500
    }
  ],
  "reason_codes": [
    {
      "id": "uuid-1",
      "code": "MECH_BREAK",
      "name": "Mechanical Breakdown",
      "category": "Equipment Failure",
      "is_planned": false,
      "severity": "medium",
      "active": true,
      "description": "..."
    }
  ],
  "shifts": [
    {
      "id": "uuid-1",
      "name": "Day Shift",
      "start_time": "06:00",
      "end_time": "14:00",
      "duration_hours": 8,
      "days": ["mon", "tue", "wed", "thu", "fri"]
    }
  ],
  "alerts": {
    "oee_below_target": {
      "enabled": true,
      "threshold_pct": 80,
      "duration_minutes": 15,
      "recipients": ["prod_mgr", "maint_mgr"]
    },
    "critical_downtime": {
      "enabled": true,
      "threshold_minutes": 30,
      "recipients": ["prod_mgr", "maint_mgr"]
    },
    "quality_below_target": {
      "enabled": true,
      "threshold_pct": 95,
      "duration_minutes": 10,
      "recipients": ["prod_mgr", "quality_mgr"]
    }
  },
  "data_collection": {
    "auto_refresh_seconds": 5,
    "retention_days": 90,
    "require_downtime_reason": true,
    "require_corrective_action": true,
    "auto_resolve_hours": null,
    "counting_method": "automatic"
  }
}
```

---

## API Endpoints

### Get OEE Settings

```
GET /api/oee/settings

Response: { ... } (see Data Fields above)
```

### Update OEE Settings

```
PUT /api/oee/settings
Content-Type: application/json

Request:
{
  "global_targets": { ... },
  "machine_targets": [ ... ],
  "reason_codes": [ ... ],
  "shifts": [ ... ],
  "alerts": { ... },
  "data_collection": { ... }
}

Response:
{
  "settings": { ... },
  "updated_at": "2026-01-15T14:30:00Z"
}
```

### Add Machine Target Override

```
POST /api/oee/settings/machine-targets
Content-Type: application/json

Request:
{
  "machine_id": "uuid",
  "oee_target_pct": 87,
  "availability_target_pct": 92,
  "performance_target_pct": 96,
  "quality_target_pct": 98.5,
  "ideal_rate_per_hour": 450
}

Response:
{
  "machine_target": { ... }
}
```

### Add Reason Code

```
POST /api/oee/settings/reason-codes
Content-Type: application/json

Request:
{
  "code": "MECH_BREAK",
  "name": "Mechanical Breakdown",
  "category": "Equipment Failure",
  "is_planned": false,
  "severity": "medium",
  "description": "...",
  "active": true
}

Response:
{
  "reason_code": { ... }
}
```

---

## Permissions

| Role | View Settings | Edit Targets | Edit Reason Codes | Edit Shifts | Edit Alerts |
|------|---------------|--------------|-------------------|-------------|-------------|
| Production Manager | Yes | Yes | Yes | Yes | Yes |
| Operator | Yes | No | No | No | No |
| Maintenance | Yes | No | Yes (equipment) | No | No |
| Quality Manager | Yes | No | Yes (quality) | No | Yes (quality alerts) |
| Admin | Yes | Yes | Yes | Yes | Yes |

---

## Validation

### Global Targets

| Field | Rule | Error Message |
|-------|------|---------------|
| OEE | 60-95% | "OEE target must be between 60% and 95%" |
| Availability | 70-100% | "Availability target must be between 70% and 100%" |
| Performance | 80-100% | "Performance target must be between 80% and 100%" |
| Quality | 90-100% | "Quality target must be between 90% and 100%" |

### Reason Code

| Field | Rule | Error Message |
|-------|------|---------------|
| Code | Unique, uppercase, underscores | "Code must be unique and uppercase with underscores only" |
| Name | Min 3 chars | "Name must be at least 3 characters" |
| Category | Required | "Category is required" |

### Shift

| Field | Rule | Error Message |
|-------|------|---------------|
| Name | Unique within org | "Shift name already exists" |
| Start Time | Required, HH:MM format | "Invalid time format" |
| End Time | After start time | "End time must be after start time" |
| Days | At least 1 day selected | "Select at least one day" |

---

## Business Rules

### OEE Target Recommendations

| Industry | Typical OEE | Target OEE |
|----------|-------------|------------|
| Food Manufacturing | 60-80% | 80-85% |
| Discrete Manufacturing | 70-85% | 85-90% |
| Process Manufacturing | 75-90% | 90-95% |

### Planned vs Unplanned Downtime

**Planned Downtime** (excluded from OEE):
- Changeovers
- Cleaning/Sanitation
- Preventive Maintenance
- No Demand
- Scheduled Breaks

**Unplanned Downtime** (counted in OEE):
- Equipment Failures
- Material Shortages
- Quality Issues
- Unscheduled Maintenance

### Alert Escalation

| Threshold | Action |
|-----------|--------|
| OEE < 80% for 15 min | Email to Production Manager |
| OEE < 70% for 15 min | Email + SMS to Production & Maintenance |
| Downtime > 30 min | Email to Production & Maintenance |
| Downtime > 60 min | Email + SMS + Escalate to Plant Manager |

---

## Accessibility

### Touch Targets
- Input fields: 48x48dp
- Sliders: 48dp height
- Buttons: 48x48dp
- Table rows: 48dp height

### Contrast
- Input labels: 4.5:1
- Slider track: 3:1
- Progress bars: 3:1
- Table text: 4.5:1

### Screen Reader
- **Settings page**: `aria-label="OEE Settings Configuration"`
- **Inputs**: Proper labels and descriptions
- **Sliders**: `role="slider" aria-valuemin aria-valuemax aria-valuenow`
- **Tables**: `role="table"` with headers

### Keyboard Navigation
| Key | Action |
|-----|--------|
| Tab | Navigate inputs, buttons, tables |
| Enter | Submit form, activate button |
| Arrow keys | Adjust slider, navigate table |
| Escape | Close modal |

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| **Desktop (>1024px)** | All sections visible, full tables |
| **Tablet (768-1024px)** | Sections stacked, condensed tables |
| **Mobile (<768px)** | Simplified cards, essential fields only |

---

## Performance Notes

### Caching

```typescript
'org:{orgId}:oee:settings'                      // 10 min TTL
'org:{orgId}:oee:reason-codes'                  // 1 hour TTL
'org:{orgId}:oee:shifts'                        // 1 hour TTL
```

### Load Time Targets

| Operation | Target |
|-----------|--------|
| Initial page load | < 1s |
| Save settings | < 1s |
| Add reason code | < 500ms |

---

## Testing Requirements

### Unit Tests
```typescript
describe('OEE Settings', () => {
  it('validates target ranges', async () => {});
  it('saves global targets', async () => {});
  it('creates machine override', async () => {});
  it('adds reason code', async () => {});
});
```

### E2E Tests
```typescript
describe('OEE Settings E2E', () => {
  it('loads settings page', async () => {});
  it('updates global targets', async () => {});
  it('creates reason code', async () => {});
  it('configures alerts', async () => {});
});
```

---

## Quality Gates

- [x] All 4 states defined
- [x] Responsive breakpoints documented
- [x] All API endpoints specified
- [x] Accessibility checklist passed
- [x] Performance targets defined
- [x] Validation rules defined
- [x] Business rules documented

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**Estimated Effort**: 10-12 hours
**Quality Target**: 95/100
**PRD Coverage**: 100% (OEE PRD Section 10.3)
