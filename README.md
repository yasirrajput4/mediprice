# MediPrice — Hospital Service Price Comparison Marketplace

A full-stack marketplace for comparing diagnostic/service prices from nearby hospitals and clinics, with ratings, wait-time estimates, and booking/payment.

## Tech Stack

| Layer    | Technology                     |
| -------- | ------------------------------ |
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend  | Node.js + Express              |
| Database | PostgreSQL + Elasticsearch     |
| Cache    | Redis                          |
| Payments | Razorpay                       |
| Auth     | JWT (access + refresh tokens)  |
| Maps     | Google Maps API                |

## Project Structure

```
mediprice/
├── backend/
│   ├── src/
│   │   ├── config/         # DB, Redis, Elasticsearch config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, error handling, rate limiting
│   │   ├── models/         # Postgres query functions
│   │   ├── routes/         # Express routers
│   │   └── utils/          # Helpers (mailer, razorpay, etc.)
│   ├── migrations/         # SQL migration files
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service functions
│   │   ├── context/        # React context providers
│   │   └── utils/          # Helpers
│   └── package.json
└── docker-compose.yml
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Elasticsearch 8+ (optional for dev)

### 1. Clone & install

```bash
git clone <repo>
cd mediprice

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Fill in your values (DB, Redis, Razorpay, Google Maps, JWT secret)

# Frontend
cp frontend/.env.example frontend/.env
```

### 3. Run database migrations

```bash
cd backend
npm run migrate
npm run seed   # optional sample data
```

### 4. Start services

```bash
# Option A — Docker (recommended)
docker-compose up

# Option B — manual
cd backend && npm run dev
cd frontend && npm run dev
```

Frontend: http://localhost:5173
Backend API: http://localhost:4000

## API Overview

| Method | Endpoint                      | Description                         |
| ------ | ----------------------------- | ----------------------------------- |
| GET    | `/api/services/search`        | Search services by query + location |
| GET    | `/api/hospitals`              | List hospitals with filters         |
| GET    | `/api/hospitals/:id`          | Hospital profile                    |
| GET    | `/api/hospitals/:id/services` | Hospital services with prices       |
| POST   | `/api/bookings`               | Create booking                      |
| GET    | `/api/bookings/:id`           | Booking detail                      |
| POST   | `/api/payments/order`         | Create Razorpay order               |
| POST   | `/api/payments/verify`        | Verify Razorpay payment             |
| POST   | `/api/auth/register`          | User registration                   |
| POST   | `/api/auth/login`             | User login                          |
| GET    | `/api/admin/services`         | Admin: list services                |
| PUT    | `/api/admin/services/:id`     | Admin: update price/wait            |

## Demo Flow

1. Search "X-ray near me" on the home screen
2. Filter by price range and rating
3. Click a hospital to view profile + prices
4. Select a service → pick a time slot → enter details
5. Pay via Razorpay (test mode)
6. Receive confirmation screen + SMS
