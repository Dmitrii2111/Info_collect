import { createApiError } from "./apiError.js";

export function mockDelay(ms = 250) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

export function createMockResponse(data, meta = {}) {
  return {
    ok: true,
    data,
    meta,
  };
}

export function createMockError(message, options = {}) {
  return createApiError({
    code: options.code ?? "MOCK_API_ERROR",
    message,
    status: options.status ?? null,
    details: options.details ?? null,
  });
}
