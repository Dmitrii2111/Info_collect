import { useMemo, useState } from "react";
import {
  ApartmentOutlined,
  ArrowLeftOutlined,
  InboxOutlined,
  MinusOutlined,
  PlusOutlined,
  RightOutlined,
  SearchOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";
import { mobileMoveItemData } from "../data/mobileMockData.js";

function getAvailableQuantity(item) {
  const quantity = item?.quantity;

  if (typeof quantity === "object" && quantity) {
    return Number(quantity.available ?? quantity.total ?? 1);
  }

  return Number.parseInt(quantity, 10) || 1;
}

export function MobileMoveItemScreen({ activeNavKey, item, onBack, onNavSelect }) {
  const data = mobileMoveItemData;
  const currentItem = item ?? {
    title: "Позиция не выбрана",
    code: "Нет ID",
    location: "Склад не указан",
  };
  const availableQuantity = Math.max(getAvailableQuantity(currentItem), 1);
  const defaultWarehouseQuantity = Math.min(data.targetWarehouse.quantity, availableQuantity);
  const [warehouseQuantity, setWarehouseQuantity] = useState(defaultWarehouseQuantity);
  const [roomQuantities, setRoomQuantities] = useState(() =>
    Object.fromEntries(data.rooms.map((room) => [room.id, room.quantity])),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReason, setSelectedReason] = useState(data.reasonOptions[0]);
  const [comment, setComment] = useState("");
  const [feedback, setFeedback] = useState("");

  const visibleRooms = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return data.rooms;
    }

    return data.rooms.filter((room) => room.title.toLowerCase().includes(normalizedQuery));
  }, [data.rooms, searchQuery]);

  const roomTotal = Object.values(roomQuantities).reduce((sum, value) => sum + Number(value || 0), 0);
  const distributedTotal = warehouseQuantity + roomTotal;
  const remainingTotal = Math.max(availableQuantity - distributedTotal, 0);
  const distributedPercent = Math.min(100, Math.round((distributedTotal / availableQuantity) * 100));

  const updateRoomQuantity = (roomId, delta) => {
    setRoomQuantities((current) => ({
      ...current,
      [roomId]: Math.max(0, Number(current[roomId] ?? 0) + delta),
    }));
    setFeedback("");
  };

  const handleSave = () => {
    setFeedback("Перемещение подготовлено локально");
  };

  return (
    <div className="mobile-move-item-screen">
      <header className="mobile-move-header">
        <div>
          <button type="button" aria-label="Назад к карточке позиции" onClick={onBack}>
            <ArrowLeftOutlined aria-hidden="true" />
          </button>
          <h1>Перемещение</h1>
          <button
            type="button"
            aria-label="Синхронизация"
            onClick={() => setFeedback("Синхронизация отмечена локально")}
          >
            <SyncOutlined aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="mobile-move-content">
        <section className="mobile-card mobile-move-source">
          <div>
            <h2>{currentItem.title}</h2>
            <span>{currentItem.code}</span>
          </div>
          <p>
            <InboxOutlined aria-hidden="true" />
            {currentItem.location}
          </p>
          <small>
            Доступно: <strong>{availableQuantity} шт.</strong>
          </small>
        </section>

        <section className="mobile-card mobile-move-distribution">
          <div>
            <h3>Распределение</h3>
            <span>{data.rooms.length + 1 + data.hiddenRoomsCount} направлений</span>
          </div>
          <div className="mobile-move-stats">
            <span>
              Доступно
              <strong>{availableQuantity}</strong>
            </span>
            <span>
              Распределено
              <strong>{distributedTotal}</strong>
            </span>
            <span>
              Осталось
              <strong>{remainingTotal}</strong>
            </span>
          </div>
          <div className="mobile-move-progress" aria-hidden="true">
            <span style={{ width: `${distributedPercent}%` }} />
          </div>
          <p>{distributedTotal} из {availableQuantity} распределено</p>
        </section>

        <label className="mobile-search-field">
          <SearchOutlined aria-hidden="true" />
          <input
            type="search"
            placeholder={data.searchPlaceholder}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>

        <section className="mobile-move-destinations">
          <div className="mobile-move-destination-head">
            <div>
              <h3>Куда переместить</h3>
              <p>Распределить по 1 шт. в несколько помещений</p>
            </div>
            <button type="button" onClick={() => setFeedback("Выбор помещений будет доступен на Stage 7")}>
              Выбрать помещения
            </button>
          </div>

          <div className="mobile-move-warehouse-target">
            <div>
              <span>
                <InboxOutlined aria-hidden="true" />
              </span>
              <div>
                <h4>{data.targetWarehouse.title}</h4>
                <p>{data.targetWarehouse.subtitle}</p>
              </div>
            </div>
            <label>
              <input
                type="number"
                min="0"
                max={availableQuantity}
                value={warehouseQuantity}
                onChange={(event) => setWarehouseQuantity(Math.max(0, Number(event.target.value)))}
              />
              <small>шт.</small>
            </label>
            <RightOutlined aria-hidden="true" />
          </div>

          <div className="mobile-move-room-group">
            <div>
              <div>
                <h4>Помещения</h4>
                <p>Всего в помещения: {roomTotal} шт.</p>
              </div>
              <span>{visibleRooms.length} ед. выбрано</span>
            </div>
            {visibleRooms.map((room) => (
              <div className="mobile-move-room-row" key={room.id}>
                <p>{room.title}</p>
                <div>
                  <button type="button" onClick={() => updateRoomQuantity(room.id, -1)}>
                    <MinusOutlined aria-hidden="true" />
                  </button>
                  <strong>{roomQuantities[room.id] ?? 0} шт.</strong>
                  <button type="button" onClick={() => updateRoomQuantity(room.id, 1)}>
                    <PlusOutlined aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setFeedback("Остальные помещения будут доступны на Stage 7")}>
              Показать ещё {data.hiddenRoomsCount} помещений
            </button>
          </div>
        </section>

        <section className="mobile-move-remaining">
          <ApartmentOutlined aria-hidden="true" />
          {remainingTotal} шт. останется на складе
        </section>

        <section className="mobile-move-add-actions">
          <button type="button" onClick={() => setFeedback("Добавление помещения будет доступно на Stage 7")}>
            <ApartmentOutlined aria-hidden="true" />
            Добавить помещение
          </button>
          <button type="button" onClick={() => setFeedback("Добавление склада будет доступно на Stage 7")}>
            <InboxOutlined aria-hidden="true" />
            Добавить склад
          </button>
        </section>

        <section className="mobile-move-reasons">
          {data.reasonOptions.map((reason) => (
            <button
              className={reason === selectedReason ? "is-active" : ""}
              type="button"
              key={reason}
              onClick={() => setSelectedReason(reason)}
            >
              {reason}
            </button>
          ))}
        </section>

        <label className="mobile-move-comment">
          <span>Комментарий</span>
          <textarea
            placeholder="Добавьте комментарий к перемещению"
            value={comment}
            rows={4}
            onChange={(event) => setComment(event.target.value)}
          />
        </label>

        {feedback ? <div className="mobile-move-feedback">{feedback}</div> : null}
      </main>

      <div className="mobile-move-action-bar">
        <button type="button" onClick={onBack}>Отмена</button>
        <button type="button" onClick={handleSave}>Сохранить перемещение</button>
      </div>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />
    </div>
  );
}
