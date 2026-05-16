import { useMemo, useState } from "react";
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
import { mobileSyncData } from "../data/mobileMockData.js";

const toneIcons = {
  conflict: ExclamationCircleOutlined,
  error: ExclamationCircleOutlined,
  pending: SyncOutlined,
  success: CheckCircleOutlined,
};

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
  const [localPendingCount, setLocalPendingCount] = useState(data.counts[0].value);
  const [feedback, setFeedback] = useState("");

  const visibleQueue = useMemo(() => {
    if (activeFilter === "Все") {
      return data.queue;
    }

    return data.queue.filter((item) => item.statusKey === activeFilter);
  }, [activeFilter, data.queue]);

  const handleSyncNow = () => {
    setLocalPendingCount(0);
    setFeedback("Синхронизация выполнена локально");
  };

  const handleQueueSelect = (queueId) => {
    setSelectedQueueId(queueId);
    setFeedback("Строка очереди выбрана локально");
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
              <p>Обновлено: {data.updatedAt}</p>
            </div>
            <span>
              <WifiOutlined aria-hidden="true" />
              {data.status}
            </span>
          </div>
          <div className="mobile-sync-count-grid">
            {data.counts.map((count, index) => (
              <div className={`is-${count.tone}`} key={count.key}>
                <strong>{index === 0 ? localPendingCount : count.value}</strong>
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
            <button type="button" onClick={() => setFeedback("Повторная отправка отмечена локально")}>
              <ReloadOutlined aria-hidden="true" />
              Повторить отправку
            </button>
          </div>
        </section>

        <p className="mobile-sync-attention">{data.attention}</p>

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
    </div>
  );
}
