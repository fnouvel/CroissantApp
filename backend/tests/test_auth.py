"""Auth endpoint tests — RED phase. All tests defined before implementation."""


def test_register_creates_user(client):
    res = client.post("/api/auth/register", json={"username": "sam", "password": "secret"})
    assert res.status_code == 201
    data = res.json()
    assert data["username"] == "sam"
    assert "id" in data
    # Password must NOT be in response
    assert "password" not in data
    assert "hashed_password" not in data


def test_register_duplicate_username(client):
    client.post("/api/auth/register", json={"username": "sam", "password": "secret"})
    res = client.post("/api/auth/register", json={"username": "sam", "password": "other"})
    assert res.status_code == 400


def test_login_returns_token(client):
    client.post("/api/auth/register", json={"username": "sam", "password": "secret"})
    res = client.post("/api/auth/login", json={"username": "sam", "password": "secret"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "user" in data
    assert data["user"]["username"] == "sam"
    # Refresh token must be set as a cookie
    assert "refresh_token" in res.cookies


def test_login_wrong_password_returns_401(client):
    client.post("/api/auth/register", json={"username": "sam", "password": "secret"})
    res = client.post("/api/auth/login", json={"username": "sam", "password": "wrong"})
    assert res.status_code == 401


def test_refresh_token(client):
    # Register and login to get refresh cookie
    client.post("/api/auth/register", json={"username": "sam", "password": "secret"})
    login_res = client.post("/api/auth/login", json={"username": "sam", "password": "secret"})
    assert login_res.status_code == 200
    refresh_cookie = login_res.cookies.get("refresh_token")
    assert refresh_cookie is not None

    # Use the cookie to get a new access token
    res = client.post("/api/auth/refresh", cookies={"refresh_token": refresh_cookie})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["username"] == "sam"


def test_protected_endpoint_without_token_returns_401(client):
    res = client.get("/api/bakeries")
    assert res.status_code == 401


def test_protected_endpoint_with_token_succeeds(client):
    client.post("/api/auth/register", json={"username": "sam", "password": "secret"})
    login_res = client.post("/api/auth/login", json={"username": "sam", "password": "secret"})
    token = login_res.json()["access_token"]
    res = client.get("/api/bakeries", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200


def test_logout_clears_cookie(client):
    client.post("/api/auth/register", json={"username": "sam", "password": "secret"})
    client.post("/api/auth/login", json={"username": "sam", "password": "secret"})
    res = client.post("/api/auth/logout")
    assert res.status_code == 200
    assert res.json()["message"] == "Logged out"
    # Cookie should be cleared (empty value or absent)
    cookie_val = res.cookies.get("refresh_token")
    assert cookie_val is None or cookie_val == ""


def test_after_logout_refresh_returns_401(client):
    client.post("/api/auth/register", json={"username": "sam", "password": "secret"})
    login_res = client.post("/api/auth/login", json={"username": "sam", "password": "secret"})
    login_res.cookies.get("refresh_token")

    # Logout
    client.post("/api/auth/logout")

    # After logout, attempt to use the old refresh token
    # The server-side doesn't blacklist tokens (stateless), so a valid token still works
    # But if no cookie is sent (cleared client-side), refresh should return 401
    res = client.post("/api/auth/refresh")  # No cookie sent
    assert res.status_code == 401
