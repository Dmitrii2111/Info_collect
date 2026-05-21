import { OFFLINE_OPERATION_TYPES } from "./offlineOperationTypes.js";
import { MOBILE_DRAFT_STATUS, markMobileDraftQueued, normalizeMobileDraft } from "./mobileDraftModel.js";
import { saveMobileDraft } from "./mobileDraftRepository.js";
import { createQueueOperation } from "./syncQueueModel.js";
import {
  findSyncQueueOperationByIdempotencyKey,
  saveSyncQueueOperation,
} from "./syncQueueRepository.js";

const SUPPORTED_DRAFT_OPERATION_TYPES = new Set([
  OFFLINE_OPERATION_TYPES.EQUIPMENT_CHECK_UPDATE,
  OFFLINE_OPERATION_TYPES.RECEIPT_BATCH_CONFIRM,
  OFFLINE_OPERATION_TYPES.WAREHOUSE_MOVE_CREATE,
  OFFLINE_OPERATION_TYPES.DISCREPANCY_RESOLVE,
]);

function isBlankValue(value) {
  return value === null || value === undefined || value === "";
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function createDraftQueueAdapterError(code, message, details = null) {
  const error = new Error(message);
  error.name = "MobileDraftQueueAdapterError";
  error.code = code;
  error.details = details;
  error.isMobileDraftQueueAdapterError = true;
  return error;
}

function createDraftIdempotencyKey(draft) {
  return `draft:${draft.id}`;
}

function getDraftOperationContext(draft) {
  return {
    ...(isPlainObject(draft.context) ? draft.context : {}),
    draftId: draft.id,
    draftType: draft.type,
    sourceScreen: draft.sourceScreen,
    draftUpdatedAt: draft.updatedAt,
  };
}

function createSkippedResult(draft, reason) {
  return {
    status: "skipped",
    reason,
    draft,
    operation: null,
  };
}

function createQueuedResult(draft, operation, existing = false) {
  return {
    status: existing ? "existing" : "queued",
    reason: null,
    draft,
    operation,
  };
}

function createQueueOperationFromMobileDraft(draft) {
  const normalizedDraft = normalizeMobileDraft(draft);

  if (isBlankValue(normalizedDraft.id)) {
    return Promise.reject(createDraftQueueAdapterError(
      "MOBILE_DRAFT_ID_REQUIRED",
      "Mobile draft id is required",
      { draft: normalizedDraft },
    ));
  }

  if (normalizedDraft.status !== MOBILE_DRAFT_STATUS.readyToQueue) {
    return Promise.resolve(null);
  }

  if (isBlankValue(normalizedDraft.queueOperationType)) {
    return Promise.resolve(null);
  }

  if (!SUPPORTED_DRAFT_OPERATION_TYPES.has(normalizedDraft.queueOperationType)) {
    return Promise.resolve(null);
  }

  return Promise.resolve({
    ...createQueueOperation({
      type: normalizedDraft.queueOperationType,
      entityType: normalizedDraft.entityType,
      entityId: normalizedDraft.entityId,
      payload: normalizedDraft.payload,
      idempotencyKey: createDraftIdempotencyKey(normalizedDraft),
      baseRevision: normalizedDraft.updatedAt,
    }),
    context: getDraftOperationContext(normalizedDraft),
  });
}

export function enqueueMobileDraft(draft) {
  const normalizedDraft = normalizeMobileDraft(draft);

  if (isBlankValue(normalizedDraft.id)) {
    return Promise.reject(createDraftQueueAdapterError(
      "MOBILE_DRAFT_ID_REQUIRED",
      "Mobile draft id is required",
      { draft: normalizedDraft },
    ));
  }

  if (normalizedDraft.status !== MOBILE_DRAFT_STATUS.readyToQueue) {
    return Promise.resolve(createSkippedResult(normalizedDraft, "DRAFT_NOT_READY_TO_QUEUE"));
  }

  return createQueueOperationFromMobileDraft(normalizedDraft).then((operation) => {
    if (!operation) {
      return createSkippedResult(normalizedDraft, "QUEUE_OPERATION_TYPE_MISSING");
    }

    return findSyncQueueOperationByIdempotencyKey(operation.idempotencyKey).then((existingOperation) => {
      if (existingOperation) {
        return saveMobileDraft(markMobileDraftQueued(normalizedDraft)).then((queuedDraft) => (
          createQueuedResult(queuedDraft, existingOperation, true)
        ));
      }

      return saveSyncQueueOperation(operation).then((savedOperation) => (
        saveMobileDraft(markMobileDraftQueued(normalizedDraft)).then((queuedDraft) => (
          createQueuedResult(queuedDraft, savedOperation)
        ))
      ));
    });
  });
}
