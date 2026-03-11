---
phase: 1
slug: auth-and-database-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest (latest) + pytest-asyncio (latest) |
| **Config file** | `backend/pytest.ini` — does not exist yet, Wave 0 creates it |
| **Quick run command** | `cd backend && source venv/bin/activate && pytest tests/test_auth.py -x -q` |
| **Full suite command** | `cd backend && source venv/bin/activate && pytest -q` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd backend && source venv/bin/activate && pytest tests/test_auth.py -x -q`
- **After every plan wave:** Run `cd backend && source venv/bin/activate && pytest -q`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | AUTH-01 | unit | `pytest tests/test_auth.py::test_register_creates_user -x` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | AUTH-01 | unit | `pytest tests/test_auth.py::test_register_duplicate_username -x` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | AUTH-02 | unit | `pytest tests/test_auth.py::test_login_returns_token -x` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 1 | AUTH-02 | unit | `pytest tests/test_auth.py::test_refresh_token -x` | ❌ W0 | ⬜ pending |
| 1-02-03 | 02 | 1 | AUTH-02 | unit | `pytest tests/test_auth.py::test_protected_endpoint_without_token_returns_401 -x` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 1 | AUTH-03 | unit | `pytest tests/test_auth.py::test_logout_clears_cookie -x` | ❌ W0 | ⬜ pending |
| 1-03-02 | 03 | 1 | AUTH-03 | unit | `pytest tests/test_auth.py::test_after_logout_refresh_returns_401 -x` | ❌ W0 | ⬜ pending |
| 1-04-01 | 04 | 1 | all | integration | `pytest tests/test_auth.py::test_protected_endpoint_with_token_succeeds -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/tests/conftest.py` — in-memory SQLite test DB and TestClient fixture
- [ ] `backend/tests/test_auth.py` — all AUTH-01/02/03 test case stubs
- [ ] `backend/pytest.ini` — minimal config (`testpaths = tests`, `asyncio_mode = auto`)
- [ ] Framework install: `pip install pytest pytest-asyncio` and update `requirements.txt`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| User stays logged in across browser refresh | AUTH-02 | Requires real browser cookie persistence | 1. Log in 2. Refresh page 3. Verify still authenticated |
| Logout accessible from any page | AUTH-03 | UI navigation test | 1. Navigate to different pages 2. Verify logout button visible 3. Click logout |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
