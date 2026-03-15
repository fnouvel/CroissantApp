"""Seed 18 real Boston-area bakeries into the database.

Clears all existing bakeries (and their ratings via cascade) first,
then inserts fresh data with hardcoded coordinates.

Usage:
    cd backend
    source venv/bin/activate
    python seed_bakeries.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models.models import Bakery, Rating

BAKERIES = [
    {"name": "Clear Flour Bread", "address": "178 Thorndike St, Brookline, MA", "latitude": 42.3420, "longitude": -71.1210},
    {"name": "Tatte Bakery & Cafe (Charles St)", "address": "70 Charles St, Boston, MA", "latitude": 42.3580, "longitude": -71.0710},
    {"name": "Flour Bakery + Cafe (South End)", "address": "1595 Washington St, Boston, MA", "latitude": 42.3390, "longitude": -71.0720},
    {"name": "Maison Villatte", "address": "64 Church St, Cambridge, MA", "latitude": 42.3745, "longitude": -71.1210},
    {"name": "Levain Bakery (Newbury St)", "address": "121 Newbury St, Boston, MA", "latitude": 42.3510, "longitude": -71.0760},
    {"name": "Patisserie on Newbury", "address": "182 Newbury St, Boston, MA", "latitude": 42.3500, "longitude": -71.0788},
    {"name": "Plaisirs Sucrés", "address": "56 JFK St, Cambridge, MA", "latitude": 42.3720, "longitude": -71.1190},
    {"name": "La Saison", "address": "1 Bow Market Way, Somerville, MA", "latitude": 42.3960, "longitude": -71.0980},
    {"name": "Kaju Bakery", "address": "95 Linden St, Allston, MA", "latitude": 42.3530, "longitude": -71.1320},
    {"name": "Pain D'Avignon (Boston Public Market)", "address": "100 Hanover St, Boston, MA", "latitude": 42.3620, "longitude": -71.0560},
    {"name": "Mah-Ze-Dahr Bakery", "address": "696 Tremont St, Boston, MA", "latitude": 42.3405, "longitude": -71.0735},
    {"name": "Elina's Bakery", "address": "130 Jersey St, Boston, MA", "latitude": 42.3460, "longitude": -71.0980},
    {"name": "Pâtisserie Boréale", "address": "145 Huron Ave, Cambridge, MA", "latitude": 42.3810, "longitude": -71.1350},
    {"name": "Sofra Bakery & Cafe", "address": "1 Belmont St, Cambridge, MA", "latitude": 42.3770, "longitude": -71.1450},
    {"name": "Boulangerie", "address": "5 Westland Ave, Boston, MA", "latitude": 42.3440, "longitude": -71.0870},
    {"name": "Colette Bakery (South End)", "address": "517 Columbus Ave, Boston, MA", "latitude": 42.3410, "longitude": -71.0810},
    {"name": "Colette Bakery (Medford)", "address": "509 Main St, Medford, MA", "latitude": 42.4185, "longitude": -71.1080},
    {"name": "Colette Bakery (Melrose)", "address": "465 Main St, Melrose, MA", "latitude": 42.4590, "longitude": -71.0600},
]


def main():
    db = SessionLocal()
    try:
        # Delete all ratings first (FK constraint), then all bakeries
        rating_count = db.query(Rating).delete()
        bakery_count = db.query(Bakery).delete()
        db.commit()
        print(f"Deleted {bakery_count} bakeries and {rating_count} ratings")

        # Insert 18 bakeries
        for data in BAKERIES:
            db.add(Bakery(**data, user_id=None))
        db.commit()
        print(f"Inserted {len(BAKERIES)} bakeries")

        # Verify
        total = db.query(Bakery).count()
        print(f"\nDatabase now has {total} bakeries")
    finally:
        db.close()


if __name__ == "__main__":
    main()
