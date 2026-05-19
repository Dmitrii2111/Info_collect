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
import { MobileBottomSheet } from "../components/MobileBottomSheet.jsx";
import { MobileConfirmModal } from "../components/MobileConfirmModal.jsx";
import { MobileResultModal } from "../components/MobileResultModal.jsx";
import { mobileAssignmentOperators } from "../data/mobileMockData.js";

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
  const [result, setResult] = useState(null);
  const [isAssignSheetOpen, setIsAssignSheetOpen] = useState(false);
  const [selectedOperatorId, setSelectedOperatorId] = useState(null);
  const [pendingOperator, setPendingOperator] = useState(null);
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
  const selectedOperator = mobileAssignmentOperators.find((operator) => operator.id === selectedOperatorId) ?? null;

  const handleAction = (label) => {
    setFeedback("");
    setResult({
      status: "success",
      title: "Синхронизация",
      text: "Данные позиции будут отправлены при следующей синхронизации.",
    });
  };

  const handleOpenAssignSheet = () => {
    setFeedback("");
    setSelectedOperatorId(null);
    setIsAssignSheetOpen(true);
  };

  const handlePrepareAssign = () => {
    if (!selectedOperator) {
      return;
    }

    setPendingOperator(selectedOperator);
    setIsAssignSheetOpen(false);
  };

  const handleConfirmAssign = () => {
    setPendingOperator(null);
    setResult({
      status: "success",
      title: "Назначение подготовлено",
      text: "Позиция добавлена в очередь назначения ответственному.",
    });
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
            <button type="button" onClick={handleOpenAssignSheet}>
              <UserSwitchOutlined aria-hidden="true" />
              Назначить
            </button>
          </div>
        </section>
      </main>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />

      {isAssignSheetOpen ? (
        <MobileBottomSheet
          title="Выбор оператора"
          subtitle="Выберите ответственного для позиции"
          mode="modal"
          onClose={() => setIsAssignSheetOpen(false)}
          footer={({ close }) => (
            <>
              <button className="mobile-secondary-button" type="button" onClick={() => close(() => setIsAssignSheetOpen(false))}>
                Отмена
              </button>
              <button
                className="mobile-primary-button"
                type="button"
                disabled={!selectedOperator}
                onClick={() => close(handlePrepareAssign)}
              >
                Продолжить
              </button>
            </>
          )}
        >
          <div className="mobile-operator-select-list">
            {mobileAssignmentOperators.map((operator) => (
              <button
                className={operator.id === selectedOperatorId ? "is-selected" : ""}
                type="button"
                key={operator.id}
                onClick={() => setSelectedOperatorId(operator.id)}
              >
                <strong>{operator.name}</strong>
                <span>{operator.role} • {operator.status}</span>
              </button>
            ))}
          </div>
        </MobileBottomSheet>
      ) : null}

      <MobileConfirmModal
        isOpen={Boolean(pendingOperator)}
        title="Назначить позицию"
        text={`Назначить позицию оператору ${pendingOperator?.name ?? ""}?`}
        confirmLabel="Назначить"
        onCancel={() => setPendingOperator(null)}
        onConfirm={handleConfirmAssign}
      />

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
