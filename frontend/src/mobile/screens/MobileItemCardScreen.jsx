import {
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  ExportOutlined,
  InfoCircleOutlined,
  SyncOutlined,
  SwapOutlined,
  UserSwitchOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";

function normalizeQuantity(quantity) {
  if (typeof quantity === "object" && quantity) {
    return quantity;
  }

  return { total: quantity ?? "1", available: quantity ?? "1", reserved: 0, disputed: 0, unit: "" };
}

function QuantityRow({ label, value, total, tone }) {
  const percent = Number(total) > 0 ? Math.min(100, Math.round((Number(value) / Number(total)) * 100)) : 0;

  return (
    <div className={`mobile-item-quantity-row is-${tone}`}>
      <span>{label}</span>
      <div aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>
      <strong>{value}</strong>
    </div>
  );
}

export function MobileItemCardScreen({
  activeNavKey,
  item,
  onBack,
  onMoveItem,
  onOpenDiscrepancy,
  onNavSelect,
}) {
  const [feedback, setFeedback] = useState("");
  const currentItem = item ?? {
    title: "Позиция не выбрана",
    code: "Нет ID",
    status: "Нет данных",
    tone: "neutral",
    location: "Местоположение не указано",
    details: [],
    history: [],
  };
  const quantity = normalizeQuantity(currentItem.quantity);
  const details = currentItem.details?.length
    ? currentItem.details
    : [{ label: "Данные", value: "Нет дополнительных сведений" }];
  const history = currentItem.history?.length
    ? currentItem.history
    : [{ title: "История отсутствует", meta: "Данных пока нет" }];

  const handleAction = (label) => {
    setFeedback(`${label}: действие сохранено локально`);
  };

  return (
    <div className="mobile-item-card-screen">
      <header className="mobile-item-card-header">
        <button type="button" aria-label="Назад на склад" onClick={onBack}>
          <ArrowLeftOutlined aria-hidden="true" />
        </button>
        <h1>Карточка позиции</h1>
        <button type="button" aria-label="Синхронизация" onClick={() => handleAction("Синхронизация")}>
          <SyncOutlined aria-hidden="true" />
        </button>
      </header>

      <main className="mobile-item-card-content">
        <section className="mobile-card mobile-item-summary">
          <div className="mobile-item-summary-head">
            <div>
              <p>{currentItem.code}</p>
              <h2>{currentItem.title}</h2>
            </div>
            <div>
              <span>{currentItem.status}</span>
              {currentItem.footer ? <em>{currentItem.footer}</em> : null}
            </div>
          </div>
          <div className="mobile-item-location">
            <InfoCircleOutlined aria-hidden="true" />
            <span>{currentItem.location}</span>
          </div>
          <div className="mobile-item-location is-warning">
            <ExclamationCircleOutlined aria-hidden="true" />
            <span>Плановое место: {currentItem.plannedLocation ?? "не указано"}</span>
          </div>
          <div className="mobile-item-quantity-hero">
            <strong>
              Количество: {quantity.total} {quantity.unit}
            </strong>
            <span>Одна карточка позиции</span>
          </div>
        </section>

        {currentItem.warning || currentItem.problem ? (
          <section className="mobile-item-problem">
            <WarningOutlined aria-hidden="true" />
            <div>
              <h3>{currentItem.warning ?? "Обнаружено несоответствие"}</h3>
              <p>{currentItem.problem ?? "Проверьте данные позиции перед перемещением."}</p>
            </div>
          </section>
        ) : null}

        <section className="mobile-card mobile-item-info">
          <h3>
            <InfoCircleOutlined aria-hidden="true" />
            Информация о позиции
          </h3>
          {details.map((detail) => (
            <div key={detail.label}>
              <span>{detail.label}</span>
              <strong>{detail.value}</strong>
            </div>
          ))}
        </section>

        <section className="mobile-card mobile-item-info mobile-item-quantity-card">
          <h3>Количество</h3>
          <QuantityRow label="Всего" value={quantity.total} total={quantity.total} tone="primary" />
          <QuantityRow label="Доступно" value={quantity.available} total={quantity.total} tone="primary" />
          <QuantityRow label="Резерв" value={quantity.reserved} total={quantity.total} tone="neutral" />
          <QuantityRow label="Спорные" value={quantity.disputed} total={quantity.total} tone="error" />
        </section>

        <section className="mobile-item-sync">
          <div>
            <span>{currentItem.sync?.status ?? "Локально"}</span>
            <em>Нужна синхронизация</em>
          </div>
          <div>
            <strong>{currentItem.sync?.pending ?? 0}</strong>
            <span>Ожидают отправки</span>
          </div>
          <div>
            <strong>{currentItem.sync?.conflicts ?? 0}</strong>
            <span>Конфликты данных</span>
          </div>
        </section>

        <section className="mobile-card mobile-item-history">
          <h3>Последние действия</h3>
          {history.map((event) => (
            <div key={`${event.title}-${event.meta}`}>
              <span />
              <div>
                <p>{event.title}</p>
                <small>{event.meta}</small>
              </div>
            </div>
          ))}
        </section>

        {feedback ? <div className="mobile-item-feedback">{feedback}</div> : null}

        <section className="mobile-item-actions">
          {currentItem.discrepancyId ? (
            <button type="button" onClick={() => onOpenDiscrepancy?.(currentItem.discrepancyId)}>
              <ExportOutlined aria-hidden="true" />
              Открыть расхождение
            </button>
          ) : null}
          <div>
            <button type="button" onClick={onMoveItem}>
              <SwapOutlined aria-hidden="true" />
              Переместить
            </button>
            <button type="button" onClick={() => handleAction("Назначить")}>
              <UserSwitchOutlined aria-hidden="true" />
              Назначить
            </button>
          </div>
        </section>
      </main>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />
    </div>
  );
}
