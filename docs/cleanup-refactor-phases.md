# Cleanup & Refactor Execution (Phases A-H)

## Phase A - Audit and classification
- Identified active vs redundant modules.
- Flagged legacy in-memory backend stores and duplicated frontend state paths.
- Classified stale build artifacts and runtime logs as removable noise.

## Phase B - Remove clutter and dead files
- Removed stale runtime/build artifacts from git-tracked surface (`dist/*`, `*-dev*.log`).
- Deleted unused frontend modules:
  - `src/pages/Dashboard.tsx`
  - `src/pages/Workout.tsx`
  - `src/components/AlertBanner.tsx`
  - `src/components/NavLink.tsx`
  - `src/components/StoreSync.tsx`
- Deleted legacy state store file no longer needed:
  - `src/stores/fitnessStore.ts`
  - `backend/src/stores/fitnessStore.ts`

## Phase C - Data architecture unification
- Frontend now uses backend-first data and auth paths.
- Removed store-sync bridge and direct app dependency on legacy zustand data flow.
- Added shared API URL resolver for consistent runtime behavior:
  - `src/lib/api-url.ts`

## Phase D - Backend modular refactor
- Added DB layer and repository abstraction:
  - `backend/src/db/client.ts`
  - `backend/src/db/repository.ts`
- Routes now depend on repository methods, not in-memory maps.

## Phase E - Contract and type consistency
- Standardized persisted resource shape conversions in repository layer.
- Kept route response contracts stable (`{ data }`, `{ success }`) to avoid frontend breakages.
- Updated tests to mock repository contract cleanly.

## Phase F - Deploy and infra hygiene
- Docker compose now runs app + PostgreSQL with persistent volume.
- `stack.env` expanded with PostgreSQL settings.
- Portainer YAML doc updated to reflect DB-backed deployment.

## Phase G - Performance and reliability hygiene
- Removed redundant data merge logic in body weight page.
- Simplified active-plan usage to data-provider-driven selection.
- Reduced app complexity by removing duplicate training page path.

## Phase H - QA (automation + frontend connectivity)

### Automated QA completed
- Frontend:
  - `npm run typecheck` ✅
  - `npm run test` ✅
  - `npm run build` ✅
- Backend:
  - `npm --prefix backend run build` ✅
  - `npm --prefix backend run test` ✅

### Manual frontend connectivity QA to execute on server
1. Register user from login UI.
2. Create workout, weight, meals, and weekly plan updates.
3. Refresh page and confirm data remains.
4. Log out/in and confirm data remains.
5. Restart containers and confirm data remains.
6. Validate from second browser/device with same account.
