"""Add 4-category rating columns (flakiness, butteriness, freshness, size_value)

Revision ID: 002_add_category_ratings
Revises: 001_add_user_auth
Create Date: 2026-03-11
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic
revision = "002_add_category_ratings"
down_revision = "001_add_user_auth"
branch_labels = None
depends_on = None


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    insp = inspect(bind)
    cols = [c["name"] for c in insp.get_columns(table_name)]
    return column_name in cols


def upgrade() -> None:
    # Add 4 category columns as nullable first (for backfill)
    with op.batch_alter_table("ratings") as batch_op:
        if not _column_exists("ratings", "flakiness"):
            batch_op.add_column(sa.Column("flakiness", sa.Integer(), nullable=True))
        if not _column_exists("ratings", "butteriness"):
            batch_op.add_column(sa.Column("butteriness", sa.Integer(), nullable=True))
        if not _column_exists("ratings", "freshness"):
            batch_op.add_column(sa.Column("freshness", sa.Integer(), nullable=True))
        if not _column_exists("ratings", "size_value"):
            batch_op.add_column(sa.Column("size_value", sa.Integer(), nullable=True))

    # Backfill: set all 4 categories to the existing score value
    op.execute("UPDATE ratings SET flakiness = score WHERE flakiness IS NULL")
    op.execute("UPDATE ratings SET butteriness = score WHERE butteriness IS NULL")
    op.execute("UPDATE ratings SET freshness = score WHERE freshness IS NULL")
    op.execute("UPDATE ratings SET size_value = score WHERE size_value IS NULL")

    # Note: SQLite doesn't support ALTER COLUMN to change type or set NOT NULL.
    # The score column stays as-is in the DB (SQLite is type-flexible).
    # The Python model treats it as Float.


def downgrade() -> None:
    with op.batch_alter_table("ratings") as batch_op:
        if _column_exists("ratings", "flakiness"):
            batch_op.drop_column("flakiness")
        if _column_exists("ratings", "butteriness"):
            batch_op.drop_column("butteriness")
        if _column_exists("ratings", "freshness"):
            batch_op.drop_column("freshness")
        if _column_exists("ratings", "size_value"):
            batch_op.drop_column("size_value")
