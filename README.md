# 💸 Splitwise Lite

A production-ready, lightweight expense-splitting application built with **TypeScript**, **Next.js 14 (App Router)**, and **Clean Architecture**.

> Track shared expenses across groups of friends, see who owes whom, and get a minimal list of payments to settle all debts.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Clean Architecture Layers](#clean-architecture-layers)
- [REST API Reference](#rest-api-reference)
- [Running Tests](#running-tests)
- [Linting & Formatting](#linting--formatting)
- [Roadmap](#roadmap)

---

## Features

- 👤 Register users with validated email addresses
- 👥 Create expense-sharing groups with 2+ members
- 💳 Record expenses with flexible per-member splits
- ⚖️ Compute net balances per group member
- 🤝 Suggest a **minimal** set of payments to settle all debts (greedy algorithm)
- ✅ Full domain invariant enforcement (immutable value objects, entity constructors)
- 🧪 Unit & integration tests for every layer

---

## Tech Stack

| Concern            | Choice                                 |
|--------------------|----------------------------------------|
| Language           | TypeScript 5 (strict mode)             |
| Framework          | Next.js 14 — App Router                |
| Architecture       | Clean Architecture (4-layer)           |
| Persistence        | In-memory (swap-ready for any DB)      |
| ID generation      | UUID v4                                |
| Testing            | Jest + ts-jest                         |
| Linting            | ESLint + `@typescript-eslint`          |
| Formatting         | Prettier                               |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9 (or pnpm / yarn)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.local.example .env.local

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

### Available Scripts

| Script               | Description                               |
|----------------------|-------------------------------------------|
| `npm run dev`        | Start Next.js dev server with HMR         |
| `npm run build`      | Production build                          |
| `npm start`          | Start production server                   |
| `npm run type-check` | TypeScript type-checking (no emit)        |
| `npm run lint`       | ESLint check                              |
| `npm run lint:fix`   | ESLint auto-fix                           |
| `npm run format`     | Prettier format all files                 |
| `npm test`           | Run all Jest tests                        |
| `npm run test:watch` | Jest in watch mode                        |
| `npm run test:coverage` | Test coverage report                   |

---

## Project Structure

```
splitwise-lite/
├── src/
│   ├── domain/                   # 🔵 Business rules — zero external deps
│   │   ├── entities/
│   │   │   ├── User.ts
│   │   │   ├── Group.ts
│   │   │   └── Expense.ts
│   │   ├── value-objects/
│   │   │   ├── UserId.ts
│   │   │   ├── GroupId.ts
│   │   │   ├── ExpenseId.ts
│   │   │   ├── Email.ts
│   │   │   └── Money.ts
│   │   ├── repositories/         # interfaces (contracts only)
│   │   │   ├── IUserRepository.ts
│   │   │   ├── IGroupRepository.ts
│   │   │   └── IExpenseRepository.ts
│   │   ├── services/
│   │   │   └── BalanceCalculator.ts
│   │   └── exceptions/
│   │       └── DomainException.ts
│   │
│   ├── application/              # 🟢 Use cases — orchestrates domain
│   │   ├── dtos/
│   │   │   ├── UserDto.ts
│   │   │   ├── GroupDto.ts
│   │   │   ├── ExpenseDto.ts
│   │   │   └── BalanceDto.ts
│   │   ├── mappers/
│   │   │   ├── UserMapper.ts
│   │   │   ├── GroupMapper.ts
│   │   │   └── ExpenseMapper.ts
│   │   ├── ports/
│   │   │   └── IIdGenerator.ts
│   │   └── use-cases/
│   │       ├── user/
│   │       │   ├── CreateUserUseCase.ts
│   │       │   ├── GetUserByIdUseCase.ts
│   │       │   └── ListUsersUseCase.ts
│   │       ├── group/
│   │       │   ├── CreateGroupUseCase.ts
│   │       │   └── GetGroupByIdUseCase.ts
│   │       ├── expense/
│   │       │   ├── AddExpenseUseCase.ts
│   │       │   └── GetGroupExpensesUseCase.ts
│   │       └── balance/
│   │           └── GetGroupBalancesUseCase.ts
│   │
│   ├── infrastructure/           # 🟠 Implementations — I/O details
│   │   ├── persistence/
│   │   │   ├── InMemoryUserRepository.ts
│   │   │   ├── InMemoryGroupRepository.ts
│   │   │   └── InMemoryExpenseRepository.ts
│   │   ├── id/
│   │   │   └── UuidIdGenerator.ts
│   │   └── container.ts          # ← composition root / DI wiring
│   │
│   └── interfaces/               # 🟣 Entry points — thin HTTP adapters
│       └── http/
│           └── helpers/
│               └── apiResponse.ts
│
├── src/app/                      # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/
│       ├── users/
│       │   ├── route.ts          # GET /api/users, POST /api/users
│       │   └── [id]/route.ts     # GET /api/users/:id
│       └── groups/
│           ├── route.ts          # POST /api/groups
│           └── [groupId]/
│               ├── route.ts      # GET /api/groups/:id
│               ├── expenses/
│               │   └── route.ts  # GET/POST /api/groups/:id/expenses
│               └── balances/
│                   └── route.ts  # GET /api/groups/:id/balances
│
├── next.config.ts
├── tsconfig.json
├── jest.config.ts
├── .eslintrc.json
├── .prettierrc
└── package.json
```

---

## Clean Architecture Layers

This project strictly follows [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html). The dependency rule is **absolute**: source code dependencies may only point inward.

```
  interfaces  ──►  application  ──►  domain
  infrastructure ──►  application  ──►  domain
```

### 🔵 `src/domain/` — The Core

The innermost layer. Contains all business rules. **Has zero external dependencies** — not even on Next.js or Node.js built-ins.

- **Entities** — Objects with identity and lifecycle (`User`, `Group`, `Expense`). They protect their own invariants in their constructors; invalid state cannot be created.
- **Value Objects** — Immutable, equality-by-value wrappers (`Money`, `Email`, `UserId`, …).
- **Domain Services** — Logic that doesn't belong to a single entity (`BalanceCalculator`).
- **Repository Interfaces** — Pure TypeScript interfaces that describe *what* persistence operations exist, never *how* they work.
- **Exceptions** — Domain-specific error types (`EntityNotFoundException`, `DuplicateEntityException`).

### 🟢 `src/application/` — Use Cases

Orchestrates domain objects to fulfil product requirements. Imports only from `domain/`.

- **Use Cases** — One class per operation, each with a single `execute(dto)` method.
- **DTOs** — Plain input/output types; domain entities never cross this boundary.
- **Mappers** — Convert domain entities → response DTOs.
- **Ports** — Abstractions for infrastructure concerns (e.g. `IIdGenerator`).

### 🟠 `src/infrastructure/` — Implementations

The "dirty" layer: all I/O lives here. Implements interfaces from `domain/` and `application/`.

- **Repositories** — Currently in-memory (`InMemoryUserRepository`, etc.). Swap for Postgres/Prisma without changing a single line of domain or application code.
- **ID Generator** — `UuidIdGenerator` wraps the `uuid` library.
- **`container.ts`** — The composition root. All `new` calls for concrete classes live here.

### 🟣 `src/interfaces/` + `src/app/api/` — Adapters & Entry Points

The outermost layer. Translates HTTP ↔ use cases. Controllers are intentionally thin:

```
validate input → call use case → serialize output
```

No business logic, no direct repository calls, no domain entity manipulation.

---

## REST API Reference

All responses use the envelope:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "NOT_FOUND", "message": "..." } }
```

| Method | Endpoint                               | Description                              |
|--------|----------------------------------------|------------------------------------------|
| GET    | `/api/users`                           | List all users                           |
| POST   | `/api/users`                           | Register a new user                      |
| GET    | `/api/users/:id`                       | Get a user by ID                         |
| POST   | `/api/groups`                          | Create a new group                       |
| GET    | `/api/groups/:groupId`                 | Get a group by ID                        |
| GET    | `/api/groups/:groupId/expenses`        | List all expenses for a group            |
| POST   | `/api/groups/:groupId/expenses`        | Add an expense to a group                |
| GET    | `/api/groups/:groupId/balances`        | Compute balances and suggested settlements |

### Example: Full workflow

```bash
# 1. Create users
curl -s -X POST http://localhost:3000/api/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alice","email":"alice@example.com"}' | jq .

curl -s -X POST http://localhost:3000/api/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Bob","email":"bob@example.com"}' | jq .

# 2. Create a group (replace <alice-id> and <bob-id>)
curl -s -X POST http://localhost:3000/api/groups \
  -H 'Content-Type: application/json' \
  -d '{"name":"Road Trip","memberIds":["<alice-id>","<bob-id>"]}' | jq .

# 3. Alice pays $60 for dinner, split evenly (replace <group-id> and IDs)
curl -s -X POST http://localhost:3000/api/groups/<group-id>/expenses \
  -H 'Content-Type: application/json' \
  -d '{
    "payerId": "<alice-id>",
    "amountInCents": 6000,
    "currency": "USD",
    "description": "Dinner",
    "splits": [
      {"userId":"<alice-id>","amountInCents":3000},
      {"userId":"<bob-id>","amountInCents":3000}
    ]
  }' | jq .

# 4. Check who owes what
curl -s http://localhost:3000/api/groups/<group-id>/balances | jq .
# → Bob owes Alice $30.00
```

---

## Running Tests

```bash
# Run all tests once
npm test

# Watch mode
npm run test:watch

# Coverage report (written to ./coverage/)
npm run test:coverage
```

Tests are co-located under `__tests__/` directories within each layer:

```
src/domain/__tests__/          ← pure unit tests, no mocks needed
src/application/__tests__/     ← use-case tests using in-memory repos
```

---

## Linting & Formatting

```bash
npm run lint          # check ESLint rules
npm run lint:fix      # auto-fix what's possible
npm run format        # run Prettier
npm run format:check  # CI-safe Prettier check
npm run type-check    # tsc --noEmit
```

ESLint is configured with `import/no-restricted-paths` rules that **enforce the Clean Architecture dependency rule at the linter level** — cross-layer imports will fail the lint check.

---

## Roadmap

- [ ] Replace in-memory repositories with Prisma + PostgreSQL
- [ ] Add NextAuth.js authentication
- [ ] Add a React front-end (group dashboard, expense form)
- [ ] Support multiple currencies with exchange-rate conversion
- [ ] Soft-delete / archive expenses
- [ ] Recurring expenses

---

## Licence

MIT
