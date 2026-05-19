import { createApiError, isApiError } from "./apiError.js";

function getFetchImpl(fetchImpl) {
  if (fetchImpl) {
    return fetchImpl;
  }

  return typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : null;
}

function buildUrl(baseUrl, path) {
  if (!baseUrl) {
    return path;
  }

  return `${baseUrl.replace(/\/$/, "")}/${String(path).replace(/^\//, "")}`;
}

function normalizeError(error) {
  if (isApiError(error)) {
    return error;
  }

  return createApiError({
    code: "API_REQUEST_FAILED",
    message: error?.message ?? "Ошибка запроса",
    details: error,
  });
}

export function createApiClient({ baseUrl = "", fetchImpl } = {}) {
  const request = async (method, path, body, options = {}) => {
    const requestFetch = getFetchImpl(fetchImpl);

    if (!requestFetch) {
      throw createApiError({
        code: "FETCH_UNAVAILABLE",
        message: "HTTP-клиент недоступен",
      });
    }

    try {
      const response = await requestFetch(buildUrl(baseUrl, path), {
        ...options,
        method,
        headers: {
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(options.headers ?? {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw createApiError({
          code: "HTTP_ERROR",
          message: data?.message ?? "Ошибка запроса",
          status: response.status,
          details: data,
        });
      }

      return {
        ok: true,
        data,
        meta: {
          status: response.status,
        },
      };
    } catch (error) {
      throw normalizeError(error);
    }
  };

  return {
    get: (path, options) => request("GET", path, undefined, options),
    post: (path, body, options) => request("POST", path, body, options),
    put: (path, body, options) => request("PUT", path, body, options),
    patch: (path, body, options) => request("PATCH", path, body, options),
    delete: (path, options) => request("DELETE", path, undefined, options),
  };
}
