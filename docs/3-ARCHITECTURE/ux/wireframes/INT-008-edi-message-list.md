# INT-008: EDI Message List

**Module**: Integrations
**Feature**: EDI Message Management (ORDERS/INVOIC/DESADV)
**Status**: Draft
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  EDI Messages                                           [+ Send Test Message]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [Search messages...        ] [Type: All ▼] [Direction: All ▼] [Status: All ▼]│
│  [Partner: All ▼] [Time Range: Last 7d ▼]                 [🔄 Auto-refresh] │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Time      Type     Direction  Partner          Status      Details      │ │
│  │                                                                          │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ 14:23:45  ORDERS   Inbound    Retail Co.       ✓ Processed  Order #1234│ │
│  │ Jan 15              850                                      [View]     │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ 14:15:12  DESADV   Outbound   Warehouse Inc.   ✓ Sent       Shipment   │ │
│  │ Jan 15              856                          Ack received [View]     │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ 13:45:33  INVOIC   Outbound   Retail Co.       ⏳ Pending   Invoice     │ │
│  │ Jan 15              810                          Awaiting ack [View]     │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ 13:30:09  ORDERS   Inbound    BigBox Store     ⚠️ Warning   Order #5678│ │
│  │ Jan 15              850                          Qty warning  [View]     │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ 12:58:21  ORDRSP   Outbound   Retail Co.       ✓ Sent       Ord confirm│ │
│  │ Jan 15              855                          Ack received [View]     │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ 12:15:44  ORDERS   Inbound    Local Market     ✗ Failed     Parse error │ │
│  │ Jan 15              850                          Invalid seg  [View][Fix]│ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ 11:45:02  DESADV   Outbound   Warehouse Inc.   ✓ Sent       Shipment   │ │
│  │ Jan 15              856                          Ack received [View]     │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  Showing 7 of 234 messages                                   [1] 2 3 ... 12  │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### EDI Message Detail Modal

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  EDI Message Details: ORDERS (850)                             [X Close]     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Message Information                                                       │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ Message ID: EDI-2026-001234              Status: ✓ Processed             │ │
│  │ Type: ORDERS (850 - Purchase Order)      Direction: Inbound              │ │
│  │ Trading Partner: Retail Co.              Interchange ID: 123456789       │ │
│  │ Received: Jan 15, 2026 14:23:45          Processed: Jan 15, 2026 14:23:47│ │
│  │ Control Number: 000001234                Processing Time: 2.3s           │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Processing Summary                                                        │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ ✓ EDI syntax validation passed                                           │ │
│  │ ✓ Business rules validation passed                                       │ │
│  │ ✓ Order created: ORD-001234                                              │ │
│  │ ✓ Acknowledgment sent (997 - Functional Acknowledgment)                  │ │
│  │ ✓ Order response sent (855 - Purchase Order Acknowledgment)              │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Extracted Data                                                            │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ Customer PO: PO-RETAIL-2026-045                                           │ │
│  │ Order Date: 2026-01-15                                                    │ │
│  │ Requested Delivery: 2026-01-20                                            │ │
│  │ Ship To: Retail Co. Distribution Center, 789 Warehouse Blvd               │ │
│  │                                                                           │ │
│  │ Line Items: 5 items                                                       │ │
│  │ - GTIN 00012345678905 (Chocolate Bars 24pk) × 200 boxes                   │ │
│  │ - GTIN 00012345678912 (Gummy Bears 500g) × 150 bags                       │ │
│  │ - GTIN 00012345678929 (Hard Candy Mix 1kg) × 100 bags                     │ │
│  │ - GTIN 00012345678936 (Lollipops 50pk) × 80 boxes                         │ │
│  │ - GTIN 00012345678943 (Fruit Chews 250g) × 120 bags                       │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Raw EDI Message (X12 Format)                            [📋 Copy]        │ │
│  ├──────────────────────────────────────────────────────────────────────────┤ │
│  │ ISA*00*          *00*          *ZZ*RETAILCO      *ZZ*ACMEMFG       *260115│ │
│  │ *1423*U*00401*000001234*0*P*>~                                            │ │
│  │ GS*PO*RETAILCO*ACMEMFG*20260115*1423*1234*X*004010~                       │ │
│  │ ST*850*0001~                                                              │ │
│  │ BEG*00*SA*PO-RETAIL-2026-045**20260115~                                   │ │
│  │ REF*DP*001~                                                               │ │
│  │ DTM*002*20260120~                                                         │ │
│  │ N1*ST*Retail Co. Distribution Center~                                     │ │
│  │ N3*789 Warehouse Blvd~                                                    │ │
│  │ N4*City*ST*12345~                                                         │ │
│  │ PO1*1*200*EA*18.50**UP*00012345678905~                                    │ │
│  │ PID*F****Chocolate Bars 24pk~                                             │ │
│  │ PO1*2*150*EA*12.30**UP*00012345678912~                                    │ │
│  │ PID*F****Gummy Bears 500g~                                                │ │
│  │ CTT*5~                                                                    │ │
│  │ SE*15*0001~                                                               │ │
│  │ GE*1*1234~                                                                │ │
│  │ IEA*1*000001234~                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  [Download Raw EDI]  [View Related Order]  [Resend Acknowledgment]  [Close]  │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  EDI Messages                                           [+ Send Test Message]│
├─────────────────────────────────────────────────────────────────────────────┤
│  [████████░░░░░░] [Type ▼] [Direction ▼] [Status ▼] [Partner ▼] [Time ▼]   │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │ │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  Loading EDI messages...                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  EDI Messages                                           [+ Send Test Message]│
├─────────────────────────────────────────────────────────────────────────────┤
│                          [📨 Icon]                                            │
│                       No EDI Messages Found                                   │
│       No EDI messages for the selected filters.                              │
│       Try adjusting your filters or time range.                              │
│                                                                               │
│                       [Clear Filters]                                         │
│                                                                               │
│       View EDI Setup Guide  |  Configure Trading Partners                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  EDI Messages                                           [+ Send Test Message]│
├─────────────────────────────────────────────────────────────────────────────┤
│                          [⚠ Icon]                                             │
│                    Failed to Load EDI Messages                                │
│        Unable to retrieve EDI messages. Check your connection.                │
│                    Error: EDI_MESSAGES_FETCH_FAILED                           │
│                       [Retry]  [Contact Support]                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

1. **Data Table** - Timestamp, Message Type (ORDERS/INVOIC/DESADV/ORDRSP), Direction (Inbound/Outbound), Trading Partner, Status (icon + label), Details (summary), [View] button
2. **Search/Filter Bar** - Text search (message ID, partner), type filter, direction filter, status filter, partner dropdown, time range dropdown
3. **Auto-refresh Toggle** - Checkbox to enable/disable auto-refresh (every 30s)
4. **Send Test Message Button** - Opens modal to send test EDI message (for testing integrations)
5. **Status Icons** - ✓ Processed/Sent (green), ⏳ Pending (gray), ⚠️ Warning (yellow), ✗ Failed (red)
6. **Message Detail Modal** - Full message info, processing summary, extracted data, raw EDI (X12 or EDIFACT)
7. **EDI Type Badges** - Color-coded by type (ORDERS blue, INVOIC green, DESADV orange, ORDRSP purple)
8. **Raw EDI Viewer** - Monospace font, syntax highlighting (optional), copy button

---

## Main Actions

### Primary
- **[+ Send Test Message]** - Opens modal to compose and send test EDI message (for integration testing)
- **[View]** - Opens message detail modal (full info + raw EDI)

### Secondary (Row Actions - via [⋮] menu)
- **View Details** - Opens detail modal
- **Download Raw EDI** - Downloads raw EDI file (.x12 or .edi)
- **View Related Order/Invoice/Shipment** - Opens related business document
- **Resend Message** - Resends outbound message (confirmation required)
- **Resend Acknowledgment** - Resends 997/CONTRL acknowledgment

### Filters/Search
- **Search** - Real-time filter by message ID, partner name, order number
- **Filter by Type** - All, ORDERS (850), INVOIC (810), DESADV (856), ORDRSP (855), CONTRL (997)
- **Filter by Direction** - All, Inbound, Outbound
- **Filter by Status** - All, Processed, Sent, Pending, Warning, Failed
- **Filter by Partner** - Dropdown (All, or specific trading partner)
- **Filter by Time Range** - Last 1h, 24h, 7d, 30d, Custom

---

## States

- **Loading**: Skeleton rows (8), "Loading EDI messages..." text
- **Empty**: "No EDI messages found" message, "Clear Filters" button, setup guide links
- **Error**: "Failed to load EDI messages" warning, error code, Retry + Contact Support
- **Success**: Table with message rows, filter controls, pagination
- **Auto-refresh Active**: Visual indicator (spinning icon) when enabled
- **Processing**: Status updates in real-time via WebSocket

---

## Data Fields

**EDI Messages**:
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Message ID |
| message_type | enum | ORDERS, INVOIC, DESADV, ORDRSP, CONTRL, etc. |
| direction | enum | inbound, outbound |
| partner_id | uuid | Trading partner reference |
| partner_name | string | Cached for display |
| status | enum | processed, sent, pending, warning, failed |
| interchange_id | string | ISA control number (X12) or UNB reference (EDIFACT) |
| control_number | string | GS/ST control number |
| received_at | timestamp | Inbound message timestamp |
| sent_at | timestamp | Outbound message timestamp |
| processed_at | timestamp | Processing completion timestamp |
| raw_edi | text | Full EDI message (X12 or EDIFACT format) |
| extracted_data | jsonb | Parsed business data (order/invoice/shipment details) |
| error_message | text | Error details (if failed) |
| related_doc_id | uuid | Related order/invoice/shipment ID |
| related_doc_type | enum | order, invoice, shipment |

---

## EDI Message Types (X12)

**Inbound** (from trading partners):
- **850 - ORDERS**: Purchase Order (creates order in MonoPilot)
- **860 - ORDCHG**: Purchase Order Change (updates existing order)
- **997 - CONTRL**: Functional Acknowledgment (confirms receipt of outbound message)

**Outbound** (to trading partners):
- **810 - INVOIC**: Invoice (sends invoice for completed order)
- **855 - ORDRSP**: Purchase Order Acknowledgment (confirms order receipt/acceptance)
- **856 - DESADV**: Advance Ship Notice (ASN, notifies shipment details)
- **997 - CONTRL**: Functional Acknowledgment (confirms receipt of inbound message)

---

## EDI Processing Flow

**Inbound (850 ORDERS)**:
1. Receive EDI message via VAN/AS2/SFTP
2. Validate EDI syntax (ISA, GS, ST segments)
3. Parse segments (BEG, REF, DTM, N1, PO1, etc.)
4. Validate business rules (GTIN exists, prices match, etc.)
5. Create order in MonoPilot
6. Send 997 acknowledgment (functional ack)
7. Send 855 order response (accept/reject)

**Outbound (856 DESADV)**:
1. Shipment created in MonoPilot
2. Generate 856 segments (BSN, HL, TD5, REF, MAN, etc.)
3. Validate EDI syntax
4. Send to trading partner via VAN/AS2/SFTP
5. Wait for 997 acknowledgment (timeout 24h)

---

## Validation

- **Search**: Max 100 chars
- **Time Range**: Custom range max 90 days
- **Auto-refresh**: Max enabled duration 1 hour (auto-disable after)

---

## Accessibility

- **Touch targets**: All buttons/filters >= 48x48dp
- **Contrast**: Status colors pass WCAG AA
- **Screen reader**: Row announces "EDI message: {type} {direction} from {partner} at {time}, Status: {status}, {details}"
- **Keyboard**: Tab navigation, Enter to open details modal
- **Monospace Font**: Raw EDI displayed in monospace for readability

---

## Related Screens

- **INT-001**: Integrations Dashboard (EDI integration card)
- **INT-003**: Integration Logs (EDI send/receive events logged)
- **INT-010**: Retry Logic & DLQ (failed EDI messages)

---

## Technical Notes

- **RLS**: EDI messages filtered by `org_id`
- **API**:
  - `GET /api/integrations/edi/messages?type={type}&direction={direction}&status={status}&partner={id}&time_range={range}&search={query}&page={N}`
  - `GET /api/integrations/edi/messages/{id}` (message details)
  - `POST /api/integrations/edi/messages/{id}/resend` (resend outbound message)
  - `POST /api/integrations/edi/messages/{id}/resend-ack` (resend 997)
  - `GET /api/integrations/edi/messages/{id}/download` (download raw EDI)
  - `POST /api/integrations/edi/test` (send test message)
- **EDI Parser**: Custom parser for X12 (or library like node-x12)
- **EDI Generator**: Template-based generation (850, 810, 855, 856, 997)
- **Transport**: VAN (Value Added Network), AS2 (secure protocol), SFTP
- **Real-time**: Subscribe to message updates via Supabase Realtime
- **Pagination**: 20 messages per page
- **Auto-refresh**: Polls every 30s when enabled
- **Retention**: Messages kept for 7 years (compliance requirement)

---

**Status**: Draft - Ready for Review
