"""Add price column to ratings table

Revision ID: 004_add_rating_price
Revises: 003_add_rating_photo
Create Date: 2026-03-15
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic
revision = "004_add_rating_price"
down_revision = "003_add_rating_photo"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    columns = [c["name"] for c in inspect(conn).get_columns("ratings")]
    if "price" not in columns:
        op.add_column("ratings", sa.Column("price", sa.Float(), nullable=True))


def downgrade():
    op.drop_column("ratings", "price")
