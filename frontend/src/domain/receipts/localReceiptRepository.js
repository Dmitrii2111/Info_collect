import { OFFLINE_DB_STORES } from "../../services/offline/indexedDbSchema.js";
import { getRecord, listRecords, putRecord } from "../../services/offline/indexedDbAdapter.js";

const LOCAL_RECEIPT_ENTITY_TYPE = "localReceipt";
const LOCAL_RECEIPT_SOURCE = "dispatcher-dev-fixture";

function nowIso() {
  return new Date().toISOString();
}

function createReceiptStateId(receiptBatchId) {
  return `local-receipt:${receiptBatchId}`;
}

function normalizeReceiptState(record) {
  if (!record) {
    return null;
  }

  return {
    ...record,
    id: record.id ?? createReceiptStateId(record.receiptBatchId ?? record.entityId),
    receiptBatchId: record.receiptBatchId ?? record.entityId,
    status: record.status ?? "pending",
    source: LOCAL_RECEIPT_SOURCE,
    entityType: LOCAL_RECEIPT_ENTITY_TYPE,
    revision: Number(record.revision ?? 0),
  };
}

export function listLocalReceiptStates() {
  return listRecords(OFFLINE_DB_STORES.cacheMeta).then((records) => (
    (Array.isArray(records) ? records : [])
      .filter((record) => record?.entityType === LOCAL_RECEIPT_ENTITY_TYPE && record?.source === LOCAL_RECEIPT_SOURCE)
      .map(normalizeReceiptState)
      .filter(Boolean)
      .sort((left, right) => String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? "")))
  ));
}

export function getLocalReceiptState(receiptBatchId) {
  return getRecord(OFFLINE_DB_STORES.cacheMeta, createReceiptStateId(receiptBatchId)).then(normalizeReceiptState);
}

export function saveLocalReceiptState(receiptBatchId, patch = {}) {
  if (!receiptBatchId) {
    return Promise.reject(new Error("Receipt batch id is required"));
  }

  return getLocalReceiptState(receiptBatchId).then((currentState) => {
    const currentTimestamp = nowIso();
    const nextState = normalizeReceiptState({
      ...(currentState ?? {}),
      ...patch,
      id: createReceiptStateId(receiptBatchId),
      entityId: receiptBatchId,
      receiptBatchId,
      source: LOCAL_RECEIPT_SOURCE,
      entityType: LOCAL_RECEIPT_ENTITY_TYPE,
      updatedAt: currentTimestamp,
      createdAt: currentState?.createdAt ?? currentTimestamp,
      revision: Number(currentState?.revision ?? 0) + 1,
    });

    return putRecord(OFFLINE_DB_STORES.cacheMeta, nextState).then(() => nextState);
  });
}

export function applyLocalReceiptStatesToBatches(batches = [], receiptStates = []) {
  const stateByBatchId = new Map(
    (Array.isArray(receiptStates) ? receiptStates : [])
      .filter((state) => state?.receiptBatchId)
      .map((state) => [state.receiptBatchId, state]),
  );

  return batches.map((batch) => {
    const state = stateByBatchId.get(batch.id);

    if (!state) {
      return batch;
    }

    return {
      ...batch,
      localState: state,
      status: state.displayStatus ?? batch.status,
      conflictCount: ["conflict", "placed_with_discrepancy"].includes(state.status) ? Math.max(1, Number(batch.conflictCount ?? 0)) : Number(batch.conflictCount ?? 0),
      destinationWarehouseId: state.destinationWarehouseId,
      destinationWarehouseName: state.destinationWarehouseName,
      warehouse: state.destinationWarehouseName ?? batch.warehouse,
      warehouseName: state.destinationWarehouseName ?? batch.warehouseName,
      updatedAt: state.updatedAt ?? batch.updatedAt,
      confirmedAt: state.confirmedAt ?? state.placedAt ?? state.conflictedAt,
      confirmedBy: state.confirmedBy ?? state.operatorName,
    };
  });
}
