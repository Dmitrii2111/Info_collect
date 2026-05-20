export const INFOCOLLECT_OFFLINE_DB_NAME = "infocollect-offline";

export const INFOCOLLECT_OFFLINE_DB_VERSION = 1;

export const OFFLINE_DB_STORES = {
  offlineQueue: "offlineQueue",
  drafts: "drafts",
  cacheMeta: "cacheMeta",
  conflicts: "conflicts",
  mediaDrafts: "mediaDrafts",
};

export const OFFLINE_DB_STORE_DEFINITIONS = {
  [OFFLINE_DB_STORES.offlineQueue]: {
    keyPath: "id",
    indexes: [
      "status",
      "type",
      "entityType",
      "entityId",
      "priority",
      "updatedAt",
      "idempotencyKey",
      "conflictStatus",
    ],
  },
  [OFFLINE_DB_STORES.drafts]: {
    keyPath: "id",
    indexes: ["entityType", "entityId", "updatedAt"],
  },
  [OFFLINE_DB_STORES.cacheMeta]: {
    keyPath: "id",
    indexes: ["entityType", "entityId", "updatedAt", "source", "revision"],
  },
  [OFFLINE_DB_STORES.conflicts]: {
    keyPath: "id",
    indexes: ["operationId", "entityType", "entityId", "conflictStatus", "updatedAt"],
  },
  [OFFLINE_DB_STORES.mediaDrafts]: {
    keyPath: "id",
    indexes: ["entityType", "entityId", "operationId", "updatedAt"],
  },
};

export function isKnownOfflineStore(storeName) {
  return Boolean(storeName && OFFLINE_DB_STORE_DEFINITIONS[storeName]);
}
