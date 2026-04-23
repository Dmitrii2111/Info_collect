CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM (
    'field_worker',
    'operator',
    'admin'
);

CREATE TYPE category_code AS ENUM (
    'medical',
    'furniture'
);

CREATE TYPE plan_version_status AS ENUM (
    'draft',
    'diff_ready',
    'approved',
    'applied',
    'rejected'
);

CREATE TYPE import_type AS ENUM (
    'initial_plan',
    'plan_update',
    'warehouse_receipt'
);

CREATE TYPE import_status AS ENUM (
    'started',
    'completed',
    'completed_with_errors',
    'failed'
);

CREATE TYPE import_row_status AS ENUM (
    'imported',
    'skipped',
    'warning',
    'error'
);

CREATE TYPE item_presence_status AS ENUM (
    'not_checked',
    'found',
    'missing',
    'in_storage',
    'moved_to_room',
    'awaiting_repeat_check',
    'conflict'
);

CREATE TYPE serial_state AS ENUM (
    'serial_entered',
    'not_provided',
    'unknown'
);

CREATE TYPE pnr_status AS ENUM (
    'not_required',
    'not_done',
    'done',
    'installation'
);

CREATE TYPE communications_status AS ENUM (
    'missing',
    'done',
    'done_with_errors'
);

CREATE TYPE check_type AS ENUM (
    'initial_check',
    'repeat_check',
    'operator_correction'
);

CREATE TYPE repeat_check_scope AS ENUM (
    'room',
    'item'
);

CREATE TYPE repeat_check_status AS ENUM (
    'open',
    'in_progress',
    'completed',
    'cancelled'
);

CREATE TYPE conflict_type AS ENUM (
    'presence_mismatch',
    'serial_mismatch',
    'pnr_mismatch',
    'communications_mismatch',
    'parallel_room_activity'
);

CREATE TYPE conflict_status AS ENUM (
    'open',
    'resolved',
    'dismissed'
);

CREATE TYPE receipt_status AS ENUM (
    'draft',
    'awaiting_confirmation',
    'partially_confirmed',
    'confirmed',
    'cancelled'
);

CREATE TYPE movement_type AS ENUM (
    'receipt_to_stock',
    'stock_to_stock',
    'stock_to_room',
    'room_to_stock',
    'stock_relocation'
);

CREATE TYPE change_set_status AS ENUM (
    'draft',
    'ready_for_review',
    'approved',
    'applied',
    'cancelled'
);

CREATE TYPE change_type AS ENUM (
    'room_added',
    'room_removed',
    'room_renamed',
    'position_added',
    'position_removed',
    'position_changed',
    'quantity_changed',
    'position_moved',
    'position_split',
    'position_merged',
    'unmatched'
);

CREATE TYPE change_resolution_status AS ENUM (
    'pending',
    'auto_matched',
    'requires_review',
    'approved',
    'applied',
    'rejected'
);

CREATE TYPE change_resolution_action AS ENUM (
    'create_new',
    'archive_old',
    'relink_items',
    'increase_instances',
    'decrease_instances',
    'move_room',
    'manual_resolution'
);

CREATE TYPE sync_batch_status AS ENUM (
    'received',
    'processed',
    'processed_with_errors',
    'failed'
);

CREATE TYPE export_type AS ENUM (
    'final_plan_report',
    'item_report',
    'stock_report',
    'user_activity_report',
    'conflict_report',
    'repeat_check_report'
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    last_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    full_name TEXT NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    phone TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category_scope category_code,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_team_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    team_id UUID NOT NULL REFERENCES teams(id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    CONSTRAINT uq_user_team_membership UNIQUE (user_id, team_id, started_at)
);

CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE floors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES buildings(id),
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    sort_order INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_floor_code_per_building UNIQUE (building_id, code)
);

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES buildings(id),
    name TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_department_name_per_building UNIQUE (building_id, name)
);

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES buildings(id),
    floor_id UUID REFERENCES floors(id),
    department_id UUID REFERENCES departments(id),
    room_code TEXT NOT NULL,
    room_name TEXT NOT NULL,
    room_type TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_room_code_per_building UNIQUE (building_id, room_code)
);

CREATE TABLE equipment_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code category_code NOT NULL UNIQUE,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    building_id UUID NOT NULL REFERENCES buildings(id),
    floor_id UUID REFERENCES floors(id),
    department_id UUID REFERENCES departments(id),
    room_id UUID REFERENCES rooms(id),
    category_id UUID REFERENCES equipment_categories(id),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id)
);

CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    device_uid TEXT NOT NULL UNIQUE,
    platform TEXT NOT NULL,
    app_version TEXT,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE import_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_type import_type NOT NULL,
    file_name TEXT NOT NULL,
    source_path TEXT,
    status_code import_status NOT NULL DEFAULT 'started',
    started_by UUID NOT NULL REFERENCES users(id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    summary_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE plan_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES buildings(id),
    version_no INT NOT NULL,
    version_label TEXT NOT NULL,
    source_file_name TEXT NOT NULL,
    status_code plan_version_status NOT NULL DEFAULT 'draft',
    import_session_id UUID NOT NULL REFERENCES import_sessions(id),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    applied_at TIMESTAMPTZ,
    comment_text TEXT,
    CONSTRAINT uq_plan_version_per_building UNIQUE (building_id, version_no)
);

CREATE TABLE planned_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_version_id UUID NOT NULL REFERENCES plan_versions(id),
    import_session_id UUID NOT NULL REFERENCES import_sessions(id),
    source_sheet_name TEXT NOT NULL,
    source_row_number INT NOT NULL,
    line_no INT,
    building_id UUID NOT NULL REFERENCES buildings(id),
    room_id UUID NOT NULL REFERENCES rooms(id),
    category_id UUID NOT NULL REFERENCES equipment_categories(id),
    position_code TEXT NOT NULL,
    equipment_name TEXT NOT NULL,
    description TEXT,
    model_mark TEXT,
    manufacturer TEXT,
    planned_quantity INT NOT NULL CHECK (planned_quantity > 0),
    unit_name TEXT,
    mounting_type TEXT,
    equipment_type TEXT,
    dimensions_text TEXT,
    weight_text TEXT,
    notes TEXT,
    raw_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_import_source_row UNIQUE (import_session_id, source_sheet_name, source_row_number)
);

CREATE TABLE planned_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planned_position_id UUID NOT NULL REFERENCES planned_positions(id),
    room_id UUID NOT NULL REFERENCES rooms(id),
    ordinal_no INT NOT NULL CHECK (ordinal_no > 0),
    display_label TEXT NOT NULL,
    requires_serial BOOLEAN NOT NULL DEFAULT TRUE,
    serial_policy TEXT NOT NULL DEFAULT 'required_or_not_provided',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_planned_item_ordinal UNIQUE (planned_position_id, ordinal_no)
);

CREATE TABLE storage_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES buildings(id),
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    room_id UUID REFERENCES rooms(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id),
    CONSTRAINT uq_storage_zone_code_per_building UNIQUE (building_id, code)
);

CREATE TABLE equipment_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planned_item_id UUID NOT NULL UNIQUE REFERENCES planned_items(id),
    current_room_id UUID REFERENCES rooms(id),
    current_storage_zone_id UUID REFERENCES storage_zones(id),
    current_presence_status item_presence_status NOT NULL DEFAULT 'not_checked',
    serial_number TEXT,
    serial_state serial_state NOT NULL DEFAULT 'unknown',
    pnr_status pnr_status NOT NULL DEFAULT 'not_done',
    communications_status communications_status NOT NULL DEFAULT 'missing',
    actual_condition TEXT,
    completeness_status TEXT,
    last_check_at TIMESTAMPTZ,
    last_checked_by UUID REFERENCES users(id),
    last_event_id UUID,
    version_no BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_equipment_instance_location
        CHECK (
            NOT (
                current_room_id IS NOT NULL
                AND current_storage_zone_id IS NOT NULL
            )
        )
);

CREATE UNIQUE INDEX uq_equipment_instances_serial_number
    ON equipment_instances(serial_number)
    WHERE serial_number IS NOT NULL;

CREATE TABLE sync_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id),
    user_id UUID NOT NULL REFERENCES users(id),
    batch_uid TEXT NOT NULL UNIQUE,
    sent_at_device TIMESTAMPTZ NOT NULL,
    received_at_server TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    items_count INT NOT NULL CHECK (items_count >= 0),
    status_code sync_batch_status NOT NULL DEFAULT 'received',
    error_text TEXT
);

CREATE TABLE domain_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_uid TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    aggregate_type TEXT NOT NULL,
    aggregate_id UUID NOT NULL,
    user_id UUID REFERENCES users(id),
    device_id UUID REFERENCES devices(id),
    sync_batch_id UUID REFERENCES sync_batches(id),
    occurred_at_device TIMESTAMPTZ,
    recorded_at_server TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payload_json JSONB NOT NULL,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE equipment_instances
    ADD CONSTRAINT fk_equipment_instances_last_event
    FOREIGN KEY (last_event_id) REFERENCES domain_events(id);

CREATE TABLE repeat_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope_type repeat_check_scope NOT NULL,
    room_id UUID REFERENCES rooms(id),
    equipment_instance_id UUID REFERENCES equipment_instances(id),
    reason_text TEXT,
    status_code repeat_check_status NOT NULL DEFAULT 'open',
    created_by UUID NOT NULL REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    CONSTRAINT chk_repeat_check_scope
        CHECK (
            (scope_type = 'room' AND room_id IS NOT NULL)
            OR (scope_type = 'item' AND equipment_instance_id IS NOT NULL)
        )
);

CREATE TABLE item_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_instance_id UUID NOT NULL REFERENCES equipment_instances(id),
    planned_item_id UUID NOT NULL REFERENCES planned_items(id),
    room_id UUID NOT NULL REFERENCES rooms(id),
    check_type check_type NOT NULL,
    presence_status item_presence_status NOT NULL,
    serial_number TEXT,
    serial_state serial_state NOT NULL,
    pnr_status pnr_status NOT NULL,
    communications_status communications_status NOT NULL,
    actual_condition TEXT,
    completeness_status TEXT,
    comment_text TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    device_id UUID REFERENCES devices(id),
    created_at_device TIMESTAMPTZ NOT NULL,
    received_at_server TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sync_batch_id UUID REFERENCES sync_batches(id),
    is_repeat_check BOOLEAN NOT NULL DEFAULT FALSE,
    repeat_check_id UUID REFERENCES repeat_checks(id),
    source_event_id UUID REFERENCES domain_events(id)
);

CREATE TABLE item_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_instance_id UUID NOT NULL REFERENCES equipment_instances(id),
    status_code item_presence_status NOT NULL,
    comment_text TEXT,
    changed_by UUID NOT NULL REFERENCES users(id),
    changed_at_device TIMESTAMPTZ,
    changed_at_server TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_check_id UUID REFERENCES item_checks(id),
    source_event_id UUID REFERENCES domain_events(id)
);

CREATE TABLE pnr_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_instance_id UUID NOT NULL REFERENCES equipment_instances(id),
    pnr_status pnr_status NOT NULL,
    comment_text TEXT,
    changed_by UUID NOT NULL REFERENCES users(id),
    changed_at_device TIMESTAMPTZ,
    changed_at_server TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_check_id UUID REFERENCES item_checks(id),
    source_event_id UUID REFERENCES domain_events(id)
);

CREATE TABLE communication_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_instance_id UUID NOT NULL REFERENCES equipment_instances(id),
    communications_status communications_status NOT NULL,
    comment_text TEXT,
    changed_by UUID NOT NULL REFERENCES users(id),
    changed_at_device TIMESTAMPTZ,
    changed_at_server TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_check_id UUID REFERENCES item_checks(id),
    source_event_id UUID REFERENCES domain_events(id)
);

CREATE TABLE conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conflict_type conflict_type NOT NULL,
    equipment_instance_id UUID REFERENCES equipment_instances(id),
    room_id UUID REFERENCES rooms(id),
    first_event_id UUID NOT NULL REFERENCES domain_events(id),
    second_event_id UUID NOT NULL REFERENCES domain_events(id),
    status_code conflict_status NOT NULL DEFAULT 'open',
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),
    resolution_note TEXT
);

CREATE TABLE warehouse_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_no TEXT,
    building_id UUID NOT NULL REFERENCES buildings(id),
    target_storage_zone_id UUID NOT NULL REFERENCES storage_zones(id),
    status_code receipt_status NOT NULL DEFAULT 'draft',
    source_import_session_id UUID REFERENCES import_sessions(id),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    comment_text TEXT
);

CREATE TABLE warehouse_receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_receipt_id UUID NOT NULL REFERENCES warehouse_receipts(id),
    planned_position_id UUID REFERENCES planned_positions(id),
    equipment_name TEXT NOT NULL,
    model_mark TEXT,
    category_id UUID REFERENCES equipment_categories(id),
    declared_quantity INT NOT NULL CHECK (declared_quantity >= 0),
    actual_quantity INT NOT NULL CHECK (actual_quantity >= 0),
    condition_status TEXT,
    completeness_status TEXT,
    comment_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE warehouse_receipt_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_receipt_item_id UUID NOT NULL REFERENCES warehouse_receipt_items(id),
    confirmed_by UUID NOT NULL REFERENCES users(id),
    confirmed_quantity INT NOT NULL CHECK (confirmed_quantity >= 0),
    condition_status TEXT,
    completeness_status TEXT,
    comment_text TEXT,
    created_at_device TIMESTAMPTZ NOT NULL,
    received_at_server TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_id UUID REFERENCES devices(id)
);

CREATE TABLE stock_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_zone_id UUID NOT NULL REFERENCES storage_zones(id),
    planned_item_id UUID REFERENCES planned_items(id),
    planned_position_id UUID REFERENCES planned_positions(id),
    quantity_on_hand INT NOT NULL CHECK (quantity_on_hand >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_stock_balance_target
        CHECK (
            planned_item_id IS NOT NULL
            OR planned_position_id IS NOT NULL
        )
);

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movement_type movement_type NOT NULL,
    equipment_instance_id UUID REFERENCES equipment_instances(id),
    planned_position_id UUID REFERENCES planned_positions(id),
    from_storage_zone_id UUID REFERENCES storage_zones(id),
    to_storage_zone_id UUID REFERENCES storage_zones(id),
    to_room_id UUID REFERENCES rooms(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    reason_text TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at_device TIMESTAMPTZ,
    received_at_server TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_receipt_item_id UUID REFERENCES warehouse_receipt_items(id),
    source_event_id UUID REFERENCES domain_events(id)
);

CREATE TABLE plan_change_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES buildings(id),
    old_plan_version_id UUID NOT NULL REFERENCES plan_versions(id),
    new_plan_version_id UUID NOT NULL REFERENCES plan_versions(id),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status_code change_set_status NOT NULL DEFAULT 'draft',
    summary_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE plan_change_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_change_set_id UUID NOT NULL REFERENCES plan_change_sets(id),
    change_type change_type NOT NULL,
    match_confidence NUMERIC(5,2),
    old_planned_position_id UUID REFERENCES planned_positions(id),
    new_planned_position_id UUID REFERENCES planned_positions(id),
    old_room_id UUID REFERENCES rooms(id),
    new_room_id UUID REFERENCES rooms(id),
    old_payload JSONB,
    new_payload JSONB,
    resolution_status change_resolution_status NOT NULL DEFAULT 'pending',
    resolution_action change_resolution_action,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    comment_text TEXT
);

CREATE TABLE import_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_session_id UUID NOT NULL REFERENCES import_sessions(id),
    sheet_name TEXT NOT NULL,
    row_number INT NOT NULL,
    status_code import_row_status NOT NULL,
    message_text TEXT,
    raw_payload JSONB NOT NULL
);

CREATE TABLE export_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_type export_type NOT NULL,
    file_name TEXT NOT NULL,
    requested_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    filters_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX ix_floors_building_id ON floors(building_id);
CREATE INDEX ix_departments_building_id ON departments(building_id);
CREATE INDEX ix_rooms_building_room_code ON rooms(building_id, room_code);
CREATE INDEX ix_user_assignments_user_id_started_at ON user_assignments(user_id, started_at DESC);
CREATE INDEX ix_plan_versions_building_id_version_no ON plan_versions(building_id, version_no);
CREATE INDEX ix_planned_positions_plan_version_id ON planned_positions(plan_version_id);
CREATE INDEX ix_planned_positions_room_id ON planned_positions(room_id);
CREATE INDEX ix_planned_positions_position_code ON planned_positions(position_code);
CREATE INDEX ix_planned_items_position_ordinal ON planned_items(planned_position_id, ordinal_no);
CREATE INDEX ix_equipment_instances_current_room_id ON equipment_instances(current_room_id);
CREATE INDEX ix_equipment_instances_current_storage_zone_id ON equipment_instances(current_storage_zone_id);
CREATE INDEX ix_equipment_instances_presence_status ON equipment_instances(current_presence_status);
CREATE INDEX ix_sync_batches_device_received_at ON sync_batches(device_id, received_at_server DESC);
CREATE INDEX ix_domain_events_aggregate ON domain_events(aggregate_type, aggregate_id, recorded_at_server DESC);
CREATE INDEX ix_domain_events_event_type ON domain_events(event_type, recorded_at_server DESC);
CREATE INDEX ix_item_checks_equipment_instance_id ON item_checks(equipment_instance_id, received_at_server DESC);
CREATE INDEX ix_item_checks_room_id ON item_checks(room_id, received_at_server DESC);
CREATE INDEX ix_item_status_history_instance_id ON item_status_history(equipment_instance_id, changed_at_server DESC);
CREATE INDEX ix_pnr_history_instance_id ON pnr_history(equipment_instance_id, changed_at_server DESC);
CREATE INDEX ix_communication_history_instance_id ON communication_history(equipment_instance_id, changed_at_server DESC);
CREATE INDEX ix_repeat_checks_room_id ON repeat_checks(room_id);
CREATE INDEX ix_repeat_checks_item_id ON repeat_checks(equipment_instance_id);
CREATE INDEX ix_conflicts_status_detected_at ON conflicts(status_code, detected_at DESC);
CREATE INDEX ix_warehouse_receipts_target_storage_zone_id ON warehouse_receipts(target_storage_zone_id, created_at DESC);
CREATE INDEX ix_warehouse_receipt_items_receipt_id ON warehouse_receipt_items(warehouse_receipt_id);
CREATE INDEX ix_stock_balances_storage_zone_id ON stock_balances(storage_zone_id);
CREATE INDEX ix_stock_movements_equipment_instance_id ON stock_movements(equipment_instance_id, received_at_server DESC);
CREATE INDEX ix_stock_movements_from_storage_zone_id ON stock_movements(from_storage_zone_id, received_at_server DESC);
CREATE INDEX ix_stock_movements_to_storage_zone_id ON stock_movements(to_storage_zone_id, received_at_server DESC);
CREATE INDEX ix_plan_change_sets_old_plan_version_id ON plan_change_sets(old_plan_version_id);
CREATE INDEX ix_plan_change_sets_new_plan_version_id ON plan_change_sets(new_plan_version_id);
CREATE INDEX ix_plan_change_items_change_set_id ON plan_change_items(plan_change_set_id);
CREATE INDEX ix_import_rows_import_session_id ON import_rows(import_session_id);

INSERT INTO equipment_categories (code, name)
VALUES
    ('medical', 'Medical equipment'),
    ('furniture', 'Furniture')
ON CONFLICT (code) DO NOTHING;
