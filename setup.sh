#!/bin/bash
# CroissantApp quick setup script
# Run from the project root: bash setup.sh

set -e

echo "=== CroissantApp Setup ==="
echo ""

# --- Resolve python3 (prefer Homebrew >= 3.10, fall back to system) ---
PYTHON3=""
for candidate in \
    /opt/homebrew/bin/python3.13 \
    /opt/homebrew/bin/python3.12 \
    /opt/homebrew/bin/python3.11 \
    /opt/homebrew/bin/python3.10 \
    /usr/local/bin/python3.13 \
    /usr/local/bin/python3.12 \
    /usr/local/bin/python3.11 \
    /usr/local/bin/python3.10 \
    "$(command -v python3 2>/dev/null)"; do
    if [ -x "$candidate" ]; then
        ver=$("$candidate" -c "import sys; print(sys.version_info >= (3,10))" 2>/dev/null)
        if [ "$ver" = "True" ]; then
            PYTHON3="$candidate"
            break
        fi
    fi
done

if [ -z "$PYTHON3" ]; then
    echo ""
    echo "  ERROR: Python 3.10+ is required but not found."
    echo "  Install it with:  brew install python@3.13"
    echo ""
    exit 1
fi

# --- Resolve npm ---
NPM=""
for candidate in \
    /opt/homebrew/bin/npm \
    /usr/local/bin/npm \
    "$(command -v npm 2>/dev/null)"; do
    if [ -x "$candidate" ]; then
        NPM="$candidate"
        break
    fi
done

if [ -z "$NPM" ]; then
    echo ""
    echo "  ERROR: npm (Node.js) is required but not found."
    echo "  Install it with:  brew install node"
    echo ""
    exit 1
fi

# --- Backend ---
echo "1/5  Setting up backend..."
cd backend

if [ ! -f .env ]; then
    cp .env.example .env
    SECRET=$("$PYTHON3" -c "import secrets; print(secrets.token_urlsafe(32))")
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/change-me-to-a-random-string/$SECRET/" .env
    else
        sed -i "s/change-me-to-a-random-string/$SECRET/" .env
    fi
    echo "     Created backend/.env with a fresh secret key"
else
    echo "     backend/.env already exists, skipping"
fi

if [ ! -d venv ]; then
    echo "2/5  Creating Python virtual environment ($("$PYTHON3" --version))..."
    "$PYTHON3" -m venv venv
else
    echo "2/5  Python venv already exists, skipping"
fi

source venv/bin/activate

echo "3/5  Installing Python dependencies..."
pip install -r requirements.txt --quiet

echo "     Running database migrations..."
alembic upgrade head

cd ..

# --- Frontend ---
echo "4/5  Installing frontend dependencies..."
cd frontend

if [ ! -f .env ]; then
    cp .env.example .env
    echo "     Created frontend/.env"
else
    echo "     frontend/.env already exists, skipping"
fi

"$NPM" install --silent

cd ..

echo "5/5  Done!"
echo ""
echo "=== Quick Start ==="
echo ""
echo "  make start        — start both servers (backend :8000, frontend :5173)"
echo "  make seed         — seed bakeries + dev user (run after make start)"
echo ""
echo "  Then open http://localhost:5173 in your browser."
echo ""
