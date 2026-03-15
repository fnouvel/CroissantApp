"""Add photo_url column to ratings table

Revision ID: 003_add_rating_photo
Revises: 002_add_category_ratings
Create Date: 2026-03-15
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic
revision = "003_add_rating_photo"
down_revision = "002_add_category_ratings"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    columns = [c["name"] for c in inspect(conn).get_columns("ratings")]
    if "photo_url" not in columns:
        op.add_column("ratings", sa.Column("photo_url", sa.String(), nullable=True))


def downgrade():
    op.drop_column("ratings", "photo_url")
