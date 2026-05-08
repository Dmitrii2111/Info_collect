import { ApartmentOutlined, CheckSquareOutlined } from "@ant-design/icons";
import { getNodeCounts } from "./DesktopStructureTree";

const DETAIL_LABELS = {
  building: "Детали корпуса",
  floor: "Детали этажа",
  department: "Детали отделения",
  room: "Детали помещения",
};

const TYPE_NAMES = {
  building: "Корпус",
  floor: "Этаж",
  department: "Отделение",
  room: "Помещение",
};

function getSummaryFields(node, counts, descendants) {
  const departments = descendants.filter((item) => item.type === "department").length;
  const floors = descendants.filter((item) => item.type === "floor").length;
  const base = [
    { label: "Тип", value: TYPE_NAMES[node.type] ?? node.type },
    { label: "Оборудование", value: `${counts.equipment} единиц`, tone: "primary" },
  ];

  if (node.type === "building") {
    return [
      { label: "Корпус", value: node.title },
      { label: "Этажей", value: floors },
      { label: "Отделений", value: departments },
      { label: "Помещений", value: counts.rooms },
      ...base,
      { label: "Синхронизация", value: "Сегодня, 09:42", tone: "primary" },
    ];
  }

  if (node.type === "floor") {
    return [
      { label: "Корпус", value: node.object },
      { label: "Этаж", value: node.title },
      { label: "Отделений", value: departments },
      { label: "Помещений", value: counts.rooms },
      ...base,
    ];
  }

  if (node.type === "department") {
    return [
      { label: "Корпус", value: node.object },
      { label: "Этаж", value: node.floor },
      { label: "Отделение", value: node.title },
      { label: "Помещений", value: counts.rooms },
      ...base,
    ];
  }

  return [
    { label: "Корпус", value: node.object },
    { label: "Этаж", value: node.floor },
    { label: "Отделение", value: node.department },
    { label: "Помещение", value: node.roomNumber ? `${node.roomNumber} ${node.roomName}` : node.title },
    ...base,
  ];
}

export function DesktopObjectDetailsPanel({ selectedNode, descendants, onCreateInspection, onExportObject, onOpenStructure }) {
  if (!selectedNode) {
    return null;
  }

  const counts = getNodeCounts(selectedNode, descendants);
  const summaryFields = getSummaryFields(selectedNode, counts, descendants);

  return (
    <div className="obj-card obj-detail-card">
      <div className="obj-detail-header">
        <div className="obj-detail-header-top">
          <div>
            <p className="obj-detail-sup">{DETAIL_LABELS[selectedNode.type]}</p>
            <h3 className="obj-detail-title">{selectedNode.title}</h3>
          </div>
        </div>
        <div className="obj-detail-metrics">
          <div className="obj-detail-metric obj-detail-metric-primary">
            <p className="obj-detail-metric-label obj-detail-metric-label-primary">Прогресс</p>
            <p className="obj-detail-metric-value obj-detail-metric-value-primary">{selectedNode.progress}%</p>
          </div>
          <div className="obj-detail-metric obj-detail-metric-error">
            <p className="obj-detail-metric-label obj-detail-metric-label-error">Расхождения</p>
            <p className="obj-detail-metric-value obj-detail-metric-value-error">{counts.discrepancies}</p>
          </div>
        </div>
      </div>

      <div className="obj-detail-body">
        <div className="obj-detail-fields">
          {summaryFields.map((field) => (
            <div className="obj-detail-field" key={field.label}>
              <p className="obj-field-label">{field.label}</p>
              <p className={field.tone === "primary" ? "obj-field-value obj-field-value-primary" : "obj-field-value"}>{field.value}</p>
            </div>
          ))}
        </div>

        <div className="obj-divider" />

        <div className="obj-context-actions">
          <button className="obj-btn-primary obj-btn-full" type="button" onClick={() => onOpenStructure(selectedNode)}>
            <ApartmentOutlined /> Открыть структуру
          </button>
          <div className="obj-context-grid">
            <button className="obj-btn-secondary obj-btn-sm-upper" type="button" onClick={() => onCreateInspection(selectedNode)}>
              <CheckSquareOutlined /> Создать инспекцию
            </button>
            <button className="obj-btn-secondary obj-btn-sm-upper" type="button" onClick={onExportObject}>Экспорт</button>
          </div>
        </div>
      </div>
    </div>
  );
}
