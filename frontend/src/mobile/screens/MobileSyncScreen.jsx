import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloudSyncOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  SyncOutlined,
  WifiOutlined,
} from "@ant-design/icons";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";
import { MobileResultModal } from "../components/MobileResultModal.jsx";
import { mobileSyncData } from "../data/mobileMockData.js";
import {
  createOfflineSyncTransport,
  listSyncQueueOperations,
  processQueue,
  retryQueueOperation,
} from "../../services/offline/index.js";

const toneIcons = {
  conflict: ExclamationCircleOutlined,
  error: ExclamationCircleOutlined,
  pending: SyncOutlined,
  success: CheckCircleOutlined,
};

const operationTypeLabels = {
  DISCREPANCY_RESOLVE: "Расхождение",
  RECEIPT_BATCH_CONFIRM: "Поступление",
  WAREHOUSE_CREATE: "Создание склада",
  WAREHOUSE_CLOSE: "Закрытие склада",
  WAREHOUSE_MOVE_CREATE: "Перемещение",
  EQUIPMENT_CHECK_UPDATE: "Осмотр оборудования",
};

const statusLabels = {
  queued: { label: "В очереди", filter: "Ожидают отправки", tone: "pending", note: "Ожидает отправки" },
  syncing: { label: "Синхронизация", filter: "Ожидают отправки", tone: "pending", note: "Отправка в процессе" },
  synced: { label: "Синхронизировано", filter: "Синхронизировано", tone: "success", note: "Операция обработана" },
  failed: { label: "Ошибка", filter: "Ошибки", tone: "error", note: "Требуется повторная отправка" },
  conflict: { label: "Конфликт", filter: "Конфликты", tone: "conflict", note: "Требует разбора" },
  cancelled: { label: "Отменено", filter: "Ошибки", tone: "error", note: "Операция отменена" },
};

function formatOperationTime(operation) {
  const timestamp = operation.updatedAt ?? operation.createdAt;

  if (!timestamp) {
    return "—";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function mapQueueOperationToItem(operation) {
  const status = statusLabels[operation.status] ?? statusLabels.queued;
  const operationLabel = operationTypeLabels[operation.type] ?? operation.type ?? "Операция";
  const context = operation.context ?? {};
  const code = operation.entityId ?? context.draftId ?? operation.id;
  const attempts = operation.attempts ?? 0;
  const source = context.sourceScreen ? `Источник: ${context.sourceScreen}` : `Тип: ${operation.entityType ?? "не указан"}`;

  return {
    id: operation.id,
    title: `${operationLabel} • ${code}`,
    code,
    time: formatOperationTime(operation),
    description: source,
    warning: operation.error?.message ?? null,
    status: status.label,
    statusKey: status.filter,
    tone: status.tone,
    note: attempts > 0 ? `${status.note} • попыток: ${attempts}` : status.note,
  };
}

function getQueueCounts(queueItems) {
  return [
    {
      key: "pending",
      label: "ожидают (локально)",
      value: queueItems.filter((item) => item.statusKey === "Ожидают отправки").length,
      tone: "primary",
    },
    {
      key: "synced",
      label: "отправлено",
      value: queueItems.filter((item) => item.statusKey === "Синхронизировано").length,
      tone: "success",
    },
    {
      key: "conflict",
      label: "конфликта",
      value: queueItems.filter((item) => item.statusKey === "Конфликты").length,
      tone: "warning",
    },
    {
      key: "error",
      label: "ошибка",
      value: queueItems.filter((item) => item.statusKey === "Ошибки").length,
      tone: "error",
    },
  ];
}

function formatAttentionCount(value, forms) {
  const mod10 = value % 10;
  const mod100 = value % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${value} ${forms[0]}`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${value} ${forms[1]}`;
  }

  return `${value} ${forms[2]}`;
}

function getAttentionText(queueCounts) {
  const errorCount = queueCounts.find((count) => count.key === "error")?.value ?? 0;
  const conflictCount = queueCounts.find((count) => count.key === "conflict")?.value ?? 0;
  const attentionParts = [
    errorCount > 0 ? formatAttentionCount(errorCount, ["ошибка", "ошибки", "ошибок"]) : null,
    conflictCount > 0 ? formatAttentionCount(conflictCount, ["конфликт", "конфликта", "конфликтов"]) : null,
  ].filter(Boolean);

  return attentionParts.length > 0 ? `Требуют внимания: ${attentionParts.join(", ")}` : "";
}

function SyncQueueItem({ item, isSelected, onSelect }) {
  const Icon = toneIcons[item.tone] ?? SyncOutlined;

  return (
    <article
      className={`mobile-sync-queue-item is-${item.tone}${isSelected ? " is-selected" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(item.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.(item.id);
        }
      }}
    >
      <div>
        <h3>{item.title}</h3>
        <span>ID: {item.code}</span>
      </div>
      <time>{item.time}</time>
      <p>{item.description}</p>
      {item.warning ? <p className="is-warning">{item.warning}</p> : null}
      <footer>
        <em>
          <Icon aria-hidden="true" />
          {item.status}
        </em>
        <span>{item.note}</span>
      </footer>
    </article>
  );
}

export function MobileSyncScreen({ activeNavKey, onBack, onNavSelect }) {
  const data = mobileSyncData;
  const [activeFilter, setActiveFilter] = useState(data.filters[0]);
  const [selectedQueueId, setSelectedQueueId] = useState(null);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(true);
  const [queueOperations, setQueueOperations] = useState([]);
  const [lastReadAt, setLastReadAt] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [result, setResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadQueueOperations = () => {
    return listSyncQueueOperations()
      .then((operations) => {
        const sortedOperations = [...operations].sort((first, second) => (
          new Date(second.updatedAt ?? second.createdAt ?? 0).getTime() -
          new Date(first.updatedAt ?? first.createdAt ?? 0).getTime()
        ));

        setQueueOperations(sortedOperations);
        setLastReadAt(new Date());
      })
      .catch(() => {
        setQueueOperations([]);
        setFeedback("Не удалось прочитать локальную очередь");
        return [];
      });
  };

  useEffect(() => {
    loadQueueOperations();
  }, []);

  const queueItems = useMemo(() => queueOperations.map(mapQueueOperationToItem), [queueOperations]);
  const queueCounts = useMemo(() => getQueueCounts(queueItems), [queueItems]);
  const attentionText = useMemo(() => getAttentionText(queueCounts), [queueCounts]);
  const transport = useMemo(() => createOfflineSyncTransport(), []);
  const updatedAt = lastReadAt
    ? new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(lastReadAt)
    : data.updatedAt;

  const visibleQueue = useMemo(() => {
    if (activeFilter === "Все") {
      return queueItems;
    }

    return queueItems.filter((item) => item.statusKey === activeFilter);
  }, [activeFilter, queueItems]);

  const handleSyncNow = () => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    processQueue({ transport })
      .then((summary) => loadQueueOperations().then(() => {
        setResult({
          status: summary.failed > 0 ? "error" : "success",
          title: "Обработка очереди выполнена локально",
          text: summary.failed > 0
            ? "Контракт отправки на сервер пока не подключён. Операции переведены в ошибку с деталями."
            : "Очередь перечитана, операций для обработки нет.",
        });
      }))
      .catch(() => {
        setResult({
          status: "error",
          title: "Ошибка обработки очереди",
          text: "Не удалось обработать локальную очередь.",
        });
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  const handleQueueSelect = (queueId) => {
    setSelectedQueueId(queueId);
    setFeedback("Строка очереди выбрана локально");
  };

  const handleRetry = () => {
    if (isProcessing) {
      return;
    }

    if (!selectedQueueId) {
      setResult({
        status: "error",
        title: "Операция не выбрана",
        text: "Выберите строку очереди для повторной обработки.",
      });
      return;
    }

    setIsProcessing(true);
    retryQueueOperation(selectedQueueId, { transport })
      .then((retryResult) => loadQueueOperations().then(() => {
        setResult({
          status: retryResult.status === "skipped" ? "success" : "error",
          title: retryResult.status === "skipped" ? "Повторная обработка не требуется" : "Повторная обработка выполнена локально",
          text: retryResult.status === "skipped"
            ? "Операция не подходит для повторной обработки."
            : "Контракт отправки на сервер пока не подключён. Операция осталась в ошибке с деталями.",
        });
      }))
      .catch(() => {
        setResult({
          status: "error",
          title: "Ошибка повторной обработки",
          text: "Не удалось обработать выбранную операцию.",
        });
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  return (
    <div className="mobile-sync-screen">
      <header className="mobile-sync-header">
        <button type="button" aria-label="Назад" onClick={onBack}>
          <ArrowLeftOutlined aria-hidden="true" />
        </button>
        <h1>Синхронизация</h1>
        <button type="button" aria-label="Синхронизировать" onClick={handleSyncNow}>
          <CloudSyncOutlined aria-hidden="true" />
        </button>
      </header>

      <main className="mobile-sync-content">
        <section className="mobile-card mobile-sync-summary">
          <div className="mobile-sync-summary-head">
            <div>
              <h2>Состояние</h2>
              <p>Обновлено: {updatedAt}</p>
            </div>
            <span>
              <WifiOutlined aria-hidden="true" />
              {data.status}
            </span>
          </div>
          <div className="mobile-sync-count-grid">
            {queueCounts.map((count) => (
              <div className={`is-${count.tone}`} key={count.key}>
                <strong>{count.value}</strong>
                <span>{count.label}</span>
              </div>
            ))}
          </div>
          <p>Данные сохраняются локально на устройстве и будут отправлены при подключении к сети</p>
          <div className="mobile-sync-summary-actions">
            <button type="button" onClick={handleSyncNow}>
              <SyncOutlined aria-hidden="true" />
              Синхронизировать сейчас
            </button>
            <button type="button" onClick={handleRetry}>
              <ReloadOutlined aria-hidden="true" />
              Повторить отправку
            </button>
          </div>
        </section>

        {attentionText ? <p className="mobile-sync-attention">{attentionText}</p> : null}

        <section className="mobile-sync-queue-section">
          <h2>Очередь изменений</h2>
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
          <div className="mobile-sync-queue-list">
            {visibleQueue.map((item) => (
              <SyncQueueItem
                item={item}
                isSelected={item.id === selectedQueueId}
                key={item.id}
                onSelect={handleQueueSelect}
              />
            ))}
          </div>
        </section>

        <section className="mobile-sync-settings">
          <label>
            <input
              type="checkbox"
              checked={isAutoSyncEnabled}
              onChange={() => setIsAutoSyncEnabled((current) => !current)}
            />
            Автосинхронизация при появлении сети
          </label>
        </section>

        <section className="mobile-sync-guide">
          <h3>Работа без сети</h3>
          <p>Все изменения надежно сохраняются на устройстве.</p>
          <ul>
            {data.guide.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        {feedback ? <div className="mobile-sync-feedback">{feedback}</div> : null}
      </main>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />

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
