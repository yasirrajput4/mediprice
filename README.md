<div align="center">

# 🏥 MediPrice

### Hospital Service Price Comparison Marketplace

Search, compare, and book diagnostic & hospital services at transparent, upfront prices — from verified hospitals near you.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [API Reference](#-api-reference) • [Project Structure](#-project-structure)

</div>

---

## 📋 Overview

**MediPrice** solves a real problem in healthcare: patients have no easy way to compare prices for diagnostic tests and procedures across hospitals before booking. This platform lets users search a service (e.g. _MRI_, _Blood Test_, _X-Ray_), compare prices, ratings, and wait times across nearby hospitals, and book + pay for an appointment — all in one flow.

It also includes a **hospital admin panel** so hospital staff can manage their own service pricing, wait times, and incoming bookings in real time.

---

## ✨ Features

### For Patients

- 🔍 **Smart search** — find any diagnostic or medical service by name or category
- 📊 **Side-by-side comparison** — price, rating, distance, and wait time across hospitals
- 🏥 **Hospital profiles** — accreditations, facilities, full service list, and patient reviews
- 📅 **Slot-based booking** — pick a date and time, no double-booking (DB-level locking)
- 💳 **Secure payments** — integrated Razorpay checkout with signature verification
- ⭐ **Reviews & ratings** — leave a verified review after a completed visit
- 📱 **Fully responsive** — works seamlessly on mobile and desktop

### For Hospital Admins

- 📈 **Live dashboard** — bookings today/this month, revenue, average rating, average wait time
- 💰 **Price management** — inline editing of service prices, with full price-change history
- 📋 **Booking management** — filter by date/status, update booking status (confirmed → completed, etc.)
- 🔐 **Role-based access** — hospital admins only manage their own hospital's data

---

## 🛠 Tech Stack

| Layer                | Technology                                         |
| -------------------- | -------------------------------------------------- |
| **Frontend**         | React 18, Vite, Tailwind CSS, React Query, Zustand |
| **Backend**          | Node.js, Express                                   |
| **Database**         | PostgreSQL (with materialized views for stats)     |
| **Search**           | Elasticsearch                                      |
| **Cache**            | Redis                                              |
| **Payments**         | Razorpay                                           |
| **Auth**             | JWT (short-lived access + rotating refresh tokens) |
| **Maps**             | Google Maps API                                    |
| **Charts**           | Recharts                                           |
| **Containerization** | Docker & Docker Compose                            |

---

## 📁 Project Structure

```
mediprice/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                    # PostgreSQL pool + query helper
│   │   │   ├── redis.js                 # Redis client + cache get/set helpers
│   │   │   ├── elasticsearch.js         # Elasticsearch client + service indexing
│   │   │   └── migrate.js               # Migration runner script
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.js        # Register, login, refresh, logout
│   │   │   ├── hospitalController.js    # List/search hospitals, profiles, slots
│   │   │   ├── serviceController.js     # Service search, categories, trending
│   │   │   ├── bookingController.js     # Create/cancel bookings, reviews
│   │   │   ├── paymentController.js     # Razorpay order creation + verification
│   │   │   └── adminController.js       # Hospital dashboard, price management
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js                  # JWT verification, role guards
│   │   │   └── errorHandler.js          # Centralized error handling
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── hospitals.js
│   │   │   ├── services.js
│   │   │   ├── bookings.js
│   │   │   ├── payments.js
│   │   │   └── admin.js
│   │   │
│   │   ├── utils/
│   │   │   └── logger.js                # Winston logger
│   │   │
│   │   └── index.js                     # Express app entry point
│   │
│   ├── migrations/
│   │   ├── 001_schema.sql               # Tables, indexes, materialized views
│   │   └── 002_seed.sql                 # Sample hospitals, services & prices
│   │
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Layout.jsx           # Navbar, footer, page wrapper
│   │   │   │   └── UI.jsx               # StarRating, Badge, PriceTag, Pagination…
│   │   │   └── admin/
│   │   │       └── AdminLayout.jsx      # Sidebar nav for the admin panel
│   │   │
│   │   ├── pages/
│   │   │   ├── HomePage.jsx             # Hero search, categories, trending
│   │   │   ├── SearchPage.jsx           # Filters + hospital results list
│   │   │   ├── HospitalPage.jsx         # Hospital profile, services, reviews
│   │   │   ├── BookingPage.jsx          # Slot picker → patient form → payment
│   │   │   ├── BookingConfirmPage.jsx   # Post-payment confirmation screen
│   │   │   ├── MyBookingsPage.jsx       # Patient's booking history
│   │   │   ├── LoginPage.jsx            # Login + Register forms
│   │   │   ├── RegisterPage.jsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboardPage.jsx   # Stats, charts, recent bookings
│   │   │       ├── AdminServicesPage.jsx    # Inline price/wait-time editing
│   │   │       └── AdminBookingsPage.jsx    # Booking list + status updates
│   │   │
│   │   ├── services/
│   │   │   ├── api.js                   # Axios instance + auto token refresh
│   │   │   ├── apiServices.js           # All typed API call functions
│   │   │   └── razorpay.js              # Razorpay checkout integration
│   │   │
│   │   ├── store/
│   │   │   └── authStore.js             # Zustand auth store (persisted)
│   │   │
│   │   ├── App.jsx                      # Route definitions
│   │   ├── main.jsx                     # React entry point
│   │   └── index.css                    # Tailwind base + custom components
│   │
│   ├── index.html
│   ├── .env.example
│   ├── Dockerfile
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── docker-compose.yml        # One-command local environment (Postgres, Redis, ES, both apps)
├── .gitignore                 # Root-level ignore rules (node_modules, .env, etc.)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

| Tool          | Version                       |
| ------------- | ----------------------------- |
| Node.js       | 18+                           |
| PostgreSQL    | 15+                           |
| Redis         | 7+                            |
| Elasticsearch | 8+ _(optional for local dev)_ |

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/mediprice.git
cd mediprice
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configure environment variables

```bash
# Backend
cd backend
cp .env.example .env
# → fill in DATABASE_URL, JWT secrets, Razorpay keys, Google Maps key

# Frontend
cd ../frontend
cp .env.example .env
```

### 4. Set up the database

```bash
cd backend
npm run migrate     # creates all tables, indexes, and views
npm run seed         # optional — loads 5 sample hospitals + 20 services
```

### 5. Run the app

**Option A — Docker (recommended, spins up everything at once):**

```bash
docker-compose up
```

**Option B — Manually, in two terminals:**

```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

| Service     | URL                   |
| ----------- | --------------------- |
| Frontend    | http://localhost:5173 |
| Backend API | http://localhost:4000 |

> **Demo admin login:** `admin@mediprice.demo` / `Admin@123`

---

## 📡 API Reference

### Auth

| Method | Endpoint             | Description                              |
| ------ | -------------------- | ---------------------------------------- |
| `POST` | `/api/auth/register` | Register a new patient account           |
| `POST` | `/api/auth/login`    | Log in and receive access/refresh tokens |
| `POST` | `/api/auth/refresh`  | Rotate an expired access token           |
| `GET`  | `/api/auth/me`       | Get the current authenticated user       |

### Services & Hospitals

| Method | Endpoint                      | Description                                                      |
| ------ | ----------------------------- | ---------------------------------------------------------------- |
| `GET`  | `/api/services/search`        | Search services by name, category, or city                       |
| `GET`  | `/api/services/trending`      | Most-booked services for a given city                            |
| `GET`  | `/api/hospitals`              | List hospitals with filters (price, rating, wait time, distance) |
| `GET`  | `/api/hospitals/:id`          | Full hospital profile                                            |
| `GET`  | `/api/hospitals/:id/services` | All services & prices at a hospital                              |
| `GET`  | `/api/hospitals/:id/slots`    | Available booking time slots                                     |

### Bookings & Payments

| Method  | Endpoint                   | Description                                |
| ------- | -------------------------- | ------------------------------------------ |
| `POST`  | `/api/bookings`            | Create a new booking                       |
| `GET`   | `/api/bookings/:id`        | Get booking details                        |
| `PATCH` | `/api/bookings/:id/cancel` | Cancel a booking                           |
| `POST`  | `/api/payments/order`      | Create a Razorpay order for a booking      |
| `POST`  | `/api/payments/verify`     | Verify payment signature & confirm booking |

### Admin _(requires `hospital_admin` role)_

| Method  | Endpoint                                            | Description                              |
| ------- | --------------------------------------------------- | ---------------------------------------- |
| `GET`   | `/api/admin/:hospitalId/dashboard`                  | Stats, recent bookings, top services     |
| `GET`   | `/api/admin/:hospitalId/services`                   | List all services for the hospital       |
| `PUT`   | `/api/admin/:hospitalId/services/:serviceId`        | Update price / wait time / availability  |
| `GET`   | `/api/admin/:hospitalId/bookings`                   | List bookings, filterable by date/status |
| `PATCH` | `/api/admin/:hospitalId/bookings/:bookingId/status` | Update a booking's status                |

---

## 🎬 Demo Flow

1. Search **"X-ray"** on the home page
2. Filter results by price range and minimum rating
3. Open a hospital's profile to view its full price list and reviews
4. Select a service → pick an available time slot → enter patient details
5. Pay securely via Razorpay (test mode)
6. Receive an instant booking confirmation

---

## 🗺 Roadmap (v2+)

- [ ] Real-time wait-time estimation via live hospital data feeds
- [ ] Insurance plan integration & co-pay estimation
- [ ] AI-based price fairness scoring across regions
- [ ] SMS/WhatsApp appointment reminders
- [ ] Emergency mode — fastest-available-slot routing

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with React, Node.js, PostgreSQL & Razorpay**

</div>
