# Deploying on Render (Free Plan)

Render's Blueprint sync may not be available on every workspace/plan. This guide covers
**manual deployment** on Render's free tier, plus notes for upgrading.

The backend is deployed as a **Docker** service (`backend/Dockerfile`) because Render has no
native PHP runtime. The frontend is a static site.

## Copy-paste Environment Variables

### Backend (paste into Render → Environment)
```
APP_NAME=Royal Myawaddy Delivery
APP_ENV=production
APP_DEBUG=false
APP_KEY=PASTE_GENERATED_KEY_HERE
APP_URL=https://YOUR-BACKEND.onrender.com
APP_TIMEZONE=Asia/Yangon
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
FILESYSTEM_DISK=local
LOG_CHANNEL=stderr
LOG_LEVEL=error
SANCTUM_STATEFUL_DOMAINS=YOUR-FRONTEND.onrender.com
FRONTEND_URL=https://YOUR-FRONTEND.onrender.com
```
Generate `APP_KEY` locally with: `php artisan key:generate --show`

### Frontend (paste into Render → Environment)
```
VITE_API_BASE_URL=https://YOUR-BACKEND.onrender.com/api/v1
```

---

## 1. Backend — Docker Web Service

Render Dashboard → **New → Web Service** → connect your repo.

Settings:
- **Root Directory:** `backend`
- **Runtime:** Docker
- **Dockerfile Path:** `./Dockerfile`
- **Plan:** Free
- **Health Check Path:** `/up`

Environment variables:

| Key | Value |
|---|---|
| `APP_NAME` | `Royal Myawaddy Delivery` |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | generate with `php artisan key:generate --show` |
| `APP_URL` | `https://<backend>.onrender.com` |
| `APP_TIMEZONE` | `Asia/Yangon` |
| `DB_CONNECTION` | `sqlite` |
| `DB_DATABASE` | `database/database.sqlite` |
| `SESSION_DRIVER` | `file` |
| `CACHE_STORE` | `file` |
| `QUEUE_CONNECTION` | `sync` |
| `FILESYSTEM_DISK` | `local` |
| `LOG_CHANNEL` | `stderr` |
| `LOG_LEVEL` | `error` |
| `SANCTUM_STATEFUL_DOMAINS` | `<frontend>.onrender.com` |
| `FRONTEND_URL` | `https://<frontend>.onrender.com` |

The container entrypoint runs migrations + idempotent seeding on every start, so the
demo data is restored automatically.

## 2. Frontend — Static Site

Render Dashboard → **New → Static Site** → connect your repo.

Settings:
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`

Environment variable:

| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://<backend>.onrender.com/api/v1` |

Rewrite rule (for client-side routing): `/*` → `/index.html`.

## Free plan limitations
- No persistent disk: SQLite data and uploads reset on redeploy/restart (re-seeded on start).
- Services spin down after 15 minutes of inactivity (cold start on next request).

## Optional: Blueprint (render.yaml)
A `render.yaml` Blueprint is included for workspaces that support it. It defines the same
two services. If Blueprint sync is unavailable on your plan, use the manual steps above.

## Upgrading to persistent storage (paid)
1. Change backend plan to `starter` (or higher).
2. Re-add a disk mounted at `/var/data`.
3. Set `DB_DATABASE=/var/data/database.sqlite`.

## Default credentials (seeded)
- Admin: `admin@gmail.com` / `Admin@123456`
- Manager: `mgmoe@gmail.com` / `Manager@123456`
- Accountant: `makhin@gmail.com` / `Accountant@123456`
- Staff: `kozaw@gmail.com` / `Staff@123456`

## Local development
```bash
bash setup.sh   # install deps, migrate, seed
bash dev.sh     # run backend + frontend
```
Frontend: http://localhost:5173 · Backend: http://localhost:8000