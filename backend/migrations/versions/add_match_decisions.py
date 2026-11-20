"""Add persistent supplier match decisions."""

from alembic import op
import sqlalchemy as sa


revision = "add_match_decisions"
down_revision = "add_supplier_canonical_link"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "supplier_match_decisions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("left_supplier_product_id", sa.Uuid(), nullable=False),
        sa.Column("right_supplier_product_id", sa.Uuid(), nullable=False),
        sa.Column(
            "decision",
            sa.String(length=16),
            server_default="rejected",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "left_supplier_product_id <> right_supplier_product_id",
            name="ck_supplier_match_decisions_distinct_products",
        ),
        sa.CheckConstraint(
            "decision = 'rejected'",
            name="ck_supplier_match_decisions_rejected_only",
        ),
        sa.ForeignKeyConstraint(
            ["left_supplier_product_id"],
            ["supplier_products.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["right_supplier_product_id"],
            ["supplier_products.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "left_supplier_product_id",
            "right_supplier_product_id",
            name="uq_supplier_match_decisions_pair",
        ),
    )


def downgrade() -> None:
    op.drop_table("supplier_match_decisions")
