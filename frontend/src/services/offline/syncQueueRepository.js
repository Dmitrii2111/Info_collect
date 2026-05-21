import { deleteRecord, getRecord, listRecords, putRecord } from "./indexedDbAdapter.js";
import { OFFLINE_DB_STORES } from "./indexedDbSchema.js";
import { normalizeQueueOperation } from "./syncQueueModel.js";

function isBlankValue(value) {
  return value === null || value === undefined || value === "";
}

export function createSyncQueueRepositoryError(code, message, details = null) {
  const error = new Error(message);
  error.name = "SyncQueueRepositoryError";
  error.code = code;
  error.details = details;
  error.isSyncQueueRepositoryError = true;
  return error;
}

export function isSyncQueueRepositoryError(error) {
  return Boolean(error && typeof error === "object" && error.isSyncQueueRepositoryError === true);
}

export function saveSyncQueueOperation(operation) {
  const normalizedOperation = {
    ...normalizeQueueOperation(operation),
    context: operation?.context ?? null,
  };

  if (isBlankValue(normalizedOperation.id)) {
    return Promise.reject(createSyncQueueRepositoryError(
      "SYNC_QUEUE_OPERATION_ID_REQUIRED",
      "Sync queue operation id is required",
      { operation: normalizedOperation },
    ));
  }

  return putRecord(OFFLINE_DB_STORES.offlineQueue, normalizedOperation).then(() => normalizedOperation);
}

export function getSyncQueueOperation(operationId) {
  if (isBlankValue(operationId)) {
    return Promise.reject(createSyncQueueRepositoryError(
      "SYNC_QUEUE_OPERATION_ID_REQUIRED",
      "Sync queue operation id is required",
    ));
  }

  return getRecord(OFFLINE_DB_STORES.offlineQueue, operationId);
}

export function listSyncQueueOperations() {
  return listRecords(OFFLINE_DB_STORES.offlineQueue).then((operations) => (
    Array.isArray(operations)
      ? operations.map((operation) => ({
        ...normalizeQueueOperation(operation),
        context: operation?.context ?? null,
      }))
      : []
  ));
}

export function findSyncQueueOperationByIdempotencyKey(idempotencyKey) {
  if (isBlankValue(idempotencyKey)) {
    return Promise.resolve(null);
  }

  return listSyncQueueOperations().then((operations) => (
    operations.find((operation) => operation.idempotencyKey === idempotencyKey) ?? null
  ));
}

export function deleteSyncQueueOperation(operationId) {
  if (isBlankValue(operationId)) {
    return Promise.reject(createSyncQueueRepositoryError(
      "SYNC_QUEUE_OPERATION_ID_REQUIRED",
      "Sync queue operation id is required",
    ));
  }

  return deleteRecord(OFFLINE_DB_STORES.offlineQueue, operationId);
}
