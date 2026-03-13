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

The easiest way — starts both servers in one terminal:

```bash
make start
```

Press Ctrl+C to stop both servers. Open http://localhost:5173 in your browser.

Or start them separately in two terminals:

```bash
make start-backend   # Terminal 1 — API at http://localhost:8000
make start-frontend  # Terminal 2 — Web app at http://localhost:5173
```

## Seed Data (Optional)

With the app running (`make start`), open another terminal and run:

```bash
make seed
```

This adds 15 real Boston bakeries to the map and creates a test account (username: `flore-test`, password: `croissant123`).

## All Commands

| Command | What it does |
|---------|-------------|
| `make setup` | Run full setup (same as `bash setup.sh`) |
| `make start` | Start backend + frontend together |
| `make start-backend` | Start only the API server |
| `make start-frontend` | Start only the web app |
| `make seed` | Seed bakeries + test user |
| `make seed-bakeries` | Seed just the 15 Boston bakeries |
| `make seed-user` | Seed just the test user |
| `make test` | Run backend tests |
| `make migrate` | Run database migrations |
| `make lint` | Lint backend + frontend |

## Project Structure

```
CroissantApp/
├── backend/        Python API (FastAPI + SQLite)
├── frontend/       React web app (Vite + Tailwind)
├── .planning/      GSD workflow state (ignore this)
├── CLAUDE.md       Instructions for Claude Code
├── Makefile        All the commands above
└── setup.sh        One-command setup script
```

## Working with Claude Code

This project uses Claude Code for development. After cloning and running `bash setup.sh`, you can start Claude Code in the project directory and ask it to help with anything. The `CLAUDE.md` file gives Claude full context about the project.
