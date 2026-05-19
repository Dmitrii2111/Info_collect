import { useMemo, useState } from "react";
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  RightOutlined,
  SyncOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";
import { MobileEmptyState } from "../components/MobileEmptyState.jsx";
import { MobileSearchFilterBar } from "../components/MobileSearchFilterBar.jsx";
import { mobileDiscrepanciesData } from "../data/mobileMockData.js";

function getCountByStatus(items, statusKey) {
  return items.filter((item) => item.statusKey === statusKey).length;
}

function DiscrepancyCard({ item, isSelected, onSelect }) {
  return (
    <article
      className={`mobile-discrepancy-card is-${item.severity}${isSelected ? " is-selected" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(item.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.(item.id);
        }
      }}
    >
      <div>
        <span>{item.context}</span>
        <h3>{item.title}</h3>
        <small>ID: {item.itemCode}</small>
      </div>
      <em>{item.severityLabel}</em>
      <p>
        <WarningOutlined aria-hidden="true" />
        {item.reason}
      </p>
      {item.comment ? (
        <p>
          <SyncOutlined aria-hidden="true" />
          {item.comment}
        </p>
      ) : null}
      <footer>
        <span>{item.type}</span>
        <span>{item.responsible}</span>
        <span>{item.date}</span>
      </footer>
      <RightOutlined aria-hidden="true" />
    </article>
  );
}

export function MobileDiscrepanciesScreen({ activeNavKey, onBack, onOpenDiscrepancy, onNavSelect }) {
  const data = mobileDiscrepanciesData;
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(data.filters[0]);
  const [selectedDiscrepancyId, setSelectedDiscrepancyId] = useState(null);
  const [feedback, setFeedback] = useState("");

  const visibleDiscrepancies = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredByStatus =
      activeFilter === "Все"
        ? data.discrepancies
        : data.discrepancies.filter((item) => item.statusKey === activeFilter);

    if (!normalizedQuery) {
      return filteredByStatus;
    }

    return filteredByStatus.filter((item) =>
      [item.title, item.context, item.itemCode, item.status, item.severityLabel, item.reason]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [activeFilter, data.discrepancies, searchQuery]);

  const handleSelect = (id) => {
    setSelectedDiscrepancyId(id);
    onOpenDiscrepancy?.(id);
  };

  const handleOpenNext = () => {
    const currentIndex = visibleDiscrepancies.findIndex((item) => item.id === selectedDiscrepancyId);
    const nextItem = visibleDiscrepancies[currentIndex + 1] ?? visibleDiscrepancies[0];

    if (nextItem) {
      handleSelect(nextItem.id);
    }
  };

  const unresolvedCount = data.discrepancies.filter((item) => item.statusKey !== "Решены").length;

  return (
    <div className="mobile-discrepancies-screen">
      <header className="mobile-discrepancies-header">
        <button type="button" aria-label="Назад" onClick={onBack}>
          <ArrowLeftOutlined aria-hidden="true" />
        </button>
        <h1>Расхождения</h1>
        <button
          type="button"
          aria-label="Синхронизация"
          onClick={() => setFeedback("Откройте экран синхронизации для отправки изменений")}
        >
          <SyncOutlined aria-hidden="true" />
        </button>
      </header>

      <main className="mobile-discrepancies-content">
        <section className="mobile-card mobile-discrepancies-summary">
          <div>
            <h2>{data.summary.title}</h2>
            <p>{data.context}</p>
          </div>
          <div className="mobile-discrepancies-stats">
            <div className="is-primary">
              <span>Всего</span>
              <strong>{data.discrepancies.length}</strong>
            </div>
            <div className="is-error">
              <span>Критично</span>
              <strong>{data.discrepancies.filter((item) => item.severity === "critical").length}</strong>
            </div>
            <div className="is-warning">
              <span>Конфликт</span>
              <strong>{data.discrepancies.filter((item) => item.severity === "conflict").length}</strong>
            </div>
            <div className="is-secondary">
              <span>В очереди</span>
              <strong>{getCountByStatus(data.discrepancies, "В работе")}</strong>
            </div>
          </div>
          <div className="mobile-discrepancies-progress">
            <span>{data.summary.progressText}</span>
            <div aria-hidden="true">
              <span style={{ width: `${data.summary.progressValue}%` }} />
            </div>
          </div>
          <button type="button" onClick={handleOpenNext}>
            Продолжить проверку
          </button>
        </section>

        <MobileSearchFilterBar
          placeholder="Поиск помещения, оборудования или ID"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filters={data.filters}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          filterLabel="Фильтр расхождений"
        />

        {feedback ? <div className="mobile-discrepancies-feedback">{feedback}</div> : null}

        <section className="mobile-discrepancies-list">
          {visibleDiscrepancies.length > 0 ? (
            visibleDiscrepancies.map((item) => (
              <DiscrepancyCard
                item={item}
                isSelected={item.id === selectedDiscrepancyId}
                key={item.id}
                onSelect={handleSelect}
              />
            ))
          ) : (
            <MobileEmptyState className="mobile-discrepancies-empty">Расхождения не найдены</MobileEmptyState>
          )}
        </section>
      </main>

      <div className="mobile-discrepancies-action-bar">
        <p>Осталось {unresolvedCount} неразрешенных расхождения</p>
        <div>
          <button type="button" onClick={handleOpenNext}>
            Открыть следующее
          </button>
          <button type="button" aria-label="Синхронизация" onClick={() => setFeedback("Откройте экран синхронизации для отправки изменений")}>
            <SyncOutlined aria-hidden="true" />
          </button>
        </div>
      </div>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />
    </div>
  );
}
