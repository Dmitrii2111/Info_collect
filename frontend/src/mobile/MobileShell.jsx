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
import { mobileReceiptBatchesData } from "./data/mobileMockData.js";
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
    };
  }

  if (["notFound", "missing"].includes(statusKey)) {
    return {
      status: "Не найдено",
      tone: "error",
      note: comment || "Оборудование не найдено",
    };
  }

  if (statusKey === "found" || payload.preferredStatusKey === "found") {
    return {
      status: "Подтверждено",
      tone: "success",
      note: comment || "Проверено локально",
    };
  }

  return {
    status: "В работе",
    tone: "active",
    note: "Черновик сохранен локально",
  };
}

function applyEquipmentInspectionOverrides(room, overrides) {
  if (!room?.equipment?.length) {
    return room;
  }

  return {
    ...room,
    equipment: room.equipment.map((item) => (overrides[item.id] ? { ...item, ...overrides[item.id] } : item)),
  };
}

export function MobileShell() {
  const savedSession = getMobileSession();
  const savedContext = savedSession.context ?? {};
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
  const [equipmentInspectionOverrides, setEquipmentInspectionOverrides] = useState({});
  const [selectedDiscrepancyId, setSelectedDiscrepancyId] = useState(savedContext.selectedDiscrepancyId ?? null);
  const [discrepancySource, setDiscrepancySource] = useState(savedContext.discrepancySource ?? "dashboard");
  const [syncSource, setSyncSource] = useState(savedContext.syncSource ?? "profile");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
    setSelectedRoomId("room-201-29");
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

  const selectedStructure = getMobileObjectStructureById(selectedObjectId) ?? getMobileObjectStructureById("building-a");
  const selectedDepartment = getMobileDepartmentById(selectedObjectId, selectedDepartmentId);
  const selectedInspection = getMobileInspectionById(selectedInspectionId);
  const selectedInspectionRoom = getMobileInspectionRoomById(selectedInspectionId, selectedRoomId);
  const selectedRoom = selectedDepartment ? getMobileRoomById(selectedObjectId, selectedDepartmentId, selectedRoomId) : selectedInspectionRoom;
  const selectedRoomWithEquipmentOverrides = applyEquipmentInspectionOverrides(selectedRoom, equipmentInspectionOverrides);
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
