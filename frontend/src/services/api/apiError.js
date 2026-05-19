export function createApiError({ code = "API_ERROR", message = "Ошибка запроса", status = null, details = null } = {}) {
  const error = new Error(message);
  error.name = "ApiError";
  error.code = code;
  error.status = status;
  error.details = details;
  error.isApiError = true;

  return error;
}

export function isApiError(error) {
  return Boolean(error && typeof error === "object" && error.isApiError === true);
}
