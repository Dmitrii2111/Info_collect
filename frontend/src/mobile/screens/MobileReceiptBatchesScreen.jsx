import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  RightOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";
import { MobileEmptyState } from "../components/MobileEmptyState.jsx";
import { mobileReceiptBatchesData } from "../data/mobileMockData.js";

function getReceiptTone(batch) {
  if (batch.conflictCount > 0 || batch.status === "Конфликт") {
    return "error";
  }

  if (batch.status === "В проверке") {
    return "warning";
  }

  if (batch.status === "Подтверждено") {
    return "completed";
  }

  return batch.tone ?? "primary";
}

export function MobileReceiptBatchesScreen({ activeNavKey, onBack, onOpenBatch, onNavSelect }) {
  const batches = mobileReceiptBatchesData;

  return (
    <div className="mobile-warehouse-screen">
      <header className="mobile-item-card-header">
        <button type="button" aria-label="Назад на склад" onClick={onBack}>
          <ArrowLeftOutlined aria-hidden="true" />
        </button>
        <h1>Поступления</h1>
        <span aria-hidden="true" />
      </header>

      <main className="mobile-warehouse-content">
        <section className="mobile-card mobile-warehouse-summary">
          <div className="mobile-warehouse-summary-head">
            <div>
              <h2>Партии для проверки</h2>
              <p>Поступления созданы на desktop и ожидают обработки оператором</p>
            </div>
            <span>{batches.length}</span>
          </div>

          <div className="mobile-warehouse-metrics">
            <div className="is-primary">
              <span>Ожидают</span>
              <strong>{batches.filter((batch) => batch.status === "Ожидает проверки").length}</strong>
            </div>
            <div className="is-secondary">
              <span>В проверке</span>
              <strong>{batches.filter((batch) => batch.status === "В проверке").length}</strong>
            </div>
            <div className="is-error">
              <span>Конфликты</span>
              <strong>{batches.filter((batch) => batch.conflictCount > 0 || batch.status === "Конфликт").length}</strong>
            </div>
          </div>
        </section>

        <section className="mobile-warehouse-section">
          <h3>Список поступлений</h3>
          <div className="mobile-warehouse-list">
            {batches.length > 0 ? (
              batches.map((batch) => (
                <article
                  className={`mobile-warehouse-item is-${getReceiptTone(batch)}`}
                  role="button"
                  tabIndex={0}
                  key={batch.id}
                  onClick={() => onOpenBatch?.(batch.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpenBatch?.(batch.id);
                    }
                  }}
                >
                  <div className="mobile-warehouse-item-head">
                    <div>
                      <h4>Партия {batch.batchNumber ?? batch.number}</h4>
                      <p>{batch.objectName ?? batch.warehouseName}</p>
                    </div>
                    <span>{batch.status}</span>
                  </div>
                  <div className="mobile-warehouse-item-body">
                    <p>
                      <InboxOutlined aria-hidden="true" />
                      {batch.warehouseName}
                    </p>
                    <p>
                      <ClockCircleOutlined aria-hidden="true" />
                      {batch.createdAt} • {batch.responsible}
                    </p>
                    {batch.conflictCount > 0 ? (
                      <p className="is-warning">
                        <WarningOutlined aria-hidden="true" />
                        Конфликтов: {batch.conflictCount}
                      </p>
                    ) : null}
                  </div>
                  <div className="mobile-warehouse-item-footer">
                    <span>{batch.positionsCount} поз. • {batch.totalQuantity} {batch.unit}</span>
                    <RightOutlined aria-hidden="true" />
                  </div>
                </article>
              ))
            ) : (
              <MobileEmptyState className="mobile-warehouse-empty">Поступления не найдены</MobileEmptyState>
            )}
          </div>
        </section>
      </main>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />
    </div>
  );
}
