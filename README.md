# Eye Store Checkout App

Eye Store is a fullstack checkout application for eyewear and eye-care products (frames, lenses, accessories), with card payments processed through WOMPI.

It is a pnpm monorepo with:

- `apps/frontend`: React 19 + Vite 7 SPA
- `apps/backend`: NestJS 10 API with TypeORM + PostgreSQL
- `packages/shared`: shared constants (checkout fees)

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Data Model](#data-model)
- [API Documentation](#api-documentation)
- [Checkout Flow](#checkout-flow)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security Notes](#security-notes)

---

## Tech Stack

| Layer           | Technology                                                                        |
| --------------- | --------------------------------------------------------------------------------- |
| Frontend        | React 19, Vite 7, TypeScript, Redux Toolkit, Tailwind CSS 4, Vitest               |
| Backend         | NestJS 10 (TypeScript), Hexagonal Architecture, Railway-Oriented `Result` pattern |
| Database        | PostgreSQL                                                                        |
| ORM             | TypeORM                                                                           |
| Shared Package  | pnpm workspace package (`@eye-store/shared`)                                      |
| Package Manager | pnpm workspaces                                                                   |

---

## Architecture

The backend uses Ports and Adapters (Hexagonal) and models use cases with `Result<Ok, Err>` composition (`map`, `flatMap`, async variants) in `src/common/result`.

```text
apps/backend/src
├── main.ts
├── app.module.ts
├── config/
│   └── env.validation.ts
├── common/result/
│   ├── index.ts
│   └── result.ts
├── health/
│   └── health.controller.ts
├── products/
│   ├── products.module.ts
│   ├── products.tokens.ts
│   ├── domain/
│   │   ├── models/
│   │   ├── ports/
│   │   ├── errors/
│   │   └── services/
│   ├── adapters/
│   │   ├── inbound/http/
│   │   └── outbound/persistence/
│   └── __tests__/
└── transactions/
    ├── transactions.module.ts
    ├── transactions.tokens.ts
    ├── domain/
    │   ├── models/
    │   ├── ports/
    │   ├── mappers/
    │   ├── errors/
    │   └── services/
    ├── adapters/
    │   ├── inbound/http/
    │   └── outbound/
    │       ├── persistence/
    │       └── wompi/
    └── __tests__/
```

```text
apps/frontend/src
├── main.tsx
├── App.tsx
├── components/
│   ├── catalog/
│   ├── product/
│   ├── checkout/
│   └── ui/
├── store/
│   ├── store.ts
│   ├── hooks.ts
│   ├── middleware/
│   └── slices/
├── services/
├── types/
├── validations/
└── test/
```

---

## Data Model

Current persisted entities are `products` and `transactions`.
Customer and delivery data are stored as columns on `transactions` (not separate tables yet).

```text
┌─────────────────────┐
│      products       │
├─────────────────────┤
│ id (PK, uuid)       │
│ name                │
│ price (decimal)     │
│ description         │
│ type                │  // FRAME | LENS | ACCESSORY
│ stock               │
│ position            │
│ sku (unique)        │
│ image               │
└─────────────────────┘

┌───────────────────────────────┐
│          transactions         │
├───────────────────────────────┤
│ id (PK, uuid)                 │
│ product_id (uuid)             │ -> products.id (domain relation)
│ amount_in_cents (bigint)      │
│ currency (varchar, default COP)│
│ status                        │  // PENDING | APPROVED | DECLINED | ERROR | VOIDED
│ wompi_transaction_id (nullable)│
│ reference (unique)            │
│ customer_name                 │
│ customer_email                │
│ delivery_address              │
│ delivery_city                 │
│ customer_phone                │
│ created_at                    │
│ updated_at                    │
└───────────────────────────────┘
```

---

### Endpoints Summary

| Method | Endpoint                | Description                                      |
| ------ | ----------------------- | ------------------------------------------------ |
| GET    | `/health`               | Liveness check                                   |
| GET    | `/api/stock`            | List catalog products                            |
| GET    | `/api/stock/:id`        | Get product detail                               |
| POST   | `/api/transactions`     | Create and process payment transaction           |
| GET    | `/api/transactions/:id` | Get transaction view and live status progression |

### Example: Create Transaction

Request:

```json
POST /api/transactions
{
  "productId": "uuid",
  "tokenId": "tok_test_xxx",
  "acceptanceToken": "acceptance_test_xxx",
  "customerName": "Jane Doe",
  "customerEmail": "jane@example.com",
  "deliveryAddress": "Street 123",
  "deliveryCity": "Bogota",
  "customerPhone": "+573001112233"
}
```

Response (`201`):

```json
{
  "id": "uuid",
  "status": "PENDING",
  "reference": "EYE-1A2B3C4D",
  "amountInCents": 29400000,
  "productName": "Classic Aviator Frame"
}
```

---

## Checkout Flow

Business flow implemented in the SPA:

`1) Catalog -> 2) Card + Delivery -> 3) Summary -> 4) Result -> 5) Back to Catalog`

Resilience behavior:

- Checkout step and form progress are persisted in `localStorage` under `eye-store-checkout`.
- Persisted data includes product selection, delivery info, tokens, and transaction result.
- Raw card number/CVV are never persisted; card data is tokenized directly against WOMPI.

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 14+

### Install Dependencies

```bash
pnpm install
```

### Run Backend

```bash
pnpm -F backend start:dev
```

### Run Frontend

```bash
pnpm -F frontend dev
```

### Optional: Reseed Products

```bash
pnpm -F backend reseed:products
```

---

## Environment Variables

Create/update:

- `apps/backend/.env`
- `apps/frontend/.env`

Backend (`apps/backend/.env`):

```env
# Required by env validation (except NODE_ENV=test)
WOMPI_API_URL=https://api-sandbox.co.uat.wompi.dev/v1
WOMPI_PRIVATE_KEY=prv_stagtest_xxx
WOMPI_INTEGRITY_KEY=stagtest_integrity_xxx

# API
PORT=3000
NODE_ENV=development

# Database (fallback defaults exist in AppModule)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=eye_store
```

Frontend (`apps/frontend/.env`):

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WOMPI_API_URL=https://api-sandbox.co.uat.wompi.dev/v1
VITE_WOMPI_PUBLIC_KEY=pub_stagtest_xxx
```

---

## Testing

Run tests with workspace filters:

```bash
# Frontend
pnpm -F frontend test
pnpm -F frontend test:cov

# Backend
pnpm -F backend test
pnpm -F backend test:cov
pnpm -F backend test:e2e
```

Single backend test file example:

```bash
pnpm -F backend test -- --testPathPattern=app.controller
```

Coverage target for this project is at least 80% (frontend and backend).

---

## Deployment

The App is deployed on Render at: https://eye-store-frontend.onrender.com/

## Security Notes

- Card details are tokenized against WOMPI from the frontend; backend receives only token references.
- Sensitive keys are read from environment variables.
- Backend uses Nest validation pipe globally (`whitelist: true`, `transform: true`).
- Checkout local storage persistence intentionally excludes raw card number/CVV.
- For production, tighten CORS policy to known frontend origins.
