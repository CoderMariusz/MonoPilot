# MonoPilot

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-org/monopilot)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Status](https://img.shields.io/badge/status-In_Development-yellow.svg)]()

A modern, full-stack ERP/MES system designed specifically for food manufacturing operations. MonoPilot provides comprehensive management of production planning, execution, quality control, and traceability with built-in compliance for food safety regulations.

## Overview

MonoPilot is a monorepo-based enterprise resource planning system that combines ERP and Manufacturing Execution System (MES) capabilities. Built with modern web technologies, it offers real-time production tracking, complete batch traceability, and automated quality assurance workflows for food manufacturing facilities.

## Key Features

- **Complete Production Lifecycle**: From work order creation to finished goods shipment
- **Full Traceability**: Forward and backward genealogy tracking for recall management
- **Bill of Materials (BOM)**: Version control, cloning, comparison, and conditional items
- **Production Routing**: Operation sequences with machine assignment and yield tracking
- **Multi-warehouse Management**: Location tracking, transfer orders, and inventory control
- **Quality Assurance**: Built-in QA workflows and compliance documentation
- **Scanner Integration**: Barcode/QR code support for material consumption and output registration
- **Role-Based Access Control**: 10 predefined roles with granular permissions
- **Allergen Management**: 14 EU allergens plus custom allergen tracking with inheritance
- **Real-time Dashboard**: Live KPIs, active work orders, and production alerts

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Supabase account (or self-hosted instance)
- Redis instance (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/monopilot.git
   cd monopilot
   ```

2. **Install dependencies**
   ```bash
   pnpm install:all
   ```

3. **Configure environment variables**
   ```bash
   cd apps/frontend
   cp .env.example .env.local
   ```

   Update `.env.local` with your credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `REDIS_URL` (optional)

4. **Run database migrations**
   ```bash
   pnpm supabase db push
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

### Frontend
- **Framework**: Next.js 15.5 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 3.4 + shadcn/ui components
- **Forms**: React Hook Form + Zod validation
- **State Management**: React Server Components + Server Actions

### Backend
- **Runtime**: Node.js 20+
- **API**: 109 REST endpoints (Next.js Route Handlers)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Caching**: Upstash Redis

### Infrastructure
- **Monorepo**: pnpm workspaces
- **Type Safety**: TypeScript 5.9
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Deployment**: Docker + Nginx

## Project Structure

```
MonoPilot/
├── apps/
│   └── frontend/              # Next.js application
│       ├── app/
│       │   ├── (authenticated)/  # Protected routes
│       │   │   ├── settings/     # Epic 1: Organization config
│       │   │   ├── technical/    # Epic 2: Products, BOMs, Routing
│       │   │   ├── planning/     # Epic 3: POs, TOs, WOs
│       │   │   ├── production/   # Epic 4: Production execution
│       │   │   ├── warehouse/    # Epic 5: Inventory management
│       │   │   ├── quality/      # Epic 6: QA workflows
│       │   │   └── shipping/     # Epic 7: Order fulfillment
│       │   ├── api/              # API routes (109 endpoints)
│       │   └── auth/             # Authentication pages
│       ├── components/           # React components
│       │   ├── ui/              # shadcn/ui primitives
│       │   └── [module]/        # Module-specific components
│       ├── lib/
│       │   ├── services/        # Business logic
│       │   ├── validation/      # Zod schemas
│       │   └── utils/           # Helper functions
│       └── __tests__/           # Test suites
├── packages/
│   └── shared/                  # Shared types & schemas
│       ├── types/               # TypeScript definitions
│       └── schemas/             # Validation schemas
├── infra/
│   ├── docker/                  # Docker configurations
│   └── nginx/                   # Nginx configs
├── scripts/                     # Automation scripts
└── docs/                        # Documentation
```

## Modules Overview

| Module | Epic | Status | Description |
|--------|------|--------|-------------|
| **Settings** | Epic 1 | Complete | Organization setup, users, roles, locations, machines, allergens |
| **Technical** | Epic 2 | Complete | Product management, BOMs, routings, traceability |
| **Planning** | Epic 3 | Complete | Supplier management, purchase orders, transfer orders, work orders |
| **Production** | Epic 4 | 60% Complete | Production dashboard, WO execution, material consumption, output registration |
| **Warehouse** | Epic 5 | Planned | Inventory management, stock movements, lot tracking |
| **Quality** | Epic 6 | Planned | QA checks, non-conformances, CAPA |
| **Shipping** | Epic 7 | Planned | Sales orders, picking, packing, shipping |
| **NPD** | Epic 8 | Planned | New product development, formula R&D |

## Development

### Running Locally

```bash
# Development mode with hot reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type checking
pnpm type-check

# Linting
pnpm lint
```

### Database Management

```bash
# Pull remote schema
pnpm supabase db pull

# Push local migrations
pnpm supabase db push

# Generate TypeScript types
pnpm supabase gen types typescript --local

# Seed admin user
pnpm seed:admin
```

### Environment Variables

Required variables in `apps/frontend/.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis (optional)
REDIS_URL=your_redis_url

# Email (optional, for notifications)
SENDGRID_API_KEY=your_sendgrid_key
```

## Testing

### Unit Tests

```bash
# Run all unit tests
pnpm test:unit

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

### E2E Tests

```bash
# Run E2E tests
pnpm test:e2e

# Headed mode (see browser)
pnpm test:e2e:headed

# UI mode (interactive)
pnpm test:e2e:ui

# Debug mode
pnpm test:e2e:debug
```

## Documentation

- [Architecture Overview](docs/architecture/index.md)
- [API Documentation](docs/architecture/patterns/api.md)
- [Database Schema](docs/architecture/patterns/database.md)
- [Frontend Patterns](docs/architecture/patterns/frontend.md)
- [Module Guides](docs/architecture/modules/)
- [Security & Authentication](docs/architecture/patterns/security.md)

## Deployment

### Docker

```bash
# Build image
docker build -t monopilot:latest .

# Run container
docker run -p 3000:3000 --env-file .env.local monopilot:latest
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# Stop services
docker-compose down
```

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add new feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test additions/updates
- `chore:` Maintenance tasks

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/your-org/monopilot/issues)
- **Documentation**: [Wiki](https://github.com/your-org/monopilot/wiki)
- **Email**: support@monopilot.io

## Acknowledgments

Built with modern web technologies and best practices:
- Next.js App Router for server-side rendering
- Supabase for real-time database and authentication
- shadcn/ui for accessible component primitives
- React Server Components for optimal performance

---

**Version**: 1.0.0
**Last Updated**: 2025-12-10
**Maintained by**: MonoPilot Development Team
