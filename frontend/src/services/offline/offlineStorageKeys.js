export const OFFLINE_STORAGE_KEYS = {
  queue: "infocollect.offline.queue",
  drafts: "infocollect.offline.drafts",
  cacheMeta: "infocollect.offline.cacheMeta",
  lastSync: "infocollect.offline.lastSync",
  conflicts: "infocollect.offline.conflicts",
};

export const OFFLINE_CACHE_NAMES = {
  appShell: "infocollect-app-shell",
  runtimeData: "infocollect-runtime-data",
  mediaDrafts: "infocollect-media-drafts",
};

export const OFFLINE_STORAGE_WARNINGS = [
  "Не переносить session keys в IndexedDB без отдельной миграции.",
  "Не включать service worker без cache strategy и manual QA на мобильном устройстве.",
  "Не хранить большие photo blobs в localStorage.",
  "Не менять queue schema без migration plan.",
  "Не подключать queue к UI без отдельного review/QA.",
];
