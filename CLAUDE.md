# CroissantApp

## Tech Stack
- **Backend**: Python with FastAPI
- **Frontend**: React + Vite + Tailwind CSS
- **Architecture**: API-first — the React frontend consumes FastAPI REST endpoints

## Project Structure
```
CroissantApp/
├── backend/          # FastAPI application
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   └── models/
│   ├── requirements.txt
│   └── .env
├── frontend/         # React + Vite application
│   ├── src/
│   ├── package.json
│   └── .env
├── CLAUDE.md
└── pre-coding-journal.md
```

## Common Commands

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload   # dev server on :8000
pytest                          # run tests
ruff check .                    # lint
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # dev server on :5173
npm test             # run tests
npm run lint         # lint
npm run build        # production build
```

## Notes
- The app's purpose will be defined by the user during development
- Work iteratively: small changes, test often, commit frequently
- Keep backend and frontend concerns separated
- Use `pre-coding-journal.md` to track progress and plan next steps
