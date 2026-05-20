import {
  OFFLINE_CONFLICT_STATUS,
  OFFLINE_OPERATION_PRIORITIES,
  OFFLINE_OPERATION_STATUS,
  OFFLINE_RETRY_POLICY,
  createOfflineOperationDraft,
} from "./offlineOperationTypes.js";

function createTimestamp() {
  return new Date().toISOString();
}

function createFallbackIdempotencyKey() {
  return `offline-idempotency-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSafeOperation(operation) {
  return operation && typeof operation === "object" ? operation : {};
}

function withUpdatedAt(operation, updates) {
  return {
    ...normalizeQueueOperation(operation),
    ...updates,
    updatedAt: createTimestamp(),
  };
}

export function createIdempotencyKey(operation = {}) {
  const safeOperation = getSafeOperation(operation);
  const parts = [
    safeOperation.type,
    safeOperation.entityType,
    safeOperation.entityId,
    safeOperation.baseRevision,
  ].filter((part) => part !== undefined && part !== null && part !== "");

  if (parts.length > 0) {
    return parts.join(":");
  }

  if (safeOperation.id) {
    return `operation:${safeOperation.id}`;
  }

  return createFallbackIdempotencyKey();
}

export function createOperationError(error) {
  if (error == null) {
    return {
      message: null,
      code: null,
      status: null,
      details: null,
    };
  }

  if (typeof error === "string") {
    return {
      message: error,
      code: null,
      status: null,
      details: null,
    };
  }

  return {
    message: error.message ?? "Offline operation failed",
    code: error.code ?? null,
    status: error.status ?? null,
    details: error.details ?? error,
  };
}

export function normalizeQueueOperation(operation = {}) {
  const safeOperation = getSafeOperation(operation);
  const now = createTimestamp();
  const normalized = createOfflineOperationDraft({
    ...safeOperation,
    payload: safeOperation.payload ?? {},
    status: safeOperation.status ?? OFFLINE_OPERATION_STATUS.queued,
    priority: safeOperation.priority ?? OFFLINE_OPERATION_PRIORITIES.normal,
    createdAt: safeOperation.createdAt ?? now,
    updatedAt: safeOperation.updatedAt ?? now,
    attempts: safeOperation.attempts ?? 0,
    conflictStatus: safeOperation.conflictStatus ?? OFFLINE_CONFLICT_STATUS.none,
    error: safeOperation.error ?? null,
  });

  return {
    ...normalized,
    idempotencyKey: safeOperation.idempotencyKey ?? createIdempotencyKey(normalized),
  };
}

export function createQueueOperation(input = {}) {
  const safeInput = getSafeOperation(input);
  const operation = createOfflineOperationDraft(safeInput);

  return normalizeQueueOperation({
    ...operation,
    idempotencyKey: safeInput.idempotencyKey ?? createIdempotencyKey(operation),
  });
}

export function markOperationQueued(operation) {
  return withUpdatedAt(operation, {
    status: OFFLINE_OPERATION_STATUS.queued,
  });
}

export function markOperationSyncing(operation) {
  return withUpdatedAt(operation, {
    status: OFFLINE_OPERATION_STATUS.syncing,
  });
}

export function markOperationSynced(operation) {
  return withUpdatedAt(operation, {
    status: OFFLINE_OPERATION_STATUS.synced,
    error: null,
  });
}

export function markOperationFailed(operation, error) {
  return withUpdatedAt(operation, {
    status: OFFLINE_OPERATION_STATUS.failed,
    error: createOperationError(error),
  });
}

export function markOperationConflict(operation, conflict) {
  return withUpdatedAt(operation, {
    status: OFFLINE_OPERATION_STATUS.conflict,
    conflictStatus: OFFLINE_CONFLICT_STATUS.pendingReview,
    error: createOperationError(conflict),
  });
}

export function incrementOperationAttempt(operation) {
  const normalized = normalizeQueueOperation(operation);

  return {
    ...normalized,
    attempts: (normalized.attempts ?? 0) + 1,
    updatedAt: createTimestamp(),
  };
}

export function canRetryOperation(operation, retryPolicy = OFFLINE_RETRY_POLICY) {
  const normalized = normalizeQueueOperation(operation);

  if (
    normalized.status === OFFLINE_OPERATION_STATUS.synced ||
    normalized.status === OFFLINE_OPERATION_STATUS.cancelled ||
    normalized.status === OFFLINE_OPERATION_STATUS.conflict
  ) {
    return false;
  }

  return (normalized.attempts ?? 0) < (retryPolicy?.maxAttempts ?? OFFLINE_RETRY_POLICY.maxAttempts);
}
