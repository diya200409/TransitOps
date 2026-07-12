"""
Alembic env.py for TransitOps.
Reads DATABASE_URL from app config (defaults to SQLite for local dev).
Supports both online (live) and offline (SQL script) migration modes.
"""

import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool

# Make the app package importable from transitops-backend/
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# Import the shared declarative Base and all models so Alembic sees them
from app.database import SQLALCHEMY_DATABASE_URL  # noqa: E402
from app.models import Base  # noqa: E402 F401  — import models to register metadata

# this is the Alembic Config object, which provides access to the values
# within the .ini file in use.
config = context.config

# Override sqlalchemy.url with what the app actually uses
config.set_main_option("sqlalchemy.url", SQLALCHEMY_DATABASE_URL)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for autogenerate support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL, not an actual Engine.
    Calls to context.execute() here emit the given string to the script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine and associate a connection
    with the context.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
