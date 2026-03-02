# AGENT.md

This file provides guidance when working with code in this repository.

## Project Overview

Eye Store is a single-page application (SPA) for selling eyewear and eye care products — glasses, frames, eye drops, and other eye utilities. Payments are processed through the **WOMPI API**. The project is a monorepo with a React frontend and NestJS backend, managed by pnpm workspaces.

## Business Process Flow (5-Step Checkout)

The app follows a linear 5-step screen flow:

1. **Product Page** — Browse and select products from the catalog
2. **Credit Card / Delivery Info** — Enter payment (WOMPI) and shipping details
3. **Summary** — Review order before confirming
4. **Final Status** — Display transaction result (success/failure/pending)
5. **Product Page** — Return to catalog after completion

Each step must be reachable only after completing the previous one. The app must be **resilient**: persist checkout progress (current step, cart, form data) to `localStorage` so the client can recover on page refresh or accidental navigation.

## Monorepo Structure

- `apps/frontend/` — React 19, Vite 7, TypeScript, Redux (Flux Architecture), Tailwind CSS, mobile-first (ES modules)
- `apps/backend/` — NestJS 10, Express, TypeScript, Hexagonal Architecture, TypeORM, PostgreSQL (CommonJS)
- `packages/shared/` — Shared code placeholder (not yet populated)

## Commands

All commands use pnpm workspace filters (`-F`/`--filter`).

### Frontend

```bash
pnpm -F frontend dev        # Start Vite dev server with HMR
pnpm -F frontend build      # Type-check (tsc -b) then Vite build
pnpm -F frontend lint       # ESLint (flat config)
pnpm -F frontend preview    # Preview production build
pnpm -F frontend test       # Run unit tests
pnpm -F frontend test:cov   # Run tests with coverage report
```

### Backend

```bash
pnpm -F backend start:dev   # NestJS dev server with --watch
pnpm -F backend build       # nest build
pnpm -F backend lint        # ESLint with --fix
pnpm -F backend format      # Prettier (src + test)
pnpm -F backend test        # Jest unit tests
pnpm -F backend test:watch  # Jest in watch mode
pnpm -F backend test:cov    # Jest with coverage
pnpm -F backend test:e2e    # E2E tests (uses test/jest-e2e.json config)
```

Run a single backend test file:

```bash
pnpm -F backend test -- --testPathPattern=app.controller
```

## Architecture

### Backend (NestJS — Hexagonal Architecture)

The backend follows **Hexagonal Architecture** (Ports & Adapters) organized by feature module. Uses dependency injection throughout. Backend port defaults to 3000 (configurable via `PORT` env variable).

**Use Cases follow Railway Oriented Programming (ROP):** each use case returns `Result<Success, Failure>` — chain operations with `map`/`flatMap`, propagate errors without try/catch.

```
src/
├── main.ts
├── app.module.ts
├── health/
│   └── health.controller.ts
└── products/
    ├── products.module.ts
    ├── products.tokens.ts
    ├── domain/
    │   ├── models/
    │   │   ├── product.ts
    │   │   └── product-type.enum.ts
    │   ├── ports/
    │   │   ├── inbound/
    │   │   │   ├── get-product-by-id.use-case.ts
    │   │   │   └── get-products.use-case.ts
    │   │   └── outbound/
    │   │       └── product-repository.port.ts
    │   └── services/
    │       ├── get-product-by-id.service.ts
    │       └── get-products.service.ts
    ├── adapters/
    │   ├── inbound/http/
    │   │   ├── product.controller.ts
    │   │   ├── dto/product-response.dto.ts
    │   │   └── mappers/product-http.mapper.ts
    │   └── outbound/persistence/
    │       ├── product.repository.ts
    │       ├── product-seed.service.ts
    │       ├── entities/product.orm-entity.ts
    │       └── mappers/product-persistence.mapper.ts
    └── __tests__/
        ├── adapters/product.controller.spec.ts
        └── domain/
            ├── get-product-by-id.service.spec.ts
            └── get-products.service.spec.ts

test/
├── app.e2e-spec.ts
└── jest-e2e.json
```

**Feature Modules (API Resources):**

- **Health** (`/health`) — Liveness endpoint (GET)
- **Products / Stock** (`/api/stock`) — Product catalog listing and details (GET, GET by `:id`)

Use DTOs for request validation and response shaping. Additional resources like transactions/customers/deliveries can be added as new feature modules when implemented.

**Database:** TypeORM with PostgreSQL. Domain models live in `domain/models/`. TypeORM ORM entities live in `adapters/outbound/persistence/entities/`. Persistence mappers translate between domain models and ORM entities.

**Tests:** Jest with ts-jest. Unit tests are under `src/products/__tests__/`. E2E tests live in `test/` at the app root using `supertest`.

### Frontend (React + Vite + Tailwind)

Entry point: `src/main.tsx` → `App.tsx`. Uses functional components with hooks.

**State Management — Redux + Flux Architecture:**

- Follow Flux unidirectional data flow: Action → Dispatcher → Store → View
- Use Redux Toolkit with slices for each domain (cart, checkout, products, transactions)
- Store payment transaction data in Redux state AND persist to `localStorage` for resilience
- Never store raw credit card numbers in state or localStorage — only WOMPI tokenized references

**Mobile-First Design:**

- All layouts must be designed mobile-first, scaling up to desktop
- Use Tailwind CSS responsive prefixes (`sm:`, `md:`, `lg:`) — base styles target mobile
- Images must use lazy loading (`loading="lazy"`), `srcSet` for responsive sizes, and optimized formats (WebP with fallbacks)
- No UI elements should overflow their containers or cause horizontal scroll (no out-of-boundary elements)
- Touch targets must be at least 44x44px

**Session Resilience:**

- Persist checkout state (current step, cart contents, form progress) to `localStorage` on every meaningful state change
- On app load, rehydrate Redux store from `localStorage` to recover client progress
- Clear persisted checkout data only after successful order completion (step 4 → step 5 transition)

## Security — Sensitive Data Handling

- **Never log or persist raw credit card numbers** — rely on WOMPI tokenization
- **WOMPI API keys** must be stored in environment variables, never committed to source
- **Sanitize all user input** at the controller layer before passing to use cases
- **localStorage** may store: cart items, checkout step, delivery info, WOMPI transaction references. It must **never** store: card numbers, CVVs, or API secrets
- Use HTTPS-only for all API communication
- Validate WOMPI webhook signatures to prevent spoofed transaction updates

## Key Development Principles

- **Functional components only** (no class components)
- **Named exports only** (no default exports)
- **Types over interfaces**
- **No 'any' type allowed**
- **Event handlers preferred over useEffect** for state updates
- **Composition over inheritance**

## Naming Conventions

- **Variables/functions**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE
- **Types/Classes**: PascalCase (suffix component props with `Props`, e.g. `ButtonProps`)
- **Files/directories**: kebab-case with descriptive suffixes (`.component.tsx`, `.service.ts`, `.entity.ts`, `.dto.ts`, `.module.ts`, `.use-case.ts`, `.port.ts`, `.adapter.ts`, `.vo.ts`, `.enum.ts`, `.mapper.ts`, `.orm-entity.ts`)
- **TypeScript generics**: descriptive names (`TData` not `T`)

## File Structure

- Components under 300 lines, services under 500 lines
- Components in their own directories with tests
- Use `index.ts` barrel exports for clean imports
- Import order: external libraries first, then internal (`@/`), then relative

## Comments

- Use short-form comments (`//`), not JSDoc blocks
- Explain WHY (business logic), not WHAT
- Do not comment obvious code
- Multi-line comments use multiple `//` lines, not `/** */`

## Testing Strategy

- **Minimum 80% code coverage** for both frontend and backend — enforced and reported in README.md
- **Test behavior, not implementation** — focus on user perspective
- **Test pyramid**: 70% unit, 20% integration, 10% E2E
- Query by user-visible elements (text, roles, labels) over test IDs
- Use `@testing-library/user-event` for realistic interactions
- Descriptive test names: "should [behavior] when [condition]"
- Clear mocks between tests with `jest.clearAllMocks()`
- **Frontend tests**: Vitest + React Testing Library. Unit tests co-located with components.
- **Backend tests**: Jest with ts-jest. Unit tests in `__tests__/` within each feature module. E2E tests in `test/`.
- **ROP use cases** must be tested for both success and failure tracks
- **Coverage reports** must be generated and the badge/summary included in the project README.md

## Code Style

- **Backend:** Prettier enforced — single quotes, trailing commas (`all`). ESLint with TypeScript plugin.
- **Frontend:** ESLint flat config with react-hooks and react-refresh plugins. Tailwind CSS for all styling.
- **Backend TypeScript** is relaxed (`noImplicitAny: false`, `strictNullChecks: false`).
- **Frontend TypeScript** is strict mode with strict null checks.

## Development Workflow

IMPORTANT: Use Context7 for code generation, setup or configuration steps, or library/API documentation. Automatically use the Context7 MCP tools to resolve library IDs and get library docs without waiting for explicit requests.

## Rules

- Before writing any code, describe your approach and wait for approval. Always ask clarifying questions before writing any code if requirements are ambiguous.
- After writing code, list what could break and suggest tests to cover it.
- When there's a bug, write a test that reproduces it, then fix it until the test passes.
- Every time I correct you, add a new rule to the CLAUDE.md file so it never happens again.

### What not to do

- Don't build for future imaginary requirements.
- Don't add complex error handling or edge cases that probably won't happen.
