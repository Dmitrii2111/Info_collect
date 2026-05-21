import { useEffect, useMemo, useRef, useState } from "react";
import {
  ApartmentOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  InboxOutlined,
  MinusOutlined,
  PlusOutlined,
  RightOutlined,
  SearchOutlined,
  SyncOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";
import { MobileBottomSheet } from "../components/MobileBottomSheet.jsx";
import { mobileMoveItemData } from "../data/mobileMockData.js";
import {
  MOBILE_DRAFT_ENTITY_TYPES,
  MOBILE_DRAFT_TYPES,
  createMobileDraft,
  enqueueMobileDraft,
  findMobileDraftByEntity,
  markMobileDraftReadyToQueue,
  saveMobileDraft,
} from "../../services/offline/index.js";

const DRAFT_SOURCE_SCREEN = "moveItem";
const DRAFT_AUTOSAVE_DELAY_MS = 300;

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
  const defaultRoomQuantities = () => Object.fromEntries(data.rooms.map((room) => [room.id, room.quantity]));
  const draftEntityId = currentItem.id ?? currentItem.code;
  const latestDraftRef = useRef(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(data.targetWarehouse);
  const [warehouseQuantity, setWarehouseQuantity] = useState(defaultWarehouseQuantity);
  const [roomQuantities, setRoomQuantities] = useState(defaultRoomQuantities);
  const [searchQuery, setSearchQuery] = useState("");
  const [roomPickerQuery, setRoomPickerQuery] = useState("");
  const [warehousePickerQuery, setWarehousePickerQuery] = useState("");
  const [selectedReason, setSelectedReason] = useState(data.reasonOptions[0]);
  const [comment, setComment] = useState("");
  const [feedback, setFeedback] = useState("");
  const [activeOverlay, setActiveOverlay] = useState(null);

  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [hasDraftInputChanged, setHasDraftInputChanged] = useState(false);

  const createCurrentDraft = () => createMobileDraft({
    ...(latestDraftRef.current ?? {}),
    type: MOBILE_DRAFT_TYPES.WAREHOUSE_MOVE,
    entityType: MOBILE_DRAFT_ENTITY_TYPES.warehouseItem,
    entityId: draftEntityId,
    sourceScreen: DRAFT_SOURCE_SCREEN,
    payload: {
      selectedWarehouseId: selectedWarehouse.id,
      warehouseQuantity,
      roomQuantities,
      selectedReason,
      comment,
    },
    context: {
      ...((latestDraftRef.current?.context) ?? {}),
      itemCode: currentItem.code,
      itemId: currentItem.id ?? null,
    },
  });

  useEffect(() => {
    let isCancelled = false;

    latestDraftRef.current = null;
    setIsDraftLoaded(false);
    setHasDraftInputChanged(false);
    setSelectedWarehouse(data.targetWarehouse);
    setWarehouseQuantity(defaultWarehouseQuantity);
    setRoomQuantities(defaultRoomQuantities());
    setSelectedReason(data.reasonOptions[0]);
    setComment("");

    if (!draftEntityId) {
      setIsDraftLoaded(true);
      return () => {
        isCancelled = true;
      };
    }

    findMobileDraftByEntity({
      type: MOBILE_DRAFT_TYPES.WAREHOUSE_MOVE,
      entityType: MOBILE_DRAFT_ENTITY_TYPES.warehouseItem,
      entityId: draftEntityId,
      sourceScreen: DRAFT_SOURCE_SCREEN,
    })
      .then((draft) => {
        if (isCancelled) {
          return;
        }

        latestDraftRef.current = draft;
        const payload = draft?.payload ?? {};
        const draftWarehouse = data.warehouses.find((warehouse) => warehouse.id === payload.selectedWarehouseId);

        setSelectedWarehouse(draftWarehouse ?? data.targetWarehouse);
        setWarehouseQuantity(payload.warehouseQuantity ?? defaultWarehouseQuantity);
        setRoomQuantities(
          payload.roomQuantities && typeof payload.roomQuantities === "object" && !Array.isArray(payload.roomQuantities)
            ? payload.roomQuantities
            : defaultRoomQuantities(),
        );
        setSelectedReason(typeof payload.selectedReason === "string" ? payload.selectedReason : data.reasonOptions[0]);
        setComment(typeof payload.comment === "string" ? payload.comment : "");
        setIsDraftLoaded(true);
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        setIsDraftLoaded(true);
      });

    return () => {
      isCancelled = true;
    };
  }, [draftEntityId]);

  useEffect(() => {
    if (!isDraftLoaded || !hasDraftInputChanged || !draftEntityId) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      saveMobileDraft(createCurrentDraft())
        .then((savedDraft) => {
          latestDraftRef.current = savedDraft;
        })
        .catch(() => {});
    }, DRAFT_AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [comment, draftEntityId, hasDraftInputChanged, isDraftLoaded, roomQuantities, selectedReason, selectedWarehouse.id, warehouseQuantity]);

  const visibleRooms = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return data.rooms;
    }

    return data.rooms.filter((room) => room.title.toLowerCase().includes(normalizedQuery));
  }, [data.rooms, searchQuery]);

  const pickerRooms = useMemo(() => {
    const normalizedQuery = roomPickerQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return data.rooms;
    }

    return data.rooms.filter((room) => room.title.toLowerCase().includes(normalizedQuery));
  }, [data.rooms, roomPickerQuery]);

  const pickerWarehouses = useMemo(() => {
    const normalizedQuery = warehousePickerQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return data.warehouses;
    }

    return data.warehouses.filter((warehouse) =>
      `${warehouse.title} ${warehouse.subtitle}`.toLowerCase().includes(normalizedQuery),
    );
  }, [data.warehouses, warehousePickerQuery]);

  const roomTotal = Object.values(roomQuantities).reduce((sum, value) => sum + Number(value || 0), 0);
  const distributedTotal = warehouseQuantity + roomTotal;
  const remainingTotal = Math.max(availableQuantity - distributedTotal, 0);
  const distributedPercent = Math.min(100, Math.round((distributedTotal / availableQuantity) * 100));
  const selectedRoomCount = Object.values(roomQuantities).filter((value) => Number(value) > 0).length;
  const selectedDirectionsCount = selectedRoomCount + (warehouseQuantity > 0 ? 1 : 0);
  const selectedRoomTitles = data.rooms
    .filter((room) => Number(roomQuantities[room.id] ?? 0) > 0)
    .map((room) => room.title.split(" — ")[0]);

  const updateRoomQuantity = (roomId, delta) => {
    setRoomQuantities((current) => ({
      ...current,
      [roomId]: Math.max(0, Number(current[roomId] ?? 0) + delta),
    }));
    setHasDraftInputChanged(true);
    setFeedback("");
  };

  const handleSelectRoom = (roomId) => {
    setRoomQuantities((current) => ({
      ...current,
      [roomId]: Math.max(1, Number(current[roomId] ?? 0)),
    }));
    setHasDraftInputChanged(true);
    setFeedback("");
    setActiveOverlay(null);
  };

  const handleSelectWarehouse = (warehouse) => {
    if (warehouse.disabled) {
      return;
    }

    setSelectedWarehouse(warehouse);
    setWarehouseQuantity(Math.max(1, Math.min(warehouse.quantity || defaultWarehouseQuantity, availableQuantity)));
    setHasDraftInputChanged(true);
    setFeedback("");
    setActiveOverlay(null);
  };

  const handleWarehouseQuantityChange = (nextQuantity) => {
    setWarehouseQuantity(nextQuantity);
    setHasDraftInputChanged(true);
  };

  const handleSelectedReasonChange = (nextReason) => {
    setSelectedReason(nextReason);
    setHasDraftInputChanged(true);
  };

  const handleCommentChange = (nextComment) => {
    setComment(nextComment);
    setHasDraftInputChanged(true);
  };

  const handleSave = () => {
    setFeedback("");
    setActiveOverlay("confirm");
  };

  const handleConfirmSave = () => {
    if (isDraftLoaded && draftEntityId) {
      saveMobileDraft(markMobileDraftReadyToQueue(createCurrentDraft()))
        .then((savedDraft) => {
          latestDraftRef.current = savedDraft;
          setHasDraftInputChanged(false);
          enqueueMobileDraft(savedDraft)
            .then((result) => {
              if (result?.draft) {
                latestDraftRef.current = result.draft;
              }
            })
            .catch(() => {});
        })
        .catch(() => {});
    }

    setActiveOverlay("success");
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
            onClick={() => setFeedback("Изменения будут отправлены на экране синхронизации")}
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
            <button type="button" onClick={() => setActiveOverlay("rooms")}>
              Выбрать помещения
            </button>
          </div>

          <div className="mobile-move-warehouse-target">
            <div>
              <span>
                <InboxOutlined aria-hidden="true" />
              </span>
              <div>
                <h4>{selectedWarehouse.title}</h4>
                <p>{selectedWarehouse.subtitle}</p>
              </div>
            </div>
            <label>
              <input
                type="number"
                min="0"
                max={availableQuantity}
                value={warehouseQuantity}
                onChange={(event) => handleWarehouseQuantityChange(Math.max(0, Number(event.target.value)))}
              />
              <small>шт.</small>
            </label>
            <button type="button" aria-label="Выбрать склад" onClick={() => setActiveOverlay("warehouse")}>
              <RightOutlined aria-hidden="true" />
            </button>
          </div>

          <div className="mobile-move-room-group">
            <div>
              <div>
                <h4>Помещения</h4>
                <p>Всего в помещения: {roomTotal} шт.</p>
              </div>
              <span>{selectedRoomCount} ед. выбрано</span>
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
            <button type="button" onClick={() => setActiveOverlay("rooms")}>
              Показать ещё {data.hiddenRoomsCount} помещений
            </button>
          </div>
        </section>

        <section className="mobile-move-remaining">
          <ApartmentOutlined aria-hidden="true" />
          {remainingTotal} шт. останется на складе
        </section>

        <section className="mobile-move-add-actions">
          <button type="button" onClick={() => setActiveOverlay("rooms")}>
            <ApartmentOutlined aria-hidden="true" />
            Добавить помещение
          </button>
          <button type="button" onClick={() => setActiveOverlay("warehouse")}>
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
              onClick={() => handleSelectedReasonChange(reason)}
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
            onChange={(event) => handleCommentChange(event.target.value)}
          />
        </label>

        {feedback ? <div className="mobile-move-feedback">{feedback}</div> : null}
      </main>

      <div className="mobile-move-action-bar">
        <button type="button" onClick={onBack}>Отмена</button>
        <button type="button" onClick={handleSave}>Сохранить перемещение</button>
      </div>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />

      {activeOverlay === "rooms" ? (
        <MobileBottomSheet
          title="Выбрать помещения"
          subtitle="Укажите помещения и количество для перемещения"
          onClose={() => setActiveOverlay(null)}
          footer={({ close }) => (
            <>
              <div className="mobile-overlay-summary">
                <span>
                  Помещений выбрано:
                  <strong>{selectedRoomCount}</strong>
                </span>
                <span>
                  В помещения:
                  <strong>{roomTotal} шт.</strong>
                </span>
                <span>
                  Осталось:
                  <strong>{remainingTotal} шт.</strong>
                </span>
              </div>
              <p className="mobile-overlay-note">Количество можно распределять между помещениями вручную.</p>
              <div className="mobile-overlay-actions">
                <button type="button" onClick={() => close()}>Отмена</button>
                <button type="button" onClick={() => close()}>Добавить в распределение</button>
              </div>
            </>
          )}
        >
          <label className="mobile-overlay-search">
            <SearchOutlined aria-hidden="true" />
            <input
              type="search"
              placeholder="Поиск помещения"
              value={roomPickerQuery}
              onChange={(event) => setRoomPickerQuery(event.target.value)}
            />
          </label>
          <div className="mobile-overlay-list">
            {pickerRooms.map((room) => {
              const roomQuantity = Number(roomQuantities[room.id] ?? 0);

              return (
                <article className={`mobile-overlay-room ${roomQuantity > 0 ? "is-selected" : ""}`} key={room.id}>
                  <div className="mobile-overlay-row-head">
                    <div>
                      <h3>{room.title}</h3>
                      <span className={room.warning ? "is-warning" : ""}>{room.status}</span>
                      {room.warning ? <p>{room.warning}</p> : null}
                    </div>
                    <button type="button" onClick={() => handleSelectRoom(room.id)}>
                      {roomQuantity > 0 ? "Выбрано" : "Добавить"}
                    </button>
                  </div>
                  {roomQuantity > 0 ? (
                    <div className="mobile-overlay-quantity">
                      <span>Количество:</span>
                      <div>
                        <button type="button" onClick={() => updateRoomQuantity(room.id, -1)}>
                          <MinusOutlined aria-hidden="true" />
                        </button>
                        <strong>{roomQuantity}</strong>
                        <button type="button" onClick={() => updateRoomQuantity(room.id, 1)}>
                          <PlusOutlined aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </MobileBottomSheet>
      ) : null}

      {activeOverlay === "warehouse" ? (
        <MobileBottomSheet
          title="Выбрать склад"
          subtitle="Укажите склад и количество для перемещения"
          onClose={() => setActiveOverlay(null)}
          footer={({ close }) => (
            <>
              <div className="mobile-overlay-summary is-three">
                <span>
                  Выбрано:
                  <strong>{warehouseQuantity > 0 ? "1 склад" : "0 складов"}</strong>
                </span>
                <span>
                  В склады:
                  <strong>{warehouseQuantity} шт.</strong>
                </span>
                <span>
                  Осталось:
                  <strong>{remainingTotal} шт.</strong>
                </span>
              </div>
              <p className="mobile-overlay-note">Количество можно распределять между складами вручную.</p>
              <div className="mobile-overlay-actions is-vertical">
                <button type="button" onClick={() => close()}>Добавить в распределение</button>
                <button type="button" onClick={() => close()}>Отмена</button>
              </div>
            </>
          )}
        >
          <div className="mobile-overlay-metrics">
            <span>
              Доступно
              <strong>{availableQuantity} шт.</strong>
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
          <label className="mobile-overlay-search">
            <SearchOutlined aria-hidden="true" />
            <input
              type="search"
              placeholder="Поиск склада или зоны"
              value={warehousePickerQuery}
              onChange={(event) => setWarehousePickerQuery(event.target.value)}
            />
          </label>
          <div className="mobile-overlay-chips" aria-label="Фильтры складов">
            {["Все", "Склады", "Зоны", "Выбрано", "Доступно"].map((filter) => (
              <span className={filter === "Все" ? "is-active" : ""} key={filter}>{filter}</span>
            ))}
          </div>
          <div className="mobile-overlay-list is-divided">
            {pickerWarehouses.map((warehouse) => {
              const isSelected = selectedWarehouse.id === warehouse.id;

              return (
                <article className={`mobile-overlay-warehouse ${isSelected ? "is-selected" : ""}`} key={warehouse.id}>
                  <div>
                    <h3>{warehouse.title}</h3>
                    <p>{warehouse.subtitle}</p>
                    <span className={warehouse.status === "Ограничено" ? "is-warning" : ""}>{warehouse.status}</span>
                    <small>{warehouse.capacity}</small>
                  </div>
                  {isSelected ? (
                    <div className="mobile-overlay-stepper">
                      <button type="button" onClick={() => handleWarehouseQuantityChange(Math.max(0, warehouseQuantity - 1))}>
                        <MinusOutlined aria-hidden="true" />
                      </button>
                      <strong>{warehouseQuantity}</strong>
                      <button
                        type="button"
                        onClick={() => handleWarehouseQuantityChange(Math.min(availableQuantity, warehouseQuantity + 1))}
                      >
                        <PlusOutlined aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={warehouse.disabled}
                      onClick={() => handleSelectWarehouse(warehouse)}
                    >
                      {warehouse.disabled ? "Текущий" : "Добавить"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </MobileBottomSheet>
      ) : null}

      {activeOverlay === "confirm" ? (
        <MobileBottomSheet
          title="Сохранить перемещение?"
          subtitle="Проверьте распределение перед сохранением."
          mode="modal"
          onClose={() => setActiveOverlay(null)}
          footer={({ close }) => (
            <div className="mobile-overlay-actions is-vertical">
              <button type="button" onClick={() => close(handleConfirmSave)}>Да, сохранить</button>
              <button type="button" onClick={() => close()}>Вернуться к редактированию</button>
            </div>
          )}
        >
          <div className="mobile-confirm-context">
            <h3>{currentItem.title}</h3>
            <p>ID: {currentItem.code}</p>
            <span>
              <InboxOutlined aria-hidden="true" />
              Источник: {currentItem.location}
            </span>
          </div>
          <div className="mobile-confirm-metrics">
            <span>
              Доступно
              <strong>{availableQuantity} шт.</strong>
            </span>
            <span>
              Распределено
              <strong>{distributedTotal} шт.</strong>
            </span>
            <span>
              Останется
              <strong>{remainingTotal} шт.</strong>
            </span>
            <span>
              Направлений
              <strong>{selectedDirectionsCount}</strong>
            </span>
          </div>
          <div className="mobile-confirm-destinations">
            <h3>Направления</h3>
            <p>
              <span>{selectedWarehouse.title}</span>
              <strong>{warehouseQuantity} шт.</strong>
            </p>
            <p>
              <span>Помещения ({selectedRoomCount})</span>
              <strong>{roomTotal} шт.</strong>
            </p>
            <small>{selectedRoomTitles.slice(0, 3).join(", ")}{selectedRoomCount > 3 ? " и еще" : ""}</small>
          </div>
          <div className="mobile-confirm-note">
            <SyncOutlined aria-hidden="true" />
            <p>Перемещение будет добавлено в очередь синхронизации.</p>
          </div>
          <div className="mobile-confirm-warning">
            <WarningOutlined aria-hidden="true" />
            <p>Есть несинхронизированные изменения</p>
          </div>
        </MobileBottomSheet>
      ) : null}

      {activeOverlay === "success" ? (
        <MobileBottomSheet
          title="Успех"
          subtitle="Перемещение сохранено"
          mode="modal"
          onClose={() => setActiveOverlay(null)}
          className="mobile-success-sheet"
        >
          <div className="mobile-success-icon">
            <CheckCircleOutlined aria-hidden="true" />
          </div>
          <div className="mobile-success-context">
            <div>
              <InboxOutlined aria-hidden="true" />
            </div>
            <div>
              <h3>{currentItem.title}</h3>
              <p>ID: {currentItem.code}</p>
            </div>
          </div>
          <div className="mobile-success-stats">
            <p>
              <CheckCircleOutlined aria-hidden="true" />
              {distributedTotal} шт. распределено
            </p>
            <p>
              <InboxOutlined aria-hidden="true" />
              {remainingTotal} шт. осталось на складе
            </p>
            <p>
              <ApartmentOutlined aria-hidden="true" />
              {selectedDirectionsCount} направлений
            </p>
          </div>
          <div className="mobile-confirm-note">
            <SyncOutlined aria-hidden="true" />
            <p>Изменения будут отправлены при следующей синхронизации.</p>
          </div>
          <div className="mobile-success-actions">
            <button type="button" onClick={onBack}>К карточке позиции</button>
            <button type="button" onClick={() => setActiveOverlay(null)}>Остаться в перемещении</button>
            <button type="button" onClick={() => onNavSelect("warehouse")}>К складу</button>
          </div>
        </MobileBottomSheet>
      ) : null}
    </div>
  );
}
