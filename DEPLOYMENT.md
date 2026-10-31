# Deploying on Render

This project ships a `render.yaml` blueprint (backend = Laravel API, frontend = React/Vite static site).

## One-click deploy (Blueprint)

1. Push this repository to GitHub/GitLab.
2. In Render, click **New → Blueprint** and select the repo.
3. Render reads `render.yaml` and creates both services.
4. Wait for the first build to finish (backend runs `backend/render-build.sh`).

## After first deploy — update URLs

Render assigns URLs like `https://royal-delivery-backend.onrender.com`. If your service names differ, update these env vars to match the real URLs:

**Backend service** (`royal-delivery-backend`):
- `APP_URL` → `https://<backend>.onrender.com`
- `SANCTUM_STATEFUL_DOMAINS` → `<frontend>.onrender.com`
- `FRONTEND_URL` → `https://<frontend>.onrender.com`

**Frontend service** (`royal-delivery-frontend`):
- `VITE_API_BASE_URL` → `https://<backend>.onrender.com/api/v1`

Then trigger a manual redeploy of both services so the new values take effect
(`VITE_API_BASE_URL` is baked in at build time).

## Free plan (default)

This Blueprint now targets Render's **free** plan:

- Backend: Docker web service (`backend/Dockerfile`), free plan, ephemeral filesystem.
- Database: SQLite at `database/database.sqlite` (resets on redeploy; migrations + idempotent seeding run on every start).
- Uploads (parcel images, avatars, proof of delivery) are also ephemeral.

Render has no native PHP runtime, so the backend is deployed as a Docker service.

### Upgrading to persistent storage (paid)

To keep data across redeploys, change the backend service to `plan: starter` (or higher), re-add a `disk:` block mounted at `/var/data`, and set `DB_DATABASE: /var/data/database.sqlite`.

## Database

- Default: SQLite on a persistent disk mounted at `/var/data` (requires a paid plan, e.g. `starter`).
- Migrations + idempotent seeding run automatically during the build.
- To use Postgres instead, change `DB_CONNECTION=pgsql` and add `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` env vars (Render managed Postgres works).

## File uploads

Public uploads (parcel images, avatars, proof of delivery) are stored on the
`public` disk (`storage/app/public`) and served via the `storage:link` symlink
created during build. On the free/ephemeral tier these are lost on redeploy —
use S3-compatible storage for production durability.

## Default credentials (from seeders)

- Admin: `admin@royal-myawaddy.local` / `Admin@123456`
- Manager: `manager@royal-myawaddy.local` / `Manager@123456`
- Staff: `staff1@royal-myawaddy.local` / `Staff@123456`

## Local development

```bash
bash setup.sh   # install deps, migrate, seed
bash dev.sh     # run backend + frontend
```
Frontend: http://localhost:5173 · Backend: http://localhost:8000