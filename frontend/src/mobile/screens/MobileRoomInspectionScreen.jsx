import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  InfoCircleOutlined,
  RightOutlined,
  SyncOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";
import { MobileBottomSheet } from "../components/MobileBottomSheet.jsx";
import { MobileEmptyState } from "../components/MobileEmptyState.jsx";
import { MobileSearchFilterBar } from "../components/MobileSearchFilterBar.jsx";

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

function getRoomContext(room, department) {
  return [
    room?.building ?? room?.corpus,
    room?.floor ? `${room.floor} этаж` : null,
    room?.departmentName ?? department?.title,
    room?.roomCode ?? room?.roomNumber,
  ].filter(Boolean).join(" • ") || department?.context || "Контекст помещения не указан";
}

function getEquipmentPositionCode(item) {
  return item?.designPositionCode ?? item?.positionCode ?? "Без шифра";
}

function MobileEquipmentCard({ item, onOpenEquipment }) {
  const Icon = equipmentIcons[item.tone] ?? DatabaseOutlined;
  const positionCode = getEquipmentPositionCode(item);

  return (
    <button
      className={`mobile-equipment-card is-${item.tone}`}
      type="button"
      onClick={() => onOpenEquipment?.(item.id)}
    >
      <div>
        <span>{positionCode}</span>
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
  const roomContext = getRoomContext(currentRoom, department);
  const equipment = currentRoom.equipment ?? [];
  const discrepancyCount = equipment.filter((item) => item.tone === "error").length;
  const pendingCount = equipment.filter((item) => item.tone === "active").length;
  const remainingCount = Math.max(progress.total - progress.checked, 0);
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleEquipment = equipment
    .filter((item) => {
      if (activeFilter === "Подтверждено") {
        return item.tone === "success" || item.status === "Подтверждено";
      }

      if (activeFilter === "Расхождения") {
        return item.tone === "error";
      }

      if (activeFilter === "Не отправлено") {
        return item.tone === "active" || item.note?.includes("не отправ");
      }

      if (activeFilter === "Не проверено") {
        return item.tone === "empty" || item.status === "Не найдено" || item.status === "Не начато";
      }

      return true;
    })
    .filter((item) => {
      if (!normalizedQuery) {
        return true;
      }

      return [item.title, getEquipmentPositionCode(item), item.status, item.note]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery));
    });

  const handleCompleteRoom = () => {
    setIsCompleted(true);
    setActiveOverlay("success");
  };

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
              <p>{roomContext}</p>
            </div>
            <span>{isCompleted ? "Завершено" : currentRoom.status}</span>
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
          <button type="button" onClick={() => setActiveOverlay("info")}>
            <InfoCircleOutlined aria-hidden="true" />
            Информация о помещении
          </button>
        </section>

        <MobileSearchFilterBar
          placeholder="Поиск оборудования или ПОЗ"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          filterLabel="Фильтр оборудования"
        />

        <section className="mobile-equipment-section">
          {visibleEquipment.length > 0 ? (
            visibleEquipment.map((item) => (
              <MobileEquipmentCard item={item} key={item.id} onOpenEquipment={onOpenEquipment} />
            ))
          ) : (
            <MobileEmptyState className="mobile-equipment-empty">Ничего не найдено</MobileEmptyState>
          )}
        </section>
      </main>

      <div className="mobile-room-action-bar">
        <button type="button" onClick={() => setActiveOverlay("confirm")}>Завершить помещение</button>
        <span>{isCompleted ? "Помещение отмечено как завершенное" : `Осталось проверить ${remainingCount} позиций`}</span>
      </div>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />

      {activeOverlay === "info" ? (
        <MobileBottomSheet
          title="Информация о помещении"
          subtitle={currentRoom.title}
          onClose={() => setActiveOverlay(null)}
        >
          <div className="mobile-room-info-sheet">
            <p>{roomContext}</p>
            <div>
              <h3>Ожидаемые позиции</h3>
              {equipment.length > 0 ? (
                equipment.map((item) => (
                  <article key={item.id}>
                    <strong>{item.title}</strong>
                    <span>{getEquipmentPositionCode(item)}</span>
                    <small>{item.status} • {item.note}</small>
                  </article>
                ))
              ) : (
                <article>
                  <strong>Позиции не указаны</strong>
                  <small>Для помещения нет данных оборудования.</small>
                </article>
              )}
            </div>
          </div>
        </MobileBottomSheet>
      ) : null}

      {activeOverlay === "confirm" ? (
        <MobileBottomSheet
          title="Завершить помещение?"
          subtitle="Вы уверены, что хотите завершить осмотр помещения?"
          mode="modal"
          onClose={() => setActiveOverlay(null)}
          footer={({ close }) => (
            <div className="mobile-overlay-actions is-vertical">
              <button type="button" onClick={() => close(handleCompleteRoom)}>Да, завершить</button>
              <button type="button" onClick={() => close()}>Нет, вернуться к помещению</button>
            </div>
          )}
        >
          <div className="mobile-completion-context">
            <h3>{currentRoom.title}</h3>
            <p>{department?.context ?? "Контекст не указан"}</p>
            <div className="mobile-completion-grid">
              <span>
                <CheckCircleOutlined aria-hidden="true" />
                {currentRoom.progress}
              </span>
              <span>
                <ClockCircleOutlined aria-hidden="true" />
                {remainingCount} осталось
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
          </div>
          <div className="mobile-confirm-note is-boxed">
            <InfoCircleOutlined aria-hidden="true" />
            <p>После завершения помещение будет отмечено как завершенное. Вы сможете вернуться к нему позже.</p>
          </div>
        </MobileBottomSheet>
      ) : null}

      {activeOverlay === "success" ? (
        <MobileBottomSheet
          title="Успех"
          subtitle="Осмотр помещения завершен"
          mode="modal"
          onClose={() => setActiveOverlay(null)}
          className="mobile-success-sheet"
        >
          <div className="mobile-success-icon">
            <CheckCircleOutlined aria-hidden="true" />
          </div>
          <div className="mobile-completion-success-copy">
            <h3>{currentRoom.title}</h3>
            <p>Изменение будет отправлено при следующей синхронизации.</p>
          </div>
          <div className="mobile-success-actions">
            <button type="button" onClick={onBack}>К списку помещений</button>
            <button type="button" onClick={() => setActiveOverlay(null)}>Остаться в помещении</button>
          </div>
        </MobileBottomSheet>
      ) : null}
    </div>
  );
}
