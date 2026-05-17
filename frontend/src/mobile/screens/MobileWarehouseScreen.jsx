import { useMemo, useState } from "react";
import {
  BarcodeOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  PlusSquareOutlined,
  SearchOutlined,
  SwapOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";
import { MobileHeader } from "../components/MobileHeader.jsx";
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

export function MobileWarehouseScreen({ activeNavKey, onOpenMenu, onOpenItem, onOpenReceiptBatch, onNavSelect }) {
  const data = mobileWarehouseData;
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(data.filters[0]);
  const [feedback, setFeedback] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(null);

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
    if (label === "Сканировать позицию" || label === "Новое поступление") {
      onOpenReceiptBatch?.();
      return;
    }

    setFeedback(`${label}: действие сохранено локально`);
  };

  return (
    <div className="mobile-warehouse-screen">
      <MobileHeader
        title="Склад"
        onMenu={onOpenMenu}
        onSync={() => setFeedback("Склад обновлен локально")}
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

        <section className="mobile-warehouse-tools">
          <label className="mobile-search-field">
            <SearchOutlined aria-hidden="true" />
            <input
              type="search"
              placeholder="Поиск по оборудованию, ID или помещению"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
          <div className="mobile-filter-row">
            {data.filters.map((filter) => (
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

        {feedback ? <div className="mobile-warehouse-feedback">{feedback}</div> : null}

        <section className="mobile-warehouse-section">
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
              <div className="mobile-warehouse-empty">Позиции не найдены</div>
            )}
          </div>
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
    </div>
  );
}
