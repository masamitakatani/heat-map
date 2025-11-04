"""initial schema

Revision ID: 001
Revises:
Create Date: 2025-11-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('anonymous_id', sa.String(255), nullable=False, unique=True, index=True),
        sa.Column('connected_one_user_id', sa.String(255), nullable=True, index=True),
        sa.Column('first_visit_at', sa.DateTime(), nullable=False),
        sa.Column('last_visit_at', sa.DateTime(), nullable=False),
        sa.Column('total_sessions', sa.Integer(), nullable=False, default=1),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )

    # Create api_keys table
    op.create_table(
        'api_keys',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('key', sa.String(64), nullable=False, unique=True, index=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('last_used_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )

    # Create webhook_configs table
    op.create_table(
        'webhook_configs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('url', sa.Text(), nullable=False),
        sa.Column('secret', sa.String(64), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('event_types', postgresql.ARRAY(sa.String()), nullable=False, default=[]),
        sa.Column('max_retries', sa.Integer(), nullable=False, default=3),
        sa.Column('retry_delay_seconds', sa.Integer(), nullable=False, default=60),
        sa.Column('last_triggered_at', sa.DateTime(), nullable=True),
        sa.Column('total_deliveries', sa.Integer(), nullable=False, default=0),
        sa.Column('failed_deliveries', sa.Integer(), nullable=False, default=0),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )

    # Create pages table
    op.create_table(
        'pages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('page_id', sa.String(255), nullable=False, unique=True, index=True),
        sa.Column('page_url', sa.Text(), nullable=False),
        sa.Column('viewport_width', sa.Integer(), nullable=False),
        sa.Column('viewport_height', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )

    # Create sessions table
    op.create_table(
        'sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('session_id', sa.String(255), nullable=False, unique=True, index=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('page_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('device_type', sa.String(50), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('ended_at', sa.DateTime(), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['page_id'], ['pages.id'], ondelete='CASCADE'),
    )

    # Create click_events table
    op.create_table(
        'click_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('page_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('x', sa.Integer(), nullable=False),
        sa.Column('y', sa.Integer(), nullable=False),
        sa.Column('element_tag_name', sa.String(100), nullable=True),
        sa.Column('element_class_name', sa.String(255), nullable=True),
        sa.Column('element_id', sa.String(255), nullable=True),
        sa.Column('element_text', sa.String(255), nullable=True),
        sa.Column('timestamp', sa.BigInteger(), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['page_id'], ['pages.id'], ondelete='CASCADE'),
    )

    # Create scroll_events table
    op.create_table(
        'scroll_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('page_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('max_depth_percent', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.BigInteger(), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['page_id'], ['pages.id'], ondelete='CASCADE'),
    )

    # Create mouse_move_events table
    op.create_table(
        'mouse_move_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('page_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('positions', postgresql.JSONB(), nullable=False),
        sa.Column('timestamp', sa.BigInteger(), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['page_id'], ['pages.id'], ondelete='CASCADE'),
    )

    # Create funnels table
    op.create_table(
        'funnels',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('funnel_id', sa.String(255), nullable=False, unique=True, index=True),
        sa.Column('funnel_name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )

    # Create funnel_steps table
    op.create_table(
        'funnel_steps',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('funnel_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('step_index', sa.Integer(), nullable=False),
        sa.Column('step_name', sa.String(255), nullable=False),
        sa.Column('page_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['funnel_id'], ['funnels.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['page_id'], ['pages.id'], ondelete='CASCADE'),
    )

    # Create funnel_events table
    op.create_table(
        'funnel_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('funnel_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('completed_steps', postgresql.ARRAY(sa.Integer()), nullable=False, default=[]),
        sa.Column('dropoff_step', sa.Integer(), nullable=True),
        sa.Column('is_completed', sa.Boolean(), nullable=False, default=False),
        sa.Column('started_at', sa.BigInteger(), nullable=False),
        sa.Column('completed_at', sa.BigInteger(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['funnel_id'], ['funnels.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ondelete='CASCADE'),
    )

    # Create webhook_logs table
    op.create_table(
        'webhook_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('event_type', sa.String(100), nullable=False, index=True),
        sa.Column('payload', postgresql.JSONB(), nullable=False),
        sa.Column('response_status', sa.Integer(), nullable=True),
        sa.Column('response_body', sa.Text(), nullable=True),
        sa.Column('sent_at', sa.DateTime(), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('webhook_logs')
    op.drop_table('funnel_events')
    op.drop_table('funnel_steps')
    op.drop_table('funnels')
    op.drop_table('mouse_move_events')
    op.drop_table('scroll_events')
    op.drop_table('click_events')
    op.drop_table('sessions')
    op.drop_table('pages')
    op.drop_table('webhook_configs')
    op.drop_table('api_keys')
    op.drop_table('users')
