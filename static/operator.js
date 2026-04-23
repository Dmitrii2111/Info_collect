const operatorState = {
  users: [],
  selectedUserId: null,
  inactiveUsersExpanded: false,
  assignmentOptions: null,
  assignmentExpansion: {},
  assignmentSavedRoomIds: new Set(),
  groups: [],
  selectedGroupId: null,
  rooms: [],
  items: [],
  exportRows: [],
  roomSummary: null,
  itemSummary: null,
};

const operatorUi = {
  operatorPlanLabel: document.getElementById("operatorPlanLabel"),
  operatorRefreshLabel: document.getElementById("operatorRefreshLabel"),
  operatorRefreshButton: document.getElementById("operatorRefreshButton"),
  roomsTotalLabel: document.getElementById("roomsTotalLabel"),
  roomsUncheckedLabel: document.getElementById("roomsUncheckedLabel"),
  roomsMissingLabel: document.getElementById("roomsMissingLabel"),
  roomsConflictLabel: document.getElementById("roomsConflictLabel"),
  itemsTotalLabel: document.getElementById("itemsTotalLabel"),
  itemsUncheckedLabel: document.getElementById("itemsUncheckedLabel"),
  itemsNoSerialLabel: document.getElementById("itemsNoSerialLabel"),
  itemsPnrLabel: document.getElementById("itemsPnrLabel"),
  roomWorklistSelect: document.getElementById("roomWorklistSelect"),
  itemWorklistSelect: document.getElementById("itemWorklistSelect"),
  controlFloorFilter: document.getElementById("controlFloorFilter"),
  controlDepartmentFilter: document.getElementById("controlDepartmentFilter"),
  controlRoomFilter: document.getElementById("controlRoomFilter"),
  operatorRoomsList: document.getElementById("operatorRoomsList"),
  operatorItemsList: document.getElementById("operatorItemsList"),
  createUserForm: document.getElementById("createUserForm"),
  createUserButton: document.getElementById("createUserButton"),
  createUserStatus: document.getElementById("createUserStatus"),
  usersSummary: document.getElementById("usersSummary"),
  usersList: document.getElementById("usersList"),
  editUserDialog: document.getElementById("editUserDialog"),
  editUserForm: document.getElementById("editUserForm"),
  closeEditUserButton: document.getElementById("closeEditUserButton"),
  editUserLabel: document.getElementById("editUserLabel"),
  editUserTitle: document.getElementById("editUserTitle"),
  editUserLogin: document.getElementById("editUserLogin"),
  editUserPassword: document.getElementById("editUserPassword"),
  editUserLastName: document.getElementById("editUserLastName"),
  editUserFirstName: document.getElementById("editUserFirstName"),
  editUserMiddleName: document.getElementById("editUserMiddleName"),
  editUserPhone: document.getElementById("editUserPhone"),
  editUserEmail: document.getElementById("editUserEmail"),
  saveUserButton: document.getElementById("saveUserButton"),
  deleteUserButton: document.getElementById("deleteUserButton"),
  editUserStatus: document.getElementById("editUserStatus"),
  assignmentUsersList: document.getElementById("assignmentUsersList"),
  selectedUserLabel: document.getElementById("selectedUserLabel"),
  assignmentProgressSummary: document.getElementById("assignmentProgressSummary"),
  assignmentTree: document.getElementById("assignmentTree"),
  saveAssignmentsButton: document.getElementById("saveAssignmentsButton"),
  assignmentStatus: document.getElementById("assignmentStatus"),
  groupsList: document.getElementById("groupsList"),
  groupSummary: document.getElementById("groupSummary"),
  createGroupButton: document.getElementById("createGroupButton"),
  reloadExportButton: document.getElementById("reloadExportButton"),
  exportFloorFilter: document.getElementById("exportFloorFilter"),
  exportDepartmentFilter: document.getElementById("exportDepartmentFilter"),
  exportRoomFilter: document.getElementById("exportRoomFilter"),
  exportFilterEquipment: document.getElementById("exportFilterEquipment"),
  exportFilterSerial: document.getElementById("exportFilterSerial"),
  exportFilterPresence: document.getElementById("exportFilterPresence"),
  exportTableBody: document.getElementById("exportTableBody"),
  repeatCheckDialog: document.getElementById("repeatCheckDialog"),
  repeatCheckRoomsList: document.getElementById("repeatCheckRoomsList"),
  repeatCheckContinueButton: document.getElementById("repeatCheckContinueButton"),
  repeatCheckCancelButton: document.getElementById("repeatCheckCancelButton"),
  assignmentOverlapDialog: document.getElementById("assignmentOverlapDialog"),
  assignmentOverlapList: document.getElementById("assignmentOverlapList"),
  assignmentOverlapTeamName: document.getElementById("assignmentOverlapTeamName"),
  assignmentOverlapMergeButton: document.getElementById("assignmentOverlapMergeButton"),
  assignmentOverlapCancelButton: document.getElementById("assignmentOverlapCancelButton"),
  tabButtons: Array.from(document.querySelectorAll(".tab-button")),
  tabPanels: Array.from(document.querySelectorAll(".tab-panel")),
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ru-RU");
  } catch {
    return String(value);
  }
}

function getAssignmentStatusLabel(status) {
  if (status === "completed") return "Завершено";
  if (status === "in_progress") return "В работе";
  if (status === "not_started") return "Не начато";
  return "Не назначено";
}

function getAssignmentStatusClass(status) {
  if (status === "completed") return "success";
  if (status === "in_progress") return "warn";
  if (status === "not_started") return "danger";
  return "";
}

function getProgressPercent(completedCount, assignedCount) {
  if (!assignedCount) return 0;
  return Math.max(0, Math.min(100, Math.round((completedCount / assignedCount) * 100)));
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || `Request failed: ${url}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

function setOptions(node, values, allLabel, selected = "") {
  const options = [`<option value="">${escapeHtml(allLabel)}</option>`];
  for (const value of values) {
    options.push(`<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`);
  }
  node.innerHTML = options.join("");
  node.value = selected && values.includes(selected) ? selected : "";
}

function getRoomProgress(roomId, items) {
  const roomItems = items.filter((item) => item.room_id === roomId);
  if (!roomItems.length) return "not-started";
  const checkedCount = roomItems.filter((item) => item.current_presence_status !== "not_checked").length;
  if (!checkedCount) return "not-started";
  if (checkedCount === roomItems.length) return "completed";
  return "partial";
}

function getPresenceRowClass(presence) {
  if (presence === "found" || presence === "moved_to_room") return "row-found";
  if (presence === "missing" || presence === "conflict") return "row-problem";
  if (presence === "not_checked") return "row-pending";
  return "";
}

function renderSummaries() {
  const roomSummary = operatorState.roomSummary || { total: 0, worklist: {} };
  const itemSummary = operatorState.itemSummary || { total: 0, worklist: {} };
  operatorUi.roomsTotalLabel.textContent = String(roomSummary.total || 0);
  operatorUi.roomsUncheckedLabel.textContent = String(roomSummary.worklist?.unchecked || 0);
  operatorUi.roomsMissingLabel.textContent = String(roomSummary.worklist?.missing || 0);
  operatorUi.roomsConflictLabel.textContent = String(roomSummary.worklist?.conflict || 0);
  operatorUi.itemsTotalLabel.textContent = String(itemSummary.total || 0);
  operatorUi.itemsUncheckedLabel.textContent = String(itemSummary.worklist?.unchecked || 0);
  operatorUi.itemsNoSerialLabel.textContent = String(itemSummary.worklist?.no_serial || 0);
  operatorUi.itemsPnrLabel.textContent = String(itemSummary.worklist?.pnr_attention || 0);
  operatorUi.operatorPlanLabel.textContent = itemSummary.plan_version_id || roomSummary.plan_version_id || "—";
}

function populateControlFilters() {
  const floors = [...new Set(operatorState.rooms.map((room) => room.floor_code).filter(Boolean))].sort();
  setOptions(operatorUi.controlFloorFilter, floors, "Все этажи", operatorUi.controlFloorFilter.value);

  const departments = [...new Set(
    operatorState.rooms
      .filter((room) => !operatorUi.controlFloorFilter.value || room.floor_code === operatorUi.controlFloorFilter.value)
      .map((room) => room.department_name)
      .filter(Boolean),
  )].sort();
  setOptions(operatorUi.controlDepartmentFilter, departments, "Все отделения", operatorUi.controlDepartmentFilter.value);

  const roomOptions = operatorState.rooms
    .filter((room) => {
      if (operatorUi.controlFloorFilter.value && room.floor_code !== operatorUi.controlFloorFilter.value) return false;
      if (operatorUi.controlDepartmentFilter.value && room.department_name !== operatorUi.controlDepartmentFilter.value) return false;
      return true;
    })
    .map((room) => ({ id: room.room_id, label: `${room.room_code} — ${room.room_name}` }));

  const options = ['<option value="">Все помещения</option>']
    .concat(roomOptions.map((room) => `<option value="${escapeHtml(room.id)}">${escapeHtml(room.label)}</option>`));
  const currentRoom = operatorUi.controlRoomFilter.value;
  operatorUi.controlRoomFilter.innerHTML = options.join("");
  operatorUi.controlRoomFilter.value = roomOptions.some((room) => room.id === currentRoom) ? currentRoom : "";
}

function roomMatchesControlFilters(room) {
  if (operatorUi.controlFloorFilter.value && room.floor_code !== operatorUi.controlFloorFilter.value) return false;
  if (operatorUi.controlDepartmentFilter.value && room.department_name !== operatorUi.controlDepartmentFilter.value) return false;
  if (operatorUi.controlRoomFilter.value && room.room_id !== operatorUi.controlRoomFilter.value) return false;
  return true;
}

function itemMatchesControlFilters(item) {
  if (operatorUi.controlFloorFilter.value && item.floor_code !== operatorUi.controlFloorFilter.value) return false;
  if (operatorUi.controlDepartmentFilter.value && item.department_name !== operatorUi.controlDepartmentFilter.value) return false;
  if (operatorUi.controlRoomFilter.value && item.room_id !== operatorUi.controlRoomFilter.value) return false;
  return true;
}

function renderRoomList() {
  const filteredRooms = operatorState.rooms.filter(roomMatchesControlFilters);
  if (!filteredRooms.length) {
    operatorUi.operatorRoomsList.className = "rooms-list empty-state";
    operatorUi.operatorRoomsList.textContent = "Помещений по выбранному фильтру нет.";
    return;
  }

  operatorUi.operatorRoomsList.className = "rooms-list";
  operatorUi.operatorRoomsList.innerHTML = filteredRooms.map((room) => {
    const progressClass = getRoomProgress(room.room_id, operatorState.exportRows);
    const badges = [];
    if (room.status_flags?.has_unchecked_items) badges.push('<span class="badge warn">Не проверено</span>');
    if (room.status_flags?.has_missing_items) badges.push('<span class="badge danger">Отсутствует</span>');
    if (room.status_flags?.has_conflict_items) badges.push('<span class="badge danger">Конфликт</span>');
    if (room.status_flags?.has_no_serial_items) badges.push('<span class="badge">Без серийника</span>');
    if (room.status_flags?.has_pnr_attention_items) badges.push('<span class="badge warn">ПНР</span>');
    return `
      <article class="room-card room-progress ${progressClass}">
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
        <div class="badge-row">${badges.join("")}</div>
      </article>
    `;
  }).join("");
}

function renderItemList() {
  const filteredItems = operatorState.items.filter(itemMatchesControlFilters);
  if (!filteredItems.length) {
    operatorUi.operatorItemsList.className = "room-items-list empty-state";
    operatorUi.operatorItemsList.textContent = "Экземпляров по выбранному фильтру нет.";
    return;
  }

  operatorUi.operatorItemsList.className = "room-items-list";
  operatorUi.operatorItemsList.innerHTML = filteredItems.map((item) => `
    <article class="item-card">
      <div class="item-title-row">
        <div>
          <strong>${escapeHtml(item.position_code)} • ${escapeHtml(item.display_label)}</strong>
          <p>${escapeHtml(item.equipment_name)}</p>
        </div>
        <span class="badge">${escapeHtml(item.current_presence_status)}</span>
      </div>
      <div class="item-meta">
        <span>${escapeHtml(item.room_code || "—")} • ${escapeHtml(item.room_name || "—")}</span>
        <span>${formatDate(item.last_check_at)}</span>
      </div>
      <div class="badge-row">
        <span class="badge">${escapeHtml(item.serial_number || item.serial_state)}</span>
        <span class="badge">${escapeHtml(item.pnr_status)}</span>
        <span class="badge">${escapeHtml(item.communications_status)}</span>
      </div>
    </article>
  `).join("");
}

function sortedUsers() {
  return [...operatorState.users].sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    return String(a.full_name || "").localeCompare(String(b.full_name || ""), "ru");
  });
}

function getDefaultActiveUserId() {
  return sortedUsers().find((user) => user.is_active)?.user_id || null;
}

function getUserStatusLabel(status) {
  if (status === "in_progress") return "В работе";
  if (status === "idle") return "Простаивает";
  return "Свободен";
}

function getUserStatusClass(status) {
  if (status === "in_progress") return "success";
  if (status === "idle") return "danger";
  return "warn";
}

function getInitials(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "—";
}

function renderUsersSummary(activeUsers, inactiveUsers) {
  const total = activeUsers.length;
  const inProgress = activeUsers.filter(
    (user) => (user.assigned_rooms_count || 0) > 0 && (user.completed_rooms_count || 0) < (user.assigned_rooms_count || 0),
  ).length;
  const available = activeUsers.filter(
    (user) => (user.assigned_rooms_count || 0) === 0 || (user.completed_rooms_count || 0) >= (user.assigned_rooms_count || 0),
  ).length;
  operatorUi.usersSummary.innerHTML = `
    <div class="summary-card">
      <span class="summary-label">Всего сотрудников</span>
      <strong>${total}</strong>
    </div>
    <div class="summary-card assignment-card completed">
      <span class="summary-label">В работе</span>
      <strong>${inProgress}</strong>
    </div>
    <div class="summary-card assignment-card in-progress">
      <span class="summary-label">Свободны</span>
      <strong>${available}</strong>
    </div>
    <div class="summary-card assignment-card not-started">
      <span class="summary-label">Неактивны</span>
      <strong>${inactiveUsers.length}</strong>
    </div>
  `;
}

function renderUsers() {
  const users = sortedUsers();
  const activeUsers = users.filter((user) => user.is_active);
  const inactiveUsers = users.filter((user) => !user.is_active);
  renderUsersSummary(activeUsers, inactiveUsers);
  const renderUsersDirectoryCard = (user) => `
      <article class="room-card user-card users-directory-card ${!user.is_active ? "inactive-user" : ""} ${user.user_id === operatorState.selectedUserId ? "active" : ""}" data-user-id="${escapeHtml(user.user_id)}">
        <div class="users-directory-body">
          <span class="user-avatar user-avatar-large">${escapeHtml(getInitials(user.full_name))}</span>
          <div class="users-directory-text">
            <strong class="users-directory-name">${escapeHtml(user.full_name)}</strong>
            <p class="users-directory-line">${escapeHtml(user.phone || "Телефон не указан")}</p>
            <p class="users-directory-line">${escapeHtml(user.email || "Почта не указана")}</p>
          </div>
        </div>
        <div class="room-meta users-directory-meta">
          <span>Назначено: ${user.assigned_rooms_count || 0}</span>
        </div>
        <div class="button-row users-directory-actions">
          <button type="button" class="secondary-button user-edit-button" data-edit-user-id="${escapeHtml(user.user_id)}">Редактировать</button>
          ${user.is_active
            ? `<button type="button" class="ghost-button user-delete-button" data-delete-user-id="${escapeHtml(user.user_id)}">Удалить</button>`
            : `<button type="button" class="ghost-button user-restore-button" data-restore-user-id="${escapeHtml(user.user_id)}">Восстановить</button>`}
        </div>
      </article>
    `;
  const renderAssignmentUserCard = (user) => `
      <article class="room-card user-card ${!user.is_active ? "inactive-user" : ""} ${user.user_id === operatorState.selectedUserId ? "active" : ""}" data-user-id="${escapeHtml(user.user_id)}">
        <div class="room-title-row">
          <div class="user-card-main">
            <span class="user-avatar">${escapeHtml(getInitials(user.full_name))}</span>
            <div>
            <strong>${escapeHtml(user.full_name)}</strong>
              <p>${escapeHtml(user.phone || user.email || "Без контактов")}</p>
            </div>
          </div>
          <span class="badge ${getUserStatusClass(user.work_status)}">${getUserStatusLabel(user.work_status)}</span>
        </div>
        <div class="room-meta">
          <span>Назначено: ${user.assigned_rooms_count || 0}</span>
          <span>Завершено: ${user.completed_rooms_count || 0}</span>
        </div>
        <div class="button-row">
          <button type="button" class="secondary-button user-edit-button" data-edit-user-id="${escapeHtml(user.user_id)}">Редактировать</button>
          ${user.is_active
            ? `<button type="button" class="ghost-button user-delete-button" data-delete-user-id="${escapeHtml(user.user_id)}">Удалить</button>`
            : `<button type="button" class="ghost-button user-restore-button" data-restore-user-id="${escapeHtml(user.user_id)}">Восстановить</button>`}
        </div>
      </article>
    `;

  const inactiveBlock = inactiveUsers.length
    ? `
      <section class="user-tree">
        <button type="button" class="ghost-button user-tree-toggle" data-tree-toggle="inactive-users">
          ${operatorState.inactiveUsersExpanded ? "▾" : "▸"} Неактивные сотрудники (${inactiveUsers.length})
        </button>
        <div class="user-tree-children ${operatorState.inactiveUsersExpanded ? "" : "hidden"}">
          ${inactiveUsers.map(renderUsersDirectoryCard).join("")}
        </div>
      </section>
    `
    : "";

  const markup = users.length
    ? `${activeUsers.map(renderUsersDirectoryCard).join("")}${inactiveBlock}`
    : '<div class="empty-state">Сотрудники пока не заведены.</div>';
  const assignmentMarkup = users.length
    ? activeUsers.map(renderAssignmentUserCard).join("")
    : '<div class="empty-state">Сотрудники пока не заведены.</div>';

  operatorUi.usersList.className = "rooms-list";
  operatorUi.usersList.innerHTML = markup;
  operatorUi.assignmentUsersList.className = "rooms-list";
  operatorUi.assignmentUsersList.innerHTML = assignmentMarkup;

  document.querySelectorAll("[data-user-id]").forEach((node) => {
    node.addEventListener("click", () => {
      operatorState.selectedUserId = node.dataset.userId;
      operatorState.assignmentExpansion = {};
      renderUsers();
      loadAssignments().catch(console.error);
    });
  });
  document.querySelectorAll("[data-edit-user-id]").forEach((node) => {
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      startEditUser(node.dataset.editUserId);
    });
  });
  document.querySelectorAll("[data-delete-user-id]").forEach((node) => {
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteUser(node.dataset.deleteUserId).catch(console.error);
    });
  });
  document.querySelectorAll("[data-restore-user-id]").forEach((node) => {
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      restoreUser(node.dataset.restoreUserId).catch(console.error);
    });
  });
  document.querySelectorAll("[data-tree-toggle='inactive-users']").forEach((node) => {
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      operatorState.inactiveUsersExpanded = !operatorState.inactiveUsersExpanded;
      renderUsers();
    });
  });
}

function populateEditForm() {
  const user = operatorState.users.find((item) => item.user_id === operatorState.selectedUserId);
  if (!user) {
    operatorUi.editUserLabel.textContent = "Сотрудник";
    operatorUi.editUserTitle.textContent = "Редактирование сотрудника";
    operatorUi.editUserForm.reset();
    operatorUi.editUserStatus.textContent = "";
    return;
  }

  const parts = (user.full_name || "").split(" ");
  operatorUi.editUserLabel.textContent = user.is_active ? "Активный сотрудник" : "Выключенный сотрудник";
  operatorUi.editUserTitle.textContent = user.full_name || "Редактирование сотрудника";
  operatorUi.editUserLogin.value = user.login || "";
  operatorUi.editUserPassword.value = "";
  operatorUi.editUserLastName.value = parts[0] || "";
  operatorUi.editUserFirstName.value = parts[1] || "";
  operatorUi.editUserMiddleName.value = parts.slice(2).join(" ");
  operatorUi.editUserPhone.value = user.phone || "";
  operatorUi.editUserEmail.value = user.email || "";
  operatorUi.editUserStatus.textContent = "";
}

function openEditDialog() {
  populateEditForm();
  operatorUi.editUserDialog.showModal();
}

function closeEditDialog() {
  operatorUi.editUserDialog.close();
}

function startEditUser(userId) {
  operatorState.selectedUserId = userId;
  renderUsers();
  openEditDialog();
}

function buildAssignmentFloors(data) {
  return [...(data?.floors || [])]
    .map((floor) => {
      const rooms = floor.departments
        .flatMap((department) =>
          department.rooms.map((room) => ({
            room_id: room.room_id,
            room_code: room.room_code,
            room_name: room.room_name,
            selected: !!room.selected,
            progress_status: room.progress_status || "not_assigned",
            checked_items_count: room.checked_items_count || 0,
            total_items_count: room.total_items_count || 0,
            completed_at: room.completed_at || null,
            repeat_check_required: !!room.repeat_check_required,
            department_id: department.department_id,
            department_name: department.department_name || "Без отделения",
          })),
        )
        .sort((a, b) => {
          return `${a.room_code || ""} ${a.room_name || ""}`.localeCompare(`${b.room_code || ""} ${b.room_name || ""}`, "ru");
        });

      const departments = [...floor.departments]
        .map((department) => {
          const departmentRooms = rooms.filter((room) => room.department_id === department.department_id);
          const selectedCount = departmentRooms.filter((room) => room.selected).length;
          return {
            department_id: department.department_id,
            department_name: department.department_name || "Без отделения",
            rooms: departmentRooms,
            selectedCount,
            totalCount: departmentRooms.length,
            fullySelected: departmentRooms.length > 0 && selectedCount === departmentRooms.length,
            partiallySelected: selectedCount > 0 && selectedCount < departmentRooms.length,
            progress_status: department.progress_status || "not_assigned",
            assigned_rooms_count: department.assigned_rooms_count || 0,
            completed_rooms_count: department.completed_rooms_count || 0,
            in_progress_rooms_count: department.in_progress_rooms_count || 0,
            not_started_rooms_count: department.not_started_rooms_count || 0,
          };
        })
        .sort((a, b) => {
          return `${a.department_name || ""}`.localeCompare(`${b.department_name || ""}`, "ru");
        });

      const selectedRooms = rooms.filter((room) => room.selected).length;
      return {
        floor_id: floor.floor_id,
        floor_code: floor.floor_code || "Без этажа",
        floor_name: floor.floor_name || "Без названия",
        departments,
        selectedRooms,
        totalRooms: rooms.length,
        fullySelected: rooms.length > 0 && selectedRooms === rooms.length,
        partiallySelected: selectedRooms > 0 && selectedRooms < rooms.length,
        progress_status: floor.progress_status || "not_assigned",
        assigned_rooms_count: floor.assigned_rooms_count || 0,
        completed_rooms_count: floor.completed_rooms_count || 0,
        in_progress_rooms_count: floor.in_progress_rooms_count || 0,
        not_started_rooms_count: floor.not_started_rooms_count || 0,
      };
    })
    .sort((a, b) => {
      return `${a.floor_code || ""}`.localeCompare(`${b.floor_code || ""}`, "ru");
    });
}

function renderAssignmentSummary() {
  const summary = operatorState.assignmentOptions?.progress_summary;
  if (!summary || !operatorState.selectedUserId) {
    operatorUi.assignmentProgressSummary.className = "summary-grid compact-grid hidden";
    operatorUi.assignmentProgressSummary.innerHTML = "";
    return;
  }

  operatorUi.assignmentProgressSummary.className = "summary-grid compact-grid assignment-summary-grid";
  operatorUi.assignmentProgressSummary.innerHTML = `
    <div class="summary-card">
      <span class="summary-label">Назначено помещений</span>
      <strong>${summary.assigned_rooms_count || 0}</strong>
    </div>
    <div class="summary-card assignment-card completed">
      <span class="summary-label">Завершено</span>
      <strong>${summary.completed_rooms_count || 0}</strong>
    </div>
    <div class="summary-card assignment-card in-progress">
      <span class="summary-label">В работе</span>
      <strong>${summary.in_progress_rooms_count || 0}</strong>
    </div>
    <div class="summary-card assignment-card not-started">
      <span class="summary-label">Не начато</span>
      <strong>${summary.not_started_rooms_count || 0}</strong>
    </div>
  `;
}

function getRoomAssignmentDescriptor(room) {
  const countText = `<span class="assignment-room-count">${room.checked_items_count}/${room.total_items_count}</span>`;
  if (!room.selected) return countText;
  if (room.repeat_check_required) {
    return `<span class="badge repeat">Повторная проверка</span>${countText}`;
  }
  return countText;
}

function renderAssignmentTree() {
  const data = operatorState.assignmentOptions;
  if (!data) {
    renderAssignmentSummary();
    operatorUi.assignmentTree.className = "assignment-tree empty-state";
    operatorUi.assignmentTree.textContent = operatorState.selectedUserId
      ? "Данные назначения не загружены."
      : "Сначала выберите сотрудника.";
    return;
  }

  const floors = buildAssignmentFloors(data);
  renderAssignmentSummary();
  operatorUi.assignmentTree.className = "assignment-tree";
  operatorUi.assignmentTree.innerHTML = floors.map((floor) => `
    <section class="assignment-floor">
      <div class="assignment-row assignment-row-card assignment-row-${escapeHtml(floor.progress_status)}">
        <label class="check-row assignment-main-check">
          <input type="checkbox" data-kind="floor" value="${escapeHtml(floor.floor_id || "")}" ${floor.fullySelected ? "checked" : ""}>
          <span class="assignment-title-block">
            <span><strong>${escapeHtml(floor.floor_code)}</strong> — ${escapeHtml(floor.floor_name)}</span>
            <span class="badge ${getAssignmentStatusClass(floor.progress_status)}">${getAssignmentStatusLabel(floor.progress_status)}</span>
          </span>
        </label>
        <div class="assignment-side">
          <div class="assignment-progress-meta">
            <strong>${floor.completed_rooms_count} / ${floor.assigned_rooms_count}</strong>
            <span>${floor.in_progress_rooms_count > 0 ? `В работе: ${floor.in_progress_rooms_count}` : " "}</span>
          </div>
          <button type="button" class="ghost-button assignment-toggle icon-toggle" data-target-id="floor-${escapeHtml(floor.floor_id || floor.floor_code)}">
            ${operatorState.assignmentExpansion[`floor-${floor.floor_id || floor.floor_code}`] ? "▾" : "▸"}
          </button>
        </div>
      </div>
      <div class="assignment-progress-bar">
        <span style="width:${getProgressPercent(floor.completed_rooms_count, floor.assigned_rooms_count)}%"></span>
      </div>
      <div id="floor-${escapeHtml(floor.floor_id || floor.floor_code)}" class="assignment-children ${operatorState.assignmentExpansion[`floor-${floor.floor_id || floor.floor_code}`] ? "" : "hidden"}">
        ${floor.departments.map((department) => `
          <section class="assignment-department">
            <div class="assignment-row assignment-row-card assignment-row-${escapeHtml(department.progress_status)}">
              <label class="check-row assignment-main-check">
                <input type="checkbox" data-kind="department" value="${escapeHtml(department.department_id || "")}" ${department.fullySelected ? "checked" : ""}>
                <span class="assignment-title-block">
                  <span>${escapeHtml(department.department_name)}</span>
                  <span class="badge ${getAssignmentStatusClass(department.progress_status)}">${getAssignmentStatusLabel(department.progress_status)}</span>
                </span>
              </label>
              <div class="assignment-side">
                <div class="assignment-progress-meta">
                  <strong>${department.completed_rooms_count} / ${department.assigned_rooms_count}</strong>
                  <span>${department.in_progress_rooms_count > 0 ? `В работе: ${department.in_progress_rooms_count}` : " "}</span>
                </div>
                <button type="button" class="ghost-button assignment-toggle icon-toggle" data-target-id="department-${escapeHtml(department.department_id || `${floor.floor_id}-${department.department_name}`)}">
                  ${operatorState.assignmentExpansion[`department-${department.department_id || `${floor.floor_id}-${department.department_name}`}`] ? "▾" : "▸"}
                </button>
              </div>
            </div>
            <div class="assignment-progress-bar small">
              <span style="width:${getProgressPercent(department.completed_rooms_count, department.assigned_rooms_count)}%"></span>
            </div>
            <div id="department-${escapeHtml(department.department_id || `${floor.floor_id}-${department.department_name}`)}" class="assignment-children ${operatorState.assignmentExpansion[`department-${department.department_id || `${floor.floor_id}-${department.department_name}`}`] ? "" : "hidden"}">
              ${department.rooms.map((room) => `
                <label class="check-row assignment-room assignment-room-${escapeHtml(room.progress_status)} ${room.selected ? "selected" : ""}">
                  <input type="checkbox" data-kind="room" value="${escapeHtml(room.room_id)}" data-floor-id="${escapeHtml(floor.floor_id || "")}" data-department-id="${escapeHtml(department.department_id || "")}" ${room.selected ? "checked" : ""}>
                  <span class="assignment-room-main">
                    <span>${escapeHtml(room.room_code)} — ${escapeHtml(room.room_name)}</span>
                    <span class="assignment-room-meta">
                      <span class="badge ${getAssignmentStatusClass(room.progress_status)}">${getAssignmentStatusLabel(room.progress_status)}</span>
                      ${getRoomAssignmentDescriptor(room)}
                    </span>
                  </span>
                </label>
              `).join("")}
            </div>
          </section>
        `).join("")}
      </div>
    </section>
  `).join("");

  operatorUi.assignmentTree.querySelectorAll('input[data-kind="floor"]').forEach((input) => {
    const floorSection = input.closest(".assignment-floor");
    const roomInputs = Array.from(floorSection.querySelectorAll('input[data-kind="room"]'));
    const selectedCount = roomInputs.filter((room) => room.checked).length;
    input.indeterminate = selectedCount > 0 && selectedCount < roomInputs.length;
    input.addEventListener("change", () => {
      roomInputs.forEach((room) => {
        room.checked = input.checked;
      });
      renderAssignmentTreeFromDom();
    });
  });

  operatorUi.assignmentTree.querySelectorAll('input[data-kind="department"]').forEach((input) => {
    const departmentSection = input.closest(".assignment-department");
    const roomInputs = Array.from(departmentSection.querySelectorAll('input[data-kind="room"]'));
    const selectedCount = roomInputs.filter((room) => room.checked).length;
    input.indeterminate = selectedCount > 0 && selectedCount < roomInputs.length;
    input.addEventListener("change", () => {
      roomInputs.forEach((room) => {
        room.checked = input.checked;
      });
      renderAssignmentTreeFromDom();
    });
  });

  operatorUi.assignmentTree.querySelectorAll('input[data-kind="room"]').forEach((input) => {
    input.addEventListener("change", () => {
      renderAssignmentTreeFromDom();
    });
  });

  operatorUi.assignmentTree.querySelectorAll(".assignment-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.targetId);
      if (target) {
        target.classList.toggle("hidden");
        operatorState.assignmentExpansion[button.dataset.targetId] = !target.classList.contains("hidden");
        button.textContent = target.classList.contains("hidden") ? "▸" : "▾";
      }
    });
  });
}

function renderAssignmentTreeFromDom() {
  const payload = buildAssignmentPayload();
  const selectedRoomIds = new Set(payload.room_ids);
  if (!operatorState.assignmentOptions) return;

  for (const floor of operatorState.assignmentOptions.floors) {
    for (const department of floor.departments) {
      for (const room of department.rooms) {
        room.selected = selectedRoomIds.has(room.room_id);
      }
      department.selected = department.rooms.length > 0 && department.rooms.every((room) => room.selected);
    }
    floor.selected = floor.departments.every((department) => department.rooms.every((room) => room.selected));
  }
  renderAssignmentTree();
}

function buildAssignmentPayload() {
  const roomIds = Array.from(operatorUi.assignmentTree.querySelectorAll('input[data-kind="room"]:checked'))
    .map((input) => input.value)
    .filter(Boolean);
  return {
    floor_ids: [],
    department_ids: [],
    room_ids: [...new Set(roomIds)],
  };
}

function getSelectedAssignmentRooms() {
  if (!operatorState.assignmentOptions) return [];
  return operatorState.assignmentOptions.floors
    .flatMap((floor) => floor.departments)
    .flatMap((department) => department.rooms)
    .filter((room) => room.selected);
}

function getNewRepeatRooms(payload) {
  const currentIds = new Set(payload.room_ids);
  return getSelectedAssignmentRooms().filter(
    (room) => currentIds.has(room.room_id) && room.completed_at && !operatorState.assignmentSavedRoomIds.has(room.room_id),
  );
}

function showRepeatCheckDialog(rooms) {
  return new Promise((resolve) => {
    operatorUi.repeatCheckRoomsList.innerHTML = rooms.map((room) => `
      <article class="dialog-list-item">
        <strong>${escapeHtml(room.room_code)}</strong>
        <p>${escapeHtml(room.room_name)}</p>
        <span class="muted-note">Завершено: ${escapeHtml(formatDate(room.completed_at))}</span>
      </article>
    `).join("");

    const cleanup = () => {
      operatorUi.repeatCheckContinueButton.onclick = null;
      operatorUi.repeatCheckCancelButton.onclick = null;
      operatorUi.repeatCheckDialog.onclose = null;
    };

    operatorUi.repeatCheckContinueButton.onclick = () => {
      cleanup();
      operatorUi.repeatCheckDialog.close();
      resolve(true);
    };
    operatorUi.repeatCheckCancelButton.onclick = () => {
      cleanup();
      operatorUi.repeatCheckDialog.close();
      resolve(false);
    };
    operatorUi.repeatCheckDialog.onclose = () => {
      cleanup();
      resolve(false);
    };
    operatorUi.repeatCheckDialog.showModal();
  });
}

function showAssignmentOverlapDialog(overlapPreview) {
  return new Promise((resolve) => {
    const userNames = [...new Set(overlapPreview.overlaps.map((entry) => entry.other_user_name))];
    operatorUi.assignmentOverlapTeamName.value = userNames.length
      ? `Группа ${userNames.slice(0, 2).join(" / ")}`
      : "";
    operatorUi.assignmentOverlapList.innerHTML = overlapPreview.overlaps.map((entry) => `
      <article class="dialog-list-item">
        <strong>${escapeHtml(entry.room_code)} — ${escapeHtml(entry.room_name)}</strong>
        <p>Совпадает с назначением сотрудника: ${escapeHtml(entry.other_user_name)}</p>
        ${entry.other_group_name ? `<span class="muted-note">Уже в группе: ${escapeHtml(entry.other_group_name)}</span>` : ""}
      </article>
    `).join("");

    const cleanup = () => {
      operatorUi.assignmentOverlapMergeButton.onclick = null;
      operatorUi.assignmentOverlapCancelButton.onclick = null;
      operatorUi.assignmentOverlapDialog.onclose = null;
    };

    operatorUi.assignmentOverlapMergeButton.onclick = () => {
      const teamName = operatorUi.assignmentOverlapTeamName.value.trim();
      cleanup();
      operatorUi.assignmentOverlapDialog.close();
      resolve({ action: "merge", teamName });
    };
    operatorUi.assignmentOverlapCancelButton.onclick = () => {
      cleanup();
      operatorUi.assignmentOverlapDialog.close();
      resolve({ action: "cancel" });
    };
    operatorUi.assignmentOverlapDialog.onclose = () => {
      cleanup();
      resolve({ action: "cancel" });
    };
    operatorUi.assignmentOverlapDialog.showModal();
  });
}

function renderGroups() {
  const groups = [...operatorState.groups].sort((a, b) => {
    const aScore = (a.assigned_rooms_count || 0) > 0 ? 1 : 0;
    const bScore = (b.assigned_rooms_count || 0) > 0 ? 1 : 0;
    if (aScore !== bScore) return bScore - aScore;
    return String(a.team_name || "").localeCompare(String(b.team_name || ""), "ru");
  });

  if (!groups.length) {
    operatorUi.groupsList.className = "rooms-list empty-state";
    operatorUi.groupsList.textContent = "Группы еще не созданы.";
    operatorUi.groupSummary.className = "detail-empty";
    operatorUi.groupSummary.textContent = "Выберите группу, чтобы увидеть короткую сводку.";
    return;
  }

  if (!operatorState.selectedGroupId || !groups.some((group) => group.team_id === operatorState.selectedGroupId)) {
    operatorState.selectedGroupId = groups[0].team_id;
  }

  operatorUi.groupsList.className = "rooms-list";
  operatorUi.groupsList.innerHTML = groups.map((group) => `
    <article class="room-card group-card ${group.team_id === operatorState.selectedGroupId ? "active" : ""}" data-group-id="${escapeHtml(group.team_id)}">
      <div class="room-title-row">
        <div>
          <strong>${escapeHtml(group.team_name)}</strong>
          <p>${group.members_count} участников</p>
        </div>
        <span class="badge">${group.assigned_rooms_count || 0}</span>
      </div>
      <div class="room-meta">
        <span>Завершено: ${group.completed_rooms_count || 0}</span>
        <span>В работе: ${group.in_progress_rooms_count || 0}</span>
      </div>
    </article>
  `).join("");

  operatorUi.groupsList.querySelectorAll("[data-group-id]").forEach((node) => {
    node.addEventListener("click", () => {
      operatorState.selectedGroupId = node.dataset.groupId;
      renderGroups();
    });
  });

  const group = groups.find((item) => item.team_id === operatorState.selectedGroupId);
  if (!group) {
    operatorUi.groupSummary.className = "detail-empty";
    operatorUi.groupSummary.textContent = "Выберите группу, чтобы увидеть короткую сводку.";
    return;
  }

  operatorUi.groupSummary.className = "group-summary";
  operatorUi.groupSummary.innerHTML = `
    <div class="summary-grid compact-grid assignment-summary-grid">
      <div class="summary-card">
        <span class="summary-label">Общие помещения</span>
        <strong>${group.assigned_rooms_count || 0}</strong>
      </div>
      <div class="summary-card assignment-card completed">
        <span class="summary-label">Завершено</span>
        <strong>${group.completed_rooms_count || 0}</strong>
      </div>
      <div class="summary-card assignment-card in-progress">
        <span class="summary-label">В работе</span>
        <strong>${group.in_progress_rooms_count || 0}</strong>
      </div>
      <div class="summary-card assignment-card not-started">
        <span class="summary-label">Не начато</span>
        <strong>${group.not_started_rooms_count || 0}</strong>
      </div>
    </div>
    <div class="badge-row">
      ${group.members.map((member) => `<span class="badge">${escapeHtml(member.full_name)}</span>`).join("")}
    </div>
  `;
}

function populateExportFilters() {
  const floors = [...new Set(operatorState.exportRows.map((item) => item.floor_code).filter(Boolean))].sort();
  setOptions(operatorUi.exportFloorFilter, floors, "Все этажи", operatorUi.exportFloorFilter.value);

  const departments = [...new Set(
    operatorState.exportRows
      .filter((item) => !operatorUi.exportFloorFilter.value || item.floor_code === operatorUi.exportFloorFilter.value)
      .map((item) => item.department_name)
      .filter(Boolean),
  )].sort();
  setOptions(operatorUi.exportDepartmentFilter, departments, "Все отделения", operatorUi.exportDepartmentFilter.value);

  const roomOptions = operatorState.exportRows
    .filter((item) => {
      if (operatorUi.exportFloorFilter.value && item.floor_code !== operatorUi.exportFloorFilter.value) return false;
      if (operatorUi.exportDepartmentFilter.value && item.department_name !== operatorUi.exportDepartmentFilter.value) return false;
      return true;
    })
    .map((item) => ({ id: item.room_id, label: `${item.room_code || "—"} — ${item.room_name || "—"}` }))
    .filter((item, index, all) => item.id && all.findIndex((candidate) => candidate.id === item.id) === index);

  const options = ['<option value="">Все помещения</option>']
    .concat(roomOptions.map((room) => `<option value="${escapeHtml(room.id)}">${escapeHtml(room.label)}</option>`));
  const currentRoom = operatorUi.exportRoomFilter.value;
  operatorUi.exportRoomFilter.innerHTML = options.join("");
  operatorUi.exportRoomFilter.value = roomOptions.some((room) => room.id === currentRoom) ? currentRoom : "";
}

function renderExportTable() {
  const floorFilter = operatorUi.exportFloorFilter.value;
  const departmentFilter = operatorUi.exportDepartmentFilter.value;
  const roomFilter = operatorUi.exportRoomFilter.value;
  const equipmentNeedle = operatorUi.exportFilterEquipment.value.trim().toLowerCase();
  const serialNeedle = operatorUi.exportFilterSerial.value.trim().toLowerCase();
  const presence = operatorUi.exportFilterPresence.value;

  const rows = operatorState.exportRows.filter((item) => {
    if (floorFilter && item.floor_code !== floorFilter) return false;
    if (departmentFilter && item.department_name !== departmentFilter) return false;
    if (roomFilter && item.room_id !== roomFilter) return false;
    if (equipmentNeedle) {
      const equipmentText = `${item.position_code || ""} ${item.equipment_name || ""} ${item.display_label || ""}`.toLowerCase();
      if (!equipmentText.includes(equipmentNeedle)) return false;
    }
    if (serialNeedle && !`${item.serial_number || item.serial_state || ""}`.toLowerCase().includes(serialNeedle)) return false;
    if (presence && item.current_presence_status !== presence) return false;
    return true;
  });

  if (!rows.length) {
    operatorUi.exportTableBody.innerHTML = '<tr><td colspan="12">Строк по выбранным фильтрам нет.</td></tr>';
    return;
  }

  operatorUi.exportTableBody.innerHTML = rows.map((item) => `
    <tr class="${getPresenceRowClass(item.current_presence_status)}">
      <td>${escapeHtml(item.floor_code || "—")}</td>
      <td>${escapeHtml(item.department_name || "—")}</td>
      <td>${escapeHtml(item.room_code || "—")} — ${escapeHtml(item.room_name || "—")}</td>
      <td>${escapeHtml(item.position_code)}</td>
      <td>${escapeHtml(item.equipment_name)}</td>
      <td>${escapeHtml(item.display_label)}</td>
      <td>${escapeHtml(item.current_presence_status)}</td>
      <td>${escapeHtml(item.serial_number || item.serial_state)}</td>
      <td>${escapeHtml(item.pnr_status)}</td>
      <td>${escapeHtml(item.communications_status)}</td>
      <td>${escapeHtml(formatDate(item.last_check_at))}</td>
      <td>${escapeHtml(item.last_checked_by_name || "—")}</td>
    </tr>
  `).join("");
}

async function loadUsers() {
  operatorState.users = await fetchJson("/api/users/field-workers");
  const selectedUser = operatorState.users.find((user) => user.user_id === operatorState.selectedUserId);
  if (!operatorState.selectedUserId || !selectedUser || !selectedUser.is_active) {
    operatorState.selectedUserId = getDefaultActiveUserId();
  }
  renderUsers();
  populateEditForm();
}

async function loadAssignments() {
  const selectedUser = operatorState.users.find((item) => item.user_id === operatorState.selectedUserId);
  if (!selectedUser || !selectedUser.is_active) {
    operatorState.selectedUserId = getDefaultActiveUserId();
  }
  if (!operatorState.selectedUserId) {
    operatorUi.selectedUserLabel.textContent = "Выберите сотрудника слева.";
    operatorState.assignmentOptions = null;
    operatorState.assignmentExpansion = {};
    operatorState.assignmentSavedRoomIds = new Set();
    renderAssignmentTree();
    return;
  }
  const user = operatorState.users.find((item) => item.user_id === operatorState.selectedUserId);
  operatorUi.selectedUserLabel.textContent = user ? `Назначения сотрудника: ${user.full_name}` : "Выберите сотрудника слева.";
  operatorUi.assignmentStatus.textContent = "Загружаю назначения…";
  operatorState.assignmentOptions = await fetchJson(`/api/users/field-workers/${operatorState.selectedUserId}/assignments`);
  operatorState.assignmentSavedRoomIds = new Set(operatorState.assignmentOptions.selected_room_ids || []);
  renderAssignmentTree();
  operatorUi.assignmentStatus.textContent = "";
}

async function loadGroups() {
  operatorState.groups = await fetchJson("/api/users/groups");
  renderGroups();
}

async function createGroupFromCurrentSelection() {
  if (!operatorState.selectedUserId) {
    operatorUi.assignmentStatus.textContent = "Сначала выберите сотрудника.";
    return;
  }
  const payload = buildAssignmentPayload();
  const overlapPreview = await fetchJson(`/api/users/field-workers/${operatorState.selectedUserId}/assignment-overlaps`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!overlapPreview.overlap_count) {
    operatorUi.assignmentStatus.textContent = "Для текущих назначений пересечений не найдено.";
    return;
  }
  const decision = await showAssignmentOverlapDialog(overlapPreview);
  if (decision.action !== "merge") {
    operatorUi.assignmentStatus.textContent = "Создание группы отменено.";
    return;
  }
  await fetchJson("/api/users/groups/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      primary_user_id: operatorState.selectedUserId,
      other_user_ids: [...new Set(overlapPreview.overlaps.map((entry) => entry.other_user_id))],
      team_name: decision.teamName || null,
    }),
  });
  operatorUi.assignmentStatus.textContent = "Группа создана или обновлена.";
  await loadGroups();
}

async function saveAssignments() {
  if (!operatorState.selectedUserId) {
    operatorUi.assignmentStatus.textContent = "Сначала выберите сотрудника.";
    return;
  }

  operatorUi.assignmentStatus.textContent = "Сохраняю назначения…";
  const payload = buildAssignmentPayload();

  const repeatRooms = getNewRepeatRooms(payload);
  if (repeatRooms.length) {
    const proceed = await showRepeatCheckDialog(repeatRooms);
    if (!proceed) {
      operatorUi.assignmentStatus.textContent = "Сохранение отменено.";
      return;
    }
  }

  const overlapPreview = await fetchJson(`/api/users/field-workers/${operatorState.selectedUserId}/assignment-overlaps`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (overlapPreview.overlap_count > 0) {
    const decision = await showAssignmentOverlapDialog(overlapPreview);
    if (decision.action !== "merge") {
      operatorUi.assignmentStatus.textContent = "Сохранение отменено из-за пересечений назначений.";
      return;
    }
    await fetchJson("/api/users/groups/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        primary_user_id: operatorState.selectedUserId,
        other_user_ids: [...new Set(overlapPreview.overlaps.map((entry) => entry.other_user_id))],
        team_name: decision.teamName || null,
      }),
    });
  }

  const result = await fetchJson(`/api/users/field-workers/${operatorState.selectedUserId}/assignments`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  operatorUi.assignmentStatus.textContent = `Сохранено. Активных назначений: ${result.active_assignments_count}.`;
  await loadUsers();
  await loadAssignments();
  await loadGroups();
}

async function createUser() {
  const payload = Object.fromEntries(new FormData(operatorUi.createUserForm).entries());
  operatorUi.createUserStatus.textContent = "Создаю сотрудника…";
  try {
    await fetchJson("/api/users/field-workers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    operatorUi.createUserForm.reset();
    operatorUi.createUserStatus.textContent = "Сотрудник создан.";
    await loadUsers();
  } catch (error) {
    operatorUi.createUserStatus.textContent = `Ошибка: ${error.message}`;
  }
}

async function saveEditedUser() {
  if (!operatorState.selectedUserId) {
    operatorUi.editUserStatus.textContent = "Сначала выберите сотрудника.";
    return;
  }
  operatorUi.editUserStatus.textContent = "Сохраняю изменения…";
  await fetchJson(`/api/users/field-workers/${operatorState.selectedUserId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      login: operatorUi.editUserLogin.value.trim(),
      password: operatorUi.editUserPassword.value.trim() || null,
      last_name: operatorUi.editUserLastName.value.trim(),
      first_name: operatorUi.editUserFirstName.value.trim(),
      middle_name: operatorUi.editUserMiddleName.value.trim() || null,
      phone: operatorUi.editUserPhone.value.trim() || null,
      email: operatorUi.editUserEmail.value.trim() || null,
    }),
  });
  operatorUi.editUserStatus.textContent = "Данные сотрудника обновлены.";
  await loadUsers();
  await loadAssignments();
  await loadGroups();
  populateEditForm();
}

async function deleteUser(userId) {
  const user = operatorState.users.find((item) => item.user_id === userId);
  if (!user) return;
  if (!window.confirm(`Удалить сотрудника ${user.full_name}?`)) return;
  await fetchJson(`/api/users/field-workers/${userId}`, { method: "DELETE" });
  if (operatorState.selectedUserId === userId) {
    operatorState.selectedUserId = null;
    operatorState.assignmentOptions = null;
    operatorState.assignmentSavedRoomIds = new Set();
  }
  operatorUi.editUserStatus.textContent = "Сотрудник удален.";
  operatorUi.createUserStatus.textContent = "Сотрудник удален.";
  await loadUsers();
  await loadAssignments();
  await loadGroups();
  if (operatorUi.editUserDialog.open) {
    closeEditDialog();
  }
}

async function restoreUser(userId) {
  const user = operatorState.users.find((item) => item.user_id === userId);
  if (!user) return;
  await fetchJson(`/api/users/field-workers/${userId}/restore`, { method: "POST" });
  operatorUi.editUserStatus.textContent = "Сотрудник восстановлен.";
  operatorUi.createUserStatus.textContent = "Сотрудник восстановлен.";
  await loadUsers();
  await loadAssignments();
}

async function deleteSelectedUser() {
  if (!operatorState.selectedUserId) {
    operatorUi.editUserStatus.textContent = "Сначала выберите сотрудника.";
    return;
  }
  await deleteUser(operatorState.selectedUserId);
}

async function loadControlData() {
  const roomFilter = operatorUi.roomWorklistSelect.value;
  const itemFilter = operatorUi.itemWorklistSelect.value || "unchecked";

  const [roomSummary, itemSummary, rooms, items] = await Promise.all([
    fetchJson("/api/rooms/summary"),
    fetchJson("/api/items/summary"),
    fetchJson(`/api/rooms/${roomFilter ? `?worklist_filter=${encodeURIComponent(roomFilter)}` : ""}`),
    fetchJson(`/api/items?worklist_filter=${encodeURIComponent(itemFilter)}&limit=1000`),
  ]);

  operatorState.roomSummary = roomSummary;
  operatorState.itemSummary = itemSummary;
  operatorState.rooms = rooms;
  operatorState.items = items.items || [];
  renderSummaries();
  populateControlFilters();
  renderRoomList();
  renderItemList();
}

async function loadExportRows() {
  const payload = await fetchJson("/api/items?limit=10000");
  operatorState.exportRows = payload.items || [];
  populateExportFilters();
  renderRoomList();
  renderExportTable();
}

function switchTab(targetId) {
  operatorUi.tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tabTarget === targetId);
  });
  operatorUi.tabPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.id !== targetId);
    panel.classList.toggle("active", panel.id === targetId);
  });
}

async function refreshAll() {
  operatorUi.operatorRefreshButton.disabled = true;
  try {
    await Promise.all([loadUsers(), loadControlData(), loadExportRows(), loadGroups()]);
    await loadAssignments();
    operatorUi.operatorRefreshLabel.textContent = formatDate(new Date().toISOString());
  } catch (error) {
    console.error(error);
    operatorUi.operatorRefreshLabel.textContent = "Ошибка загрузки";
    operatorUi.operatorRoomsList.className = "rooms-list empty-state";
    operatorUi.operatorRoomsList.textContent = "Не удалось загрузить данные операторской панели.";
  } finally {
    operatorUi.operatorRefreshButton.disabled = false;
  }
}

function wireEvents() {
  operatorUi.tabButtons.forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tabTarget));
  });
  operatorUi.operatorRefreshButton.addEventListener("click", () => refreshAll().catch(console.error));
  operatorUi.roomWorklistSelect.addEventListener("change", () => loadControlData().catch(console.error));
  operatorUi.itemWorklistSelect.addEventListener("change", () => loadControlData().catch(console.error));
  operatorUi.controlFloorFilter.addEventListener("change", () => {
    populateControlFilters();
    renderRoomList();
    renderItemList();
  });
  operatorUi.controlDepartmentFilter.addEventListener("change", () => {
    populateControlFilters();
    renderRoomList();
    renderItemList();
  });
  operatorUi.controlRoomFilter.addEventListener("change", () => {
    renderRoomList();
    renderItemList();
  });
  operatorUi.createUserButton.addEventListener("click", () => createUser().catch(console.error));
  operatorUi.closeEditUserButton.addEventListener("click", closeEditDialog);
  operatorUi.saveUserButton.addEventListener("click", () => saveEditedUser().catch(console.error));
  operatorUi.deleteUserButton.addEventListener("click", () => deleteSelectedUser().catch(console.error));
  operatorUi.saveAssignmentsButton.addEventListener("click", () => saveAssignments().catch(console.error));
  operatorUi.createGroupButton.addEventListener("click", () => createGroupFromCurrentSelection().catch(console.error));
  operatorUi.reloadExportButton.addEventListener("click", () => loadExportRows().catch(console.error));
  [operatorUi.exportFilterEquipment, operatorUi.exportFilterSerial].forEach((node) => {
    node.addEventListener("input", renderExportTable);
  });
  operatorUi.exportFilterPresence.addEventListener("change", renderExportTable);
  operatorUi.exportFloorFilter.addEventListener("change", () => {
    populateExportFilters();
    renderExportTable();
  });
  operatorUi.exportDepartmentFilter.addEventListener("change", () => {
    populateExportFilters();
    renderExportTable();
  });
  operatorUi.exportRoomFilter.addEventListener("change", renderExportTable);
}

window.addEventListener("DOMContentLoaded", () => {
  wireEvents();
  refreshAll().catch(console.error);
});
