import { useEffect, useMemo, useState } from "react";
import {
  BarcodeOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  PlusSquareOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";
import { MobileBottomSheet } from "../components/MobileBottomSheet.jsx";
import { MobileEmptyState } from "../components/MobileEmptyState.jsx";
import { MobileHeader } from "../components/MobileHeader.jsx";
import { mobileEquipmentFixtureRooms } from "../data/mobileEquipmentFixtureData.js";
import { mobileWarehouseData } from "../data/mobileMockData.js";
import {
  closeLocalWarehouse,
  createLocalWarehouseFromRoom,
  getWarehouseStockTotals,
  listActiveLocalWarehouses,
} from "../../domain/warehouse/localWarehouseRepository.js";

const quickActionIcons = {
  primary: BarcodeOutlined,
  secondary: PlusSquareOutlined,
  warning: SwapOutlined,
};

export function MobileWarehouseScreen({ activeNavKey, onOpenMenu, onOpenItem, onOpenReceiptBatches, onNavSelect }) {
  const data = mobileWarehouseData;
  const [warehouses, setWarehouses] = useState([]);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(true);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  const loadWarehouses = () => {
    setIsLoadingWarehouses(true);
    return listActiveLocalWarehouses()
      .then((nextWarehouses) => {
        setWarehouses(nextWarehouses);
        setFeedback("");
      })
      .catch(() => {
        setWarehouses([]);
        setFeedback("Не удалось загрузить локальные склады");
      })
      .finally(() => setIsLoadingWarehouses(false));
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  const activeRoomIds = useMemo(() => new Set(warehouses.map((warehouse) => warehouse.roomId)), [warehouses]);
  const availableRooms = useMemo(
    () => mobileEquipmentFixtureRooms.filter((room) => !activeRoomIds.has(room.id)),
    [activeRoomIds],
  );

  const stockTotals = useMemo(() => (
    warehouses.reduce((summary, warehouse) => {
      const totals = getWarehouseStockTotals(warehouse);

      return {
        itemsCount: summary.itemsCount + totals.itemsCount,
        quantityTotal: summary.quantityTotal + totals.quantityTotal,
      };
    }, { itemsCount: 0, quantityTotal: 0 })
  ), [warehouses]);
  const hasActiveWarehouses = warehouses.length > 0;
  const summaryStatus = hasActiveWarehouses ? "Локально создано" : data.summary.status;
  const updatedText = hasActiveWarehouses ? "Локальные склады сохранены на устройстве" : data.summary.updatedAt;

  const handleAction = (label) => {
    if (label === "Создать склад") {
      setFeedback("");
      setIsCreateSheetOpen(true);
      return;
    }

    if (label === "Поступления") {
      onOpenReceiptBatches?.();
      return;
    }

    if (label === "Сканировать позицию") {
      setFeedback("Сканер позиции будет доступен отдельно от проверки поступлений");
      return;
    }

    setFeedback(warehouses.length > 0 ? "Нет оборудования для перемещения" : "Склады ещё не созданы");
  };

  const handleCreateWarehouse = (room) => {
    createLocalWarehouseFromRoom(room)
      .then(() => loadWarehouses())
      .then(() => {
        setIsCreateSheetOpen(false);
        setFeedback(`Склад создан: ${room.roomCode ?? room.roomNumber} ${room.roomName ?? ""}`.trim());
      })
      .catch((error) => {
        setFeedback(error?.message ?? "Не удалось создать склад");
      });
  };

  const handleCloseWarehouse = (warehouse) => {
    closeLocalWarehouse(warehouse.id)
      .then(() => loadWarehouses())
      .then(() => setFeedback(`Склад закрыт: ${warehouse.roomCode ?? warehouse.roomName}`))
      .catch((error) => {
        setFeedback(error?.message ?? "Не удалось закрыть склад");
      });
  };

  const handleOpenDevMoveTest = () => {
    if (!data.devMoveTestItem?.id) {
      setFeedback("Тестовый сценарий перемещения недоступен");
      return;
    }

    setFeedback("");
    onOpenItem?.(data.devMoveTestItem.id);
  };

  return (
    <div className="mobile-warehouse-screen">
      <MobileHeader
        title="Склад"
        onMenu={onOpenMenu}
        onSync={() => loadWarehouses()}
      />

      <main className="mobile-warehouse-content">
        <section className="mobile-card mobile-warehouse-summary">
          <div className="mobile-warehouse-summary-head">
            <div>
              <h2>{data.summary.title}</h2>
              <p>{data.summary.subtitle}</p>
            </div>
            <span>{summaryStatus}</span>
          </div>

          {hasActiveWarehouses ? (
            <div className="mobile-warehouse-metrics">
              <div className="is-primary">
                <span>Склады</span>
                <strong>{warehouses.length}</strong>
              </div>
              <div className="is-neutral">
                <span>Позиции</span>
                <strong>{stockTotals.itemsCount}</strong>
              </div>
              <div className="is-secondary">
                <span>Остаток</span>
                <strong>{stockTotals.quantityTotal}</strong>
              </div>
            </div>
          ) : (
            <MobileEmptyState className="mobile-warehouse-empty">
              Склады ещё не созданы
            </MobileEmptyState>
          )}

          <div className="mobile-warehouse-updated">
            <ClockCircleOutlined aria-hidden="true" />
            {isLoadingWarehouses ? "Загрузка локальных складов" : updatedText}
          </div>

          <div className="mobile-warehouse-summary-actions">
            {data.summary.actions.map((action) => (
              <button type="button" key={action} onClick={() => handleAction(action)}>
                {action}
              </button>
            ))}
          </div>
        </section>

        {feedback ? <div className="mobile-warehouse-feedback">{feedback}</div> : null}

        <section className="mobile-warehouse-section">
          <h3>Созданные склады</h3>
          {warehouses.length > 0 ? (
            <div className="mobile-warehouse-list">
              {warehouses.map((warehouse) => {
                const totals = getWarehouseStockTotals(warehouse);
                const isEmpty = totals.itemsCount === 0 && totals.quantityTotal === 0;

                return (
                  <article className="mobile-warehouse-item is-neutral" key={warehouse.id}>
                    <div className="mobile-warehouse-item-head">
                      <div>
                        <h4>{warehouse.roomCode} — {warehouse.roomName}</h4>
                        <p>{warehouse.building} • {warehouse.floor} этаж • {warehouse.departmentName}</p>
                      </div>
                      <span>Активен</span>
                    </div>
                    <div className="mobile-warehouse-item-body">
                      <p>
                        <InboxOutlined aria-hidden="true" />
                        {isEmpty ? "Остатков нет" : `${totals.itemsCount} позиций • ${totals.quantityTotal} шт.`}
                      </p>
                    </div>
                    <div className="mobile-warehouse-item-footer">
                      <ClockCircleOutlined aria-hidden="true" />
                      Создан локально
                    </div>
                    <button
                      className="mobile-secondary-button"
                      type="button"
                      disabled={!isEmpty}
                      onClick={() => handleCloseWarehouse(warehouse)}
                    >
                      Закрыть склад
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <MobileEmptyState className="mobile-warehouse-empty">
              Создайте склад, выбрав помещение из структуры объекта. После этого здесь появятся остатки и перемещения.
            </MobileEmptyState>
          )}
        </section>

        <section className="mobile-warehouse-section">
          <h3>Тестовый сценарий перемещения</h3>
          <article className="mobile-warehouse-item is-neutral">
            <div className="mobile-warehouse-item-head">
              <div>
                <h4>{data.devMoveTestItem.title}</h4>
                <p>{data.devMoveTestItem.code}</p>
              </div>
              <span>{data.devMoveTestItem.status}</span>
            </div>
            <div className="mobile-warehouse-item-body">
              <p>
                <InboxOutlined aria-hidden="true" />
                {data.devMoveTestItem.location}
              </p>
            </div>
            <div className="mobile-warehouse-item-footer">
              <SwapOutlined aria-hidden="true" />
              {data.devMoveTestItem.footer}
            </div>
            <button className="mobile-primary-button" type="button" onClick={handleOpenDevMoveTest}>
              Открыть тест перемещения
            </button>
          </article>
        </section>

        <section className="mobile-warehouse-section">
          <h3>Быстрые действия</h3>
          <div className="mobile-warehouse-quick-actions">
            {data.quickActions.map((action) => {
              const Icon = quickActionIcons[action.tone] ?? BarcodeOutlined;

              return (
                <button
                  className={`is-${action.tone}`}
                  type="button"
                  key={action.key}
                  onClick={() => handleAction(action.label)}
                >
                  <span>
                    <Icon aria-hidden="true" />
                  </span>
                  {action.label}
                </button>
              );
            })}
          </div>
        </section>
      </main>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />

      {isCreateSheetOpen ? (
        <MobileBottomSheet
          title="Создать склад"
          subtitle="Выберите помещение из структуры объекта"
          onClose={() => setIsCreateSheetOpen(false)}
        >
          <div className="mobile-warehouse-list">
            {availableRooms.length > 0 ? (
              availableRooms.map((room) => (
                <article className="mobile-warehouse-item is-neutral" key={room.id}>
                  <div className="mobile-warehouse-item-head">
                    <div>
                      <h4>{room.roomCode} — {room.roomName}</h4>
                      <p>{room.building} • {room.floor} этаж • {room.departmentName}</p>
                    </div>
                    <span>{room.equipment?.length ?? 0} поз.</span>
                  </div>
                  <button className="mobile-primary-button" type="button" onClick={() => handleCreateWarehouse(room)}>
                    Выбрать помещение
                  </button>
                </article>
              ))
            ) : (
              <MobileEmptyState className="mobile-warehouse-empty">
                Все помещения уже используются как активные склады
              </MobileEmptyState>
            )}
          </div>
        </MobileBottomSheet>
      ) : null}
    </div>
  );
}
