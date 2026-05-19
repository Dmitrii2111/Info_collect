import { createMockResponse, mockDelay } from "./mockResponse.js";

function createPayload(method, path, body, options) {
  return {
    path,
    method,
    ...(body !== undefined ? { body } : {}),
    ...(options !== undefined ? { options } : {}),
  };
}

export function createMockApiClient({ delayMs = 250 } = {}) {
  const request = async (method, path, body, options) => {
    await mockDelay(delayMs);
    return createMockResponse(createPayload(method, path, body, options));
  };

  return {
    get: (path, options) => request("GET", path, undefined, options),
    post: (path, body, options) => request("POST", path, body, options),
    put: (path, body, options) => request("PUT", path, body, options),
    patch: (path, body, options) => request("PATCH", path, body, options),
    delete: (path, options) => request("DELETE", path, undefined, options),
  };
}
