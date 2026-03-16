# Deployment Guide — Croissant Club

## How it works

Croissant Club runs on three services:

```
[Your browser]
      |
      v
[Frontend on Railway]  ──>  [Backend on Railway]  ──>  [Database on Supabase]
   (serves the app)         (API + business logic)     (PostgreSQL + photo storage)
```

**Frontend** — A static website (React) served by Nginx on Railway. When you open the app, your browser downloads the HTML/CSS/JS from here.

**Backend** — A Python API server (FastAPI) on Railway. The frontend talks to this for everything: logging in, loading bakeries, saving ratings, uploading photos.

**Database** — A PostgreSQL database hosted on Supabase. This is where all the data lives: user accounts, bakeries, ratings, and scores. Supabase also stores uploaded croissant photos in a storage bucket called "photos".

## Auto-deploy

Every time code is pushed to the `main` branch on GitHub (`fnouvel/CroissantApp`), Railway automatically rebuilds and deploys both the frontend and backend. No manual steps needed.

The deploy takes about 1-2 minutes. You can watch progress at:
https://railway.com/project/5695b737-d5ad-42ca-b803-fd12174ffd91

## URLs

| What | URL |
|------|-----|
| Live app | https://frontend-production-95af.up.railway.app |
| API | https://backend-production-85be.up.railway.app/api |
| API health check | https://backend-production-85be.up.railway.app/api/health |
| Railway dashboard | https://railway.com/project/5695b737-d5ad-42ca-b803-fd12174ffd91 |
| Supabase dashboard | https://supabase.com/dashboard/project/stmkmoiolxlhrjwpriiy |
| GitHub repo (deploys) | https://github.com/fnouvel/CroissantApp |

## Services and accounts

### Railway (hosting)
- Hosts both the frontend and backend as separate "services"
- Each service has its own Docker container
- Account: linked to `fnouvel` GitHub

### Supabase (database + photos)
- Project name: CroissantClub
- Region: US East (Virginia)
- Database: PostgreSQL 17 via connection pooler
- Storage: `photos` bucket for croissant images

## How the pieces connect

The backend knows how to reach Supabase via environment variables set in Railway:

| Variable | What it does |
|----------|-------------|
| `DATABASE_URL` | Connection string to Supabase PostgreSQL (uses port 6543 pooler) |
| `SECRET_KEY` | Signs login tokens so they can't be forged |
| `CORS_ORIGINS` | Tells the backend which frontend URL is allowed to talk to it |
| `STORAGE_BACKEND` | Set to `supabase` so photos go to Supabase Storage, not local disk |
| `SUPABASE_URL` | The Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Secret key that lets the backend upload/delete photos |
| `SUPABASE_BUCKET` | Name of the storage bucket (`photos`) |

The frontend has one build-time variable:

| Variable | What it does |
|----------|-------------|
| `VITE_API_URL` | The backend URL that gets baked into the app at build time |

These are all configured in the Railway dashboard (click a service → Variables tab). You should not need to change them unless you're moving to a different domain.

## Seeding bakeries

The seed script adds Boston-area bakeries to the database. It's **idempotent** — running it multiple times is safe. It checks each bakery by name and only inserts new ones, skipping any that already exist.

```bash
cd backend
source venv/bin/activate
DATABASE_URL="postgresql://postgres.stmkmoiolxlhrjwpriiy:<PASSWORD>@aws-1-us-east-1.pooler.supabase.com:6543/postgres" python seed_bakeries.py
```

The password is in `backend/.env.production.local` (not committed to git).

Running it again will print `0 inserted, 0 updated, 18 unchanged` — no harm done.

The `--reset` flag deletes everything and re-inserts. **Don't use `--reset` on production** unless you want to wipe all bakeries and ratings.

## Local development

Local dev uses SQLite (no Supabase needed):

```bash
make start        # runs both backend and frontend locally
make seed         # seeds the local SQLite database
```

Local settings live in `backend/.env` (SQLite, debug mode on). Production credentials are in `backend/.env.production.local` (gitignored).

## If something breaks

1. **Check Railway logs** — click the service in the Railway dashboard → "View logs". Most errors show up here.
2. **Health check** — visit https://backend-production-85be.up.railway.app/api/health. If it returns `{"status":"ok"}`, the backend is running.
3. **CORS errors in browser console** — usually means the backend crashed. Check Railway logs for the real error.
4. **"Failed to fetch"** — same as above; the frontend can't reach the backend.
5. **Redeploy** — in Railway dashboard, click the three dots on a service → Redeploy.

## Architecture decisions

- **Port 6543 (not 5432)**: The database connection uses Supabase's transaction pooler (port 6543), not the direct connection (5432). This is important — the direct connection doesn't work well with Railway's multiple worker processes.
- **Git fork**: Railway auto-deploy is connected to `fnouvel/CroissantApp` (a fork). The original repo is `clouvelai/CroissantApp`. Push to `origin` to trigger deploys.
- **Photo storage**: In production, photos upload to Supabase Storage (not the local filesystem), because Railway containers are ephemeral — local files would be lost on redeploy.
