function getBrowser(userAgent) {
  if (/EdgA|EdgiOS|Edg\//.test(userAgent)) return "Edge";
  if (/CriOS|Chrome|Chromium/.test(userAgent) && !/Edg/.test(userAgent)) return "Chrome";
  if (/Firefox|FxiOS/.test(userAgent)) return "Firefox";
  if (/Safari/.test(userAgent) && !/Chrome|Chromium|CriOS|Android/.test(userAgent)) return "Safari";
  return "Браузер";
}

function getDeviceType(userAgent, platform = "") {
  if (/iPad/.test(userAgent) || (platform === "MacIntel" && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1)) {
    return "iPad";
  }

  if (/iPhone/.test(userAgent)) return "iPhone";
  if (/Android/.test(userAgent)) return /Mobile/.test(userAgent) ? "Android Phone" : "Android Tablet";
  if (/Windows/.test(userAgent)) return "Windows";
  if (/Macintosh|Mac OS X/.test(userAgent)) return "Mac";
  return "Устройство";
}

function isStandalonePwa() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
}

export function getMobileDeviceLabel() {
  if (typeof navigator === "undefined") {
    return "Устройство • Браузер";
  }

  const uaData = navigator.userAgentData;
  const userAgent = navigator.userAgent ?? "";
  const device = uaData?.mobile ? "Мобильное устройство" : getDeviceType(userAgent, navigator.platform);
  const brand = uaData?.brands?.find((item) => !["Not.A/Brand", "Chromium"].includes(item.brand))?.brand;
  const browser = brand ?? getBrowser(userAgent);
  const pwaSuffix = isStandalonePwa() ? " PWA" : "";

  if (device === "iPhone" || device === "iPad") {
    return `${device} • Safari${pwaSuffix}`;
  }

  return `${device} • ${browser}${pwaSuffix}`;
}
