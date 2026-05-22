import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleFilled,
  InfoCircleOutlined,
  PlayCircleOutlined,
  SyncOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";
import { MobileBottomSheet } from "../components/MobileBottomSheet.jsx";
import { MobileEmptyState } from "../components/MobileEmptyState.jsx";
import { MobileSearchFilterBar } from "../components/MobileSearchFilterBar.jsx";
import { mobileDepartmentRoomsData } from "../data/mobileMockData.js";

const roomIcons = {
  active: ClockCircleOutlined,
  complete: CheckCircleFilled,
  empty: PlayCircleOutlined,
  error: ExclamationCircleFilled,
};

function MobileRoomCard({ room, onOpenRoom }) {
  const Icon = roomIcons[room.state] ?? ClockCircleOutlined;
  const roomId = room.id ?? room.title;

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenRoom?.(roomId);
    }
  };

  if (room.featured) {
    return (
      <article
        className="mobile-room-card is-featured"
        role="button"
        tabIndex={0}
        onClick={() => onOpenRoom?.(roomId)}
        onKeyDown={handleKeyDown}
      >
        <div className="mobile-room-featured-head">
          <h4>{room.title}</h4>
          <em>{room.status}</em>
        </div>
        <div className="mobile-room-featured-grid">
          <div>
            <span>Прогресс</span>
            <strong>{room.progress}</strong>
            <div aria-hidden="true">
              <i style={{ width: `${room.progressValue}%` }} />
            </div>
          </div>
          <div>
            <span>Инфо</span>
            {room.notes.map((note) => (
              <b key={note}>{note}</b>
            ))}
          </div>
        </div>
        <button type="button">{room.action}</button>
      </article>
    );
  }

  return (
    <article
      className={`mobile-room-card is-${room.state}`}
      role="button"
      tabIndex={0}
      onClick={() => onOpenRoom?.(roomId)}
      onKeyDown={handleKeyDown}
    >
      <div className="mobile-room-row">
        <span aria-hidden="true">
          <Icon />
        </span>
        <div>
          <h4>{room.title}</h4>
          <p>
            <strong>{room.status}</strong>
            <small>•</small>
            {room.progress}
          </p>
          {room.notes?.map((note) => (
            <em key={note}>{note}</em>
          ))}
        </div>
      </div>
      <button type="button">{room.action}</button>
    </article>
  );
}

export function MobileDepartmentRoomsScreen({
  activeNavKey,
  department,
  onBack,
  onOpenRoom,
  onOpenSync,
  onNavSelect,
}) {
  const data = department ?? mobileDepartmentRoomsData;
  const filters = mobileDepartmentRoomsData.filters;
  const quickActions = mobileDepartmentRoomsData.quickActions;
  const progress = data.progressSummary ?? data.progress;
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const isZoneComplete = isCompleted || progress.value >= 100 || data.status === "Завершено";
  const checkedRooms = data.rooms.filter((room) => room.state === "complete").length;
  const totalRooms = data.rooms.length;
  const remainingRooms = Math.max(totalRooms - checkedRooms, 0);
  const discrepancyCount = data.rooms.filter((room) => room.state === "error").length;
  const pendingCount = data.rooms.filter((room) => room.notes?.some((note) => note.includes("не отправ"))).length;
  const isZoneStarted = data.rooms.some((room) => room.state === "active" || room.state === "complete" || room.state === "error");
  const nextRoom = data.rooms.find((room) => room.state === "active" || room.state === "empty") ?? data.rooms[0];
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleRooms = (activeFilter === "Все"
    ? data.rooms
    : data.rooms.filter((room) => {
        if (activeFilter === "В работе") {
          return room.state === "active";
        }

        if (activeFilter === "С расхождениями") {
          return room.state === "error" || room.notes?.some((note) => note.includes("расх"));
        }

        if (activeFilter === "Не отправлено") {
          return room.notes?.some((note) => note.includes("не отправ"));
        }

        if (activeFilter === "Не начато") {
          return room.state === "empty";
        }

        if (activeFilter === "Завершено") {
          return room.state === "complete";
        }

        return room.status === activeFilter;
      })).filter((room) => {
        if (!normalizedQuery) {
          return true;
        }

        return [
          room.title,
          room.status,
          room.progress,
          room.action,
          ...(room.notes ?? []),
          ...(room.equipment ?? []).flatMap((item) => [item.title, item.id, item.status, item.note]),
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      });

  return (
    <div className="mobile-department-rooms-screen">
      <header className="mobile-structure-header">
        <button type="button" aria-label="Назад к структуре объекта" onClick={onBack}>
          <ArrowLeftOutlined aria-hidden="true" />
        </button>
        <h1>Отделение</h1>
        <button type="button" aria-label="Синхронизация" onClick={onOpenSync}>
          <SyncOutlined aria-hidden="true" />
        </button>
      </header>

      <main className="mobile-department-content">
        <section className="mobile-card mobile-department-summary">
          <div className="mobile-department-summary-head">
            <div>
              <p>{data.context}</p>
              <h2>{data.title}</h2>
            </div>
            <span>{isZoneComplete ? "Зона завершена" : department ? data.status : mobileDepartmentRoomsData.status}</span>
          </div>
          <div className="mobile-department-stat-grid">
            {data.stats.map((stat) => (
              <div className={`is-${stat.tone ?? "default"}`} key={stat.label}>
                <span>{stat.label}</span>
                {stat.values.map((value) => (
                  <strong key={value}>{value}</strong>
                ))}
              </div>
            ))}
          </div>
          <div className="mobile-department-progress">
            <div>
              <span>{data.progress?.label ?? "Прогресс обхода"}</span>
              <strong>
                {progress.value}% <small>({progress.detail})</small>
              </strong>
            </div>
            <div aria-hidden="true">
              <span style={{ width: `${progress.value}%` }} />
            </div>
          </div>
          {!isZoneComplete ? (
            <div className="mobile-department-actions">
              <button
                className="mobile-primary-button"
                type="button"
                onClick={() => nextRoom && onOpenRoom?.(nextRoom.id ?? nextRoom.title)}
              >
                <PlayCircleOutlined aria-hidden="true" />
                {isZoneStarted ? "Продолжить обход" : "Начать обход"}
              </button>
              <button type="button" onClick={onBack}>
                Открыть структуру
              </button>
            </div>
          ) : null}
        </section>

        <MobileSearchFilterBar
          placeholder="Поиск помещения или оборудования"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          filterLabel="Фильтр помещений"
        />

        <section className="mobile-rooms-section">
          <h3>Помещения зоны</h3>
          <div className="mobile-rooms-list">
            {visibleRooms.length > 0 ? (
              visibleRooms.map((room) => (
                <MobileRoomCard room={room} key={room.id ?? room.title} onOpenRoom={onOpenRoom} />
              ))
            ) : (
              <MobileEmptyState className="mobile-rooms-empty">Ничего не найдено</MobileEmptyState>
            )}
          </div>
        </section>

        <section className="mobile-room-quick-section">
          <h3>Быстрый доступ</h3>
          <div>
            {quickActions.map((action) => (
              <button
                className={`is-${action.tone}${isZoneComplete ? " is-disabled" : ""}`}
                type="button"
                key={action.label}
                disabled={isZoneComplete}
                onClick={() => {
                  if (isZoneComplete) {
                    return;
                  }

                  if (action.label === "Завершить зону") {
                    setActiveOverlay("finish");
                    return;
                  }

                  if (action.label === "След. помещение" && nextRoom) {
                    onOpenRoom?.(nextRoom.id ?? nextRoom.title);
                  }
                }}
              >
                {action.label === "След. помещение" ? "Следующая зона" : action.label}
              </button>
            ))}
          </div>
        </section>
      </main>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />

      {activeOverlay === "finish" ? (
        <MobileBottomSheet
          title="Завершить зону?"
          subtitle="Вы уверены, что хотите завершить осмотр зоны?"
          mode="modal"
          onClose={() => setActiveOverlay(null)}
          footer={({ close }) => (
            <div className="mobile-overlay-actions is-vertical">
              <button
                type="button"
                onClick={() => close(() => {
                  setIsCompleted(true);
                  setActiveOverlay(null);
                })}
              >
                Да, завершить
              </button>
              <button type="button" onClick={() => close()}>Нет, вернуться к зоне</button>
            </div>
          )}
        >
          <div className="mobile-completion-context">
            <h3>{data.title}</h3>
            <p>{data.context}</p>
            <div className="mobile-completion-progress">
              <span>{data.progress?.label ?? "Прогресс обхода"}</span>
              <strong>{progress.value}%</strong>
              <div aria-hidden="true">
                <i style={{ width: `${progress.value}%` }} />
              </div>
            </div>
            <div className="mobile-completion-grid">
              <span>
                <CheckCircleOutlined aria-hidden="true" />
                {checkedRooms} из {totalRooms}
              </span>
              <span>
                <ClockCircleOutlined aria-hidden="true" />
                {remainingRooms} осталось
              </span>
              <span className="is-error">
                <WarningOutlined aria-hidden="true" />
                {discrepancyCount} расхождения
              </span>
              <span className="is-warning">
                <SyncOutlined aria-hidden="true" />
                {pendingCount} не отправлено
              </span>
            </div>
          </div>
          <div className="mobile-confirm-note is-boxed">
            <InfoCircleOutlined aria-hidden="true" />
            <p>После завершения зона будет отмечена как завершенная. Вы сможете вернуться к ней позже.</p>
          </div>
        </MobileBottomSheet>
      ) : null}
    </div>
  );
}
