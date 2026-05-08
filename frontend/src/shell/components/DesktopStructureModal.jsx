import { DesktopModalShell } from "./DesktopModalShell";
import { DesktopStructureTree } from "./DesktopStructureTree";

export function DesktopStructureModal({
  nodes,
  allNodes,
  expandedIds,
  selectedId,
  filters,
  quickFilter,
  onFilterChange,
  onQuickFilterChange,
  onResetFilters,
  onToggle,
  onSelect,
  onClose,
  title = "Структура объектов",
  subtitle = "Полная иерархия корпусов, этажей, отделений, помещений и оборудования",
}) {
  return (
    <DesktopModalShell
      onClose={onClose}
      size="structure"
      title={title}
      subtitle={subtitle}
      bodyClassName="obj-structure-modal-body"
      footer={<button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose}>Закрыть</button>}
    >
      <div className="obj-filters-card obj-filters-card-modal">
        <div className="obj-filters-selects">
          <select className="obj-select" value={filters.object} onChange={(event) => onFilterChange("object", event.target.value)}>
            <option>Объект (Все)</option>
            <option>Корпус А</option>
            <option>Корпус Б</option>
          </select>
          <select className="obj-select" value={filters.floor} onChange={(event) => onFilterChange("floor", event.target.value)}>
            <option>Этаж (Все)</option>
            <option>1 этаж</option>
            <option>2 этаж</option>
            <option>3 этаж</option>
          </select>
          <select className="obj-select" value={quickFilter === "Все" ? "Статус (Любой)" : quickFilter} onChange={(event) => onQuickFilterChange(event.target.value)}>
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
              className={`obj-chip ${quickFilter === chip ? "obj-chip-active" : chip === "С расхождениями" ? "obj-chip-error" : "obj-chip-default"}`}
              type="button"
              key={chip}
              onClick={() => onQuickFilterChange(chip)}
            >
              {chip}
            </button>
          ))}
          <button className="obj-reset-filter" type="button" onClick={onResetFilters}>Сбросить</button>
        </div>
      </div>
      <DesktopStructureTree
        nodes={nodes}
        allNodes={allNodes}
        expandedIds={expandedIds}
        selectedId={selectedId}
        onToggle={onToggle}
        onSelect={onSelect}
        showEquipment
      />
    </DesktopModalShell>
  );
}
