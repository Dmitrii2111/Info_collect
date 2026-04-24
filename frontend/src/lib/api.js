export async function apiGet(path) {
  const response = await fetch(path, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${path}`);
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
    throw new Error(text || `Request failed: ${path}`);
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
  const payload = await apiGet("/api/items?limit=10000");
  return payload.items || [];
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
    throw new Error(text || "Avatar upload failed");
  }
  return response.json();
}
