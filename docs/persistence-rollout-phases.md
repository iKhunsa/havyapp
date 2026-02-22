# DinoFit Persistence Rollout (Phases 1-8)

## Phase 1 - PostgreSQL schema
- Created PostgreSQL-backed schema initialization in `backend/src/db/client.ts`.
- Tables include: `users`, `workout_logs`, `body_weight_logs`, `weekly_plans`, `macro_profiles`, `meal_plans`.

## Phase 2 - Auth persistence
- Auth now uses PostgreSQL user records instead of in-memory maps.
- `register` stores hashed password in DB, `login` validates against DB.

## Phase 3 - Fitness persistence
- Fitness routes now use PostgreSQL repository methods (`backend/src/db/repository.ts`).
- CRUD operations for workouts, weights, plans, macro profile, and meals are persisted.

## Phase 4 - Frontend data source migration
- Frontend auth moved to backend API (`src/contexts/AuthContext.tsx`).
- `DataProvider` now resolves data through backend endpoints via `useLocalData` backend-first implementation.

## Phase 5 - Legacy local data migration
- Added `POST /api/fitness/import` to import legacy local payloads.
- Frontend performs one-time migration from `localStorage` to server after login.

## Phase 6 - Docker/Portainer architecture update
- Updated `docker-compose.yml` to include:
  - `db` service (`postgres:16-alpine`) with persistent volume.
  - `app` service built from repo Dockerfile and connected to DB.
- Added DB variables in `stack.env`.

## Phase 7 - Security and operational readiness
- Auth remains JWT-based.
- CORS/rate-limit/helmet pipeline preserved.
- DB schema uses user-bound records and cascaded deletes by FK.

## Phase 8 - End-to-end QA (frontend + backend)

### Automated checks
- Build frontend: `npm run build`
- Build backend: `npm --prefix backend run build`
- Compose config check: `docker compose -f docker-compose.yml config`

### Frontend validation checklist (required)
1. Register a new account in UI.
2. Log in and create data in every module:
   - Add workout log
   - Add body weight log
   - Save weekly plan edits
   - Save macro profile
   - Save meals
3. Refresh browser and verify data remains.
4. Log out and log back in with same user; verify same records remain.
5. Open app from another device/browser and verify same records are visible.
6. Restart stack (`docker compose down && up -d`) and verify data remains.

### API verification checklist
- `GET /health` returns `status: ok`
- Auth flow: `register -> login -> me`
- Fitness flow: create/read/update/delete for workouts and weights
