import test from "node:test";
import assert from "node:assert/strict";

import {
  buildExportCsv,
  buildAuthFromUser,
  formatRuPhone,
  getAssignmentUserSummary,
  getAssignmentStatusLabel,
  getDirectorySummary,
  getExportSummary,
  getGroupSummary,
  getVisibleTabsForRole,
  normalizePhone,
  validateUserForm,
} from "../src/operator/utils.js";

test("normalizePhone strips formatting", () => {
  assert.equal(normalizePhone("+7 (999) 123-45-67"), "+79991234567");
});

test("formatRuPhone formats russian phone number", () => {
  assert.equal(formatRuPhone("+79991234567"), "+7 (999) 123-45-67");
});

test("getVisibleTabsForRole respects role access", () => {
  assert.deepEqual(
    getVisibleTabsForRole("field_worker").map((item) => item.id),
    ["assignments"],
  );
  assert.deepEqual(
    getVisibleTabsForRole("operator").map((item) => item.id),
    ["control", "audit", "warehouse", "conflicts", "assignments", "groups", "export"],
  );
  assert.deepEqual(
    getVisibleTabsForRole("admin").map((item) => item.id),
    ["control", "audit", "warehouse", "conflicts", "assignments", "users", "groups", "export"],
  );
});

test("validateUserForm returns errors for invalid data", () => {
  const errors = validateUserForm(
    {
      login: "bad login",
      password: "weak",
      last_name: "A",
      first_name: "1",
      middle_name: "",
      phone: "12345",
      email: "wrong",
      role: "",
    },
    { requirePassword: true },
  );

  assert.equal(errors.login, "Только латиница и цифры.");
  assert.ok(errors.password);
  assert.ok(errors.last_name);
  assert.ok(errors.first_name);
  assert.ok(errors.middle_name);
  assert.ok(errors.phone);
  assert.ok(errors.email);
  assert.equal(errors.role, "Выберите роль.");
});

test("getAssignmentStatusLabel maps statuses to Russian labels", () => {
  assert.equal(getAssignmentStatusLabel("completed"), "Завершено");
  assert.equal(getAssignmentStatusLabel("in_progress"), "В работе");
  assert.equal(getAssignmentStatusLabel("not_started"), "Не начато");
  assert.equal(getAssignmentStatusLabel("not_assigned"), "Не назначено");
});

test("getAssignmentUserSummary splits active, inactive and available users correctly", () => {
  const summary = getAssignmentUserSummary([
    { is_active: true, assigned_rooms_count: 4, completed_rooms_count: 1 },
    { is_active: true, assigned_rooms_count: 0, completed_rooms_count: 0 },
    { is_active: true, assigned_rooms_count: 3, completed_rooms_count: 3 },
    { is_active: false, assigned_rooms_count: 10, completed_rooms_count: 5 },
  ]);

  assert.deepEqual(summary, {
    activeCount: 3,
    inactiveCount: 1,
    inProgress: 1,
    available: 2,
  });
});

test("getDirectorySummary maps work statuses into visible counters", () => {
  const summary = getDirectorySummary([
    { is_active: true, work_status: "in_progress" },
    { is_active: true, work_status: "available" },
    { is_active: true, work_status: "idle" },
    { is_active: false, work_status: "in_progress" },
  ]);

  assert.deepEqual(summary, {
    total: 3,
    inProgress: 1,
    available: 2,
    inactive: 1,
  });
});

test("buildAuthFromUser preserves fallback auth and overwrites profile fields from user", () => {
  const auth = buildAuthFromUser(
    {
      user_id: "u-1",
      login: "worker1",
      full_name: "Иванов Иван Иванович",
      last_name: "Иванов",
      first_name: "Иван",
      middle_name: "Иванович",
      role: "field_worker",
      phone: "+79990000000",
      email: "worker@example.local",
      avatar_url: "/static/uploads/u-1.png",
    },
    { token: "session-token", role: "operator" },
  );

  assert.deepEqual(auth, {
    token: "session-token",
    user_id: "u-1",
    login: "worker1",
    full_name: "Иванов Иван Иванович",
    last_name: "Иванов",
    first_name: "Иван",
    middle_name: "Иванович",
    role: "field_worker",
    phone: "+79990000000",
    email: "worker@example.local",
    avatar_url: "/static/uploads/u-1.png",
  });
});

test("getGroupSummary returns normalized counts for empty and filled groups", () => {
  assert.deepEqual(getGroupSummary(null), {
    assigned: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
  });

  assert.deepEqual(
    getGroupSummary({
      assigned_rooms_count: 7,
      completed_rooms_count: 2,
      in_progress_rooms_count: 3,
      not_started_rooms_count: 2,
    }),
    {
      assigned: 7,
      completed: 2,
      inProgress: 3,
      notStarted: 2,
    },
  );
});

test("getExportSummary aggregates visible export rows", () => {
  const summary = getExportSummary([
    { current_presence_status: "not_checked", serial_state: "unknown", serial_number: null },
    { current_presence_status: "found", serial_state: "serial_entered", serial_number: "SN-1" },
    { current_presence_status: "missing", serial_state: "serial_entered", serial_number: "SN-2" },
    { current_presence_status: "conflict", serial_state: "not_provided", serial_number: null },
  ]);

  assert.deepEqual(summary, {
    total: 4,
    checked: 3,
    problem: 2,
    withSerial: 2,
  });
});

test("buildExportCsv returns semicolon-separated csv with escaped values", () => {
  const csv = buildExportCsv([
    {
      floor_code: "3",
      department_name: "Реанимация",
      room_code: "3.01",
      room_name: "Палата; интенсивной терапии",
      position_code: "К-1",
      equipment_name: "Монитор",
      display_label: "Экземпляр 1",
      current_presence_status: "found",
      serial_number: "SN-77",
      serial_state: "serial_entered",
      pnr_status: "done",
      communications_status: "done",
      last_check_at: "2026-04-23T10:00:00.000Z",
      last_checked_by_name: "Иванов И.И.",
    },
  ]);

  assert.match(csv, /^Этаж;Отделение;Помещение;/);
  assert.match(csv, /Монитор/);
  assert.match(csv, /"3\.01 — Палата; интенсивной терапии"/);
  assert.match(csv, /Иванов И\.И\./);
});
