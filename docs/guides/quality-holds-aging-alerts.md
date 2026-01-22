# Quality Holds Aging Alerts Guide

Aging alerts notify quality teams when holds age beyond acceptable thresholds. Prevents holds from stagnating in "active" status and ensures timely investigation resolution.

## Aging Thresholds

Hold age is calculated from `held_at` timestamp to current time in hours.

### By Priority Level

| Priority | Warning Threshold | Critical Threshold | Hours to Critical | Days to Critical |
|----------|-------------------|--------------------|-------------------|------------------|
| critical | 12 hours | 24 hours | 1 day | 1 day |
| high | 24 hours | 48 hours | 2 days | 2 days |
| medium | 48 hours | 72 hours | 3 days | 3 days |
| low | 120 hours | 168 hours | 7 days | 7 days |

### Status Definitions

| Status | Meaning | Action |
|--------|---------|--------|
| normal | Hold within acceptable age | Monitor routine |
| warning | Hold approaching critical age | Review investigation progress |
| critical | Hold exceeded safe age | Escalate or release immediately |

### Calculation Example

```
Hold created: 2025-12-16 14:30:00 UTC
Current time: 2025-12-17 20:30:00 UTC
Hours elapsed: 30 hours

Priority: high
Thresholds: warning 24h, critical 48h

Status determination:
30 hours > 24 hours (warning) → aging_status = "warning"
30 hours < 48 hours (critical) → not critical yet

Display: "Hold aging: 30 hours (WARNING)"
```

---

## Aging Status Calculation (API Response)

The `aging_status` field is calculated server-side and included in API responses:

**GET /api/quality/holds (list):**

```json
{
  "holds": [
    {
      "id": "hold-001",
      "hold_number": "QH-20251216-0001",
      "priority": "high",
      "held_at": "2025-12-16T14:30:00Z",
      "aging_hours": 30.5,
      "aging_status": "warning"  // Calculated field
    }
  ]
}
```

**GET /api/quality/holds/active (active holds with summary):**

```json
{
  "holds": [
    {
      "hold_number": "QH-20251216-0001",
      "aging_hours": 30.5,
      "aging_status": "warning"
    }
  ],
  "aging_summary": {
    "normal": 12,    // Count of holds with aging_status = normal
    "warning": 5,    // Count of holds with aging_status = warning
    "critical": 2    // Count of holds with aging_status = critical
  }
}
```

---

## UI Display Rules

### In List Table

**Column: Aging Indicator**

```
Status   | Icon              | Color  | Tooltip
─────────┼──────────────────┼────────┼─────────────────────────────
normal   | (none/checkmark)  | Green  | "Hold aging: 12 hours"
warning  | ⚠ AlertCircle     | Yellow | "Hold aging: 52 hours (WARNING)"
critical | ⚠ AlertTriangle   | Red    | "Hold aging: 72 hours (CRITICAL)"
```

**Rendering:**

```tsx
<AgingIndicatorCompact
  agingHours={hold.aging_hours}
  agingStatus={hold.aging_status}
  priority={hold.priority}
/>

// Outputs:
// normal:   ✓ (green, no tooltip)
// warning:  ⚠ (yellow, tooltip on hover)
// critical: ⚠ (red, tooltip on hover)
```

### On Detail Page

**Prominent Display Section:**

```
┌─────────────────────────────────────────┐
│ Hold Aging Information                  │
├─────────────────────────────────────────┤
│                                          │
│ ⚠️ Status: WARNING                       │
│                                          │
│ Hold aging: 52 hours 30 minutes          │
│ Held since: Dec 16, 2:30 PM              │
│ Threshold: 48 hours for High priority    │
│                                          │
│ ⏱️ If not resolved within 24 hours:      │
│   • Status escalates to CRITICAL         │
│   • Manager notified via email           │
│   • Escalation flag added to dashboard   │
│                                          │
└─────────────────────────────────────────┘
```

### On Dashboard

**Stats Card:**

```
┌──────────────────────────┐
│ Aging Critical           │
│                          │
│ 2 holds exceeding limit  │
│ • QH-20251216-0001       │
│ • QH-20251216-0003       │
│                          │
│ [View Critical Holds]    │
└──────────────────────────┘
```

**Aging Summary Card:**

```
┌──────────────────────────┐
│ Hold Aging Summary       │
│                          │
│ ✓ Normal: 12 holds       │
│ ⚠ Warning: 5 holds       │
│ ⚠ Critical: 2 holds      │
│                          │
│ [Review Aging Holds]     │
└──────────────────────────┘
```

---

## Background Aging Alert Job

**Trigger:** Runs every 6 hours via Supabase Edge Function

**Location:** `supabase/functions/quality-hold-aging-alert/index.ts`

**Purpose:** Email notifications for aging holds

**Execution Times:**
- 00:00 UTC
- 06:00 UTC
- 12:00 UTC
- 18:00 UTC

### Job Logic

```typescript
// 1. Query active holds grouped by priority
const holds = await getActiveHolds(orgId);

// 2. Calculate aging status for each
const withAging = holds.map(h => ({
  ...h,
  agingStatus: calculateAgingStatus(h.priority, h.held_at)
}));

// 3. Filter to critical and warning
const critical = withAging.filter(h => h.agingStatus === 'critical');
const warning = withAging.filter(h => h.agingStatus === 'warning');

// 4. If any critical/warning holds exist, send email
if (critical.length > 0 || warning.length > 0) {
  await sendAgingAlertEmail({
    orgId,
    critical,
    warning,
    emailTo: qaManagerEmails
  });
}
```

### Email Template

**Subject:** `Quality Hold Aging Alert: {ORG_NAME}`

**Body:**

```
Attention: Quality Holds Require Review

CRITICAL (Immediate Action Required): {critical_count} holds
───────────────────────────────────────────────────────

{for each critical hold}
• {hold_number}
  Reason: {reason_excerpt}
  Age: {aging_hours} hours
  Priority: {priority}
  Created: {held_at_formatted}
  Held by: {held_by_name}

  → View: {link_to_hold_detail}

WARNING (Review Soon): {warning_count} holds
───────────────────────────────────────────────────────

{for each warning hold}
• {hold_number}
  Reason: {reason_excerpt}
  Age: {aging_hours} hours
  Priority: {priority}

  → View: {link_to_hold_detail}

AGING SUMMARY
─────────────
Total Active Holds: {total_active}
Normal Status: {normal_count}
Warning Status: {warning_count}
Critical Status: {critical_count}

Dashboard: {link_to_quality_dashboard}

---
This is an automated notification from MonoPilot Quality Management.
Configure in Settings > Quality > Aging Alerts.
```

---

## Real-Time Aging Updates (Client-Side)

### Calculation in Frontend

The `aging_hours` field is calculated server-side but can be recalculated client-side if needed:

```typescript
// Service function
export function calculateAgingStatus(
  priority: 'low' | 'medium' | 'high' | 'critical',
  heldAt: Date | string
): 'normal' | 'warning' | 'critical' {
  const heldAtDate = typeof heldAt === 'string' ? new Date(heldAt) : heldAt
  const now = new Date()
  const hoursElapsed = (now.getTime() - heldAtDate.getTime()) / (1000 * 60 * 60)

  const thresholds = {
    critical: { warning: 12, critical: 24 },
    high: { warning: 24, critical: 48 },
    medium: { warning: 48, critical: 72 },
    low: { warning: 120, critical: 168 },
  }

  const threshold = thresholds[priority]

  if (hoursElapsed >= threshold.critical) {
    return 'critical'
  }
  if (hoursElapsed >= threshold.warning) {
    return 'warning'
  }
  return 'normal'
}
```

### Live Update Example

```typescript
// Component that refreshes aging display
export function HoldDetailPage({ holdId }) {
  const [hold, setHold] = useState(null)

  useEffect(() => {
    // Fetch hold initially
    loadHold()

    // Refresh every 5 minutes to recalculate aging
    const interval = setInterval(() => {
      loadHold()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Or: Update aging_hours display in real-time
  useEffect(() => {
    if (!hold?.status === 'active') return

    const timer = setInterval(() => {
      const newAging = calculateAgingStatus(hold.priority, hold.held_at)
      setAgingDisplay(newAging)
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [hold])

  return (
    <AgingIndicatorFull
      agingHours={hold.aging_hours}
      agingStatus={agingDisplay}
      priority={hold.priority}
      heldAt={hold.held_at}
    />
  )
}
```

---

## Workflow: Responding to Aging Alerts

### Scenario: QA Manager Receives Warning Alert

**Email received:** 06:00 UTC

```
WARNING: 1 hold approaching critical age threshold

QH-20251216-0002
Age: 46 hours
Priority: High (threshold 48h)
Reason: Failed metal detection test
Held by: John Smith
```

**QA Manager's actions:**

1. **Click link to hold detail page**
   ```
   URL: /quality/holds/QH-20251216-0002
   ```

2. **Review hold information**
   - See aging indicator showing "46 hours (WARNING)"
   - Read investigation progress in reason field
   - Check items on hold
   - See no release decision made yet

3. **Take action:**
   - If investigation complete: Click [Release Hold], enter disposition
   - If investigation blocked: Escalate to supervisor
   - If investigation ongoing: Add note/comment and close (notify via dashboard)

4. **Resolution:**
   - If released: Hold status changes to "green", email sent to team
   - If escalated: Supervisor follows up separately
   - If investigation ongoing: Hold remains warning status, next alert in 6 hours

### Scenario: QA Manager Receives Critical Alert

**Email received:** 12:00 UTC

```
CRITICAL (IMMEDIATE ACTION REQUIRED): 2 holds exceeding limits

QH-20251216-0001
Age: 28 hours
Priority: Critical (threshold 24h)
Reason: Safety issue detected in production
Held by: Jane Doe
→ Exceeded by 4 hours - ESCALATE IMMEDIATELY

QH-20251216-0003
Age: 76 hours
Priority: High (threshold 48h)
Reason: Failed incoming inspection
Held by: John Smith
→ Exceeded by 28 hours - REVIEW URGENTLY
```

**QA Manager's actions:**

1. **Open Quality > Holds dashboard**
   - See red "CRITICAL" banner showing 2 holds
   - Click [View Critical Holds]

2. **For QH-20251216-0001 (Safety issue):**
   - Contact John Smith (held_by) immediately
   - Assess if hold can be released or needs escalation
   - If cannot be resolved: Escalate to Safety Officer and VP Operations

3. **For QH-20251216-0003 (Stale investigation):**
   - Review why hold wasn't resolved in 72+ hours
   - Was investigation blocked? Who was responsible?
   - Force resolution: Release, rework, or scrap decision
   - Update release_notes with explanation of delay

4. **Post-action:**
   - Both holds resolved or escalated
   - Follow-up email sent to management
   - Dashboard clears critical alerts

---

## Dashboard Displays

### Quality Manager Dashboard

**Section: Aging Holds at a Glance**

```
┌────────────────────────────────────────────────────┐
│ CRITICAL AGING HOLDS                               │
├────────────────────────────────────────────────────┤
│                                                     │
│ ⚠️ 2 holds exceeding critical thresholds            │
│                                                     │
│ ┌──────────────────────────────────────────────┐   │
│ │ QH-20251216-0001 (CRITICAL)                  │   │
│ │ Safety issue - 28 hours (4 hours over limit) │   │
│ │ Priority: Critical | Created: Dec 16 10:30  │   │
│ │ By: Jane Doe                                 │   │
│ │ [Release] [Escalate] [Details]              │   │
│ └──────────────────────────────────────────────┘   │
│                                                     │
│ ┌──────────────────────────────────────────────┐   │
│ │ QH-20251216-0003 (OVERDUE)                   │   │
│ │ Failed inspection - 76 hours (28 over limit) │   │
│ │ Priority: High | Created: Dec 14 22:00      │   │
│ │ By: John Smith                               │   │
│ │ [Release] [Escalate] [Details]              │   │
│ └──────────────────────────────────────────────┘   │
│                                                     │
│ [Acknowledge All] [Email Report]                   │
│                                                     │
└────────────────────────────────────────────────────┘
```

### Holds List with Aging Indicators

```
┌─────────────────┬─────────────┬──────────┬────────┬──────────┐
│ Hold #          │ Status      │ Priority │ Age    │ Alert    │
├─────────────────┼─────────────┼──────────┼────────┼──────────┤
│ QH-20251216-001 │ Active      │ Critical │ 28 h   │ ⚠ RED    │
│ QH-20251216-002 │ Active      │ High     │ 26 h   │ ⚠ YELLOW │
│ QH-20251216-003 │ Released    │ Medium   │ 3 h    │ ✓ -      │
│ QH-20251216-004 │ Active      │ Low      │ 8 h    │ ✓ -      │
└─────────────────┴─────────────┴──────────┴────────┴──────────┘
```

---

## SLA Definitions

Recommended Service Level Agreements for hold resolution:

| Priority | Resolution SLA | Escalation Point | Owner |
|----------|------------------|------------------|-------|
| critical | 24 hours | 12 hours | VP Operations |
| high | 48 hours | 24 hours | Quality Manager |
| medium | 72 hours | 48 hours | Quality Supervisor |
| low | 168 hours (7d) | 120 hours (5d) | Quality Coordinator |

### SLA Violations

When a hold exceeds its escalation point:

1. **Automated alert sent** to escalation owner
2. **Dashboard flags hold** with escalation status
3. **Email includes** why escalation triggered and required actions
4. **Escalation owner** has 4 hours to respond
5. **If no response**, escalation escalates to next level

---

## Configuration (Settings)

**Proposed location:** Settings > Quality > Hold Aging Configuration

**Configurable fields:**

```
[ ] Enable aging alerts
    ☑ Email notifications
    ☑ Dashboard display
    ☑ In-app notifications

Aging thresholds by priority:
    Critical priority:
      Warning: 12 hours    [input]
      Critical: 24 hours   [input]

    High priority:
      Warning: 24 hours    [input]
      Critical: 48 hours   [input]

    Medium priority:
      Warning: 48 hours    [input]
      Critical: 72 hours   [input]

    Low priority:
      Warning: 120 hours   [input]
      Critical: 168 hours  [input]

Alert frequency:
    [dropdown] Every 6 hours (default)
              Every 4 hours
              Every 2 hours
              Hourly
              Every 12 hours
              Daily

Email recipients:
    [+] Add recipient
    ☑ QA Managers (default group)
    ☑ John Smith (john@company.com)
    ☑ Jane Doe (jane@company.com)
    - Remove any

Email settings:
    Subject template: "Quality Hold Aging Alert: {ORG_NAME}"
    Include: ☑ Critical holds
             ☑ Warning holds
             ☑ Dashboard link
             ☑ Direct hold links

[Save Changes]
```

---

## Troubleshooting

### Issue: Not Receiving Aging Emails

**Diagnostic Steps:**

1. Check email delivery settings in Settings > Quality > Hold Aging
2. Verify recipient email addresses are correct
3. Check spam/junk folder
4. Verify at least one active hold exists
5. Check system logs for job execution errors

**Solution:**
- Verify email configuration in Settings
- Test with manual email send if available
- Contact system administrator if emails still not arriving

### Issue: Aging Status Shows Incorrect Value

**Possible Causes:**
- Client-side calculation out of sync with server
- Timezone mismatch between client and server
- Cached data not refreshed

**Solution:**
- Refresh hold detail page to get latest `aging_status` from server
- Clear browser cache if persists
- Verify system time on server is accurate

### Issue: Holds Not Escalating to Critical

**Possible Causes:**
- Aging alert job not running
- Hold threshold settings were modified
- Database time is incorrect

**Solution:**
- Check aging alert job execution in system logs
- Verify threshold settings are correct in Settings > Quality
- Check server time: `SELECT now();` in database
- Manually trigger alert job if available for testing

---

## Metrics & Analytics

### Aging Analytics (for future phases)

Proposed metrics:

1. **Average hold age by priority**
   - Critical: 18 hours (target: <24h)
   - High: 35 hours (target: <48h)
   - Medium: 54 hours (target: <72h)

2. **Holds exceeding SLA**
   - Monthly count and percentage
   - Reasons for delays
   - Departments responsible

3. **Time to resolution by hold type**
   - QA Pending: 8 hours avg
   - Investigation: 32 hours avg
   - Recall: 4 hours avg (immediate action)
   - Quarantine: 24 hours avg

4. **Resolution distribution**
   - Release: 65%
   - Rework: 15%
   - Scrap: 15%
   - Return: 5%

---

## Best Practices

1. **Act on warnings promptly**
   - Don't wait for critical status
   - Warning means within 12-24 hours of critical
   - Use warning as trigger to escalate investigation

2. **Investigate aging delays**
   - If hold exceeds SLA without good reason, investigate why
   - Update process if needed
   - Add preventive measures

3. **Document escalations**
   - When hold escalated, document reason
   - Track who escalated and when
   - Link to follow-up actions

4. **Review trending**
   - Monthly review of hold aging metrics
   - Identify patterns (e.g., investigation holds aging faster)
   - Adjust thresholds if needed

5. **Set realistic thresholds**
   - Don't set thresholds too aggressive (false alerts)
   - Don't set too loose (defeats purpose)
   - Adjust by hold type if supported

---

## See Also

- [Quality Holds API Reference](../api/quality-holds-api.md)
- [Component Guide: Quality Holds UI](quality-holds-components.md)
- [Hold Workflow Guide](quality-holds-workflow.md)
