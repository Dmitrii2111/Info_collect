export const OFFLINE_OPERATION_TYPES = {
  INSPECTION_DRAFT_SAVE: "INSPECTION_DRAFT_SAVE",
  EQUIPMENT_CHECK_UPDATE: "EQUIPMENT_CHECK_UPDATE",
  EQUIPMENT_PHOTO_ADD: "EQUIPMENT_PHOTO_ADD",
  WAREHOUSE_CREATE: "WAREHOUSE_CREATE",
  WAREHOUSE_CLOSE: "WAREHOUSE_CLOSE",
  WAREHOUSE_MOVE_CREATE: "WAREHOUSE_MOVE_CREATE",
  RECEIPT_BATCH_CONFIRM: "RECEIPT_BATCH_CONFIRM",
  DISCREPANCY_RESOLVE: "DISCREPANCY_RESOLVE",
  DISCREPANCY_COMMENT_ADD: "DISCREPANCY_COMMENT_ADD",
};

export const OFFLINE_ENTITY_TYPES = {
  inspection: "inspection",
  room: "room",
  equipment: "equipment",
  warehouseItem: "warehouseItem",
  warehouse: "warehouse",
  receiptBatch: "receiptBatch",
  discrepancy: "discrepancy",
  photo: "photo",
};

export const OFFLINE_OPERATION_STATUS = {
  draft: "draft",
  queued: "queued",
  syncing: "syncing",
  synced: "synced",
  failed: "failed",
  conflict: "conflict",
  cancelled: "cancelled",
};

export const OFFLINE_CONFLICT_STATUS = {
  none: "none",
  pendingReview: "pendingReview",
  resolvedLocal: "resolvedLocal",
  resolvedRemote: "resolvedRemote",
  unresolved: "unresolved",
};

export const OFFLINE_OPERATION_PRIORITIES = {
  low: "low",
  normal: "normal",
  high: "high",
  critical: "critical",
};

export const OFFLINE_RETRY_POLICY = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
};

function createOfflineOperationId() {
  return `offline-op-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createOfflineOperationDraft(input = {}) {
  const now = new Date().toISOString();
  const id = input.id ?? createOfflineOperationId();

  return {
    id,
    type: input.type ?? null,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    payload: input.payload ?? {},
    status: input.status ?? OFFLINE_OPERATION_STATUS.queued,
    priority: input.priority ?? OFFLINE_OPERATION_PRIORITIES.normal,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    attempts: input.attempts ?? 0,
    idempotencyKey: input.idempotencyKey ?? id,
    baseRevision: input.baseRevision ?? null,
    conflictStatus: input.conflictStatus ?? OFFLINE_CONFLICT_STATUS.none,
    error: input.error ?? null,
  };
}

export function isOfflineOperationStatus(value) {
  return Object.values(OFFLINE_OPERATION_STATUS).includes(value);
}

export function isOfflineOperationType(value) {
  return Object.values(OFFLINE_OPERATION_TYPES).includes(value);
}
