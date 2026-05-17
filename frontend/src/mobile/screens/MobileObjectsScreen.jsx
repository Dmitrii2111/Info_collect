import {
  ApartmentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  HistoryOutlined,
  RightOutlined,
  SearchOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";
import { MobileHeader } from "../components/MobileHeader.jsx";
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
  onOpenMenu,
  onContinueWalkthrough,
  onOpenObjectStructure,
  onOpenRecentZone,
  onNavSelect,
}) {
  const data = mobileObjectsData;
  const [activeFilter, setActiveFilter] = useState(data.filters[0]);
  const [syncStatus, setSyncStatus] = useState(data.summary.updatedAt);
  const visibleObjects =
    activeFilter === "Все"
      ? data.objects
      : data.objects.filter((object) => {
        if (activeFilter === "С расхождениями") {
          return object.tone === "error" || object.status === "Внимание";
        }

        return object.status === activeFilter;
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
            <button type="button" onClick={onContinueWalkthrough}>Продолжить обход</button>
          </div>
        </section>

        <section className="mobile-objects-tools">
          <label className="mobile-search-field">
            <SearchOutlined aria-hidden="true" />
            <input type="search" placeholder="Поиск объекта, корпуса или зоны" />
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

        <section className="mobile-objects-list-section">
          <h3>Объекты</h3>
          <div className="mobile-objects-list">
            {visibleObjects.map((object) => (
              <MobileObjectCard
                object={object}
                key={object.id}
                onOpenObjectStructure={onOpenObjectStructure}
              />
            ))}
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
