import { useMemo, useState } from "react";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  RightOutlined,
  SearchOutlined,
  SyncOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";

function WalkthroughRoomCard({ room, onOpenRoom }) {
  const isError = room.state === "error";
  const isComplete = room.state === "complete";
  const Icon = isComplete ? CheckCircleOutlined : ClockCircleOutlined;

  return (
    <button
      className={`mobile-walkthrough-room-card is-${room.state}`}
      type="button"
      onClick={() => onOpenRoom?.(room.id)}
    >
      <div className="mobile-walkthrough-room-head">
        <div>
          <h3>{room.title}</h3>
          {room.action ? <span>{room.action}</span> : null}
        </div>
        <div>
          <em>{room.status}</em>
          <RightOutlined aria-hidden="true" />
        </div>
      </div>

      <div className="mobile-walkthrough-room-progress">
        <span>
          <Icon aria-hidden="true" />
          {room.progress}
        </span>
        <div aria-hidden="true">
          <span style={{ width: `${room.progressValue ?? 0}%` }} />
        </div>
      </div>

      {room.notes?.length ? (
        <div className={`mobile-walkthrough-room-note${isError ? " is-error" : ""}`}>
          {isError ? <WarningOutlined aria-hidden="true" /> : <SyncOutlined aria-hidden="true" />}
          {room.notes[0]}
        </div>
      ) : null}
    </button>
  );
}

export function MobileWalkthroughRoomsScreen({
  activeNavKey,
  inspection,
  onBack,
  onOpenRoom,
  onNavSelect,
}) {
  const walkthrough = inspection?.walkthrough;
  const rooms = walkthrough?.rooms ?? [];
  const filters = walkthrough?.filters ?? ["Все"];
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [feedback, setFeedback] = useState("");

  const visibleRooms = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredByStatus =
      activeFilter === "Все" ? rooms : rooms.filter((room) => room.statusKey === activeFilter);

    if (!normalizedQuery) {
      return filteredByStatus;
    }

    return filteredByStatus.filter((room) =>
      [room.title, room.status, room.progress]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [activeFilter, rooms, searchQuery]);

  return (
    <div className="mobile-walkthrough-screen">
      <header className="mobile-walkthrough-header">
        <div>
          <button type="button" aria-label="Назад к инспекциям" onClick={onBack}>
            <ArrowLeftOutlined aria-hidden="true" />
          </button>
          <h1>Обход</h1>
          <button
            type="button"
            aria-label="Синхронизация"
            onClick={() => setFeedback("Синхронизация отмечена локально")}
          >
            <SyncOutlined aria-hidden="true" />
          </button>
        </div>
        <span>{walkthrough?.syncStatus ?? "Онлайн"}</span>
      </header>

      <main className="mobile-walkthrough-content">
        <section className="mobile-card mobile-walkthrough-summary">
          <div>
            <h2>{walkthrough?.title ?? "Инспекция не выбрана"}</h2>
            <p>{walkthrough?.context}</p>
          </div>

          <div className="mobile-walkthrough-progress">
            <div>
              <span>Прогресс обхода</span>
              <strong>{walkthrough?.progressValue ?? 0}%</strong>
            </div>
            <div aria-hidden="true">
              <span style={{ width: `${walkthrough?.progressValue ?? 0}%` }} />
            </div>
            <p>{walkthrough?.progressLabel ?? "0 из 0 помещений проверено"}</p>
          </div>

          <div className="mobile-walkthrough-metrics">
            {walkthrough?.metrics?.map((metric) => (
              <div className={`is-${metric.tone}`} key={metric.label}>
                <span>{metric.label}</span>
                <strong>
                  {metric.value}
                  {metric.suffix ? <small>{metric.suffix}</small> : null}
                </strong>
              </div>
            ))}
          </div>

          <button type="button" onClick={() => rooms[0] && onOpenRoom?.(rooms[0].id)}>
            {walkthrough?.continueLabel ?? "Открыть помещение"}
          </button>
        </section>

        <section className="mobile-walkthrough-tools">
          <label className="mobile-search-field">
            <SearchOutlined aria-hidden="true" />
            <input
              type="search"
              placeholder="Поиск помещения или оборудования"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
          <div className="mobile-filter-row">
            {filters.map((filter) => (
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

        {feedback ? <div className="mobile-walkthrough-feedback">{feedback}</div> : null}

        <section className="mobile-walkthrough-rooms">
          {visibleRooms.length > 0 ? (
            visibleRooms.map((room) => (
              <WalkthroughRoomCard room={room} key={room.id} onOpenRoom={onOpenRoom} />
            ))
          ) : (
            <div className="mobile-walkthrough-empty">Помещения не найдены</div>
          )}
        </section>

        <button
          className="mobile-walkthrough-finish"
          type="button"
          onClick={() => setFeedback("Завершение обхода будет доступно на Stage 7")}
        >
          <DatabaseOutlined aria-hidden="true" />
          Завершить обход
        </button>
      </main>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />
    </div>
  );
}
