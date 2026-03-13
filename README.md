# Croissant Club

A croissant rating journal for friends and family to discover, rate, and track Boston bakeries' croissants together.

## Prerequisites

- **Python 3.10+** - check with `python3 --version`
- **Node.js 18+** - check with `node --version`
- **npm** - comes with Node.js

### Installing prerequisites on macOS

```bash
# Install Homebrew (if you don't have it)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python and Node
brew install python node
```

## Quick Setup

From the project root, run:

```bash
bash setup.sh
```

This will:
1. Create `.env` files from the examples (with a fresh secret key)
2. Create a Python virtual environment
3. Install all backend and frontend dependencies
4. Run database migrations

## Running the App

You need **two terminal windows** open at the same time:

### Terminal 1 - Backend (API server)

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

This starts the API at http://localhost:8000.

### Terminal 2 - Frontend (web app)

```bash
cd frontend
npm run dev
```

This starts the web app at http://localhost:5173. Open this URL in your browser.

## Seed Data (Optional)

With the backend server running, open a **third terminal**:

```bash
cd backend
source venv/bin/activate

# Add 15 real Boston bakeries to the map
python seed_bakeries.py

# Create a test account (username: flore-test, password: croissant123)
python seed_dev_user.py
```

## Project Structure

```
CroissantApp/
├── backend/        Python API (FastAPI + SQLite)
├── frontend/       React web app (Vite + Tailwind)
├── .planning/      GSD workflow state (ignore this)
├── CLAUDE.md       Instructions for Claude Code
└── setup.sh        One-command setup script
```

## Useful Commands

| What | Command |
|------|---------|
| Run backend tests | `cd backend && source venv/bin/activate && pytest` |
| Lint backend | `cd backend && source venv/bin/activate && ruff check .` |
| Lint frontend | `cd frontend && npm run lint` |
| Build frontend for production | `cd frontend && npm run build` |
| Run new database migrations | `cd backend && source venv/bin/activate && alembic upgrade head` |

## Working with Claude Code

This project uses Claude Code for development. After cloning and running `bash setup.sh`, you can start Claude Code in the project directory and ask it to help with anything. The `CLAUDE.md` file gives Claude full context about the project.
