<div align="center">

# 🎬 CineBook — Screenly

### A Full-Stack Movie Ticket Booking Platform

[![GitHub Repo](https://img.shields.io/badge/GitHub-Screenly-blue?logo=github)](https://github.com/PrakashPalsaniya/Screenly)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)](https://www.mongodb.com)
[![Redis](https://img.shields.io/badge/Redis-Seat%20Locking-DC382D?logo=redis)](https://redis.io)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-Notifications-FF6600?logo=rabbitmq)](https://www.rabbitmq.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com)

> **CineBook** (also known as **Screenly**) is a production-ready, full-stack movie ticket booking application. Users can browse movies, pick showtimes, select seats, and pay online — all with real-time seat locking to prevent double bookings.

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Setup](#environment-setup)
  - [Run with Docker](#run-with-docker-recommended)
  - [Run Manually](#run-manually)
- [API Routes](#-api-routes)
- [Environment Variables](#-environment-variables)
- [Key Concepts](#-key-concepts)
- [Scripts](#-scripts)
- [Contributing](#-contributing)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎥 **Movie Browsing** | Browse now-playing and upcoming movies powered by TMDB API |
| 🏟️ **Theater & Shows** | View theaters, show timings, and available seats |
| 🪑 **Real-Time Seat Locking** | Redis-backed seat locking to prevent race conditions during concurrent bookings |
| 💳 **Online Payments** | Razorpay integration for secure payment processing |
| 🔔 **Email Notifications** | Booking confirmation emails via async RabbitMQ event queue |
| 🔄 **Live Updates** | Socket.IO for real-time seat availability updates |
| 👤 **User Auth** | JWT-based auth with access & refresh tokens via HTTP-only cookies |
| 🛡️ **Admin Panel** | Admins can create shows, manage bookings, and view analytics |
| 🎫 **Booking History** | Users can view all past bookings and download tickets |
| 🐳 **Docker Ready** | Full Docker Compose setup for one-command local deployment |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 7** | Build tool & dev server |
| **Redux Toolkit** | Global state management |
| **React Router v7** | Client-side routing |
| **Tailwind CSS v4** | Styling |
| **Socket.IO Client** | Real-time seat updates |
| **Axios** | HTTP requests |
| **Lucide React** | Icon library |
| **React Hot Toast** | Notifications |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | REST API server |
| **MongoDB + Mongoose** | Primary database |
| **Redis (ioredis)** | Seat locking & caching |
| **RabbitMQ (amqplib)** | Async email/event processing |
| **Socket.IO** | Real-time seat sync |
| **JWT** | Authentication tokens |
| **Razorpay SDK** | Payment processing |
| **Nodemailer + Mailgen** | Email delivery |
| **Zod** | Input validation |
| **AWS S3 / Cloudinary** | Media asset storage |

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│              React + Vite + Redux + Tailwind CSS             │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP / WebSocket
┌────────────────────────────▼────────────────────────────────┐
│                   Express Backend API                        │
│                  /api/v1/* REST endpoints                    │
└──┬──────────┬──────────┬──────────┬────────────┬────────────┘
   │          │          │          │            │
   ▼          ▼          ▼          ▼            ▼
MongoDB    Redis      RabbitMQ   Razorpay     TMDB API
(data)  (seat lock) (email que) (payments) (movie data)
                        │
                        ▼
                  Email Consumer
                (Nodemailer/SMTP)
```

### How Seat Locking Works

```
User selects seat
      │
      ▼
Backend tries to lock seat in Redis (TTL: ~5 min)
      │
   ┌──┴──────────────────┐
   │                     │
Lock acquired         Already locked
   │                     │
Proceed to payment    Return error to user
   │                     (seat unavailable)
   ▼
Payment success → Save booking to MongoDB → Release Redis lock
```

---

## 📁 Project Structure

```
CineBook/
├── backend/                    # Node.js + Express API
│   └── src/
│       ├── app.js              # Express app setup (CORS, middleware)
│       ├── server.js           # Server entry point + Socket.IO
│       ├── config/             # DB, Redis, RabbitMQ, JWT config
│       ├── middlewares/        # Auth guard, error handler
│       ├── modules/
│       │   ├── auth/           # Register, login, token refresh
│       │   ├── movie/          # Movie listing & details (TMDB)
│       │   ├── theater/        # Theater data
│       │   ├── show/           # Show creation & retrieval
│       │   ├── booking/        # Seat selection & booking confirm
│       │   ├── payment/        # Razorpay order creation
│       │   ├── user/           # Profile & booking history
│       │   └── notifications/  # RabbitMQ producer & consumer
│       ├── routes/             # Route aggregator
│       ├── socket/             # Socket.IO event handlers
│       ├── scripts/            # Seed & sync scripts
│       └── utils/              # Shared utilities
│
├── frontend/                   # React + Vite SPA
│   └── src/
│       ├── App.jsx             # Root routes & layout
│       ├── pages/
│       │   ├── Movies.jsx      # Movie listing page
│       │   ├── MovieDetails.jsx # Movie detail & show times
│       │   ├── SeatLayout.jsx  # Interactive seat picker
│       │   ├── Checkout.jsx    # Payment & booking confirm
│       │   ├── Ticket.jsx      # Booking ticket view
│       │   ├── Bookings.jsx    # User booking history
│       │   ├── AdminShows.jsx  # Admin: manage shows
│       │   └── AdminBookings.jsx # Admin: view all bookings
│       ├── redux/              # Store, slices, thunks
│       ├── components/         # Reusable UI components
│       ├── apis/               # Axios API call wrappers
│       ├── hooks/              # Custom React hooks
│       └── utils/              # Helper functions
│
├── docker-compose.yml          # Full stack Docker setup
├── .env.example                # Root env template
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **Docker & Docker Compose** (recommended)
- **MongoDB** (local or Atlas)
- **Redis** (local or hosted)
- **RabbitMQ** (local or CloudAMQP)
- **Razorpay** account (for payments)
- **TMDB API** key (for movie data)
- **Cloudinary** account (for media)

---

### Environment Setup

**Step 1:** Copy env files and fill in your values:

```bash
# Root-level env (used by Docker Compose)
copy .env.example .env

# Backend env
copy backend/.env.example backend/.env
```

**Step 2:** Fill in the required values in `backend/.env` (see [Environment Variables](#-environment-variables) section below).

---

### Run with Docker (Recommended)

Starts backend, frontend, Redis, and RabbitMQ all together:

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:5002/api/v1 |
| **RabbitMQ UI** | http://localhost:15672 (guest / guest) |
| **Redis** | localhost:6379 |

---

### Run Manually

**Backend:**

```bash
cd backend
npm install
npm run dev
# → Running on http://localhost:5002
```

**Frontend** (in a new terminal):

```bash
cd frontend
npm install
npm run dev
# → Running on http://localhost:5173
```

> **Note:** Make sure MongoDB, Redis, and RabbitMQ are running locally before starting the backend.

---

## 📡 API Routes

All routes are prefixed with `/api/v1`

### 🔐 Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login & get tokens |
| `POST` | `/auth/logout` | Logout & clear cookies |
| `POST` | `/auth/refresh` | Refresh access token |

### 🎬 Movies
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/movies` | List all movies |
| `GET` | `/movies/:id` | Get movie details |

### 🏟️ Theaters & Shows
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/theaters` | List all theaters |
| `GET` | `/shows` | List shows |
| `POST` | `/shows` | Create show *(Admin)* |
| `GET` | `/shows/:id` | Show detail with seat map |

### 🪑 Booking
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/booking/lock` | Lock selected seats |
| `POST` | `/booking/confirm` | Confirm booking after payment |
| `GET` | `/booking/history` | User's booking history |
| `GET` | `/booking/:id/ticket` | Get ticket for a booking |

### 💳 Payment
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/payment/create-order` | Create Razorpay order |
| `POST` | `/payment/verify` | Verify payment signature |

### 👤 User
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/user/profile` | Get user profile |
| `PATCH` | `/user/profile` | Update user profile |

---

## 🔑 Environment Variables

`backend/.env` — all required variables:

```env
# Server
NODE_ENV=development
PORT=5002

# Database
MONGO_CONNECTION_STRING=mongodb://localhost:27017/cinebook

# Auth & Security
ACCESS_TOKEN_SECRET=replace-with-a-strong-random-secret
REFRESH_TOKEN_SECRET=replace-with-a-strong-random-secret
ACCESS_TOKEN_EXPIRES_IN=5m
REFRESH_TOKEN_EXPIRES_IN=7d
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax

# Frontend
FRONTEND_URL=http://localhost:5173

# Email (SMTP)
EMAIL_USERNAME=your-smtp-email@example.com
EMAIL_PASSWORD=your-smtp-app-password

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_URL=amqp://localhost

# Razorpay (Payments)
RAZORPAY_API_KEY=your-razorpay-key
RAZORPAY_SECRET_KEY=your-razorpay-secret

# TMDB (Movie Data)
TMDB_API_READ_ACCESS_TOKEN=your-tmdb-read-access-token
TMDB_API_KEY=your-tmdb-api-key
TMDB_REGION=IN
TMDB_LANGUAGE=en-IN

# Cloudinary (Media)
CLOUDINARY_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

---

## 💡 Key Concepts

### 🔒 Concurrent Seat Locking
The most critical feature of CineBook. When two users try to book the same seat simultaneously, Redis acts as a distributed lock — only one user gets the seat. The lock has a TTL so it auto-expires if the user doesn't complete payment.

### 📨 Async Email Notifications
Booking confirmation emails are **never sent synchronously**. The booking API instantly returns a response and publishes an event to RabbitMQ. A background consumer picks it up and sends the email — keeping API response times fast.

### ⚡ Real-Time Seat Updates
Socket.IO broadcasts seat state changes to all connected users on the same show page, so the seat map is always live without needing page refresh.

---

## 📜 Scripts

### Backend
```bash
npm run dev           # Start dev server with nodemon
npm run start         # Start production server
npm run seed:theaters # Seed theater data into MongoDB
npm run sync:posters  # Sync movie poster assets
```

### Frontend
```bash
npm run dev     # Start Vite dev server
npm run build   # Build for production
npm run preview # Preview production build
npm run lint    # Run ESLint
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to your branch: `git push origin feature/your-feature`
5. Open a Pull Request against `main`

Please follow existing code patterns and keep commits small and focused.

---

## 📄 Additional Docs

| Document | Description |
|---|---|
| [`CINEBOOK_EXPLANATION.md`](./CINEBOOK_EXPLANATION.md) | High-level project overview |
| [`CINEBOOK_FLOW.md`](./CINEBOOK_FLOW.md) | Application flow & data flow diagrams |
| [`CONCURRENCY_FIXES_IMPLEMENTATION.md`](./CONCURRENCY_FIXES_IMPLEMENTATION.md) | How seat locking was implemented |
| [`CONCURRENCY_FIXES_QUICK_REFERENCE.md`](./CONCURRENCY_FIXES_QUICK_REFERENCE.md) | Quick cheat sheet for concurrency patterns |
| [`REDIS_SETUP_GUIDE.md`](./REDUX_SETUP_GUIDE.md) | Frontend Redux setup guide |
| [`GITHUB_DEPLOYMENT_SECURITY.md`](./GITHUB_DEPLOYMENT_SECURITY.md) | CI/CD and secrets best practices |

---

<div align="center">

Made with ❤️ by [Prakash Palsaniya](https://github.com/PrakashPalsaniya)

⭐ Star this repo if you found it useful!

</div>