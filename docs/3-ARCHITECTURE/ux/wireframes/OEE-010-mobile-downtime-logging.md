# OEE-010: Mobile Downtime Logging (Scanner UI)

**Module**: OEE (Overall Equipment Effectiveness)
**Feature**: Mobile-First Downtime Event Logging (PRD Section 10.10)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## ASCII Wireframe

### Success State (Mobile: Scanner UI)

```
+----------------------------------+
|  < Downtime Logging              |
|  [Scan Machine]                  |
+----------------------------------+
|                                  |
|  📷 Scan Machine Barcode         |
|  +----------------------------+  |
|  |                            |  |
|  |      ┌─────────────┐       |  |
|  |      │░░░░░░░░░░░░░│       |  |
|  |      │░░░░░░░░░░░░░│       |  |
|  |      │░░░▆▆▆▆▆░░░░░│       |  |
|  |      │░░░▆░░░▆░░░░░│       |  |
|  |      │░░░▆▆▆▆▆░░░░░│       |  |
|  |      │░░░░░░░░░░░░░│       |  |
|  |      │░░░░░░░░░░░░░│       |  |
|  |      └─────────────┘       |  |
|  |                            |  |
|  |  Point camera at machine   |  |
|  |  barcode to scan           |  |
|  +----------------------------+  |
|                                  |
|  Or select manually:             |
|  +----------------------------+  |
|  | [Mixer Line 1          v]  |  |
|  +----------------------------+  |
|                                  |
|  Recent Machines:                |
|  [Packaging 1] [Oven 1] [Mixer]  |
|                                  |
+----------------------------------+
```

### Machine Scanned / Selected

```
+----------------------------------+
|  < Downtime Logging              |
|  Packaging Line 1                |
+----------------------------------+
|                                  |
|  Machine Info                    |
|  +----------------------------+  |
|  | 📦 Packaging Line 1        |  |
|  | Status: 🟢 Running         |  |
|  | Current WO: WO-2026-00145  |  |
|  | Product: Vegan Nuggets     |  |
|  | Running: 4h 23m            |  |
|  +----------------------------+  |
|                                  |
|  Event Type:                     |
|  +----------------------------+  |
|  | (•) Start Downtime Event   |  |
|  | ( ) Resolve Active Event   |  |
|  +----------------------------+  |
|                                  |
|  [Continue]                      |
|                                  |
+----------------------------------+
```

### Start Downtime Event - Step 1 (Reason)

```
+----------------------------------+
|  < Log Downtime Event            |
|  Step 1 of 3: Reason             |
+----------------------------------+
|                                  |
|  Machine: Packaging Line 1       |
|  WO: WO-2026-00145               |
|                                  |
|  Downtime Reason: *              |
|  +----------------------------+  |
|  | Search reasons...          |  |
|  +----------------------------+  |
|                                  |
|  Common Reasons:                 |
|  +----------------------------+  |
|  | [Mechanical Breakdown]     |  |
|  | Equipment Failure          |  |
|  +----------------------------+  |
|  +----------------------------+  |
|  | [Minor Jam/Blockage]       |  |
|  | Equipment Failure          |  |
|  +----------------------------+  |
|  +----------------------------+  |
|  | [Waiting for Material]     |  |
|  | Material Issue             |  |
|  +----------------------------+  |
|  +----------------------------+  |
|  | [Changeover]               |  |
|  | Planned Downtime           |  |
|  +----------------------------+  |
|  +----------------------------+  |
|  | [Quality Check Hold]       |  |
|  | Process Issue              |  |
|  +----------------------------+  |
|                                  |
|  [View All Reasons (15)]         |
|                                  |
|  [Cancel] [Next: Details →]      |
|                                  |
+----------------------------------+
```

### Start Downtime Event - Step 2 (Details)

```
+----------------------------------+
|  < Log Downtime Event            |
|  Step 2 of 3: Details            |
+----------------------------------+
|                                  |
|  Machine: Packaging Line 1       |
|  Reason: Mechanical Breakdown    |
|                                  |
|  Start Time: *                   |
|  +----------------------------+  |
|  | [2026-01-15] [09:15] AM    |  |
|  | [✓] Use Current Time       |  |
|  +----------------------------+  |
|                                  |
|  Status: *                       |
|  +----------------------------+  |
|  | (•) Active (ongoing)       |  |
|  | ( ) Resolved (ended)       |  |
|  +----------------------------+  |
|                                  |
|  Description: *                  |
|  +----------------------------+  |
|  | Conveyor motor stopped     |  |
|  | working. Motor overheated  |  |
|  | and shut down.             |  |
|  |                            |  |
|  | (Min 20 characters)        |  |
|  +----------------------------+  |
|  120/500 characters              |
|                                  |
|  📷 Add Photos (Optional)        |
|  +------+  +------+              |
|  |[📷+] |  |[    ]|              |
|  +------+  +------+              |
|                                  |
|  [Cancel] [Next: Review →]       |
|                                  |
+----------------------------------+
```

### Start Downtime Event - Step 3 (Review & Submit)

```
+----------------------------------+
|  < Log Downtime Event            |
|  Step 3 of 3: Review & Submit    |
+----------------------------------+
|                                  |
|  Review Event Details            |
|  +----------------------------+  |
|  | Machine:                   |  |
|  | Packaging Line 1           |  |
|  |                            |  |
|  | Reason:                    |  |
|  | Mechanical Breakdown       |  |
|  | (Equipment Failure)        |  |
|  |                            |  |
|  | Start Time:                |  |
|  | Jan 15, 2026 9:15 AM       |  |
|  |                            |  |
|  | Status:                    |  |
|  | 🔴 Active (ongoing)        |  |
|  |                            |  |
|  | Description:               |  |
|  | Conveyor motor stopped     |  |
|  | working. Motor overheated  |  |
|  | and shut down.             |  |
|  |                            |  |
|  | Photos: 1 attached         |  |
|  |                            |  |
|  | Logged By:                 |  |
|  | John Smith                 |  |
|  +----------------------------+  |
|                                  |
|  Notifications:                  |
|  [✓] Notify Production Manager   |
|  [✓] Notify Maintenance Team     |
|                                  |
|  [Cancel] [← Back] [Submit Event]|
|                                  |
+----------------------------------+
```

### Event Logged Successfully

```
+----------------------------------+
|  Event Logged Successfully ✓     |
+----------------------------------+
|                                  |
|            [✓ Icon]              |
|                                  |
|  Downtime Event Created          |
|                                  |
|  Machine: Packaging Line 1       |
|  Reason: Mechanical Breakdown    |
|  Status: Active                  |
|  Start Time: 9:15 AM             |
|                                  |
|  Event ID: DT-2026-00158         |
|                                  |
|  +----------------------------+  |
|  | Production Manager notified|  |
|  | Maintenance Team notified  |  |
|  +----------------------------+  |
|                                  |
|  What's next?                    |
|  • Machine status updated to    |  |
|    "Down" in system              |  |
|  • Maintenance team alerted     |  |
|  • WO auto-paused               |  |
|                                  |
|  [View Event] [Log Another]      |
|  [← Back to Dashboard]           |
|                                  |
+----------------------------------+
```

### Resolve Active Event - Step 1 (Select Event)

```
+----------------------------------+
|  < Resolve Downtime Event        |
|  Select Event                    |
+----------------------------------+
|                                  |
|  Machine: Packaging Line 1       |
|                                  |
|  Active Downtime Events:         |
|  +----------------------------+  |
|  | DT-2026-00158 🔴           |  |
|  | Mechanical Breakdown       |  |
|  | Started: 9:15 AM           |  |
|  | Duration: 48 minutes       |  |
|  | [Select]                   |  |
|  +----------------------------+  |
|                                  |
|  [Cancel]                        |
|                                  |
+----------------------------------+
```

### Resolve Active Event - Step 2 (Resolution Details)

```
+----------------------------------+
|  < Resolve Downtime Event        |
|  Resolution Details              |
+----------------------------------+
|                                  |
|  Event: DT-2026-00158            |
|  Machine: Packaging Line 1       |
|  Reason: Mechanical Breakdown    |
|  Started: 9:15 AM                |
|  Duration: 48 minutes            |
|                                  |
|  End Time: *                     |
|  +----------------------------+  |
|  | [2026-01-15] [10:03] AM    |  |
|  | [✓] Use Current Time       |  |
|  +----------------------------+  |
|                                  |
|  Total Duration: 48 minutes      |
|  (Auto-calculated)               |
|                                  |
|  Corrective Action: *            |
|  +----------------------------+  |
|  | Replaced conveyor motor    |  |
|  | (Part #: MOT-2024-456).    |  |
|  | Tested new motor at full   |  |
|  | load for 5 minutes.        |  |
|  | Production ready.          |  |
|  | (Min 20 characters)        |  |
|  +----------------------------+  |
|  142/500 characters              |
|                                  |
|  📷 Add Resolution Photos        |
|  +------+  +------+              |
|  |[📷+] |  |[    ]|              |
|  +------+  +------+              |
|                                  |
|  Follow-up Actions:              |
|  [✓] Create maintenance task     |
|  [ ] Schedule equipment review   |
|  [✓] Notify production manager   |
|                                  |
|  [Cancel] [Resolve Event]        |
|                                  |
+----------------------------------+
```

### Event Resolved Successfully

```
+----------------------------------+
|  Event Resolved Successfully ✓   |
+----------------------------------+
|                                  |
|            [✓ Icon]              |
|                                  |
|  Downtime Event Resolved         |
|                                  |
|  Machine: Packaging Line 1       |
|  Event: DT-2026-00158            |
|  Duration: 48 minutes            |
|                                  |
|  +----------------------------+  |
|  | Machine status: 🟢 Running |  |
|  | WO auto-resumed            |  |
|  | Maintenance task created   |  |
|  +----------------------------+  |
|                                  |
|  Impact Summary:                 |
|  • Production loss: ~400 units  |  |
|  • Downtime: 48 minutes         |  |
|  • Availability impact: -10%    |  |
|                                  |
|  [View Event History]            |
|  [Log Another Event]             |
|  [← Back to Dashboard]           |
|                                  |
+----------------------------------+
```

### Quick View - Active Events List

```
+----------------------------------+
|  < Active Downtime Events        |
|  All Machines                    |
+----------------------------------+
|                                  |
|  Active Events (3)               |
|                                  |
|  +----------------------------+  |
|  | Packaging Line 1       🔴  |  |
|  | Mechanical Breakdown       |  |
|  | Started: 9:15 AM           |  |
|  | Duration: 48 min           |  |
|  | [Resolve]                  |  |
|  +----------------------------+  |
|  +----------------------------+  |
|  | Mixer Line 1           🔴  |  |
|  | Temperature Adjustment     |  |
|  | Started: 10:30 AM          |  |
|  | Duration: 12 min           |  |
|  | [Resolve]                  |  |
|  +----------------------------+  |
|  +----------------------------+  |
|  | Oven Line 1            🔴  |  |
|  | Quality Check Hold         |  |
|  | Started: 11:05 AM          |  |
|  | Duration: 5 min            |  |
|  | [Resolve]                  |  |
|  +----------------------------+  |
|                                  |
|  [← Back] [Log New Event]        |
|                                  |
+----------------------------------+
```

### Offline Mode Notice

```
+----------------------------------+
|  Downtime Logging (Offline)      |
+----------------------------------+
|                                  |
|         [📡 Offline Icon]        |
|                                  |
|  You are currently offline       |
|                                  |
|  Events logged while offline     |
|  will be saved locally and       |
|  synced when connection is       |
|  restored.                       |
|                                  |
|  +----------------------------+  |
|  | Events Pending Sync: 2     |  |
|  | Last Sync: 10:15 AM        |  |
|  +----------------------------+  |
|                                  |
|  You can continue logging        |
|  downtime events.                |
|                                  |
|  [Continue Offline]              |
|  [Retry Connection]              |
|                                  |
+----------------------------------+
```

### Error State

```
+----------------------------------+
|  Error Logging Event             |
+----------------------------------+
|                                  |
|         [⚠️ Icon]                |
|                                  |
|  Failed to Log Event             |
|                                  |
|  Unable to save downtime event.  |
|  Please try again.               |
|                                  |
|  Error: EVENT_LOG_FAILED         |
|                                  |
|  Your event has been saved       |
|  locally and will sync when      |
|  connection is restored.         |
|                                  |
|  [Retry] [Save Offline]          |
|  [← Cancel]                      |
|                                  |
+----------------------------------+
```

---

## Key Components

### 1. Scanner Interface

QR/Barcode scanner for machine identification.

**Features:**
- Camera viewfinder
- Auto-focus and scan
- Manual selection fallback
- Recent machines quick access

### 2. Multi-Step Form Wizard

Progressive disclosure with 3 steps.

**Step 1: Reason Selection**
- Search/filter downtime reasons
- Common reasons (top 5)
- Category badges
- View all link

**Step 2: Event Details**
- Start time (auto-populated or manual)
- Status (Active/Resolved)
- Description (min 20 chars)
- Photo attachment

**Step 3: Review & Submit**
- All details review
- Edit links
- Notification checkboxes
- Submit confirmation

### 3. Active Event Management

List and resolve active events.

**Features:**
- Active events list by machine
- Duration tracker (live update)
- Quick resolve action
- Event filtering

### 4. Offline Support

Local storage with background sync.

**Features:**
- Offline mode detection
- Local event storage
- Sync queue status
- Auto-sync when online

### 5. Photo Attachment

Mobile camera integration.

**Features:**
- Camera capture
- Photo preview
- Multiple photos support
- Compression for upload

### 6. Success Confirmation

Event logged/resolved confirmation.

**Displays:**
- Event ID
- Summary of changes
- System actions taken
- Next steps
- Quick navigation

---

## Main Actions

### Primary Actions

| Action | Location | Behavior |
|--------|----------|----------|
| Scan Machine | Scanner interface | Opens camera to scan barcode |
| Select Machine | Dropdown | Manual machine selection |
| Select Reason | Reason cards | Choose downtime reason |
| Add Photo | Camera button | Capture photo with mobile camera |
| Submit Event | Review step | Create downtime event |
| Resolve Event | Active events list | Resolve active downtime |
| View Event | Success screen | View event details |
| Log Another | Success screen | Start new event |

### Secondary Actions

| Action | Behavior |
|--------|----------|
| Search Reasons | Filter downtime reasons |
| Use Current Time | Auto-populate timestamp |
| Create Task | Generate maintenance task |
| Notify Team | Send notifications |
| Save Offline | Store locally if offline |
| Retry Sync | Attempt to sync offline events |

---

## States

### Loading State
- Scanner initializing
- "Starting camera..." text

### Empty State (Active Events)
- "No Active Downtime Events" message
- [Log New Event] CTA

### Success State
- Event logged/resolved confirmation
- Summary and next steps

### Error State
- Error message
- Retry/Save Offline options
- Local storage fallback

### Offline State
- Offline mode notice
- Pending sync count
- Continue offline option

---

## Data Fields

### Log Event Request

```json
{
  "machine_id": "uuid",
  "reason_code": "MECH_BREAK",
  "start_time": "2026-01-15T09:15:00Z",
  "status": "active",
  "description": "Conveyor motor stopped working...",
  "photos": ["photo_id_1"],
  "notify_production_manager": true,
  "notify_maintenance": true,
  "logged_by_id": "uuid-user"
}
```

### Resolve Event Request

```json
{
  "event_id": "uuid",
  "end_time": "2026-01-15T10:03:00Z",
  "corrective_action": "Replaced conveyor motor...",
  "resolution_photos": ["photo_id_2"],
  "create_maintenance_task": true,
  "notify_production_manager": true
}
```

---

## API Endpoints

### Log Downtime Event

```
POST /api/oee/downtime/events
Content-Type: application/json

Request: { ... } (see Data Fields)
Response: { "event": { ... }, "created_at": "..." }
```

### Resolve Downtime Event

```
PUT /api/oee/downtime/events/:id/resolve
Content-Type: application/json

Request: { ... }
Response: { "event": { ... }, "duration_minutes": 48 }
```

### Get Active Events

```
GET /api/oee/downtime/events/active
Query: ?machine_id=uuid

Response: { "events": [ ... ] }
```

### Upload Photo

```
POST /api/oee/downtime/events/photos
Content-Type: multipart/form-data

Request: File upload
Response: { "photo_id": "uuid", "url": "..." }
```

---

## Permissions

| Role | Log Events | Resolve Events | View Events |
|------|-----------|---------------|-------------|
| Production Manager | Yes | Yes | Yes |
| Operator | Yes | Own only | Yes |
| Maintenance | Yes (equipment) | Yes | Yes |
| Admin | Yes | Yes | Yes |

---

## Validation

### Log Event

| Field | Rule | Error Message |
|-------|------|---------------|
| Machine | Required | "Machine is required" |
| Reason | Required | "Downtime reason is required" |
| Start Time | Required, cannot be future | "Start time cannot be in the future" |
| Description | Min 20 chars | "Description must be at least 20 characters" |

### Resolve Event

| Field | Rule | Error Message |
|-------|------|---------------|
| End Time | Required, after start | "End time must be after start time" |
| Corrective Action | Min 20 chars | "Corrective action required (min 20 characters)" |

---

## Business Rules

### Auto-Pause WO

When downtime event logged:
- If WO is active on machine
- Auto-pause WO
- Set pause reason = downtime reason

### Auto-Resume WO

When downtime resolved:
- If WO was auto-paused
- Auto-resume WO
- Update machine status to Running

### Offline Mode

- Max 50 events stored locally
- Sync priority: FIFO (oldest first)
- Auto-sync every 30 seconds when online
- Conflict resolution: Server wins

### Photo Compression

- Max size: 5MB per photo
- Auto-compress to 1920x1080 max
- JPEG quality: 85%
- Max 3 photos per event

---

## Accessibility

### Touch Targets
- Scanner viewfinder: Full width
- Reason cards: 64x64dp (large, easy tap)
- Buttons: 48x48dp minimum
- Form inputs: 48dp height

### Contrast
- Text: 4.5:1
- Buttons: 3:1
- Scanner overlay: High contrast

### Screen Reader
- **Scanner**: "Point camera at machine barcode to scan"
- **Reason cards**: "Mechanical Breakdown, Equipment Failure category"
- **Status**: "Event logged successfully, Machine status updated to Down"

### Keyboard Navigation
- Not applicable (mobile-only)
- Voice input supported for description

---

## Responsive Design

**Mobile-First**: Designed for mobile only (operators on floor).

| Device | Layout |
|--------|--------|
| **Phone (<768px)** | Primary interface (optimized) |
| **Tablet (768-1024px)** | Larger touch targets, same flow |
| **Desktop (>1024px)** | Redirects to desktop downtime tracking page |

---

## Performance Notes

### Scanner Performance

- Camera initialization: <1s
- Barcode scan recognition: <500ms
- Auto-focus: Continuous

### Offline Storage

```typescript
// IndexedDB schema
{
  events: [
    {
      id: "local-uuid",
      synced: false,
      created_at: "...",
      data: { ... }
    }
  ]
}
```

### Photo Upload

- Background upload queue
- Retry on failure (3 attempts)
- Progress indicator

---

## Testing Requirements

### Unit Tests
```typescript
describe('Mobile Downtime Logging', () => {
  it('validates event fields', async () => {});
  it('stores events offline', async () => {});
  it('syncs events when online', async () => {});
  it('uploads photos', async () => {});
});
```

### E2E Tests
```typescript
describe('Mobile Downtime E2E', () => {
  it('scans machine barcode', async () => {});
  it('logs downtime event', async () => {});
  it('resolves active event', async () => {});
  it('works offline', async () => {});
});
```

---

## Quality Gates

- [x] All 4 states defined (Loading, Empty, Success, Error)
- [x] Offline mode specified
- [x] Multi-step wizard flow documented
- [x] Scanner integration defined
- [x] Photo upload specified
- [x] Accessibility checklist passed
- [x] Performance targets defined
- [x] Mobile-first design

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**Estimated Effort**: 12-14 hours
**Quality Target**: 95/100
**PRD Coverage**: 100% (OEE PRD Section 10.10)
