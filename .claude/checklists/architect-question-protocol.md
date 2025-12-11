# Architect Question Generation Protocol

## Principle

DO NOT use static question lists. Generate questions DYNAMICALLY based on:

- What you already know from PRD/context
- What information gaps you detected
- What type of architecture you're designing

## Generation Protocol

### Step 1: Analyze Available Context

Read:
- `@docs/product/prd.md` (if exists)
- `@docs/architecture/` (existing architecture)
- `@CLAUDE.md` (project context)

Note down:
- What I KNOW for certain
- What I ASSUME (but have no confirmation)
- What I DON'T KNOW (critical gaps)

### Step 2: Categorize Gaps

**BLOCKING** (must know before designing):
- External system integrations
- Security/compliance requirements
- Technology constraints

**IMPORTANT** (must know before stories):
- Performance expectations
- Scalability
- Deployment model

**DEFERRABLE** (can assume and verify later):
- Monitoring details
- Exact SLA metrics
- DR plans

### Step 3: Generate Questions for GAPS

For EACH gap in BLOCKING category:
1. Formulate a specific question
2. Propose answer options (if possible)
3. Explain WHY this matters for architecture

Example transformation:
```
Gap: "Don't know what type of database"

BAD Static: "What type of database?"

GOOD Dynamic: "PRD mentions user->orders->products relationships.
   Is the data primarily relational (PostgreSQL),
   or do you expect many nested documents (MongoDB)?
   This affects schema design and query patterns."
```

### Step 4: Limit to 7 Questions

Select MAX 7 most important questions from BLOCKING category.
If you have more - group them or defer to next round.

After receiving answers:
- Update knowledge state
- Generate new questions for remaining gaps
- Repeat until Clarity Score >= 80%

## Contextual Question Triggers

Instead of a list, use TRIGGERS:

| I see in PRD/context | Generate question about |
|---------------------|------------------------|
| "real-time", "live updates" | WebSocket vs SSE vs polling, connection scale |
| "payment", "checkout" | PCI-DSS compliance, payment provider |
| "user data", "profile" | GDPR, data residency, encryption |
| "file upload", "media" | Storage (S3/GCS), CDN, size limits |
| "search", "filter" | Full-text search (Elastic?), indexes |
| "notification", "alert" | Push/email/SMS, provider, retry policy |
| "multi-tenant" | Data isolation, tenancy model |
| "API", "integration" | Auth (OAuth/API key), rate limiting, versioning |
| No info about scale | Expected user count, requests/sec |
| No info about deployment | Cloud provider, region, Kubernetes? |

## Dynamic Generation Example

**Context:** PRD for e-commerce with "real-time inventory" and "payment processing"

**Generated questions (NOT from static list!):**

1. **Real-time inventory:** "PRD requires real-time stock updates. How many SKUs do you have and how often do they change? This determines whether WebSocket or polling is appropriate."

2. **Payments:** "I see payment integration. Do you already have a provider (Stripe/PayU/Adyen)? Do you need to be PCI-DSS compliant, or does the provider handle tokenization?"

3. **Scale (detected gap):** "PRD doesn't mention expected scale. How many concurrent users do you expect at peak (Black Friday)?"

## Anti-patterns

### DON'T:
- Read from static question list
- Ask about things already in PRD
- Ask about everything at once
- Ask without context "what database?"

### DO:
- Analyze context before asking
- Ask about GAPS, not everything
- Explain WHY you're asking
- Limit to 7 questions per round

## Clarity Score Calculation

```
Clarity Score = (Known Items / Total Required Items) * 100

Required Items for Architecture:
- [ ] Data model understood
- [ ] Integration points identified
- [ ] Security requirements clear
- [ ] Scale expectations known
- [ ] Deployment target defined
- [ ] Tech stack constraints identified
- [ ] Performance SLAs defined

Score >= 80% = Ready to design
Score < 80% = Need more discovery
```

## Integration with ARCHITECT Workflow

1. **Before Step 1 (Analyze PRD):** Run this protocol
2. **After each question round:** Recalculate Clarity Score
3. **When score >= 80%:** Proceed to architecture design
4. **Document answers:** Update PROJECT-UNDERSTANDING.md
