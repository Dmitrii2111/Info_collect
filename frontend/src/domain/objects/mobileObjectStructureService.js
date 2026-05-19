import { mobileObjectsData, mobileObjectStructuresById } from "../../mobile/data/mobileMockData.js";

export function getMobileObjectById(objectId) {
  if (!objectId) {
    return null;
  }

  return mobileObjectsData.objects.find((object) => object.id === objectId) ?? null;
}

export function getMobileObjectStructureById(objectId) {
  if (!objectId) {
    return null;
  }

  return mobileObjectStructuresById[objectId] ?? null;
}

export function getMobileDepartmentById(objectId, departmentId) {
  if (!objectId || !departmentId) {
    return null;
  }

  const structure = getMobileObjectStructureById(objectId);
  const floors = structure?.floors ?? [];

  for (const floor of floors) {
    const department = floor.departments?.find((item) => item.id === departmentId);

    if (department) {
      return department;
    }
  }

  return null;
}

export function getMobileRoomById(objectId, departmentId, roomId) {
  if (!objectId || !departmentId || !roomId) {
    return null;
  }

  const department = getMobileDepartmentById(objectId, departmentId);

  return department?.rooms?.find((room) => (room.id ?? room.title) === roomId) ?? null;
}

export function getMobileEquipmentById(objectId, departmentId, roomId, equipmentId) {
  if (!objectId || !departmentId || !roomId || !equipmentId) {
    return null;
  }

  const room = getMobileRoomById(objectId, departmentId, roomId);

  return room?.equipment?.find((item) => item.id === equipmentId) ?? null;
}
