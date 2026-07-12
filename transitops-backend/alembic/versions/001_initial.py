"""Initial schema — captures all existing TransitOps models.

Revision ID: 001_initial
Revises: 
Create Date: 2026-07-12 10:31:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # The app uses Base.metadata.create_all() on startup which already creates
    # tables for existing databases. This initial migration is a no-op so that
    # alembic version tracking starts correctly for future migrations.
    # For a fresh PostgreSQL database, use: alembic upgrade head
    pass


def downgrade() -> None:
    pass
