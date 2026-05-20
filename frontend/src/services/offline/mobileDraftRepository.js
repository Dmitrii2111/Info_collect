import { clearStore, deleteRecord, getRecord, listRecords, putRecord } from "./indexedDbAdapter.js";
import { OFFLINE_DB_STORES } from "./indexedDbSchema.js";
import { normalizeMobileDraft } from "./mobileDraftModel.js";

function isBlankValue(value) {
  return value === null || value === undefined || value === "";
}

function hasEntityCriteria(criteria) {
  return Boolean(
    criteria &&
      typeof criteria === "object" &&
      [criteria.type, criteria.entityType, criteria.entityId, criteria.sourceScreen].some((value) => !isBlankValue(value)),
  );
}

function matchesCriteria(draft, criteria) {
  return ["type", "entityType", "entityId", "sourceScreen"].every((key) => (
    isBlankValue(criteria[key]) || draft?.[key] === criteria[key]
  ));
}

export function createMobileDraftRepositoryError(code, message, details = null) {
  const error = new Error(message);
  error.name = "MobileDraftRepositoryError";
  error.code = code;
  error.details = details;
  error.isMobileDraftRepositoryError = true;
  return error;
}

export function isMobileDraftRepositoryError(error) {
  return Boolean(error && typeof error === "object" && error.isMobileDraftRepositoryError === true);
}

export function saveMobileDraft(draft) {
  const normalizedDraft = normalizeMobileDraft(draft);

  if (isBlankValue(normalizedDraft.id)) {
    return Promise.reject(createMobileDraftRepositoryError(
      "MOBILE_DRAFT_ID_REQUIRED",
      "Mobile draft id is required",
      { draft: normalizedDraft },
    ));
  }

  return putRecord(OFFLINE_DB_STORES.drafts, normalizedDraft).then(() => normalizedDraft);
}

export function getMobileDraft(draftId) {
  if (isBlankValue(draftId)) {
    return Promise.reject(createMobileDraftRepositoryError(
      "MOBILE_DRAFT_ID_REQUIRED",
      "Mobile draft id is required",
    ));
  }

  return getRecord(OFFLINE_DB_STORES.drafts, draftId);
}

export function listMobileDrafts() {
  return listRecords(OFFLINE_DB_STORES.drafts).then((drafts) => (Array.isArray(drafts) ? drafts : []));
}

export function deleteMobileDraft(draftId) {
  if (isBlankValue(draftId)) {
    return Promise.reject(createMobileDraftRepositoryError(
      "MOBILE_DRAFT_ID_REQUIRED",
      "Mobile draft id is required",
    ));
  }

  return deleteRecord(OFFLINE_DB_STORES.drafts, draftId);
}

export function clearMobileDrafts() {
  return clearStore(OFFLINE_DB_STORES.drafts);
}

export function findMobileDraftByEntity(criteria = {}) {
  if (!hasEntityCriteria(criteria)) {
    return Promise.resolve(null);
  }

  return listMobileDrafts().then((drafts) => drafts.find((draft) => matchesCriteria(draft, criteria)) ?? null);
}
