# SET-028: Subscription & Billing

**Module**: Settings
**Feature**: Subscription Management & Billing
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-11

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
│  │    $50/user/month × 8 active users                            │   │
│  │    Current bill: $400/month                                   │   │
│  │                                                               │   │
│  │    Next billing: January 15, 2026                             │   │
│  │    Payment method: Visa •••• 4242                             │   │
│  │                                                               │   │
│  │    [Change Plan]  [Update Payment Method]                     │   │
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
│  │    $50/user/month                                             │   │
│  │    • All Free features                                        │   │
│  │    • Premium modules: NPD, Finance, OEE, Integrations         │   │
│  │    • Unlimited users                                          │   │
│  │    • 50 GB storage                                            │   │
│  │    • Priority support (24h response)                          │   │
│  │    • API access + Webhooks                                    │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

Interactions:
- [Change Plan]: Opens plan selection modal (upgrade/downgrade options)
- [Update Payment Method]: Opens Stripe payment form modal
- [Download]: Downloads invoice PDF (single invoice)
- [View Details]: Expands inline invoice detail (line items, taxes)
- [+Add Users]: Opens user invitation flow, increases next bill preview
- Progress bars: Visual usage indicators (green <80%, orange 80-95%, red >95%)
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
│                Error: PAYMENT_DECLINED (card expired)                 │
│                                                                       │
│      [Update Payment Method]  [Contact Billing Support]               │
│                                                                       │
│  Grace period: 7 days remaining (service active until Dec 22, 2025)   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Current Plan Card** - Plan name (Free/Premium), price breakdown ($/user × N users), next billing date, payment method preview
2. **Usage Meters** - Active users (count/limit, progress bar), storage (GB used/total), API calls (count/limit), color-coded thresholds
3. **Billing History Table** - Date, Amount, Status (Paid/Failed/Pending), Download + View Details actions, paginated (10/page)
4. **Payment Method Card** - Card brand + last 4 digits, expiration date, Update/Add Backup buttons
5. **Available Plans Panel** - Free plan features, Premium plan features, pricing, [Upgrade]/[Downgrade] buttons
6. **Invoice Download** - Single invoice PDF download, bulk "Download All Invoices" (ZIP file)
7. **Plan Change Modal** - Select new plan, preview new price, confirm billing cycle change, payment authorization
8. **Payment Form Modal** - Stripe embedded form, card input, billing address, save for future use checkbox
9. **Usage Alerts** - Warning badges when approaching limits (>80% users, >90% storage, >95% API calls)
10. **Billing Contact** - "Questions? Contact billing@monopilot.app" footer link

---

## Main Actions

### Primary
- **[Change Plan]** - Opens plan selection modal → preview new price → confirm → process immediately (pro-rated)
- **[Update Payment Method]** - Opens Stripe payment form → validates card → saves new default → confirms
- **[Download Invoice]** - Generates PDF invoice (header: org info, line items, taxes, total) → downloads to device

### Secondary
- **[+Add Users]** - Redirects to user invitation screen (SET-010), updates usage preview
- **[Upgrade]** - Shortcut to upgrade to Premium plan (pre-selects Premium in plan change modal)
- **[Downgrade]** - Opens plan change modal with Free plan selected, warns about feature loss
- **[View Details]** - Expands inline invoice detail (line items: 8 users × $50, taxes, subtotal, total)
- **[Add Backup Card]** - Opens payment form, saves secondary card (used if primary fails)

### Validation/Warnings
- **Payment Failed** - Red alert banner at top, "Update payment method" CTA, grace period countdown
- **Usage Limit Approaching** - Orange warning badge on usage meter (e.g., "7/10 users - nearing limit")
- **Downgrade Confirmation** - "Downgrading to Free will disable NPD, Finance, OEE, Integrations. Continue?"
- **Pro-Rated Billing** - "Upgrading mid-cycle will charge $X.XX (pro-rated for Y days). Confirm?"

---

## States

- **Loading**: Skeleton cards (current plan, usage, billing history), "Loading subscription details..." text
- **Empty**: Free plan card, "No billing history", "Explore Premium Features" CTA, current usage stats (no payment method)
- **Error**: Payment failed alert, grace period countdown, "Update Payment Method" + "Contact Support" buttons, current plan still visible
- **Success**: Current plan card, usage meters, billing history table, payment method card, available plans panel

---

## Pricing Model

### Free Plan
- **Price**: $0/month
- **Features**: Core modules (Technical, Planning, Production, Warehouse, Quality, Shipping)
- **Limits**: 3 users, 1 GB storage, 10,000 API calls/month
- **Support**: Community support (48h response)

### Premium Plan
- **Price**: $50/user/month (billed monthly or annually with 15% discount)
- **Features**: All Free + NPD, Finance, OEE, Integrations modules
- **Limits**: Unlimited users, 50 GB storage, 100,000 API calls/month
- **Support**: Priority support (24h response), dedicated account manager (>20 users)

### Enterprise Plan (Custom)
- **Price**: Custom (contact sales)
- **Features**: All Premium + on-premise deployment, custom integrations, SLA guarantees
- **Support**: 24/7 phone support, dedicated CSM

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
1. User clicks [Upgrade]
2. Modal: Select Premium plan → preview price ($50/user × current users)
3. Enter payment method (if none on file)
4. Confirm upgrade → immediate charge (pro-rated if mid-cycle)
5. Premium modules unlock automatically (NPD, Finance, OEE, Integrations)
6. Toast: "Upgraded to Premium! NPD, Finance, OEE, Integrations are now available."

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

---

## Permissions

| Role | Can View | Can Change Plan | Can Update Payment | Can Download Invoices |
|------|----------|-----------------|--------------------|-----------------------|
| Super Admin | Yes | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes | Yes |
| Manager | Yes (usage only) | No | No | Yes |
| Operator | No | No | No | No |
| Viewer | No | No | No | No |

---

## Validation Rules

- **Plan Change**: Require payment method on file (if upgrading to Premium)
- **Payment Method Update**: Validate card via Stripe (test charge $0.01, refund immediately)
- **Downgrade**: Warn if active data in premium modules (e.g., "12 active NPD projects will be hidden")
- **User Limit (Free)**: Enforce 3-user cap (deactivate excess users on downgrade, admin selects which)
- **Invoice Download**: Only show invoices for current org (RLS by org_id)
- **Payment Failed**: Grace period 7 days → after 7 days, downgrade to Free automatically

---

## Accessibility

- **Touch targets**: All buttons >= 48x48dp, invoice rows >= 48dp height
- **Contrast**: Usage meters pass WCAG AA (green/orange/red with text labels, not color-only)
- **Screen reader**: "Current plan: Premium, $50 per user per month, 8 users, $400 total, next billing January 15, 2026"
- **Keyboard**: Tab navigation, Enter to activate buttons, Space to select plan in modal
- **Focus indicators**: Clear 2px outline on all interactive elements
- **Color independence**: Status icons + text labels (Paid ✓, Failed ⚠, Pending ⏳)

---

## Related Screens

- **Plan Change Modal**: Select plan (Free/Premium/Enterprise), preview price, confirm billing cycle
- **Payment Form Modal**: Stripe Elements form (card number, expiry, CVC, billing address)
- **Invoice Detail Panel**: Inline expansion (line items, taxes, subtotal, total, payment method)
- **User Invitation (SET-010)**: [+Add Users] redirects here, usage preview updates on return
- **Module Toggles (SET-022)**: Premium modules unlock/lock based on subscription status

---

## Technical Notes

- **API**: `GET /api/settings/subscription` → returns current plan, usage, billing history
- **API**: `PUT /api/settings/subscription/plan` → body: `{plan_id, payment_method_id}` → upgrades/downgrades
- **API**: `POST /api/settings/subscription/payment-method` → body: Stripe token → saves payment method
- **API**: `GET /api/settings/subscription/invoices/:id/download` → generates PDF invoice
- **Database**: `org_subscriptions` table (org_id, plan_id, status, current_period_start, current_period_end, payment_method_id)
- **Database**: `invoices` table (id, org_id, amount, status, issued_at, paid_at, invoice_number, line_items[])
- **Database**: `payment_methods` table (id, org_id, stripe_payment_method_id, brand, last4, exp_month, exp_year)
- **Stripe Integration**: Use Stripe Checkout for upgrades, Stripe Elements for payment method updates
- **Webhooks**: Listen for Stripe events (payment_intent.succeeded, payment_intent.failed, invoice.paid)
- **Usage Calculation**: Real-time query (count active users, sum storage, count API calls in current month)
- **Pro-Rated Billing**: Calculate via Stripe Billing (automatic pro-ration on plan change)
- **RLS**: All billing data filtered by `org_id` automatically
- **Caching**: Cache current plan + usage for 5 minutes (Redis), invalidate on plan change or user add/remove

---

## User Flows

### Upgrade to Premium
1. User clicks [Upgrade] on Premium Plan card
2. Plan change modal opens (Premium pre-selected)
3. Preview shows: "8 users × $50/month = $400/month (billed monthly)"
4. User enters payment method (Stripe form)
5. User clicks "Upgrade Now"
6. Stripe processes payment ($400 charged immediately)
7. Subscription updated (plan: Premium, next billing: 30 days from now)
8. Premium modules unlock (NPD, Finance, OEE, Integrations badges removed from SET-022)
9. Toast: "Upgraded to Premium! 4 new modules unlocked."
10. Page refreshes → current plan card shows Premium

### Update Payment Method
1. User clicks [Update Payment Method]
2. Payment form modal opens (Stripe Elements embedded)
3. User enters new card (number, expiry, CVC)
4. User clicks "Save Payment Method"
5. Stripe validates card (test $0.01 charge, refund)
6. Payment method saved (Stripe payment_method_id stored)
7. Modal closes
8. Toast: "Payment method updated (Visa •••• 1234)"
9. Payment method card refreshes → shows new card

### Download Invoice
1. User clicks [Download] on Dec 15, 2025 invoice row
2. API generates PDF invoice (header: org name/address, line items, taxes, total)
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

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [SET-028-subscription-billing]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV handoff
