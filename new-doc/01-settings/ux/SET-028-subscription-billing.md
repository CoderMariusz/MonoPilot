# SET-028: Subscription & Billing

**Module**: Settings
**Feature**: Subscription Management & Billing
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-15

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Subscription & Billing                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ CURRENT PLAN                                                  │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 🎯 Premium Plan                                   [Downgrade] │   │
│  │    8 active users × $50/user/month = $400/month               │   │
│  │                                                               │   │
│  │    ┌─────────────────────────────────────────────────────┐   │   │
│  │    │ BILLING CYCLE:                                      │   │   │
│  │    │                                                     │   │   │
│  │    │ ◉ Monthly: $400/month (billed every 30 days)      │   │   │
│  │    │   Next billing: January 15, 2026                  │   │   │
│  │    │                                                     │   │   │
│  │    │ ○ Annual: $510/user/year = $4,080/year (Save 15%) │   │   │
│  │    │   Equivalent to $425/month                         │   │   │
│  │    │   You save: $480/year compared to monthly          │   │   │
│  │    │   Next billing: January 15, 2027                  │   │   │
│  │    │   [Change to Annual]                              │   │   │
│  │    │                                                     │   │   │
│  │    └─────────────────────────────────────────────────────┘   │   │
│  │                                                               │   │
│  │    Payment method: Visa •••• 4242                             │   │
│  │                                                               │   │
│  │    [Update Payment Method]                                    │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ USAGE THIS MONTH                                              │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ Active Users:        8 / 10 users                             │   │
│  │ [████████──] 80%                                [+Add Users]  │   │
│  │                                                               │   │
│  │ Storage:             2.4 GB / 50 GB                           │   │
│  │ [█──────────] 4.8%                                            │   │
│  │                                                               │   │
│  │ API Calls:           12,420 / 100,000 calls/month             │   │
│  │ [█──────────] 12.4%                                           │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ BILLING HISTORY                       [Download All Invoices] │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ Date         Amount    Status    Invoice                      │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ Dec 15, 2025 $400.00   Paid ✓    [Download] [View Details]   │   │
│  │ Nov 15, 2025 $400.00   Paid ✓    [Download] [View Details]   │   │
│  │ Oct 15, 2025 $400.00   Paid ✓    [Download] [View Details]   │   │
│  │ Sep 15, 2025 $350.00   Paid ✓    [Download] [View Details]   │   │
│  │                                            [Load More (12)]   │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ PAYMENT METHOD                                                │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 💳 Visa •••• 4242                                             │   │
│  │    Expires: 12/2027                                           │   │
│  │                                                               │   │
│  │    [Update Payment Method]  [Add Backup Card]                 │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ AVAILABLE PLANS                                               │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 🆓 Free Plan                                     [Current ✓]  │   │
│  │    $0/month                                                   │   │
│  │    • Core modules (6): Technical, Planning, Production...     │   │
│  │    • 3 users max                                              │   │
│  │    • 1 GB storage                                             │   │
│  │    • Community support                                        │   │
│  ├───────────────────────────────────────────────────────────────┤   │
│  │ 🎯 Premium Plan                                   [Upgrade]   │   │
│  │    $50/user/month (Monthly) or $510/user/year (15% off)       │   │
│  │    • All Free features                                        │   │
│  │    • Premium modules: NPD, Finance, OEE, Integrations         │   │
│  │    • Unlimited users                                          │   │
│  │    • 50 GB storage                                            │   │
│  │    • Priority support (24h response)                          │   │
│  │    • API access + Webhooks                                    │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Billing Cycle Change Confirmation Modal

```
┌────────────────────────────────────────────────────────┐
│  Change Billing Cycle                            [X]   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Switch to Annual Billing?                            │
│                                                        │
│  Current: Monthly billing at $400/month ($4,800/year) │
│  New:     Annual billing at $4,080/year (Save $720!)  │
│                                                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Billing Details:                                │  │
│  │                                                 │  │
│  │ Current Period Remaining:     18 days           │  │
│  │ Prorated Credit:              -$240.00          │  │
│  │ Annual Plan Charge:           +$4,080.00        │  │
│  │ ─────────────────────────────────────────────    │  │
│  │ Amount Due Today:             +$3,840.00        │  │
│  │                                                 │  │
│  │ Your next billing date:       January 15, 2027 │  │
│  │ Payment method:               Visa •••• 4242    │  │
│  │                                                 │  │
│  │ ☐ I understand I'm switching to annual billing │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│         [Cancel]  [Change to Annual - $3,840]         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Loading State

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Subscription & Billing                                   │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │ CURRENT PLAN                                                  │   │
│  │ [███████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]             │   │
│  │ [███████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]               │   │
│  └───────────────────────────────────────────────────────────────┘   │
│  Loading subscription details...                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Empty State (Free Plan - No Payment Method)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Subscription & Billing                                   │
├─────────────────────────────────────────────────────────────────────┤
│                          [🆓 Icon]                                    │
│                      Free Plan Active                                 │
│     You're on the Free plan. Upgrade to unlock premium modules.       │
│                                                                       │
│                  [Explore Premium Features]                           │
│                                                                       │
│  Current usage: 2 users, 0.3 GB storage, 1,240 API calls             │
│  No billing history (no payment method on file).                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Error State (Payment Failed)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Settings > Subscription & Billing                                   │
├─────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                     │
│                   Payment Method Declined                             │
│     Your last payment of $400.00 was declined on Dec 15, 2025.        │
│     Update your payment method to avoid service interruption.         │
│     Error: PAYMENT_DECLINED (card expired)                            │
│                                                                       │
│      [Update Payment Method]  [Contact Billing Support]               │
│                                                                       │
│  Grace period: 7 days remaining (service active until Dec 22, 2025)   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Current Plan Card** - Plan name (Free/Premium), price breakdown ($/user × N users), next billing date, payment method preview
2. **Billing Cycle Selector** - Radio buttons (Monthly/Annual), savings calculation, equivalent monthly cost, [Change to Annual/Monthly] button
3. **Usage Meters** - Active users (count/limit, progress bar), storage (GB used/total), API calls (count/limit), color-coded thresholds
4. **Billing History Table** - Date, Amount, Status (Paid/Failed/Pending), Download + View Details actions, paginated (10/page)
5. **Payment Method Card** - Card brand + last 4 digits, expiration date, Update/Add Backup buttons
6. **Available Plans Panel** - Free plan features, Premium plan features, pricing (both monthly and annual), [Upgrade]/[Downgrade] buttons
7. **Invoice Download** - Single invoice PDF download, bulk "Download All Invoices" (ZIP file)
8. **Plan Change Modal** - Select new plan, preview new price, confirm billing cycle change, payment authorization
9. **Billing Cycle Change Modal** - Current vs new cycle details, prorated credit/charge calculation, confirmation checkbox, confirm button
10. **Payment Form Modal** - Stripe embedded form, card input, billing address, save for future use checkbox
11. **Usage Alerts** - Warning badges when approaching limits (>80% users, >90% storage, >95% API calls)
12. **Billing Contact** - "Questions? Contact billing@monopilot.app" footer link

---

## Main Actions

### Primary
- **[Change to Annual/Monthly]** - Opens billing cycle change modal → calculates prorated amounts → shows confirmation with new total → processes immediately
- **[Update Payment Method]** - Opens Stripe payment form → validates card → saves new default → confirms
- **[Download Invoice]** - Generates PDF invoice (header: org info, line items, taxes, total) → downloads to device

### Secondary
- **[+Add Users]** - Redirects to user invitation screen (SET-010), updates usage preview
- **[Upgrade]** - Shortcut to upgrade to Premium plan (pre-selects Premium in plan change modal)
- **[Downgrade]** - Opens plan change modal with Free plan selected, warns about feature loss
- **[View Details]** - Expands inline invoice detail (line items: 8 users × $50, taxes, subtotal, total)
- **[Add Backup Card]** - Opens payment form, saves secondary card (used if primary fails)
- **[Cancel]** - Closes billing cycle change modal without making changes

### Validation/Warnings
- **Payment Failed** - Red alert banner at top, "Update payment method" CTA, grace period countdown
- **Usage Limit Approaching** - Orange warning badge on usage meter (e.g., "7/10 users - nearing limit")
- **Downgrade Confirmation** - "Downgrading to Free will disable NPD, Finance, OEE, Integrations. Continue?"
- **Billing Cycle Change Confirmation** - "Switch to Annual? You'll save $720/year. Pro-rated credit: -$240. New charge: +$3,840. Confirm?"
- **Cycle Change Requirement** - Must have valid payment method on file to change to annual

---

## States

- **Loading**: Skeleton cards (current plan, usage, billing history), "Loading subscription details..." text
- **Empty**: Free plan card, "No billing history", "Explore Premium Features" CTA, current usage stats (no payment method)
- **Error**: Payment failed alert, grace period countdown, "Update Payment Method" + "Contact Support" buttons, current plan still visible
- **Success**: Current plan card with billing cycle selector, usage meters, billing history table, payment method card, available plans panel

---

## Pricing Model

### Free Plan
- **Price**: $0/month
- **Features**: Core modules (Technical, Planning, Production, Warehouse, Quality, Shipping)
- **Limits**: 3 users, 1 GB storage, 10,000 API calls/month
- **Support**: Community support (48h response)

### Premium Plan
- **Price**:
  - **Monthly**: $50/user/month (billed on 30-day cycle)
  - **Annual**: $510/user/year (billed yearly, 15% discount)
  - **Savings**: $480/year per user when choosing annual ($600/year - $120 discount per user)
- **Features**: All Free + NPD, Finance, OEE, Integrations modules
- **Limits**: Unlimited users, 50 GB storage, 100,000 API calls/month
- **Support**: Priority support (24h response), dedicated account manager (>20 users)

### Enterprise Plan (Custom)
- **Price**: Custom (contact sales)
- **Features**: All Premium + on-premise deployment, custom integrations, SLA guarantees
- **Support**: 24/7 phone support, dedicated CSM

---

## Billing Cycle Management

### Monthly Billing
- **Charge**: Every 30 days
- **Price**: $50/user/month × active users
- **Example**: 8 users = $400/month
- **Next billing**: 30 days from today

### Annual Billing
- **Charge**: Once per year (365 days)
- **Price**: $510/user/year × active users
- **Example**: 8 users = $4,080/year ($425/month equivalent)
- **Discount**: 15% off compared to monthly ($600 becomes $510)
- **Savings**: $480/year per user ($80 × 6 months)
- **Next billing**: 365 days from today

### Switching Billing Cycles

**Monthly → Annual:**
1. User clicks [Change to Annual]
2. Modal displays:
   - Current subscription details (monthly amount, remaining days in cycle)
   - New subscription details (annual amount, new billing date)
   - Prorated credit (refund for unused monthly days)
   - Net charge today (annual charge - credit)
   - Example: Remaining 18 days = -$240 credit, New charge = $4,080, Net = +$3,840
3. User confirms with checkbox "I understand I'm switching to annual billing"
4. System charges immediately via Stripe
5. Subscription updates (next billing: 365 days from today)
6. Toast: "Switched to annual billing. Save $480/year!"

**Annual → Monthly:**
1. User clicks [Change to Monthly]
2. Modal displays:
   - Current subscription details (annual amount, remaining days in cycle)
   - New subscription details (monthly amount, new billing date)
   - Prorated charge (for remaining annual period converted to monthly)
   - Net charge today (monthly charge prorated)
   - Example: Remaining 320 days of annual = +$410 charge, Monthly rate = $400, Net = +$10
3. User confirms
4. System charges immediately via Stripe
5. Subscription updates (next billing: 30 days from today)
6. Toast: "Switched to monthly billing. More flexibility!"

### Pro-Rated Calculations

**When switching cycles mid-period:**

Formula: `(Annual Price / 365) × Remaining Days` or `(Monthly Price × 12 / 365) × Remaining Days`

Examples:
- **Upgrade Monthly → Annual on Day 18 of 31-day cycle (13 days left)**:
  - Current monthly credit: ($400 / 30) × 13 = -$173.33
  - New annual charge: $4,080
  - Net charge: $4,080 - $173.33 = $3,906.67

- **Downgrade Annual → Monthly on Day 200 of 365-day cycle (165 days left)**:
  - Current annual credit: ($4,080 / 365) × 165 = -$1,849.32
  - New monthly charge: $400
  - Net charge: $400 - $1,849.32 = Refund $1,449.32

---

## Usage Thresholds

| Resource | Free Limit | Premium Limit | Warning At | Alert At |
|----------|------------|---------------|------------|----------|
| Users | 3 | Unlimited | 80% (2/3) | 100% (3/3) |
| Storage | 1 GB | 50 GB | 80% | 95% |
| API Calls | 10k/mo | 100k/mo | 80% | 95% |

**Color Coding**:
- Green: <80% usage (normal)
- Orange: 80-95% usage (warning)
- Red: >95% usage (critical, upgrade recommended)

---

## Billing History Details

### Invoice Fields
- **Invoice Number**: INV-2025-12-001
- **Date Issued**: December 15, 2025
- **Due Date**: December 15, 2025 (immediate charge)
- **Status**: Paid / Failed / Pending
- **Line Items**: [8 users × $50.00, Tax (23% VAT), Total $491.20]
- **Payment Method**: Visa •••• 4242
- **Billing Address**: Org address from profile (SET-007)
- **Billing Cycle Type**: Monthly or Annual

### Invoice Actions
- **Download**: PDF invoice (A4, branded header, itemized)
- **View Details**: Inline expansion (line items, taxes, subtotal, total)
- **Email Invoice**: Send copy to org email or custom recipient

---

## Payment Method Management

### Supported Payment Methods
- **Credit Cards**: Visa, Mastercard, Amex (via Stripe)
- **Debit Cards**: All major debit cards (via Stripe)
- **Bank Transfer**: Available for Enterprise plans (manual invoice)

### Payment Form (Stripe Elements)
- **Card Number**: 16-digit input (with brand icon)
- **Expiry**: MM/YY format
- **CVC**: 3-digit security code
- **Billing Address**: Auto-populated from org profile, editable
- **Save for Future**: Checkbox (default: checked)

### Payment Security
- **PCI Compliance**: Stripe handles all card data (no storage in MonoPilot DB)
- **3D Secure**: Required for EU/UK cards (Stripe SCA compliance)
- **Encryption**: All payment data encrypted in transit (TLS 1.3)

---

## Plan Change Logic

### Upgrade (Free → Premium)
1. User clicks [Upgrade] on Premium Plan card
2. Modal: Select Premium plan → select billing cycle (Monthly or Annual)
3. Preview shows: "8 users × $50/month = $400/month" or "8 users × $510/year = $4,080/year (Save 15%)"
4. Enter payment method (if none on file)
5. Confirm upgrade → immediate charge (pro-rated if mid-cycle)
6. Premium modules unlock automatically (NPD, Finance, OEE, Integrations)
7. Toast: "Upgraded to Premium! NPD, Finance, OEE, Integrations are now available."
8. Page refreshes → current plan card shows Premium with selected billing cycle

### Downgrade (Premium → Free)
1. User clicks [Downgrade]
2. Modal: Confirm downgrade → warning about feature loss (premium modules disabled)
3. Confirm → downgrade scheduled for next billing cycle (not immediate)
4. Toast: "Downgrade scheduled for Jan 15, 2026. Premium features remain active until then."
5. On billing cycle end: Premium modules disabled, users >3 deactivated (admin chooses which)

### Pro-Rated Billing
- **Upgrade**: Charge immediately (pro-rated for remaining days in cycle)
  - Example: Upgrade on Dec 22 (8 days into 31-day cycle) → charge for 23 days → next full charge on Jan 15
- **Downgrade**: No refund, new plan starts next cycle
  - Example: Downgrade on Dec 22 → Premium active until Jan 15 → Free starts Jan 15
- **Cycle Change**: Charge/credit immediately (pro-rated based on days in current period)
  - Example: Switch to Annual on Dec 22 (18 days remaining) → credit unused portion, charge annual rate

---

## Permissions

| Role | Can View | Can Change Plan | Can Update Payment | Can Download Invoices | Can Change Cycle |
|------|----------|-----------------|--------------------|-----------------------|------------------|
| Super Admin | Yes | Yes | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes | Yes | Yes |
| Manager | Yes (usage only) | No | No | Yes | No |
| Operator | No | No | No | No | No |
| Viewer | No | No | No | No | No |

---

## Validation Rules

- **Plan Change**: Require payment method on file (if upgrading to Premium)
- **Billing Cycle Change**: Require valid payment method on file; cannot change within 5 days of next billing date (must wait for next cycle)
- **Payment Method Update**: Validate card via Stripe (test charge $0.01, refund immediately)
- **Downgrade**: Warn if active data in premium modules (e.g., "12 active NPD projects will be hidden")
- **User Limit (Free)**: Enforce 3-user cap (deactivate excess users on downgrade, admin selects which)
- **Invoice Download**: Only show invoices for current org (RLS by org_id)
- **Payment Failed**: Grace period 7 days → after 7 days, downgrade to Free automatically
- **Cycle Change Confirmation**: Require checkbox acknowledgment before processing

---

## Accessibility

- **Touch targets**: All buttons >= 48x48dp, invoice rows >= 48dp height, radio button areas >= 48x48dp
- **Contrast**: Usage meters pass WCAG AA (green/orange/red with text labels, not color-only)
- **Screen reader**: "Current plan: Premium, $50 per user per month, 8 users, $400 total, next billing January 15, 2026" / "Switch to annual billing for 15% savings ($510 per user per year)"
- **Keyboard**: Tab navigation, Enter to activate buttons, Space to select radio buttons and checkboxes
- **Focus indicators**: Clear 2px outline on all interactive elements (buttons, radio buttons, links)
- **Color independence**: Status icons + text labels (Paid ✓, Failed ⚠, Pending ⏳), billing cycle options clearly labeled
- **Radio button labels**: Clickable label text (not just button), full context in label ("Annual: $510/user/year (Save 15%)")

---

## Related Screens

- **Plan Change Modal**: Select plan (Free/Premium/Enterprise), select billing cycle (Monthly/Annual), preview price, confirm
- **Billing Cycle Change Modal**: Current vs new cycle details, prorated calculations, confirmation checkbox, confirm button
- **Payment Form Modal**: Stripe Elements form (card number, expiry, CVC, billing address)
- **Invoice Detail Panel**: Inline expansion (line items, taxes, subtotal, total, payment method, billing cycle type)
- **User Invitation (SET-010)**: [+Add Users] redirects here, usage preview updates on return
- **Module Toggles (SET-022)**: Premium modules unlock/lock based on subscription status
- **Payment Failure Recovery**: Auto-retry + manual update flow (SET-028 error state)

---

## Technical Notes

### API Endpoints

- **GET /api/settings/subscription** → returns current plan, usage, billing history, billing cycle (monthly/annual)
- **PUT /api/settings/subscription/plan** → body: `{plan_id, billing_cycle, payment_method_id}` → upgrades/downgrades with cycle selection
- **PUT /api/settings/subscription/cycle** → body: `{billing_cycle: "monthly" | "annual"}` → switches billing cycle mid-period
- **POST /api/settings/subscription/payment-method** → body: Stripe token → saves payment method
- **GET /api/settings/subscription/invoices/:id/download** → generates PDF invoice
- **POST /api/settings/subscription/cycle-confirmation** → body: `{new_cycle, prorated_amount, confirmation_token}` → confirms cycle change

### Database Schema

- **org_subscriptions** table
  - `org_id` (FK)
  - `plan_id` (FK to plans)
  - `status` (active, past_due, canceled)
  - `billing_cycle` (monthly, annual) **NEW COLUMN**
  - `current_period_start` (timestamp)
  - `current_period_end` (timestamp)
  - `payment_method_id` (FK)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

- **invoices** table
  - `id` (PK)
  - `org_id` (FK)
  - `amount` (decimal)
  - `status` (paid, failed, pending)
  - `issued_at` (timestamp)
  - `paid_at` (timestamp, nullable)
  - `invoice_number` (string, unique per org)
  - `line_items` (jsonb array)
  - `billing_cycle_type` (monthly, annual) **NEW COLUMN**

- **payment_methods** table
  - `id` (PK)
  - `org_id` (FK)
  - `stripe_payment_method_id` (string)
  - `brand` (visa, mastercard, amex)
  - `last4` (4 digits)
  - `exp_month` (integer)
  - `exp_year` (integer)
  - `is_default` (boolean)

- **billing_cycle_changes** table **NEW TABLE**
  - `id` (PK)
  - `org_id` (FK)
  - `from_cycle` (monthly, annual)
  - `to_cycle` (monthly, annual)
  - `prorated_amount` (decimal, can be negative for refund)
  - `status` (pending, completed, failed)
  - `created_at` (timestamp)
  - `processed_at` (timestamp, nullable)

### Prorated Calculation Service

**Function**: `calculateProration(currentPlan, newCycle, currentPeriodEnd)`

```
if (newCycle === 'annual' && currentCycle === 'monthly'):
  remainingDays = (currentPeriodEnd - today).days
  monthlyPrice = currentPlan.usersCount × 50
  monthlyDaily = monthlyPrice / 30
  monthlyCredit = monthlyDaily × remainingDays
  annualPrice = currentPlan.usersCount × 510
  netCharge = annualPrice - monthlyCredit
  return { monthlyCredit, annualPrice, netCharge, remainingDays }

if (newCycle === 'monthly' && currentCycle === 'annual'):
  remainingDays = (currentPeriodEnd - today).days
  annualPrice = currentPlan.usersCount × 510
  annualDaily = annualPrice / 365
  annualCredit = annualDaily × remainingDays
  monthlyPrice = currentPlan.usersCount × 50
  netCharge = monthlyPrice - annualCredit
  return { annualCredit, monthlyPrice, netCharge, remainingDays }
```

### Stripe Integration

- **Product Setup**: Create 2 Stripe products (Premium Monthly, Premium Annual)
- **Billing Cycle Change**: Use `Stripe.UpdateSubscription()` to switch price + calculate proration
- **Webhooks**: Listen for:
  - `customer.subscription.updated` (cycle change completed)
  - `invoice.created` (new invoice for cycle change)
  - `payment_intent.succeeded` (cycle change payment success)
  - `payment_intent.failed` (cycle change payment failed)

### Usage Calculation

- Real-time query (count active users, sum storage, count API calls in current month)
- Cache for 5 minutes (Redis)

### RLS Policies

- All billing data filtered by `org_id` automatically
- Only Super Admin / Admin can change billing cycle and plan
- Manager can view billing history but not change cycle

### Caching

- Cache current plan + usage for 5 minutes (Redis), invalidate on:
  - Plan change
  - Billing cycle change
  - User add/remove
  - Payment method update

---

## User Flows

### Upgrade to Premium (with Cycle Selection)

1. User clicks [Upgrade] on Premium Plan card
2. Plan change modal opens (Premium pre-selected)
3. User selects billing cycle:
   - **Monthly**: Shows "$50/user/month" → 8 users = $400/month
   - **Annual**: Shows "$510/user/year (Save 15%)" → 8 users = $4,080/year (equivalent $425/month)
4. Preview shows total: "8 users × $50/month = $400/month" or equivalent annual
5. User enters payment method (if none on file) → Stripe form
6. User clicks "Upgrade Now"
7. Stripe processes payment ($400 or $4,080 charged immediately)
8. Subscription updated (plan: Premium, billing_cycle: selected, next billing: 30 days or 365 days)
9. Premium modules unlock (NPD, Finance, OEE, Integrations)
10. Toast: "Upgraded to Premium! Choose monthly or annual - you selected [cycle]"
11. Page refreshes → current plan card shows selected cycle + next billing date

### Switch Billing Cycle (Monthly → Annual)

1. User on Premium Monthly plan ($400/month, next billing Jan 15)
2. User clicks [Change to Annual] in Current Plan card
3. Billing cycle change modal opens with:
   - Current: Monthly $400/month, next billing in 18 days
   - New: Annual $4,080/year, next billing in 383 days (365 + 18)
   - Calculation: 18 days remaining = -$240 credit, $4,080 - $240 = $3,840 net charge
4. Modal shows: "Switch to annual billing? Save $480/year! Charge today: $3,840"
5. User checks: "I understand I'm switching to annual billing"
6. User clicks "Change to Annual - $3,840"
7. Stripe charges $3,840 immediately
8. Subscription updated (billing_cycle: annual, next_period_end: Jan 15, 2027)
9. Toast: "Switched to annual billing! Save $480/year."
10. Current Plan card updates → shows "Annual: $4,080/year (Save 15%)", next billing Jan 15, 2027

### Switch Billing Cycle (Annual → Monthly)

1. User on Premium Annual plan ($4,080/year, next billing Jan 15, 2027)
2. User clicks [Change to Monthly] in Current Plan card
3. Billing cycle change modal opens with:
   - Current: Annual $4,080/year, next billing in 365 days
   - New: Monthly $400/month, next billing in 30 days
   - Calculation: 365 days remaining = -$4,080 credit (unused portion), $400 - credit = refund $3,680
4. Modal shows: "Switch to monthly billing? Refund: $3,680. First monthly charge: $400 on Jan 15."
5. User checks: "I understand I'm switching to monthly billing"
6. User clicks "Change to Monthly - Refund $3,680"
7. Stripe processes refund $3,680 immediately
8. Subscription updated (billing_cycle: monthly, next_period_end: Jan 15, 2026)
9. Toast: "Switched to monthly billing. First charge $400 on Jan 15."
10. Current Plan card updates → shows "Monthly: $400/month", next billing Jan 15, 2026

### Update Payment Method

1. User clicks [Update Payment Method] in Payment Method card
2. Payment form modal opens (Stripe Elements embedded)
3. User enters new card (number, expiry, CVC, billing address)
4. User clicks "Save Payment Method"
5. Stripe validates card (test $0.01 charge, refund)
6. Payment method saved (Stripe payment_method_id stored)
7. Modal closes
8. Toast: "Payment method updated (Visa •••• 1234)"
9. Payment Method card refreshes → shows new card

### Download Invoice

1. User clicks [Download] on Dec 15, 2025 invoice row
2. API generates PDF invoice (header: org name/address, line items, taxes, total, billing cycle type)
3. PDF downloads to device (filename: MonoPilot_Invoice_2025-12-001.pdf)
4. Toast: "Invoice downloaded"

### Payment Failed (Error Flow)

1. Stripe webhook: payment_intent.failed (card declined)
2. System sets invoice status: Failed
3. System sends email: "Payment failed for $400.00 invoice (card declined)"
4. User logs in → red alert banner at top of page
5. Alert: "Payment method declined. Update payment to avoid service interruption. Grace period: 7 days."
6. User clicks [Update Payment Method]
7. User enters new card → saves → payment retries automatically
8. Stripe webhook: payment_intent.succeeded
9. Invoice status: Paid
10. Alert banner removed
11. Toast: "Payment successful. Invoice paid."

### Billing Cycle Change Failed

1. User attempts cycle change (monthly → annual)
2. Modal shows calculation: $3,840 charge
3. User clicks "Change to Annual"
4. Stripe payment fails (card declined, insufficient funds, etc.)
5. Modal shows error: "Payment failed. Your card was declined. Try a different card or contact support."
6. [Retry with Different Card] or [Update Payment Method] buttons
7. User fixes issue and retries
8. Stripe charge succeeds
9. Subscription cycle updated
10. Toast: "Billing cycle changed successfully!"

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [SET-028-subscription-billing]
**Iterations Used**: 1
**Ready for Handoff**: Yes
**Changes Made**:
- Added Billing Cycle Selector with radio buttons (Monthly/Annual)
- Added savings calculation and display ($480/year for 8 users)
- Added Billing Cycle Change Confirmation Modal with prorated calculations
- Added billing cycle to Available Plans display
- Updated pricing model with annual option and discount details
- Added FR-SET-102 compliance: Full billing cycle management

---

**Status**: Approved for FRONTEND-DEV handoff

