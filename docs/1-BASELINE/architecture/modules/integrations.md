# Integrations Module Architecture

## Version
- **Date**: 2025-12-10
- **Status**: Planned (Premium Module)
- **Epic**: 11

---

## Overview

The Integrations Module serves as MonoPilot's connectivity layer, enabling seamless data exchange with external systems, third-party platforms, and partner portals. It provides standardized APIs, EDI capabilities, ERP synchronization (Comarch Optima), and robust error handling with audit trails.

### Core Capabilities
- API Key management with scopes and rate limiting
- Webhook events (outbound notifications)
- Integration logs and audit trail
- Data export (CSV, JSON, XML)
- Supplier Portal (read-only PO view, delivery confirmation)
- Customer Portal (order tracking, shipment status)
- EDI (EDIFACT ORDERS, INVOIC, DESADV)
- Comarch Optima integration (invoice push, chart of accounts sync)

### Module Dependencies
```
All Modules --------+
(Products, Orders,  |
 Inventory, etc.)   |
                    v
              Integrations Module
                    |
    +---------------+---------------+
    |               |               |
    v               v               v
External         Supplier       Customer
Systems          Portal         Portal
(Comarch,
 EDI VAN)
```

---

## Database Schema

### API Key Management

```sql
-- API Keys: External system authentication
integration_api_keys
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
  org_id                UUID NOT NULL REFERENCES organizations(id)
  name                  VARCHAR(255) NOT NULL
  key_value_hash        VARCHAR(255) NOT NULL  -- bcrypt hash
  scopes                JSONB NOT NULL  -- ["read:products", "write:orders"]
  status                VARCHAR(20) NOT NULL DEFAULT 'active'
    -- active, suspended, revoked
  rate_limit_tier       VARCHAR(20) DEFAULT 'basic'
    -- basic (60/min), standard (300/min), premium (1000/min)
  expires_at            TIMESTAMP
  last_used_at          TIMESTAMP
  created_by            UUID REFERENCES users(id)
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()

-- Webhook Configuration
integration_webhooks
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
  org_id                UUID NOT NULL REFERENCES organizations(id)
  name                  VARCHAR(255) NOT NULL
  url                   VARCHAR(500) NOT NULL  -- HTTPS required
  events                JSONB NOT NULL  -- ["order.created", "shipment.dispatched"]
  status                VARCHAR(20) NOT NULL DEFAULT 'active'
    -- active, paused
  secret                VARCHAR(255) NOT NULL  -- HMAC signature secret
  retry_policy          VARCHAR(20) DEFAULT 'exponential'
    -- immediate, exponential, manual
  max_retries           INTEGER DEFAULT 3
  custom_headers        JSONB
  last_triggered_at     TIMESTAMP
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()
```

### Integration Logging

```sql
-- Integration Logs: Comprehensive audit trail
integration_logs
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
  org_id                UUID NOT NULL REFERENCES organizations(id)
  timestamp             TIMESTAMP DEFAULT NOW()
  integration_type      VARCHAR(50) NOT NULL
    -- api, webhook, edi, comarch, import, export
  event_type            VARCHAR(100) NOT NULL
  direction             VARCHAR(10) NOT NULL  -- inbound, outbound
  status                VARCHAR(20) NOT NULL  -- success, warning, error
  http_status           INTEGER
  request_body          JSONB  -- Masked sensitive data
  response_body         JSONB
  error_message         TEXT
  api_key_id            UUID REFERENCES integration_api_keys(id)
  webhook_id            UUID REFERENCES integration_webhooks(id)
  external_system       VARCHAR(100)
  retry_count           INTEGER DEFAULT 0
  duration_ms           INTEGER
  created_at            TIMESTAMP DEFAULT NOW()

-- Retry Queue: Failed events awaiting retry
integration_retry_queue
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
  org_id                UUID NOT NULL REFERENCES organizations(id)
  log_id                UUID REFERENCES integration_logs(id)
  retry_count           INTEGER DEFAULT 0
  max_retries           INTEGER DEFAULT 3
  next_retry_at         TIMESTAMP
  status                VARCHAR(20) DEFAULT 'pending'
    -- pending, in_progress, succeeded, failed
  error_message         TEXT
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()
```

### Portal Users

```sql
-- Supplier Portal Users: External supplier access
supplier_portal_users
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
  org_id                UUID NOT NULL REFERENCES organizations(id)
  supplier_id           UUID NOT NULL REFERENCES suppliers(id)
  email                 VARCHAR(255) NOT NULL UNIQUE
  password_hash         VARCHAR(255) NOT NULL
  name                  VARCHAR(255) NOT NULL
  status                VARCHAR(20) DEFAULT 'active'
    -- active, suspended
  last_login_at         TIMESTAMP
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()

-- Customer Portal Users: External customer access
customer_portal_users
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
  org_id                UUID NOT NULL REFERENCES organizations(id)
  customer_id           UUID NOT NULL REFERENCES customers(id)
  email                 VARCHAR(255) NOT NULL UNIQUE
  password_hash         VARCHAR(255) NOT NULL
  name                  VARCHAR(255) NOT NULL
  status                VARCHAR(20) DEFAULT 'active'
  last_login_at         TIMESTAMP
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()
```

### External System Configuration

```sql
-- Comarch Optima Configuration
comarch_optima_config
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
  org_id                UUID NOT NULL REFERENCES organizations(id)
  enabled               BOOLEAN DEFAULT false
  api_url               VARCHAR(500) NOT NULL
  api_key               VARCHAR(255) NOT NULL
  api_secret_encrypted  VARCHAR(500) NOT NULL  -- AES-256 encrypted
  company_code          VARCHAR(50)
  test_mode             BOOLEAN DEFAULT true
  auto_sync             BOOLEAN DEFAULT false
  last_sync_at          TIMESTAMP
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()

-- EDI Configuration
edi_config
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
  org_id                UUID NOT NULL REFERENCES organizations(id)
  enabled               BOOLEAN DEFAULT false
  edi_mailbox           VARCHAR(255)  -- e.g., "MONOPILOT@EANCOM"
  van_provider          VARCHAR(100)  -- Seeburger, TrueCommerce
  message_types         JSONB  -- ["ORDERS", "INVOIC", "DESADV"]
  test_mode             BOOLEAN DEFAULT true
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()

-- EDI Messages: Inbound/outbound message tracking
edi_messages
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
  org_id                UUID NOT NULL REFERENCES organizations(id)
  direction             VARCHAR(10) NOT NULL  -- inbound, outbound
  message_type          VARCHAR(20) NOT NULL  -- ORDERS, INVOIC, DESADV
  message_content       TEXT NOT NULL  -- Raw EDI message
  status                VARCHAR(20) NOT NULL  -- pending, processed, error
  partner_id            VARCHAR(100)  -- Trading partner ID
  reference_id          VARCHAR(100)  -- PO/Invoice number
  error_message         TEXT
  processed_at          TIMESTAMP
  created_at            TIMESTAMP DEFAULT NOW()
```

### Indexes

```sql
-- API Keys
CREATE INDEX idx_api_keys_org ON integration_api_keys(org_id, status);
CREATE INDEX idx_api_keys_key ON integration_api_keys(key_value_hash);

-- Integration Logs
CREATE INDEX idx_int_logs_org_time ON integration_logs(org_id, timestamp);
CREATE INDEX idx_int_logs_status ON integration_logs(status);
CREATE INDEX idx_int_logs_type ON integration_logs(integration_type);

-- Retry Queue
CREATE INDEX idx_retry_queue_next ON integration_retry_queue(next_retry_at)
  WHERE status = 'pending';

-- Portal Users
CREATE INDEX idx_supplier_portal_email ON supplier_portal_users(email);
CREATE INDEX idx_customer_portal_email ON customer_portal_users(email);

-- EDI Messages
CREATE INDEX idx_edi_messages_status ON edi_messages(org_id, status);
```

---

## API Design

### API Keys

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/integrations/api-keys` | List all API keys |
| POST | `/api/integrations/api-keys` | Create new API key |
| GET | `/api/integrations/api-keys/:id` | Get API key details |
| PUT | `/api/integrations/api-keys/:id` | Update API key |
| DELETE | `/api/integrations/api-keys/:id` | Revoke API key |
| POST | `/api/integrations/api-keys/:id/regenerate` | Regenerate key |
| POST | `/api/integrations/api-keys/:id/suspend` | Suspend key |
| POST | `/api/integrations/api-keys/:id/activate` | Reactivate key |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/integrations/webhooks` | List webhooks |
| POST | `/api/integrations/webhooks` | Create webhook |
| GET | `/api/integrations/webhooks/:id` | Get webhook details |
| PUT | `/api/integrations/webhooks/:id` | Update webhook |
| DELETE | `/api/integrations/webhooks/:id` | Delete webhook |
| POST | `/api/integrations/webhooks/:id/test` | Test webhook (send sample) |
| POST | `/api/integrations/webhooks/:id/pause` | Pause webhook |
| POST | `/api/integrations/webhooks/:id/resume` | Resume webhook |
| GET | `/api/integrations/webhooks/:id/logs` | Get delivery logs |

### Integration Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/integrations/logs` | List logs (paginated, filtered) |
| GET | `/api/integrations/logs/:id` | Get log details |
| GET | `/api/integrations/logs/stats` | Get statistics |

### Data Export/Import

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/integrations/export/products` | Export products |
| POST | `/api/integrations/export/orders` | Export orders |
| POST | `/api/integrations/export/inventory` | Export inventory |
| GET | `/api/integrations/export/:id/status` | Check export status |
| GET | `/api/integrations/export/:id/download` | Download export file |
| GET | `/api/integrations/import/products/template` | Download template |
| POST | `/api/integrations/import/products/validate` | Validate import |
| POST | `/api/integrations/import/products/execute` | Execute import |

### Comarch Optima

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/integrations/comarch/config` | Get config |
| PUT | `/api/integrations/comarch/config` | Update config |
| POST | `/api/integrations/comarch/test` | Test connection |
| POST | `/api/integrations/comarch/sync-accounts` | Sync chart of accounts |
| POST | `/api/integrations/comarch/push-invoice` | Push invoice |

### EDI

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/integrations/edi/config` | Get EDI config |
| PUT | `/api/integrations/edi/config` | Update EDI config |
| GET | `/api/integrations/edi/inbox` | List inbound messages |
| GET | `/api/integrations/edi/outbox` | List outbound messages |
| POST | `/api/integrations/edi/send` | Send EDI message |
| POST | `/api/integrations/edi/process/:id` | Process inbound message |

### Supplier Portal (Public Routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/portal/supplier/login` | Supplier login |
| GET | `/api/portal/supplier/orders` | List POs for supplier |
| GET | `/api/portal/supplier/orders/:id` | Get PO details |
| POST | `/api/portal/supplier/orders/:id/confirm` | Confirm delivery |

### Customer Portal (Public Routes)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/portal/customer/login` | Customer login |
| GET | `/api/portal/customer/orders` | List orders |
| GET | `/api/portal/customer/orders/:id` | Get order details |
| GET | `/api/portal/customer/shipments/:id` | Get shipment tracking |

---

## Data Flow

### API Authentication Flow

```
External System Request
       |
       | Authorization: Bearer <api_key>
       v
+------------------+
| Validate API Key |
+------------------+
       |
       +-- Invalid --> 401 Unauthorized
       |
       v
+------------------+
| Check Rate Limit |
| (Redis counter)  |
+------------------+
       |
       +-- Exceeded --> 429 Too Many Requests
       |
       v
+------------------+
| Validate Scopes  |
| (e.g., read:orders)
+------------------+
       |
       +-- Missing --> 403 Forbidden
       |
       v
+------------------+
| Process Request  |
+------------------+
       |
       v
+------------------+
| Log to           |
| integration_logs |
+------------------+
       |
       v
+------------------+
| Return Response  |
+------------------+
```

### Webhook Delivery Flow

```
Event Triggered (e.g., WO completed)
       |
       v
+------------------+
| Find Active      |
| Webhooks for     |
| Event            |
+------------------+
       |
       v
+------------------+
| Build Payload    |
| (JSON)           |
+------------------+
       |
       v
+------------------+
| Sign with HMAC-  |
| SHA256 (secret)  |
+------------------+
       |
       v
+------------------+
| HTTP POST to URL |
| (30s timeout)    |
+------------------+
       |
       +-- Success (2xx) --> Log Success --> Done
       |
       +-- Failure --> Log Error --> Add to Retry Queue
                                          |
                                          v
                                   +----------------+
                                   | Retry Logic    |
                                   | (exponential)  |
                                   +----------------+
                                          |
                                   +------+------+------+
                                   |      |      |      |
                                   v      v      v      v
                               Retry 1  Retry 2  Retry 3  Max Retries
                                (5s)    (30s)    (5m)       |
                                   |      |      |          v
                                   +------+------+   Dead Letter Queue
```

### Comarch Optima Sync Flow

```
MonoPilot Invoice Created
       |
       v
+--------------------+
| Check Comarch      |
| Config Enabled     |
+--------------------+
       |
       +-- Disabled --> Skip
       |
       v
+--------------------+
| Map Fields:        |
| - invoice_number   |
|   --> NumerDokumentu
| - customer.tax_id  |
|   --> Kontrahent.NIP
| - line_items       |
|   --> Pozycje      |
+--------------------+
       |
       v
+--------------------+
| POST to Comarch    |
| /api/faktury       |
+--------------------+
       |
       +-- Success --> Update sync_status = 'synced'
       |
       +-- Error --> Log Error --> Add to Retry Queue
```

### EDI ORDERS Processing Flow

```
Customer EDI VAN sends ORDERS
       |
       v
+--------------------+
| MonoPilot EDI      |
| Mailbox (polling   |
| every 5 min)       |
+--------------------+
       |
       v
+--------------------+
| Parse EDIFACT      |
| Message            |
+--------------------+
       |
       +-- Invalid syntax --> Log Error, Notify Admin
       |
       v
+--------------------+
| Validate Data:     |
| - Customer exists? |
| - Products exist?  |
| - Valid dates?     |
+--------------------+
       |
       +-- All Valid --> Create Sales Order
       |                 Send ORDRSP (Phase 3)
       |
       +-- Errors --> Create "Pending Review" Order
                      Log Errors
                      Notify Admin
```

### Supplier Portal Access Flow

```
Supplier navigates to /portal/supplier
       |
       v
+--------------------+
| Login Page         |
| (email + password) |
+--------------------+
       |
       v
+--------------------+
| Authenticate       |
| (separate auth     |
| from MonoPilot)    |
+--------------------+
       |
       +-- Invalid --> Error, Log Failed Attempt
       |
       v
+--------------------+
| Create Session     |
+--------------------+
       |
       v
+--------------------+
| Load POs for       |
| supplier_id        |
| (filtered by       |
| org_id via RLS)    |
+--------------------+
       |
       v
+--------------------+
| Display PO List    |
+--------------------+
```

---

## Security

### API Key Security

- Keys hashed with bcrypt (cost factor: 12)
- Shown once on creation, then only masked
- Scopes limit access to specific resources
- Rate limiting prevents abuse
- Automatic suspension after failed attempts

### Webhook Security

- HTTPS required for all URLs
- HMAC-SHA256 signatures for payload verification
- Custom signature header: `X-MonoPilot-Signature`
- Consumers should validate signatures

### Portal Security

- Separate user database from MonoPilot users
- Session-based auth (not JWT)
- Isolated by org_id via RLS
- No access to internal MonoPilot data
- Two-factor authentication (Phase 2)

### Data Protection

- Comarch API secrets encrypted at rest (AES-256)
- Sensitive data masked in logs
- Export files expire after 24 hours
- Audit trail for all integration events

### Row-Level Security

```sql
-- Portal users only see their own data
CREATE POLICY "Supplier sees own POs" ON purchase_orders
  USING (
    supplier_id = (
      SELECT supplier_id FROM supplier_portal_users
      WHERE id = auth.jwt() ->> 'portal_user_id'
    )
  );
```

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| API response time | <500ms (p95) |
| Webhook delivery | <2s end-to-end |
| Export generation | <30s for 10k rows |
| EDI processing | <10s per message |
| Comarch sync | <5s per invoice |
| Dashboard load | <2s |

### Rate Limits

| Tier | Requests/Minute | Requests/Hour | Burst |
|------|-----------------|---------------|-------|
| Basic | 60 | 1000 | 10 |
| Standard | 300 | 10000 | 50 |
| Premium | 1000 | 50000 | 200 |

---

## API Scopes

| Scope | Actions |
|-------|---------|
| `read:products` | GET /api/technical/products |
| `write:products` | POST/PUT/DELETE products |
| `read:orders` | GET /api/planning/purchase-orders |
| `write:orders` | POST/PUT orders |
| `read:inventory` | GET /api/warehouse/inventory |
| `write:inventory` | POST /api/warehouse/moves |
| `read:production` | GET /api/production/work-orders |
| `write:production` | POST /api/production/consumption |
| `read:shipping` | GET /api/shipping/shipments |
| `webhook:manage` | POST/DELETE webhooks |

---

## Webhook Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `order.created` | New PO created | PO details |
| `order.updated` | PO status changed | PO + changes |
| `workorder.started` | WO started | WO details |
| `workorder.completed` | WO completed | WO + output |
| `shipment.dispatched` | Shipment sent | Shipment + tracking |
| `inventory.low` | Stock below reorder | Product + qty |
| `product.created` | New product added | Product details |

### Webhook Request Format

```json
{
  "event": "workorder.completed",
  "timestamp": "2025-12-10T14:30:00Z",
  "org_id": "uuid",
  "data": {
    "wo_number": "WO-2025-001",
    "product_name": "Bread Loaf White 500g",
    "qty_completed": 1000,
    "completed_at": "2025-12-10T14:30:00Z"
  }
}
```

### Webhook Headers

```
Content-Type: application/json
X-MonoPilot-Signature: sha256=<hmac>
X-MonoPilot-Event: workorder.completed
X-MonoPilot-Delivery-ID: uuid
```

---

## EDI Message Types

| Message | Direction | Standard | Description |
|---------|-----------|----------|-------------|
| ORDERS | Inbound | EDIFACT | Customer purchase orders |
| ORDRSP | Outbound | EDIFACT | Order response/acknowledgment |
| INVOIC | Outbound | EDIFACT | Sales invoices |
| DESADV | Outbound | EDIFACT | Advanced shipping notice (ASN) |
| RECADV | Inbound | EDIFACT | Receiving advice |

### EDI Field Mapping (ORDERS)

| EDIFACT Field | MonoPilot Field |
|---------------|-----------------|
| BGM.C002.1001 | order_number |
| DTM.2005 | order_date |
| NAD+BY | customer_id |
| LIN.1082 | line_item.sequence |
| IMD.C273.7008 | product_code |
| QTY.6060 | qty_ordered |
| DTM.2005 (delivery) | requested_delivery_date |

---

## Retry Policies

| Policy | Behavior |
|--------|----------|
| Immediate | Retry 3 times with 5s delay |
| Exponential | Retry 5 times (5s, 30s, 5m, 30m, 2h) |
| Manual | No auto-retry, admin must manually retry |

### Dead Letter Queue

Events moved to DLQ when:
- Retry count >= max_retries
- Manual skip from retry queue
- Unrecoverable errors (e.g., invalid credentials)

Retention: 30 days

---

## References

- PRD: `docs/1-BASELINE/product/modules/integrations.md`
- Finance Module: `docs/1-BASELINE/architecture/modules/finance.md`
- Integration Map: `docs/1-BASELINE/architecture/integration-map.md`
