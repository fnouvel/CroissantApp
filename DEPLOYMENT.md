# Deployment Guide — Croissant Club

This explains how Croissant Club is deployed and how all the pieces fit together.

---

## The big picture

When someone visits Croissant Club, here's what happens:

```
                        THE INTERNET
 ┌─────────┐                                    ┌──────────────────┐
 │ Your    │  1. "Show me the app"               │  RAILWAY         │
 │ phone / │ ──────────────────────────────────> │  Frontend        │
 │ laptop  │ <─────────────────────────────────  │  (React app      │
 │         │  2. Here's the app (HTML/CSS/JS)    │   served by      │
 │         │                                     │   Nginx)         │
 │         │                                     └──────────────────┘
 │         │
 │         │  3. "Log me in" / "Save this        ┌──────────────────┐
 │         │     rating" / "Load bakeries"        │  RAILWAY         │
 │ (the app│ ──────────────────────────────────> │  Backend         │
 │  runs in│ <─────────────────────────────────  │  (Python API     │
 │  your   │  4. Here's your data (JSON)         │   server)        │
 │ browser)│                                     └────────┬─────────┘
 └─────────┘                                              │
                                                          │ 5. Read/write
                                                          │    data
                                                          v
                                                 ┌──────────────────┐
                                                 │  SUPABASE        │
                                                 │                  │
                                                 │  - Database      │
                                                 │    (PostgreSQL)  │
                                                 │    users,        │
                                                 │    bakeries,     │
                                                 │    ratings       │
                                                 │                  │
                                                 │  - Photo storage │
                                                 │    (croissant    │
                                                 │     images)      │
                                                 └──────────────────┘
```

**In plain English:**

1. You open the app URL in your browser
2. Railway's **frontend** service sends you the app (it's like downloading a small program)
3. The app runs in your browser and talks to Railway's **backend** service whenever it needs data
4. The backend reads and writes to the **database** on Supabase (user accounts, bakeries, ratings, photos)

Think of it like a restaurant: the frontend is the menu and dining room (what you see), the backend is the kitchen (processes your orders), and Supabase is the pantry and recipe book (stores everything).

---

## How deployment works

```
 You make a code change
         │
         v
 ┌─────────────────┐     git push      ┌─────────────────┐
 │  Your computer   │ ───────────────> │  GitHub          │
 │  (local dev)     │                   │  fnouvel/        │
 └─────────────────┘                   │  CroissantApp    │
                                        └────────┬────────┘
                                                 │
                                        (GitHub notifies Railway
                                         automatically)
                                                 │
                                        ┌────────v────────┐
                                        │  Railway         │
                                        │                  │
                                        │  1. Pulls code   │
                                        │  2. Builds it    │
                                        │  3. Deploys it   │
                                        │                  │
                                        │  Takes ~1-2 min  │
                                        └─────────────────┘
```

**The workflow is:**
1. Make changes to the code on your computer
2. Run `git push origin main` to send changes to GitHub
3. That's it — Railway detects the push and automatically rebuilds and deploys both the frontend and backend

You can watch deploys happening in real time on the Railway dashboard (link below).

---

## Important links

| What | URL |
|------|-----|
| **Live app** | https://frontend-production-95af.up.railway.app |
| **Railway dashboard** (deploys, logs) | https://railway.com/project/5695b737-d5ad-42ca-b803-fd12174ffd91 |
| **Supabase dashboard** (database, photos) | https://supabase.com/dashboard/project/stmkmoiolxlhrjwpriiy |
| **GitHub repo** (code, triggers deploys) | https://github.com/fnouvel/CroissantApp |
| Backend health check | https://backend-production-85be.up.railway.app/api/health |

---

## What lives where

### Railway — runs the app
Railway is like the building where the app lives. It has two rooms:

- **Frontend service** — Serves the web app to browsers. Built from the `frontend/` folder. This is what people see.
- **Backend service** — The API server that handles logins, saves ratings, serves bakery data. Built from the `backend/` folder.

Each service runs in its own container (think: a small virtual computer in the cloud).

### Supabase — stores the data
Supabase is the database and file storage. It holds:

- **Database (PostgreSQL)** — All the tables: users, bakeries, ratings, scores
- **Storage bucket ("photos")** — Croissant photos that users upload with their ratings

### GitHub — stores the code
The code lives at `fnouvel/CroissantApp`. When you push to the `main` branch, Railway picks it up and redeploys.

(There's also the original repo at `clouvelai/CroissantApp` — the fnouvel one is a fork that Railway watches.)

---

## Environment variables (how the services talk to each other)

The backend needs to know where the database is and how to connect. These are stored as **environment variables** in Railway (think of them as secret settings). You can view them in Railway dashboard → click a service → Variables tab.

**Backend variables:**
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Address + password for the Supabase database |
| `SECRET_KEY` | A secret string used to create secure login tokens |
| `CORS_ORIGINS` | The frontend URL — tells the backend "only accept requests from this website" |
| `STORAGE_BACKEND` | Set to `supabase` so uploaded photos go to Supabase, not local disk |
| `SUPABASE_URL` | The Supabase project address |
| `SUPABASE_SERVICE_KEY` | A secret key that lets the backend upload and delete photos |
| `SUPABASE_BUCKET` | The name of the photo storage bucket (`photos`) |

**Frontend variable:**
| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | The backend address — baked into the app when it's built |

You should never need to change these unless you move to a different hosting provider or domain.

---

## Seeding bakeries

The seed script pre-loads 18 Boston-area bakeries into the database. It's **safe to run multiple times** — it checks each bakery by name and skips any that already exist.

```bash
# From the backend/ directory with the virtual environment active:
cd backend
source venv/bin/activate

# For production (Supabase database):
DATABASE_URL="postgresql://postgres.stmkmoiolxlhrjwpriiy:<PASSWORD>@aws-1-us-east-1.pooler.supabase.com:6543/postgres" python seed_bakeries.py

# For local development (SQLite):
python seed_bakeries.py
```

The production password is stored in `backend/.env.production.local` (this file is never uploaded to GitHub).

Running it twice is harmless:
```
First run:  Upserted bakeries: 18 inserted, 0 updated, 0 unchanged
Second run: Upserted bakeries: 0 inserted, 0 updated, 18 unchanged
```

**Do not use the `--reset` flag on production** — it deletes all bakeries AND all ratings.

---

## Local development

You can run the full app on your computer for development. Locally it uses a simple SQLite file instead of Supabase, so you don't need any accounts or internet connection.

```bash
make start        # starts both backend and frontend locally
                  # app is at http://localhost:5173

make seed         # adds bakeries + a test user to the local database
```

Local settings: `backend/.env`
Production secrets: `backend/.env.production.local` (gitignored — never committed)

---

## If something goes wrong

| Symptom | What to do |
|---------|-----------|
| App won't load at all | Check Railway dashboard — is the frontend service running? Click "View logs" |
| "Failed to fetch" or CORS error | The backend probably crashed. Check the backend service logs in Railway |
| Health check fails | Visit the health check URL above. If it doesn't return `{"status":"ok"}`, the backend is down |
| Just want to restart | Railway dashboard → click the service → three-dot menu → Redeploy |
| Deploys aren't triggering | Make sure you pushed to `origin` (fnouvel fork), not `upstream` (clouvelai) |

The Railway dashboard logs are your best friend — almost every problem shows up there with a clear error message.

---

## Technical notes (for reference)

- **Database connection uses port 6543** (Supabase's "transaction pooler"), not the standard 5432. This works better with Railway's multiple server processes.
- **Photos go to Supabase Storage in production**, not local disk. Railway containers are temporary — files saved to disk would disappear on the next deploy.
- **The fork**: Railway auto-deploy watches `fnouvel/CroissantApp`. The original code is at `clouvelai/CroissantApp`. In the local git setup, `origin` = fnouvel (push here to deploy), `upstream` = clouvelai.
