# Проектирование структуры данных

## 1. Цель модели

Структура данных должна поддерживать:

- поэкземплярный учет оборудования;
- привязку каждого экземпляра к плановому месту установки;
- фиксацию фактических проверок с мобильных устройств;
- работу в офлайн-режиме с последующей синхронизацией;
- складские зоны, поступления, подтверждения приемки и перемещения;
- повторные проверки;
- конфликты между действиями разных сотрудников;
- полную историю изменений и событий.

Модель ориентирована на `PostgreSQL` и `event-driven` подход: у каждой сущности есть текущее состояние, но ключевые изменения также пишутся в журнал событий.

---

## 2. Общие принципы

1. Читаемые поля из Excel не используются как первичные ключи.
2. `ПОЗ` не считается уникальным идентификатором по зданию.
3. Базовая единица учета: `плановый физический экземпляр`.
4. Для строки Excel с `КОЛ > 1` создается несколько экземпляров.
5. Серийный номер уникален в рамках системы, кроме значения `не предусмотрен`.
6. Операторские правки не затирают историю, а создают отдельные события.
7. Офлайн-клиент отправляет на сервер действия как события с уникальными идентификаторами.
8. Конфликт не удаляет данные, а фиксируется как отдельная сущность.
9. Исходная Excel-ведомость является версионируемым источником данных и может переимпортироваться в любой момент.
10. При загрузке новой версии ведомости система должна уметь сравнивать старую и новую версии и формировать дельту изменений.
11. Изменения в новой версии ведомости не должны уничтожать уже накопленную фактическую историю без явного решения оператора.

---

## 3. Логические группы сущностей

### 3.1. Организационная структура

- `buildings`
- `floors`
- `departments`
- `rooms`
- `storage_zones`
- `teams`
- `users`
- `user_assignments`

### 3.2. Плановая модель оборудования

- `equipment_categories`
- `planned_positions`
- `planned_items`

### 3.3. Фактический учет

- `equipment_instances`
- `item_checks`
- `item_status_history`
- `pnr_history`
- `communication_history`
- `repeat_checks`
- `conflicts`

### 3.4. Складской учет

- `warehouse_receipts`
- `warehouse_receipt_items`
- `warehouse_receipt_confirmations`
- `stock_balances`
- `stock_movements`

### 3.5. События и синхронизация

- `devices`
- `sync_batches`
- `domain_events`
- `event_outbox` при необходимости

### 3.6. Импорт и отчетность

- `plan_versions`
- `import_sessions`
- `import_rows`
- `plan_change_sets`
- `plan_change_items`
- `export_sessions`

---

## 4. Основные справочники

## 4.1. `equipment_categories`

Справочник категорий оборудования.

Поля:

- `id` UUID PK
- `code` TEXT UNIQUE NOT NULL
- `name` TEXT NOT NULL
- `is_active` BOOLEAN NOT NULL DEFAULT TRUE
- `created_at` TIMESTAMPTZ NOT NULL

Начальные записи:

- `medical`
- `furniture`

## 4.2. `status_catalog`

Если потребуется централизованно хранить статусы.

Поля:

- `id` UUID PK
- `status_group` TEXT NOT NULL
- `code` TEXT NOT NULL
- `name` TEXT NOT NULL
- `sort_order` INT NOT NULL
- `is_active` BOOLEAN NOT NULL DEFAULT TRUE

Уникальность:

- UNIQUE (`status_group`, `code`)

Основные группы статусов:

- `item_presence_status`
- `pnr_status`
- `communications_status`
- `receipt_status`
- `conflict_status`
- `repeat_check_status`
- `movement_type`

---

## 5. Организационные сущности

## 5.1. `users`

Пользователи системы.

Поля:

- `id` UUID PK
- `login` TEXT UNIQUE NOT NULL
- `password_hash` TEXT NOT NULL
- `last_name` TEXT NOT NULL
- `first_name` TEXT NOT NULL
- `middle_name` TEXT NULL
- `full_name` TEXT NOT NULL
- `role` TEXT NOT NULL
- `is_active` BOOLEAN NOT NULL DEFAULT TRUE
- `phone` TEXT NULL
- `email` TEXT NULL
- `created_at` TIMESTAMPTZ NOT NULL
- `updated_at` TIMESTAMPTZ NOT NULL

Роли:

- `field_worker`
- `operator`
- `admin`

## 5.2. `teams`

Бригады или рабочие группы.

Поля:

- `id` UUID PK
- `name` TEXT NOT NULL
- `category_scope` TEXT NULL
- `is_active` BOOLEAN NOT NULL DEFAULT TRUE
- `created_at` TIMESTAMPTZ NOT NULL

Примечание:

- `category_scope` может ограничивать бригаду медицинским оборудованием или мебелью.

## 5.3. `user_team_memberships`

Связь сотрудников с бригадами.

Поля:

- `id` UUID PK
- `user_id` UUID FK -> `users.id`
- `team_id` UUID FK -> `teams.id`
- `started_at` TIMESTAMPTZ NOT NULL
- `ended_at` TIMESTAMPTZ NULL

## 5.4. `buildings`

Поля:

- `id` UUID PK
- `code` TEXT UNIQUE NOT NULL
- `name` TEXT NOT NULL
- `address` TEXT NULL
- `is_active` BOOLEAN NOT NULL DEFAULT TRUE

## 5.5. `floors`

Поля:

- `id` UUID PK
- `building_id` UUID FK -> `buildings.id`
- `code` TEXT NOT NULL
- `name` TEXT NOT NULL
- `sort_order` INT NOT NULL

Уникальность:

- UNIQUE (`building_id`, `code`)

## 5.6. `departments`

Поля:

- `id` UUID PK
- `building_id` UUID FK -> `buildings.id`
- `name` TEXT NOT NULL
- `sort_order` INT NOT NULL DEFAULT 0

Уникальность:

- UNIQUE (`building_id`, `name`)

## 5.7. `rooms`

Главная сущность для помещения.

Поля:

- `id` UUID PK
- `building_id` UUID FK -> `buildings.id`
- `floor_id` UUID FK -> `floors.id`
- `department_id` UUID FK -> `departments.id`
- `room_code` TEXT NOT NULL
- `room_name` TEXT NOT NULL
- `room_type` TEXT NULL
- `is_active` BOOLEAN NOT NULL DEFAULT TRUE
- `created_at` TIMESTAMPTZ NOT NULL
- `updated_at` TIMESTAMPTZ NOT NULL

Уникальность:

- UNIQUE (`building_id`, `room_code`)

Примечание:

- Название помещения не уникально и не может быть идентификатором.

## 5.8. `user_assignments`

Назначения зон ответственности.

Поля:

- `id` UUID PK
- `user_id` UUID FK -> `users.id`
- `team_id` UUID NULL FK -> `teams.id`
- `building_id` UUID FK -> `buildings.id`
- `floor_id` UUID NULL FK -> `floors.id`
- `department_id` UUID NULL FK -> `departments.id`
- `room_id` UUID NULL FK -> `rooms.id`
- `category_id` UUID NULL FK -> `equipment_categories.id`
- `is_primary` BOOLEAN NOT NULL DEFAULT FALSE
- `started_at` TIMESTAMPTZ NOT NULL
- `ended_at` TIMESTAMPTZ NULL
- `created_by` UUID FK -> `users.id`

Назначение может быть:

- на этаж;
- на отделение;
- на конкретное помещение;
- на категорию оборудования;
- на бригаду.

---

## 6. Плановая модель оборудования

## 6.0. `plan_versions`

Версии исходной плановой ведомости.

Поля:

- `id` UUID PK
- `building_id` UUID FK -> `buildings.id`
- `version_no` INT NOT NULL
- `version_label` TEXT NOT NULL
- `source_file_name` TEXT NOT NULL
- `status_code` TEXT NOT NULL
- `import_session_id` UUID FK -> `import_sessions.id`
- `created_by` UUID FK -> `users.id`
- `created_at` TIMESTAMPTZ NOT NULL
- `applied_at` TIMESTAMPTZ NULL
- `comment_text` TEXT NULL

Уникальность:

- UNIQUE (`building_id`, `version_no`)

`status_code`:

- `draft`
- `diff_ready`
- `approved`
- `applied`
- `rejected`

Примечание:

- для каждого здания должна существовать текущая активная версия плана;
- новая версия сначала загружается как черновик, затем сравнивается с действующей и только после подтверждения применяется.

## 6.1. `planned_positions`

Одна строка исходной Excel-ведомости.

Поля:

- `id` UUID PK
- `plan_version_id` UUID FK -> `plan_versions.id`
- `import_session_id` UUID FK -> `import_sessions.id`
- `source_sheet_name` TEXT NOT NULL
- `source_row_number` INT NOT NULL
- `line_no` INT NULL
- `building_id` UUID FK -> `buildings.id`
- `room_id` UUID FK -> `rooms.id`
- `category_id` UUID FK -> `equipment_categories.id`
- `position_code` TEXT NOT NULL
- `equipment_name` TEXT NOT NULL
- `description` TEXT NULL
- `model_mark` TEXT NULL
- `manufacturer` TEXT NULL
- `planned_quantity` INT NOT NULL
- `unit_name` TEXT NULL
- `mounting_type` TEXT NULL
- `equipment_type` TEXT NULL
- `dimensions_text` TEXT NULL
- `weight_text` TEXT NULL
- `notes` TEXT NULL
- `raw_payload` JSONB NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL

Индексы:

- INDEX (`plan_version_id`)
- INDEX (`room_id`)
- INDEX (`position_code`)
- INDEX (`category_id`)

Уникальность:

- UNIQUE (`import_session_id`, `source_sheet_name`, `source_row_number`)

## 6.2. `planned_items`

Развернутые физические экземпляры по строке ведомости.

Поля:

- `id` UUID PK
- `planned_position_id` UUID FK -> `planned_positions.id`
- `room_id` UUID FK -> `rooms.id`
- `ordinal_no` INT NOT NULL
- `display_label` TEXT NOT NULL
- `requires_serial` BOOLEAN NOT NULL DEFAULT TRUE
- `serial_policy` TEXT NOT NULL DEFAULT 'required_or_not_provided'
- `is_active` BOOLEAN NOT NULL DEFAULT TRUE
- `created_at` TIMESTAMPTZ NOT NULL

Уникальность:

- UNIQUE (`planned_position_id`, `ordinal_no`)

Пример:

- строка с `КОЛ = 3` порождает 3 записи с `ordinal_no = 1, 2, 3`.

---

## 7. Фактический учет

## 7.1. `equipment_instances`

Текущее состояние экземпляра.

Поля:

- `id` UUID PK
- `planned_item_id` UUID FK -> `planned_items.id`
- `current_room_id` UUID NULL FK -> `rooms.id`
- `current_storage_zone_id` UUID NULL FK -> `storage_zones.id`
- `current_presence_status` TEXT NOT NULL
- `serial_number` TEXT NULL
- `serial_state` TEXT NOT NULL
- `pnr_status` TEXT NOT NULL
- `communications_status` TEXT NOT NULL
- `actual_condition` TEXT NULL
- `completeness_status` TEXT NULL
- `last_check_at` TIMESTAMPTZ NULL
- `last_checked_by` UUID NULL FK -> `users.id`
- `last_event_id` UUID NULL
- `version_no` BIGINT NOT NULL DEFAULT 1
- `created_at` TIMESTAMPTZ NOT NULL
- `updated_at` TIMESTAMPTZ NOT NULL

Статусы `serial_state`:

- `serial_entered`
- `not_provided`
- `unknown`

Важные ограничения:

- CHECK: одновременно экземпляр не может быть и в помещении, и на складе, если бизнес-правило не позволяет иное.
- UNIQUE (`serial_number`) WHERE `serial_number IS NOT NULL`

Примечание:

- значение `не предусмотрен` лучше хранить не в `serial_number`, а в `serial_state = 'not_provided'`.

## 7.2. `item_checks`

Каждое действие проверки по экземпляру.

Поля:

- `id` UUID PK
- `equipment_instance_id` UUID FK -> `equipment_instances.id`
- `planned_item_id` UUID FK -> `planned_items.id`
- `room_id` UUID FK -> `rooms.id`
- `check_type` TEXT NOT NULL
- `presence_status` TEXT NOT NULL
- `serial_number` TEXT NULL
- `serial_state` TEXT NOT NULL
- `pnr_status` TEXT NOT NULL
- `communications_status` TEXT NOT NULL
- `actual_condition` TEXT NULL
- `completeness_status` TEXT NULL
- `comment_text` TEXT NULL
- `created_by` UUID FK -> `users.id`
- `device_id` UUID NULL FK -> `devices.id`
- `created_at_device` TIMESTAMPTZ NOT NULL
- `received_at_server` TIMESTAMPTZ NOT NULL
- `sync_batch_id` UUID NULL FK -> `sync_batches.id`
- `is_repeat_check` BOOLEAN NOT NULL DEFAULT FALSE
- `repeat_check_id` UUID NULL FK -> `repeat_checks.id`
- `source_event_id` UUID NULL FK -> `domain_events.id`

`check_type`:

- `initial_check`
- `repeat_check`
- `operator_correction`

## 7.3. `item_status_history`

История статуса присутствия экземпляра.

Поля:

- `id` UUID PK
- `equipment_instance_id` UUID FK -> `equipment_instances.id`
- `status_code` TEXT NOT NULL
- `comment_text` TEXT NULL
- `changed_by` UUID FK -> `users.id`
- `changed_at_device` TIMESTAMPTZ NULL
- `changed_at_server` TIMESTAMPTZ NOT NULL
- `source_check_id` UUID NULL FK -> `item_checks.id`
- `source_event_id` UUID NULL FK -> `domain_events.id`

## 7.4. `pnr_history`

История ПНР.

Поля:

- `id` UUID PK
- `equipment_instance_id` UUID FK -> `equipment_instances.id`
- `pnr_status` TEXT NOT NULL
- `comment_text` TEXT NULL
- `changed_by` UUID FK -> `users.id`
- `changed_at_device` TIMESTAMPTZ NULL
- `changed_at_server` TIMESTAMPTZ NOT NULL
- `source_check_id` UUID NULL FK -> `item_checks.id`

## 7.5. `communication_history`

История статусов коммуникаций.

Поля:

- `id` UUID PK
- `equipment_instance_id` UUID FK -> `equipment_instances.id`
- `communications_status` TEXT NOT NULL
- `comment_text` TEXT NULL
- `changed_by` UUID FK -> `users.id`
- `changed_at_device` TIMESTAMPTZ NULL
- `changed_at_server` TIMESTAMPTZ NOT NULL
- `source_check_id` UUID NULL FK -> `item_checks.id`

## 7.6. `repeat_checks`

Сущность повторной проверки.

Поля:

- `id` UUID PK
- `scope_type` TEXT NOT NULL
- `room_id` UUID NULL FK -> `rooms.id`
- `equipment_instance_id` UUID NULL FK -> `equipment_instances.id`
- `reason_text` TEXT NULL
- `status_code` TEXT NOT NULL
- `created_by` UUID FK -> `users.id`
- `assigned_to` UUID NULL FK -> `users.id`
- `created_at` TIMESTAMPTZ NOT NULL
- `closed_at` TIMESTAMPTZ NULL

`scope_type`:

- `room`
- `item`

`status_code`:

- `open`
- `in_progress`
- `completed`
- `cancelled`

## 7.7. `conflicts`

Конфликты по экземплярам и помещениям.

Поля:

- `id` UUID PK
- `conflict_type` TEXT NOT NULL
- `equipment_instance_id` UUID NULL FK -> `equipment_instances.id`
- `room_id` UUID NULL FK -> `rooms.id`
- `first_event_id` UUID FK -> `domain_events.id`
- `second_event_id` UUID FK -> `domain_events.id`
- `status_code` TEXT NOT NULL
- `detected_at` TIMESTAMPTZ NOT NULL
- `resolved_at` TIMESTAMPTZ NULL
- `resolved_by` UUID NULL FK -> `users.id`
- `resolution_note` TEXT NULL

`conflict_type`:

- `presence_mismatch`
- `serial_mismatch`
- `pnr_mismatch`
- `communications_mismatch`
- `parallel_room_activity`

---

## 8. Складская модель

## 8.1. `storage_zones`

Складские зоны.

Поля:

- `id` UUID PK
- `building_id` UUID FK -> `buildings.id`
- `code` TEXT NOT NULL
- `name` TEXT NOT NULL
- `room_id` UUID NULL FK -> `rooms.id`
- `is_active` BOOLEAN NOT NULL DEFAULT TRUE
- `opened_at` TIMESTAMPTZ NOT NULL
- `closed_at` TIMESTAMPTZ NULL
- `created_by` UUID FK -> `users.id`

Уникальность:

- UNIQUE (`building_id`, `code`)

## 8.2. `warehouse_receipts`

Документ поступления.

Поля:

- `id` UUID PK
- `receipt_no` TEXT NULL
- `building_id` UUID FK -> `buildings.id`
- `target_storage_zone_id` UUID FK -> `storage_zones.id`
- `status_code` TEXT NOT NULL
- `source_import_session_id` UUID NULL FK -> `import_sessions.id`
- `created_by` UUID FK -> `users.id`
- `created_at` TIMESTAMPTZ NOT NULL
- `confirmed_at` TIMESTAMPTZ NULL
- `comment_text` TEXT NULL

`status_code`:

- `draft`
- `awaiting_confirmation`
- `partially_confirmed`
- `confirmed`
- `cancelled`

## 8.3. `warehouse_receipt_items`

Строки поступления.

Поля:

- `id` UUID PK
- `warehouse_receipt_id` UUID FK -> `warehouse_receipts.id`
- `planned_position_id` UUID NULL FK -> `planned_positions.id`
- `equipment_name` TEXT NOT NULL
- `model_mark` TEXT NULL
- `category_id` UUID NULL FK -> `equipment_categories.id`
- `declared_quantity` INT NOT NULL
- `actual_quantity` INT NOT NULL
- `condition_status` TEXT NULL
- `completeness_status` TEXT NULL
- `comment_text` TEXT NULL
- `created_at` TIMESTAMPTZ NOT NULL

## 8.4. `warehouse_receipt_confirmations`

Подтверждения сотрудниками.

Поля:

- `id` UUID PK
- `warehouse_receipt_item_id` UUID FK -> `warehouse_receipt_items.id`
- `confirmed_by` UUID FK -> `users.id`
- `confirmed_quantity` INT NOT NULL
- `condition_status` TEXT NULL
- `completeness_status` TEXT NULL
- `comment_text` TEXT NULL
- `created_at_device` TIMESTAMPTZ NOT NULL
- `received_at_server` TIMESTAMPTZ NOT NULL
- `device_id` UUID NULL FK -> `devices.id`

## 8.5. `stock_balances`

Актуальные остатки по складам.

Поля:

- `id` UUID PK
- `storage_zone_id` UUID FK -> `storage_zones.id`
- `planned_item_id` UUID NULL FK -> `planned_items.id`
- `planned_position_id` UUID NULL FK -> `planned_positions.id`
- `quantity_on_hand` INT NOT NULL
- `updated_at` TIMESTAMPTZ NOT NULL

Примечание:

- если учет полностью поэкземплярный, остаток может определяться по `equipment_instances`;
- таблица нужна как агрегат для скорости и отчетности.

## 8.6. `stock_movements`

Любое движение со склада и между складами.

Поля:

- `id` UUID PK
- `movement_type` TEXT NOT NULL
- `equipment_instance_id` UUID NULL FK -> `equipment_instances.id`
- `planned_position_id` UUID NULL FK -> `planned_positions.id`
- `from_storage_zone_id` UUID NULL FK -> `storage_zones.id`
- `to_storage_zone_id` UUID NULL FK -> `storage_zones.id`
- `to_room_id` UUID NULL FK -> `rooms.id`
- `quantity` INT NOT NULL
- `reason_text` TEXT NULL
- `created_by` UUID FK -> `users.id`
- `created_at_device` TIMESTAMPTZ NULL
- `received_at_server` TIMESTAMPTZ NOT NULL
- `source_receipt_item_id` UUID NULL FK -> `warehouse_receipt_items.id`
- `source_event_id` UUID NULL FK -> `domain_events.id`

`movement_type`:

- `receipt_to_stock`
- `stock_to_stock`
- `stock_to_room`
- `room_to_stock`
- `stock_relocation`

---

## 9. Импорт и экспорт

## 9.0. Изменяемость исходной ведомости

Исходная Excel-таблица может изменяться в любой момент времени. Поэтому импорт должен поддерживать не только первичную загрузку, но и обновление плана по новой версии файла.

Система должна поддерживать сценарий:

1. в системе уже есть действующая версия плановой ведомости;
2. оператор загружает новую версию исходной таблицы;
3. система сравнивает старую и новую версии;
4. система формирует список изменений;
5. оператор просматривает изменения и подтверждает применение новой версии;
6. после применения новой версии система обновляет плановые сущности, не удаляя фактическую историю.

Типы изменений, которые должны определяться:

- добавлены новые помещения;
- удалены помещения;
- изменилось название помещения;
- позиция добавлена;
- позиция удалена;
- изменилось количество;
- изменилась категория;
- изменилась модель или наименование;
- позиция перенесена в другое помещение;
- позиция разделена на несколько строк;
- несколько строк объединены в одну.

Ключевая цель:

- сохранить уже собранные фактические данные и связать их с актуальной версией плана через контролируемую процедуру миграции.

## 9.1. `import_sessions`

Сессия импорта Excel.

Поля:

- `id` UUID PK
- `import_type` TEXT NOT NULL
- `file_name` TEXT NOT NULL
- `source_path` TEXT NULL
- `status_code` TEXT NOT NULL
- `started_by` UUID FK -> `users.id`
- `started_at` TIMESTAMPTZ NOT NULL
- `finished_at` TIMESTAMPTZ NULL
- `summary_json` JSONB NOT NULL DEFAULT '{}'::jsonb

`import_type`:

- `initial_plan`
- `plan_update`
- `warehouse_receipt`

## 9.2. `plan_change_sets`

Набор изменений между старой и новой версией плановой ведомости.

Поля:

- `id` UUID PK
- `building_id` UUID FK -> `buildings.id`
- `old_plan_version_id` UUID FK -> `plan_versions.id`
- `new_plan_version_id` UUID FK -> `plan_versions.id`
- `created_by` UUID FK -> `users.id`
- `created_at` TIMESTAMPTZ NOT NULL
- `status_code` TEXT NOT NULL
- `summary_json` JSONB NOT NULL DEFAULT '{}'::jsonb

`status_code`:

- `draft`
- `ready_for_review`
- `approved`
- `applied`
- `cancelled`

## 9.3. `plan_change_items`

Детальные изменения между версиями ведомости.

Поля:

- `id` UUID PK
- `plan_change_set_id` UUID FK -> `plan_change_sets.id`
- `change_type` TEXT NOT NULL
- `match_confidence` NUMERIC(5,2) NULL
- `old_planned_position_id` UUID NULL FK -> `planned_positions.id`
- `new_planned_position_id` UUID NULL FK -> `planned_positions.id`
- `old_room_id` UUID NULL FK -> `rooms.id`
- `new_room_id` UUID NULL FK -> `rooms.id`
- `old_payload` JSONB NULL
- `new_payload` JSONB NULL
- `resolution_status` TEXT NOT NULL
- `resolution_action` TEXT NULL
- `resolved_by` UUID NULL FK -> `users.id`
- `resolved_at` TIMESTAMPTZ NULL
- `comment_text` TEXT NULL

`change_type`:

- `room_added`
- `room_removed`
- `room_renamed`
- `position_added`
- `position_removed`
- `position_changed`
- `quantity_changed`
- `position_moved`
- `position_split`
- `position_merged`
- `unmatched`

`resolution_status`:

- `pending`
- `auto_matched`
- `requires_review`
- `approved`
- `applied`
- `rejected`

`resolution_action`:

- `create_new`
- `archive_old`
- `relink_items`
- `increase_instances`
- `decrease_instances`
- `move_room`
- `manual_resolution`

## 9.4. `import_rows`

Протокол ошибок и результатов импорта по строкам.

Поля:

- `id` UUID PK
- `import_session_id` UUID FK -> `import_sessions.id`
- `sheet_name` TEXT NOT NULL
- `row_number` INT NOT NULL
- `status_code` TEXT NOT NULL
- `message_text` TEXT NULL
- `raw_payload` JSONB NOT NULL

## 9.5. `export_sessions`

История экспортов.

Поля:

- `id` UUID PK
- `export_type` TEXT NOT NULL
- `file_name` TEXT NOT NULL
- `requested_by` UUID FK -> `users.id`
- `created_at` TIMESTAMPTZ NOT NULL
- `filters_json` JSONB NOT NULL DEFAULT '{}'::jsonb

---

## 10. Офлайн и синхронизация

## 10.1. `devices`

Устройства пользователей.

Поля:

- `id` UUID PK
- `user_id` UUID FK -> `users.id`
- `device_uid` TEXT UNIQUE NOT NULL
- `platform` TEXT NOT NULL
- `app_version` TEXT NULL
- `last_seen_at` TIMESTAMPTZ NULL
- `created_at` TIMESTAMPTZ NOT NULL

## 10.2. `sync_batches`

Пакеты событий, пришедших с устройства.

Поля:

- `id` UUID PK
- `device_id` UUID FK -> `devices.id`
- `user_id` UUID FK -> `users.id`
- `batch_uid` TEXT UNIQUE NOT NULL
- `sent_at_device` TIMESTAMPTZ NOT NULL
- `received_at_server` TIMESTAMPTZ NOT NULL
- `items_count` INT NOT NULL
- `status_code` TEXT NOT NULL
- `error_text` TEXT NULL

## 10.3. `domain_events`

Центральный журнал доменных событий.

Поля:

- `id` UUID PK
- `event_uid` TEXT UNIQUE NOT NULL
- `event_type` TEXT NOT NULL
- `aggregate_type` TEXT NOT NULL
- `aggregate_id` UUID NOT NULL
- `user_id` UUID NULL FK -> `users.id`
- `device_id` UUID NULL FK -> `devices.id`
- `sync_batch_id` UUID NULL FK -> `sync_batches.id`
- `occurred_at_device` TIMESTAMPTZ NULL
- `recorded_at_server` TIMESTAMPTZ NOT NULL
- `payload_json` JSONB NOT NULL
- `metadata_json` JSONB NOT NULL DEFAULT '{}'::jsonb

Примеры `event_type`:

- `item.checked`
- `item.marked_missing`
- `item.serial_changed`
- `item.pnr_changed`
- `item.communications_changed`
- `repeat_check.created`
- `receipt.created`
- `receipt.item.confirmed`
- `stock.moved`
- `conflict.detected`
- `conflict.resolved`

---

## 11. Ключевые связи

### 11.1. Плановая структура

- `building` 1 -> N `floors`
- `building` 1 -> N `departments`
- `building` 1 -> N `rooms`
- `building` 1 -> N `plan_versions`
- `plan_version` 1 -> N `planned_positions`
- `room` 1 -> N `planned_positions`
- `planned_position` 1 -> N `planned_items`

### 11.2. Фактический учет

- `planned_item` 1 -> 1 `equipment_instance`
- `equipment_instance` 1 -> N `item_checks`
- `equipment_instance` 1 -> N `item_status_history`
- `equipment_instance` 1 -> N `pnr_history`
- `equipment_instance` 1 -> N `communication_history`
- `equipment_instance` 1 -> N `conflicts`

### 11.3. Склад

- `storage_zone` 1 -> N `warehouse_receipts`
- `warehouse_receipt` 1 -> N `warehouse_receipt_items`
- `warehouse_receipt_item` 1 -> N `warehouse_receipt_confirmations`
- `storage_zone` 1 -> N `stock_balances`
- `storage_zone` 1 -> N `stock_movements`

### 11.4. Пользователи и назначения

- `user` 1 -> N `user_assignments`
- `team` 1 -> N `user_team_memberships`
- `user` 1 -> N `devices`

### 11.5. События

- `sync_batch` 1 -> N `domain_events`
- `domain_event` может ссылаться на `item_checks`, `stock_movements`, `conflicts` и другие сущности как источник.

### 11.6. Версии плана

- `plan_version` 1 -> N `plan_change_sets` как старая версия
- `plan_version` 1 -> N `plan_change_sets` как новая версия
- `plan_change_set` 1 -> N `plan_change_items`

---

## 12. Ограничения целостности

## 12.1. Обязательные ограничения

- `rooms.room_code` уникален в пределах здания.
- `plan_versions.version_no` уникален в пределах здания.
- `planned_items.ordinal_no` уникален в пределах `planned_position_id`.
- `equipment_instances.planned_item_id` уникален.
- `users.login` уникален.
- `devices.device_uid` уникален.
- `sync_batches.batch_uid` уникален.
- `domain_events.event_uid` уникален.
- `warehouse_receipts.receipt_no` может быть неуникален глобально, но при наличии внешнего номера желательно индексировать.

## 12.2. Серийные номера

Рекомендуемое правило:

- UNIQUE INDEX ON `equipment_instances(serial_number)` WHERE `serial_number IS NOT NULL`.

Дополнительно:

- при операторской правке проверяется отсутствие конфликта с уже существующим серийным номером;
- если серийный номер снят с одного экземпляра и перенесен на другой, это должно оформляться как контролируемый сценарий.

## 12.3. Складские движения

Нужно проверять:

- нельзя списать со склада больше остатка;
- нельзя переместить экземпляр сразу в два места;
- нельзя провести перемещение в неактивную складскую зону.

---

## 13. Индексы

Минимально необходимые индексы:

- `rooms(building_id, room_code)`
- `planned_positions(room_id)`
- `planned_positions(position_code)`
- `planned_items(planned_position_id, ordinal_no)`
- `equipment_instances(planned_item_id)`
- `equipment_instances(current_room_id)`
- `equipment_instances(current_storage_zone_id)`
- `equipment_instances(current_presence_status)`
- `equipment_instances(serial_number)` partial unique
- `item_checks(equipment_instance_id, received_at_server DESC)`
- `item_checks(room_id, received_at_server DESC)`
- `pnr_history(equipment_instance_id, changed_at_server DESC)`
- `communication_history(equipment_instance_id, changed_at_server DESC)`
- `warehouse_receipts(target_storage_zone_id, created_at DESC)`
- `warehouse_receipt_items(warehouse_receipt_id)`
- `stock_movements(equipment_instance_id, received_at_server DESC)`
- `stock_movements(from_storage_zone_id, received_at_server DESC)`
- `stock_movements(to_storage_zone_id, received_at_server DESC)`
- `domain_events(aggregate_type, aggregate_id, recorded_at_server DESC)`
- `domain_events(event_type, recorded_at_server DESC)`
- `user_assignments(user_id, started_at DESC)`
- `conflicts(status_code, detected_at DESC)`

---

## 14. Рекомендуемые перечисления

## 14.1. Статусы присутствия экземпляра

- `not_checked`
- `found`
- `missing`
- `in_storage`
- `moved_to_room`
- `awaiting_repeat_check`
- `conflict`

## 14.2. Статусы ПНР

- `not_required`
- `not_done`
- `done`
- `installation`

## 14.3. Статусы коммуникаций

- `missing`
- `done`
- `done_with_errors`

## 14.4. Состояние серийного номера

- `serial_entered`
- `not_provided`
- `unknown`

## 14.5. Статусы приемки

- `draft`
- `awaiting_confirmation`
- `partially_confirmed`
- `confirmed`
- `cancelled`

---

## 15. Материализованное состояние и события

Рекомендуется использовать гибридную модель:

- таблицы текущего состояния для быстрых экранов и отчетов;
- таблицы истории и `domain_events` для аудита и разборов.

То есть:

- `equipment_instances` хранит текущее состояние;
- `item_checks`, `pnr_history`, `communication_history`, `stock_movements`, `domain_events` хранят историю.

Это дает:

- быстрый UI;
- прозрачный аудит;
- удобную синхронизацию;
- возможность строить повторные экспорты и разбор конфликтов.

Дополнительно это позволяет:

- хранить одновременно несколько версий плановой ведомости;
- сравнивать старую и новую версии до применения;
- связывать фактические данные с актуальной плановой структурой без потери истории.

---

## 16. Минимальный состав таблиц для первой версии

Если запускать поэтапно, в MVP достаточно сначала реализовать:

- `users`
- `teams`
- `buildings`
- `floors`
- `departments`
- `rooms`
- `equipment_categories`
- `plan_versions`
- `planned_positions`
- `planned_items`
- `equipment_instances`
- `item_checks`
- `pnr_history`
- `communication_history`
- `devices`
- `sync_batches`
- `domain_events`
- `storage_zones`
- `warehouse_receipts`
- `warehouse_receipt_items`
- `warehouse_receipt_confirmations`
- `stock_movements`
- `conflicts`
- `repeat_checks`
- `import_sessions`
- `import_rows`
- `export_sessions`

Если обновление исходной ведомости нужно поддержать уже в первом релизе, в MVP также необходимо включить:

- `plan_change_sets`
- `plan_change_items`

---

## 17. Вопросы для следующего шага

На основе этой модели следующим этапом нужно подготовить:

1. физическую схему БД для PostgreSQL;
2. SQLAlchemy-модели или миграции;
3. диаграмму сущностей;
4. правила импорта Excel в `planned_positions` и `planned_items`;
5. правила сравнения старой и новой версии плановой ведомости;
6. правила применения дельты к уже существующим `planned_items` и `equipment_instances`;
5. API-контракты для мобильного и операторского приложений.
