import { OFFLINE_OPERATION_STATUS } from "./offlineOperationTypes.js";
import {
  canRetryOperation,
  incrementOperationAttempt,
  markOperationConflict,
  markOperationFailed,
  markOperationSynced,
  markOperationSyncing,
} from "./syncQueueModel.js";
import {
  getSyncQueueOperation,
  listSyncQueueOperations,
  saveSyncQueueOperation,
} from "./syncQueueRepository.js";

const DEFAULT_QUEUE_PROCESS_LIMIT = 10;

const TRANSPORT_NOT_CONFIGURED_ERROR = {
  code: "OFFLINE_TRANSPORT_NOT_CONFIGURED",
  message: "Отправка на сервер не подключена",
};

function sortOperationsByUpdatedAt(operations) {
  return [...operations].sort((first, second) => (
    new Date(first.updatedAt ?? first.createdAt ?? 0).getTime() -
    new Date(second.updatedAt ?? second.createdAt ?? 0).getTime()
  ));
}

function createSkippedResult(reason, operation = null) {
  return {
    status: "skipped",
    reason,
    operation,
  };
}

function createProcessedResult(status, operation, reason = null) {
  return {
    status,
    reason,
    operation,
  };
}

function createQueueSummary(results) {
  return {
    totalProcessed: results.filter((result) => result.status !== "skipped").length,
    synced: results.filter((result) => result.status === OFFLINE_OPERATION_STATUS.synced).length,
    failed: results.filter((result) => result.status === OFFLINE_OPERATION_STATUS.failed).length,
    conflict: results.filter((result) => result.status === OFFLINE_OPERATION_STATUS.conflict).length,
    skipped: results.filter((result) => result.status === "skipped").length,
    results,
    operations: results.map((result) => result.operation).filter(Boolean),
  };
}

function saveFailedOperation(operation, error) {
  return saveSyncQueueOperation(markOperationFailed(operation, error))
    .then((failedOperation) => createProcessedResult(OFFLINE_OPERATION_STATUS.failed, failedOperation));
}

function processOperation(operation, transport) {
  const syncingOperation = markOperationSyncing(incrementOperationAttempt(operation));

  return saveSyncQueueOperation(syncingOperation)
    .then((savedSyncingOperation) => {
      if (typeof transport !== "function") {
        return saveFailedOperation(savedSyncingOperation, TRANSPORT_NOT_CONFIGURED_ERROR);
      }

      return Promise.resolve()
        .then(() => transport(savedSyncingOperation))
        .then((transportResult = {}) => {
          if (transportResult.conflict === true) {
            return saveSyncQueueOperation(markOperationConflict(savedSyncingOperation, transportResult.error ?? transportResult))
              .then((conflictOperation) => createProcessedResult(OFFLINE_OPERATION_STATUS.conflict, conflictOperation));
          }

          if (transportResult.success === true) {
            return saveSyncQueueOperation(markOperationSynced(savedSyncingOperation))
              .then((syncedOperation) => createProcessedResult(OFFLINE_OPERATION_STATUS.synced, syncedOperation));
          }

          return saveFailedOperation(savedSyncingOperation, transportResult.error ?? transportResult);
        })
        .catch((error) => saveFailedOperation(savedSyncingOperation, error));
    })
    .catch((error) => createProcessedResult(OFFLINE_OPERATION_STATUS.failed, operation, error?.code ?? "QUEUE_PROCESSING_FAILED"));
}

export function processNextQueueOperation({ transport } = {}) {
  return listSyncQueueOperations()
    .then((operations) => {
      const nextOperation = sortOperationsByUpdatedAt(operations)
        .find((operation) => operation.status === OFFLINE_OPERATION_STATUS.queued);

      if (!nextOperation) {
        return createSkippedResult("QUEUE_EMPTY");
      }

      return processOperation(nextOperation, transport);
    })
    .catch((error) => createSkippedResult(error?.code ?? "QUEUE_READ_FAILED"));
}

export function processQueue({ transport, limit = DEFAULT_QUEUE_PROCESS_LIMIT } = {}) {
  return listSyncQueueOperations()
    .then((operations) => {
      const queuedOperations = sortOperationsByUpdatedAt(operations)
        .filter((operation) => operation.status === OFFLINE_OPERATION_STATUS.queued)
        .slice(0, limit);

      return queuedOperations.reduce(
        (chain, operation) => chain.then((results) => (
          processOperation(operation, transport).then((result) => [...results, result])
        )),
        Promise.resolve([]),
      );
    })
    .then(createQueueSummary)
    .catch((error) => createQueueSummary([createSkippedResult(error?.code ?? "QUEUE_READ_FAILED")]));
}

export function retryQueueOperation(operationId, { transport } = {}) {
  return getSyncQueueOperation(operationId)
    .then((operation) => {
      if (!operation) {
        return createSkippedResult("OPERATION_NOT_FOUND");
      }

      if (operation.status !== OFFLINE_OPERATION_STATUS.failed || !canRetryOperation(operation)) {
        return createSkippedResult("OPERATION_NOT_RETRYABLE", operation);
      }

      return processOperation(operation, transport);
    })
    .catch((error) => createSkippedResult(error?.code ?? "QUEUE_RETRY_FAILED"));
}
