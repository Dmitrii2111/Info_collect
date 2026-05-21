import { useMemo, useRef, useState } from "react";
import {
  BarcodeOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  PlusSquareOutlined,
  SwapOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";
import { MobileBottomSheet } from "../components/MobileBottomSheet.jsx";
import { MobileEmptyState } from "../components/MobileEmptyState.jsx";
import { MobileHeader } from "../components/MobileHeader.jsx";
import { MobileResultModal } from "../components/MobileResultModal.jsx";
import { MobileSearchFilterBar } from "../components/MobileSearchFilterBar.jsx";
import { mobileWarehouseData } from "../data/mobileMockData.js";

const quickActionIcons = {
  error: WarningOutlined,
  primary: BarcodeOutlined,
  secondary: PlusSquareOutlined,
  warning: SwapOutlined,
};

function WarehouseItemCard({ item, isSelected, onSelect }) {
  return (
    <article
      className={`mobile-warehouse-item is-${item.tone}${isSelected ? " is-selected" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.(item);
        }
      }}
    >
      <div className="mobile-warehouse-item-head">
        <div>
          <h4>{item.title}</h4>
          <p>{item.code}</p>
        </div>
        <span>{item.status}</span>
      </div>
      <div className="mobile-warehouse-item-body">
        <p>
          <InboxOutlined aria-hidden="true" />
          {item.location}
        </p>
        {item.warning ? (
          <p className="is-warning">
            <WarningOutlined aria-hidden="true" />
            {item.warning}
          </p>
        ) : null}
      </div>
      <div className="mobile-warehouse-item-footer">
        {item.pending ? <SwapOutlined aria-hidden="true" /> : <ClockCircleOutlined aria-hidden="true" />}
        {item.footer}
      </div>
    </article>
  );
}

export function MobileWarehouseScreen({ activeNavKey, onOpenMenu, onOpenItem, onOpenReceiptBatches, onNavSelect }) {
  const data = mobileWarehouseData;
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(data.filters[0]);
  const [feedback, setFeedback] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [isMoveSheetOpen, setIsMoveSheetOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [isNextMoveSuccess, setIsNextMoveSuccess] = useState(true);
  const positionsRef = useRef(null);

  const visibleItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredByStatus =
      activeFilter === "Все" ? data.items : data.items.filter((item) => item.statusKey === activeFilter);

    if (!normalizedQuery) {
      return filteredByStatus;
    }

    return filteredByStatus.filter((item) =>
      [item.title, item.code, item.status, item.location, item.warning]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [activeFilter, data.items, searchQuery]);

  const handleItemSelect = (item) => {
    setSelectedItemId(item.id);
    onOpenItem?.(item.id);
  };

  const handleAction = (label) => {
    if (label === "Открыть спорные" || label === "Спорные позиции") {
      setFeedback("");
      setActiveFilter("Спорные");
      window.requestAnimationFrame(() => positionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      return;
    }

    if (label === "Перемещение") {
      setFeedback("");
      setIsMoveSheetOpen(true);
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

    setFeedback("");
    setResult({
      status: "success",
      title: label,
      text: "Действие добавлено в очередь складских операций.",
    });
  };

  return (
    <div className="mobile-warehouse-screen">
      <MobileHeader
        title="Склад"
        onMenu={onOpenMenu}
        onSync={() => setFeedback("Склад обновлен")}
      />

      <main className="mobile-warehouse-content">
        <section className="mobile-card mobile-warehouse-summary">
          <div className="mobile-warehouse-summary-head">
            <div>
              <h2>{data.summary.title}</h2>
              <p>{data.summary.subtitle}</p>
            </div>
            <span>{data.summary.status}</span>
          </div>

          <div className="mobile-warehouse-metrics">
            {data.summary.metrics.map((metric) => (
              <div className={`is-${metric.tone}`} key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>

          <div className="mobile-warehouse-updated">
            <ClockCircleOutlined aria-hidden="true" />
            {data.summary.updatedAt}
          </div>

          <div className="mobile-warehouse-summary-actions">
            {data.summary.actions.map((action) => (
              <button type="button" key={action} onClick={() => handleAction(action)}>
                {action}
              </button>
            ))}
          </div>
        </section>

        <MobileSearchFilterBar
          placeholder="Поиск по оборудованию, ID или помещению"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filters={data.filters}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          filterLabel="Фильтр склада"
        />

        {feedback ? <div className="mobile-warehouse-feedback">{feedback}</div> : null}

        <section className="mobile-warehouse-section" ref={positionsRef}>
          <h3>Позиции склада</h3>
          <div className="mobile-warehouse-list">
            {visibleItems.length > 0 ? (
              visibleItems.map((item) => (
                <WarehouseItemCard
                  isSelected={item.id === selectedItemId}
                  item={item}
                  key={item.id}
                  onSelect={handleItemSelect}
                />
              ))
            ) : (
              <MobileEmptyState className="mobile-warehouse-empty">Позиции не найдены</MobileEmptyState>
            )}
          </div>
        </section>

        {activeFilter === "Спорные" ? (
          <section className="mobile-warehouse-section">
            <h3>Спорные позиции</h3>
            <div className="mobile-warehouse-disputed-list">
              {visibleItems.map((item) => (
                <article className={`is-${item.tone}`} key={`disputed-${item.id}`}>
                  <strong>{item.title}</strong>
                  <span>{item.code} • {item.status}</span>
                  <p>{item.warning ?? item.problem ?? "Требуется сверка данных"}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

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

      {isMoveSheetOpen ? (
        <MobileBottomSheet
          title="Создать перемещение"
          subtitle="Заполните минимальные данные для перемещения"
          mode="sheet"
          onClose={() => setIsMoveSheetOpen(false)}
          footer={({ close }) => (
            <>
              <button className="mobile-secondary-button" type="button" onClick={() => close(() => setIsMoveSheetOpen(false))}>
                Отмена
              </button>
              <button
                className="mobile-primary-button"
                type="button"
                onClick={() =>
                  close(() => {
                    const isSuccess = isNextMoveSuccess;
                    setIsMoveSheetOpen(false);
                    setIsNextMoveSuccess((current) => !current);
                    setResult({
                      status: isSuccess ? "success" : "error",
                      title: isSuccess ? "Перемещение создано" : "Не удалось создать перемещение",
                      text: isSuccess
                        ? "Заявка сохранена и появится в очереди синхронизации."
                        : "Проверьте количество и повторите действие.",
                    });
                  })
                }
              >
                Создать перемещение
              </button>
            </>
          )}
        >
          <div className="mobile-move-sheet-form">
            <label>
              <span>Позиция</span>
              <select defaultValue={selectedItemId ?? data.items[0]?.id}>
                {data.items.map((item) => (
                  <option value={item.id} key={item.id}>{item.title} • {item.code}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Откуда</span>
              <input defaultValue="Склад временного хранения" />
            </label>
            <label>
              <span>Куда</span>
              <input defaultValue="Корпус А • 2 этаж • Приемное отделение" />
            </label>
            <label>
              <span>Количество или серийный номер</span>
              <input defaultValue="1" />
            </label>
          </div>
        </MobileBottomSheet>
      ) : null}

      <MobileResultModal
        isOpen={Boolean(result)}
        status={result?.status}
        title={result?.title}
        text={result?.text}
        onClose={() => setResult(null)}
      />
    </div>
  );
}
