import {
  ApartmentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  HistoryOutlined,
  RightOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";
import { MobileEmptyState } from "../components/MobileEmptyState.jsx";
import { MobileHeader } from "../components/MobileHeader.jsx";
import { MobileSearchFilterBar } from "../components/MobileSearchFilterBar.jsx";
import { mobileObjectsData } from "../data/mobileMockData.js";

const detailIcons = {
  default: DatabaseOutlined,
  error: WarningOutlined,
  primary: ClockCircleOutlined,
  muted: ApartmentOutlined,
  success: CheckCircleOutlined,
};

function MobileObjectCard({ object, onOpenObjectStructure }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenObjectStructure?.(object.id);
    }
  };

  return (
    <article
      className={`mobile-object-card is-${object.tone}`}
      role="button"
      tabIndex={0}
      onClick={() => onOpenObjectStructure?.(object.id)}
      onKeyDown={handleKeyDown}
    >
      <div className="mobile-object-card-body">
        <div className="mobile-object-card-head">
          <div>
            <h4>{object.title}</h4>
            <p>{object.subtitle}</p>
            {object.description ? <span>{object.description}</span> : null}
          </div>
          <em>{object.status}</em>
        </div>

        {object.progressLabel ? (
          <div className="mobile-object-progress">
            <div>
              <span>{object.progressLabel}</span>
              <strong>{object.progressValue}%</strong>
            </div>
            <div aria-hidden="true">
              <span style={{ width: `${object.progressValue}%` }} />
            </div>
          </div>
        ) : null}

        <div className="mobile-object-detail-grid">
          {object.details.map((detail) => {
            const Icon = detailIcons[detail.tone] ?? DatabaseOutlined;

            return (
              <span
                className={`is-${detail.tone}${detail.wide ? " is-wide" : ""}`}
                key={detail.label}
              >
                <Icon aria-hidden="true" />
                {detail.label}
              </span>
            );
          })}
        </div>
      </div>

      <button className="mobile-object-action" type="button">
        <span>
          {object.action}
          {object.actionHint ? <small>• {object.actionHint}</small> : null}
        </span>
        <RightOutlined aria-hidden="true" />
      </button>
    </article>
  );
}

export function MobileObjectsScreen({
  activeNavKey,
  objectsData,
  onOpenMenu,
  onContinueWalkthrough,
  onOpenObjectStructure,
  onOpenRecentZone,
  onNavSelect,
}) {
  const data = objectsData ?? mobileObjectsData;
  const [activeFilter, setActiveFilter] = useState(data.filters[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [syncStatus, setSyncStatus] = useState(data.summary.updatedAt);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleObjects = (activeFilter === "Все"
    ? data.objects
    : data.objects.filter((object) => {
        if (activeFilter === "С расхождениями") {
          return object.tone === "error" || object.status === "Внимание";
        }

        return object.status === activeFilter;
      })).filter((object) => {
        if (!normalizedQuery) {
          return true;
        }

        return [object.title, object.subtitle, object.description, object.status, ...object.details.map((detail) => detail.label)]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      });

  return (
    <div className="mobile-objects-screen">
      <MobileHeader
        title="Объекты"
        onMenu={onOpenMenu}
        onSync={() => setSyncStatus(`Обновлено локально: ${new Date().toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        })}`)}
      />

      <main className="mobile-objects-content">
        <section className="mobile-card mobile-objects-summary">
          <div>
            <h2>{data.summary.title}</h2>
            <p>{data.summary.subtitle}</p>
          </div>
          <div className="mobile-objects-stats">
            {data.summary.stats.map((stat) => (
              <div className={`is-${stat.tone}`} key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
          <div className="mobile-objects-summary-actions">
            <span>{syncStatus}</span>
            <button type="button" onClick={onContinueWalkthrough}>{data.summary.actionLabel ?? "Продолжить обход"}</button>
          </div>
        </section>

        <MobileSearchFilterBar
          placeholder="Поиск объекта, корпуса или зоны"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filters={data.filters}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          filterLabel="Фильтр объектов"
        />

        <section className="mobile-objects-list-section">
          <h3>Объекты</h3>
          <div className="mobile-objects-list">
            {visibleObjects.length > 0 ? (
              visibleObjects.map((object) => (
                <MobileObjectCard
                  object={object}
                  key={object.id}
                  onOpenObjectStructure={onOpenObjectStructure}
                />
              ))
            ) : (
              <MobileEmptyState className="mobile-objects-empty">Ничего не найдено</MobileEmptyState>
            )}
          </div>
        </section>

        <section className="mobile-objects-list-section mobile-recent-zones-section">
          <h3>Недавние зоны</h3>
          <div className="mobile-recent-zones">
            {data.recentZones.map((zone, index) => (
              <button type="button" key={zone} onClick={() => onOpenRecentZone?.(index)}>
                <span>
                  <HistoryOutlined aria-hidden="true" />
                  {zone}
                </span>
                <RightOutlined aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      </main>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />
    </div>
  );
}
