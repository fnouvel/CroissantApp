"""Add user auth — users table, user_id FK on bakeries and ratings, sentinel backfill

Revision ID: 001_add_user_auth
Revises:
Create Date: 2026-03-11
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic
revision = "001_add_user_auth"
down_revision = None
branch_labels = None
depends_on = None


def _table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    insp = inspect(bind)
    return table_name in insp.get_table_names()


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    insp = inspect(bind)
    cols = [c["name"] for c in insp.get_columns(table_name)]
    return column_name in cols


def upgrade() -> None:
    # 1. Create users table (skip if already exists — e.g. created by create_all before Alembic)
    if not _table_exists("users"):
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("username", sa.String(), nullable=False),
            sa.Column("hashed_password", sa.String(), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
        op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    # 2. Insert sentinel user if not already present
    op.execute(
        "INSERT OR IGNORE INTO users (id, username, hashed_password, is_active) "
        "VALUES (1, 'legacy', 'NOT_A_REAL_HASH', 1)"
    )

    # 3. Add user_id column to bakeries and backfill
    if not _column_exists("bakeries", "user_id"):
        with op.batch_alter_table("bakeries") as batch_op:
            batch_op.add_column(sa.Column("user_id", sa.Integer(), nullable=True))
            batch_op.create_foreign_key("fk_bakeries_user_id", "users", ["user_id"], ["id"])

    op.execute("UPDATE bakeries SET user_id = 1 WHERE user_id IS NULL")

    # 4. Add user_id column to ratings and backfill
    if not _column_exists("ratings", "user_id"):
        with op.batch_alter_table("ratings") as batch_op:
            batch_op.add_column(sa.Column("user_id", sa.Integer(), nullable=True))
            batch_op.create_foreign_key("fk_ratings_user_id", "users", ["user_id"], ["id"])

    op.execute("UPDATE ratings SET user_id = 1 WHERE user_id IS NULL")


def downgrade() -> None:
    # Remove user_id from ratings
    if _column_exists("ratings", "user_id"):
        with op.batch_alter_table("ratings") as batch_op:
            batch_op.drop_constraint("fk_ratings_user_id", type_="foreignkey")
            batch_op.drop_column("user_id")

    # Remove user_id from bakeries
    if _column_exists("bakeries", "user_id"):
        with op.batch_alter_table("bakeries") as batch_op:
            batch_op.drop_constraint("fk_bakeries_user_id", type_="foreignkey")
            batch_op.drop_column("user_id")

    # Drop users table
    if _table_exists("users"):
        op.drop_index(op.f("ix_users_username"), table_name="users")
        op.drop_index(op.f("ix_users_id"), table_name="users")
        op.drop_table("users")
