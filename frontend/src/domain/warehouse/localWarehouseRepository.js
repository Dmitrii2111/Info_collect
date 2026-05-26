import { OFFLINE_DB_STORES } from "../../services/offline/indexedDbSchema.js";
import { getRecord, listRecords, putRecord } from "../../services/offline/indexedDbAdapter.js";
import { OFFLINE_ENTITY_TYPES, OFFLINE_OPERATION_TYPES } from "../../services/offline/offlineOperationTypes.js";
import { createQueueOperation } from "../../services/offline/syncQueueModel.js";
import { findSyncQueueOperationByIdempotencyKey, saveSyncQueueOperation } from "../../services/offline/syncQueueRepository.js";

const LOCAL_WAREHOUSE_ENTITY_TYPE = "localWarehouse";
const LOCAL_WAREHOUSE_SOURCE = "mobileLocalWarehouse";

function nowIso() {
  return new Date().toISOString();
}

function createWarehouseId(room) {
  return `local-warehouse:${room.id ?? room.roomCode ?? room.roomNumber}:${Date.now()}`;
}

function getStockQuantity(stockItem) {
  const quantity = stockItem?.quantity;

  if (typeof quantity === "number") {
    return quantity;
  }

  if (quantity && typeof quantity === "object") {
    return Number(quantity.available ?? quantity.total ?? 0);
  }

  return Number(quantity ?? 0) || 0;
}

export function getWarehouseStockTotals(warehouse) {
  const stockItems = Array.isArray(warehouse?.stockItems) ? warehouse.stockItems : [];

  return {
    itemsCount: stockItems.length,
    quantityTotal: stockItems.reduce((sum, item) => sum + getStockQuantity(item), 0),
  };
}

function normalizeWarehouse(record) {
  if (!record) {
    return null;
  }

  return {
    ...record,
    status: record.status ?? "active",
    stockItems: Array.isArray(record.stockItems) ? record.stockItems : [],
    source: LOCAL_WAREHOUSE_SOURCE,
    entityType: LOCAL_WAREHOUSE_ENTITY_TYPE,
    revision: Number(record.revision ?? 0),
  };
}

function createWarehouseError(code, message, details = null) {
  const error = new Error(message);
  error.name = "LocalWarehouseRepositoryError";
  error.code = code;
  error.details = details;
  return error;
}

function createWarehouseQueuePayload(warehouse, timestampField) {
  const timestamp = timestampField === "closedAt" ? warehouse.closedAt : warehouse.createdAt;

  return {
    warehouseId: warehouse.id,
    roomId: warehouse.roomId,
    roomCode: warehouse.roomCode,
    roomName: warehouse.roomName,
    building: warehouse.building,
    corpus: warehouse.corpus,
    floor: warehouse.floor,
    departmentName: warehouse.departmentName,
    [timestampField]: timestamp,
    createdBy: warehouse.createdBy ?? null,
    closedBy: warehouse.closedBy ?? null,
    source: LOCAL_WAREHOUSE_SOURCE,
  };
}

function createWarehouseQueueContext(warehouse, timestampField) {
  return {
    ...createWarehouseQueuePayload(warehouse, timestampField),
    sourceScreen: "warehouse",
  };
}

function saveWarehouseQueueOperation(warehouse, type, action) {
  const idempotencyKey = `warehouse:${action}:${warehouse.id}`;
  const timestampField = action === "close" ? "closedAt" : "createdAt";

  return findSyncQueueOperationByIdempotencyKey(idempotencyKey).then((existingOperation) => {
    if (existingOperation) {
      return existingOperation;
    }

    const context = createWarehouseQueueContext(warehouse, timestampField);
    const operation = {
      ...createQueueOperation({
        id: idempotencyKey,
        type,
        entityType: OFFLINE_ENTITY_TYPES.warehouse,
        entityId: warehouse.id,
        payload: createWarehouseQueuePayload(warehouse, timestampField),
        idempotencyKey,
      }),
      context,
    };

    return saveSyncQueueOperation(operation);
  });
}

export function listLocalWarehouses() {
  return listRecords(OFFLINE_DB_STORES.cacheMeta).then((records) => (
    (Array.isArray(records) ? records : [])
      .filter((record) => record?.entityType === LOCAL_WAREHOUSE_ENTITY_TYPE && record?.source === LOCAL_WAREHOUSE_SOURCE)
      .map(normalizeWarehouse)
      .filter(Boolean)
      .sort((left, right) => String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? "")))
  ));
}

export function listActiveLocalWarehouses() {
  return listLocalWarehouses().then((warehouses) => warehouses.filter((warehouse) => warehouse.status === "active"));
}

export function getLocalWarehouse(warehouseId) {
  return getRecord(OFFLINE_DB_STORES.cacheMeta, warehouseId).then(normalizeWarehouse);
}

export function updateLocalWarehouse(warehouse) {
  if (!warehouse?.id) {
    return Promise.reject(createWarehouseError("LOCAL_WAREHOUSE_ID_REQUIRED", "Warehouse id is required"));
  }

  const currentTimestamp = nowIso();
  const normalizedWarehouse = normalizeWarehouse({
    ...warehouse,
    updatedAt: currentTimestamp,
    revision: Number(warehouse.revision ?? 0) + 1,
  });

  return putRecord(OFFLINE_DB_STORES.cacheMeta, normalizedWarehouse).then(() => normalizedWarehouse);
}

export function createLocalWarehouseFromRoom(room, options = {}) {
  if (!room?.id && !room?.roomCode && !room?.roomNumber) {
    return Promise.reject(createWarehouseError("LOCAL_WAREHOUSE_ROOM_REQUIRED", "Room is required to create warehouse"));
  }

  return listActiveLocalWarehouses().then((activeWarehouses) => {
    const roomId = room.id ?? room.roomCode ?? room.roomNumber;
    const hasActiveWarehouse = activeWarehouses.some((warehouse) => warehouse.roomId === roomId);

    if (hasActiveWarehouse) {
      throw createWarehouseError("LOCAL_WAREHOUSE_ROOM_ALREADY_ACTIVE", "Для этого помещения уже создан склад", { roomId });
    }

    const currentTimestamp = nowIso();
    const warehouse = normalizeWarehouse({
      id: createWarehouseId(room),
      entityId: roomId,
      roomId,
      roomCode: room.roomCode ?? room.roomNumber ?? room.title,
      roomName: room.roomName ?? room.title,
      building: room.building ?? room.corpus ?? null,
      corpus: room.corpus ?? room.building ?? null,
      floor: room.floor ?? null,
      departmentName: room.departmentName ?? null,
      status: "active",
      stockItems: [],
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
      createdBy: options.createdBy ?? null,
      note: options.note ?? "",
      revision: 1,
    });

    return putRecord(OFFLINE_DB_STORES.cacheMeta, warehouse)
      .then(() => saveWarehouseQueueOperation(warehouse, OFFLINE_OPERATION_TYPES.WAREHOUSE_CREATE, "create"))
      .then(() => warehouse);
  });
}

export function closeLocalWarehouse(warehouseId) {
  return getLocalWarehouse(warehouseId).then((warehouse) => {
    if (!warehouse) {
      throw createWarehouseError("LOCAL_WAREHOUSE_NOT_FOUND", "Склад не найден", { warehouseId });
    }

    const totals = getWarehouseStockTotals(warehouse);

    if (totals.quantityTotal > 0 || totals.itemsCount > 0) {
      throw createWarehouseError("LOCAL_WAREHOUSE_HAS_STOCK", "Склад можно закрыть только без остатков", { warehouseId, totals });
    }

    const closedWarehouse = {
      ...warehouse,
      status: "closed",
      closedAt: nowIso(),
      closedBy: warehouse.closedBy ?? null,
    };

    return updateLocalWarehouse(closedWarehouse)
      .then((updatedWarehouse) => saveWarehouseQueueOperation(updatedWarehouse, OFFLINE_OPERATION_TYPES.WAREHOUSE_CLOSE, "close")
        .then(() => updatedWarehouse));
  });
}

export function addReceiptItemsToWarehouse(warehouseId, receiptBatch, options = {}) {
  return getLocalWarehouse(warehouseId).then((warehouse) => {
    if (!warehouse) {
      throw createWarehouseError("LOCAL_WAREHOUSE_NOT_FOUND", "Склад не найден", { warehouseId });
    }

    const positions = Array.isArray(receiptBatch?.positions) ? receiptBatch.positions : [];
    const stockItems = Array.isArray(warehouse.stockItems) ? warehouse.stockItems : [];
    const existingLineKeys = new Set(
      stockItems
        .filter((item) => item?.sourceReceiptBatchId && item?.sourceReceiptLineId)
        .map((item) => `${item.sourceReceiptBatchId}:${item.sourceReceiptLineId}`),
    );
    const currentTimestamp = nowIso();
    const stockStatus = options.stockStatus ?? "in_stock";
    const newStockItems = positions
      .filter((position) => position?.id && !existingLineKeys.has(`${receiptBatch.id}:${position.id}`))
      .map((position) => {
        const itemHasDiscrepancy = Boolean(
          position.hasDiscrepancy ||
          position.hasQuantityMismatch ||
          (Number(position.actualQuantity ?? position.quantity ?? 0) || 0) !== (Number(position.documentQuantity ?? position.quantity ?? 0) || 0) ||
          (Array.isArray(position.discrepancyReasons) && position.discrepancyReasons.length > 0) ||
          ["accepted_with_discrepancy", "conflict"].includes(position.status),
        );

        return {
          id: `${warehouse.id}:receipt:${receiptBatch.id}:${position.id}`,
          warehouseId: warehouse.id,
          sourceReceiptBatchId: receiptBatch.id,
          sourceReceiptLineId: position.id,
          positionCode: position.positionCode ?? position.designPositionCode ?? null,
          designPositionCode: position.designPositionCode ?? position.positionCode ?? null,
          name: position.name ?? position.title ?? "Позиция поступления",
          description: position.description ?? "",
          brand: position.brand ?? position.model ?? "",
          model: position.model ?? position.brand ?? "",
          supplier: position.supplier ?? receiptBatch.supplier ?? "",
          quantity: Number(position.actualQuantity ?? position.quantity ?? 0) || 0,
          unit: position.unit ?? receiptBatch.unit ?? "шт.",
          status: itemHasDiscrepancy ? stockStatus : "in_stock",
          discrepancyStatus: itemHasDiscrepancy ? "open" : null,
          hasDiscrepancy: itemHasDiscrepancy,
          discrepancyReason: itemHasDiscrepancy ? (position.discrepancyReason ?? options.discrepancyReason ?? null) : null,
          discrepancyReasons: itemHasDiscrepancy ? (position.discrepancyReasons ?? options.discrepancyReasons ?? []) : [],
          discrepancyComment: itemHasDiscrepancy ? (position.discrepancyComment ?? options.discrepancyComment ?? "") : "",
          documentQuantity: Number(position.documentQuantity ?? position.quantity ?? 0) || 0,
          actualQuantity: Number(position.actualQuantity ?? position.quantity ?? 0) || 0,
          discrepancyQuantity: (Number(position.actualQuantity ?? position.quantity ?? 0) || 0) - (Number(position.documentQuantity ?? position.quantity ?? 0) || 0),
          identifiedBy: itemHasDiscrepancy ? (options.operatorName ?? null) : null,
          identifiedAt: itemHasDiscrepancy ? (options.identifiedAt ?? currentTimestamp) : null,
          source: "receipt",
          receiptResult: position.receiptResult ?? options.receiptResult ?? null,
          receiptDisplayNumber: receiptBatch.displayNumber ?? receiptBatch.batchNumber ?? receiptBatch.number ?? receiptBatch.id,
          receiptDocumentName: receiptBatch.document ?? null,
          destinationWarehouseId: warehouse.id,
          destinationWarehouseRoomCode: warehouse.roomCode,
          destinationWarehouseRoomName: warehouse.roomName,
          destinationWarehouseBuilding: warehouse.building ?? warehouse.corpus ?? null,
          destinationWarehouseFloor: warehouse.floor ?? null,
          destinationWarehouseDepartmentName: warehouse.departmentName ?? null,
          createdAt: currentTimestamp,
          updatedAt: currentTimestamp,
        };
      });

    if (newStockItems.length === 0) {
      return warehouse;
    }

    return updateLocalWarehouse({
      ...warehouse,
      stockItems: [...stockItems, ...newStockItems],
    });
  });
}
