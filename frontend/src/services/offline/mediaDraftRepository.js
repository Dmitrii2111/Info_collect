import { deleteRecord, listRecords, putRecord } from "./indexedDbAdapter.js";
import { OFFLINE_DB_STORES } from "./indexedDbSchema.js";

function createTimestamp() {
  return new Date().toISOString();
}

function isBlankValue(value) {
  return value === null || value === undefined || value === "";
}

export function createMediaDraftId({ entityType, entityId, sourceScreen, slot = "primary" } = {}) {
  return ["MEDIA_DRAFT", entityType, entityId, sourceScreen, slot].filter((part) => !isBlankValue(part)).join(":");
}

export function saveMediaDraft(mediaDraft) {
  const now = createTimestamp();
  const record = {
    ...mediaDraft,
    id: mediaDraft.id ?? createMediaDraftId(mediaDraft),
    updatedAt: now,
    createdAt: mediaDraft.createdAt ?? now,
  };

  return putRecord(OFFLINE_DB_STORES.mediaDrafts, record).then(() => record);
}

export function deleteMediaDraft(mediaDraftId) {
  return deleteRecord(OFFLINE_DB_STORES.mediaDrafts, mediaDraftId);
}

export function listMediaDrafts() {
  return listRecords(OFFLINE_DB_STORES.mediaDrafts).then((drafts) => (Array.isArray(drafts) ? drafts : []));
}

export function findMediaDraftByEntity({ entityType, entityId, sourceScreen, slot = "primary" } = {}) {
  if (isBlankValue(entityType) || isBlankValue(entityId)) {
    return Promise.resolve(null);
  }

  return listMediaDrafts().then((drafts) => drafts.find((draft) => (
    draft.entityType === entityType &&
    draft.entityId === entityId &&
    (isBlankValue(sourceScreen) || draft.sourceScreen === sourceScreen) &&
    (isBlankValue(slot) || draft.slot === slot)
  )) ?? null);
}
