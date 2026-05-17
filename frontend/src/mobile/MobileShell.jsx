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
import { MobileReceiptBatchConfirmScreen } from "./screens/MobileReceiptBatchConfirmScreen.jsx";
import { MobileRoomInspectionScreen } from "./screens/MobileRoomInspectionScreen.jsx";
import { MobileSettingsScreen } from "./screens/MobileSettingsScreen.jsx";
import { MobileSyncScreen } from "./screens/MobileSyncScreen.jsx";
import { MobileWarehouseScreen } from "./screens/MobileWarehouseScreen.jsx";
import { MobileWalkthroughRoomsScreen } from "./screens/MobileWalkthroughRoomsScreen.jsx";
import {
  mobileDiscrepanciesData,
  mobileInspectionsData,
  mobileObjectStructuresById,
  mobileWarehouseData,
} from "./data/mobileMockData.js";
import "./styles/mobile.css";

const MOBILE_SESSION_KEY = "infocollect.mobile.session";

function readMobileSession() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    return JSON.parse(window.localStorage.getItem(MOBILE_SESSION_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function clearMobileSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(MOBILE_SESSION_KEY);
}

function getObjectStructure(objectId) {
  return mobileObjectStructuresById[objectId] ?? mobileObjectStructuresById["building-a"];
}

function findDepartment(objectId, floorId, departmentId) {
  const structure = getObjectStructure(objectId);
  const floor = structure.floors.find((item) => item.id === floorId);

  return floor?.departments?.find((department) => department.id === departmentId) ?? null;
}

function findRoom(department, roomId) {
  return department?.rooms?.find((room) => (room.id ?? room.title) === roomId) ?? null;
}

function findEquipment(room, equipmentId) {
  return room?.equipment?.find((item) => item.id === equipmentId) ?? null;
}

function findInspection(inspectionId) {
  return mobileInspectionsData.inspections.find((inspection) => inspection.id === inspectionId) ?? null;
}

function findInspectionRoom(inspection, roomId) {
  return inspection?.walkthrough?.rooms?.find((room) => room.id === roomId) ?? null;
}

function findWarehouseItem(itemId) {
  return mobileWarehouseData.items.find((item) => item.id === itemId) ?? null;
}

function findDiscrepancy(discrepancyId) {
  return mobileDiscrepanciesData.discrepancies.find((item) => item.id === discrepancyId) ?? null;
}

function getDrawerActiveKey(activeScreen) {
  if (["objects", "objectStructure", "departmentRooms", "roomInspection", "equipmentData"].includes(activeScreen)) {
    return "objects";
  }

  if (["inspections", "walkthroughRooms"].includes(activeScreen)) {
    return "inspections";
  }

  if (["warehouse", "itemCard", "moveItem", "receiptBatchConfirm"].includes(activeScreen)) {
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

export function MobileShell() {
  const savedSession = readMobileSession();
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(savedSession.authenticated));
  const [activeScreen, setActiveScreen] = useState(savedSession.activeScreen ?? "dashboard");
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(null);
  const [selectedInspectionId, setSelectedInspectionId] = useState(null);
  const [selectedWarehouseItemId, setSelectedWarehouseItemId] = useState(null);
  const [selectedDiscrepancyId, setSelectedDiscrepancyId] = useState(null);
  const [discrepancySource, setDiscrepancySource] = useState("dashboard");
  const [syncSource, setSyncSource] = useState("dashboard");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setActiveScreen("dashboard");
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      MOBILE_SESSION_KEY,
      JSON.stringify({ authenticated: true, activeScreen }),
    );
  }, [activeScreen, isAuthenticated]);

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

  const handleOpenReceiptBatchConfirm = () => {
    setActiveScreen("receiptBatchConfirm");
  };

  const handleOpenDiscrepancies = () => {
    setActiveScreen("discrepancies");
  };

  const handleOpenSync = (source = "dashboard") => {
    setSyncSource(source);
    setActiveScreen("sync");
  };

  const handleOpenDiscrepancyDetails = (discrepancyId, source = "discrepancies") => {
    setSelectedDiscrepancyId(discrepancyId);
    setDiscrepancySource(source);
    setActiveScreen("discrepancyDetails");
  };

  const handleBackFromDiscrepancyDetails = () => {
    setActiveScreen(discrepancySource === "itemCard" ? "itemCard" : "discrepancies");
  };

  const selectedStructure = getObjectStructure(selectedObjectId);
  const selectedDepartment = findDepartment(selectedObjectId, selectedFloorId, selectedDepartmentId);
  const selectedInspection = findInspection(selectedInspectionId);
  const selectedInspectionRoom = findInspectionRoom(selectedInspection, selectedRoomId);
  const selectedRoom = selectedDepartment ? findRoom(selectedDepartment, selectedRoomId) : selectedInspectionRoom;
  const selectedEquipment = findEquipment(selectedRoom, selectedEquipmentId);
  const selectedWarehouseItem = findWarehouseItem(selectedWarehouseItemId);
  const selectedDiscrepancy = findDiscrepancy(selectedDiscrepancyId);
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
        room={selectedRoom}
        onBack={() => setActiveScreen("roomInspection")}
        onNavSelect={handleNavSelect}
      />
    ) : activeScreen === "roomInspection" ? (
      <MobileRoomInspectionScreen
        activeNavKey={isInspectionRoomFlow ? "inspections" : "objects"}
        department={roomInspectionContext}
        room={selectedRoom}
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
        onOpenReceiptBatch={handleOpenReceiptBatchConfirm}
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
    ) : activeScreen === "receiptBatchConfirm" ? (
      <MobileReceiptBatchConfirmScreen
        activeNavKey="warehouse"
        onBack={() => setActiveScreen("warehouse")}
        onNavSelect={handleNavSelect}
      />
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
        onNavSelect={handleNavSelect}
      />
    ) : activeScreen === "sync" ? (
      <MobileSyncScreen
        activeNavKey={syncSource === "profile" ? "profile" : "dashboard"}
        onBack={() => setActiveScreen(syncSource === "profile" ? "profile" : "dashboard")}
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
