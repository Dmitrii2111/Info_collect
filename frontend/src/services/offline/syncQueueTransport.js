import { OFFLINE_OPERATION_TYPES } from "./offlineOperationTypes.js";

const CONTRACT_NOT_READY_ERROR = {
  code: "OFFLINE_BACKEND_CONTRACT_NOT_READY",
  message: "Контракт отправки операции на сервер ещё не подключён",
};

const UNSUPPORTED_OPERATION_ERROR = {
  code: "OFFLINE_OPERATION_UNSUPPORTED",
  message: "Тип операции не поддерживается текущим транспортом",
};

const WAREHOUSE_MOVE_UNSUPPORTED_ERROR = {
  code: "OFFLINE_OPERATION_UNSUPPORTED",
  message: "Для перемещения складской позиции серверный маршрут ещё не подключён",
};

const PAYLOAD_INCOMPLETE_ERROR = {
  code: "OFFLINE_OPERATION_PAYLOAD_INCOMPLETE",
  message: "Недостаточно данных для отправки операции на сервер",
};

const SUPPORTED_OPERATION_TYPES = new Set([
  OFFLINE_OPERATION_TYPES.DISCREPANCY_RESOLVE,
  OFFLINE_OPERATION_TYPES.RECEIPT_BATCH_CONFIRM,
  OFFLINE_OPERATION_TYPES.WAREHOUSE_MOVE_CREATE,
  OFFLINE_OPERATION_TYPES.EQUIPMENT_CHECK_UPDATE,
]);

function createFailure(error) {
  return {
    success: false,
    conflict: false,
    error,
  };
}

function getMissingFields(operation, fields) {
  return fields.filter((field) => {
    const value = field.split(".").reduce((current, key) => current?.[key], operation);
    return value === null || value === undefined || value === "";
  });
}

function createPayloadIncompleteResult(missingFields) {
  return createFailure({
    ...PAYLOAD_INCOMPLETE_ERROR,
    details: { missingFields },
  });
}

export function validateOperationForTransport(operation) {
  if (!SUPPORTED_OPERATION_TYPES.has(operation?.type)) {
    return createFailure(UNSUPPORTED_OPERATION_ERROR);
  }

  if (operation.type === OFFLINE_OPERATION_TYPES.WAREHOUSE_MOVE_CREATE) {
    return createFailure(WAREHOUSE_MOVE_UNSUPPORTED_ERROR);
  }

  if (operation.type === OFFLINE_OPERATION_TYPES.EQUIPMENT_CHECK_UPDATE) {
    const missingFields = getMissingFields(operation, ["entityId", "payload.statusKey"]);

    if (missingFields.length > 0) {
      return createPayloadIncompleteResult(missingFields);
    }

    return createFailure({
      ...CONTRACT_NOT_READY_ERROR,
      details: {
        reason: "planned_item_id, enum mapping, worker_login, device_uid and event_uid are not finalized",
      },
    });
  }

  if (operation.type === OFFLINE_OPERATION_TYPES.RECEIPT_BATCH_CONFIRM) {
    const missingFields = getMissingFields(operation, ["entityId"]);

    if (missingFields.length > 0) {
      return createPayloadIncompleteResult(missingFields);
    }

    return createFailure({
      ...CONTRACT_NOT_READY_ERROR,
      details: {
        reason: "mobile receipt checks are item-level, while backend confirm endpoint confirms receipt as a whole",
      },
    });
  }

  if (operation.type === OFFLINE_OPERATION_TYPES.DISCREPANCY_RESOLVE) {
    const missingFields = getMissingFields(operation, ["entityId", "payload.resolution"]);

    if (missingFields.length > 0) {
      return createPayloadIncompleteResult(missingFields);
    }

    return createFailure({
      ...CONTRACT_NOT_READY_ERROR,
      details: {
        reason: "mobile discrepancy id is not guaranteed to be backend conflict_id or receipt issue id",
      },
    });
  }

  return createFailure(UNSUPPORTED_OPERATION_ERROR);
}

export function syncQueueOperation(operation, options = {}) {
  const validationResult = validateOperationForTransport(operation);

  if (validationResult.success !== true) {
    return Promise.resolve(validationResult);
  }

  if (typeof options.apiClient === "function") {
    return Promise.resolve(createFailure(CONTRACT_NOT_READY_ERROR));
  }

  return Promise.resolve(createFailure(CONTRACT_NOT_READY_ERROR));
}

export function createOfflineSyncTransport(options = {}) {
  return (operation) => syncQueueOperation(operation, options);
}
