# AniLog
Track the shows you watch. Log, rate, and remember every anime movie/ season whether it's alone or with friends.

## Stack
- Frontend: Vite + React + Tailwind
- Backend: Node + Express + Postgres
- Auth: JWT + bcrypt

## Run locally
Frontend:
- npm install
- npm run dev


Backend:
- cd server
- npm install
- npm run start


## Env vars
See `.env.example` and `server/.env.example`

## What I learned / practiced
- PERN stack end-to-end — wiring React frontend to Express API to Postgres
- Auth from scratch — signup/login with bcrypt hashing + JWT tokens
- Relational data — `users` + `logs` tables linked by `user_id`, with ownership checks
- REST API design — `GET /api/logs`, `POST /api/logs`, `PUT /api/logs/:id`, `DELETE /api/logs/:id`, public `/u/:username` routes
- React hooks state + data fetching — `useState`, `useEffect`, loading states, and syncing Navbar + Profile via custom events
- Environment variables — `DATABASE_URL`, `JWT_SECRET`, `VITE_API_URL` for local vs production
- Deployment — pushing to GitHub, hosting frontend + backend + Postgres on Render, handling `PORT` + SSL
- Debugging real bugs — Tailwind classes getting stripped, `username is not defined`, stale `localStorage` avatar, CORS and env var issues
- UI polish — grid vs absolute positioning, floating cards, marquee, gradient text, hover pause, responsive layout