import { dashboardScreenData } from "./data/dashboardScreenData.js";
import { registryScreenData } from "./data/registryScreenData.js";
import { objectsScreenData } from "./data/objectsScreenData.js";
import { genericScreenData } from "./data/genericScreenData.js";

export const DESKTOP_SCREEN_DATA = {
  dashboard: dashboardScreenData,
  registry: registryScreenData,
  objects: objectsScreenData,
  ...genericScreenData,
};
