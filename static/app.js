const DB_NAME = "infocollect-field-db";
const DB_VERSION = 2;
const STORE_META = "meta";
const STORE_ROOMS = "rooms";
const STORE_ITEMS = "items";
const STORE_QUEUE = "queue";
const SHARED_REFRESH_MS = 30000;

const state = {
  session: null,
  bootstrap: null,
  rooms: [],
  items: [],
  queue: [],
  selectedRoomId: null,
  selectedItemId: null,
  lookups: {
    presence_statuses: [],
    serial_states: [],
    pnr_statuses: [],
    communications_statuses: [],
  },
  sharedRefreshHandle: null,
};

const ui = {
  workerLogin: document.getElementById("workerLogin"),
  workerPassword: document.getElementById("workerPassword"),
  platformSelect: document.getElementById("platformSelect"),
  appVersion: document.getElementById("appVersion"),
  deviceUid: document.getElementById("deviceUid"),
  setupStatus: document.getElementById("setupStatus"),
  loginButton: document.getElementById("loginButton"),
  bootstrapButton: document.getElementById("bootstrapButton"),
  syncButton: document.getElementById("syncButton"),
  resetButton: document.getElementById("resetButton"),
  networkDot: document.getElementById("networkDot"),
  networkLabel: document.getElementById("networkLabel"),
  planVersionLabel: document.getElementById("planVersionLabel"),
  queueCountLabel: document.getElementById("queueCountLabel"),
  lastSyncLabel: document.getElementById("lastSyncLabel"),
  profileFullNameLabel: document.getElementById("profileFullNameLabel"),
  profileLoginLabel: document.getElementById("profileLoginLabel"),
  assignmentModeLabel: document.getElementById("assignmentModeLabel"),
  assignedRoomsCountLabel: document.getElementById("assignedRoomsCountLabel"),
  completedRoomsCountLabel: document.getElementById("completedRoomsCountLabel"),
  queuedActionsCountLabel: document.getElementById("queuedActionsCountLabel"),
  queueMetaLabel: document.getElementById("queueMetaLabel"),
  queueCheckCountLabel: document.getElementById("queueCheckCountLabel"),
  queueRoomCountLabel: document.getElementById("queueRoomCountLabel"),
  queueCommentCountLabel: document.getElementById("queueCommentCountLabel"),
  queueList: document.getElementById("queueList"),
  roomListMetaLabel: document.getElementById("roomListMetaLabel"),
  floorFilterSelect: document.getElementById("floorFilterSelect"),
  departmentFilterSelect: document.getElementById("departmentFilterSelect"),
  roomFilterSelect: document.getElementById("roomFilterSelect"),
  roomsList: document.getElementById("roomsList"),
  roomDetailEmpty: document.getElementById("roomDetailEmpty"),
  roomDetail: document.getElementById("roomDetail"),
  roomDetailMeta: document.getElementById("roomDetailMeta"),
  roomDetailTitle: document.getElementById("roomDetailTitle"),
  roomDetailItemsCountLabel: document.getElementById("roomDetailItemsCountLabel"),
  roomDetailCheckedCountLabel: document.getElementById("roomDetailCheckedCountLabel"),
  roomDetailLastActionLabel: document.getElementById("roomDetailLastActionLabel"),
  roomItemsList: document.getElementById("roomItemsList"),
  itemSearchInput: document.getElementById("itemSearchInput"),
  itemFilterSelect: document.getElementById("itemFilterSelect"),
  completeRoomButton: document.getElementById("completeRoomButton"),
  itemDialog: document.getElementById("itemDialog"),
  closeDialogButton: document.getElementById("closeDialogButton"),
  itemDialogMeta: document.getElementById("itemDialogMeta"),
  itemDialogTitle: document.getElementById("itemDialogTitle"),
  itemCurrentPresenceLabel: document.getElementById("itemCurrentPresenceLabel"),
  itemCurrentSerialLabel: document.getElementById("itemCurrentSerialLabel"),
  itemCurrentLastCheckLabel: document.getElementById("itemCurrentLastCheckLabel"),
  itemCurrentRepeatLabel: document.getElementById("itemCurrentRepeatLabel"),
  itemForm: document.getElementById("itemForm"),
  itemFormStatus: document.getElementById("itemFormStatus"),
  presenceStatusInput: document.getElementById("presenceStatusInput"),
  serialStateInput: document.getElementById("serialStateInput"),
  serialNumberInput: document.getElementById("serialNumberInput"),
  serialNumberHint: document.getElementById("serialNumberHint"),
  pnrStatusInput: document.getElementById("pnrStatusInput"),
  communicationsStatusInput: document.getElementById("communicationsStatusInput"),
  actualConditionInput: document.getElementById("actualConditionInput"),
  completenessStatusInput: document.getElementById("completenessStatusInput"),
  commentTextInput: document.getElementById("commentTextInput"),
};

function generateUuid() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ru-RU");
  } catch {
    return String(value);
  }
}

function lookupLabel(groupName, code) {
  return state.lookups[groupName]?.find((item) => item.code === code)?.label ?? code ?? "—";
}

function getQueueActionLabel(actionType) {
  if (actionType === "item_check") return "Отметка экземпляра";
  if (actionType === "room_complete") return "Завершение помещения";
  return actionType || "Событие";
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META);
      if (!db.objectStoreNames.contains(STORE_ROOMS)) db.createObjectStore(STORE_ROOMS, { keyPath: "room_id" });
      if (!db.objectStoreNames.contains(STORE_ITEMS)) db.createObjectStore(STORE_ITEMS, { keyPath: "planned_item_id" });
      if (!db.objectStoreNames.contains(STORE_QUEUE)) db.createObjectStore(STORE_QUEUE, { keyPath: "client_item_id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(storeName, mode, executor) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = executor(store, tx);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveMeta(key, value) {
  await withStore(STORE_META, "readwrite", (store) => store.put(value, key));
}

async function getMeta(key) {
  return withStore(STORE_META, "readonly", (store) => requestToPromise(store.get(key)));
}

async function replaceStore(storeName, records) {
  await withStore(storeName, "readwrite", (store) => {
    store.clear();
    for (const record of records) store.put(record);
  });
}

async function getAll(storeName) {
  return withStore(STORE_META === storeName ? STORE_META : storeName, "readonly", (store) => requestToPromise(store.getAll()));
}

async function addQueueItem(record) {
  await withStore(STORE_QUEUE, "readwrite", (store) => store.put(record));
}

async function removeQueueItems(clientItemIds) {
  await withStore(STORE_QUEUE, "readwrite", (store) => {
    for (const id of clientItemIds) store.delete(id);
  });
}

async function clearLocalData() {
  for (const storeName of [STORE_META, STORE_ROOMS, STORE_ITEMS, STORE_QUEUE]) {
    await withStore(storeName, "readwrite", (store) => store.clear());
  }
}

function updateNetworkUi() {
  ui.networkDot.classList.remove("online", "offline");
  if (navigator.onLine) {
    ui.networkDot.classList.add("online");
    ui.networkLabel.textContent = "Сеть доступна";
  } else {
    ui.networkDot.classList.add("offline");
    ui.networkLabel.textContent = "Оффлайн";
  }
}

function buildSessionPayload() {
  return {
    login: ui.workerLogin.value.trim(),
    password: ui.workerPassword.value,
    device_uid: ui.deviceUid.value,
    platform: ui.platformSelect.value,
    app_version: ui.appVersion.value.trim() || null,
  };
}

function buildBootstrapQuery() {
  if (!state.session) return null;
  const params = new URLSearchParams({
    worker_login: state.session.login,
    device_uid: state.session.device_uid,
    platform: state.session.platform,
  });
  if (state.session.full_name) params.set("worker_full_name", state.session.full_name);
  if (state.session.app_version) params.set("app_version", state.session.app_version);
  return params.toString();
}

async function loginWorker() {
  const payload = buildSessionPayload();
  if (!payload.login || !payload.password) {
    ui.setupStatus.textContent = "Введите логин и пароль.";
    return;
  }

  ui.setupStatus.textContent = "Проверка учетных данных…";
  const response = await fetch("/api/field/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    ui.setupStatus.textContent = "Неверный логин или пароль.";
    return;
  }

  const profile = await response.json();
  state.session = {
    user_id: profile.user_id,
    login: profile.login,
    full_name: profile.full_name,
    role: profile.role,
    device_id: profile.device_id,
    device_uid: profile.device_uid,
    platform: profile.platform,
    app_version: profile.app_version,
    last_seen_at: profile.last_seen_at,
  };
  await saveMeta("session", state.session);
  ui.workerLogin.value = state.session.login;
  ui.workerPassword.value = "";
  ui.setupStatus.textContent = "Вход выполнен. Загружаю назначения…";
  await bootstrapData();
}

async function bootstrapData() {
  if (!state.session) {
    ui.setupStatus.textContent = "Сначала войдите в систему.";
    return;
  }

  const response = await fetch(`/api/field/bootstrap?${buildBootstrapQuery()}`);
  if (!response.ok) {
    ui.setupStatus.textContent = "Не удалось загрузить назначения.";
    return;
  }

  const payload = await response.json();
  const currentRoomId = state.selectedRoomId;
  state.bootstrap = payload;
  state.rooms = payload.rooms || [];
  state.items = payload.items || [];
  state.lookups = payload.lookups || state.lookups;
  state.selectedRoomId = state.rooms.some((room) => room.room_id === currentRoomId)
    ? currentRoomId
    : state.rooms[0]?.room_id || null;
  applyQueuedActionsOverlay();

  await saveMeta("bootstrap", payload);
  await replaceStore(STORE_ROOMS, state.rooms);
  await replaceStore(STORE_ITEMS, state.items);

  populateRoomFilters();
  renderAll();
  ui.setupStatus.textContent = "Назначения и данные загружены.";
}

function applyQueuedActionsOverlay() {
  for (const entry of state.queue) {
    if (entry.action_type === "item_check") {
      patchLocalItem(entry.planned_item_id, {
        current_presence_status: entry.presence_status,
        serial_state: entry.serial_state,
        serial_number: entry.serial_number,
        pnr_status: entry.pnr_status,
        communications_status: entry.communications_status,
        actual_condition: entry.actual_condition,
        completeness_status: entry.completeness_status,
        last_check_at: entry.created_at_device,
      });
    }
  }
}

function getFilteredRooms() {
  const floor = ui.floorFilterSelect.value;
  const department = ui.departmentFilterSelect.value;
  const roomId = ui.roomFilterSelect.value;
  return state.rooms.filter((room) => {
    if (floor && room.floor_code !== floor) return false;
    if (department && room.department_name !== department) return false;
    if (roomId && room.room_id !== roomId) return false;
    return true;
  });
}

function populateRoomFilters() {
  const floors = [...new Set(state.rooms.map((room) => room.floor_code).filter(Boolean))].sort();
  const departments = [...new Set(
    state.rooms
      .filter((room) => !ui.floorFilterSelect.value || room.floor_code === ui.floorFilterSelect.value)
      .map((room) => room.department_name)
      .filter(Boolean),
  )].sort();
  const rooms = getFilteredRooms();

  ui.floorFilterSelect.innerHTML = ['<option value="">Все этажи</option>', ...floors.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)].join("");
  if (ui.floorFilterSelect.dataset.selected) ui.floorFilterSelect.value = ui.floorFilterSelect.dataset.selected;

  ui.departmentFilterSelect.innerHTML = ['<option value="">Все отделения</option>', ...departments.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)].join("");
  if (ui.departmentFilterSelect.dataset.selected) ui.departmentFilterSelect.value = ui.departmentFilterSelect.dataset.selected;

  ui.roomFilterSelect.innerHTML = ['<option value="">Все помещения</option>', ...rooms.map((room) => `<option value="${escapeHtml(room.room_id)}">${escapeHtml(room.room_code)} — ${escapeHtml(room.room_name)}</option>`)].join("");
  if (ui.roomFilterSelect.dataset.selected) ui.roomFilterSelect.value = ui.roomFilterSelect.dataset.selected;
}

function renderSummary() {
  ui.planVersionLabel.textContent = state.bootstrap?.plan_version_id || "—";
  ui.queueCountLabel.textContent = String(state.queue.length);
  ui.profileFullNameLabel.textContent = state.session?.full_name || "—";
  ui.profileLoginLabel.textContent = state.session?.login || "—";
  ui.assignmentModeLabel.textContent = state.bootstrap?.assignment_mode === "assigned_rooms" ? "Назначения оператора" : "Назначения не загружены";
  ui.assignedRoomsCountLabel.textContent = String(state.bootstrap?.assigned_rooms_count || 0);
  ui.completedRoomsCountLabel.textContent = String(state.bootstrap?.completed_rooms_count || 0);
  ui.itemsCountLabel.textContent = String(state.items.length || 0);
  ui.queuedActionsCountLabel.textContent = String(state.queue.length);
  ui.queueMetaLabel.textContent = `${state.queue.length} событий`;
  ui.queueCheckCountLabel.textContent = String(state.queue.filter((item) => item.action_type === "item_check").length);
  ui.queueRoomCountLabel.textContent = String(state.queue.filter((item) => item.action_type === "room_complete").length);
  ui.queueCommentCountLabel.textContent = String(state.queue.filter((item) => item.comment_text).length);
  ui.lastSyncLabel.textContent = state.bootstrap?.synced_at ? `Последняя загрузка: ${formatDateTime(state.bootstrap.synced_at)}` : "Синхронизации еще не было";
}

function renderQueue() {
  if (!state.queue.length) {
    ui.queueList.className = "queue-list empty-state";
    ui.queueList.textContent = "Очередь пуста.";
    return;
  }
  ui.queueList.className = "queue-list";
  ui.queueList.innerHTML = state.queue
    .slice()
    .sort((a, b) => new Date(b.created_at_device) - new Date(a.created_at_device))
    .map((item) => `
      <article class="queue-event">
        <div class="queue-meta">
          <strong>${escapeHtml(getQueueActionLabel(item.action_type))}</strong>
          <span>${formatDateTime(item.created_at_device)}</span>
        </div>
        <p>${escapeHtml(item.comment_text || "Без комментария")}</p>
      </article>
    `)
    .join("");
}

function getRoomProgressMetrics(roomId) {
  const roomItems = state.items.filter((item) => item.room_id === roomId);
  const total = roomItems.length;
  const checkedCount = roomItems.filter((item) => item.current_presence_status !== "not_checked").length;
  const hasQueuedCompletion = state.queue.some((item) => item.action_type === "room_complete" && item.room_id === roomId);
  const progress = hasQueuedCompletion || (checkedCount && checkedCount === roomItems.length)
    ? "completed"
    : checkedCount > 0
      ? "partial"
      : "not-started";

  return {
    total,
    checkedCount,
    progress,
    hasQueuedCompletion,
  };
}

function getRoomProgressLabel(progress) {
  if (progress === "completed") return "Завершено";
  if (progress === "partial") return "В работе";
  return "Не начато";
}

function renderRooms() {
  const rooms = getFilteredRooms();
  ui.roomListMetaLabel.textContent = rooms.length
    ? `Показано помещений: ${rooms.length}`
    : state.rooms.length
      ? "По выбранным фильтрам помещения не найдены"
      : "Нет загруженных назначений";
  if (!rooms.length) {
    ui.roomsList.className = "rooms-list empty-state";
    ui.roomsList.textContent = state.rooms.length ? "По выбранным фильтрам помещений нет." : "Назначенные помещения пока не загружены.";
    return;
  }

  if (!rooms.some((room) => room.room_id === state.selectedRoomId)) {
    state.selectedRoomId = rooms[0].room_id;
  }

  ui.roomsList.className = "rooms-list";
  ui.roomsList.innerHTML = rooms
    .map((room) => {
      const activeClass = state.selectedRoomId === room.room_id ? "active" : "";
      const metrics = getRoomProgressMetrics(room.room_id);
      const progressClass = metrics.progress;
      const repeatBadge = room.repeat_check_required ? '<span class="badge repeat">Повторная проверка</span>' : "";
      const progressBadgeClass = progressClass === "completed" ? "success" : progressClass === "partial" ? "warn" : "danger";
      return `
        <article class="room-card room-progress ${progressClass} ${activeClass}" data-room-id="${escapeHtml(room.room_id)}">
          <div class="room-title-row">
            <div>
              <strong>${escapeHtml(room.room_code)}</strong>
              <p>${escapeHtml(room.room_name)}</p>
            </div>
            <span class="badge">${room.planned_items_count}</span>
          </div>
          <div class="room-meta">
            <span>${escapeHtml(room.floor_code || "—")}</span>
            <span>${escapeHtml(room.department_name || "—")}</span>
          </div>
          <div class="room-progress-row">
            <span class="badge ${progressBadgeClass}">${getRoomProgressLabel(progressClass)}</span>
            <span class="room-progress-count">${metrics.checkedCount} / ${metrics.total || room.planned_items_count || 0}</span>
          </div>
          <div class="badge-row">${repeatBadge}</div>
        </article>
      `;
    })
    .join("");

  ui.roomsList.querySelectorAll("[data-room-id]").forEach((node) => {
    node.addEventListener("click", () => {
      state.selectedRoomId = node.dataset.roomId;
      ui.roomFilterSelect.dataset.selected = state.selectedRoomId;
      renderRooms();
      renderRoomDetail();
    });
  });
}

function getSelectedRoomItems() {
  const room = state.rooms.find((item) => item.room_id === state.selectedRoomId);
  if (!room) return [];
  const search = ui.itemSearchInput.value.trim().toLowerCase();
  const filter = ui.itemFilterSelect.value;
  return state.items.filter((item) => {
    if (item.room_code !== room.room_code) return false;
    if (filter === "unchecked" && item.current_presence_status !== "not_checked") return false;
    if (filter === "missing" && item.current_presence_status !== "missing") return false;
    if (filter === "no_serial" && item.serial_state === "serial_entered" && item.serial_number) return false;
    if (!search) return true;
    return `${item.position_code} ${item.equipment_name} ${item.display_label}`.toLowerCase().includes(search);
  });
}

function renderRoomDetail() {
  const room = state.rooms.find((item) => item.room_id === state.selectedRoomId);
  if (!room) {
    ui.roomDetail.classList.add("hidden");
    ui.roomDetailEmpty.classList.remove("hidden");
    return;
  }

  const items = getSelectedRoomItems();
  const allRoomItems = state.items.filter((item) => item.room_id === room.room_id);
  const checkedItems = allRoomItems.filter((item) => item.current_presence_status !== "not_checked");
  const latestCheckedItem = checkedItems
    .slice()
    .sort((left, right) => new Date(right.last_check_at || 0) - new Date(left.last_check_at || 0))[0];
  const completionQueued = state.queue.some((entry) => entry.action_type === "room_complete" && entry.room_id === room.room_id);
  ui.roomDetail.classList.remove("hidden");
  ui.roomDetailEmpty.classList.add("hidden");
  ui.roomDetailMeta.textContent = `${room.floor_code || "—"} • ${room.department_name || "—"}`;
  ui.roomDetailTitle.textContent = `${room.room_code} — ${room.room_name}`;
  ui.roomDetailItemsCountLabel.textContent = String(allRoomItems.length);
  ui.roomDetailCheckedCountLabel.textContent = String(checkedItems.length);
  ui.roomDetailLastActionLabel.textContent = latestCheckedItem
    ? `${latestCheckedItem.last_checked_by_name || "Неизвестно"} • ${formatDateTime(latestCheckedItem.last_check_at)}`
    : "Отметок пока нет";
  ui.completeRoomButton.disabled = completionQueued;
  ui.completeRoomButton.textContent = completionQueued ? "Уже в очереди на завершение" : "Завершить помещение";
  ui.roomItemsList.innerHTML = items.length
    ? items.map((item) => `
      <article class="item-card">
        <div class="item-title-row">
          <div>
            <strong>${escapeHtml(item.position_code)} • ${escapeHtml(item.display_label)}</strong>
            <p>${escapeHtml(item.equipment_name)}</p>
          </div>
          <span class="badge">${escapeHtml(lookupLabel("presence_statuses", item.current_presence_status))}</span>
        </div>
        <div class="item-meta">
          <span>Серийный: ${escapeHtml(item.serial_number || lookupLabel("serial_states", item.serial_state))}</span>
          <span>ПНР: ${escapeHtml(lookupLabel("pnr_statuses", item.pnr_status))}</span>
        </div>
        <div class="badge-row">
          <span class="badge">${escapeHtml(lookupLabel("communications_statuses", item.communications_status))}</span>
        </div>
        <p class="item-last-check">${item.last_checked_by_name ? `Последняя отметка: ${escapeHtml(item.last_checked_by_name)} • ${formatDateTime(item.last_check_at)}` : "Отметок пока нет"}</p>
        <button type="button" data-item-id="${escapeHtml(item.planned_item_id)}">Внести данные</button>
      </article>
    `).join("")
    : '<div class="empty-state">В этом помещении нет экземпляров по выбранному фильтру.</div>';

  ui.roomItemsList.querySelectorAll("[data-item-id]").forEach((node) => {
    node.addEventListener("click", () => openItemDialog(node.dataset.itemId));
  });
}

function populateSelect(selectNode, options, selected) {
  selectNode.innerHTML = options
    .map((option) => `<option value="${escapeHtml(option.code)}" ${option.code === selected ? "selected" : ""}>${escapeHtml(option.label)}</option>`)
    .join("");
}

function syncSerialFieldState() {
  const disabled = ui.serialStateInput.value !== "serial_entered";
  ui.serialNumberInput.disabled = disabled;
  if (disabled) {
    ui.serialNumberInput.value = "";
    ui.serialNumberHint.textContent = "Поле недоступно, пока не выбран ручной ввод серийного номера.";
  } else {
    ui.serialNumberHint.textContent = "Введите серийный номер так, как он указан на экземпляре.";
  }
}

function formatItemSerial(item) {
  if (!item) return "—";
  if (item.serial_state === "serial_entered" && item.serial_number) {
    return item.serial_number;
  }
  return lookupLabel("serial_states", item.serial_state);
}

function formatLastCheck(item) {
  if (!item?.last_check_at) return "Отметок пока нет";
  return `${item.last_checked_by_name || "Неизвестно"} • ${formatDateTime(item.last_check_at)}`;
}

function openItemDialog(plannedItemId) {
  const item = state.items.find((entry) => entry.planned_item_id === plannedItemId);
  if (!item) return;
  const room = state.rooms.find((entry) => entry.room_id === item.room_id);
  state.selectedItemId = plannedItemId;
  ui.itemDialogMeta.textContent = `${item.room_code || "—"} • ${item.position_code}`;
  ui.itemDialogTitle.textContent = `${item.display_label} — ${item.equipment_name}`;
  ui.itemCurrentPresenceLabel.textContent = lookupLabel("presence_statuses", item.current_presence_status);
  ui.itemCurrentSerialLabel.textContent = formatItemSerial(item);
  ui.itemCurrentLastCheckLabel.textContent = formatLastCheck(item);
  ui.itemCurrentRepeatLabel.textContent = room?.repeat_check_required ? "Повторная проверка" : "Обычная проверка";
  populateSelect(ui.presenceStatusInput, state.lookups.presence_statuses, item.current_presence_status);
  populateSelect(ui.serialStateInput, state.lookups.serial_states, item.serial_state);
  populateSelect(ui.pnrStatusInput, state.lookups.pnr_statuses, item.pnr_status);
  populateSelect(ui.communicationsStatusInput, state.lookups.communications_statuses, item.communications_status);
  ui.serialNumberInput.value = item.serial_number || "";
  ui.actualConditionInput.value = item.actual_condition || "";
  ui.completenessStatusInput.value = item.completeness_status || "";
  ui.commentTextInput.value = "";
  ui.itemFormStatus.textContent = "";
  syncSerialFieldState();
  ui.itemDialog.showModal();
}

function closeItemDialog() {
  ui.itemDialog.close();
  state.selectedItemId = null;
}

function patchLocalItem(plannedItemId, patch) {
  state.items = state.items.map((item) => item.planned_item_id === plannedItemId ? { ...item, ...patch } : item);
}

async function queueItemCheck() {
  if (!state.session || !state.selectedItemId) {
    ui.itemFormStatus.textContent = "Нет активной сессии сотрудника.";
    return;
  }
  if (ui.serialStateInput.value === "serial_entered" && !ui.serialNumberInput.value.trim()) {
    ui.itemFormStatus.textContent = "Укажите серийный номер или выберите другой режим заполнения.";
    ui.serialNumberInput.focus();
    return;
  }
  const payload = {
    client_item_id: generateUuid(),
    action_type: "item_check",
    event_uid: generateUuid(),
    planned_item_id: state.selectedItemId,
    presence_status: ui.presenceStatusInput.value,
    serial_state: ui.serialStateInput.value,
    serial_number: ui.serialStateInput.value === "serial_entered" ? ui.serialNumberInput.value.trim() : null,
    pnr_status: ui.pnrStatusInput.value,
    communications_status: ui.communicationsStatusInput.value,
    actual_condition: ui.actualConditionInput.value.trim() || null,
    completeness_status: ui.completenessStatusInput.value.trim() || null,
    comment_text: ui.commentTextInput.value.trim() || null,
    created_at_device: new Date().toISOString(),
    is_repeat_check: !!state.rooms.find((room) => room.room_id === state.selectedRoomId)?.repeat_check_required,
    repeat_check_id: null,
  };
  await addQueueItem(payload);
  state.queue = await getAll(STORE_QUEUE);
  patchLocalItem(state.selectedItemId, {
    current_presence_status: payload.presence_status,
    serial_state: payload.serial_state,
    serial_number: payload.serial_number,
    pnr_status: payload.pnr_status,
    communications_status: payload.communications_status,
    actual_condition: payload.actual_condition,
    completeness_status: payload.completeness_status,
    last_check_at: payload.created_at_device,
    last_checked_by_name: state.session.full_name,
  });
  await replaceStore(STORE_ITEMS, state.items);
  renderAll();
  ui.itemFormStatus.textContent = "Данные сохранены локально.";
  setTimeout(closeItemDialog, 300);
}

async function queueRoomCompletion() {
  if (!state.session || !state.selectedRoomId) {
    ui.setupStatus.textContent = "Нет активного помещения.";
    return;
  }
  if (state.queue.some((item) => item.action_type === "room_complete" && item.room_id === state.selectedRoomId)) {
    ui.setupStatus.textContent = "Это помещение уже добавлено в очередь на завершение.";
    return;
  }
  const payload = {
    client_item_id: generateUuid(),
    action_type: "room_complete",
    event_uid: generateUuid(),
    room_id: state.selectedRoomId,
    comment_text: "Помещение завершено с мобильного клиента",
    created_at_device: new Date().toISOString(),
    checked_items_count: getSelectedRoomItems().length,
  };
  await addQueueItem(payload);
  state.queue = await getAll(STORE_QUEUE);
  if (state.bootstrap) {
    state.bootstrap.completed_rooms_count = (state.bootstrap.completed_rooms_count || 0) + 1;
    await saveMeta("bootstrap", state.bootstrap);
  }
  renderAll();
  ui.setupStatus.textContent = "Завершение помещения добавлено в очередь.";
}

async function syncQueue() {
  if (!state.session) {
    ui.setupStatus.textContent = "Сначала войдите в систему.";
    return;
  }
  if (!state.queue.length) {
    ui.setupStatus.textContent = "Очередь пуста.";
    return;
  }
  if (!navigator.onLine) {
    ui.setupStatus.textContent = "Сейчас оффлайн.";
    return;
  }
  ui.setupStatus.textContent = "Отправка очереди на сервер…";
  const response = await fetch("/api/sync/batches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      batch_uid: generateUuid(),
      worker_login: state.session.login,
      worker_full_name: state.session.full_name,
      device_uid: state.session.device_uid,
      platform: state.session.platform,
      app_version: state.session.app_version || null,
      sent_at_device: new Date().toISOString(),
      items: state.queue,
    }),
  });
  if (!response.ok) {
    ui.setupStatus.textContent = "Не удалось синхронизировать очередь.";
    return;
  }
  const result = await response.json();
  const processedIds = result.results
    .filter((item) => item.status === "processed" || item.status === "duplicate")
    .map((item) => item.client_item_id);
  await removeQueueItems(processedIds);
  state.queue = await getAll(STORE_QUEUE);
  await bootstrapData();
  ui.setupStatus.textContent = `Синхронизация: ${result.processed_count} обработано, ${result.duplicate_count} дублей.`;
  renderAll();
}

async function refreshSharedState() {
  if (!state.session || !navigator.onLine) return;
  try {
    const response = await fetch(`/api/field/bootstrap?${buildBootstrapQuery()}`);
    if (!response.ok) return;
    const payload = await response.json();
    const currentRoomId = state.selectedRoomId;
    state.bootstrap = payload;
    state.rooms = payload.rooms || [];
    state.items = payload.items || [];
    state.lookups = payload.lookups || state.lookups;
    state.selectedRoomId = state.rooms.some((room) => room.room_id === currentRoomId)
      ? currentRoomId
      : state.rooms[0]?.room_id || null;
    applyQueuedActionsOverlay();
    await saveMeta("bootstrap", payload);
    await replaceStore(STORE_ROOMS, state.rooms);
    await replaceStore(STORE_ITEMS, state.items);
    renderAll();
  } catch (error) {
    console.error(error);
  }
}

function startSharedRefreshLoop() {
  if (state.sharedRefreshHandle) {
    window.clearInterval(state.sharedRefreshHandle);
  }
  state.sharedRefreshHandle = window.setInterval(() => {
    refreshSharedState().catch(console.error);
  }, SHARED_REFRESH_MS);
}

async function hydrateState() {
  const deviceUid = (await getMeta("deviceUid")) || generateUuid();
  ui.deviceUid.value = deviceUid;
  await saveMeta("deviceUid", deviceUid);
  state.session = await getMeta("session");
  state.bootstrap = await getMeta("bootstrap");
  state.rooms = await getAll(STORE_ROOMS);
  state.items = await getAll(STORE_ITEMS);
  state.queue = await getAll(STORE_QUEUE);
  if (state.bootstrap?.lookups) state.lookups = state.bootstrap.lookups;
  if (state.session) {
    ui.workerLogin.value = state.session.login || "";
    ui.platformSelect.value = state.session.platform || "android";
    ui.appVersion.value = state.session.app_version || "0.1.0";
  }
  ui.deviceUid.value = state.session?.device_uid || deviceUid;
  state.selectedRoomId = state.rooms[0]?.room_id || null;
  populateRoomFilters();
}

function renderAll() {
  renderSummary();
  renderQueue();
  populateRoomFilters();
  renderRooms();
  renderRoomDetail();
  updateNetworkUi();
}

async function resetApp() {
  await clearLocalData();
  state.session = null;
  state.bootstrap = null;
  state.rooms = [];
  state.items = [];
  state.queue = [];
  state.selectedRoomId = null;
  ui.workerPassword.value = "";
  ui.setupStatus.textContent = "Локальные данные очищены.";
  await hydrateState();
  renderAll();
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/static/sw.js").catch(console.error);
  }
}

function wireEvents() {
  ui.loginButton.addEventListener("click", () => loginWorker().catch(console.error));
  ui.bootstrapButton.addEventListener("click", () => bootstrapData().catch(console.error));
  ui.syncButton.addEventListener("click", () => syncQueue().catch(console.error));
  ui.resetButton.addEventListener("click", () => resetApp().catch(console.error));
  ui.floorFilterSelect.addEventListener("change", () => {
    ui.floorFilterSelect.dataset.selected = ui.floorFilterSelect.value;
    ui.departmentFilterSelect.dataset.selected = "";
    ui.roomFilterSelect.dataset.selected = "";
    populateRoomFilters();
    renderAll();
  });
  ui.departmentFilterSelect.addEventListener("change", () => {
    ui.departmentFilterSelect.dataset.selected = ui.departmentFilterSelect.value;
    ui.roomFilterSelect.dataset.selected = "";
    populateRoomFilters();
    renderAll();
  });
  ui.roomFilterSelect.addEventListener("change", () => {
    state.selectedRoomId = ui.roomFilterSelect.value || getFilteredRooms()[0]?.room_id || null;
    ui.roomFilterSelect.dataset.selected = state.selectedRoomId || "";
    renderRooms();
    renderRoomDetail();
  });
  ui.itemSearchInput.addEventListener("input", renderRoomDetail);
  ui.itemFilterSelect.addEventListener("change", renderRoomDetail);
  ui.completeRoomButton.addEventListener("click", () => queueRoomCompletion().catch(console.error));
  ui.closeDialogButton.addEventListener("click", closeItemDialog);
  ui.serialStateInput.addEventListener("change", syncSerialFieldState);
  ui.itemForm.addEventListener("submit", (event) => {
    event.preventDefault();
    queueItemCheck().catch(console.error);
  });
  window.addEventListener("online", () => {
    updateNetworkUi();
    syncQueue().catch(console.error);
  });
  window.addEventListener("offline", updateNetworkUi);
}

async function init() {
  await hydrateState();
  document.getElementById("itemsCountLabel")?.closest(".summary-card")?.classList.add("hidden");
  document.getElementById("queuedActionsCountLabel")?.closest(".summary-card")?.classList.add("hidden");
  document.querySelector(".summary-panel .summary-grid")?.classList.add("two-columns");
  registerServiceWorker();
  wireEvents();
  startSharedRefreshLoop();
  renderAll();
}

window.addEventListener("DOMContentLoaded", () => {
  init().catch((error) => {
    console.error(error);
    ui.setupStatus.textContent = "Ошибка инициализации клиента.";
  });
});
