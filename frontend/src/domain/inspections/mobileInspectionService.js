import { mobileInspectionsData } from "../../mobile/data/mobileMockData.js";

export function getMobileInspectionById(inspectionId) {
  if (!inspectionId) {
    return null;
  }

  return mobileInspectionsData.inspections.find((inspection) => inspection.id === inspectionId) ?? null;
}

export function getMobileInspectionRoomById(inspectionId, roomId) {
  if (!inspectionId || !roomId) {
    return null;
  }

  const inspection = getMobileInspectionById(inspectionId);

  return inspection?.walkthrough?.rooms?.find((room) => room.id === roomId) ?? null;
}

export function getMobileInspectionEquipmentById(inspectionId, roomId, equipmentId) {
  if (!inspectionId || !roomId || !equipmentId) {
    return null;
  }

  const room = getMobileInspectionRoomById(inspectionId, roomId);

  return room?.equipment?.find((item) => item.id === equipmentId) ?? null;
}
