# Tax Code Management User Guide

**Story**: 01.13 - Tax Codes CRUD
**Module**: Settings
**Version**: 1.0.0
**Last Updated**: 2025-12-23

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Understanding Tax Codes](#understanding-tax-codes)
4. [Managing Tax Codes](#managing-tax-codes)
5. [Multi-Country Support](#multi-country-support)
6. [Effective Date Ranges](#effective-date-ranges)
7. [Default Tax Code](#default-tax-code)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Overview

Tax codes in MonoPilot represent tax rates (VAT, GST, sales tax, etc.) used throughout the system for supplier management, purchase orders, and invoicing. Each tax code includes:

- **Tax Rate**: Percentage (0-100%, 2 decimal precision)
- **Jurisdiction**: Country code (ISO 3166-1 alpha-2)
- **Validity Period**: Start and end dates for tax rate changes
- **Default Flag**: Mark one tax code as default for automated workflows

**Key Features**:
- Pre-seeded Polish VAT codes (23%, 8%, 5%, 0%, Exempt)
- Multi-country support (15 common EU countries)
- Status tracking (Active, Expired, Scheduled)
- One default tax code per organization
- Search and filter by country or status
- Protected deletion (cannot delete if referenced by suppliers)

---

## Getting Started

### Accessing Tax Codes

1. Log in to MonoPilot
2. Navigate to **Settings** → **Tax Codes**
3. You'll see a list of tax codes with:
   - **Code**: Short identifier (e.g., VAT23)
   - **Name**: Human-readable description (e.g., "VAT 23%")
   - **Rate**: Tax percentage (23.00%)
   - **Country**: Jurisdiction (PL = Poland)
   - **Status Badge**: Active, Expired, or Scheduled
   - **Default Badge**: Star icon for default tax code

### Pre-Seeded Tax Codes (Polish VAT)

All organizations start with 5 Polish VAT codes:

| Code | Name | Rate | Status | Default | Description |
|------|------|------|--------|---------|-------------|
| VAT23 | VAT 23% | 23% | Active | ⭐ Yes | Standard rate (most common) |
| VAT8 | VAT 8% | 8% | Active | No | Reduced rate (food, books) |
| VAT5 | VAT 5% | 5% | Active | No | Super-reduced rate (agriculture) |
| VAT0 | VAT 0% | 0% | Active | No | Zero-rated (exports) |
| ZW | Zwolniony (Exempt) | 0% | Active | No | Exempt (VAT-exempt goods) |

**Valid From**: 2011-01-01 (Polish VAT Act effective date)

**Valid To**: None (no expiry)

---

## Understanding Tax Codes

### Tax Code Components

#### 1. Code (Required)
- **Format**: 2-20 uppercase alphanumeric characters + hyphens
- **Examples**: VAT23, GST-5, REDUCED-8
- **Auto-uppercase**: Automatically converted to uppercase
- **Uniqueness**: Must be unique per organization AND country

#### 2. Name (Required)
- **Format**: 2-100 characters
- **Examples**: "VAT 23%", "GST 5% Reduced", "Sales Tax 8.5%"
- **Purpose**: Human-readable description for dropdown selection

#### 3. Rate (Required)
- **Range**: 0-100%
- **Precision**: Max 2 decimal places (e.g., 23.00, 8.50)
- **Zero Allowed**: Yes (for exempt or zero-rated goods)
- **Display**: Shown with 2 decimals and % symbol (e.g., "23.00%")

#### 4. Country Code (Required)
- **Format**: Exactly 2 uppercase letters (ISO 3166-1 alpha-2)
- **Examples**: PL (Poland), DE (Germany), GB (United Kingdom)
- **Purpose**: Defines tax jurisdiction

#### 5. Valid From (Required)
- **Format**: YYYY-MM-DD
- **Purpose**: Tax code becomes active on this date
- **Example**: "2011-01-01" (Polish VAT standard rate)

#### 6. Valid To (Optional)
- **Format**: YYYY-MM-DD or null (no expiry)
- **Purpose**: Tax code expires after this date
- **Validation**: Must be after "Valid From"

#### 7. Default Flag (Optional)
- **Purpose**: Mark one tax code as default for automated selection
- **Behavior**: Setting a new default automatically unsets the previous one
- **Recommendation**: Set your most common tax rate as default

### Tax Code Status (Calculated)

Status is automatically calculated based on current date and validity period:

| Status | Badge Color | Meaning | Condition |
|--------|-------------|---------|-----------|
| **Active** | Green | Currently valid | valid_from ≤ today ≤ valid_to (or no expiry) |
| **Expired** | Red | Past validity | valid_to < today |
| **Scheduled** | Gray/Yellow | Future validity | valid_from > today |

**Example Timeline**:

```
2010-12-31          2025-12-23          2026-12-31
    |                   |                   |
    |-------------------|-------------------|
    |   VAT23 (Active)  |  VAT23 (Active)   |
    |-------------------|-------------------|
                        |
                   (today)
```

---

## Managing Tax Codes

### Creating a Tax Code

**Required Permission**: ADMIN or SUPER_ADMIN

**Steps**:

1. Click **Add Tax Code** button
2. Fill in the form:
   - **Code**: Enter code (e.g., "VAT8")
   - **Name**: Enter description (e.g., "VAT 8%")
   - **Rate**: Enter percentage (e.g., 8.00)
   - **Country**: Select from dropdown (e.g., Poland)
   - **Valid From**: Select start date
   - **Valid To**: (Optional) Select end date
   - **Set as Default**: (Optional) Check to make default
3. Click **Create**

**Example 1: Create Reduced VAT Rate**

```
Code:         VAT8
Name:         VAT 8% Reduced Rate
Rate:         8.00
Country:      Poland (PL)
Valid From:   2011-01-01
Valid To:     (Leave blank - no expiry)
Default:      No
```

**Example 2: Create Time-Limited Tax Code**

```
Code:         VAT23-2026
Name:         VAT 23% (2026 Rate)
Rate:         23.00
Country:      Poland (PL)
Valid From:   2026-01-01
Valid To:     2026-12-31
Default:      No
```

**Example 3: Create German VAT**

```
Code:         UST19
Name:         Umsatzsteuer 19%
Rate:         19.00
Country:      Germany (DE)
Valid From:   2007-01-01
Valid To:     (Leave blank)
Default:      No
```

### Editing a Tax Code

**Required Permission**: ADMIN or SUPER_ADMIN

**Steps**:

1. Click **Actions** (⋮) on the tax code row
2. Select **Edit**
3. Modify fields (name, rate, validity dates)
4. Click **Update**

**Important Rules**:

- **Code Immutability**: If tax code is referenced by suppliers, you CANNOT change the code
  - Error message: "Cannot change code for referenced tax code"
  - Workaround: Create a new tax code with the desired code
- **All Other Fields**: Can be changed freely
- **Rate Changes**: Affects new supplier/invoice records only (historical records preserved)

**Example: Update Tax Rate**

Original:
```
Code:   VAT23
Rate:   23.00%
```

Updated:
```
Code:   VAT23
Rate:   23.50%  (rate increase)
```

**Recommendation**: For rate changes, consider creating a new tax code with validity period instead of modifying existing code.

### Deleting a Tax Code

**Required Permission**: ADMIN or SUPER_ADMIN

**Steps**:

1. Click **Actions** (⋮) on the tax code row
2. Select **Delete**
3. Confirm deletion in dialog
4. Tax code will be soft-deleted (hidden from list)

**Important Rules**:

- **Cannot Delete if Referenced**: If tax code is used by suppliers, deletion is blocked
  - Error message: "Cannot delete tax code referenced by N suppliers"
  - Recommendation: Instead of deleting, set a validity end date to "expire" the code
- **Soft Delete**: Records are not physically deleted, just hidden (preserves audit trail)
- **Reuse Code**: After deletion, you can create a new tax code with the same code+country

**Alternative to Deletion: Expire Tax Code**

Instead of deleting, set an end date:

```
Valid From:   2011-01-01
Valid To:     2025-12-31  (set expiry date)
```

This approach:
- Preserves historical references
- Shows "Expired" status badge
- Hides from active selections in dropdowns

---

## Multi-Country Support

### Available Countries

MonoPilot supports 15 common European countries:

| Country | Code | Example Tax Code |
|---------|------|------------------|
| Poland | PL | VAT23 (23%) |
| Germany | DE | UST19 (19%) |
| France | FR | TVA20 (20%) |
| United Kingdom | GB | VAT20 (20%) |
| Italy | IT | IVA22 (22%) |
| Spain | ES | IVA21 (21%) |
| Netherlands | NL | BTW21 (21%) |
| Belgium | BE | BTW21 (21%) |
| Austria | AT | UST20 (20%) |
| Czech Republic | CZ | DPH21 (21%) |
| Sweden | SE | MOMS25 (25%) |
| Denmark | DK | MOMS25 (25%) |
| Norway | NO | MVA25 (25%) |
| Finland | FI | ALV24 (24%) |
| Ireland | IE | VAT23 (23%) |

### Creating Tax Codes for Different Countries

**Example: Add German Standard VAT**

```
Code:         UST19
Name:         Umsatzsteuer 19%
Rate:         19.00
Country:      Germany (DE)
Valid From:   2007-01-01
```

**Example: Add UK Standard VAT**

```
Code:         VAT20
Name:         VAT 20%
Rate:         20.00
Country:      United Kingdom (GB)
Valid From:   2011-01-01
```

**Example: Add French Standard VAT**

```
Code:         TVA20
Name:         TVA 20%
Rate:         20.00
Country:      France (FR)
Valid From:   2014-01-01
```

### Filtering by Country

To view tax codes for a specific country:

1. Use **Country Filter** dropdown
2. Select country (e.g., "Poland")
3. List shows only codes for that country

---

## Effective Date Ranges

### Why Use Validity Periods?

Tax rates change over time. Validity periods allow you to:

1. **Schedule Future Tax Codes**: Create codes that activate on a future date
2. **Retire Old Tax Codes**: Set expiry dates for outdated rates
3. **Track Historical Rates**: Maintain audit trail of rate changes

### Common Scenarios

#### Scenario 1: Tax Rate Increase (Scheduled)

**Current Situation** (2025-12-23):
```
Code:    VAT23
Rate:    23.00%
Valid:   2011-01-01 to (no expiry)
Status:  Active (default)
```

**Government Announces**: VAT increases to 25% on 2026-01-01

**Solution**: Create new scheduled tax code
```
Code:         VAT25
Name:         VAT 25%
Rate:         25.00
Country:      Poland (PL)
Valid From:   2026-01-01
Valid To:     (Leave blank)
Default:      No (set as default on 2026-01-01)
```

**Timeline**:
```
2025-12-23             2026-01-01
    |                      |
    |----------------------|-------------------->
    |   VAT23 (Active)     |  VAT23 (Expired)
    |                      |  VAT25 (Active)
```

**On 2025-12-23**:
- VAT23: Status = Active (green badge)
- VAT25: Status = Scheduled (gray badge)

**On 2026-01-01**:
- VAT23: Set valid_to = "2025-12-31" → Status = Expired (red badge)
- VAT25: Status = Active (green badge)
- Set VAT25 as default

#### Scenario 2: Temporary Tax Rate Reduction

**Government Announces**: Temporary VAT reduction to 5% for food (2026-01-01 to 2026-12-31)

**Solution**: Create time-limited tax code
```
Code:         VAT5-TEMP
Name:         VAT 5% (Temporary Reduction)
Rate:         5.00
Country:      Poland (PL)
Valid From:   2026-01-01
Valid To:     2026-12-31
```

**Timeline**:
```
2025-12-23      2026-01-01      2026-12-31      2027-01-01
    |               |               |               |
    |---------------|---------------|---------------|
    | VAT8 (Active) | VAT5-TEMP     | VAT8 (Active) |
                    | (Active)      |
```

### Setting Validity Dates

**Create Form**:
- Valid From: Date picker (required)
- Valid To: Date picker (optional, leave blank for no expiry)

**Update Form**:
- Valid From: Can be changed (affects status calculation)
- Valid To: Can be set/changed (use to expire tax code)

---

## Default Tax Code

### Purpose

The default tax code is automatically selected in:
- Supplier creation forms
- Purchase order line items
- Invoice line items (Epic 9)

This saves time for users who work primarily with one tax rate.

### Setting a Default

**Method 1: During Creation**
1. Create tax code
2. Check "Set as Default" checkbox
3. Previous default automatically unset

**Method 2: After Creation**
1. Click **Actions** (⋮) on tax code row
2. Select **Set as Default**
3. Star icon (⭐) appears next to code
4. Previous default automatically unset

**Method 3: Via API**
```bash
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/tax-codes/{id}/set-default"
```

### Unsetting a Default

**Method 1**: Set a different tax code as default (automatic)

**Method 2**: Edit the default tax code
1. Click **Actions** (⋮) on default tax code
2. Select **Edit**
3. Uncheck "Is Default"
4. Click **Update**

### Viewing Default Tax Code

**In Tax Code List**:
- Look for star icon (⭐) in "Default" column

**Via API**:
```bash
curl -H "Authorization: Bearer <token>" \
  "https://api.monopilot.com/api/v1/settings/tax-codes/default"
```

---

## Best Practices

### 1. Code Naming Convention

Use consistent prefixes for tax types:

**VAT (Value Added Tax)**:
- VAT23, VAT8, VAT5, VAT0
- Format: VAT{rate}

**GST (Goods and Services Tax)**:
- GST5, GST18, GST28
- Format: GST{rate}

**Sales Tax**:
- ST8.5, ST9.0
- Format: ST{rate}

**Country-Specific**:
- UST19 (Germany - Umsatzsteuer)
- TVA20 (France - Taxe sur la Valeur Ajoutée)
- IVA22 (Italy - Imposta sul Valore Aggiunto)

### 2. Handling Rate Changes

**❌ Don't**: Edit existing tax code rate
- Affects historical data interpretation
- Confuses audit trail

**✅ Do**: Create new tax code with validity period
- Preserves historical accuracy
- Clear audit trail
- Scheduled activation

**Example**:

Current:
```
VAT23: 23.00% (2011-01-01 to no expiry)
```

Rate increases to 25% on 2026-01-01:

```
VAT23: 23.00% (2011-01-01 to 2025-12-31)  [Set expiry]
VAT25: 25.00% (2026-01-01 to no expiry)   [Create new]
```

### 3. Zero-Rated vs Exempt

**Zero-Rated (0% Rate)**:
- VAT applies at 0%
- Input VAT can be reclaimed
- Use Code: VAT0

**Exempt (No VAT)**:
- No VAT applies
- Input VAT cannot be reclaimed
- Use Code: ZW (Zwolniony)

Both have 0% rate, but different accounting treatment.

### 4. Default Tax Code Selection

Set default to:
- Most commonly used rate (usually standard rate)
- Example: VAT23 (23%) for Poland
- Saves time in data entry

### 5. Organizing Multi-Country Codes

Use clear naming with country indicator:

**Option 1: Code Prefix**
```
PL-VAT23  (Poland)
DE-UST19  (Germany)
UK-VAT20  (United Kingdom)
```

**Option 2: Name Suffix**
```
Code: VAT23
Name: VAT 23% (Poland)
```

**Option 3: Filter by Country**
- Use country filter dropdown
- Keep codes short and clean

### 6. Scheduled Tax Codes

When creating scheduled tax codes:
1. Create 30+ days in advance
2. Communicate to team before activation
3. Set default on activation date
4. Expire old tax code on same date

---

## Troubleshooting

### Issue 1: "Tax code already exists"

**Symptom**: Cannot create tax code - error "Tax code already exists for country PL"

**Cause**: Code + Country combination already exists in organization

**Solutions**:

1. **Check Existing Codes**: Search for the code in the list
2. **Use Different Code**: Try VAT23-NEW, VAT23-2026, etc.
3. **Different Country**: Same code allowed for different countries (VAT23-PL vs VAT23-DE)
4. **Check Deleted Codes**: Soft-deleted codes may block reuse (contact admin)

### Issue 2: "Cannot change code for referenced tax code"

**Symptom**: Cannot edit code field - error "Cannot change code for referenced tax code"

**Cause**: Tax code is referenced by suppliers (Epic 3/9)

**Solutions**:

1. **Edit Other Fields**: Name, rate, validity dates can still be changed
2. **Create New Tax Code**: Create a new code with desired code name
3. **Keep Current Code**: Use current code if only minor change needed

### Issue 3: "Cannot delete tax code referenced by N suppliers"

**Symptom**: Cannot delete - error shows reference count

**Cause**: Tax code is used by suppliers/invoices (Epic 3/9)

**Solutions**:

1. **Set Expiry Date**: Instead of deleting, set valid_to to expire the code
   ```
   Valid To: 2025-12-31
   ```
   - Code becomes "Expired" (red badge)
   - Hidden from dropdowns
   - Preserves historical references

2. **Update Supplier Records**: Change suppliers to different tax code (Epic 3)

3. **Accept Reference**: Keep tax code for historical purposes

### Issue 4: Tax Code Not Appearing in Dropdown

**Symptom**: Tax code exists but doesn't show in supplier form dropdown

**Possible Causes**:

1. **Status = Expired**: Set valid_to in the past
   - **Solution**: Remove valid_to or set to future date

2. **Status = Scheduled**: Set valid_from in the future
   - **Solution**: Change valid_from to today or earlier

3. **Soft Deleted**: Tax code was deleted
   - **Solution**: Create new tax code (code reuse allowed after deletion)

4. **Different Country**: Dropdown filtered by supplier country
   - **Solution**: Check country_code matches supplier country

### Issue 5: Multiple Default Tax Codes

**Symptom**: Two tax codes show star icon (⭐)

**Cause**: Database trigger failed (very rare)

**Solution**:

1. Refresh page (should auto-fix)
2. If persists:
   ```bash
   # Unset all defaults
   UPDATE tax_codes SET is_default = false WHERE org_id = 'your-org-id';

   # Set correct default
   UPDATE tax_codes SET is_default = true WHERE id = 'correct-tax-code-id';
   ```

### Issue 6: Search Returns No Results

**Symptom**: Search box returns no matches

**Possible Causes**:

1. **Search Too Short**: Minimum 2 characters required
   - **Solution**: Enter at least 2 characters

2. **Wrong Filter**: Status or country filter applied
   - **Solution**: Check filter dropdowns, set to "All"

3. **Typo**: Code/name spelling incorrect
   - **Solution**: Try partial match (e.g., "VAT" instead of "VAT23")

---

## FAQ

### General Questions

**Q: How many tax codes can I create?**
A: Unlimited. Organizations typically have 5-20 tax codes.

**Q: Can I have the same code in multiple countries?**
A: Yes! VAT23 for Poland and VAT23 for Germany are allowed (unique per org+country).

**Q: What happens to old supplier records if I delete a tax code?**
A: You cannot delete if referenced. Set an expiry date instead to preserve historical data.

**Q: Can I import tax codes from a CSV file?**
A: Not yet. Bulk import planned for Epic 3. For now, use API or manual entry.

### Rate and Validity Questions

**Q: Can I have multiple tax codes with the same rate?**
A: Yes. Example: VAT23 (standard) and VAT23-EXPORT (zero-rated for exports).

**Q: What does 0% rate mean?**
A: Either zero-rated (VAT at 0%, input VAT reclaimable) or exempt (no VAT, input not reclaimable).

**Q: Can I set a validity period in the past?**
A: Yes. This is used to retire historical tax codes (status = Expired).

**Q: What happens when a scheduled tax code becomes active?**
A: Status automatically changes from "Scheduled" to "Active" on the valid_from date.

### Default and Selection Questions

**Q: What happens if I don't set a default tax code?**
A: Supplier forms show blank dropdown - users must manually select tax code.

**Q: Can I have different default tax codes for different countries?**
A: No. One default per organization (across all countries).

**Q: Can I change the default tax code?**
A: Yes. Set a different tax code as default - the previous one is automatically unset.

### Permission Questions

**Q: Who can create/edit/delete tax codes?**
A: Only ADMIN and SUPER_ADMIN roles.

**Q: Can viewers see tax codes?**
A: Yes. All authenticated users can view tax codes (read-only).

**Q: Can production managers modify tax codes?**
A: No. Production managers can view but not modify tax codes.

### Data Migration Questions

**Q: I'm migrating from another system. How do I set up tax codes?**
A:
1. Delete pre-seeded codes if not applicable
2. Create tax codes matching your legacy system
3. Set validity dates to match historical rates
4. Set most common rate as default

**Q: Should I create separate codes for rate changes?**
A: Yes. Example:
```
VAT22 (2011-2023): Valid until 2023-12-31
VAT23 (2024+):    Valid from 2024-01-01
```

---

## Related Documentation

- [Tax Codes API Documentation](../../api/settings/tax-codes.md)
- [Database Schema - Tax Codes Table](../../database/migrations/tax-codes.md)
- [Story 01.13 Specification](../../../2-MANAGEMENT/epics/current/01-settings/context/01.13/)
- [QA Report - Story 01.13](../../../2-MANAGEMENT/qa/qa-report-story-01.13.md)

---

**Guide Version**: 1.0.0
**Story**: 01.13
**Status**: Complete
**Last Updated**: 2025-12-23
