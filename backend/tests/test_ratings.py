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


def _post_rating(client, bakery_id, headers, **scores):
    """Post a rating using form data."""
    return client.post(
        f"/api/bakeries/{bakery_id}/ratings",
        data=scores,
        headers=headers,
    )


def test_create_rating_with_categories(client):
    headers = _auth_header(client)
    bakery_id = _create_bakery(client, headers)

    res = _post_rating(client, bakery_id, headers,
                       flakiness=5, butteriness=4, freshness=3, size_value=2)
    assert res.status_code == 201
    data = res.json()
    assert data["flakiness"] == 5
    assert data["butteriness"] == 4
    assert data["freshness"] == 3
    assert data["size_value"] == 2
    assert data["overall_score"] == 3.5
    assert data["username"] == "sam"
    assert data["photo_url"] is None


def test_create_rating_validation(client):
    headers = _auth_header(client)
    bakery_id = _create_bakery(client, headers)

    # Score out of range
    res = _post_rating(client, bakery_id, headers,
                       flakiness=6, butteriness=4, freshness=3, size_value=2)
    assert res.status_code == 422


def test_my_ratings(client):
    headers = _auth_header(client)
    bakery_id = _create_bakery(client, headers)

    _post_rating(client, bakery_id, headers,
                 flakiness=5, butteriness=4, freshness=3, size_value=2)

    res = client.get("/api/ratings/me", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["bakery_name"] == "Test Bakery"
    assert data[0]["overall_score"] == 3.5


def test_bakery_detail_with_aggregate(client):
    headers = _auth_header(client)
    bakery_id = _create_bakery(client, headers)

    _post_rating(client, bakery_id, headers,
                 flakiness=4, butteriness=4, freshness=4, size_value=4)
    _post_rating(client, bakery_id, headers,
                 flakiness=2, butteriness=2, freshness=2, size_value=2)

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

    _post_rating(client, bakery_id, headers,
                 flakiness=5, butteriness=5, freshness=5, size_value=5)

    res = client.get("/api/bakeries", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["avg_score"] == 5.0


def test_create_rating_with_photo(client, tmp_path):
    headers = _auth_header(client)
    bakery_id = _create_bakery(client, headers)

    # Create a small test image file
    img = tmp_path / "test.jpg"
    img.write_bytes(b"\xff\xd8\xff\xe0" + b"\x00" * 100)

    with open(img, "rb") as f:
        res = client.post(
            f"/api/bakeries/{bakery_id}/ratings",
            data={"flakiness": 5, "butteriness": 4, "freshness": 3, "size_value": 2},
            files={"photo": ("test.jpg", f, "image/jpeg")},
            headers=headers,
        )
    assert res.status_code == 201
    data = res.json()
    assert data["photo_url"] is not None
    assert data["photo_url"].startswith("/uploads/")
