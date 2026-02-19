## 6. Document Sharding Guide

### Why Shard Documents?

**Sharding** means splitting large documents into smaller, focused files.

**Benefits:**

- ✅ **Token efficiency:** Load only what you need
- ✅ **Better organization:** Logical separation of concerns
- ✅ **Easier maintenance:** Update small sections
- ✅ **Faster loading:** Smaller files load quicker
- ✅ **Clearer context:** Each file has single purpose

**When to shard:**

| Document Size | Action | Reason |
|---------------|--------|--------|
| <100 lines | ✅ Keep as-is | Small enough |
| 100-300 lines | 🟡 Consider sharding | Getting large |
| 300-500 lines | 🟠 Should shard | Hard to navigate |
| >500 lines | 🔴 Must shard | Too large |

**CLAUDE.md exception:** Must be <70 lines regardless

### How to Identify Candidates

**Run analysis:**

```bash
# Find large markdown files
find . -name "*.md" -type f -exec wc -l {} + | sort -rn | head -20

# Output shows:
# 1247 ./docs/API.md          <- MUST shard
#  823 ./README.md             <- MUST shard
#  456 ./ARCHITECTURE.md       <- Should shard
#  287 ./CONTRIBUTING.md       <- Consider sharding
```

**Manual review:**

Look for documents with multiple distinct sections:

```markdown
# README.md (850 lines) - TOO LARGE

## Overview (50 lines)
## Features (200 lines)
## Installation (150 lines)
## Quick Start (100 lines)
## API Reference (300 lines)
## Contributing (50 lines)

⬇️ SHARD INTO ⬇️

# 1. docs/1-BASELINE/product/overview.md (60 lines)
## Overview
## Features

# 2. INSTALL.md (150 lines)
## Installation

# 3. QUICK-START.md (100 lines)
## Quick Start

# 4. docs/4-DEVELOPMENT/api/README.md (300 lines)
## API Reference

# 5. docs/4-DEVELOPMENT/guides/contributing.md (50 lines)
## Contributing
```

### Sharding Best Practices

**1. Logical boundaries**

Split by conceptual sections, not arbitrary line counts:

✅ **Good:**
```
- product-overview.md (Product description)
- features.md (Feature list)
- architecture-overview.md (High-level design)
- database-schema.md (Data model)
```

⛔ **Bad:**
```
- part-1.md (First 300 lines)
- part-2.md (Next 300 lines)
- part-3.md (Remaining lines)
```

**2. Descriptive names**

File names should indicate content:

✅ **Good:**
```
api-authentication.md
api-user-endpoints.md
api-payment-endpoints.md
```

⛔ **Bad:**
```
api-1.md
api-2.md
api-3.md
```

**3. Clear hierarchy**

Use folder structure to group related shards:

```
docs/4-DEVELOPMENT/api/
├── README.md           # Overview + index
├── authentication.md
├── endpoints/
│   ├── users.md
│   ├── payments.md
│   ├── orders.md
│   └── analytics.md
└── webhooks/
    ├── payment-events.md
    └── user-events.md
```

**4. Index files**

Create README.md in each folder as index:

```markdown
# API Documentation

## Contents

- [Authentication](authentication.md) - API key and JWT auth
- [User Endpoints](endpoints/users.md) - User CRUD operations
- [Payment Endpoints](endpoints/payments.md) - Payment processing
- [Order Endpoints](endpoints/orders.md) - Order management
- [Webhooks](webhooks/) - Event notifications

## Quick Start

See @docs/QUICK-START.md for getting started with the API.

## Authentication

All endpoints require authentication. See [authentication.md](authentication.md).
```

### Example Before/After

**Before: README.md (820 lines)**

```markdown
# MyProject - E-Commerce Platform

## Table of Contents
[50 lines of TOC]

## Overview
[100 lines describing product]

## Features
[150 lines listing features]

## Architecture
[200 lines of system design]

## Installation
### Prerequisites
### Step 1: Clone
### Step 2: Install
### Step 3: Configure
[120 lines total]

## Quick Start
[80 lines of tutorial]

## API Reference
### Authentication
### User Endpoints
### Product Endpoints
[200 lines total]

## Contributing
[40 lines]

## License
[10 lines]
```

**After: Sharded into 8 files**

**1. Root: CLAUDE.md (45 lines)**
```markdown
# MyProject - E-Commerce Platform

## Quick Facts
| Aspect | Value |
|--------|-------|
| Name | MyProject |
| Type | E-Commerce SaaS |
| Status | Production |

## Documentation Map
- **Overview:** @docs/1-BASELINE/product/overview.md
- **Features:** @docs/1-BASELINE/product/features.md
- **Architecture:** @docs/1-BASELINE/architecture/overview.md
- **Installation:** @INSTALL.md
- **Quick Start:** @QUICK-START.md
- **API:** @docs/4-DEVELOPMENT/api/README.md

## Tech Stack
React + Node.js + PostgreSQL + Docker

## Current State
@PROJECT-STATE.md

---
*Agent Methodology Pack v1.0.0*
```

**2. docs/1-BASELINE/product/overview.md (100 lines)**
```markdown
# MyProject Overview

## What is MyProject?

[Product description]

## Target Users

[User personas]

## Value Proposition

[Key benefits]

## Market Position

[Competitive analysis]
```

**3. docs/1-BASELINE/product/features.md (150 lines)**
```markdown
# Features

## Core Features

### User Management
- User registration
- Profile management
- Authentication

### Product Catalog
- Product browsing
- Search and filters
- Categories

[... etc ...]
```

**4. docs/1-BASELINE/architecture/overview.md (200 lines)**
```markdown
# Architecture Overview

## System Design

[High-level architecture]

## Components

[Component descriptions]

## Data Flow

[Data flow diagrams]

## Infrastructure

[Infrastructure overview]
```

**5. INSTALL.md (120 lines)**
```markdown
# Installation Guide

## Prerequisites

[Requirements]

## Installation Steps

### Step 1: Clone Repository
```bash
git clone [repo]
```

### Step 2: Install Dependencies
```bash
npm install
```

[... etc ...]
```

**6. QUICK-START.md (80 lines)**
```markdown
# Quick Start

Get up and running in 5 minutes.

## 1. Install
[Quick install]

## 2. Configure
[Basic config]

## 3. Run
```bash
npm start
```

## 4. Test
[First steps]
```

**7. docs/4-DEVELOPMENT/api/README.md (200 lines)**
```markdown
# API Reference

## Overview
[API overview]

## Authentication
See [authentication.md](authentication.md)

## Endpoints

- [User Endpoints](endpoints/users.md)
- [Product Endpoints](endpoints/products.md)
- [Order Endpoints](endpoints/orders.md)

[... details ...]
```

**8. docs/4-DEVELOPMENT/guides/contributing.md (40 lines)**
```markdown
# Contributing Guide

## How to Contribute

[Contribution process]

## Code Standards

[Coding standards]

## Pull Request Process

[PR guidelines]
```

**Benefits of sharding:**

- **Before:** 820-line monolith, hard to navigate
- **After:** 8 focused files, clear purpose each
- **CLAUDE.md:** 45 lines (under 70 limit) ✅
- **Token usage:** Load only needed sections
- **Maintenance:** Update specific sections easily

### Sharding Workflow

**Step-by-step process:**

```bash
# 1. Make backup
cp README.md README.md.backup

# 2. Analyze structure
# Identify logical sections in document

# 3. Create target files
touch docs/1-BASELINE/product/overview.md
touch docs/1-BASELINE/product/features.md
touch INSTALL.md
touch QUICK-START.md

# 4. Copy content section by section
# Use editor to copy each section to appropriate file

# 5. Create index (new README.md if sharding README)
cat > README.md << 'EOF'
# MyProject

Quick links:
- [Overview](docs/1-BASELINE/product/overview.md)
- [Installation](INSTALL.md)
- [Quick Start](QUICK-START.md)

See @CLAUDE.md for full documentation map.
EOF

# 6. Update references
# Update any docs that referenced old structure

# 7. Validate
bash scripts/validate-docs.sh
```

---

