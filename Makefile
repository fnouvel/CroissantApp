# CroissantApp commands
# Usage: make <command>

# Start both backend and frontend (Ctrl+C to stop)
start:
	@echo "Starting backend and frontend..."
	@echo "Press Ctrl+C to stop both servers.\n"
	@trap 'kill 0' EXIT; \
		(cd backend && source venv/bin/activate && uvicorn app.main:app --reload) & \
		(cd frontend && npm run dev) & \
		wait

# Start only the backend
start-backend:
	cd backend && source venv/bin/activate && uvicorn app.main:app --reload

# Start only the frontend
start-frontend:
	cd frontend && npm run dev

# Seed the database with Boston bakeries + test user (backend must be running)
seed:
	cd backend && source venv/bin/activate && python seed_bakeries.py && python seed_dev_user.py

# Seed just bakeries
seed-bakeries:
	cd backend && source venv/bin/activate && python seed_bakeries.py

# Seed just the test user
seed-user:
	cd backend && source venv/bin/activate && python seed_dev_user.py

# Run all setup steps (same as bash setup.sh)
setup:
	bash setup.sh

# Run backend tests
test:
	cd backend && source venv/bin/activate && pytest

# Run database migrations
migrate:
	cd backend && source venv/bin/activate && alembic upgrade head

# Lint everything
lint:
	cd backend && source venv/bin/activate && ruff check .
	cd frontend && npm run lint

.PHONY: start start-backend start-frontend seed seed-bakeries seed-user setup test migrate lint
