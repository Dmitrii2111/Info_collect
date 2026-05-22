import { useEffect, useState } from "react";
import { MobileSideDrawer } from "./components/MobileSideDrawer.jsx";
import { MobileDashboardScreen } from "./screens/MobileDashboardScreen.jsx";
import { MobileDepartmentRoomsScreen } from "./screens/MobileDepartmentRoomsScreen.jsx";
import { MobileDiscrepancyDetailsScreen } from "./screens/MobileDiscrepancyDetailsScreen.jsx";
import { MobileDiscrepanciesScreen } from "./screens/MobileDiscrepanciesScreen.jsx";
import { MobileEquipmentDataScreen } from "./screens/MobileEquipmentDataScreen.jsx";
import { MobileHistoryScreen } from "./screens/MobileHistoryScreen.jsx";
import { MobileHelpScreen } from "./screens/MobileHelpScreen.jsx";
import { MobileInspectionsScreen } from "./screens/MobileInspectionsScreen.jsx";
import { MobileItemCardScreen } from "./screens/MobileItemCardScreen.jsx";
import { MobileLoginScreen } from "./screens/MobileLoginScreen.jsx";
import { MobileMoveItemScreen } from "./screens/MobileMoveItemScreen.jsx";
import { MobileObjectStructureScreen } from "./screens/MobileObjectStructureScreen.jsx";
import { MobileObjectsScreen } from "./screens/MobileObjectsScreen.jsx";
import { MobileProfileScreen } from "./screens/MobileProfileScreen.jsx";
import { MobileReceiptBatchesScreen } from "./screens/MobileReceiptBatchesScreen.jsx";
import { MobileReceiptBatchConfirmScreen } from "./screens/MobileReceiptBatchConfirmScreen.jsx";
import { MobileRoomInspectionScreen } from "./screens/MobileRoomInspectionScreen.jsx";
import { MobileSettingsScreen } from "./screens/MobileSettingsScreen.jsx";
import { MobileSyncScreen } from "./screens/MobileSyncScreen.jsx";
import { MobileWarehouseScreen } from "./screens/MobileWarehouseScreen.jsx";
import { MobileWalkthroughRoomsScreen } from "./screens/MobileWalkthroughRoomsScreen.jsx";
import { getMobileDiscrepancyById } from "../domain/discrepancies/index.js";
import {
  getMobileInspectionById,
  getMobileInspectionEquipmentById,
  getMobileInspectionRoomById,
} from "../domain/inspections/index.js";
import {
  getMobileDepartmentById,
  getMobileEquipmentById,
  getMobileObjectStructureById,
  getMobileRoomById,
} from "../domain/objects/index.js";
import {
  getMobileWarehouseItemByCode,
  getMobileWarehouseItemById,
} from "../domain/warehouse/index.js";
import { mobileDashboardData, mobileInspectionsData, mobileObjectsData, mobileProfileData, mobileReceiptBatchesData } from "./data/mobileMockData.js";
import {
  MOBILE_DRAFT_ENTITY_TYPES,
  MOBILE_DRAFT_STATUS,
  MOBILE_DRAFT_TYPES,
  listMobileDrafts,
  listSyncQueueOperations,
} from "../services/offline/index.js";
import { clearMobileSession, getMobileSession, saveMobileSession } from "../services/session/sessionService.js";
import "./styles/mobile.css";

const DEFAULT_MOBILE_USER = {
  name: "Иван Иванов",
  role: "Оператор",
  initials: "ИИ",
};

function getSafeInitialScreen(session) {
  const context = session.context ?? {};

  if (["itemCard", "moveItem"].includes(session.activeScreen) && !context.selectedWarehouseItemId) {
    return "warehouse";
  }

  if (session.activeScreen === "receiptBatchConfirm" && !context.selectedReceiptBatchId) {
    return "receiptBatches";
  }

  if (session.activeScreen === "departmentRooms" && !(context.selectedObjectId && context.selectedFloorId && context.selectedDepartmentId)) {
    return "objects";
  }

  if (
    ["roomInspection", "equipmentData"].includes(session.activeScreen) &&
    !((context.selectedObjectId && context.selectedFloorId && context.selectedDepartmentId && context.selectedRoomId) ||
      (context.selectedInspectionId && context.selectedRoomId))
  ) {
    return context.selectedInspectionId ? "inspections" : "objects";
  }

  if (session.activeScreen === "equipmentData" && !context.selectedEquipmentId) {
    return "roomInspection";
  }

  if (session.activeScreen === "discrepancyDetails" && !context.selectedDiscrepancyId) {
    return "discrepancies";
  }

  return session.activeScreen ?? "dashboard";
}

function getDrawerActiveKey(activeScreen) {
  if (["objects", "objectStructure", "departmentRooms", "roomInspection", "equipmentData"].includes(activeScreen)) {
    return "objects";
  }

  if (["inspections", "walkthroughRooms"].includes(activeScreen)) {
    return "inspections";
  }

  if (["warehouse", "itemCard", "moveItem", "receiptBatches", "receiptBatchConfirm"].includes(activeScreen)) {
    return "warehouse";
  }

  if (activeScreen === "discrepancies" || activeScreen === "discrepancyDetails") {
    return "discrepancies";
  }

  if (activeScreen === "sync") {
    return "sync";
  }

  if (activeScreen === "settings") {
    return "settings";
  }

  if (activeScreen === "help") {
    return "help";
  }

  if (activeScreen === "history") {
    return "history";
  }

  if (activeScreen === "profile") {
    return "profile";
  }

  return "dashboard";
}

function getEquipmentInspectionOverride(savedDraft) {
  const payload = savedDraft?.payload ?? {};
  const statusKey = payload.statusKey ?? payload.preferredStatusKey;
  const selectedReasons = Array.isArray(payload.selectedReasons) ? payload.selectedReasons : [];
  const comment = typeof payload.comment === "string" ? payload.comment.trim() : "";

  if (["issue", "mismatch", "discrepancy"].includes(statusKey) || selectedReasons.length > 0) {
    return {
      status: "Есть расхождение",
      tone: "error",
      note: selectedReasons[0] || comment || "Требуется сверка",
      updatedAt: savedDraft?.updatedAt ?? null,
    };
  }

  if (["notFound", "missing"].includes(statusKey)) {
    return {
      status: "Не найдено",
      tone: "error",
      note: comment || "Оборудование не найдено",
      updatedAt: savedDraft?.updatedAt ?? null,
    };
  }

  if (statusKey === "found" || payload.preferredStatusKey === "found") {
    return {
      status: "Подтверждено",
      tone: "success",
      note: comment || "Проверено локально",
      updatedAt: savedDraft?.updatedAt ?? null,
    };
  }

  return {
    status: "В работе",
    tone: "active",
    note: "Черновик сохранен локально",
    updatedAt: savedDraft?.updatedAt ?? null,
  };
}

function applyEquipmentInspectionOverrides(room, overrides) {
  if (!room?.equipment?.length) {
    return room;
  }

  const equipment = room.equipment.map((item) => (overrides[item.id] ? { ...item, ...overrides[item.id] } : item));
  const checkedCount = equipment.filter((item) => (
    item.status === "Подтверждено" ||
    item.status === "Есть расхождение" ||
    item.status === "Не найдено"
  )).length;
  const totalCount = equipment.length;
  const progressValue = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return {
    ...room,
    progress: `${checkedCount} из ${totalCount} позиций проверено`,
    progressValue,
    equipment,
  };
}

function getCheckedEquipmentCount(equipment = []) {
  return equipment.filter((item) => (
    item.status === "Подтверждено" ||
    item.status === "Есть расхождение" ||
    item.status === "Не найдено"
  )).length;
}

function getEquipmentProblemCount(equipment = []) {
  return equipment.filter((item) => item.status === "Есть расхождение" || item.tone === "error").length;
}

function getRoomWithComputedInspectionState(room, overrides) {
  const nextRoom = applyEquipmentInspectionOverrides(room, overrides);

  if (!nextRoom?.equipment?.length) {
    return nextRoom;
  }

  const checkedCount = getCheckedEquipmentCount(nextRoom.equipment);
  const problemCount = getEquipmentProblemCount(nextRoom.equipment);
  const hasIssue = problemCount > 0;
  const isComplete = checkedCount === nextRoom.equipment.length;

  return {
    ...nextRoom,
    checkedCount,
    problemCount,
    state: isComplete ? (hasIssue ? "error" : "complete") : checkedCount > 0 ? "active" : "empty",
    status: isComplete ? (hasIssue ? "Есть расхождения" : "Завершено") : checkedCount > 0 ? "В работе" : "Не начато",
    statusKey: isComplete ? (hasIssue ? "Расхождения" : "Завершено") : checkedCount > 0 ? "В работе" : "Не начато",
    action: checkedCount > 0 ? "Продолжить осмотр" : "Начать осмотр",
    notes: hasIssue ? [`${problemCount} расх.`] : checkedCount > 0 ? ["Есть локальные изменения"] : [],
  };
}

function applyDepartmentInspectionOverrides(department, overrides) {
  if (!department?.rooms?.length) {
    return department;
  }

  const rooms = department.rooms.map((room) => getRoomWithComputedInspectionState(room, overrides));
  const checkedRooms = rooms.filter((room) => room.state === "complete" || room.state === "error").length;
  const activeRooms = rooms.filter((room) => room.state === "active").length;
  const problemCount = rooms.reduce((sum, room) => sum + (room.problemCount ?? getEquipmentProblemCount(room.equipment ?? [])), 0);
  const totalEquipment = rooms.reduce((sum, room) => sum + (room.equipment?.length ?? 0), 0);
  const checkedEquipment = rooms.reduce((sum, room) => sum + getCheckedEquipmentCount(room.equipment ?? []), 0);
  const progressValue = totalEquipment > 0 ? Math.round((checkedEquipment / totalEquipment) * 100) : 0;
  const isComplete = totalEquipment > 0 && checkedEquipment === totalEquipment;
  const isStarted = checkedEquipment > 0 || activeRooms > 0;

  return {
    ...department,
    rooms,
    status: isComplete ? "Завершено" : isStarted ? "В работе" : "Не начато",
    progress: `${checkedEquipment} из ${totalEquipment}`,
    checkedCount: checkedEquipment,
    problemCount,
    stats: [
      { label: "Объекты", values: [`${rooms.length} Помещения`, `${totalEquipment} Позиции`] },
      { label: "Статус", values: [`${problemCount} Проблем`, `${checkedEquipment} проверено`], tone: problemCount > 0 ? "warning" : "default" },
    ],
    progressSummary: { value: progressValue, detail: `${checkedEquipment} из ${totalEquipment}` },
  };
}

function applyInspectionOverrides(inspection, overrides) {
  if (!inspection?.walkthrough?.rooms?.length) {
    return inspection;
  }

  const rooms = inspection.walkthrough.rooms.map((room) => getRoomWithComputedInspectionState(room, overrides));

  return {
    ...inspection,
    walkthrough: {
      ...inspection.walkthrough,
      rooms,
    },
  };
}

function getMobileFieldSessionContext(user) {
  return {
    workerLogin: user?.workerLogin ?? user?.login ?? null,
    workerFullName: user?.workerFullName ?? user?.name ?? null,
    deviceUid: user?.deviceUid ?? user?.device?.deviceUid ?? null,
    platform: user?.platform ?? user?.device?.platform ?? null,
    appVersion: user?.appVersion ?? user?.device?.appVersion ?? null,
  };
}

function createDashboardData(department) {
  if (!department?.rooms?.length) {
    return mobileDashboardData;
  }

  const totalRooms = department.rooms.length;
  const totalEquipment = department.rooms.reduce((sum, room) => sum + (room.equipment?.length ?? 0), 0);
  const checkedEquipment = department.rooms.reduce((sum, room) => sum + getCheckedEquipmentCount(room.equipment ?? []), 0);
  const problemCount = department.rooms.reduce((sum, room) => sum + (room.problemCount ?? getEquipmentProblemCount(room.equipment ?? [])), 0);
  const isStarted = checkedEquipment > 0;
  const isComplete = totalEquipment > 0 && checkedEquipment === totalEquipment;
  const startedRooms = department.rooms.filter((room) => (room.checkedCount ?? getCheckedEquipmentCount(room.equipment ?? [])) > 0).length;

  return {
    ...mobileDashboardData,
    syncSummary: {
      status: "Онлайн",
      pending: checkedEquipment > 0 ? `${checkedEquipment} изменений ожидают отправки` : "Нет локальных изменений",
    },
    currentWalkthrough: isStarted ? {
      title: "Текущий обход",
      location: `${department.context} • ${department.title}`,
      checkedRooms: startedRooms,
      totalRooms,
      progress: department.progressSummary?.value ?? 0,
      discrepancies: problemCount,
      pendingChanges: checkedEquipment,
    } : null,
    zones: [
      {
        key: department.id,
        title: `${department.context} • ${department.title}`,
        progress: `${totalRooms} помещения • ${totalEquipment} позиций`,
        status: isComplete ? "Завершено" : isStarted ? "В работе" : "Не начато",
        tone: problemCount > 0 ? "error" : isStarted ? "primary" : "neutral",
      },
    ],
    recentActions: [],
  };
}

function createObjectsData(department) {
  if (!department?.rooms?.length) {
    return mobileObjectsData;
  }

  const totalRooms = department.rooms.length;
  const totalEquipment = department.rooms.reduce((sum, room) => sum + (room.equipment?.length ?? 0), 0);
  const checkedEquipment = department.rooms.reduce((sum, room) => sum + getCheckedEquipmentCount(room.equipment ?? []), 0);
  const problemCount = department.rooms.reduce((sum, room) => sum + (room.problemCount ?? getEquipmentProblemCount(room.equipment ?? [])), 0);
  const isStarted = checkedEquipment > 0;

  return {
    ...mobileObjectsData,
    summary: {
      ...mobileObjectsData.summary,
      actionLabel: isStarted ? "Продолжить обход" : "Начать обход",
      stats: [
        { label: "Зоны", value: "1", tone: "default" },
        { label: "Помещения", value: String(totalRooms), tone: "default" },
        { label: "Позиции", value: String(totalEquipment), tone: "default" },
        { label: "Проблемы", value: String(problemCount), tone: problemCount > 0 ? "warning" : "default" },
      ],
    },
    objects: mobileObjectsData.objects.slice(0, 1).map((object) => ({
      ...object,
      title: department.context?.split(" • ")[0] ?? object.title,
      subtitle: department.context,
      description: department.title,
      status: isStarted ? "В работе" : "Не начато",
      tone: isStarted ? "primary" : "neutral",
      progressLabel: `${checkedEquipment} из ${totalEquipment} позиций проверено`,
      progressValue: totalEquipment > 0 ? Math.round((checkedEquipment / totalEquipment) * 100) : 0,
      details: [
        { label: `${totalRooms} помещения`, tone: "muted" },
        { label: `${totalEquipment} позиций`, tone: "muted" },
      ],
      action: isStarted ? "Продолжить обход" : "Начать обход",
    })),
    recentZones: [`${department.context} • ${department.title}`],
  };
}

function createInspectionsData(department) {
  if (!department?.rooms?.length) {
    return mobileInspectionsData;
  }

  const totalRooms = department.rooms.length;
  const totalEquipment = department.rooms.reduce((sum, room) => sum + (room.equipment?.length ?? 0), 0);
  const checkedEquipment = department.rooms.reduce((sum, room) => sum + getCheckedEquipmentCount(room.equipment ?? []), 0);
  const checkedRooms = department.rooms.filter((room) => (room.checkedCount ?? getCheckedEquipmentCount(room.equipment ?? [])) > 0).length;
  const problemCount = department.rooms.reduce((sum, room) => sum + (room.problemCount ?? getEquipmentProblemCount(room.equipment ?? [])), 0);
  const progressValue = totalEquipment > 0 ? Math.round((checkedEquipment / totalEquipment) * 100) : 0;
  const isStarted = checkedEquipment > 0;
  const isComplete = totalEquipment > 0 && checkedEquipment === totalEquipment;
  const status = isComplete ? "Завершено" : isStarted ? "В работе" : "Ожидание";
  const baseInspection = mobileInspectionsData.inspections[0];

  return {
    ...mobileInspectionsData,
    summary: {
      ...mobileInspectionsData.summary,
      total: "1 инспекция",
    },
    syncAlert: {
      ...mobileInspectionsData.syncAlert,
      title: checkedEquipment > 0 ? "Есть неотправленные изменения" : "Нет неотправленных изменений",
      text: checkedEquipment > 0 ? `${checkedEquipment} изменений ожидают отправки` : "Очередь по назначенной инспекции пуста",
    },
    inspections: [
      {
        ...baseInspection,
        title: department.context,
        context: department.title,
        status,
        statusKey: status,
        statusType: isComplete ? "completed" : isStarted ? "active" : "pending",
        progressLabel: `${checkedEquipment} из ${totalEquipment} позиций`,
        progressValue,
        action: isStarted ? "Продолжить" : "Начать",
        walkthrough: {
          ...baseInspection.walkthrough,
          title: department.context,
          context: department.title,
          progressLabel: `${checkedEquipment} из ${totalEquipment} позиций проверено`,
          progressValue,
          continueLabel: isStarted ? "Продолжить обход" : "Начать обход",
          metrics: [
            { label: "Всего", value: String(totalRooms), suffix: "пом.", tone: "default" },
            { label: "Позиции", value: String(totalEquipment), tone: "default" },
            { label: "Проверено", value: String(checkedEquipment), tone: "success" },
            { label: "С расхождениями", value: String(problemCount), tone: "error" },
            { label: "Не начато", value: String(Math.max(totalRooms - checkedRooms, 0)), tone: "default" },
          ],
          rooms: department.rooms,
        },
        stats: [
          { label: `${totalRooms} помещения`, tone: "default", icon: "rooms" },
          { label: `${totalEquipment} позиций`, tone: "default", icon: "inventory" },
          { label: `${problemCount} расхождений`, tone: problemCount > 0 ? "error" : "default", icon: "warning" },
          { label: `${checkedEquipment} изменений не отправлено`, tone: checkedEquipment > 0 ? "warning" : "default", icon: "sync" },
        ],
      },
    ],
  };
}

function createObjectStructureData(structure, department) {
  if (!department?.rooms?.length) {
    return structure;
  }

  const totalRooms = department.rooms.length;
  const totalEquipment = department.rooms.reduce((sum, room) => sum + (room.equipment?.length ?? 0), 0);
  const checkedEquipment = department.rooms.reduce((sum, room) => sum + getCheckedEquipmentCount(room.equipment ?? []), 0);
  const problemCount = department.rooms.reduce((sum, room) => sum + (room.problemCount ?? getEquipmentProblemCount(room.equipment ?? [])), 0);
  const floorTitle = department.context?.split(" • ")[1] ?? "Этаж";
  const progressValue = totalEquipment > 0 ? Math.round((checkedEquipment / totalEquipment) * 100) : 0;
  const statusType = progressValue >= 100
    ? (problemCount > 0 ? "discrepancy" : "completed")
    : checkedEquipment > 0
      ? (problemCount > 0 ? "discrepancy" : "inProgress")
      : "notStarted";

  return {
    ...structure,
    title: department.context?.split(" • ")[0] ?? structure?.title,
    pendingLabel: checkedEquipment > 0 ? `${checkedEquipment} не отправлено` : "Нет изменений",
    stats: [
      { label: "1 этаж", value: `${totalRooms} помещения`, tone: "default" },
      { label: `${totalEquipment} позиций`, value: `${problemCount} расхождений`, tone: problemCount > 0 ? "error" : "default" },
    ],
    progress: {
      label: `${checkedEquipment} из ${totalEquipment} позиций проверено`,
      value: progressValue,
    },
    floors: [
      {
        id: department.floorId ?? "floor-2",
        title: floorTitle,
        statusLine: `${totalRooms} помещения • ${department.status}`,
        statusType,
        summary: [`${checkedEquipment} из ${totalEquipment} позиций`, `${problemCount} расх.`],
        departments: [department],
      },
    ],
  };
}

function getSyncQueueCounts(operations = []) {
  return operations.reduce((counts, operation) => {
    const status = operation.status ?? "queued";

    return {
      ...counts,
      [status]: (counts[status] ?? 0) + 1,
      total: counts.total + 1,
    };
  }, {
    cancelled: 0,
    conflict: 0,
    failed: 0,
    queued: 0,
    synced: 0,
    syncing: 0,
    total: 0,
  });
}

function createProfileData(department, queueOperations) {
  if (!department?.rooms?.length) {
    return mobileProfileData;
  }

  const totalRooms = department.rooms.length;
  const totalEquipment = department.rooms.reduce((sum, room) => sum + (room.equipment?.length ?? 0), 0);
  const checkedEquipment = department.rooms.reduce((sum, room) => sum + getCheckedEquipmentCount(room.equipment ?? []), 0);
  const checkedRooms = department.rooms.filter((room) => (room.checkedCount ?? getCheckedEquipmentCount(room.equipment ?? [])) > 0).length;
  const problemCount = department.rooms.reduce((sum, room) => sum + (room.problemCount ?? getEquipmentProblemCount(room.equipment ?? [])), 0);
  const queueCounts = getSyncQueueCounts(queueOperations);
  const pendingCount = queueCounts.queued + queueCounts.syncing;
  const errorCount = queueCounts.failed + queueCounts.cancelled;
  const progress = totalEquipment > 0 ? Math.round((checkedEquipment / totalEquipment) * 100) : 0;
  const isStarted = checkedEquipment > 0;
  const isComplete = totalEquipment > 0 && checkedEquipment === totalEquipment;
  const zoneStatus = isComplete ? "Завершено" : isStarted ? "В работе" : "Не начато";

  return {
    ...mobileProfileData,
    today: {
      stats: [
        { label: "Помещения", value: `${checkedRooms} из ${totalRooms}`, tone: "neutral" },
        { label: "Позиции", value: `${checkedEquipment} из ${totalEquipment}`, tone: "neutral" },
        { label: "Расхождения", value: String(problemCount), tone: problemCount > 0 ? "warning" : "neutral" },
        { label: "В очереди", value: `${pendingCount + errorCount + queueCounts.conflict} изменений`, tone: "primary" },
      ],
      current: isStarted ? `Работа ведется в ${department.context} • ${department.title}` : "Назначенный обход еще не начат",
      canContinue: isStarted,
    },
    sync: {
      status: pendingCount + errorCount + queueCounts.conflict > 0 ? "Есть локальные изменения" : "Очередь пуста",
      pending: `${pendingCount} ожидают отправки`,
      conflicts: `${queueCounts.conflict} конфликтов`,
      errors: `${errorCount} ошибок отправки`,
      synced: `${queueCounts.synced} отправлено`,
    },
    zones: [
      {
        id: department.id,
        title: department.context,
        subtitle: `${department.title} • ${totalRooms} помещения • ${totalEquipment} позиции`,
        status: zoneStatus,
        tone: problemCount > 0 ? "warning" : isStarted ? "primary" : "neutral",
        progress,
        progressLabel: `${checkedEquipment} из ${totalEquipment} позиций`,
        warning: problemCount > 0 ? `${problemCount} расх.` : null,
      },
    ],
  };
}

export function MobileShell() {
  const savedSession = getMobileSession();
  const savedContext = savedSession.context ?? {};
  const mobileFieldSessionContext = getMobileFieldSessionContext(savedSession.user);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(savedSession.authenticated));
  const [activeScreen, setActiveScreen] = useState(getSafeInitialScreen(savedSession));
  const [selectedObjectId, setSelectedObjectId] = useState(savedContext.selectedObjectId ?? null);
  const [selectedFloorId, setSelectedFloorId] = useState(savedContext.selectedFloorId ?? null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(savedContext.selectedDepartmentId ?? null);
  const [selectedRoomId, setSelectedRoomId] = useState(savedContext.selectedRoomId ?? null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(savedContext.selectedEquipmentId ?? null);
  const [selectedInspectionId, setSelectedInspectionId] = useState(savedContext.selectedInspectionId ?? null);
  const [selectedWarehouseItemId, setSelectedWarehouseItemId] = useState(savedContext.selectedWarehouseItemId ?? null);
  const [selectedReceiptBatchId, setSelectedReceiptBatchId] = useState(savedContext.selectedReceiptBatchId ?? null);
  const [receiptBatches, setReceiptBatches] = useState(mobileReceiptBatchesData);
  const [persistedEquipmentInspectionOverrides, setPersistedEquipmentInspectionOverrides] = useState({});
  const [equipmentInspectionOverrides, setEquipmentInspectionOverrides] = useState({});
  const [selectedDiscrepancyId, setSelectedDiscrepancyId] = useState(savedContext.selectedDiscrepancyId ?? null);
  const [discrepancySource, setDiscrepancySource] = useState(savedContext.discrepancySource ?? "dashboard");
  const [syncSource, setSyncSource] = useState(savedContext.syncSource ?? "profile");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [syncQueueOperations, setSyncQueueOperations] = useState([]);

  const handleLogin = () => {
    const user = DEFAULT_MOBILE_USER;

    setIsAuthenticated(true);
    setActiveScreen("dashboard");

    saveMobileSession({ authenticated: true, activeScreen: "dashboard", user, context: {} });
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    saveMobileSession({
      authenticated: true,
      activeScreen,
      user: savedSession.user ?? DEFAULT_MOBILE_USER,
      context: {
        selectedObjectId,
        selectedFloorId,
        selectedDepartmentId,
        selectedRoomId,
        selectedEquipmentId,
        selectedInspectionId,
        selectedWarehouseItemId,
        selectedReceiptBatchId,
        selectedDiscrepancyId,
        discrepancySource,
        syncSource,
      },
    });
  }, [
    activeScreen,
    discrepancySource,
    isAuthenticated,
    selectedDepartmentId,
    selectedDiscrepancyId,
    selectedEquipmentId,
    selectedFloorId,
    selectedInspectionId,
    selectedObjectId,
    selectedReceiptBatchId,
    selectedRoomId,
    selectedWarehouseItemId,
    syncSource,
  ]);

  const handleLogout = () => {
    clearMobileSession();
    setIsDrawerOpen(false);
    setIsAuthenticated(false);
    setActiveScreen("dashboard");
  };

  const handleNavSelect = (screenKey) => {
    if (
      screenKey === "dashboard" ||
      screenKey === "objects" ||
      screenKey === "inspections" ||
      screenKey === "warehouse" ||
      screenKey === "profile"
    ) {
      setActiveScreen(screenKey);
    }
  };

  const handleDrawerSelect = (item) => {
    setIsDrawerOpen(false);

    if (item.key === "logout") {
      handleLogout();
      return;
    }

    if (item.key === "help") {
      setActiveScreen("help");
      return;
    }

    if (!item.screen) {
      return;
    }

    if (item.screen === "sync") {
      handleOpenSync("profile");
      return;
    }

    if (item.screen === "discrepancies") {
      handleOpenDiscrepancies();
      return;
    }

    setActiveScreen(item.screen);
  };

  const handleContinueWalkthrough = () => {
    setSelectedObjectId("building-a");
    setSelectedFloorId("floor-2");
    setSelectedDepartmentId("emergency");
    setSelectedRoomId(null);
    setActiveScreen("departmentRooms");
  };

  const handleContinueRoomInspection = () => {
    setSelectedObjectId("building-a");
    setSelectedFloorId("floor-2");
    setSelectedDepartmentId("emergency");
    setSelectedRoomId("fixture-room-1-01-9");
    setActiveScreen("roomInspection");
  };

  const handleOpenDepartment = (floorId, departmentId) => {
    setSelectedFloorId(floorId);
    setSelectedDepartmentId(departmentId);
    setSelectedRoomId(null);
    setActiveScreen("departmentRooms");
  };

  const handleOpenRoom = (roomId) => {
    setSelectedRoomId(roomId);
    setSelectedEquipmentId(null);
    setActiveScreen("roomInspection");
  };

  const handleOpenInspectionRoom = (roomId) => {
    setSelectedFloorId(null);
    setSelectedDepartmentId(null);
    setSelectedRoomId(roomId);
    setSelectedEquipmentId(null);
    setActiveScreen("roomInspection");
  };

  const handleOpenEquipment = (equipmentId) => {
    setSelectedEquipmentId(equipmentId);
    setActiveScreen("equipmentData");
  };

  const handleOpenNextEquipment = () => {
    const equipmentList = selectedRoom?.equipment ?? [];
    const currentIndex = equipmentList.findIndex((item) => item.id === selectedEquipmentId);
    const nextEquipment = equipmentList[currentIndex + 1];

    if (!nextEquipment) {
      return false;
    }

    setSelectedEquipmentId(nextEquipment.id);
    return true;
  };

  const handleFinishEquipmentRoom = () => {
    setActiveScreen(isInspectionRoomFlow ? "walkthroughRooms" : "departmentRooms");
  };

  const handleEquipmentInspectionSaved = (savedDraft) => {
    const equipmentId = savedDraft?.context?.equipmentId ?? savedDraft?.entityId;

    if (!equipmentId) {
      return;
    }

    setEquipmentInspectionOverrides((currentOverrides) => ({
      ...currentOverrides,
      [equipmentId]: getEquipmentInspectionOverride(savedDraft),
    }));
  };

  const handleOpenObjectStructure = (objectId) => {
    setSelectedObjectId(objectId);
    setSelectedFloorId(null);
    setSelectedDepartmentId(null);
    setActiveScreen("objectStructure");
  };

  const handleOpenInspection = (inspectionId) => {
    setSelectedInspectionId(inspectionId);
    setSelectedRoomId(null);
    setSelectedEquipmentId(null);
    setActiveScreen("walkthroughRooms");
  };

  const handleOpenWarehouseItem = (itemId) => {
    setSelectedWarehouseItemId(itemId);
    setActiveScreen("itemCard");
  };

  const handleMoveWarehouseItem = () => {
    setActiveScreen("moveItem");
  };

  const handleOpenReceiptBatches = () => {
    setSelectedReceiptBatchId(null);
    setActiveScreen("receiptBatches");
  };

  const handleOpenReceiptBatchConfirm = (batchId) => {
    setSelectedReceiptBatchId(batchId);
    setActiveScreen("receiptBatchConfirm");
  };

  const handleUpdateReceiptBatchStatus = (batchId, nextStatus) => {
    setReceiptBatches((currentBatches) =>
      currentBatches.map((batch) => (batch.id === batchId ? { ...batch, status: nextStatus } : batch)),
    );
  };

  const handleCompleteReceiptBatch = ({ batchId, status }) => {
    handleUpdateReceiptBatchStatus(batchId, status);
    setSelectedReceiptBatchId(null);
    setActiveScreen("receiptBatches");
  };

  const handleOpenDiscrepancies = () => {
    setActiveScreen("discrepancies");
  };

  const handleOpenSync = (source = "dashboard") => {
    setSyncSource(source);
    setActiveScreen("sync");
  };

  const handleBackFromSync = () => {
    setActiveScreen(syncSource || "profile");
  };

  const handleOpenDashboardZone = (zone) => {
    if (zone.key === "diagnostics") {
      setSelectedObjectId("building-a");
      setSelectedFloorId("floor-3");
      setSelectedDepartmentId("diagnostics");
      setSelectedRoomId(null);
      setActiveScreen("departmentRooms");
      return;
    }

    if (zone.key === "warehouse") {
      setActiveScreen("warehouse");
      return;
    }

    handleContinueWalkthrough();
  };

  const handleOpenDiscrepancyDetails = (discrepancyId, source = "discrepancies") => {
    setSelectedDiscrepancyId(discrepancyId);
    setDiscrepancySource(source);
    setActiveScreen("discrepancyDetails");
  };

  const handleOpenDiscrepancyItem = (itemCode) => {
    const item = getMobileWarehouseItemByCode(itemCode);

    if (!item) {
      return;
    }

    setSelectedWarehouseItemId(item.id);
    setActiveScreen("itemCard");
  };

  const handleBackFromDiscrepancyDetails = () => {
    setActiveScreen(discrepancySource === "itemCard" ? "itemCard" : "discrepancies");
  };

  const selectedStructureBase = getMobileObjectStructureById(selectedObjectId) ?? getMobileObjectStructureById("building-a");
  const selectedDepartmentBase = getMobileDepartmentById(selectedObjectId, selectedDepartmentId);
  const fixtureDepartmentBase = getMobileDepartmentById("building-a", "emergency");
  const selectedInspectionBase = getMobileInspectionById(selectedInspectionId);
  const selectedInspectionRoomBase = getMobileInspectionRoomById(selectedInspectionId, selectedRoomId);
  const selectedRoom = selectedDepartmentBase ? getMobileRoomById(selectedObjectId, selectedDepartmentId, selectedRoomId) : selectedInspectionRoomBase;
  useEffect(() => {
    let isCancelled = false;

    listMobileDrafts()
      .then((drafts) => {
        if (isCancelled) {
          return;
        }

        const nextOverrides = drafts
          .filter((draft) => (
            draft.type === MOBILE_DRAFT_TYPES.EQUIPMENT_DATA &&
            draft.entityType === MOBILE_DRAFT_ENTITY_TYPES.equipment &&
            [
              MOBILE_DRAFT_STATUS.readyToQueue,
              MOBILE_DRAFT_STATUS.queued,
              "failed",
            ].includes(draft.status)
          ))
          .reduce((overrides, draft) => {
            const equipmentId = draft.context?.equipmentId ?? draft.entityId;

            if (!equipmentId) {
              return overrides;
            }

            return {
              ...overrides,
              [equipmentId]: getEquipmentInspectionOverride(draft),
            };
          }, {});

        setPersistedEquipmentInspectionOverrides(nextOverrides);
      })
      .catch(() => {
        if (!isCancelled) {
          setPersistedEquipmentInspectionOverrides({});
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    listSyncQueueOperations()
      .then((operations) => {
        if (!isCancelled) {
          setSyncQueueOperations(operations);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setSyncQueueOperations([]);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [activeScreen]);

  const equipmentInspectionOverrideMap = {
    ...persistedEquipmentInspectionOverrides,
    ...equipmentInspectionOverrides,
  };
  const selectedDepartment = applyDepartmentInspectionOverrides(selectedDepartmentBase, equipmentInspectionOverrideMap);
  const fixtureDepartment = applyDepartmentInspectionOverrides(fixtureDepartmentBase, equipmentInspectionOverrideMap);
  const inspectionsData = createInspectionsData(fixtureDepartment);
  const selectedInspection = inspectionsData.inspections.find((inspection) => inspection.id === selectedInspectionId) ??
    applyInspectionOverrides(selectedInspectionBase, equipmentInspectionOverrideMap);
  const selectedInspectionRoom = selectedInspection?.walkthrough?.rooms?.find((room) => room.id === selectedRoomId) ?? selectedInspectionRoomBase;
  const selectedRoomWithEquipmentOverrides = selectedDepartment
    ? selectedDepartment.rooms?.find((room) => (room.id ?? room.title) === selectedRoomId) ?? null
    : selectedInspectionRoom;
  const dashboardData = createDashboardData(selectedDepartment ?? fixtureDepartment);
  const objectsData = createObjectsData(selectedDepartment ?? fixtureDepartment);
  const profileData = createProfileData(selectedDepartment ?? fixtureDepartment, syncQueueOperations);
  const selectedStructure = createObjectStructureData(
    selectedStructureBase,
    selectedDepartment ?? fixtureDepartment,
  );
  const selectedEquipment = selectedRoomWithEquipmentOverrides?.equipment?.find((item) => item.id === selectedEquipmentId) ?? (selectedDepartment
    ? getMobileEquipmentById(selectedObjectId, selectedDepartmentId, selectedRoomId, selectedEquipmentId)
    : getMobileInspectionEquipmentById(selectedInspectionId, selectedRoomId, selectedEquipmentId));
  const selectedWarehouseItem = getMobileWarehouseItemById(selectedWarehouseItemId);
  const selectedReceiptBatch = receiptBatches.find((batch) => batch.id === selectedReceiptBatchId) ?? null;
  const selectedDiscrepancy = getMobileDiscrepancyById(selectedDiscrepancyId);
  const roomInspectionContext = selectedDepartment ?? {
    context: selectedInspection?.walkthrough?.context,
  };
  const isInspectionRoomFlow = !selectedDepartment && Boolean(selectedInspectionRoom);

  const activeContent =
    activeScreen === "equipmentData" ? (
      <MobileEquipmentDataScreen
        activeNavKey={isInspectionRoomFlow ? "inspections" : "objects"}
        department={roomInspectionContext}
        equipment={selectedEquipment}
        fieldSession={mobileFieldSessionContext}
        room={selectedRoomWithEquipmentOverrides}
        onBack={() => setActiveScreen("roomInspection")}
        onEquipmentInspectionSaved={handleEquipmentInspectionSaved}
        onFinishRoom={handleFinishEquipmentRoom}
        onOpenNextEquipment={handleOpenNextEquipment}
        onNavSelect={handleNavSelect}
      />
    ) : activeScreen === "roomInspection" ? (
      <MobileRoomInspectionScreen
        activeNavKey={isInspectionRoomFlow ? "inspections" : "objects"}
        department={roomInspectionContext}
        room={selectedRoomWithEquipmentOverrides}
        onBack={() => setActiveScreen(isInspectionRoomFlow ? "walkthroughRooms" : "departmentRooms")}
        onOpenEquipment={handleOpenEquipment}
        onNavSelect={handleNavSelect}
      />
    ) : activeScreen === "departmentRooms" ? (
      <MobileDepartmentRoomsScreen
        activeNavKey="objects"
        department={selectedDepartment}
        onBack={() => setActiveScreen("objectStructure")}
        onOpenRoom={handleOpenRoom}
        onOpenSync={() => handleOpenSync("objects")}
        onNavSelect={handleNavSelect}
      />
    ) : activeScreen === "objectStructure" ? (
      <MobileObjectStructureScreen
        activeNavKey="objects"
        structure={selectedStructure}
        onBack={() => setActiveScreen("objects")}
        initialExpandedFloorId={selectedFloorId}
        onContinueWalkthrough={handleContinueWalkthrough}
        onOpenDepartment={handleOpenDepartment}
        onNavSelect={handleNavSelect}
      />
    ) : activeScreen === "objects" ? (
      <MobileObjectsScreen
        activeNavKey="objects"
        objectsData={objectsData}
        onOpenMenu={() => setIsDrawerOpen(true)}
        onContinueWalkthrough={handleContinueWalkthrough}
        onOpenObjectStructure={handleOpenObjectStructure}
        onOpenRecentZone={(zoneIndex) => {
          if (zoneIndex === 1) {
            setSelectedObjectId("building-a");
            setSelectedFloorId("floor-3");
            setSelectedDepartmentId("diagnostics");
            setActiveScreen("departmentRooms");
            return;
          }

          if (zoneIndex === 2) {
            setActiveScreen("warehouse");
            return;
          }

          handleContinueWalkthrough();
        }}
        onNavSelect={handleNavSelect}
      />
    ) : activeScreen === "inspections" ? (
      <MobileInspectionsScreen
        activeNavKey="inspections"
        inspectionsData={inspectionsData}
        selectedInspectionId={selectedInspectionId}
        onOpenMenu={() => setIsDrawerOpen(true)}
        onOpenInspection={handleOpenInspection}
        onOpenSync={() => handleOpenSync("inspections")}
        onNavSelect={handleNavSelect}
      />
    ) : activeScreen === "walkthroughRooms" ? (
      <MobileWalkthroughRoomsScreen
        activeNavKey="inspections"
        inspection={selectedInspection}
        onBack={() => setActiveScreen("inspections")}
        onOpenRoom={handleOpenInspectionRoom}
        onNavSelect={handleNavSelect}
      />
    ) : activeScreen === "warehouse" ? (
      <MobileWarehouseScreen
        activeNavKey="warehouse"
        onOpenMenu={() => setIsDrawerOpen(true)}
        onOpenItem={handleOpenWarehouseItem}
        onOpenReceiptBatches={handleOpenReceiptBatches}
        onNavSelect={handleNavSelect}
      />
    ) : activeScreen === "itemCard" ? (
      <MobileItemCardScreen
        activeNavKey="warehouse"
        item={selectedWarehouseItem}
        onBack={() => setActiveScreen("warehouse")}
        onMoveItem={handleMoveWarehouseItem}
        onOpenDiscrepancy={(discrepancyId) => handleOpenDiscrepancyDetails(discrepancyId, "itemCard")}
        onNavSelect={handleNavSelect}
      />
    ) : activeScreen === "moveItem" ? (
      <MobileMoveItemScreen
        activeNavKey="warehouse"
        item={selectedWarehouseItem}
        onBack={() => setActiveScreen("itemCard")}
        onNavSelect={handleNavSelect}
      />
    ) : activeScreen === "receiptBatches" ? (
      <MobileReceiptBatchesScreen
        activeNavKey="warehouse"
        batches={receiptBatches}
        onBack={() => setActiveScreen("warehouse")}
        onOpenBatch={handleOpenReceiptBatchConfirm}
        onNavSelect={handleNavSelect}
      />
    ) : activeScreen === "receiptBatchConfirm" ? (
      selectedReceiptBatch ? (
        <MobileReceiptBatchConfirmScreen
          activeNavKey="warehouse"
          batch={selectedReceiptBatch}
          onBack={() => setActiveScreen("receiptBatches")}
          onCompleteReceiptBatch={handleCompleteReceiptBatch}
          onNavSelect={handleNavSelect}
          onSaveReceiptBatchDraft={handleUpdateReceiptBatchStatus}
        />
      ) : (
        <MobileReceiptBatchesScreen
          activeNavKey="warehouse"
          batches={receiptBatches}
          onBack={() => setActiveScreen("warehouse")}
          onOpenBatch={handleOpenReceiptBatchConfirm}
          onNavSelect={handleNavSelect}
        />
      )
    ) : activeScreen === "discrepancies" ? (
      <MobileDiscrepanciesScreen
        activeNavKey="dashboard"
        onBack={() => setActiveScreen("dashboard")}
        onOpenDiscrepancy={(discrepancyId) => handleOpenDiscrepancyDetails(discrepancyId, "discrepancies")}
        onNavSelect={handleNavSelect}
      />
    ) : activeScreen === "discrepancyDetails" ? (
      <MobileDiscrepancyDetailsScreen
        activeNavKey={discrepancySource === "itemCard" ? "warehouse" : "dashboard"}
        discrepancy={selectedDiscrepancy}
        onBack={handleBackFromDiscrepancyDetails}
        onOpenItem={handleOpenDiscrepancyItem}
        onNavSelect={handleNavSelect}
      />
    ) : activeScreen === "sync" ? (
      <MobileSyncScreen
        activeNavKey="profile"
        onBack={handleBackFromSync}
        onNavSelect={handleNavSelect}
      />
    ) : activeScreen === "settings" ? (
      <MobileSettingsScreen
        activeNavKey="profile"
        onBack={() => setActiveScreen("profile")}
        onOpenSync={() => handleOpenSync("profile")}
        onNavSelect={handleNavSelect}
      />
    ) : activeScreen === "history" ? (
      <MobileHistoryScreen
        activeNavKey="profile"
        onBack={() => setActiveScreen("profile")}
        onOpenSync={() => handleOpenSync("profile")}
        onNavSelect={handleNavSelect}
      />
    ) : activeScreen === "help" ? (
      <MobileHelpScreen
        activeNavKey="profile"
        onBack={() => setActiveScreen("profile")}
        onNavSelect={handleNavSelect}
      />
    ) : activeScreen === "profile" ? (
      <MobileProfileScreen
        activeNavKey="profile"
        profileData={profileData}
        onOpenMenu={() => setIsDrawerOpen(true)}
        onOpenHistory={() => setActiveScreen("history")}
        onOpenSettings={() => setActiveScreen("settings")}
        onOpenSync={() => handleOpenSync("profile")}
        onContinueWalkthrough={handleContinueWalkthrough}
        onLogout={handleLogout}
        onNavSelect={handleNavSelect}
      />
    ) : (
      <MobileDashboardScreen
        activeNavKey="dashboard"
        dashboardData={dashboardData}
        onOpenMenu={() => setIsDrawerOpen(true)}
        onContinueWalkthrough={handleContinueWalkthrough}
        onOpenRooms={handleContinueWalkthrough}
        onOpenScan={handleContinueRoomInspection}
        onOpenDiscrepancies={handleOpenDiscrepancies}
        onOpenSync={() => handleOpenSync("dashboard")}
        onOpenZone={handleOpenDashboardZone}
        onNavSelect={handleNavSelect}
      />
    );

  return (
    <div className="mobile-app">
      {isAuthenticated ? activeContent : <MobileLoginScreen onLogin={handleLogin} />}
      {isAuthenticated && isDrawerOpen ? (
        <MobileSideDrawer
          activeKey={getDrawerActiveKey(activeScreen)}
          onClose={() => setIsDrawerOpen(false)}
          onSelect={handleDrawerSelect}
        />
      ) : null}
    </div>
  );
}
