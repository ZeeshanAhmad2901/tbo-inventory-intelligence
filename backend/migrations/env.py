from logging.config import fileConfig

from alembic import context

from tbo_inventory.config import settings
from tbo_inventory.infrastructure.database.base import Base
from tbo_inventory.infrastructure.database.database import engine
from tbo_inventory.infrastructure.database.models import (  # noqa: F401
    CanonicalProduct,
    ImportJob,
    PasswordResetToken,
    RawRecord,
    Supplier,
    SupplierProduct,
    User,
    UserSession,
)

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations without creating a database connection."""
    context.configure(
        url=settings.database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations using the application's SQLAlchemy engine."""
    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
