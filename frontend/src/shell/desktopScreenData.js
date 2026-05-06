import { dashboardScreenData } from "./data/dashboardScreenData.js";
import { genericScreenData } from "./data/genericScreenData.js";
import { inspectionsScreenData } from "./data/inspectionsScreenData.js";
import { objectsScreenData } from "./data/objectsScreenData.js";
import { receiptsScreenData } from "./data/receiptsScreenData.js";
import { registryScreenData } from "./data/registryScreenData.js";
import { warehouseScreenData } from "./data/warehouseScreenData.js";

export const DESKTOP_SCREEN_DATA = {
  dashboard: dashboardScreenData,
  registry: registryScreenData,
  objects: objectsScreenData,
  inspections: inspectionsScreenData,
  warehouse: warehouseScreenData,
  receipts: receiptsScreenData,
  ...genericScreenData,
};
