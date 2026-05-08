import {
  AppstoreOutlined,
  BankOutlined,
  DownOutlined,
  HomeOutlined,
  MinusOutlined,
  RightOutlined,
  ToolOutlined,
} from "@ant-design/icons";

const TYPE_LABELS = {
  building: "Корпус",
  floor: "Этаж",
  department: "Отделение",
  room: "Помещение",
  equipment: "Оборудование",
};

const TYPE_ICONS = {
  building: BankOutlined,
  floor: AppstoreOutlined,
  department: AppstoreOutlined,
  room: HomeOutlined,
  equipment: ToolOutlined,
};

export function getNodeCounts(node, descendants) {
  const roomCount = node.type === "room" ? 1 : descendants.filter((item) => item.type === "room").length;
  const equipmentCount = node.type === "equipment"
    ? Number(node.qty ?? 1)
    : descendants.filter((item) => item.type === "equipment").reduce((sum, item) => sum + Number(item.qty ?? 1), 0);

  return {
    rooms: roomCount,
    equipment: equipmentCount,
    discrepancies: node.discrepancies + descendants.reduce((sum, item) => sum + item.discrepancies, 0),
  };
}

export function DesktopStructureTree({
  nodes,
  allNodes,
  expandedIds,
  selectedId,
  onToggle,
  onSelect,
  showEquipment = true,
  showExpandControls = true,
  variant = "modal",
  expandableIds,
}) {
  const displayNodes = showEquipment ? nodes : nodes.filter((node) => node.type !== "equipment");
  const childrenByParent = allNodes.reduce((map, node) => {
    const key = node.parentId ?? "root";
    map.set(key, [...(map.get(key) ?? []), node]);
    return map;
  }, new Map());

  const getDescendants = (nodeId) => {
    const children = childrenByParent.get(nodeId) ?? [];
    return children.flatMap((child) => [child, ...getDescendants(child.id)]);
  };

  return (
    <div className="obj-structure-tree">
      <table className="obj-table">
        <thead>
          <tr className="obj-thead-row">
            <th className="obj-th obj-th-first">Структура</th>
            <th className="obj-th">Тип</th>
            <th className="obj-th">Помещения</th>
            <th className="obj-th">Позиции</th>
            <th className="obj-th">Прогресс</th>
            <th className="obj-th">Расхождения</th>
            <th className="obj-th">Статус</th>
          </tr>
        </thead>
        <tbody>
          {displayNodes.map((node) => {
            const visibleChildren = (childrenByParent.get(node.id) ?? []).filter((child) => {
              if (variant === "page") {
                return node.type !== "room" && child.type !== "equipment";
              }
              return showEquipment || child.type !== "equipment";
            });
            const hasChildren = expandableIds ? expandableIds.has(node.id) : visibleChildren.length > 0;
            const isExpanded = expandedIds.has(node.id);
            const Icon = TYPE_ICONS[node.type] ?? AppstoreOutlined;
            const counts = getNodeCounts(node, getDescendants(node.id));

            return (
              <tr
                className={`obj-tr${selectedId === node.id ? " obj-tr-active" : ""}`}
                key={node.id}
                onClick={() => onSelect(node.id)}
              >
                <td className={`obj-td obj-td-first obj-cell-l${Math.min(node.level, 3)}`}>
                  <span className="obj-tree-cell">
                    {showExpandControls && hasChildren ? (
                      <button
                        className="obj-tree-toggle"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onToggle(node.id);
                        }}
                      >
                        {isExpanded ? <DownOutlined /> : <RightOutlined />}
                      </button>
                    ) : showExpandControls ? (
                      <MinusOutlined className="obj-tree-arrow obj-tree-arrow-dim" />
                    ) : (
                      <span className="obj-tree-spacer" aria-hidden="true" />
                    )}
                    <Icon className={`obj-tree-icon${node.type === "building" ? " obj-tree-icon-primary" : " obj-tree-icon-muted"}`} />
                    <span className={node.type === "building" ? "obj-tree-name obj-tree-name-primary" : "obj-tree-name"}>{node.title}</span>
                  </span>
                </td>
                <td className="obj-td obj-td-type">{TYPE_LABELS[node.type]}</td>
                <td className="obj-td">{node.type === "equipment" ? "—" : counts.rooms}</td>
                <td className="obj-td">{counts.equipment || "—"}</td>
                <td className="obj-td">{node.progress}%</td>
                <td className={counts.discrepancies ? "obj-td obj-td-error-bold" : "obj-td obj-td-zero"}>{counts.discrepancies}</td>
                <td className="obj-td">{node.status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
