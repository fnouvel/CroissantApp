#!/bin/bash
# CroissantApp quick setup script
# Run from the project root: bash setup.sh

set -e

echo "=== CroissantApp Setup ==="
echo ""

# --- Backend ---
echo "1/5  Setting up backend..."
cd backend

if [ ! -f .env ]; then
    cp .env.example .env
    # Generate a random secret key
    SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
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
    echo "2/5  Creating Python virtual environment..."
    python3 -m venv venv
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

npm install --silent

cd ..

echo "5/5  Done!"
echo ""
echo "=== Quick Start ==="
echo ""
echo "  Terminal 1 (backend):"
echo "    cd backend && source venv/bin/activate"
echo "    uvicorn app.main:app --reload"
echo ""
echo "  Terminal 2 (frontend):"
echo "    cd frontend && npm run dev"
echo ""
echo "  Then open http://localhost:5173 in your browser."
echo ""
echo "  Optional: seed sample data (backend server must be running):"
echo "    cd backend && source venv/bin/activate"
echo "    python seed_bakeries.py"
echo "    python seed_dev_user.py"
echo ""
