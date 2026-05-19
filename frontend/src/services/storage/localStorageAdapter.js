function getLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getString(key, fallback = null) {
  const storage = getLocalStorage();

  if (!storage) {
    return fallback;
  }

  try {
    const value = storage.getItem(key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

export function setString(key, value) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, String(value));
  } catch {
    // Ignore storage write failures.
  }
}

export function getJson(key, fallback = null) {
  const value = getString(key, null);

  if (value === null) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function setJson(key, value) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write failures.
  }
}

export function remove(key) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage remove failures.
  }
}
