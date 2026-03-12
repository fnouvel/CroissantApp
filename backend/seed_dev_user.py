"""Seed a dev test user (flore-test / croissant123). Idempotent — safe to run multiple times."""

import requests
import sys

BASE = "http://localhost:8000/api/auth"
USERNAME = "flore-test"
PASSWORD = "croissant123"


def main():
    # Try registering
    r = requests.post(f"{BASE}/register", json={"username": USERNAME, "password": PASSWORD})
    if r.status_code == 201:
        print(f"Created user: {USERNAME}")
    elif r.status_code == 400 and "already taken" in r.text:
        print(f"User '{USERNAME}' already exists")
    else:
        print(f"Register failed: {r.status_code} {r.text}")
        sys.exit(1)

    # Verify login works
    r = requests.post(f"{BASE}/login", json={"username": USERNAME, "password": PASSWORD})
    if r.status_code == 200:
        print(f"Login verified OK")
        print(f"\n  Username: {USERNAME}")
        print(f"  Password: {PASSWORD}")
    else:
        print(f"Login failed: {r.status_code} {r.text}")
        sys.exit(1)


if __name__ == "__main__":
    main()
