import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  ExclamationCircleFilled,
  FilterOutlined,
  PlayCircleOutlined,
  SearchOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";
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
  onNavSelect,
}) {
  const data = department ?? mobileDepartmentRoomsData;
  const filters = mobileDepartmentRoomsData.filters;
  const quickActions = mobileDepartmentRoomsData.quickActions;
  const progress = data.progressSummary ?? data.progress;

  return (
    <div className="mobile-department-rooms-screen">
      <header className="mobile-structure-header">
        <button type="button" aria-label="Назад к структуре объекта" onClick={onBack}>
          <ArrowLeftOutlined aria-hidden="true" />
        </button>
        <h1>Отделение</h1>
        <button type="button" aria-label="Синхронизация">
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
            <span>{department ? data.status : mobileDepartmentRoomsData.status}</span>
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
          <div className="mobile-department-actions">
            <button className="mobile-primary-button" type="button">
              <PlayCircleOutlined aria-hidden="true" />
              Продолжить обход
            </button>
            <button type="button" onClick={onBack}>
              Открыть структуру
            </button>
          </div>
        </section>

        <section className="mobile-department-tools">
          <label className="mobile-search-field">
            <SearchOutlined aria-hidden="true" />
            <input type="search" placeholder="Поиск помещения или оборудования" />
          </label>
          <div className="mobile-filter-row">
            {filters.map((filter, index) => (
              <button className={index === 0 ? "is-active" : ""} type="button" key={filter}>
                {filter === "С расхождениями" ? <FilterOutlined aria-hidden="true" /> : null}
                {filter}
              </button>
            ))}
          </div>
        </section>

        <section className="mobile-rooms-section">
          <h3>Помещения зоны</h3>
          <div className="mobile-rooms-list">
            {data.rooms.map((room) => (
              <MobileRoomCard room={room} key={room.id ?? room.title} onOpenRoom={onOpenRoom} />
            ))}
          </div>
        </section>

        <section className="mobile-room-quick-section">
          <h3>Быстрый доступ</h3>
          <div>
            {quickActions.map((action) => (
              <button className={`is-${action.tone}`} type="button" key={action.label}>
                {action.label}
              </button>
            ))}
          </div>
        </section>
      </main>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />
    </div>
  );
}
