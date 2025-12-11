# Batch 5C-1: Scanner Core - Technical Specification

**Batch ID:** 5C-1 (Scanner Core)
**Stories:** 5.23 - 5.27 (Warehouse Scanner PWA)
**Total Points:** 18
**Total Effort:** 18-21 hours

---

## Overview

Scanner Core implements a Progressive Web App (PWA) for warehouse operations optimized for handheld devices, barcode scanning, and offline capability. Core features include guided workflows with state machines, real-time barcode validation with haptic/audio feedback, operations menu with large touch targets, and automatic session timeout with security.

---

## Database Schema

### 1. scanner_sessions Table

Tracks active scanner sessions for timeout management and audit.

```sql
CREATE TABLE scanner_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  device_id VARCHAR(255) NOT NULL,
  session_key VARCHAR(255) NOT NULL UNIQUE,
  workflow_type VARCHAR(50) NOT NULL,
  current_step INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active', -- active, paused, completed, timeout
  last_activity_at TIMESTAMP DEFAULT NOW(),
  idle_duration_seconds INTEGER DEFAULT 300, -- 5 minutes
  warning_threshold_seconds INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,

  CONSTRAINT valid_workflow_type CHECK (workflow_type IN ('receive', 'put_away', 'pick', 'consume', 'output', 'move', 'count'))
);

CREATE INDEX idx_scanner_sessions_org_id ON scanner_sessions(org_id);
CREATE INDEX idx_scanner_sessions_user_id ON scanner_sessions(user_id);
CREATE INDEX idx_scanner_sessions_session_key ON scanner_sessions(session_key);
CREATE INDEX idx_scanner_sessions_status ON scanner_sessions(status);
CREATE INDEX idx_scanner_sessions_expires_at ON scanner_sessions(expires_at);
```

### 2. barcode_validations Table

Immutable log of barcode scan validations for audit trail and error analysis.

```sql
CREATE TABLE barcode_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  session_id UUID NOT NULL REFERENCES scanner_sessions(id),
  scanned_barcode VARCHAR(255) NOT NULL,
  expected_barcode VARCHAR(255),
  validation_status VARCHAR(20) NOT NULL, -- valid, invalid, partial_match, not_found
  lp_id UUID REFERENCES license_plates(id),
  expected_lp_id UUID REFERENCES license_plates(id),
  error_message TEXT,
  scan_timestamp TIMESTAMP DEFAULT NOW(),
  validated_by_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (validation_status IN ('valid', 'invalid', 'partial_match', 'not_found'))
);

CREATE INDEX idx_barcode_validations_org_id ON barcode_validations(org_id);
CREATE INDEX idx_barcode_validations_session_id ON barcode_validations(session_id);
CREATE INDEX idx_barcode_validations_lp_id ON barcode_validations(lp_id);
CREATE INDEX idx_barcode_validations_validation_status ON barcode_validations(validation_status);
CREATE INDEX idx_barcode_validations_scan_timestamp ON barcode_validations(scan_timestamp DESC);
```

### 3. scanner_workflow_configs Table

Configuration for each workflow type (state machine definitions, UI settings).

```sql
CREATE TABLE scanner_workflow_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  workflow_type VARCHAR(50) NOT NULL,

  -- State machine steps
  steps JSONB NOT NULL, -- Array of {step_number, action, validation, feedback_type}
  require_confirmation BOOLEAN DEFAULT true,
  auto_proceed_delay_ms INTEGER DEFAULT 1500, -- Auto-advance after success feedback

  -- Haptic/Audio settings
  enable_haptic BOOLEAN DEFAULT true,
  enable_audio BOOLEAN DEFAULT true,
  vibration_pattern VARCHAR(50) DEFAULT 'success', -- success, error, warning, custom
  audio_file_path VARCHAR(255),

  -- Barcode validation
  expected_barcode_pattern VARCHAR(255),
  allow_partial_match BOOLEAN DEFAULT false,
  partial_match_threshold DECIMAL DEFAULT 0.8,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_workflow_config UNIQUE(org_id, workflow_type)
);

CREATE INDEX idx_scanner_workflow_configs_org_id ON scanner_workflow_configs(org_id);
CREATE INDEX idx_scanner_workflow_configs_workflow_type ON scanner_workflow_configs(workflow_type);
```

### 4. scanner_feedback_logs Table

Immutable log of feedback triggers (haptic, audio) for UX analysis.

```sql
CREATE TABLE scanner_feedback_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  session_id UUID NOT NULL REFERENCES scanner_sessions(id),
  feedback_type VARCHAR(50) NOT NULL, -- success, error, warning
  haptic_pattern VARCHAR(50),
  audio_played BOOLEAN DEFAULT false,
  auto_proceeded BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_feedback_type CHECK (feedback_type IN ('success', 'error', 'warning'))
);

CREATE INDEX idx_scanner_feedback_logs_org_id ON scanner_feedback_logs(org_id);
CREATE INDEX idx_scanner_feedback_logs_session_id ON scanner_feedback_logs(session_id);
```

---

## API Endpoints

### Scanner Session Management

#### POST /api/scanner/sessions
Create new scanner session with workflow initialization.

```typescript
Request:
{
  workflow_type: "receive" | "put_away" | "pick" | "consume" | "output" | "move" | "count",
  device_id: string,
  idle_duration_seconds?: number, // default 300
}

Response (201):
{
  session_id: UUID,
  session_key: string, // For client caching
  device_id: string,
  workflow_type: string,
  current_step: 1,
  expires_at: timestamp,
  workflow_config: {
    steps: array,
    enable_haptic: boolean,
    enable_audio: boolean,
    auto_proceed_delay_ms: number
  }
}
```

#### PATCH /api/scanner/sessions/:id/activity
Update last_activity_at to track idle time.

```typescript
Response (200):
{
  last_activity_at: timestamp,
  idle_seconds_remaining: number,
  warning_active: boolean
}
```

#### PATCH /api/scanner/sessions/:id/step
Advance workflow to next step.

```typescript
Request:
{
  step_number: number,
  step_data?: object
}

Response (200):
{
  current_step: number,
  step_action: string,
  validation_required: boolean
}
```

#### DELETE /api/scanner/sessions/:id
Manually close session.

```typescript
Response (200):
{
  session_id: UUID,
  closed_at: timestamp,
  steps_completed: number
}
```

### Barcode Validation

#### POST /api/scanner/validate-barcode
Validate scanned barcode against expected value and database.

```typescript
Request:
{
  session_id: UUID,
  scanned_barcode: string,
  expected_lp_id?: UUID
}

Response (200):
{
  validation_status: "valid" | "invalid" | "partial_match" | "not_found",
  lp_id?: UUID,
  lp_number?: string,
  product_name?: string,
  quantity?: decimal,
  uom?: string,
  error_message?: string,
  confidence_score?: decimal
}

Response (400):
{
  validation_status: "invalid",
  error_message: string,
  expected_barcode?: string,
  scanned_barcode: string
}
```

#### GET /api/scanner/sessions/:id/validations
Get barcode validation history for session.

```typescript
Response (200):
{
  validations: array<{
    scan_timestamp: timestamp,
    scanned_barcode: string,
    validation_status: string,
    lp_number?: string,
    error_message?: string
  }>,
  total_scans: number,
  valid_scans: number,
  error_rate: decimal
}
```

### Feedback & UX

#### POST /api/scanner/feedback
Log feedback event (for UX analytics).

```typescript
Request:
{
  session_id: UUID,
  feedback_type: "success" | "error" | "warning",
  haptic_pattern?: string,
  auto_proceeded?: boolean
}

Response (201):
{
  feedback_id: UUID,
  created_at: timestamp
}
```

#### GET /api/scanner/workflow-config/:type
Get workflow configuration (steps, feedback settings).

```typescript
Response (200):
{
  workflow_type: string,
  steps: array<{
    step_number: number,
    action: string,
    validation: {
      type: string,
      expected_pattern?: string
    },
    feedback_type: string
  }>,
  enable_haptic: boolean,
  enable_audio: boolean,
  auto_proceed_delay_ms: number
}
```

---

## PWA Architecture

### 1. Offline Capability

- Service worker caches all workflow definitions, static assets
- IndexedDB stores pending barcode validations when offline
- Sync queue (Gap 5) retries failed validations when online
- Session state persists in localStorage with 24-hour recovery

### 2. Responsive Design

- 100% mobile-first, touch-optimized (iOS Safari, Android Chrome)
- Minimum 44px touch targets (WCAG 2.1 Level AAA)
- Landscape orientation for barcode scanners
- No hover states, gestures support swipe back/forward

### 3. Performance

- Bundle size < 300KB (gzipped) for mobile networks
- Time to Interactive < 2s on 4G
- Offline-first data access (IndexedDB before API)
- Background sync for barcode validations

---

## State Machine Architecture

### Workflow State Definitions

Each workflow type (receive, put_away, pick, etc.) has state machine:

```typescript
interface WorkflowStep {
  step_number: number;
  action: string; // scan, confirm, select, input, navigate
  validation: {
    type: 'barcode' | 'quantity' | 'location' | 'confirm';
    expected_pattern?: string;
    required: boolean;
  };
  feedback_type: 'success' | 'error' | 'warning';
  next_step?: number;
  error_step?: number; // Retry step on validation failure
}
```

### Example: Receive Workflow

1. **Step 1**: Scan Purchase Order Barcode
   - Action: scan
   - Validation: barcode matches PO pattern
   - Feedback: success (beep + vibration)

2. **Step 2**: Confirm Receiving Location
   - Action: select from list
   - Validation: location exists and is_active
   - Feedback: success

3. **Step 3**: Scan License Plate Barcode
   - Action: scan
   - Validation: barcode exists in system
   - Feedback: success if found, error if not found

4. **Step 4**: Confirm Quantity
   - Action: input/confirm
   - Validation: quantity > 0 and <= expected
   - Feedback: success, auto-proceed 1500ms

5. **Step 5**: Complete
   - Action: navigate to next
   - Validation: none
   - Feedback: completion screen

---

## Components Overview

### 1. Scanner Core Components

- **WorkflowGuidePanel**: Main instruction panel with current step, action text, input field
- **BarcodeInputField**: Invisible input capturing hardware scan events, real-time feedback
- **FeedbackDisplay**: Visual + haptic + audio feedback for validation results
- **OperationsMenu**: Large 48px+ touch targets for workflow selection/quick actions
- **SessionTimeoutWarning**: 30-second idle warning overlay with countdown
- **StepProgressBar**: Visual progress through workflow steps

### 2. Validation Components

- **BarcodeValidationResult**: Green/red success/error display with scanned/expected comparison
- **PartialMatchWarning**: Alert for fuzzy match results with confidence score
- **QuantityInput**: Numeric input with large buttons for +/- adjustments

### 3. Modal Components

- **WorkflowSelectionModal**: Choose workflow type (receive, pick, move, count, etc.)
- **ConfirmationModal**: Large buttons for Yes/No confirmations
- **LocationSelector**: Dropdown/list of valid locations per workflow type

---

## Services

### 1. ScannerFeedbackService

```typescript
interface FeedbackConfig {
  hapticPattern: 'success' | 'error' | 'warning' | 'custom';
  audioFile?: string;
  autoProceeedDelayMs?: number;
}

triggerHapticFeedback(pattern: string): void
playAudioFeedback(audioFilePath: string): void
showVisualFeedback(type: 'success' | 'error' | 'warning', message: string): void
```

### 2. ScannerSessionService

```typescript
createSession(workflowType: string, deviceId: string): Promise<Session>
updateActivityTimestamp(): void
getCurrentSession(): Session
closeSession(): void
hasActiveSession(): boolean
isSessionExpired(): boolean
```

### 3. BarcodeValidationService

```typescript
validateBarcode(barcode: string, expectedLpId?: UUID): Promise<ValidationResult>
validateBarcodeFuzzy(barcode: string, threshold?: number): Promise<ValidationResult>
getValidationHistory(sessionId: UUID): Promise<ValidationResult[]>
logValidation(sessionId: UUID, result: ValidationResult): void
```

---

## Haptic & Audio Feedback

### Haptic Patterns

- **Success**: `[100ms vibrate, 50ms pause, 100ms vibrate]` (double tap)
- **Error**: `[200ms vibrate, 100ms pause, 200ms vibrate]` (longer, warning)
- **Warning**: `[150ms vibrate]` (single, attention)

### Audio Feedback

- **Success**: Upward beep tone (800Hz, 150ms)
- **Error**: Downward beep tone (400Hz, 200ms)
- **Warning**: Mid-range beep (600Hz, 100ms)
- All sounds < 60dB for warehouse environment

---

## Security & Validation

### 1. Session Security

- Session expires after idle_duration_seconds (default 300s)
- 30-second warning before timeout with option to extend
- Session key tied to device_id for anti-theft
- Automatic logout on tab close

### 2. Barcode Validation

- Whitelist known LP barcode patterns per org
- Prevent injection: sanitize input before database queries
- Case-insensitive matching with normalization
- Audit log all failed validations for forensics

### 3. RLS Policies

```sql
-- scanner_sessions: org_id based
CREATE POLICY "Enable scanner sessions for org users"
  ON scanner_sessions FOR ALL
  TO authenticated
  USING (org_id = current_user.org_id)
  WITH CHECK (org_id = current_user.org_id);

-- barcode_validations: org_id based
CREATE POLICY "Enable barcode validation logs for org users"
  ON barcode_validations FOR ALL
  TO authenticated
  USING (org_id = current_user.org_id)
  WITH CHECK (org_id = current_user.org_id);

-- scanner_workflow_configs: org_id based
CREATE POLICY "Enable workflow config for org users"
  ON scanner_workflow_configs FOR SELECT
  TO authenticated
  USING (org_id = current_user.org_id);
```

---

## Indexes

```sql
-- Performance critical queries
CREATE INDEX idx_scanner_sessions_user_expires ON scanner_sessions(user_id, expires_at);
CREATE INDEX idx_barcode_validations_session_status ON barcode_validations(session_id, validation_status);
CREATE INDEX idx_scanner_sessions_device_active ON scanner_sessions(device_id, status);
```

---

## Testing Strategy

### Unit Tests
- Barcode validation logic (fuzzy matching, pattern matching)
- State machine transitions (valid/invalid paths)
- Session timeout calculation
- Haptic/audio trigger conditions

### Integration Tests
- POST /api/scanner/sessions creates valid session
- Barcode validation updates database correctly
- Session timeout triggers after idle_duration
- Offline sync queues validations when offline

### E2E Tests
- Full receive workflow: scan PO → select location → scan LP → confirm quantity → complete
- Barcode validation: valid scan shows green, invalid shows red with error
- Session timeout: warning at 30s, auto-logout at 5min
- Haptic/audio feedback triggers correctly per event
- Offline mode: validations queue and sync when online

---

## Performance Targets

- Session creation: < 200ms
- Barcode validation: < 300ms (including API)
- Haptic feedback latency: < 50ms
- Audio playback: < 100ms
- State machine transition: < 100ms
- PWA offline capability: instant (IndexedDB cached)

---

## Future Enhancements

- Bulk barcode scanning (multiple items per workflow)
- Handwriting recognition for quantity input
- Voice commands for hands-free operation
- Advanced analytics dashboard (workflow metrics, error patterns)
- Multi-language support for instructions
- Customizable haptic patterns per org
