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

function getEquipmentPlannedItemId(operation) {
  return operation?.payload?.backendPlannedItemId ??
    operation?.payload?.plannedItemId ??
    operation?.context?.backendPlannedItemId ??
    operation?.context?.plannedItemId ??
    null;
}

function getEquipmentWorkerLogin(operation) {
  return operation?.payload?.workerLogin ?? operation?.context?.workerLogin ?? null;
}

function getEquipmentDeviceUid(operation) {
  return operation?.payload?.deviceUid ?? operation?.context?.deviceUid ?? null;
}

function getEquipmentPlatform(operation) {
  return operation?.payload?.platform ?? operation?.context?.platform ?? null;
}

function getEquipmentEventUid(operation) {
  return operation?.payload?.eventUid ?? operation?.context?.eventUid ?? operation?.idempotencyKey ?? operation?.id ?? null;
}

function getEquipmentBatchUid(operation) {
  const seed = operation?.context?.batchUid ??
    operation?.context?.batch_uid ??
    operation?.idempotencyKey ??
    operation?.id ??
    null;

  return seed ? `offline-batch:${seed}` : null;
}

function mapEquipmentPresenceStatus(operation) {
  const statusKey = operation?.payload?.statusKey ?? operation?.payload?.preferredStatusKey;
  const selectedReasons = Array.isArray(operation?.payload?.selectedReasons) ? operation.payload.selectedReasons : [];

  if (statusKey === "issue" || selectedReasons.length > 0) {
    return "conflict";
  }

  if (statusKey === "found") {
    return "found";
  }

  if (statusKey === "notFound" || statusKey === "missing") {
    return "missing";
  }

  return null;
}

function mapEquipmentSerialState(operation) {
  return operation?.payload?.serialNumber ? "serial_entered" : "unknown";
}

function mapEquipmentPnrStatus(operation) {
  const status = operation?.payload?.commissioningStatus;

  if (status === "Выполнены" || status === "done") {
    return "done";
  }

  if (status === "Не выполнены" || status === "not_done") {
    return "not_done";
  }

  if (status === "Не требуется" || status === "not_required") {
    return "not_required";
  }

  return null;
}

function getEquipmentCommunicationsStatus(operation) {
  return operation?.payload?.communicationsStatus ??
    operation?.payload?.communications_status ??
    operation?.context?.communicationsStatus ??
    operation?.context?.communications_status ??
    null;
}

function getEquipmentBackendReadiness(operation) {
  return {
    batch_uid: getEquipmentBatchUid(operation),
    worker_login: getEquipmentWorkerLogin(operation),
    device_uid: getEquipmentDeviceUid(operation),
    platform: getEquipmentPlatform(operation),
    event_uid: getEquipmentEventUid(operation),
    planned_item_id: getEquipmentPlannedItemId(operation),
    action_type: "item_check",
    presence_status: mapEquipmentPresenceStatus(operation),
    serial_state: mapEquipmentSerialState(operation),
    pnr_status: mapEquipmentPnrStatus(operation),
    communications_status: getEquipmentCommunicationsStatus(operation),
  };
}

function getMissingEquipmentBackendFields(operation) {
  const readiness = getEquipmentBackendReadiness(operation);

  return [
    "batch_uid",
    "worker_login",
    "device_uid",
    "platform",
    "event_uid",
    "planned_item_id",
    "presence_status",
    "serial_state",
    "pnr_status",
    "communications_status",
  ].filter((field) => {
    const value = readiness[field];
    return value === null || value === undefined || value === "";
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
    const missingFields = getMissingEquipmentBackendFields(operation);

    if (missingFields.length > 0) {
      return createPayloadIncompleteResult(missingFields);
    }

    return createFailure({
      ...CONTRACT_NOT_READY_ERROR,
      details: {
        action_type: "item_check",
        reason: "Backend /api/sync/batches sending is intentionally not connected in Package 31",
        readiness: getEquipmentBackendReadiness(operation),
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
