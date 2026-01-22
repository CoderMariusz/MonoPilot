# Quality Settings Configuration Examples

Story: 06.0 - Quality Settings (Module Configuration)

## Overview

This guide provides practical configuration examples for different food manufacturing scenarios. Each example includes the rationale, API request, and expected behavior.

---

## Default Settings

When a new organization is created, quality settings are automatically initialized with these defaults:

```json
{
  "require_incoming_inspection": true,
  "require_final_inspection": true,
  "auto_create_inspection_on_grn": true,
  "default_sampling_level": "II",
  "require_hold_reason": true,
  "require_disposition_on_release": true,
  "ncr_auto_number_prefix": "NCR-",
  "ncr_require_root_cause": true,
  "ncr_critical_response_hours": 24,
  "ncr_major_response_hours": 48,
  "capa_auto_number_prefix": "CAPA-",
  "capa_require_effectiveness": true,
  "capa_effectiveness_wait_days": 30,
  "coa_auto_number_prefix": "COA-",
  "coa_require_approval": false,
  "ccp_deviation_escalation_minutes": 15,
  "ccp_auto_create_ncr": true,
  "require_change_reason": true,
  "retention_years": 7
}
```

---

## Configuration Scenarios

### 1. Food Safety Startup (Basic Configuration)

**Scenario**: Small manufacturer just starting quality management. Wants simple processes.

**Configuration**:

```bash
curl -X PUT https://your-domain.com/api/quality/settings \
  -H "Content-Type: application/json" \
  -d '{
    "require_incoming_inspection": true,
    "require_final_inspection": true,
    "auto_create_inspection_on_grn": true,
    "default_sampling_level": "II",
    "ncr_require_root_cause": false,
    "capa_require_effectiveness": false,
    "retention_years": 3
  }'
```

**Rationale**:
- Keep inspections enabled for traceability
- Disable root cause and effectiveness requirements to reduce complexity
- 3-year retention meets basic regulatory requirements

---

### 2. GFSI/SQF Certified Facility

**Scenario**: Facility with GFSI certification requires strict documentation and rapid response.

**Configuration**:

```bash
curl -X PUT https://your-domain.com/api/quality/settings \
  -H "Content-Type: application/json" \
  -d '{
    "require_incoming_inspection": true,
    "require_final_inspection": true,
    "auto_create_inspection_on_grn": true,
    "default_sampling_level": "II",
    "require_hold_reason": true,
    "require_disposition_on_release": true,
    "ncr_require_root_cause": true,
    "ncr_critical_response_hours": 4,
    "ncr_major_response_hours": 24,
    "capa_require_effectiveness": true,
    "capa_effectiveness_wait_days": 90,
    "ccp_deviation_escalation_minutes": 5,
    "ccp_auto_create_ncr": true,
    "require_change_reason": true,
    "retention_years": 10
  }'
```

**Rationale**:
- Critical NCR response in 4 hours (same-shift resolution)
- 90-day effectiveness wait for meaningful verification
- 5-minute CCP escalation for immediate food safety response
- 10-year retention for audit trail compliance

---

### 3. Co-Packer with Multiple Customers

**Scenario**: Contract manufacturer handling products for different brand owners with varying requirements.

**Configuration**:

```bash
curl -X PUT https://your-domain.com/api/quality/settings \
  -H "Content-Type: application/json" \
  -d '{
    "require_incoming_inspection": true,
    "require_final_inspection": true,
    "auto_create_inspection_on_grn": true,
    "default_sampling_level": "III",
    "ncr_auto_number_prefix": "NC-",
    "capa_auto_number_prefix": "CA-",
    "coa_auto_number_prefix": "COA-",
    "coa_require_approval": true,
    "retention_years": 7
  }'
```

**Rationale**:
- Level III sampling (tightened) for stricter customer requirements
- Shorter prefixes for cleaner document numbers
- CoA approval required as customers request certificates

---

### 4. High-Volume Production Facility

**Scenario**: Large-scale facility with trusted suppliers and high throughput.

**Configuration**:

```bash
curl -X PUT https://your-domain.com/api/quality/settings \
  -H "Content-Type: application/json" \
  -d '{
    "require_incoming_inspection": false,
    "require_final_inspection": true,
    "auto_create_inspection_on_grn": false,
    "default_sampling_level": "I",
    "ncr_critical_response_hours": 48,
    "ncr_major_response_hours": 72,
    "ccp_deviation_escalation_minutes": 30,
    "retention_years": 5
  }'
```

**Rationale**:
- Skip incoming inspection for approved suppliers
- Level I sampling (reduced) based on supplier history
- Longer response times given volume of minor issues
- 5-year retention (balance storage vs. compliance)

---

### 5. Allergen-Handling Facility

**Scenario**: Facility producing allergen-containing products requiring strict controls.

**Configuration**:

```bash
curl -X PUT https://your-domain.com/api/quality/settings \
  -H "Content-Type: application/json" \
  -d '{
    "require_incoming_inspection": true,
    "require_final_inspection": true,
    "auto_create_inspection_on_grn": true,
    "default_sampling_level": "II",
    "require_hold_reason": true,
    "require_disposition_on_release": true,
    "ncr_require_root_cause": true,
    "ncr_critical_response_hours": 1,
    "ncr_major_response_hours": 8,
    "ccp_deviation_escalation_minutes": 5,
    "ccp_auto_create_ncr": true,
    "require_change_reason": true,
    "retention_years": 15
  }'
```

**Rationale**:
- 1-hour critical NCR response for potential allergen issues
- 5-minute CCP escalation for immediate containment
- 15-year retention (product lifecycle + liability period)
- Mandatory change reasons for complete audit trail

---

### 6. Organic/Non-GMO Certified Facility

**Scenario**: Facility with organic certification requiring ingredient traceability.

**Configuration**:

```bash
curl -X PUT https://your-domain.com/api/quality/settings \
  -H "Content-Type: application/json" \
  -d '{
    "require_incoming_inspection": true,
    "require_final_inspection": true,
    "auto_create_inspection_on_grn": true,
    "default_sampling_level": "II",
    "coa_require_approval": true,
    "require_change_reason": true,
    "retention_years": 7
  }'
```

**Rationale**:
- All inspections enabled for chain of custody
- CoA approval for ingredient verification
- Standard retention meeting organic certification requirements

---

## AQL Sampling Level Reference

| Level | Use Case | Sample Size |
|-------|----------|-------------|
| I | Reduced inspection - trusted suppliers | Smallest |
| II | Normal inspection - standard operations | Standard |
| III | Tightened inspection - new suppliers or issues | Larger |
| S-1 | Special - expensive testing | Very small |
| S-2 | Special - destructive testing | Small |
| S-3 | Special - moderate testing | Medium |
| S-4 | Special - extensive testing | Medium-large |

**When to Change Levels**:

- **Reduce to Level I**: After 10 consecutive lots pass at Level II
- **Tighten to Level III**: After 2 of 5 lots fail at Level II
- **Return to Level II**: After 5 consecutive lots pass at Level III

---

## NCR Response Time Guidelines

| Severity | Recommended Hours | Scenario |
|----------|-------------------|----------|
| Critical (1-4h) | 1-4 | Allergen contamination, pathogen detection |
| Critical (4-24h) | 4-24 | Foreign material, equipment failure |
| Major (24h) | 24 | Label errors, packaging defects |
| Major (48h) | 48 | Documentation gaps, minor deviations |
| Minor (72h+) | 72+ | Cosmetic issues, non-safety concerns |

---

## Retention Period Guidelines

| Industry Standard | Years | Notes |
|-------------------|-------|-------|
| FDA 21 CFR Part 117 | 2+ | 2 years beyond shelf life or 3 years from creation |
| GFSI/SQF | 5-7 | Depends on certification level |
| Organic (USDA NOP) | 5 | 5 years minimum |
| EU Regulations | 5+ | Product lifecycle + 5 years |
| Allergen Documentation | 10-15 | Extended liability period |

---

## Validation Constraints

### Numeric Field Limits

| Field | Min | Max | Default |
|-------|-----|-----|---------|
| ncr_critical_response_hours | 1 | 168 | 24 |
| ncr_major_response_hours | 1 | 336 | 48 |
| capa_effectiveness_wait_days | 0 | 365 | 30 |
| ccp_deviation_escalation_minutes | 1 | 1440 | 15 |
| retention_years | 1 | 50 | 7 |

### String Field Limits

| Field | Min | Max | Pattern |
|-------|-----|-----|---------|
| ncr_auto_number_prefix | 1 | 10 | Any text |
| capa_auto_number_prefix | 1 | 10 | Any text |
| coa_auto_number_prefix | 1 | 10 | Any text |

### Sampling Level Values

Valid values: `I`, `II`, `III`, `S-1`, `S-2`, `S-3`, `S-4`

---

## API Request Examples

### TypeScript

```typescript
const response = await fetch('/api/quality/settings', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ncr_critical_response_hours: 4,
    ncr_major_response_hours: 24,
    retention_years: 10
  })
});

if (!response.ok) {
  const error = await response.json();
  console.error('Validation error:', error.details);
}
```

### Python

```python
import requests

response = requests.put(
    'https://your-domain.com/api/quality/settings',
    json={
        'ncr_critical_response_hours': 4,
        'ncr_major_response_hours': 24,
        'retention_years': 10
    },
    headers={'Content-Type': 'application/json'}
)

if response.status_code == 400:
    print('Validation error:', response.json()['details'])
```

---

## Troubleshooting

### Error: "Must be at least 1 hour"

```json
{
  "error": "Invalid request data",
  "details": [{
    "code": "too_small",
    "path": ["ncr_critical_response_hours"],
    "message": "Must be at least 1 hour"
  }]
}
```

**Solution**: Ensure numeric values meet minimum requirements. Zero is not valid for response hours.

### Error: "Forbidden: Admin, Owner, or Quality Manager role required"

```json
{
  "error": "Forbidden: Admin, Owner, or Quality Manager role required"
}
```

**Solution**: Request settings update from a user with admin, owner, or quality_manager role.

### Error: "Invalid sampling level"

```json
{
  "error": "Invalid request data",
  "details": [{
    "path": ["default_sampling_level"],
    "message": "Invalid enum value"
  }]
}
```

**Solution**: Use one of the valid values: `I`, `II`, `III`, `S-1`, `S-2`, `S-3`, `S-4`
