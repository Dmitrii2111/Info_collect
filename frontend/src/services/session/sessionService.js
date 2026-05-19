import { getJson, remove, setJson } from "../storage/localStorageAdapter.js";

export const DESKTOP_SESSION_KEY = "infocollect.desktop.session";
export const MOBILE_SESSION_KEY = "infocollect.mobile.session";

export function getDesktopSession() {
  return getJson(DESKTOP_SESSION_KEY, null);
}

export function saveDesktopSession(session) {
  setJson(DESKTOP_SESSION_KEY, session);
}

export function clearDesktopSession() {
  remove(DESKTOP_SESSION_KEY);
}

export function getMobileSession() {
  return getJson(MOBILE_SESSION_KEY, {});
}

export function saveMobileSession(session) {
  setJson(MOBILE_SESSION_KEY, session);
}

export function clearMobileSession() {
  remove(MOBILE_SESSION_KEY);
}
