import { mobileWarehouseData } from "../../mobile/data/mobileMockData.js";

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
