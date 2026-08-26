# SoiréeOS — Event Planner Business Software

A full-stack business management app for event planners: track clients, events,
vendors, tasks, budgets, guest lists, and invoices in one place.

## Stack

- **Backend**: Node.js, Express 5, TypeScript, Prisma ORM (SQLite by default,
  swappable for Postgres/MySQL), JWT auth, bcrypt password hashing, Zod
  validation.
- **Frontend**: React 19, TypeScript, Vite, React Router, Tailwind CSS v4,
  Recharts, Axios.

## Features

- **Auth** — register/login, JWT-based sessions, first user becomes admin.
- **Clients** — CRUD, contact info, notes, linked events & invoices.
- **Vendors** — a directory of caterers, venues, photographers, etc., booked
  per-event with cost and booking status.
- **Events** — full lifecycle (lead → planning → confirmed → in progress →
  completed/cancelled), each with:
  - **Tasks** — checklist with due dates and priority.
  - **Budget** — line items with estimated vs. actual cost and paid status.
  - **Guests** — guest list with RSVP tracking and plus-ones.
  - **Vendor bookings** — assign vendors to an event with cost & status.
- **Invoices** — billing per client/event with amount, amount paid, due date,
  and status.
- **Dashboard** — key stats (events, clients, open/overdue tasks, revenue vs.
  outstanding), events-by-status chart, and an upcoming-events list.

## Project structure

```
server/   Express + Prisma API (see server/README below)
client/   React + Vite frontend
```

## Getting started

### 1. Backend

```bash
cd server
cp .env.example .env      # adjust JWT_SECRET etc. if desired
npm install
npm run prisma:migrate    # creates the SQLite dev.db and applies the schema
npm run seed               # optional: loads demo data (demo@planner.com / password123)
npm run dev                 # starts the API on http://localhost:4000
```

### 2. Frontend

```bash
cd client
npm install
npm run dev                 # starts the app on http://localhost:5173
```

The Vite dev server proxies `/api/*` requests to `http://localhost:4000`, so
just open http://localhost:5173 once both servers are running.

### Demo login

```
email:    demo@planner.com
password: password123
```

## Switching to Postgres/MySQL for production

Edit `server/prisma/schema.prisma`'s `datasource` block:

```prisma
datasource db {
  provider = "postgresql" // or "mysql"
  url      = env("DATABASE_URL")
}
```

Set `DATABASE_URL` in `server/.env` to your connection string, then run
`npm run prisma:migrate` again.

## API overview

All routes except `/api/auth/register` and `/api/auth/login` require a
`Authorization: Bearer <token>` header.

| Method/Path                                | Description |
|---------------------------------------------|-------------|
| POST `/api/auth/register`                   | Create an account |
| POST `/api/auth/login`                      | Log in |
| GET `/api/auth/me`                          | Current user |
| GET/POST `/api/clients`                     | List/create clients |
| GET/PUT/DELETE `/api/clients/:id`           | Read/update/delete a client |
| GET/POST `/api/vendors`                     | List/create vendors |
| GET/PUT/DELETE `/api/vendors/:id`           | Read/update/delete a vendor |
| GET/POST `/api/events`                      | List/create events |
| GET/PUT/DELETE `/api/events/:id`            | Read/update/delete an event |
| GET/POST `/api/events/:id/tasks`            | Event tasks |
| PUT/DELETE `/api/events/:id/tasks/:taskId`  | Update/delete a task |
| GET/POST `/api/events/:id/budget-items`     | Event budget line items |
| GET/POST `/api/events/:id/guests`           | Event guest list |
| POST `/api/events/:id/vendors`              | Book a vendor on an event |
| GET/POST `/api/invoices`                    | List/create invoices |
| GET `/api/dashboard`                        | Aggregate stats for the dashboard |

## Notes on tooling versions

This repo pins `typescript@5.6` and `prisma@5.22` on the backend (the
registry's newest majors — `typescript@7` and `prisma@7` — ship breaking
changes incompatible with `ts-node-dev` and SQLite respectively at the time
of writing). Bump them deliberately when you're ready to migrate.
