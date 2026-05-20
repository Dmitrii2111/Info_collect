import { OFFLINE_OPERATION_TYPES } from "./offlineOperationTypes.js";

export const MOBILE_DRAFT_TYPES = {
  EQUIPMENT_DATA: "EQUIPMENT_DATA",
  ROOM_INSPECTION: "ROOM_INSPECTION",
  RECEIPT_BATCH_CONFIRM: "RECEIPT_BATCH_CONFIRM",
  WAREHOUSE_MOVE: "WAREHOUSE_MOVE",
  DISCREPANCY_RESOLUTION: "DISCREPANCY_RESOLUTION",
};

export const MOBILE_DRAFT_ENTITY_TYPES = {
  equipment: "equipment",
  room: "room",
  receiptBatch: "receiptBatch",
  warehouseItem: "warehouseItem",
  discrepancy: "discrepancy",
};

export const MOBILE_DRAFT_STATUS = {
  draft: "draft",
  readyToQueue: "readyToQueue",
  queued: "queued",
  discarded: "discarded",
};

export const MOBILE_DRAFT_WARNINGS = [
  "Не хранить photo blobs в draft model.",
  "Не сохранять UI overlay/search/filter state как draft.",
  "Не менять session/context payload через draft model.",
  "Не подключать draft model к screens без отдельного review/QA.",
  "Не превращать draft напрямую в sync queue operation без отдельного package.",
];

const DRAFT_QUEUE_OPERATION_TYPE_BY_TYPE = {
  [MOBILE_DRAFT_TYPES.EQUIPMENT_DATA]: OFFLINE_OPERATION_TYPES.EQUIPMENT_CHECK_UPDATE,
  [MOBILE_DRAFT_TYPES.ROOM_INSPECTION]: OFFLINE_OPERATION_TYPES.INSPECTION_DRAFT_SAVE,
  [MOBILE_DRAFT_TYPES.RECEIPT_BATCH_CONFIRM]: OFFLINE_OPERATION_TYPES.RECEIPT_BATCH_CONFIRM,
  [MOBILE_DRAFT_TYPES.WAREHOUSE_MOVE]: OFFLINE_OPERATION_TYPES.WAREHOUSE_MOVE_CREATE,
  [MOBILE_DRAFT_TYPES.DISCREPANCY_RESOLUTION]: OFFLINE_OPERATION_TYPES.DISCREPANCY_RESOLVE,
};

function createTimestamp() {
  return new Date().toISOString();
}

function createFallbackDraftId() {
  return `mobile-draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSafeObject(value) {
  return value && typeof value === "object" ? value : {};
}

function getDefaultQueueOperationType(type) {
  return DRAFT_QUEUE_OPERATION_TYPE_BY_TYPE[type] ?? null;
}

function withDraftStatus(draft, status) {
  return {
    ...normalizeMobileDraft(draft),
    status,
    updatedAt: createTimestamp(),
  };
}

export function createMobileDraftKey(input = {}) {
  const safeInput = getSafeObject(input);
  const parts = [
    safeInput.type,
    safeInput.entityType,
    safeInput.entityId,
    safeInput.sourceScreen,
  ].filter((part) => part !== undefined && part !== null && part !== "");

  if (parts.length > 0) {
    return parts.join(":");
  }

  return createFallbackDraftId();
}

export function createMobileDraft(input = {}) {
  const safeInput = getSafeObject(input);
  const now = createTimestamp();
  const type = safeInput.type ?? null;

  return {
    id: safeInput.id ?? createMobileDraftKey(safeInput),
    type,
    entityType: safeInput.entityType ?? null,
    entityId: safeInput.entityId ?? null,
    payload: getSafeObject(safeInput.payload),
    status: safeInput.status ?? MOBILE_DRAFT_STATUS.draft,
    createdAt: safeInput.createdAt ?? now,
    updatedAt: safeInput.updatedAt ?? now,
    sourceScreen: safeInput.sourceScreen ?? null,
    context: getSafeObject(safeInput.context),
    queueOperationType: safeInput.queueOperationType ?? getDefaultQueueOperationType(type),
    error: safeInput.error ?? null,
  };
}

export function normalizeMobileDraft(draft = {}) {
  return createMobileDraft(getSafeObject(draft));
}

export function updateMobileDraftPayload(draft, patch) {
  const normalized = normalizeMobileDraft(draft);
  const safePatch = getSafeObject(patch);

  return {
    ...normalized,
    payload: {
      ...normalized.payload,
      ...safePatch,
    },
    updatedAt: createTimestamp(),
  };
}

export function markMobileDraftReadyToQueue(draft) {
  return withDraftStatus(draft, MOBILE_DRAFT_STATUS.readyToQueue);
}

export function markMobileDraftQueued(draft) {
  return withDraftStatus(draft, MOBILE_DRAFT_STATUS.queued);
}

export function discardMobileDraft(draft) {
  return withDraftStatus(draft, MOBILE_DRAFT_STATUS.discarded);
}

export function isMobileDraftStatus(value) {
  return Object.values(MOBILE_DRAFT_STATUS).includes(value);
}

export function isMobileDraftType(value) {
  return Object.values(MOBILE_DRAFT_TYPES).includes(value);
}

export function getDraftQueueOperationType(draft) {
  const safeDraft = getSafeObject(draft);
  return safeDraft.queueOperationType ?? getDefaultQueueOperationType(safeDraft.type);
}
