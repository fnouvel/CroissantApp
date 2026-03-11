# Testing Patterns

**Analysis Date:** 2026-03-11

## Test Framework

**Status:** No testing framework currently configured

**Current State:**
- No test files detected in codebase
- No test runner dependencies in `package.json` (no Jest, Vitest for frontend)
- No pytest configuration in backend
- `npm test` command does not exist in `frontend/package.json`
- No test configuration files (`jest.config.js`, `vitest.config.js`, `pytest.ini`, etc.)

## Test File Organization

**Location (Recommended):**
- Frontend: `src/__tests__/` or co-located `*.test.jsx` / `*.spec.jsx` files
- Backend: `tests/` directory or co-located `test_*.py` files

**Naming (Recommended):**
- Frontend: `[ComponentName].test.jsx` or `[filename].spec.jsx`
- Backend: `test_[module_name].py`

## Testing Framework Setup (Not Yet Implemented)

**Frontend Options:**
- Vitest + Testing Library (recommended for Vite + React)
- Jest + React Testing Library (traditional choice)

**Backend Options:**
- pytest (standard for Python/FastAPI)
- pytest-asyncio for async endpoint testing

## Manual Testing Observed

While no automated tests exist, the codebase shows patterns consistent with manual/integration testing:

**Frontend Error Handling:**
```jsx
// Example from AddBakeryForm.jsx
try {
  const bakery = await createBakery({ name, address });
  if (score > 0) {
    await createRating(bakery.id, { score, notes, visited_at });
  }
  setSuccess(true);
} catch (err) {
  setError(err.message);
}
```

Patterns for testability:
- Errors are caught and set to state
- Success states trigger UI feedback (`setSuccess(true)`)
- Loading states prevent double-submission (`submitting` flag)

**Backend Error Handling:**
```python
# Example from bakeries.py
@router.get("/{bakery_id}", response_model=BakeryDetail)
def get_bakery(bakery_id: int, db: Session = Depends(get_db)):
    bakery = db.query(Bakery).filter(Bakery.id == bakery_id).first()
    if not bakery:
        raise HTTPException(status_code=404, detail="Bakery not found")
```

Patterns for testability:
- Explicit 404 exceptions for missing resources
- Dependency injection via `Depends()` allows mocking in tests
- Clear response models enable validation testing

## Current Testing Gaps

**Frontend:**
- No unit tests for components
- No tests for `api.js` fetch functions
- No tests for form validation
- No tests for async state management
- No tests for error boundary behavior

**Backend:**
- No endpoint tests
- No database transaction tests
- No API integration tests
- No external API (Nominatim) mocking tests

## Recommended Testing Structure (For Future Implementation)

### Frontend Example (Vitest + Testing Library)

```jsx
// src/__tests__/BakeryCard.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BakeryCard from '../components/BakeryCard';

describe('BakeryCard', () => {
  it('renders bakery information', () => {
    const mockBakery = {
      id: 1,
      name: 'Test Bakery',
      address: '123 Main St',
      avg_score: 4.5,
    };
    const mockDelete = vi.fn();

    render(<BakeryCard bakery={mockBakery} onDelete={mockDelete} />);

    expect(screen.getByText('Test Bakery')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
  });

  it('calls onDelete when delete button clicked', async () => {
    const user = userEvent.setup();
    const mockBakery = { id: 1, name: 'Test', address: 'Test St', avg_score: null };
    const mockDelete = vi.fn();

    render(<BakeryCard bakery={mockBakery} onDelete={mockDelete} />);

    const deleteBtn = screen.getByTitle('Remove');
    await user.click(deleteBtn);

    expect(mockDelete).toHaveBeenCalledWith(1);
  });
});
```

### Backend Example (pytest)

```python
# tests/test_bakeries.py
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, SessionLocal

@pytest.fixture
def client():
    return TestClient(app)

def test_list_bakeries_empty(client):
    response = client.get("/api/bakeries")
    assert response.status_code == 200
    assert response.json() == []

def test_create_bakery(client):
    data = {"name": "Test Bakery", "address": "123 Main St"}
    response = client.post("/api/bakeries", json=data)
    assert response.status_code == 201
    assert response.json()["name"] == "Test Bakery"

def test_get_bakery_not_found(client):
    response = client.get("/api/bakeries/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Bakery not found"

def test_delete_bakery(client):
    # Create bakery first
    create_response = client.post("/api/bakeries",
                                 json={"name": "Test", "address": "123 Main"})
    bakery_id = create_response.json()["id"]

    # Delete it
    delete_response = client.delete(f"/api/bakeries/{bakery_id}")
    assert delete_response.status_code == 204
```

## Mocking Strategy (Future Implementation)

**Frontend - What to Mock:**
- API calls via `fetch()` (use MSW or vitest mocks)
- External services (Nominatim searches)
- Date-dependent operations

**Frontend - What NOT to Mock:**
- React hooks behavior
- DOM events and user interactions
- State management (test actual state updates)

**Backend - What to Mock:**
- External API calls (Nominatim geocoding)
- Database in integration tests (use test database or in-memory SQLite)

**Backend - What NOT to Mock:**
- Database ORM behavior (test with actual SQLAlchemy)
- FastAPI dependency injection (test actual dependencies)
- HTTPException handling

## Coverage Goals (Recommended)

- Frontend: Aim for 70%+ coverage on components and utilities
- Backend: Aim for 80%+ coverage on routers and schemas
- Critical paths: Auth, data validation, error handling at 100%

## Test Data & Fixtures (Recommended)

**Frontend:**
```jsx
// src/__tests__/fixtures/mockBakeries.js
export const mockBakeries = [
  {
    id: 1,
    name: "Pierre's Bakery",
    address: "123 Main St, Boston, MA",
    latitude: 42.36,
    longitude: -71.06,
    avg_score: 4.5,
    created_at: "2026-03-01T10:00:00",
  },
  {
    id: 2,
    name: "Le Petit Four",
    address: "456 Oak Ave, Boston, MA",
    latitude: 42.37,
    longitude: -71.05,
    avg_score: null,
    created_at: "2026-03-10T14:30:00",
  },
];
```

**Backend:**
```python
# tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app

@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

@pytest.fixture
def client(db):
    def override_get_db():
        return db

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
```

## Test Commands (Recommended for Implementation)

**Frontend:**
```bash
npm test              # Run all tests
npm run test:watch   # Watch mode
npm run test:cov     # Coverage report
```

**Backend:**
```bash
pytest               # Run all tests
pytest -v            # Verbose output
pytest --cov         # Coverage report
pytest -k test_name  # Run specific test
```

## Current Test Infrastructure

**No test infrastructure currently deployed.** The codebase is ready for testing to be added with these patterns:

**Testable Aspects:**
- Backend routers have clear input/output contracts via Pydantic schemas
- Frontend components accept props and callbacks, making them easily testable
- Dependency injection pattern in backend enables test fixture substitution
- API functions in `api.js` are isolated and can be mocked

**Barriers to Testing:**
- No test database configuration
- No mock/stub setup for external APIs
- Frontend components mix logic with presentation (monolithic components)
- No test utilities or helper functions pre-built

---

*Testing analysis: 2026-03-11*
