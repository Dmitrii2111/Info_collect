import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DESKTOP_ADMIN_SECTIONS,
  DESKTOP_PRIMARY_SECTIONS,
  DESKTOP_SECTION_META,
} from "../src/shell/desktopNavigation.js";
import { DESKTOP_SCREEN_DATA } from "../src/shell/desktopScreenData.js";

test("desktop navigation keeps the approved sidebar order", () => {
  assert.deepEqual(
    DESKTOP_PRIMARY_SECTIONS.map((section) => section.label),
    [
      "Панель управления",
      "Реестр оборудования",
      "Объекты",
      "Инспекции",
      "Склад",
      "Поступления",
      "Расхождения",
      "Синхронизация",
      "История",
      "Отчёты",
    ],
  );

  assert.deepEqual(
    DESKTOP_ADMIN_SECTIONS.map((section) => section.label),
    ["Сотрудники", "Роли и права", "Системные настройки"],
  );
});

test("desktop navigation metadata is addressable by section key", () => {
  assert.equal(DESKTOP_SECTION_META.registry.title, "Реестр оборудования");
  assert.equal(DESKTOP_SECTION_META.settings.title, "Системные настройки");
});

test("each sidebar section has a static desktop screen", () => {
  const sectionKeys = [...DESKTOP_PRIMARY_SECTIONS, ...DESKTOP_ADMIN_SECTIONS].map((section) => section.key);

  assert.deepEqual(Object.keys(DESKTOP_SCREEN_DATA).sort(), sectionKeys.sort());

  for (const key of sectionKeys) {
    assert.ok(DESKTOP_SCREEN_DATA[key].stats.length >= 4);
    assert.ok(DESKTOP_SCREEN_DATA[key].primaryRows.length >= 4);
  }
});
