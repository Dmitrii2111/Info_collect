import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  InfoCircleOutlined,
  RightOutlined,
  SearchOutlined,
  SyncOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";

const equipmentIcons = {
  success: CheckCircleOutlined,
  error: WarningOutlined,
  active: SyncOutlined,
  empty: ClockCircleOutlined,
};

const filters = ["Все", "Не проверено", "Подтверждено", "Расхождения", "Не отправлено"];

function parseCheckedCount(progress = "") {
  const match = progress.match(/(\d+)\s+из\s+(\d+)/);

  if (!match) {
    return { checked: 0, total: 0, percent: 0 };
  }

  const checked = Number(match[1]);
  const total = Number(match[2]);

  return {
    checked,
    total,
    percent: total > 0 ? Math.round((checked / total) * 100) : 0,
  };
}

function MobileEquipmentCard({ item, onOpenEquipment }) {
  const Icon = equipmentIcons[item.tone] ?? DatabaseOutlined;

  return (
    <button
      className={`mobile-equipment-card is-${item.tone}`}
      type="button"
      onClick={() => onOpenEquipment?.(item.id)}
    >
      <div>
        <span>{item.id}</span>
        <h3>{item.title}</h3>
        <p>
          <em>{item.status}</em>
          <Icon aria-hidden="true" />
          {item.note}
        </p>
      </div>
      <RightOutlined aria-hidden="true" />
    </button>
  );
}

export function MobileRoomInspectionScreen({
  activeNavKey,
  department,
  room,
  onBack,
  onOpenEquipment,
  onNavSelect,
}) {
  const currentRoom = room ?? {
    title: "Помещение не выбрано",
    status: "Не начато",
    progress: "0 из 0 позиций проверено",
    equipment: [],
  };
  const progress = parseCheckedCount(currentRoom.progress);
  const equipment = currentRoom.equipment ?? [];
  const discrepancyCount = equipment.filter((item) => item.tone === "error").length;
  const pendingCount = equipment.filter((item) => item.tone === "active").length;
  const remainingCount = Math.max(progress.total - progress.checked, 0);

  return (
    <div className="mobile-room-inspection-screen">
      <header className="mobile-room-inspection-header">
        <div>
          <button type="button" aria-label="Назад к списку помещений" onClick={onBack}>
            <ArrowLeftOutlined aria-hidden="true" />
          </button>
          <h1>Осмотр</h1>
          <button type="button" aria-label="Синхронизация">
            <SyncOutlined aria-hidden="true" />
          </button>
        </div>
        <span>Онлайн • 12 изменений ожидают отправки</span>
      </header>

      <main className="mobile-room-inspection-content">
        <section className="mobile-card mobile-room-summary">
          <div className="mobile-room-summary-head">
            <div>
              <h2>{currentRoom.title}</h2>
              <p>{department?.context}</p>
            </div>
            <span>{currentRoom.status}</span>
          </div>
          <div className="mobile-room-summary-progress">
            <div>
              <span>{currentRoom.progress}</span>
              <strong>{progress.percent}%</strong>
            </div>
            <div aria-hidden="true">
              <span style={{ width: `${progress.percent}%` }} />
            </div>
          </div>
          <div className="mobile-room-summary-stats">
            <span>
              <DatabaseOutlined aria-hidden="true" />
              {progress.total} позиций
            </span>
            <span className="is-success">
              <CheckCircleOutlined aria-hidden="true" />
              {progress.checked} проверено
            </span>
            <span className="is-error">
              <WarningOutlined aria-hidden="true" />
              {discrepancyCount} расхождение
            </span>
            <span className="is-warning">
              <SyncOutlined aria-hidden="true" />
              {pendingCount} не отправлено
            </span>
          </div>
          <button type="button">
            <InfoCircleOutlined aria-hidden="true" />
            Информация о помещении
          </button>
        </section>

        <section className="mobile-room-inspection-tools">
          <label className="mobile-search-field">
            <SearchOutlined aria-hidden="true" />
            <input type="search" placeholder="Поиск оборудования или ID" />
          </label>
          <div className="mobile-filter-row">
            {filters.map((filter, index) => (
              <button className={index === 0 ? "is-active" : ""} type="button" key={filter}>
                {filter}
              </button>
            ))}
          </div>
        </section>

        <section className="mobile-equipment-section">
          {equipment.length > 0 ? (
            equipment.map((item) => (
              <MobileEquipmentCard item={item} key={item.id} onOpenEquipment={onOpenEquipment} />
            ))
          ) : (
            <div className="mobile-equipment-empty">В помещении нет позиций для осмотра</div>
          )}
        </section>
      </main>

      <div className="mobile-room-action-bar">
        <button type="button">Завершить помещение</button>
        <span>Осталось проверить {remainingCount} позиций</span>
      </div>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />
    </div>
  );
}
