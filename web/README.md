# TaskHive Web

Next.js frontend for TaskHive. It talks to the Express API in [`../api`](../api).

## Pages
- `/login` and `/signup`: authentication
- `/dashboard`: placeholder dashboard page
- `/teams`: your teams (`GET /api/teams` lists memberships for the signed-in user)
- `/teams/[teamId]`: Kanban board for a team's tasks (create, edit and delete tasks)
- `/billing/success` and `/billing/cancel`: Stripe Checkout redirect targets

## Getting started
```bash
npm ci
NEXT_PUBLIC_API_URL=http://localhost:8080/api npm run dev
```
Open http://localhost:4001.

`NEXT_PUBLIC_API_URL` is the API base URL including `/api`; if unset it defaults to `http://localhost:8080/api` (see `src/lib/api.ts`).

## Scripts
- `npm run dev`: dev server on port 4001
- `npm run build`: production build (Turbopack)
- `npm start`: serve the production build
- `npm run lint`: ESLint
