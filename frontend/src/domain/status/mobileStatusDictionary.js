export const MOBILE_STATUS_FIELDS = [
  "status",
  "statusKey",
  "statusType",
  "state",
  "tone",
  "severity",
  "severityLabel",
  "sync.status",
  "progress",
  "progressValue",
];

export const MOBILE_VISUAL_KEYS = {
  tones: [
    "success",
    "warning",
    "error",
    "danger",
    "primary",
    "default",
    "neutral",
    "pending",
    "conflict",
  ],
  states: ["active", "complete", "empty", "error"],
  statusTypes: [
    "active",
    "completed",
    "disabled",
    "discrepancy",
    "inProgress",
    "notStarted",
    "pending",
  ],
  severities: ["critical", "conflict", "review", "pending", "resolved"],
  resultStates: [
    "success",
    "error",
    "warning",
    "idle",
    "empty",
    "confirmed",
    "rejected",
    "found",
    "notFound",
    "issue",
  ],
};

export const MOBILE_STATUS_USAGE = {
  businessLabels: {
    note:
      "Russian status/statusKey/severityLabel/sync.status/progress labels are displayed directly to users.",
    examples: [
      "В работе",
      "Завершено",
      "Не начато",
      "Ожидает отправки",
      "Ошибка",
      "С расхождениями",
      "Синхронизировано",
      "Не синхронизировано",
      "Ожидает проверки",
      "Локально",
      "Критично",
      "Конфликт",
      "Требует проверки",
      "Не отправлено",
      "Решено",
    ],
  },
  filterKeys: [
    "Новые",
    "В работе",
    "Решены",
    "Ошибки",
    "Конфликты",
    "Ожидают отправки",
    "Синхронизировано",
    "Не синхронизировано",
    "Локально",
  ],
  visualClassKeys: {
    note: "These values are used in className patterns and must keep their exact spelling.",
    patterns: ["is-${tone}", "is-${state}", "is-${statusType}", "is-${severity}"],
  },
  syncQueueStatuses: [
    "Ожидает отправки",
    "Ожидают отправки",
    "Синхронизировано",
    "Не синхронизировано",
    "Конфликт",
    "Конфликты",
    "Ошибка",
    "Ошибки",
    "Локально",
    "Ожидает проверки",
    "pending",
    "conflict",
    "error",
    "success",
  ],
  progressStates: ["progress", "progressValue", "status + progress combinations"],
};

export const MOBILE_STATUS_WARNINGS = [
  "Не переименовывать visual keys без CSS migration.",
  "Не объединять tone/statusType/state/severity: это разные visual key groups.",
  "Не объединять desktop/mobile statuses без отдельного migration plan.",
  "Не использовать dictionary как runtime mapper без отдельного review/QA package.",
  "Не менять data shape.",
  "Русские status/statusKey/severityLabel используются как labels и фильтры.",
];

export const MOBILE_STATUS_RISKY_SCREENS = [
  "MobileSyncScreen",
  "MobileWarehouseScreen",
  "MobileDiscrepanciesScreen",
  "MobileDiscrepancyDetailsScreen",
  "MobileRoomInspectionScreen",
  "MobileEquipmentDataScreen",
  "MobileDepartmentRoomsScreen",
  "MobileObjectStructureScreen",
];

export function isKnownMobileVisualKey(group, value) {
  if (!group || value == null) {
    return false;
  }

  const knownValues = MOBILE_VISUAL_KEYS[group];

  if (!Array.isArray(knownValues)) {
    return false;
  }

  return knownValues.includes(value);
}
