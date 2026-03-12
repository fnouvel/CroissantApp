"""Tests for the 4-category rating system."""


def _auth_header(client):
    """Register, login, return auth header dict."""
    client.post("/api/auth/register", json={"username": "sam", "password": "secret"})
    login = client.post("/api/auth/login", json={"username": "sam", "password": "secret"})
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _create_bakery(client, headers):
    """Create a bakery and return its id."""
    res = client.post(
        "/api/bakeries",
        json={"name": "Test Bakery", "address": "123 Main St"},
        headers=headers,
    )
    return res.json()["id"]


def test_create_rating_with_categories(client):
    headers = _auth_header(client)
    bakery_id = _create_bakery(client, headers)

    res = client.post(
        f"/api/bakeries/{bakery_id}/ratings",
        json={"flakiness": 5, "butteriness": 4, "freshness": 3, "size_value": 2},
        headers=headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert data["flakiness"] == 5
    assert data["butteriness"] == 4
    assert data["freshness"] == 3
    assert data["size_value"] == 2
    assert data["overall_score"] == 3.5
    assert data["username"] == "sam"


def test_create_rating_validation(client):
    headers = _auth_header(client)
    bakery_id = _create_bakery(client, headers)

    # Score out of range
    res = client.post(
        f"/api/bakeries/{bakery_id}/ratings",
        json={"flakiness": 6, "butteriness": 4, "freshness": 3, "size_value": 2},
        headers=headers,
    )
    assert res.status_code == 422


def test_my_ratings(client):
    headers = _auth_header(client)
    bakery_id = _create_bakery(client, headers)

    # Create a rating
    client.post(
        f"/api/bakeries/{bakery_id}/ratings",
        json={"flakiness": 5, "butteriness": 4, "freshness": 3, "size_value": 2},
        headers=headers,
    )

    res = client.get("/api/ratings/me", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["bakery_name"] == "Test Bakery"
    assert data[0]["overall_score"] == 3.5


def test_bakery_detail_with_aggregate(client):
    headers = _auth_header(client)
    bakery_id = _create_bakery(client, headers)

    # Create two ratings
    client.post(
        f"/api/bakeries/{bakery_id}/ratings",
        json={"flakiness": 4, "butteriness": 4, "freshness": 4, "size_value": 4},
        headers=headers,
    )
    client.post(
        f"/api/bakeries/{bakery_id}/ratings",
        json={"flakiness": 2, "butteriness": 2, "freshness": 2, "size_value": 2},
        headers=headers,
    )

    res = client.get(f"/api/bakeries/{bakery_id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["ratings"]) == 2
    assert data["aggregate"]["avg_flakiness"] == 3.0
    assert data["aggregate"]["avg_overall"] == 3.0
    assert data["aggregate"]["rating_count"] == 2


def test_bakery_list_avg_score(client):
    headers = _auth_header(client)
    bakery_id = _create_bakery(client, headers)

    client.post(
        f"/api/bakeries/{bakery_id}/ratings",
        json={"flakiness": 5, "butteriness": 5, "freshness": 5, "size_value": 5},
        headers=headers,
    )

    res = client.get("/api/bakeries", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["avg_score"] == 5.0
