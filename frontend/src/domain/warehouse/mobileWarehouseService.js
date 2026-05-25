import { mobileWarehouseData } from "../../mobile/data/mobileMockData.js";

export function getMobileWarehouseItemById(itemId) {
  if (!itemId) {
    return null;
  }

  if (mobileWarehouseData.devMoveTestItem?.id === itemId) {
    return mobileWarehouseData.devMoveTestItem;
  }

  return mobileWarehouseData.items.find((item) => item.id === itemId) ?? null;
}

export function getMobileWarehouseItemByCode(itemCode) {
  if (!itemCode) {
    return null;
  }

  if (mobileWarehouseData.devMoveTestItem?.code === itemCode) {
    return mobileWarehouseData.devMoveTestItem;
  }

  return mobileWarehouseData.items.find((item) => item.code === itemCode) ?? null;
}

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
