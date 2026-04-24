import { Suspense, lazy, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Alert,
  Button,
  Badge,
  Card,
  Col,
  ConfigProvider,
  Drawer,
  Dropdown,
  Grid,
  Layout,
  Menu,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Typography,
  theme as antdTheme,
} from "antd";
import {
  ApartmentOutlined,
  AuditOutlined,
  BgColorsOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ExportOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ReloadOutlined,
  SettingOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
  UsergroupAddOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  createWarehouseZone,
  createGroup,
  createFieldUser,
  createGroupMerge,
  deactivateFieldUser,
  loadAssignmentOptions,
  loadConflictsData,
  loadControlData,
  loadExportRows,
  loadGroups,
  loadOperatorBootstrap,
  loadRoomDetail,
  loadWarehouseData,
  loginOperator,
  previewAssignmentOverlaps,
  restoreFieldUser,
  saveUserAssignments,
  updateConflict,
  updateFieldUser,
  uploadFieldUserAvatar,
} from "./lib/api";
import {
  EMPTY_LOGIN_FORM,
  EMPTY_USER_FORM,
  ROLE_OPTIONS,
  THEME_ACCENT_OPTIONS,
  THEME_MODE_OPTIONS,
} from "./operator/constants.js";
import {
  AvatarDropzone,
  LoginScreen,
  Modal,
  PasswordField,
  SelectField,
  TextField,
  UserAvatar,
} from "./operator/components.jsx";
import {
  buildAuthFromUser,
  buildEditForm,
  buildSelectionMap,
  formatDate,
  getAssignmentUserSummary,
  getControlRoomOptions,
  getDirectorySummary,
  getFirstActiveUserId,
  getGroupSummary,
  getRoleLabel,
  getUniqueValues,
  getVisibleTabsForRole,
  normalizePhone,
  clearStoredAuth,
  readStoredAuth,
  readStoredThemeAccent,
  readStoredThemeMode,
  storeAuth,
  storeThemeAccent,
  storeThemeMode,
  validateUserForm,
} from "./operator/utils.js";
const ControlTab = lazy(() => import("./operator/tabs/ControlTab.jsx").then((module) => ({ default: module.ControlTab })));
const WarehouseTab = lazy(() => import("./operator/tabs/WarehouseTab.jsx").then((module) => ({ default: module.WarehouseTab })));
const ConflictsTab = lazy(() => import("./operator/tabs/ConflictsTab.jsx").then((module) => ({ default: module.ConflictsTab })));
const AssignmentsTab = lazy(() => import("./operator/tabs/AssignmentsTab.jsx").then((module) => ({ default: module.AssignmentsTab })));
const UsersTab = lazy(() => import("./operator/tabs/UsersTab.jsx").then((module) => ({ default: module.UsersTab })));
const GroupsTab = lazy(() => import("./operator/tabs/GroupsTab.jsx").then((module) => ({ default: module.GroupsTab })));
const ExportTab = lazy(() => import("./operator/tabs/ExportTab.jsx").then((module) => ({ default: module.ExportTab })));

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

function TabFallback() {
  return (
    <div className="ant-loading-wrap">
      <Spin indicator={<ReloadOutlined spin />} size="large" />
    </div>
  );
}

export default function App() {
  const [auth, setAuth] = useState(() => readStoredAuth());
  const [authForm, setAuthForm] = useState(EMPTY_LOGIN_FORM);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [loginPasswordVisible, setLoginPasswordVisible] = useState(false);

  const [activeTab, setActiveTab] = useState("control");
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [controlLoading, setControlLoading] = useState(false);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [conflictsLoading, setConflictsLoading] = useState(false);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [conflictsActionLoading, setConflictsActionLoading] = useState(false);

  const [data, setData] = useState({
    roomsSummary: null,
    itemsSummary: null,
    planVersions: [],
    users: [],
    errors: [],
  });
  const [controlData, setControlData] = useState({
    roomSummary: null,
    itemSummary: null,
    rooms: [],
    items: [],
  });
  const [controlFilters, setControlFilters] = useState({
    roomWorklist: "",
    itemWorklist: "unchecked",
    floorCode: "",
    departmentName: "",
    roomId: "",
  });
  const [controlError, setControlError] = useState("");

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [assignmentOptions, setAssignmentOptions] = useState(null);
  const [assignmentSelection, setAssignmentSelection] = useState(new Set());
  const [assignmentSavedSelection, setAssignmentSavedSelection] = useState(new Set());
  const [assignmentExpansion, setAssignmentExpansion] = useState({});
  const [selectedAssignmentRoomId, setSelectedAssignmentRoomId] = useState(null);
  const [selectedRoomDetail, setSelectedRoomDetail] = useState(null);
  const [assignmentRoomLoading, setAssignmentRoomLoading] = useState(false);
  const [assignmentStatus, setAssignmentStatus] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [repeatDialog, setRepeatDialog] = useState({ open: false, rooms: [], payload: null });
  const [overlapDialog, setOverlapDialog] = useState({ open: false, overlaps: [], payload: null, teamName: "" });

  const [createForm, setCreateForm] = useState(EMPTY_USER_FORM);
  const [createErrors, setCreateErrors] = useState({});
  const [createAvatarFile, setCreateAvatarFile] = useState(null);
  const [createAvatarPreview, setCreateAvatarPreview] = useState("");
  const [createPasswordVisible, setCreatePasswordVisible] = useState(false);
  const [usersStatus, setUsersStatus] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_USER_FORM);
  const [editErrors, setEditErrors] = useState({});
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState("");
  const [editPasswordVisible, setEditPasswordVisible] = useState(false);
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState(EMPTY_USER_FORM);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileAvatarFile, setProfileAvatarFile] = useState(null);
  const [profileAvatarPreview, setProfileAvatarPreview] = useState("");
  const [profilePasswordVisible, setProfilePasswordVisible] = useState(false);
  const [themeSettingsOpen, setThemeSettingsOpen] = useState(false);
  const [themeMode, setThemeMode] = useState(() => readStoredThemeMode());
  const [themeAccent, setThemeAccent] = useState(() => readStoredThemeAccent());

  const [groupsData, setGroupsData] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupsStatus, setGroupsStatus] = useState("");
  const [groupsActionLoading, setGroupsActionLoading] = useState(false);
  const [groupForm, setGroupForm] = useState({
    team_name: "",
    member_user_ids: [],
  });
  const [warehouseStatus, setWarehouseStatus] = useState("");
  const [warehouseActionLoading, setWarehouseActionLoading] = useState(false);
  const [warehouseData, setWarehouseData] = useState({
    overview: null,
    zones: [],
    receipts: [],
    rooms: [],
  });
  const [warehouseForm, setWarehouseForm] = useState({
    code: "",
    name: "",
    room_id: "",
  });
  const [conflictsStatus, setConflictsStatus] = useState("");
  const [conflictsData, setConflictsData] = useState({
    summary: null,
    items: [],
  });
  const [conflictFilters, setConflictFilters] = useState({
    statusCode: "",
    conflictType: "",
  });

  const [exportRows, setExportRows] = useState([]);
  const [exportFilters, setExportFilters] = useState({
    floorCode: "",
    departmentName: "",
    roomId: "",
    equipmentQuery: "",
    serialQuery: "",
    presenceStatus: "",
  });

  const controlCacheRef = useRef(new Map());
  const assignmentCacheRef = useRef(new Map());
  const roomDetailCacheRef = useRef(new Map());
  const warehouseLoadedRef = useRef(false);
  const conflictsCacheRef = useRef(new Map());
  const groupsLoadedRef = useRef(false);
  const exportLoadedRef = useRef(false);
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const visibleTabs = useMemo(() => getVisibleTabsForRole(auth?.role), [auth?.role]);
  const menuItems = useMemo(
    () =>
      visibleTabs.map((tab) => ({
        key: tab.id,
        label: tab.label,
        icon:
          tab.id === "control" ? <AuditOutlined /> :
          tab.id === "warehouse" ? <ShopOutlined /> :
          tab.id === "conflicts" ? <ExclamationCircleOutlined /> :
          tab.id === "assignments" ? <ApartmentOutlined /> :
          tab.id === "users" ? <TeamOutlined /> :
          tab.id === "groups" ? <UsergroupAddOutlined /> :
          <ExportOutlined />,
      })),
    [visibleTabs],
  );

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!auth) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const nextData = await loadOperatorBootstrap();
        if (!cancelled) {
          setData(nextData);
          setSelectedUserId((current) => {
            if (auth.role === "field_worker") return auth.user_id;
            return current || getFirstActiveUserId(nextData.users);
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [auth]);

  useEffect(() => {
    if (!createAvatarFile) {
      setCreateAvatarPreview("");
      return undefined;
    }
    const nextUrl = URL.createObjectURL(createAvatarFile);
    setCreateAvatarPreview(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [createAvatarFile]);

  useEffect(() => {
    if (!editAvatarFile) {
      setEditAvatarPreview("");
      return undefined;
    }
    const nextUrl = URL.createObjectURL(editAvatarFile);
    setEditAvatarPreview(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [editAvatarFile]);

  useEffect(() => {
    if (!profileAvatarFile) {
      setProfileAvatarPreview("");
      return undefined;
    }
    const nextUrl = URL.createObjectURL(profileAvatarFile);
    setProfileAvatarPreview(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [profileAvatarFile]);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    storeThemeMode(themeMode);
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.dataset.accent = themeAccent;
    storeThemeAccent(themeAccent);
  }, [themeAccent]);

  useEffect(() => {
    if (!visibleTabs.find((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id || "assignments");
    }
  }, [activeTab, visibleTabs]);

  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) {
      setMobileNavOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (auth?.role === "field_worker" && auth.user_id && selectedUserId !== auth.user_id) {
      setSelectedUserId(auth.user_id);
    }
  }, [auth, selectedUserId]);

  useEffect(() => {
    if (!assignmentOptions?.selected_room_ids?.length) {
      setSelectedAssignmentRoomId(null);
      setSelectedRoomDetail(null);
      return;
    }
    setSelectedAssignmentRoomId((current) => {
      if (current && assignmentOptions.selected_room_ids.includes(current)) {
        return current;
      }
      return assignmentOptions.selected_room_ids[0];
    });
  }, [assignmentOptions]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!auth || activeTab !== "control") return;
      const key = JSON.stringify({
        roomWorklist: controlFilters.roomWorklist,
        itemWorklist: controlFilters.itemWorklist,
      });
      const cached = controlCacheRef.current.get(key);
      if (cached) setControlData(cached);
      setControlLoading(!cached);
      setControlError("");
      try {
        const payload = await loadControlData({
          roomWorklist: controlFilters.roomWorklist,
          itemWorklist: controlFilters.itemWorklist,
        });
        if (!cancelled) {
          controlCacheRef.current.set(key, payload);
          setControlData(payload);
        }
      } catch (error) {
        if (!cancelled) setControlError(error.message || "Не удалось загрузить контроль.");
      } finally {
        if (!cancelled) setControlLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [auth, activeTab, controlFilters.roomWorklist, controlFilters.itemWorklist]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!auth || activeTab !== "assignments") return;
      const effectiveUserId =
        auth.role === "field_worker"
          ? auth.user_id
          : data.users.find((user) => user.user_id === selectedUserId && user.is_active)?.user_id || getFirstActiveUserId(data.users);
      if (!effectiveUserId) return;
      if (effectiveUserId !== selectedUserId) {
        startTransition(() => setSelectedUserId(effectiveUserId));
        return;
      }

      const cached = assignmentCacheRef.current.get(effectiveUserId);
      if (cached) {
        setAssignmentOptions(cached);
        setAssignmentSelection(buildSelectionMap(cached));
        setAssignmentSavedSelection(buildSelectionMap(cached));
      }

      setAssignmentsLoading(!cached);
      setAssignmentError("");
      try {
        const payload = await loadAssignmentOptions(effectiveUserId);
        if (!cancelled) {
          assignmentCacheRef.current.set(effectiveUserId, payload);
          setAssignmentOptions(payload);
          setAssignmentSelection(buildSelectionMap(payload));
          setAssignmentSavedSelection(buildSelectionMap(payload));
        }
      } catch (error) {
        if (!cancelled) setAssignmentError(error.message || "Не удалось загрузить назначения.");
      } finally {
        if (!cancelled) setAssignmentsLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [auth, activeTab, selectedUserId, data.users, startTransition]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!selectedAssignmentRoomId || activeTab !== "assignments") return;
      const cached = roomDetailCacheRef.current.get(selectedAssignmentRoomId);
      if (cached) {
        setSelectedRoomDetail(cached);
      }
      setAssignmentRoomLoading(!cached);
      try {
        const payload = await loadRoomDetail(selectedAssignmentRoomId);
        if (!cancelled) {
          roomDetailCacheRef.current.set(selectedAssignmentRoomId, payload);
          setSelectedRoomDetail(payload);
        }
      } catch (error) {
        if (!cancelled) setAssignmentError(error.message || "Не удалось загрузить детали помещения.");
      } finally {
        if (!cancelled) setAssignmentRoomLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [activeTab, selectedAssignmentRoomId]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!auth || activeTab !== "groups") return;
      if (groupsLoadedRef.current && groupsData.length) return;
      setGroupsLoading(true);
      try {
        const payload = await loadGroups();
        if (!cancelled) {
          groupsLoadedRef.current = true;
          setGroupsData(payload);
          setSelectedGroupId((current) => current || payload[0]?.team_id || null);
        }
      } catch (error) {
        if (!cancelled) setGroupsStatus(error.message || "Не удалось загрузить группы.");
      } finally {
        if (!cancelled) setGroupsLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [auth, activeTab, groupsData.length]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!auth || activeTab !== "warehouse") return;
      if (warehouseLoadedRef.current && warehouseData.zones.length) return;
      setWarehouseLoading(true);
      try {
        const payload = await loadWarehouseData();
        if (!cancelled) {
          warehouseLoadedRef.current = true;
          setWarehouseData(payload);
        }
      } catch (error) {
        if (!cancelled) setWarehouseStatus(error.message || "Не удалось загрузить складские данные.");
      } finally {
        if (!cancelled) setWarehouseLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [auth, activeTab, warehouseData.zones.length]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!auth || activeTab !== "conflicts") return;
      const key = JSON.stringify(conflictFilters);
      const cached = conflictsCacheRef.current.get(key);
      if (cached) {
        setConflictsData(cached);
      }
      setConflictsLoading(!cached);
      setConflictsStatus("");
      try {
        const payload = await loadConflictsData(conflictFilters);
        if (!cancelled) {
          conflictsCacheRef.current.set(key, payload);
          setConflictsData(payload);
        }
      } catch (error) {
        if (!cancelled) setConflictsStatus(error.message || "Не удалось загрузить конфликты.");
      } finally {
        if (!cancelled) setConflictsLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [auth, activeTab, conflictFilters]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!auth || activeTab !== "export") return;
      if (exportLoadedRef.current && exportRows.length) return;
      setExportLoading(true);
      try {
        const rows = await loadExportRows();
        if (!cancelled) {
          exportLoadedRef.current = true;
          setExportRows(rows);
        }
      } finally {
        if (!cancelled) setExportLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [auth, activeTab, exportRows.length]);

  const activePlan = data.planVersions.find((item) => item.status === "applied") || data.planVersions[0] || null;
  const floors = getUniqueValues(controlData.rooms, (room) => room.floor_code);
  const departments = getUniqueValues(
    controlData.rooms.filter((room) => !controlFilters.floorCode || room.floor_code === controlFilters.floorCode),
    (room) => room.department_name,
  );
  const roomOptions = getControlRoomOptions(controlData.rooms, controlFilters.floorCode, controlFilters.departmentName);
  const selectedAssignmentUser = data.users.find((user) => user.user_id === selectedUserId) || null;
  const assignmentUsers = useMemo(() => {
    const activeUsers = data.users.filter((user) => user.is_active);
    if (auth?.role === "field_worker") {
      return activeUsers.filter((user) => user.user_id === auth.user_id);
    }
    return activeUsers;
  }, [auth, data.users]);
  const activeDirectoryUsers = useMemo(() => data.users.filter((user) => user.is_active), [data.users]);
  const inactiveDirectoryUsers = useMemo(() => data.users.filter((user) => !user.is_active), [data.users]);
  const userSummary = getAssignmentUserSummary(data.users);
  const directorySummary = getDirectorySummary(data.users);
  const selectedGroup = groupsData.find((group) => group.team_id === selectedGroupId) || null;
  const groupSummary = getGroupSummary(selectedGroup);
  const groupCandidates = data.users.filter((user) => user.is_active && user.role === "field_worker");
  const currentUser = data.users.find((user) => user.user_id === auth?.user_id) || null;
  const configTheme = useMemo(
    () => ({
      algorithm: themeMode === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary:
          themeAccent === "ocean"
            ? "#1763a6"
            : themeAccent === "copper"
              ? "#a15c2f"
              : "#1f4d3a",
        colorBgLayout: themeMode === "dark" ? "#101217" : "#f5f7fb",
        colorBgContainer: themeMode === "dark" ? "#171b21" : "#ffffff",
        colorBgElevated: themeMode === "dark" ? "#1f242c" : "#ffffff",
        colorBorder: themeMode === "dark" ? "#2a313b" : "#d9e0e7",
        colorText: themeMode === "dark" ? "#f5f7fa" : "#1f2329",
        colorTextSecondary: themeMode === "dark" ? "#a9b4c0" : "#667085",
        boxShadowSecondary: themeMode === "dark" ? "0 16px 48px rgba(0,0,0,0.34)" : "0 16px 40px rgba(15,23,42,0.08)",
        borderRadius: 12,
      },
      components: {
        Layout: {
          headerBg: themeMode === "dark" ? "#11151b" : "#ffffff",
          siderBg: themeMode === "dark" ? "#11151b" : "#ffffff",
          bodyBg: themeMode === "dark" ? "#101217" : "#f5f7fb",
          triggerBg: themeMode === "dark" ? "#11151b" : "#ffffff",
        },
        Card: {
          colorBgContainer: themeMode === "dark" ? "#171b21" : "#ffffff",
        },
      },
    }),
    [themeAccent, themeMode],
  );
  const profileMenuItems = useMemo(
    () => [
      { key: "profile", icon: <UserOutlined />, label: "Мой профиль", onClick: openProfile },
      { key: "theme", icon: <BgColorsOutlined />, label: "Тема интерфейса", onClick: () => setThemeSettingsOpen(true) },
      { key: "logout", icon: <LogoutOutlined />, label: "Выйти", onClick: handleLogout },
    ],
    [handleLogout],
  );

  const filteredRooms = controlData.rooms.filter((room) => {
    if (controlFilters.floorCode && room.floor_code !== controlFilters.floorCode) return false;
    if (controlFilters.departmentName && room.department_name !== controlFilters.departmentName) return false;
    if (controlFilters.roomId && room.room_id !== controlFilters.roomId) return false;
    return true;
  });

  const filteredItems = controlData.items.filter((item) => {
    if (controlFilters.floorCode && item.floor_code !== controlFilters.floorCode) return false;
    if (controlFilters.departmentName && item.department_name !== controlFilters.departmentName) return false;
    if (controlFilters.roomId && item.room_id !== controlFilters.roomId) return false;
    return true;
  });

  const exportFloors = getUniqueValues(exportRows, (item) => item.floor_code);
  const exportDepartments = getUniqueValues(
    exportRows.filter((item) => !exportFilters.floorCode || item.floor_code === exportFilters.floorCode),
    (item) => item.department_name,
  );
  const exportRoomOptions = exportRows
    .filter((item) => {
      if (exportFilters.floorCode && item.floor_code !== exportFilters.floorCode) return false;
      if (exportFilters.departmentName && item.department_name !== exportFilters.departmentName) return false;
      return true;
    })
    .map((item) => ({ value: item.room_id, label: `${item.room_code || "—"} — ${item.room_name || "—"}` }))
    .filter((item, index, all) => item.value && all.findIndex((candidate) => candidate.value === item.value) === index);

  const filteredExportRows = exportRows.filter((item) => {
    if (exportFilters.floorCode && item.floor_code !== exportFilters.floorCode) return false;
    if (exportFilters.departmentName && item.department_name !== exportFilters.departmentName) return false;
    if (exportFilters.roomId && item.room_id !== exportFilters.roomId) return false;
    if (exportFilters.presenceStatus && item.current_presence_status !== exportFilters.presenceStatus) return false;
    if (exportFilters.equipmentQuery) {
      const haystack = `${item.position_code || ""} ${item.equipment_name || ""} ${item.display_label || ""}`.toLowerCase();
      if (!haystack.includes(exportFilters.equipmentQuery.toLowerCase())) return false;
    }
    if (exportFilters.serialQuery) {
      const serialHaystack = `${item.serial_number || item.serial_state || ""}`.toLowerCase();
      if (!serialHaystack.includes(exportFilters.serialQuery.toLowerCase())) return false;
    }
    return true;
  });

  async function reloadBootstrapUsers() {
    const nextData = await loadOperatorBootstrap();
    setData((current) => ({
      ...current,
      users: nextData.users,
      errors: nextData.errors,
      planVersions: nextData.planVersions.length ? nextData.planVersions : current.planVersions,
    }));
    startTransition(() => {
      setSelectedUserId((current) => {
        if (auth?.role === "field_worker" && auth.user_id) return auth.user_id;
        const stillValid = nextData.users.find((user) => user.user_id === current && user.is_active);
        return stillValid ? current : getFirstActiveUserId(nextData.users);
      });
    });
  }

  async function reloadGroupsData() {
    const payload = await loadGroups();
    groupsLoadedRef.current = true;
    setGroupsData(payload);
    setSelectedGroupId((current) => current || payload[0]?.team_id || null);
  }

  async function reloadWarehouseData() {
    const payload = await loadWarehouseData();
    warehouseLoadedRef.current = true;
    setWarehouseData(payload);
  }

  async function reloadConflictsData(nextFilters = conflictFilters) {
    const key = JSON.stringify(nextFilters);
    const payload = await loadConflictsData(nextFilters);
    conflictsCacheRef.current.set(key, payload);
    setConflictsData(payload);
  }

  function updateGroupForm(key, value) {
    setGroupForm((current) => ({ ...current, [key]: value }));
  }

  async function handleCreateGroup() {
    if (!groupForm.team_name.trim() || groupForm.member_user_ids.length < 2) {
      setGroupsStatus("Для группы нужны название и минимум два участника.");
      return;
    }
    setGroupsActionLoading(true);
    setGroupsStatus("");
    try {
      const payload = await createGroup({
        team_name: groupForm.team_name.trim(),
        member_user_ids: groupForm.member_user_ids,
      });
      await reloadGroupsData();
      setSelectedGroupId(payload.team_id);
      setGroupForm({
        team_name: "",
        member_user_ids: [],
      });
      setGroupsStatus(`Группа «${payload.team_name}» создана.`);
    } catch (error) {
      setGroupsStatus(error.message || "Не удалось создать группу.");
    } finally {
      setGroupsActionLoading(false);
    }
  }

  function updateWarehouseForm(key, value) {
    setWarehouseForm((current) => ({ ...current, [key]: value }));
  }

  function updateConflictFilter(key, value) {
    setConflictFilters((current) => ({ ...current, [key]: value }));
  }

  async function handleCreateWarehouseZone() {
    if (!warehouseForm.code.trim() || !warehouseForm.name.trim()) {
      setWarehouseStatus("Для зоны нужны код и название.");
      return;
    }
    setWarehouseActionLoading(true);
    setWarehouseStatus("");
    try {
      await createWarehouseZone({
        code: warehouseForm.code.trim(),
        name: warehouseForm.name.trim(),
        room_id: warehouseForm.room_id || null,
      });
      await reloadWarehouseData();
      setWarehouseForm({
        code: "",
        name: "",
        room_id: "",
      });
      setWarehouseStatus("Складская зона создана.");
    } catch (error) {
      setWarehouseStatus(error.message || "Не удалось создать складскую зону.");
    } finally {
      setWarehouseActionLoading(false);
    }
  }

  async function handleResolveConflict(conflictId) {
    setConflictsActionLoading(true);
    setConflictsStatus("");
    try {
      await updateConflict(conflictId, {
        status_code: "resolved",
        resolution_note: "Решено оператором.",
      });
      conflictsCacheRef.current.clear();
      await reloadConflictsData();
      setConflictsStatus("Конфликт отмечен как решенный.");
    } catch (error) {
      setConflictsStatus(error.message || "Не удалось обновить конфликт.");
    } finally {
      setConflictsActionLoading(false);
    }
  }

  async function handleDismissConflict(conflictId) {
    setConflictsActionLoading(true);
    setConflictsStatus("");
    try {
      await updateConflict(conflictId, {
        status_code: "dismissed",
        resolution_note: "Конфликт отклонен оператором.",
      });
      conflictsCacheRef.current.clear();
      await reloadConflictsData();
      setConflictsStatus("Конфликт отклонен.");
    } catch (error) {
      setConflictsStatus(error.message || "Не удалось обновить конфликт.");
    } finally {
      setConflictsActionLoading(false);
    }
  }

  async function handleLogin() {
    setAuthLoading(true);
    setAuthError("");
    try {
      const payload = await loginOperator(authForm);
      setAuth(payload);
      storeAuth(payload);
      setSelectedUserId(payload.role === "field_worker" ? payload.user_id : null);
      setActiveTab(payload.role === "field_worker" ? "assignments" : "control");
    } catch (error) {
      setAuthError(error.message || "Не удалось выполнить вход.");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    clearStoredAuth();
    setAuth(null);
    setAuthForm(EMPTY_LOGIN_FORM);
    setAuthError("");
    setSelectedUserId(null);
  }

  function openProfile() {
    const sourceUser = currentUser || auth;
    setProfileForm(buildEditForm(sourceUser, EMPTY_USER_FORM));
    setProfileErrors({});
    setProfileAvatarFile(null);
    setProfileAvatarPreview("");
    setProfilePasswordVisible(false);
    setProfileOpen(true);
  }

  function closeProfile() {
    setProfileOpen(false);
    setProfileForm(EMPTY_USER_FORM);
    setProfileErrors({});
    setProfileAvatarFile(null);
    setProfileAvatarPreview("");
    setProfilePasswordVisible(false);
  }

  async function handleSaveProfile() {
    if (!auth?.user_id) return;
    const nextErrors = validateUserForm(profileForm, { requirePassword: false });
    setProfileErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setUsersStatus("Исправьте ошибки в профиле.");
      return;
    }
    setUserActionLoading(true);
    try {
      const updatedUser = await updateFieldUser(auth.user_id, {
        ...profileForm,
        phone: normalizePhone(profileForm.phone),
      });
      const finalUser = profileAvatarFile ? await uploadFieldUserAvatar(auth.user_id, profileAvatarFile) : updatedUser;
      await reloadBootstrapUsers();
      const nextAuth = buildAuthFromUser(finalUser, auth);
      setAuth(nextAuth);
      storeAuth(nextAuth);
      setUsersStatus("Профиль обновлен.");
      closeProfile();
    } catch (error) {
      setUsersStatus(error.message || "Не удалось обновить профиль.");
    } finally {
      setUserActionLoading(false);
    }
  }

  function handleSidebarToggle() {
    if (isMobile) {
      setMobileNavOpen((current) => !current);
      return;
    }
    setSidebarCollapsed((current) => !current);
  }

  function handleMenuSelect(key) {
    startTransition(() => setActiveTab(key));
    if (isMobile) {
      setMobileNavOpen(false);
    }
  }

  function updateCreateForm(key, value) {
    setCreateForm((current) => ({ ...current, [key]: value }));
    setCreateErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updateEditForm(key, value) {
    setEditForm((current) => ({ ...current, [key]: value }));
    setEditErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function openEditUser(user) {
    setEditUser(user);
    setEditForm(buildEditForm(user, EMPTY_USER_FORM));
    setEditErrors({});
    setEditAvatarFile(null);
    setEditAvatarPreview("");
    setEditPasswordVisible(false);
    setUsersStatus("");
  }

  function closeEditUser() {
    setEditUser(null);
    setEditForm(EMPTY_USER_FORM);
    setEditErrors({});
    setEditAvatarFile(null);
    setEditAvatarPreview("");
  }

  function toggleExpand(key) {
    setAssignmentExpansion((current) => ({ ...current, [key]: !current[key] }));
  }

  function toggleRoom(roomId) {
    setAssignmentSelection((current) => {
      const next = new Set(current);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });
    setSelectedAssignmentRoomId(roomId);
  }

  function selectAssignmentRoom(roomId) {
    setSelectedAssignmentRoomId(roomId);
  }

  function toggleDepartment(department) {
    setAssignmentSelection((current) => {
      const next = new Set(current);
      const roomIds = collectDepartmentRoomIds(department);
      const allSelected = roomIds.every((roomId) => next.has(roomId));
      roomIds.forEach((roomId) => (allSelected ? next.delete(roomId) : next.add(roomId)));
      return next;
    });
  }

  function toggleFloor(floor) {
    setAssignmentSelection((current) => {
      const next = new Set(current);
      const roomIds = collectFloorRoomIds(floor);
      const allSelected = roomIds.every((roomId) => next.has(roomId));
      roomIds.forEach((roomId) => (allSelected ? next.delete(roomId) : next.add(roomId)));
      return next;
    });
  }

  function buildAssignmentPayload() {
    return {
      floor_ids: [],
      department_ids: [],
      room_ids: [...assignmentSelection],
    };
  }

  function getRepeatRooms(payload) {
    if (!assignmentOptions) return [];
    const result = [];
    assignmentOptions.floors.forEach((floor) =>
      floor.departments.forEach((department) =>
        department.rooms.forEach((room) => {
          if (!payload.room_ids.includes(room.room_id)) return;
          if (assignmentSavedSelection.has(room.room_id)) return;
          if (!room.repeat_check_required) return;
          result.push(room);
        }),
      ),
    );
    return result;
  }

  async function finalizeAssignmentSave(payload, mergeDecision = null) {
    setSavingAssignments(true);
    setAssignmentError("");
    setAssignmentStatus("Сохраняю назначения...");
    try {
      if (mergeDecision?.action === "merge") {
        await createGroupMerge({
          primary_user_id: selectedUserId,
          other_user_ids: [...new Set(mergeDecision.overlaps.map((entry) => entry.other_user_id))],
          team_name: mergeDecision.teamName || null,
        });
      }
      const result = await saveUserAssignments(selectedUserId, payload);
      const nextOptions = await loadAssignmentOptions(selectedUserId);
      assignmentCacheRef.current.set(selectedUserId, nextOptions);
      setAssignmentOptions(nextOptions);
      setAssignmentSelection(buildSelectionMap(nextOptions));
      setAssignmentSavedSelection(buildSelectionMap(nextOptions));
      await reloadBootstrapUsers();
      await reloadGroupsData();
      setAssignmentStatus(`Сохранено. Активных назначений: ${result.active_assignments_count}.`);
    } catch (error) {
      setAssignmentError(error.message || "Не удалось сохранить назначения.");
    } finally {
      setSavingAssignments(false);
    }
  }

  async function startAssignmentSave() {
    if (!selectedUserId) {
      setAssignmentError("Сначала выберите сотрудника.");
      return;
    }
    const payload = buildAssignmentPayload();
    const repeatRooms = getRepeatRooms(payload);
    if (repeatRooms.length > 0) {
      setRepeatDialog({ open: true, rooms: repeatRooms, payload });
      return;
    }
    try {
      const overlapPreview = await previewAssignmentOverlaps(selectedUserId, payload);
      if (overlapPreview.overlap_count > 0) {
        setOverlapDialog({ open: true, overlaps: overlapPreview.overlaps, payload, teamName: "" });
        return;
      }
      await finalizeAssignmentSave(payload);
    } catch (error) {
      setAssignmentError(error.message || "Не удалось проверить пересечения назначений.");
    }
  }

  async function continueAfterRepeatCheck() {
    const payload = repeatDialog.payload;
    setRepeatDialog({ open: false, rooms: [], payload: null });
    if (!payload) return;
    try {
      const overlapPreview = await previewAssignmentOverlaps(selectedUserId, payload);
      if (overlapPreview.overlap_count > 0) {
        setOverlapDialog({ open: true, overlaps: overlapPreview.overlaps, payload, teamName: "" });
        return;
      }
      await finalizeAssignmentSave(payload);
    } catch (error) {
      setAssignmentError(error.message || "Не удалось проверить пересечения назначений.");
    }
  }

  async function continueWithGroupMerge() {
    const mergeDecision = {
      action: "merge",
      overlaps: overlapDialog.overlaps,
      teamName: overlapDialog.teamName,
    };
    const payload = overlapDialog.payload;
    setOverlapDialog({ open: false, overlaps: [], payload: null, teamName: "" });
    if (!payload) return;
    await finalizeAssignmentSave(payload, mergeDecision);
  }

  async function handleCreateUser() {
    const nextErrors = validateUserForm(createForm, { requirePassword: true });
    setCreateErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setUsersStatus("Исправьте ошибки в форме.");
      return;
    }
    setUserActionLoading(true);
    setUsersStatus("Создаю сотрудника...");
    try {
      const createdUser = await createFieldUser({
        ...createForm,
        phone: normalizePhone(createForm.phone),
      });
      if (createAvatarFile) {
        await uploadFieldUserAvatar(createdUser.user_id, createAvatarFile);
      }
      setCreateForm(EMPTY_USER_FORM);
      setCreateErrors({});
      setCreateAvatarFile(null);
      setCreatePasswordVisible(false);
      await reloadBootstrapUsers();
      setUsersStatus("Сотрудник создан.");
    } catch (error) {
      setUsersStatus(error.message || "Не удалось создать сотрудника.");
    } finally {
      setUserActionLoading(false);
    }
  }

  async function handleSaveEditUser() {
    if (!editUser) return;
    const nextErrors = validateUserForm(editForm, { requirePassword: false });
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setUsersStatus("Исправьте ошибки в форме редактирования.");
      return;
    }
    setUserActionLoading(true);
    setUsersStatus("Сохраняю данные сотрудника...");
    try {
      await updateFieldUser(editUser.user_id, {
        ...editForm,
        phone: normalizePhone(editForm.phone),
      });
      if (editAvatarFile) {
        await uploadFieldUserAvatar(editUser.user_id, editAvatarFile);
      }
      await reloadBootstrapUsers();
      setUsersStatus("Данные сотрудника обновлены.");
      closeEditUser();
    } catch (error) {
      setUsersStatus(error.message || "Не удалось обновить сотрудника.");
    } finally {
      setUserActionLoading(false);
    }
  }

  async function handleDeactivateUser(user) {
    setUserActionLoading(true);
    setUsersStatus(`Отключаю сотрудника ${user.full_name}...`);
    try {
      await deactivateFieldUser(user.user_id);
      await reloadBootstrapUsers();
      setUsersStatus("Сотрудник отключен.");
      if (editUser?.user_id === user.user_id) closeEditUser();
    } catch (error) {
      setUsersStatus(error.message || "Не удалось отключить сотрудника.");
    } finally {
      setUserActionLoading(false);
    }
  }

  async function handleRestoreUser(user) {
    setUserActionLoading(true);
    setUsersStatus(`Восстанавливаю сотрудника ${user.full_name}...`);
    try {
      await restoreFieldUser(user.user_id);
      await reloadBootstrapUsers();
      setUsersStatus("Сотрудник восстановлен.");
    } catch (error) {
      setUsersStatus(error.message || "Не удалось восстановить сотрудника.");
    } finally {
      setUserActionLoading(false);
    }
  }

  function updateControlFilter(key, value) {
    setControlFilters((current) => {
      if (key === "floorCode") return { ...current, floorCode: value, departmentName: "", roomId: "" };
      if (key === "departmentName") return { ...current, departmentName: value, roomId: "" };
      return { ...current, [key]: value };
    });
  }

  function updateExportFilter(key, value) {
    setExportFilters((current) => {
      if (key === "floorCode") return { ...current, floorCode: value, departmentName: "", roomId: "" };
      if (key === "departmentName") return { ...current, departmentName: value, roomId: "" };
      return { ...current, [key]: value };
    });
  }

  function resetExportFilters() {
    setExportFilters({
      floorCode: "",
      departmentName: "",
      roomId: "",
      equipmentQuery: "",
      serialQuery: "",
      presenceStatus: "",
    });
  }

  function exportCsv(csvText) {
    const blob = new Blob([`\uFEFF${csvText}`], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");
    link.href = URL.createObjectURL(blob);
    link.download = `infocollect-export-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  function renderTab() {
    if (activeTab === "control") {
      return (
        <Suspense fallback={<TabFallback />}>
          <ControlTab
            controlData={controlData}
            controlFilters={controlFilters}
            controlLoading={controlLoading}
            controlError={controlError}
            filteredRooms={filteredRooms}
            filteredItems={filteredItems}
            floors={floors}
            departments={departments}
            roomOptions={roomOptions}
            onUpdateControlFilter={updateControlFilter}
          />
        </Suspense>
      );
    }
    if (activeTab === "assignments") {
      return (
        <Suspense fallback={<TabFallback />}>
          <AssignmentsTab
            auth={auth}
            assignmentUsers={assignmentUsers}
            userSummary={userSummary}
            selectedUserId={selectedUserId}
            selectedAssignmentUser={selectedAssignmentUser}
            assignmentOptions={assignmentOptions}
            assignmentSelection={assignmentSelection}
            assignmentExpansion={assignmentExpansion}
            selectedAssignmentRoomId={selectedAssignmentRoomId}
            assignmentsLoading={assignmentsLoading}
            savingAssignments={savingAssignments}
            assignmentError={assignmentError}
            assignmentStatus={assignmentStatus}
            selectedRoomDetail={selectedRoomDetail}
            assignmentRoomLoading={assignmentRoomLoading}
            onSelectUser={(userId) => {
              setAssignmentStatus("");
              setAssignmentError("");
              startTransition(() => setSelectedUserId(userId));
            }}
            onStartAssignmentSave={startAssignmentSave}
            onToggleExpand={toggleExpand}
            onToggleRoom={toggleRoom}
            onToggleDepartment={toggleDepartment}
            onToggleFloor={toggleFloor}
            onSelectRoom={selectAssignmentRoom}
          />
        </Suspense>
      );
    }
    if (activeTab === "warehouse") {
      return (
        <Suspense fallback={<TabFallback />}>
          <WarehouseTab
            warehouseLoading={warehouseLoading}
            warehouseActionLoading={warehouseActionLoading}
            warehouseStatus={warehouseStatus}
            warehouseData={warehouseData}
            warehouseForm={warehouseForm}
            onUpdateWarehouseForm={updateWarehouseForm}
            onCreateZone={handleCreateWarehouseZone}
          />
        </Suspense>
      );
    }
    if (activeTab === "conflicts") {
      return (
        <Suspense fallback={<TabFallback />}>
          <ConflictsTab
            conflictsLoading={conflictsLoading}
            conflictsActionLoading={conflictsActionLoading}
            conflictsStatus={conflictsStatus}
            conflictsData={conflictsData}
            conflictFilters={conflictFilters}
            onUpdateConflictFilter={updateConflictFilter}
            onRefresh={async () => {
              setConflictsLoading(true);
              setConflictsStatus("");
              try {
                conflictsCacheRef.current.clear();
                await reloadConflictsData();
              } catch (error) {
                setConflictsStatus(error.message || "Не удалось обновить конфликты.");
              } finally {
                setConflictsLoading(false);
              }
            }}
            onResolve={handleResolveConflict}
            onDismiss={handleDismissConflict}
          />
        </Suspense>
      );
    }
    if (activeTab === "users") {
      return (
        <Suspense fallback={<TabFallback />}>
          <UsersTab
            createForm={createForm}
            createErrors={createErrors}
            createAvatarPreview={createAvatarPreview}
            createPasswordVisible={createPasswordVisible}
            userActionLoading={userActionLoading}
            usersStatus={usersStatus}
            directorySummary={directorySummary}
            activeDirectoryUsers={activeDirectoryUsers}
            inactiveDirectoryUsers={inactiveDirectoryUsers}
            showInactiveUsers={showInactiveUsers}
            onToggleInactiveUsers={() => setShowInactiveUsers((current) => !current)}
            onUpdateCreateForm={updateCreateForm}
            onToggleCreatePassword={() => setCreatePasswordVisible((current) => !current)}
            onSetCreateAvatarFile={setCreateAvatarFile}
            onCreateUser={handleCreateUser}
            onEditUser={openEditUser}
            onDeactivateUser={handleDeactivateUser}
            onRestoreUser={handleRestoreUser}
          />
        </Suspense>
      );
    }
    if (activeTab === "groups") {
      return (
        <Suspense fallback={<TabFallback />}>
          <GroupsTab
            groupsLoading={groupsLoading}
            groupsActionLoading={groupsActionLoading}
            groupsData={groupsData}
            groupsStatus={groupsStatus}
            selectedGroupId={selectedGroupId}
            selectedGroup={selectedGroup}
            groupSummary={groupSummary}
            groupCandidates={groupCandidates}
            groupForm={groupForm}
            onUpdateGroupForm={updateGroupForm}
            onCreateGroup={handleCreateGroup}
            onSelectGroup={setSelectedGroupId}
          />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<TabFallback />}>
        <ExportTab
          exportLoading={exportLoading}
          exportRows={exportRows}
          exportFilters={exportFilters}
          exportFloors={exportFloors}
          exportDepartments={exportDepartments}
          exportRoomOptions={exportRoomOptions}
          filteredExportRows={filteredExportRows}
          onUpdateExportFilter={updateExportFilter}
          onResetFilters={resetExportFilters}
          onExportCsv={exportCsv}
          onRefresh={async () => {
            setExportLoading(true);
            const rows = await loadExportRows();
            setExportRows(rows);
            setExportLoading(false);
          }}
        />
      </Suspense>
    );
  }

  if (!auth) {
    return (
      <LoginScreen
        form={authForm}
        setForm={setAuthForm}
        onSubmit={handleLogin}
        loading={authLoading}
        error={authError}
        passwordVisible={loginPasswordVisible}
        onTogglePassword={() => setLoginPasswordVisible((current) => !current)}
      />
    );
  }

  return (
    <>
      <ConfigProvider theme={configTheme}>
        <Layout style={{ minHeight: "100vh" }}>
          <Header
            style={{
              padding: 0,
              background: themeMode === "dark" ? "#11151b" : "#fff",
              borderBottom: `1px solid ${themeMode === "dark" ? "#2a313b" : "#f0f0f0"}`,
              position: "sticky",
              top: 0,
              zIndex: 20,
            }}
          >
            <div className="operator-ant-header">
              <Space size="middle">
                <Button type="text" icon={isMobile || sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={handleSidebarToggle} />
                <div className="operator-brand-block">
                  <Text className="operator-brand-text" type="secondary">InfoCollect</Text>
                  <Title className="operator-page-title" level={4}>
                    {auth.role === "field_worker" ? "Мой кабинет" : "Операторская панель"}
                  </Title>
                </div>
              </Space>
              <Space size="middle">
                {!isMobile ? <Badge status={isPending ? "processing" : "success"} text={loading ? "Загрузка данных" : isPending ? "Обновление интерфейса" : "Данные получены"} /> : null}
                <Dropdown menu={{ items: profileMenuItems }} placement="bottomRight">
                  <Button type="text" className="operator-profile-trigger">
                    <Space>
                      <UserAvatar user={auth} />
                      {!isMobile ? <span>{auth.full_name}</span> : null}
                    </Space>
                  </Button>
                </Dropdown>
              </Space>
            </div>
          </Header>
          <Drawer
            placement="left"
            closable={false}
            width={280}
            open={isMobile && mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
            className="mobile-sider-drawer"
          >
            <div className="mobile-menu-body">
              <div className="operator-sider-meta mobile">
                <UserAvatar user={auth} size="large" />
                <div>
                  <Text strong>{auth.full_name}</Text>
                  <br />
                  <Text type="secondary">{getRoleLabel(auth.role)}</Text>
                </div>
              </div>
              <Menu mode="inline" selectedKeys={[activeTab]} items={menuItems} onClick={({ key }) => handleMenuSelect(key)} style={{ borderRight: 0 }} />
            </div>
          </Drawer>
          <Layout>
            {!isMobile ? (
              <Sider
                width={240}
                collapsedWidth={88}
                collapsible
                collapsed={sidebarCollapsed}
                trigger={null}
                breakpoint="lg"
                style={{ background: themeMode === "dark" ? "#11151b" : "#fff", borderRight: `1px solid ${themeMode === "dark" ? "#2a313b" : "#f0f0f0"}` }}
              >
                <div className="operator-sider-meta">
                  <UserAvatar user={auth} size="large" />
                  {!sidebarCollapsed ? (
                    <div>
                      <Text strong>{auth.full_name}</Text>
                      <br />
                      <Text type="secondary">{getRoleLabel(auth.role)}</Text>
                    </div>
                  ) : null}
                </div>
                <Menu mode="inline" selectedKeys={[activeTab]} items={menuItems} onClick={({ key }) => handleMenuSelect(key)} style={{ borderRight: 0 }} />
              </Sider>
            ) : null}
            <Layout>
              <Content className="operator-main-content">
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Card>
                        <Statistic title="Активная версия плана" value={activePlan?.version_label || "—"} prefix={<CheckCircleOutlined />} />
                      </Card>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card>
                        <Statistic title="Роль доступа" value={getRoleLabel(auth.role)} prefix={<UserOutlined />} />
                      </Card>
                    </Col>
                  </Row>
                  {data.errors.length > 0 ? <Alert type="warning" showIcon icon={<WarningOutlined />} message="Замечания по загрузке" description={<ul>{data.errors.map((error) => <li key={error}>{error}</li>)}</ul>} /> : null}
                  <div className="operator-content-surface">
                    {loading ? <div className="ant-loading-wrap"><Spin indicator={<ReloadOutlined spin />} size="large" /></div> : renderTab()}
                  </div>
                </Space>
              </Content>
            </Layout>
          </Layout>
        </Layout>
      </ConfigProvider>

      <Modal
        open={Boolean(editUser)}
        subtitle="Редактирование сотрудника"
        title={editUser?.full_name || "Сотрудник"}
        actions={
          <>
            <Button type="primary" onClick={handleSaveEditUser} loading={userActionLoading}>
              Сохранить изменения
            </Button>
            <Button onClick={closeEditUser}>Закрыть</Button>
          </>
        }
      >
        <div className="user-edit-hero">
          <div className="user-edit-summary">
            <UserAvatar user={editUser} previewUrl={editAvatarPreview || editUser?.avatar_url || ""} size="large" />
            <div>
              <strong>{editUser?.full_name || "Сотрудник"}</strong>
              <p>{getRoleLabel(editForm.role || editUser?.role)}</p>
              <span>{editUser?.is_active ? "Активная учетная запись" : "Неактивная учетная запись"}</span>
            </div>
          </div>
          <AvatarDropzone label="Заменить фото" previewUrl={editAvatarPreview || editUser?.avatar_url || ""} onFileSelected={setEditAvatarFile} />
        </div>
        <div className="form-grid-react modal-form-grid">
          <TextField label="Логин" value={editForm.login} onChange={(event) => updateEditForm("login", event.target.value)} error={editErrors.login} />
          <PasswordField
            label="Новый пароль"
            value={editForm.password}
            onChange={(event) => updateEditForm("password", event.target.value)}
            error={editErrors.password}
            visible={editPasswordVisible}
            onToggleVisibility={() => setEditPasswordVisible((current) => !current)}
          />
          <TextField label="Фамилия" value={editForm.last_name} onChange={(event) => updateEditForm("last_name", event.target.value)} error={editErrors.last_name} />
          <TextField label="Имя" value={editForm.first_name} onChange={(event) => updateEditForm("first_name", event.target.value)} error={editErrors.first_name} />
          <TextField label="Отчество" value={editForm.middle_name} onChange={(event) => updateEditForm("middle_name", event.target.value)} error={editErrors.middle_name} />
          <TextField label="Телефон" value={editForm.phone} onChange={(event) => updateEditForm("phone", event.target.value)} error={editErrors.phone} placeholder="+7XXXXXXXXXX" />
          <TextField label="Email" value={editForm.email} onChange={(event) => updateEditForm("email", event.target.value)} error={editErrors.email} className="field-span-2" />
          <SelectField label="Роль" value={editForm.role} onChange={(event) => updateEditForm("role", event.target.value)} error={editErrors.role} className="field-span-2" options={ROLE_OPTIONS} />
        </div>
      </Modal>

      <Modal
        open={profileOpen}
        subtitle="Мой профиль"
        title={auth?.full_name || "Профиль"}
        actions={
          <>
            <Button type="primary" onClick={handleSaveProfile} loading={userActionLoading}>
              Сохранить профиль
            </Button>
            <Button onClick={closeProfile}>Закрыть</Button>
          </>
        }
      >
        <div className="modal-profile-header">
          <UserAvatar user={auth} previewUrl={profileAvatarPreview} size="large" />
          <AvatarDropzone label="Обновить фото" previewUrl={profileAvatarPreview || auth?.avatar_url || ""} onFileSelected={setProfileAvatarFile} />
        </div>
        <div className="form-grid-react modal-form-grid">
          <TextField label="Логин" value={profileForm.login} onChange={(event) => setProfileForm((current) => ({ ...current, login: event.target.value }))} error={profileErrors.login} />
          <PasswordField
            label="Новый пароль"
            value={profileForm.password}
            onChange={(event) => setProfileForm((current) => ({ ...current, password: event.target.value }))}
            error={profileErrors.password}
            visible={profilePasswordVisible}
            onToggleVisibility={() => setProfilePasswordVisible((current) => !current)}
          />
          <TextField label="Фамилия" value={profileForm.last_name} onChange={(event) => setProfileForm((current) => ({ ...current, last_name: event.target.value }))} error={profileErrors.last_name} />
          <TextField label="Имя" value={profileForm.first_name} onChange={(event) => setProfileForm((current) => ({ ...current, first_name: event.target.value }))} error={profileErrors.first_name} />
          <TextField label="Отчество" value={profileForm.middle_name} onChange={(event) => setProfileForm((current) => ({ ...current, middle_name: event.target.value }))} error={profileErrors.middle_name} />
          <TextField label="Телефон" value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} error={profileErrors.phone} placeholder="+7XXXXXXXXXX" />
          <TextField label="Email" value={profileForm.email} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))} error={profileErrors.email} className="field-span-2" />
        </div>
      </Modal>

      <Modal
        open={themeSettingsOpen}
        subtitle="Тема интерфейса"
        title="Настройка внешнего вида"
        actions={
          <>
            <Button type="primary" onClick={() => setThemeSettingsOpen(false)}>Готово</Button>
          </>
        }
      >
        <div className="form-grid-react modal-form-grid">
          <SelectField
            label="Режим"
            value={themeMode}
            onChange={(event) => setThemeMode(event.target.value)}
            options={THEME_MODE_OPTIONS}
          />
          <SelectField
            label="Акцент"
            value={themeAccent}
            onChange={(event) => setThemeAccent(event.target.value)}
            options={THEME_ACCENT_OPTIONS}
          />
        </div>
      </Modal>

      <Modal
        open={repeatDialog.open}
        subtitle="Повторная проверка"
        title="Некоторые помещения уже были завершены"
        actions={
          <>
            <button type="button" onClick={continueAfterRepeatCheck}>
              Продолжить
            </button>
            <button type="button" className="ghost-button-react" onClick={() => setRepeatDialog({ open: false, rooms: [], payload: null })}>
              Отмена
            </button>
          </>
        }
      >
        <p className="modal-note">Для этих помещений будет доступна только повторная проверка.</p>
        <div className="modal-list">
          {repeatDialog.rooms.map((room) => (
            <div key={room.room_id} className="modal-list-row">
              <strong>
                {room.room_code} — {room.room_name}
              </strong>
              <span>{formatDate(room.completed_at)}</span>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        open={overlapDialog.open}
        subtitle="Пересечение назначений"
        title="Найдены совпадающие помещения"
        actions={
          <>
            <button type="button" onClick={continueWithGroupMerge}>
              Объединить в группу и сохранить
            </button>
            <button type="button" className="ghost-button-react" onClick={() => setOverlapDialog({ open: false, overlaps: [], payload: null, teamName: "" })}>
              Отмена
            </button>
          </>
        }
      >
        <p className="modal-note">Можно отменить сохранение или объединить сотрудников в группу.</p>
        <input className="modal-input" value={overlapDialog.teamName} onChange={(event) => setOverlapDialog((current) => ({ ...current, teamName: event.target.value }))} placeholder="Например, Группа этаж 2" />
        <div className="modal-list">
          {overlapDialog.overlaps.map((entry, index) => (
            <div key={`${entry.room_id}-${entry.other_user_id}-${index}`} className="modal-list-row">
              <strong>
                {entry.room_code} — {entry.room_name}
              </strong>
              <span>{entry.other_user_name}</span>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
