export async function apiGet(path) {
  const response = await fetch(path, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(extractApiErrorMessage(text, path));
  }
  return response.json();
}

async function apiSend(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(path, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(extractApiErrorMessage(text, path));
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function loadOperatorBootstrap() {
  const [roomsSummary, itemsSummary, planVersions, users] = await Promise.allSettled([
    apiGet("/api/rooms/summary"),
    apiGet("/api/items/summary"),
    apiGet("/api/plans/versions"),
    apiGet("/api/users/field-workers"),
  ]);

  return {
    roomsSummary: roomsSummary.status === "fulfilled" ? roomsSummary.value : null,
    itemsSummary: itemsSummary.status === "fulfilled" ? itemsSummary.value : null,
    planVersions: planVersions.status === "fulfilled" ? planVersions.value : [],
    users: users.status === "fulfilled" ? users.value : [],
    errors: [roomsSummary, itemsSummary, planVersions, users]
      .filter((item) => item.status === "rejected")
      .map((item) => item.reason?.message || "Unknown error"),
  };
}

export async function loadControlData({ roomWorklist = "", itemWorklist = "unchecked" } = {}) {
  const roomQuery = roomWorklist ? `?worklist_filter=${encodeURIComponent(roomWorklist)}` : "";
  const itemQuery = `?worklist_filter=${encodeURIComponent(itemWorklist)}&limit=1000`;

  const [roomSummary, itemSummary, rooms, itemsPayload, completionActivity] = await Promise.all([
    apiGet("/api/rooms/summary"),
    apiGet("/api/items/summary"),
    apiGet(`/api/rooms/${roomQuery}`),
    apiGet(`/api/items${itemQuery}`),
    apiGet("/api/rooms/completion-activity"),
  ]);

  return {
    roomSummary,
    itemSummary,
    rooms,
    items: itemsPayload.items || [],
    completionActivity,
  };
}

export async function loadAssignmentOptions(userId) {
  return apiGet(`/api/users/field-workers/${userId}/assignments`);
}

export async function loadRoomDetail(roomId) {
  return apiGet(`/api/rooms/${roomId}`);
}

export async function loadGroups() {
  return apiGet("/api/users/groups");
}

export async function loadExportRows() {
  return apiGet("/api/items/export");
}

export async function loadWarehouseData() {
  const [overview, zones, receipts, rooms] = await Promise.all([
    apiGet("/api/stock/overview"),
    apiGet("/api/stock/zones"),
    apiGet("/api/stock/receipts"),
    apiGet("/api/rooms/"),
  ]);

  return {
    overview,
    zones,
    receipts,
    rooms: rooms || [],
  };
}

export async function loadAuditData({ actorScope = "", eventType = "", aggregateType = "", limit = 100 } = {}) {
  const params = new URLSearchParams();
  if (actorScope) params.set("actor_scope", actorScope);
  if (eventType) params.set("event_type", eventType);
  if (aggregateType) params.set("aggregate_type", aggregateType);
  if (limit) params.set("limit", String(limit));
  const query = params.toString();
  const [summary, items] = await Promise.all([
    apiGet("/api/audit/summary"),
    apiGet(`/api/audit/events${query ? `?${query}` : ""}`),
  ]);
  return { summary, items };
}

export async function createWarehouseZone(payload) {
  return apiSend("/api/stock/zones", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loadConflictsData({ statusCode = "", conflictType = "" } = {}) {
  const params = new URLSearchParams();
  if (statusCode) params.set("status_code", statusCode);
  if (conflictType) params.set("conflict_type", conflictType);
  const query = params.toString();
  const [summary, items] = await Promise.all([
    apiGet("/api/conflicts/summary"),
    apiGet(`/api/conflicts${query ? `?${query}` : ""}`),
  ]);
  return { summary, items };
}

export async function updateConflict(conflictId, payload) {
  return apiSend(`/api/conflicts/${conflictId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function previewAssignmentOverlaps(userId, payload) {
  return apiSend(`/api/users/field-workers/${userId}/assignment-overlaps`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function saveUserAssignments(userId, payload) {
  return apiSend(`/api/users/field-workers/${userId}/assignments`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function createGroupMerge(payload) {
  return apiSend("/api/users/groups/merge", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createGroup(payload) {
  return apiSend("/api/users/groups", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateGroup(teamId, payload) {
  return apiSend(`/api/users/groups/${teamId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteGroup(teamId) {
  return apiSend(`/api/users/groups/${teamId}`, {
    method: "DELETE",
  });
}

export async function createFieldUser(payload) {
  return apiSend("/api/users/field-workers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginOperator(payload) {
  return apiSend("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateFieldUser(userId, payload) {
  return apiSend(`/api/users/field-workers/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deactivateFieldUser(userId) {
  return apiSend(`/api/users/field-workers/${userId}`, {
    method: "DELETE",
  });
}

export async function restoreFieldUser(userId) {
  return apiSend(`/api/users/field-workers/${userId}/restore`, {
    method: "POST",
  });
}

export async function uploadFieldUserAvatar(userId, file) {
  const form = new FormData();
  form.append("avatar", file);
  const response = await fetch(`/api/users/field-workers/${userId}/avatar`, {
    method: "POST",
    body: form,
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(extractApiErrorMessage(text, "Avatar upload failed"));
  }
  return response.json();
}

function extractApiErrorMessage(text, fallback) {
  const raw = String(text || "").trim();
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    const detail = parsed?.detail ?? raw;
    return mapApiErrorDetail(detail, fallback);
  } catch {
    return mapApiErrorDetail(raw, fallback);
  }
}

function mapApiErrorDetail(detail, fallback) {
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => mapValidationIssue(item))
      .filter(Boolean);
    return messages[0] || fallback;
  }

  if (detail && typeof detail === "object") {
    if (typeof detail.detail !== "undefined") {
      return mapApiErrorDetail(detail.detail, fallback);
    }
    return fallback;
  }

  const normalized = String(detail || "").trim().toLowerCase();

  if (normalized.includes("invalid password") || normalized.includes("invalid credentials")) {
    return "Неверный логин или пароль.";
  }
  if (normalized.includes("user not found")) {
    return "Пользователь не найден.";
  }
  if (normalized.includes("already exists") && normalized.includes("login")) {
    return "Сотрудник с таким логином уже существует.";
  }
  if (normalized.includes("email") && normalized.includes("already exists")) {
    return "Сотрудник с таким email уже существует.";
  }
  if (normalized.includes("phone") && normalized.includes("already exists")) {
    return "Сотрудник с таким телефоном уже существует.";
  }

  return detail || fallback;
}

function mapValidationIssue(issue) {
  const field = Array.isArray(issue?.loc) ? issue.loc.at(-1) : "";
  const type = String(issue?.type || "").toLowerCase();
  const message = String(issue?.msg || "").toLowerCase();

  const fieldLabels = {
    login: "логин",
    password: "пароль",
    last_name: "фамилию",
    first_name: "имя",
    middle_name: "отчество",
    phone: "телефон",
    email: "email",
    role: "роль",
  };

  const fieldLabel = fieldLabels[field] || "поле";

  if (type.includes("missing")) {
    return `Не заполнено поле «${fieldLabel}».`;
  }

  if (field === "password") {
    if (type.includes("too_short") || message.includes("at least")) {
      return "Пароль должен содержать минимум 8 символов, верхний и нижний регистр, цифру и спецсимвол.";
    }
    if (type.includes("string_type")) {
      return "Укажите корректный пароль.";
    }
  }

  if (field === "login") {
    if (type.includes("too_short")) return "Логин слишком короткий.";
    if (type.includes("string_type")) return "Укажите корректный логин.";
  }

  if (field === "email") {
    return "Укажите корректный email.";
  }

  if (field === "phone") {
    return "Укажите телефон в формате +7XXXXXXXXXX.";
  }

  if (field === "last_name") {
    return "Укажите корректную фамилию.";
  }

  if (field === "first_name") {
    return "Укажите корректное имя.";
  }

  if (field === "middle_name") {
    return "Укажите корректное отчество.";
  }

  if (field === "role") {
    return "Выберите корректную роль.";
  }

  return issue?.msg || "";
}
