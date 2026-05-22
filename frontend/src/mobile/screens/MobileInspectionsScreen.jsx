import { useMemo, useState } from "react";
import {
  ApartmentOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  DatabaseOutlined,
  InfoCircleOutlined,
  RightOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";
import { MobileEmptyState } from "../components/MobileEmptyState.jsx";
import { MobileHeader } from "../components/MobileHeader.jsx";
import { MobileSearchFilterBar } from "../components/MobileSearchFilterBar.jsx";
import { mobileInspectionsData } from "../data/mobileMockData.js";

const statIcons = {
  inventory: DatabaseOutlined,
  rooms: ApartmentOutlined,
  sync: CloudUploadOutlined,
  warning: WarningOutlined,
};

function getInspectionCountLabel(count) {
  if (count === 1) {
    return "1 инспекция";
  }

  if (count > 1 && count < 5) {
    return `${count} инспекции`;
  }

  return `${count} инспекций`;
}

function InspectionStat({ stat }) {
  const Icon = statIcons[stat.icon] ?? CheckCircleOutlined;

  return (
    <span className={`is-${stat.tone}`}>
      <Icon aria-hidden="true" />
      {stat.label}
    </span>
  );
}

function InspectionCard({ inspection, isSelected, onOpenInspection }) {
  const handleOpen = () => {
    onOpenInspection?.(inspection.id);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpen();
    }
  };

  return (
    <article
      className={`mobile-inspection-card is-${inspection.statusType}${isSelected ? " is-selected" : ""}`}
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
    >
      <div className="mobile-inspection-card-body">
        <div className="mobile-inspection-card-main">
          <div className="mobile-inspection-card-content">
            <div className="mobile-inspection-card-meta">
              <em>{inspection.status}</em>
              <span>{inspection.number}</span>
            </div>

            <div>
              <h3>{inspection.title}</h3>
              {inspection.context ? <p>{inspection.context}</p> : null}
            </div>

            {inspection.stats.length > 0 ? (
              <div className="mobile-inspection-stat-grid">
                {inspection.stats.map((stat) => (
                  <InspectionStat stat={stat} key={stat.label} />
                ))}
              </div>
            ) : null}

            {inspection.featured ? (
              <div className="mobile-inspection-progress">
                <div>
                  <span>{inspection.progressLabel}</span>
                  <strong>{inspection.progressValue}%</strong>
                </div>
                <div aria-hidden="true">
                  <span style={{ width: `${inspection.progressValue}%` }} />
                </div>
              </div>
            ) : null}

            <div className="mobile-inspection-actions">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleOpen();
                }}
              >
                {inspection.action}
              </button>
              {inspection.featured ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpen();
                  }}
                >
                  Карта
                </button>
              ) : null}
            </div>
          </div>

          <RightOutlined aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}

export function MobileInspectionsScreen({
  activeNavKey,
  inspectionsData,
  selectedInspectionId,
  onOpenMenu,
  onOpenInspection,
  onOpenSync,
  onNavSelect,
}) {
  const data = inspectionsData ?? mobileInspectionsData;
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(data.filters[0]);
  const [feedback, setFeedback] = useState("");

  const visibleInspections = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredByStatus =
      activeFilter === "Все"
        ? data.inspections
        : data.inspections.filter((inspection) => inspection.statusKey === activeFilter);

    if (!normalizedQuery) {
      return filteredByStatus;
    }

    return filteredByStatus.filter((inspection) =>
      [inspection.title, inspection.context, inspection.status, inspection.number]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [activeFilter, data.inspections, searchQuery]);

  const handleOpenInspection = (inspectionId) => {
    onOpenInspection?.(inspectionId);
  };

  const handleSync = () => {
    setFeedback(`Обновлено локально ${new Date().toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    })}`);
  };

  return (
    <div className="mobile-inspections-screen">
      <MobileHeader title="InfoCollect" onMenu={onOpenMenu} onSync={handleSync} />

      <main className="mobile-inspections-content">
        <MobileSearchFilterBar
          placeholder={data.searchPlaceholder}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filters={data.filters}
          activeFilter={activeFilter}
          onFilterChange={(filter) => {
            setActiveFilter(filter);
            setFeedback("");
          }}
          filterLabel="Фильтр инспекций"
        />

        {feedback ? <div className="mobile-inspections-feedback">{feedback}</div> : null}

        <section className="mobile-inspections-title-row">
          <h2>{data.summary.title}</h2>
          <span>{getInspectionCountLabel(visibleInspections.length)}</span>
        </section>

        <section className="mobile-inspections-list" aria-label="Список инспекций">
          {visibleInspections.length > 0 ? (
            visibleInspections.map((inspection) => (
              <InspectionCard
                inspection={inspection}
                isSelected={inspection.id === selectedInspectionId}
                key={inspection.id}
                onOpenInspection={handleOpenInspection}
              />
            ))
            ) : (
            <MobileEmptyState className="mobile-inspections-empty">Инспекции не найдены</MobileEmptyState>
          )}
        </section>

        <section className="mobile-inspections-alert">
          <InfoCircleOutlined aria-hidden="true" />
          <div>
            <h3>{data.syncAlert.title}</h3>
            <p>{data.syncAlert.text}</p>
            <button type="button" onClick={onOpenSync}>{data.syncAlert.action}</button>
          </div>
        </section>
      </main>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />
    </div>
  );
}
