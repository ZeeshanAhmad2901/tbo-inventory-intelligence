"""link supplier products to canonical products."""
from alembic import op
import sqlalchemy as sa

revision = "add_supplier_canonical_link"
down_revision = "2d73ccfabe9a"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column(
        "supplier_products",
        sa.Column("canonical_product_id", sa.Uuid(), nullable=True),
    )
    op.create_foreign_key(
        "fk_supplier_products_canonical_product_id_canonical_products",
        "supplier_products", "canonical_products",
        ["canonical_product_id"], ["id"], ondelete="SET NULL",
    )
    op.create_index(
        "ix_supplier_products_canonical_product_id",
        "supplier_products", ["canonical_product_id"],
    )

def downgrade() -> None:
    op.drop_index("ix_supplier_products_canonical_product_id", table_name="supplier_products")
    op.drop_constraint(
        "fk_supplier_products_canonical_product_id_canonical_products",
        "supplier_products", type_="foreignkey",
    )
    op.drop_column("supplier_products", "canonical_product_id")
