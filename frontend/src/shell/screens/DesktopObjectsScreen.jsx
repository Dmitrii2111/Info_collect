import { useEffect, useMemo, useState } from "react";
import {
  ApartmentOutlined,
  PlusCircleOutlined,
  DownloadOutlined,
  DownOutlined,
  RightOutlined,
  BankOutlined,
  AppstoreOutlined,
  HomeOutlined,
  MinusOutlined,
  MoreOutlined,
  ExpandAltOutlined,
  ReloadOutlined,
  CheckSquareOutlined,
  SyncOutlined,
  CloseOutlined,
  WarningOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { DesktopModalShell } from "../components/DesktopModalShell";
import { DesktopObjectDetailsPanel } from "../components/DesktopObjectDetailsPanel";
import { DesktopStructureModal } from "../components/DesktopStructureModal";
import { DesktopStructureTree, getNodeCounts } from "../components/DesktopStructureTree";
import { objectStructureNodes } from "../data/objectsScreenData";
import "../styles/objectsScreen.css";

/* ─── Progress Bar ─── */
function ProgressBar({ pct }) {
  return (
    <div className="obj-progress-wrap">
      <div className="obj-progress-track">
        {pct > 0 && (
          <div className="obj-progress-fill" style={{ width: `${pct}%` }} />
        )}
      </div>
      <span className="obj-progress-label">{pct}%</span>
    </div>
  );
}

/* ─── Status Badge ─── */
function StatusBadge({ status }) {
  const cls =
    status === "В работе"
      ? "obj-badge obj-badge-blue"
      : status === "Требует внимания"
      ? "obj-badge obj-badge-error"
      : "obj-badge obj-badge-gray";
  return <span className={cls}>{status}</span>;
}

const EMPTY_OBJECT_FILTERS = {
  object: "Объект (Все)",
  floor: "Этаж (Все)",
  status: "Статус (Любой)",
};

function createNodeMaps(nodes) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const childrenByParent = nodes.reduce((map, node) => {
    const key = node.parentId ?? "root";
    map.set(key, [...(map.get(key) ?? []), node]);
    return map;
  }, new Map());

  const getDescendants = (nodeId) => {
    const children = childrenByParent.get(nodeId) ?? [];
    return children.flatMap((child) => [child, ...getDescendants(child.id)]);
  };

  return { byId, childrenByParent, getDescendants };
}

function nodeMatchesFilters(node, descendants, filters, statusFilter) {
  const ownAndDescendants = [node, ...descendants.filter((item) => item.type !== "equipment")];
  const objectMatch = filters.object === "Объект (Все)" || ownAndDescendants.some((item) => item.object === filters.object);
  const floorMatch = filters.floor === "Этаж (Все)" || ownAndDescendants.some((item) => item.floor === filters.floor);
  const statusMatch = statusFilter === "Все"
    || statusFilter === "Статус (Любой)"
    || ownAndDescendants.some((item) => {
      if (statusFilter === "С расхождениями") return item.discrepancies > 0 || item.status === "Требует внимания";
      return item.status === statusFilter;
    });

  return objectMatch && floorMatch && statusMatch;
}

function getPageChildren(parentId, maps) {
  return (maps.childrenByParent.get(parentId ?? "root") ?? []).filter((node) => node.type !== "equipment");
}

function nodeMatchesPageFilters(node, filters, statusFilter, maps) {
  return node.type !== "equipment" && nodeMatchesFilters(node, maps.getDescendants(node.id), filters, statusFilter);
}

function buildPageVisibleRows(expandedIds, filters, statusFilter, maps) {
  const rows = [];

  const visit = (node) => {
    if (!nodeMatchesPageFilters(node, filters, statusFilter, maps)) {
      return;
    }

    rows.push(node);

    if (!expandedIds.has(node.id)) {
      return;
    }

    getPageChildren(node.id, maps).forEach(visit);
  };

  getPageChildren(null, maps).forEach(visit);
  return rows;
}

function getPageExpandableIds(filters, statusFilter, maps) {
  const ids = new Set();

  maps.byId.forEach((node) => {
    if (node.type === "equipment" || node.type === "room") {
      return;
    }

    const hasMatchingChildren = getPageChildren(node.id, maps).some((child) => nodeMatchesPageFilters(child, filters, statusFilter, maps));
    if (hasMatchingChildren) {
      ids.add(node.id);
    }
  });

  return ids;
}

function getScopedVisibleNodes(rootNode, expandedIds, maps) {
  if (!rootNode) {
    return [];
  }

  const scopeNodes = [rootNode, ...maps.getDescendants(rootNode.id)];
  const scopeIds = new Set(scopeNodes.map((node) => node.id));

  return scopeNodes.filter((node) => {
    let parentId = node.parentId;
    while (parentId && scopeIds.has(parentId)) {
      if (!expandedIds.has(parentId)) {
        return false;
      }
      parentId = maps.byId.get(parentId)?.parentId;
    }
    return true;
  });
}

function savePendingInspectionContext(node) {
  const payload = {
    source: "objects",
    nodeId: node.id,
    nodeType: node.type,
    title: node.title,
    object: node.object,
    floor: node.floor,
    department: node.department,
  };
  window.localStorage.setItem("infocollect.pendingInspectionContext", JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent("infocollect:navigate", { detail: { sectionKey: "inspections", payload } }));
}

/* ─── Structure Table ─── */
function StructureTable({
  nodes,
  allNodes,
  expandedIds,
  selectedId,
  onToggle,
  onSelect,
  onOpenStructure,
  onUpdateStructure,
  showExpandControls = true,
  expandableIds,
}) {
  return (
    <div className="obj-card obj-table-card">
      {/* Header */}
      <div className="obj-table-header">
        <h3 className="obj-table-title">Структура</h3>
        <div className="obj-table-header-actions">
          <button className="obj-icon-btn" type="button" onClick={onOpenStructure} aria-label="Развернуть структуру">
            <ExpandAltOutlined />
          </button>
          <button className="obj-icon-btn" type="button" onClick={onUpdateStructure} aria-label="Обновить структуру">
            <ReloadOutlined />
          </button>
        </div>
      </div>

      <div className="obj-table-scroll">
        <DesktopStructureTree
          nodes={nodes}
          allNodes={allNodes}
          expandedIds={expandedIds}
          selectedId={selectedId}
          onToggle={onToggle}
          onSelect={onSelect}
          showExpandControls={showExpandControls}
          expandableIds={expandableIds}
        />
      </div>
    </div>
  );
}

/* ─── Detail Panel ─── */
function DetailPanel({ onExportObject }) {
  return (
    <div className="obj-card obj-detail-card">
      {/* Header */}
      <div className="obj-detail-header">
        <div className="obj-detail-header-top">
          <div>
            <p className="obj-detail-sup">Детали объекта</p>
            <h3 className="obj-detail-title">Корпус А</h3>
          </div>
          <button className="obj-close-btn" type="button">
            <CloseOutlined />
          </button>
        </div>
        <div className="obj-detail-metrics">
          <div className="obj-detail-metric obj-detail-metric-primary">
            <p className="obj-detail-metric-label obj-detail-metric-label-primary">Прогресс</p>
            <p className="obj-detail-metric-value obj-detail-metric-value-primary">72.4%</p>
          </div>
          <div className="obj-detail-metric obj-detail-metric-error">
            <p className="obj-detail-metric-label obj-detail-metric-label-error">Расхождения</p>
            <p className="obj-detail-metric-value obj-detail-metric-value-error">10</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="obj-detail-body">
        <div className="obj-detail-fields">
          <div className="obj-detail-field">
            <p className="obj-field-label">Тип</p>
            <p className="obj-field-value">Медицинский центр</p>
          </div>
          <div className="obj-detail-field">
            <p className="obj-field-label">Этажность</p>
            <p className="obj-field-value">8 этажей</p>
          </div>
          <div className="obj-detail-field">
            <p className="obj-field-label">Оборудование</p>
            <p className="obj-field-value">340 единиц</p>
          </div>
          <div className="obj-detail-field">
            <p className="obj-field-label">Синхронизация</p>
            <p className="obj-field-value obj-field-value-primary">Сегодня, 09:42</p>
          </div>
        </div>

        <div className="obj-divider" />

        {/* Active Inspection */}
        <div>
          <div className="obj-inspection-header">
            <p className="obj-detail-sup">Активная инспекция</p>
            <span className="obj-badge-green">В процессе</span>
          </div>
          <div className="obj-inspection-card">
            <div className="obj-inspection-top">
              <div className="obj-inspection-icon">
                <CheckSquareOutlined />
              </div>
              <div>
                <p className="obj-inspection-id">#INS-2024-001</p>
                <p className="obj-inspection-sub">2 этаж • Приемное отделение</p>
              </div>
            </div>
            <div className="obj-inspection-progress">
              <div className="obj-inspection-progress-row">
                <span className="obj-inspection-actor">Иван Иванов</span>
                <span className="obj-inspection-pct">38%</span>
              </div>
              <div className="obj-progress-track obj-progress-track-lg">
                <div className="obj-progress-fill" style={{ width: "38%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Context Actions */}
        <div className="obj-context-actions">
          <button className="obj-btn-primary obj-btn-full" type="button">
            <ApartmentOutlined /> Открыть структуру
          </button>
          <div className="obj-context-grid">
            <button className="obj-btn-secondary obj-btn-sm-upper" type="button">Создать инспекцию</button>
            <button className="obj-btn-secondary obj-btn-sm-upper" type="button" onClick={onExportObject}>Экспорт</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Attention Panel ─── */
function AttentionPanel() {
  return (
    <div className="obj-card obj-attention-card">
      <div className="obj-attention-header">
        <WarningOutlined className="obj-attention-icon" />
        <h4 className="obj-attention-title">Требуют внимания</h4>
      </div>
      <ul className="obj-attention-list">
        <li className="obj-attention-item">
          <div className="obj-dot obj-dot-error" />
          <p className="obj-attention-text">
            10 расхождений в <strong className="obj-attention-strong">Корпус А</strong>
          </p>
        </li>
        <li className="obj-attention-item">
          <div className="obj-dot obj-dot-amber" />
          <p className="obj-attention-text">
            2 конфликта синхронизации в <strong className="obj-attention-strong">Склад временного хранения</strong>
          </p>
        </li>
        <li className="obj-attention-item">
          <div className="obj-dot obj-dot-outline" />
          <p className="obj-attention-text">6 помещений не начато</p>
        </li>
        <li className="obj-attention-item">
          <div className="obj-dot obj-dot-primary" />
          <p className="obj-attention-text">12 изменений ожидают отправки</p>
        </li>
      </ul>
    </div>
  );
}

/* ─── Recent Activity ─── */
function ActivityPanel() {
  return (
    <div className="obj-card obj-activity-card">
      <div className="obj-activity-header">
        <HistoryOutlined className="obj-activity-icon" />
        <h4 className="obj-activity-title">Последние действия</h4>
      </div>
      <div className="obj-activity-item">
        <div className="obj-activity-avatar">
          <SyncOutlined className="obj-activity-avatar-icon" />
        </div>
        <div>
          <p className="obj-activity-actor">Иван Иванов</p>
          <p className="obj-activity-action">Синхронизировал Корпус А</p>
          <p className="obj-activity-time">Сегодня, 09:42</p>
        </div>
      </div>
    </div>
  );
}

function ObjectsStatusDialog({ config, onClose }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const timer = window.setTimeout(() => setStatus("success"), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  const isLoading = status === "loading";

  return (
    <DesktopModalShell
      onClose={onClose}
      size="narrow"
      closeDisabled={isLoading}
      title={isLoading ? config.loadingTitle : config.successTitle}
      subtitle={isLoading ? config.loadingText : config.successText}
      footer={(
        <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose} disabled={isLoading}>
          Закрыть
        </button>
      )}
    >
      <div className={`${isLoading ? "reg-loading-card" : "reg-success-card"} reg-success-card-full`}>
        {isLoading ? <LoadingOutlined aria-hidden="true" /> : <CheckCircleOutlined aria-hidden="true" />}
        <div>
          <strong>{isLoading ? config.loadingTitle : config.successTitle}</strong>
          <span>{isLoading ? config.loadingText : config.successText}</span>
        </div>
      </div>
    </DesktopModalShell>
  );
}

function ObjectsExportDialog({ scope, scopeTitle, onClose }) {
  const [isExporting, setIsExporting] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isExporting) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setIsExporting(false);
      setIsReady(true);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [isExporting]);

  const handleExport = () => {
    setIsReady(false);
    setIsExporting(true);
  };

  return (
    <DesktopModalShell
      onClose={onClose}
      size="narrow"
      closeDisabled={isExporting}
      title={isReady ? "Экспорт готов" : "Экспортировать структуру?"}
      subtitle={isReady ? "Файл будет сформирован backend после подключения API" : "Будет сформирован файл со структурой объектов, этажей, зон и помещений."}
      footer={(
        <>
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose} disabled={isExporting}>
            {isReady ? "Закрыть" : "Отмена"}
          </button>
          {!isReady ? (
            <button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={handleExport} disabled={isExporting}>
              {isExporting ? <LoadingOutlined aria-hidden="true" /> : <DownloadOutlined aria-hidden="true" />}
              Экспортировать
            </button>
          ) : null}
        </>
      )}
    >
      {isExporting ? (
        <div className="reg-loading-card reg-success-card-full">
          <LoadingOutlined aria-hidden="true" />
          <div>
            <strong>Готовим экспорт{scopeTitle ? `: ${scopeTitle}` : ""}</strong>
            <span>Формируем структуру объектов</span>
          </div>
        </div>
      ) : isReady ? (
        <div className="reg-success-card reg-success-card-full">
          <CheckCircleOutlined aria-hidden="true" />
          <div>
            <strong>Экспорт готов</strong>
            <span>Файл будет сформирован backend после подключения API</span>
          </div>
        </div>
      ) : (
        <div className="obj-export-body">
          <div className="reg-modal-note">
            <InfoCircleOutlined aria-hidden="true" />
            <span>Будет сформирован файл со структурой объектов, этажей, зон и помещений.</span>
          </div>
          <div className="obj-export-stats">
            <div><span>Объектов:</span><strong>{scope === "object" ? "1" : "3"}</strong></div>
            <div><span>Этажей:</span><strong>{scope === "object" ? "8" : "18"}</strong></div>
            <div><span>Помещений:</span><strong>{scope === "object" ? "58" : "74"}</strong></div>
            <div><span>Позиций оборудования:</span><strong>{scope === "object" ? "340" : "512"}</strong></div>
          </div>
          <div className="obj-export-section">
            <span className="obj-export-label">Область экспорта</span>
            <div className="obj-export-choice">
              <label><input type="radio" name="objects-export-scope" defaultChecked={scope !== "object"} disabled={scope === "object"} /> Вся структура</label>
              <label><input type="radio" name="objects-export-scope" defaultChecked={scope === "object"} /> Текущий объект</label>
              <label><input type="radio" name="objects-export-scope" /> Текущие фильтры</label>
            </div>
          </div>
          <div className="obj-export-section">
            <span className="obj-export-label">Дополнительные данные</span>
            <label className="obj-export-check"><input type="checkbox" defaultChecked /> Включить прогресс инспекций</label>
            <label className="obj-export-check"><input type="checkbox" defaultChecked /> Включить расхождения</label>
          </div>
          <div className="obj-export-section">
            <span className="obj-export-label">Формат файла</span>
            <div className="obj-export-format">
              <label><input type="radio" name="objects-export-format" defaultChecked /> XLSX</label>
              <label><input type="radio" name="objects-export-format" /> PDF</label>
            </div>
          </div>
        </div>
      )}
    </DesktopModalShell>
  );
}

/* ─── Main Screen ─── */
export function DesktopObjectsScreen({ onNavigate }) {
  const [activeModal, setActiveModal] = useState(null);
  const [structureModalRootId, setStructureModalRootId] = useState(null);
  const [filters, setFilters] = useState(EMPTY_OBJECT_FILTERS);
  const [statusFilter, setStatusFilter] = useState("Все");
  const [expandedIds, setExpandedIds] = useState(() => new Set(["building-1", "building-1-floor-1", "building-1-floor-1-dept-1"]));
  const [selectedId, setSelectedId] = useState("building-1");

  const closeModal = () => setActiveModal(null);
  const maps = useMemo(() => createNodeMaps(objectStructureNodes), []);
  const visibleNodes = useMemo(
    () => buildPageVisibleRows(expandedIds, filters, statusFilter, maps),
    [expandedIds, filters, statusFilter, maps],
  );
  const pageExpandableIds = useMemo(
    () => getPageExpandableIds(filters, statusFilter, maps),
    [filters, statusFilter, maps],
  );
  const selectedNode = maps.byId.get(selectedId) ?? visibleNodes[0] ?? objectStructureNodes[0];
  const selectedDescendants = selectedNode
    ? maps.getDescendants(selectedNode.id)
    : [];
  const structureRootNode = structureModalRootId ? maps.byId.get(structureModalRootId) : null;
  const structureModalNodes = useMemo(
    () => (structureRootNode ? getScopedVisibleNodes(structureRootNode, expandedIds, maps) : objectStructureNodes.filter((node) => {
      if (node.parentId === null) return true;
      let parentId = node.parentId;
      while (parentId) {
        if (!expandedIds.has(parentId)) return false;
        parentId = maps.byId.get(parentId)?.parentId;
      }
      return true;
    })),
    [expandedIds, maps, structureRootNode],
  );
  const visibleBuildings = visibleNodes.filter((node) => node.type === "building").length;
  const visibleFloors = visibleNodes.filter((node) => node.type === "floor").length;
  const visibleRooms = visibleNodes.filter((node) => node.type === "room").length;
  const visibleEquipment = visibleNodes.filter((node) => node.type === "equipment").reduce((sum, node) => sum + Number(node.qty ?? 1), 0);
  const visibleDiscrepancies = visibleNodes.reduce((sum, node) => sum + (node.discrepancies ?? 0), 0);

  useEffect(() => {
    if (visibleNodes.length > 0 && !visibleNodes.some((node) => node.id === selectedId)) {
      setSelectedId(visibleNodes[0].id);
    }
  }, [selectedId, visibleNodes]);

  const handleToggleNode = (nodeId) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(EMPTY_OBJECT_FILTERS);
    setStatusFilter("Все");
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value === "Статус (Любой)" ? "Все" : value);
  };

  const handleCreateInspection = (node = selectedNode) => {
    savePendingInspectionContext(node);
    onNavigate?.("inspections");
  };

  const openFullStructure = () => {
    setStructureModalRootId(null);
    setActiveModal("structure");
  };

  const openSelectedStructure = (node = selectedNode) => {
    setStructureModalRootId(node?.id ?? null);
    setActiveModal("structure");
  };

  return (
    <div className="obj-screen">
      <div className="obj-main-grid">
        {/* Center column — 8/12 */}
        <div className="obj-center-col">
          {/* Action Bar */}
          <div className="obj-action-bar">
            <div className="obj-action-group">
              <button className="obj-btn-primary obj-btn-action" type="button" onClick={openFullStructure}>
                <ApartmentOutlined /> Открыть структуру
              </button>
              <button className="obj-btn-secondary obj-btn-action" type="button" onClick={() => handleCreateInspection(selectedNode)}>
                <PlusCircleOutlined /> Создать инспекцию
              </button>
              <button className="obj-btn-secondary obj-btn-action" type="button" onClick={() => setActiveModal("exportStructure")}>
                <DownloadOutlined /> Экспорт структуры
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="obj-kpi-grid">
            <div className="obj-kpi-card">
              <p className="obj-kpi-label">Объектов</p>
              <div className="obj-kpi-row">
                <span className="obj-kpi-value">{visibleBuildings}</span>
                <span className="obj-kpi-badge-green">активные</span>
              </div>
            </div>
            <div className="obj-kpi-card">
              <p className="obj-kpi-label">Этажей</p>
              <span className="obj-kpi-value">{visibleFloors}</span>
            </div>
            <div className="obj-kpi-card">
              <p className="obj-kpi-label">Помещений</p>
              <span className="obj-kpi-value">{visibleRooms}</span>
            </div>
            <div className="obj-kpi-card">
              <p className="obj-kpi-label">Оборудование</p>
              <span className="obj-kpi-value">{visibleEquipment}</span>
            </div>
            <div className="obj-kpi-card obj-kpi-card-error">
              <p className="obj-kpi-label obj-kpi-label-error">Расхождения</p>
              <div className="obj-kpi-row">
                <span className="obj-kpi-value obj-kpi-value-error">{visibleDiscrepancies}</span>
                <span className="obj-kpi-error-badge">внимание</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="obj-filters-card">
            <div className="obj-filters-selects">
              <select className="obj-select" value={filters.object} onChange={(event) => handleFilterChange("object", event.target.value)}>
                <option>Объект (Все)</option>
                <option>Корпус А</option>
                <option>Корпус Б</option>
              </select>
              <select className="obj-select" value={filters.floor} onChange={(event) => handleFilterChange("floor", event.target.value)}>
                <option>Этаж (Все)</option>
                <option>1 этаж</option>
                <option>2 этаж</option>
                <option>3 этаж</option>
              </select>
              <select className="obj-select" value={statusFilter === "Все" ? "Статус (Любой)" : statusFilter} onChange={(event) => handleStatusFilterChange(event.target.value)}>
                <option>Статус (Любой)</option>
                <option>В работе</option>
                <option>Не начато</option>
                <option>Требует внимания</option>
                <option>Проверено</option>
                <option>С расхождениями</option>
              </select>
            </div>
            <div className="obj-quick-filters">
              {["Все", "В работе", "Не начато", "Проверено", "С расхождениями"].map((chip) => (
                <button
                  className={`obj-chip ${statusFilter === chip ? "obj-chip-active" : chip === "С расхождениями" ? "obj-chip-error" : "obj-chip-default"}`}
                  type="button"
                  key={chip}
                  onClick={() => handleStatusFilterChange(chip)}
                >
                  {chip}
                </button>
              ))}
              <button className="obj-reset-filter" type="button" onClick={resetFilters}>Сбросить</button>
            </div>
          </div>

          <StructureTable
            nodes={visibleNodes}
            allNodes={objectStructureNodes}
            expandedIds={expandedIds}
            selectedId={selectedNode?.id}
            onToggle={handleToggleNode}
            onSelect={setSelectedId}
            showExpandControls
            variant="page"
            expandableIds={pageExpandableIds}
            onOpenStructure={openFullStructure}
            onUpdateStructure={() => setActiveModal("updateStructure")}
          />
        </div>

        {/* Right column — 4/12 */}
        <div className="obj-right-col">
          <DesktopObjectDetailsPanel
            selectedNode={selectedNode}
            descendants={selectedDescendants}
            onCreateInspection={handleCreateInspection}
            onOpenStructure={openSelectedStructure}
            onExportObject={() => setActiveModal("exportObject")}
          />
          <AttentionPanel />
          <ActivityPanel />
        </div>
      </div>
      {activeModal === "exportStructure" && <ObjectsExportDialog scope="all" onClose={closeModal} />}
      {activeModal === "exportObject" && <ObjectsExportDialog scope="object" scopeTitle={selectedNode?.title} onClose={closeModal} />}
      {activeModal === "updateStructure" && (
        <ObjectsStatusDialog
          onClose={closeModal}
          config={{
            loadingTitle: "Обновляем структуру",
            loadingText: "Сверяем объекты и помещения с реестром",
            successTitle: "Структура обновлена",
            successText: "Добавлено помещений: 2, обновлено записей: 4, предупреждений: 1",
          }}
        />
      )}
      {activeModal === "structure" && (
        <DesktopStructureModal
          nodes={structureModalNodes}
          allNodes={objectStructureNodes}
          expandedIds={expandedIds}
          selectedId={selectedNode?.id}
          filters={filters}
          quickFilter={statusFilter}
          onFilterChange={handleFilterChange}
          onQuickFilterChange={handleStatusFilterChange}
          onResetFilters={resetFilters}
          onToggle={handleToggleNode}
          onSelect={setSelectedId}
          onClose={closeModal}
          title={structureRootNode ? `Структура: ${structureRootNode.title}` : "Структура объектов"}
          subtitle={structureRootNode ? "Вложенная структура выбранного элемента" : "Полная иерархия корпусов, этажей, отделений, помещений и оборудования"}
        />
      )}
    </div>
  );
}
