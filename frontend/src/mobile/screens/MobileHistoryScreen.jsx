import { useMemo, useState } from "react";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloudSyncOutlined,
  ExportOutlined,
  FileTextOutlined,
  PictureOutlined,
  SyncOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";
import { MobileBottomSheet } from "../components/MobileBottomSheet.jsx";
import { MobileSearchFilterBar } from "../components/MobileSearchFilterBar.jsx";
import { mobileHistoryData } from "../data/mobileMockData.js";

const eventIcons = {
  "Комментарии": FileTextOutlined,
  "Перемещения": ExportOutlined,
  "Проверки": CheckCircleOutlined,
  "Расхождения": WarningOutlined,
  "Синхронизация": SyncOutlined,
  "Фото": PictureOutlined,
};

function HistoryEventCard({ event, isSelected, onSelect }) {
  const Icon = eventIcons[event.type] ?? FileTextOutlined;

  return (
    <article
      className={`mobile-history-event is-${event.tone}${isSelected ? " is-selected" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(event.id)}
      onKeyDown={(keyboardEvent) => {
        if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
          keyboardEvent.preventDefault();
          onSelect(event.id);
        }
      }}
    >
      <div className="mobile-history-event-icon">
        <Icon aria-hidden="true" />
      </div>
      <div className="mobile-history-event-body">
        <div>
          <h3>{event.title}</h3>
          <time>{event.time}</time>
        </div>
        <p>{event.context}</p>
        {event.item ? <span>{event.item}</span> : null}
        {event.description ? <small>{event.description}</small> : null}
        {typeof event.progress === "number" ? (
          <div className="mobile-history-progress" aria-hidden="true">
            <span style={{ width: `${event.progress}%` }} />
          </div>
        ) : null}
        <footer>
          <em>{event.status}</em>
          <span>{event.user}</span>
        </footer>
      </div>
    </article>
  );
}

export function MobileHistoryScreen({ activeNavKey, onBack, onOpenSync, onNavSelect }) {
  const data = mobileHistoryData;
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(data.filters[0]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [feedback, setFeedback] = useState("");
  const selectedEvent = data.events.find((event) => event.id === selectedEventId) ?? null;

  const visibleEvents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredByChip =
      activeFilter === "Все"
        ? data.events
        : data.events.filter((event) =>
            activeFilter === "Сегодня"
              ? event.date === "Сегодня"
              : event.statusKey === activeFilter || event.type === activeFilter,
          );

    if (!normalizedQuery) {
      return filteredByChip;
    }

    return filteredByChip.filter((event) =>
      [event.title, event.context, event.item, event.user, event.type, event.status, event.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [activeFilter, data.events, searchQuery]);

  return (
    <div className="mobile-history-screen">
      <header className="mobile-history-header">
        <button type="button" aria-label="Назад" onClick={onBack}>
          <ArrowLeftOutlined aria-hidden="true" />
        </button>
        <h1>История</h1>
        <button type="button" aria-label="Синхронизация" onClick={onOpenSync}>
          <CloudSyncOutlined aria-hidden="true" />
        </button>
      </header>

      <main className="mobile-history-content">
        <section className="mobile-card mobile-history-summary">
          <div>
            <h2>{data.summary.title}</h2>
            <span>{data.summary.user}</span>
          </div>
          <p>{data.summary.lastActivity}</p>
          <div className="mobile-history-stat-grid">
            {data.summary.stats.map((stat) => (
              <div className={`is-${stat.tone}`} key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
          <button type="button" onClick={onOpenSync}>
            <CloudSyncOutlined aria-hidden="true" />
            Открыть синхронизацию
          </button>
        </section>

        <section className="mobile-history-tools">
          <MobileSearchFilterBar
            placeholder="Поиск по действию, помещению или ID"
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            filters={data.filters}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            filterLabel="Фильтр истории"
          />
          <button type="button" onClick={() => setFeedback("Экспорт подготовлен локально")}>
            <ExportOutlined aria-hidden="true" />
            Экспорт
          </button>
        </section>

        {feedback ? <div className="mobile-history-feedback">{feedback}</div> : null}

        <section className="mobile-history-list-section">
          <div className="mobile-history-day-title">
            <h2>Сегодня</h2>
            <span />
          </div>
          <div className="mobile-history-list">
            {visibleEvents.length > 0 ? (
              visibleEvents.map((event) => (
                <HistoryEventCard
                  event={event}
                  isSelected={event.id === selectedEventId}
                  key={event.id}
                  onSelect={(eventId) => setSelectedEventId(eventId)}
                />
              ))
            ) : (
              <div className="mobile-history-empty">События не найдены</div>
            )}
          </div>
        </section>
      </main>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />

      {selectedEvent ? (
        <MobileBottomSheet
          title={selectedEvent.title}
          subtitle={selectedEvent.type}
          mode="sheet"
          onClose={() => setSelectedEventId(null)}
          footer={({ close }) => (
            <button className="mobile-primary-button" type="button" onClick={() => close(() => setSelectedEventId(null))}>
              Закрыть
            </button>
          )}
        >
          <div className="mobile-history-detail-sheet">
            {(selectedEvent.details ?? [
              { label: "Позиция", value: selectedEvent.item },
              { label: "Контекст", value: selectedEvent.context },
              { label: "Исполнитель", value: selectedEvent.user },
              { label: "Время", value: `${selectedEvent.date}, ${selectedEvent.time}` },
              { label: "Статус", value: selectedEvent.status },
              { label: "Комментарий", value: selectedEvent.description },
            ])
              .filter((item) => item.value)
              .map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
          </div>
        </MobileBottomSheet>
      ) : null}
    </div>
  );
}
