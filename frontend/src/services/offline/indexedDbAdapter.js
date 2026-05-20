import {
  INFOCOLLECT_OFFLINE_DB_NAME,
  INFOCOLLECT_OFFLINE_DB_VERSION,
  OFFLINE_DB_STORE_DEFINITIONS,
  isKnownOfflineStore,
} from "./indexedDbSchema.js";

function createIndexedDbError(code, message, details = null) {
  const error = new Error(message);
  error.name = "IndexedDbAdapterError";
  error.code = code;
  error.details = details;
  return error;
}

function getIndexedDb() {
  return typeof globalThis !== "undefined" ? globalThis.indexedDB ?? null : null;
}

function getRequestError(request) {
  return request?.error ?? createIndexedDbError("INDEXED_DB_REQUEST_FAILED", "IndexedDB request failed");
}

function assertKnownStore(storeName) {
  if (!isKnownOfflineStore(storeName)) {
    throw createIndexedDbError("UNKNOWN_OFFLINE_STORE", "Unknown offline IndexedDB store", { storeName });
  }
}

function assertIndexedDbAvailable(indexedDb) {
  if (!indexedDb) {
    throw createIndexedDbError("INDEXED_DB_UNAVAILABLE", "IndexedDB is unavailable");
  }
}

function createRequestPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(getRequestError(request));
  });
}

function createStores(database, transaction) {
  Object.entries(OFFLINE_DB_STORE_DEFINITIONS).forEach(([storeName, definition]) => {
    const store = database.objectStoreNames.contains(storeName)
      ? transaction.objectStore(storeName)
      : database.createObjectStore(storeName, { keyPath: definition.keyPath });

    definition.indexes.forEach((indexName) => {
      if (!store.indexNames.contains(indexName)) {
        store.createIndex(indexName, indexName, { unique: false });
      }
    });
  });
}

export function isIndexedDbAvailable() {
  return Boolean(getIndexedDb());
}

export function openDatabase() {
  return new Promise((resolve, reject) => {
    const indexedDb = getIndexedDb();

    try {
      assertIndexedDbAvailable(indexedDb);
    } catch (error) {
      reject(error);
      return;
    }

    const request = indexedDb.open(INFOCOLLECT_OFFLINE_DB_NAME, INFOCOLLECT_OFFLINE_DB_VERSION);

    request.onupgradeneeded = () => {
      createStores(request.result, request.transaction);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(getRequestError(request));
    request.onblocked = () => reject(createIndexedDbError("INDEXED_DB_BLOCKED", "IndexedDB open request is blocked"));
  });
}

export function withStore(storeName, mode, callback) {
  return new Promise((resolve, reject) => {
    let settled = false;

    try {
      assertKnownStore(storeName);
    } catch (error) {
      reject(error);
      return;
    }

    openDatabase()
      .then((database) => {
        let transaction;
        let result;

        try {
          transaction = database.transaction(storeName, mode);
          const store = transaction.objectStore(storeName);
          result = callback(store);
        } catch (error) {
          database.close();
          reject(error);
          return;
        }

        transaction.oncomplete = () => {
          database.close();

          if (!settled) {
            settled = true;
            resolve(result);
          }
        };

        transaction.onerror = () => {
          database.close();

          if (!settled) {
            settled = true;
            reject(transaction.error ?? createIndexedDbError("INDEXED_DB_TRANSACTION_FAILED", "IndexedDB transaction failed"));
          }
        };

        transaction.onabort = () => {
          database.close();

          if (!settled) {
            settled = true;
            reject(transaction.error ?? createIndexedDbError("INDEXED_DB_TRANSACTION_ABORTED", "IndexedDB transaction aborted"));
          }
        };
      })
      .catch(reject);
  });
}

export function getRecord(storeName, key) {
  return withStore(storeName, "readonly", (store) => createRequestPromise(store.get(key)));
}

export function putRecord(storeName, record) {
  if (record == null) {
    return Promise.reject(createIndexedDbError("INVALID_OFFLINE_RECORD", "Offline record is required"));
  }

  return withStore(storeName, "readwrite", (store) => createRequestPromise(store.put(record)));
}

export function deleteRecord(storeName, key) {
  return withStore(storeName, "readwrite", (store) => createRequestPromise(store.delete(key)));
}

export function listRecords(storeName) {
  return withStore(storeName, "readonly", (store) => createRequestPromise(store.getAll()));
}

export function clearStore(storeName) {
  return withStore(storeName, "readwrite", (store) => createRequestPromise(store.clear()));
}
