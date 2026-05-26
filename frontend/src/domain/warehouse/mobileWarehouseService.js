import { mobileWarehouseData } from "../../mobile/data/mobileMockData.js";

function getStockItemQuantity(stockItem) {
  const quantity = stockItem?.quantity;

  if (typeof quantity === "number") {
    return quantity;
  }

  if (quantity && typeof quantity === "object") {
    return Number(quantity.available ?? quantity.total ?? 0);
  }

  return Number(quantity ?? 0) || 0;
}

export function createMobileWarehouseStockItemCard(warehouse, stockItem) {
  if (!warehouse || !stockItem) {
    return null;
  }

  const quantity = getStockItemQuantity(stockItem);
  const positionCode = stockItem.positionCode ?? stockItem.designPositionCode ?? "Без ПОЗ";
  const sourceWarehouseTitle = `${warehouse.roomCode ?? ""} — ${warehouse.roomName ?? ""}`.trim();
  const receiptLabel = stockItem.receiptDisplayNumber ?? stockItem.sourceReceiptBatchId ?? "не указано";

  return {
    ...stockItem,
    id: stockItem.id,
    isRealStockItem: true,
    sourceWarehouseId: warehouse.id,
    sourceStockItemId: stockItem.id,
    sourceWarehouseRoomCode: warehouse.roomCode ?? null,
    sourceWarehouseRoomName: warehouse.roomName ?? null,
    title: stockItem.name ?? "Складская позиция",
    code: positionCode,
    status: stockItem.hasDiscrepancy ? "Принято с замечаниями" : "На складе",
    tone: stockItem.hasDiscrepancy ? "warning" : "neutral",
    location: sourceWarehouseTitle || "Локальный склад",
    plannedLocation: `Источник: поступление ${receiptLabel}`,
    quantity: {
      total: quantity,
      available: quantity,
      reserved: 0,
      disputed: stockItem.hasDiscrepancy ? quantity : 0,
      unit: stockItem.unit ?? "",
    },
    details: [
      { label: "ПОЗ", value: positionCode },
      { label: "Склад", value: sourceWarehouseTitle || "Локальный склад" },
      { label: "Поступление", value: receiptLabel },
      { label: "Статус", value: stockItem.hasDiscrepancy ? "Есть расхождение" : "Принято" },
    ],
    sync: { status: "Локально", pending: 0, conflicts: stockItem.hasDiscrepancy ? 1 : 0 },
    history: [
      {
        title: "Позиция на складе",
        meta: stockItem.updatedAt ?? stockItem.createdAt ?? "локально",
      },
    ],
  };
}

export function getMobileWarehouseItemById(itemId) {
  if (!itemId) {
    return null;
  }

  return mobileWarehouseData.items.find((item) => item.id === itemId) ?? null;
}

export function getMobileWarehouseItemByCode(itemCode) {
  if (!itemCode) {
    return null;
  }

  return mobileWarehouseData.items.find((item) => item.code === itemCode) ?? null;
}

export function createWarehouseMoveDestinationOptions({ warehouses = [], rooms = [] } = {}) {
  return {
    warehouses: warehouses
      .filter((warehouse) => warehouse?.status === "active")
      .map((warehouse) => ({
        id: warehouse.id,
        type: "warehouse",
        title: `${warehouse.roomCode} — ${warehouse.roomName}`,
        subtitle: `${warehouse.building ?? ""} • ${warehouse.floor ?? ""} этаж • ${warehouse.departmentName ?? ""}`,
      })),
    rooms: rooms.map((room) => ({
      id: room.id,
      type: "room",
      title: `${room.roomCode} — ${room.roomName}`,
      subtitle: `${room.building ?? ""} • ${room.floor ?? ""} этаж • ${room.departmentName ?? ""}`,
    })),
  };
}

export function canMoveWarehouseStockItem(warehouse, stockItemId, quantity = 1) {
  const stockItems = Array.isArray(warehouse?.stockItems) ? warehouse.stockItems : [];
  const stockItem = stockItems.find((item) => item?.id === stockItemId || item?.code === stockItemId);
  const availableQuantity = getStockItemQuantity(stockItem);

  return Boolean(stockItem && Number(quantity) > 0 && availableQuantity >= Number(quantity));
}
