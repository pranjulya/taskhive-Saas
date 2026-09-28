# TaskHive – Team Task Management (SaaS Demo) 🐝

![Node](https://img.shields.io/badge/Node.js-Express-green)
![Stripe](https://img.shields.io/badge/Stripe-Checkout-purple)
![CI](https://github.com/pranjulya/taskhive-Saas/actions/workflows/ci.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

A **job-ready SaaS clone**: Auth, teams, tasks with a Kanban board UI (Next.js), and **Stripe subscription checkout**.

**Limitations:** Stripe Checkout session creation is implemented (`POST /api/billing/checkout`) and the web app has `/billing/success` and `/billing/cancel` pages matching the Stripe redirect URLs. There is still no Stripe webhook and no subscription status stored against a user or team yet.

## Project structure
```
api/   # Express + MongoDB (Mongoose) REST API, JWT auth, Stripe Checkout
web/   # Next.js frontend (login, signup, dashboard, teams, Kanban board)
```

## 🔧 Quick Start (API)

**Prerequisites:** Node.js 20+ and a MongoDB instance (local or Atlas).

```bash
cd api
cp .env.example .env # add MONGO_URI, JWT_SECRET, STRIPE keys; FRONTEND_URL should be http://localhost:4001
npm install
npm run dev
```

Scripts in `api/package.json`:
- `npm run dev`: connect to MongoDB and listen (requires `MONGO_URI` and `JWT_SECRET`)
- `npm start`: same, with `NODE_ENV=production`
- `npm test`: run Jest (in-memory MongoDB; no external DB needed)

### Environment variables (`api/.env`)
| Variable | Purpose |
|----------|---------|
| `PORT` | API port (example: `8080`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `STRIPE_SECRET_KEY` | Stripe secret key (test mode: `sk_test_...`) |
| `STRIPE_PRICE_PRO` | Stripe Price ID for the Pro subscription |
| `FRONTEND_URL` | Base URL for Stripe Checkout success/cancel redirects (use `http://localhost:4001` to match the Next.js app) |

## 🖥️ Quick Start (Web)
```bash
cd web
npm ci
NEXT_PUBLIC_API_URL=http://localhost:8080/api npm run dev
```
The web app runs on http://localhost:4001. `NEXT_PUBLIC_API_URL` must point at the API's `/api` base (it defaults to `http://localhost:8080/api`).

## 📡 API endpoints
All routes except signup and login require an `Authorization: Bearer <token>` header. See `api/openapi.yaml` for details.

- `POST /api/auth/signup`, `POST /api/auth/login`
- `GET /api/teams` (list my teams), `POST /api/teams`, `GET|PUT|DELETE /api/teams/:teamId`
- `GET|POST /api/teams/:teamId/members`, `DELETE /api/teams/:teamId/members/:userId`, `PUT /api/teams/:teamId/members/:userId/role`
- `GET|POST /api/teams/:teamId/tasks`, `GET|PUT|DELETE /api/tasks/:taskId`
- `POST /api/billing/checkout`: creates a Stripe Checkout subscription session and returns its `url`

## 📄 License
MIT. See [LICENSE](LICENSE).
