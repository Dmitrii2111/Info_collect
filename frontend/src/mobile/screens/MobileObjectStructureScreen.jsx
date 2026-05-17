import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  ExclamationCircleFilled,
  MinusOutlined,
  RightOutlined,
  SearchOutlined,
  SyncOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";

const floorIcons = {
  completed: CheckCircleFilled,
  inProgress: UpOutlined,
  discrepancy: ExclamationCircleFilled,
  notStarted: ClockCircleOutlined,
  disabled: MinusOutlined,
};

function MobileStructureFloor({ floor, expanded, onToggle, onOpenDepartment }) {
  const Icon = floorIcons[floor.statusType] ?? ClockCircleOutlined;
  const canExpand = !floor.technical && floor.departments?.length;

  return (
    <article
      className={`mobile-structure-floor is-${floor.statusType}${expanded ? " is-expanded" : ""}`}
    >
      <button
        className="mobile-structure-floor-head"
        type="button"
        onClick={canExpand ? onToggle : undefined}
        disabled={!canExpand}
      >
        <div className="mobile-structure-floor-title">
          <span aria-hidden="true">
            <Icon />
          </span>
          <div>
            <strong>{floor.title}</strong>
            <small>{floor.statusLine}</small>
          </div>
        </div>
        {canExpand ? (
          expanded ? (
            <UpOutlined aria-hidden="true" />
          ) : (
            <RightOutlined aria-hidden="true" />
          )
        ) : null}
      </button>

      {expanded ? (
        <div className="mobile-structure-expanded">
          <div className="mobile-structure-metrics">
            {floor.summary.map((metric) => (
              <span
                className={metric.includes("расх") && !metric.startsWith("0") ? "is-error" : ""}
                key={metric}
              >
                {metric}
              </span>
            ))}
          </div>
          <div className="mobile-structure-zones">
            {floor.departments.map((zone) => {
              const canOpenDepartment = Boolean(zone.rooms?.length);

              return (
                <button
                  type="button"
                  key={zone.id}
                  onClick={
                    canOpenDepartment ? () => onOpenDepartment(floor.id, zone.id) : undefined
                  }
                  disabled={!canOpenDepartment}
                >
                  <span>
                    <strong>{zone.title}</strong>
                    <small>
                      <em>{zone.status}</em>
                      {zone.progress}
                      {zone.note ? <b>{zone.note}</b> : null}
                    </small>
                  </span>
                  <RightOutlined aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function MobileObjectStructureScreen({
  activeNavKey,
  initialExpandedFloorId,
  onBack,
  onContinueWalkthrough,
  onOpenDepartment,
  onNavSelect,
  structure,
}) {
  const data = structure;
  const [expandedFloorId, setExpandedFloorId] = useState(initialExpandedFloorId ?? null);
  const [activeFilter, setActiveFilter] = useState(data.filters[0]);
  const isComplete = data.progress.value >= 100;
  const primaryActionLabel = data.progress.value > 0 ? "Продолжить обход" : "Начать обход";
  const visibleFloors =
    activeFilter === "Все"
      ? data.floors
      : data.floors.filter((floor) => {
        if (activeFilter === "В работе") {
          return floor.statusType === "inProgress";
        }

        if (activeFilter === "С расхождениями") {
          return floor.summary?.some((item) => item.includes("расх") && !item.startsWith("0"));
        }

        if (activeFilter === "Не начато") {
          return floor.statusType === "notStarted";
        }

        return floor.statusLine?.includes(activeFilter);
      });

  const toggleFloor = (floorId) => {
    setExpandedFloorId((currentFloorId) => (currentFloorId === floorId ? null : floorId));
  };

  return (
    <div className="mobile-object-structure-screen">
      <header className="mobile-structure-header">
        <button type="button" aria-label="Назад к объектам" onClick={onBack}>
          <ArrowLeftOutlined aria-hidden="true" />
        </button>
        <h1>Структура объекта</h1>
        <button type="button" aria-label="Синхронизация">
          <SyncOutlined aria-hidden="true" />
        </button>
      </header>

      <main className="mobile-object-structure-content">
        <section className="mobile-card mobile-structure-summary">
          <div className="mobile-structure-summary-head">
            <div>
              <h2>{data.title}</h2>
              <p>{data.subtitle}</p>
            </div>
            <span>{data.pendingLabel}</span>
          </div>
          <div className="mobile-structure-stat-grid">
            {data.stats.map((stat) => (
              <div className={`is-${stat.tone}`} key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
          <div className="mobile-structure-progress">
            <div>
              <span>{data.progress.label}</span>
              <strong>{data.progress.value}%</strong>
            </div>
            <div aria-hidden="true">
              <span style={{ width: `${data.progress.value}%` }} />
            </div>
          </div>
          {!isComplete ? (
            <button className="mobile-primary-button" type="button" onClick={onContinueWalkthrough}>
              {primaryActionLabel}
              <RightOutlined aria-hidden="true" />
            </button>
          ) : null}
        </section>

        <section className="mobile-structure-tools">
          <label className="mobile-search-field">
            <SearchOutlined aria-hidden="true" />
            <input type="search" placeholder="Поиск этажа, зоны или помещения" />
          </label>
          <div className="mobile-filter-row">
            {data.filters.map((filter) => (
              <button
                className={filter === activeFilter ? "is-active" : ""}
                type="button"
                key={filter}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </section>

        <section className="mobile-structure-list-section">
          <h3>Этажи и зоны</h3>
          <div className="mobile-structure-floor-list">
            {visibleFloors.map((floor) => (
              <MobileStructureFloor
                floor={floor}
                key={floor.id}
                expanded={expandedFloorId === floor.id}
                onToggle={() => toggleFloor(floor.id)}
                onOpenDepartment={onOpenDepartment}
              />
            ))}
          </div>
        </section>
      </main>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />
    </div>
  );
}
