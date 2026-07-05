"""Add polygon column to geo_challenge

Revision ID: 2b7c9d4e5f01
Revises: 1a5e83bf7e42
Create Date: 2026-07-05 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '2b7c9d4e5f01'
down_revision = '1a5e83bf7e42'
branch_labels = None
depends_on = None


def upgrade(op=None):
    # Add the polygon column if it doesn't already exist
    try:
        op.add_column(
            'geo_challenge',
            sa.Column('polygon', sa.Text, nullable=True)
        )
    except Exception as e:
        print(f"Column add error (might already exist): {str(e)}")


def downgrade(op=None):
    try:
        op.drop_column('geo_challenge', 'polygon')
    except Exception as e:
        print(f"Column drop error: {str(e)}")
