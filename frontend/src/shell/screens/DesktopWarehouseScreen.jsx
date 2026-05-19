import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircleOutlined,
  CloseOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  ImportOutlined,
  PlusCircleOutlined,
  RightOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  warehouseAttentionDetails,
  warehouseAttentionItems,
  warehouseDetailPanel,
  warehouseFilters,
  warehouseKpiCards,
  warehouseMovementDestinations,
  warehouseMovementHistory,
  warehouseQuickFilters,
  warehouseRecentOps,
  warehouseTableRows,
} from "../data/warehouseScreenData.js";
import { DesktopModalShell } from "../components/DesktopModalShell.jsx";
import "../styles/desktopScreenCommon.css";
import "../styles/warehouseScreen.css";

function WarehouseKpiCard({ card }) {
  return (
    <article className={`wh-kpi-card tone-${card.tone}`}>
      <p className="wh-kpi-label">{card.label}</p>
      <div className="wh-kpi-bottom">
        <strong className="wh-kpi-value">{card.value}</strong>
        {card.badge ? (
          <span className="wh-kpi-badge">{card.badge}</span>
        ) : card.icon === "warning" ? (
          <WarningOutlined className="wh-kpi-icon" aria-hidden="true" />
        ) : card.icon === "error" ? (
          <ExclamationCircleOutlined className="wh-kpi-icon" aria-hidden="true" />
        ) : card.icon === "shipping" ? (
          <ImportOutlined className="wh-kpi-icon" aria-hidden="true" />
        ) : card.icon === "check" ? (
          <CheckCircleOutlined className="wh-kpi-icon" aria-hidden="true" />
        ) : null}
      </div>
    </article>
  );
}

function WarehouseStatusPill({ tone }) {
  const labels = {
    disputed: "Спорная позиция",
    available: "Доступно",
    conflict: "Требует решения",
    transit: "В перемещении",
    low: "Низкий остаток",
  };
  return (
    <span className={`wh-status-pill tone-${tone}`}>{labels[tone] ?? tone}</span>
  );
}

function WarehouseAttentionPanel({ onOpen }) {
  return (
    <section className="wh-panel">
      <div className="wh-panel-header">
        <h4>
          <WarningOutlined className="wh-panel-icon-disputed" aria-hidden="true" />
          Требуют внимания
        </h4>
      </div>
      <div className="wh-attention-list">
        {warehouseAttentionItems.map((item) => (
          <button
            className={`wh-attention-item tone-${item.tone}`}
            key={item.id}
            type="button"
            onClick={() => onOpen(item.id)}
          >
            <span>{item.text}</span>
            <RightOutlined aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}

function getWarehouseRowKey(row) {
  return `${row.id}|${row.warehouse}|${row.batch}`;
}

function WarehouseOpsPanel({ ops = warehouseRecentOps }) {
  return (
    <section className="wh-panel">
      <div className="wh-panel-header">
        <h4>
          <HistoryOutlined aria-hidden="true" />
          Последние складские операции
        </h4>
      </div>
      <div className="wh-ops-list">
        {ops.map((op) => (
          <div className="wh-ops-item" key={`${op.time}-${op.highlight}-${op.text}`}>
            <div className="wh-ops-time">{op.time}</div>
            <div className={`wh-ops-line tone-${op.tone}`}>
              <div className="wh-ops-dot" />
              <p>
                {op.text}{" "}
                <strong className="wh-ops-highlight">{op.highlight}</strong>
              </p>
              <small>{op.author}</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LoadingState({ title, text }) {
  return (
    <div className="wh-modal-status">
      <div className="wh-modal-spinner" />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function SuccessState({ title, text }) {
  return (
    <div className="wh-modal-status wh-modal-status-success">
      <CheckCircleOutlined />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function StockDetailsModal({ item, movements, onClose, onCreateMovement }) {
  return (
    <DesktopModalShell
      size="wide"
      title={`Карточка остатка: ${item.name}`}
      subtitle={`${item.id} • Партия ${item.batch}`}
      onClose={onClose}
      footer={
        <>
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose}>Закрыть</button>
          <button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={() => onCreateMovement(item)}>Создать перемещение</button>
        </>
      }
    >
      <div className="wh-stock-modal">
        <section className="wh-stock-hero">
          <div>
            <h3>{item.name}</h3>
            <p>{item.warehouse} • {item.zone}</p>
          </div>
          <div className="wh-stock-pills">
            <WarehouseStatusPill tone={item.statusTone} />
            {item.disputedQty > 0 ? <span className="wh-status-pill tone-conflict">Требует решения</span> : null}
          </div>
        </section>
        <section className="wh-modal-grid-four">
          <div className="wh-modal-stat"><span>На этом складе</span><strong>{item.total}</strong></div>
          <div className="wh-modal-stat"><span>Доступно</span><strong>{item.available}</strong></div>
          <div className="wh-modal-stat"><span>Резерв</span><strong>{item.reserve}</strong></div>
          <div className="wh-modal-stat"><span>Спорные</span><strong>{item.disputed}</strong></div>
        </section>
        <section className="wh-modal-card">
          <h3>Остаток на выбранном складе</h3>
          <div className="wh-meta-grid">
            <div><span>Позиция</span><strong>{item.name}</strong></div>
            <div><span>ID / артикул</span><strong>{item.id}</strong></div>
            <div><span>Категория</span><strong>{item.category}</strong></div>
            <div><span>Склад</span><strong>{item.warehouse}</strong></div>
            <div><span>Партия</span><strong>{item.batch}</strong></div>
            <div><span>Поставщик</span><strong>{item.supplier}</strong></div>
            <div><span>Источник</span><strong>{item.source}</strong></div>
            <div><span>Последнее действие</span><strong>{item.lastAction}</strong></div>
          </div>
        </section>
        {item.disputedQty > 0 ? (
          <section className="wh-warning-card">
            <WarningOutlined />
            <div>
              <strong>Есть спорные единицы</strong>
              <p>Тип проблемы: несоответствие данных. Ответственный: Колесников А.</p>
            </div>
          </section>
        ) : null}
        <section className="wh-modal-card">
          <div className="wh-modal-card-head">
            <h3>Движения и связанные операции</h3>
            <span>{movements.length} операции</span>
          </div>
          <div className="wh-modal-table-wrap">
            <table className="wh-modal-table">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Операция</th>
                  <th>Позиция</th>
                  <th>Инициатор</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((op) => (
                  <tr key={`${op.time}-${op.highlight}-${op.text}`}>
                    <td>{op.time}</td>
                    <td>{op.text}</td>
                    <td><strong>{op.highlight}</strong></td>
                    <td>{op.author}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DesktopModalShell>
  );
}

function MovementFormModal({ form, setForm, item, onClose, onSubmit }) {
  const totalQty = form.destinations.reduce((sum, dest) => sum + Number(dest.qty || 0), 0);
  const availableLeft = Math.max(0, (item?.availableQty ?? 0) - totalQty);
  const updateDestination = (id, key, value) => {
    setForm({
      ...form,
      destinations: form.destinations.map((dest) => dest.id === id ? { ...dest, [key]: value } : dest),
    });
  };

  return (
    <DesktopModalShell
      size="xwide"
      title="Создать перемещение"
      subtitle="Распределение количества со склада по складам и помещениям"
      onClose={onClose}
      footer={
        <>
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose}>Отмена</button>
          <button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={onSubmit} disabled={totalQty <= 0 || totalQty > (item?.availableQty ?? 0)}>
            Продолжить
          </button>
        </>
      }
    >
      <div className="wh-move-modal">
        <div className="wh-modal-note">
          <ExclamationCircleOutlined />
          <span>Перемещение будет сохранено в системе и попадёт в очередь синхронизации.</span>
        </div>
        <section className="wh-modal-card">
          <h3>Источник перемещения</h3>
          <div className="wh-meta-grid">
            <div><span>Оборудование</span><strong>{item.name}</strong></div>
            <div><span>ID</span><strong>{item.id}</strong></div>
            <div><span>Партия</span><strong>{item.batch}</strong></div>
            <div><span>Источник</span><strong>{item.warehouse}</strong></div>
          </div>
        </section>
        <section className="wh-modal-grid-four">
          <div className="wh-modal-stat"><span>Всего</span><strong>{item.total}</strong></div>
          <div className="wh-modal-stat"><span>Доступно</span><strong>{item.available}</strong></div>
          <div className="wh-modal-stat"><span>Резерв</span><strong>{item.reserve}</strong></div>
          <div className="wh-modal-stat"><span>Останется</span><strong>{availableLeft} шт.</strong></div>
        </section>
        <section className="wh-modal-card">
          <div className="wh-modal-card-head">
            <h3>Направления перемещения</h3>
            <span>Всего к перемещению: {totalQty} шт.</span>
          </div>
          <div className="wh-destination-list">
            {form.destinations.map((dest) => (
              <div className="wh-destination-row" key={dest.id}>
                <label>
                  <span>Тип</span>
                  <select value={dest.type} onChange={(event) => updateDestination(dest.id, "type", event.target.value)}>
                    <option>Склад</option>
                    <option>Помещение</option>
                  </select>
                </label>
                <label>
                  <span>Назначение</span>
                  <input value={dest.destination} onChange={(event) => updateDestination(dest.id, "destination", event.target.value)} />
                </label>
                <label>
                  <span>Количество</span>
                  <input type="number" min="0" value={dest.qty} onChange={(event) => updateDestination(dest.id, "qty", Number(event.target.value))} />
                </label>
                <label>
                  <span>Комментарий</span>
                  <input value={dest.comment} onChange={(event) => updateDestination(dest.id, "comment", event.target.value)} />
                </label>
              </div>
            ))}
          </div>
        </section>
        <label className="wh-comment-field">
          <span>Комментарий к перемещению</span>
          <textarea value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} />
        </label>
      </div>
    </DesktopModalShell>
  );
}

function MovementConfirmModal({ form, item, loading, onBack, onClose, onConfirm }) {
  const totalQty = form.destinations.reduce((sum, dest) => sum + Number(dest.qty || 0), 0);
  return (
    <DesktopModalShell
      size="narrow"
      title="Создать перемещение?"
      subtitle="Проверьте распределение перед созданием перемещения."
      onClose={onClose}
      closeDisabled={Boolean(loading)}
      footer={
        <>
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose} disabled={Boolean(loading)}>Отмена</button>
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onBack} disabled={Boolean(loading)}>Редактировать</button>
          <button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={onConfirm} disabled={Boolean(loading)}>Да, создать</button>
        </>
      }
    >
      {loading ? <LoadingState {...loading} /> : (
        <div className="wh-confirm-modal">
          <section className="wh-confirm-source">
            <div className="wh-item-icon"><span className="wh-icon-placeholder" aria-hidden="true" /></div>
            <div>
              <h3>{item.name}</h3>
              <p>ID: {item.id} • Партия: {item.batch}</p>
              <p>Источник: {item.warehouse}</p>
            </div>
          </section>
          <div className="wh-modal-note wh-modal-note-success">
            <CheckCircleOutlined />
            <span>Ошибок нет</span>
          </div>
          <section className="wh-modal-grid-three">
            <div className="wh-modal-stat"><span>Доступно</span><strong>{item.available} шт.</strong></div>
            <div className="wh-modal-stat"><span>К перемещению</span><strong>{totalQty} шт.</strong></div>
            <div className="wh-modal-stat"><span>Останется</span><strong>{Math.max(0, item.availableQty - totalQty)} шт.</strong></div>
          </section>
          <section className="wh-modal-card">
            <h3>Направления</h3>
            <div className="wh-confirm-list">
              {form.destinations.map((dest) => (
                <div className="wh-confirm-row" key={dest.id}>
                  <span>{dest.destination}</span>
                  <strong>{dest.qty} шт.</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </DesktopModalShell>
  );
}

function MovementSuccessModal({ item, form, onClose }) {
  const totalQty = form.destinations.reduce((sum, dest) => sum + Number(dest.qty || 0), 0);
  return (
    <DesktopModalShell
      size="narrow"
      title="Перемещение создано"
      subtitle={`${totalQty} шт. распределено по ${form.destinations.length} направлениям.`}
      onClose={onClose}
      footer={<button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={onClose}>Закрыть</button>}
    >
      <SuccessState title="Перемещение создано" text="Данные будут отправлены на backend после подключения API" />
      <div className="wh-success-summary">
        <div><span>ID</span><strong>{item.id}</strong></div>
        <div><span>Партия</span><strong>{item.batch}</strong></div>
        <div><span>К перемещению</span><strong>{totalQty} шт.</strong></div>
        <div><span>Направлений</span><strong>{form.destinations.length}</strong></div>
      </div>
    </DesktopModalShell>
  );
}

function AttentionDetailsModal({ detail, onClose }) {
  return (
    <DesktopModalShell
      size="wide"
      title={detail.title}
      subtitle={detail.summary}
      onClose={onClose}
      footer={<button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={onClose}>Закрыть</button>}
    >
      <div className="wh-modal-table-wrap">
        <table className="wh-modal-table">
          <thead>
            <tr>{detail.columns.map((column) => <th key={column}>{column}</th>)}</tr>
          </thead>
          <tbody>
            {detail.rows.map((row) => (
              <tr key={row.join("|")}>
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`}>{index === 0 ? <strong>{cell}</strong> : cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DesktopModalShell>
  );
}

function ExportStatusModal({ loading, success, hasFilters, onClose }) {
  return (
    <DesktopModalShell
      size="narrow"
      title="Экспорт остатков"
      subtitle={hasFilters ? "Формируем складской отчет по текущей выборке" : "Формируем складской отчет"}
      onClose={onClose}
      closeDisabled={Boolean(loading)}
      footer={
        success ? (
          <button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={onClose}>Закрыть</button>
        ) : (
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose} disabled={Boolean(loading)}>Отмена</button>
        )
      }
    >
      {loading ? <LoadingState {...loading} /> : <SuccessState title="Экспорт готов" text="Файл будет сформирован backend после подключения API" />}
    </DesktopModalShell>
  );
}

function MovementHistoryModal({ onClose }) {
  return (
    <DesktopModalShell
      size="wide"
      title="История перемещений"
      subtitle="Последние складские перемещения"
      onClose={onClose}
      footer={<button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={onClose}>Закрыть</button>}
    >
      <div className="wh-modal-table-wrap">
        <table className="wh-modal-table">
          <thead>
            <tr>
              <th>Дата / время</th>
              <th>ID</th>
              <th>Откуда</th>
              <th>Куда</th>
              <th>Позиция</th>
              <th>Кол-во</th>
              <th>Пользователь</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {warehouseMovementHistory.map((item) => (
              <tr key={item.id}>
                <td>{item.time}</td>
                <td><strong>{item.id}</strong></td>
                <td>{item.from}</td>
                <td>{item.to}</td>
                <td>{item.item}</td>
                <td>{item.qty}</td>
                <td>{item.user}</td>
                <td>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DesktopModalShell>
  );
}

function WarehouseDetailPanel({ item, onOpenDetails, onCreateMovement }) {
  const d = item ?? warehouseDetailPanel;
  return (
    <aside className="wh-detail-panel">
      <div className="wh-detail-header">
        <h3>Детали остатка</h3>
        <button type="button" className="wh-detail-close">
          <CloseOutlined aria-hidden="true" />
        </button>
      </div>

      <div className="wh-detail-image-card">
        <div className="wh-detail-image" />
        <p className="wh-detail-name">{d.name}</p>
        <p className="wh-detail-category">{d.category}</p>
      </div>

      <div className="wh-detail-section">
        <p className="wh-detail-section-label">Выбранная запись остатка</p>
        <div className="wh-detail-rows">
          <div className="wh-detail-row">
            <span>Склад</span>
            <span className="wh-detail-val">{d.warehouse}</span>
          </div>
          <div className="wh-detail-row">
            <span>Партия</span>
            <span className="wh-detail-val">{d.batch}</span>
          </div>
          <div className="wh-detail-divider" />
          <div className="wh-detail-row">
            <span>Всего на этом складе</span>
            <strong>{d.totalHere ?? d.total}</strong>
          </div>
          <div className="wh-detail-row">
            <span>Доступно</span>
            <strong className="wh-detail-available">{d.available}</strong>
          </div>
          <div className="wh-detail-row">
            <span>Резерв</span>
            <strong>{d.reserve}</strong>
          </div>
          <div className="wh-detail-row">
            <span>Спорные</span>
            <strong className="wh-detail-disputed">{d.disputed}</strong>
          </div>
        </div>
      </div>

      <div className="wh-detail-section wh-detail-distribution">
        <p className="wh-detail-section-label">Распределение по складам</p>
        <div className="wh-detail-rows">
          {(d.distribution ?? [{ name: d.warehouse, qty: d.total }]).map((loc) => (
            <div className="wh-detail-row" key={loc.name}>
              <span>{loc.name}</span>
              <strong>{loc.qty}</strong>
            </div>
          ))}
          <div className="wh-detail-divider" />
          <div className="wh-detail-row wh-detail-total-row">
            <span>Всего по позиции</span>
            <strong>{d.total}</strong>
          </div>
        </div>
      </div>

      <div className="wh-detail-actions">
        <button type="button" className="wh-detail-btn-outline" onClick={() => onOpenDetails(d)}>
          Открыть карточку остатка
        </button>
        <button type="button" className="wh-detail-btn-primary" onClick={() => onCreateMovement(d)}>
          Создать перемещение
        </button>
        <button type="button" className="wh-detail-btn-disputed">
          Открыть расхождение
        </button>
      </div>
    </aside>
  );
}

export function DesktopWarehouseScreen({ onNavigate }) {
  const [rows, setRows] = useState(warehouseTableRows);
  const [selectedKey, setSelectedKey] = useState(warehouseTableRows[0] ? getWarehouseRowKey(warehouseTableRows[0]) : "");
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(null);
  const [filters, setFilters] = useState({
    warehouse: "Все склады",
    category: "Все категории",
    status: "Любой статус",
    supplier: "Все поставщики",
    batch: "Все партии",
    plannedRoom: "Все помещения",
    quick: "Все",
  });
  const [movementForm, setMovementForm] = useState({
    destinations: warehouseMovementDestinations,
    comment: "Распределение по заявке отделений.",
  });
  const [recentOps, setRecentOps] = useState(warehouseRecentOps);
  const [attentionId, setAttentionId] = useState(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const timersRef = useRef([]);

  useEffect(() => () => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
  }, []);

  const selectedItem = useMemo(
    () => rows.find((row) => getWarehouseRowKey(row) === selectedKey) ?? rows[0],
    [rows, selectedKey]
  );

  const visibleRows = useMemo(() => rows.filter((row) => {
    if (filters.warehouse !== "Все склады" && row.warehouse !== filters.warehouse) return false;
    if (filters.category !== "Все категории" && row.category !== filters.category) return false;
    if (filters.status !== "Любой статус" && row.status !== filters.status) return false;
    if (filters.supplier !== "Все поставщики" && row.supplier !== filters.supplier) return false;
    if (filters.batch !== "Все партии" && row.batch !== filters.batch) return false;
    if (filters.plannedRoom !== "Все помещения" && row.plannedRoom !== filters.plannedRoom) return false;
    if (filters.quick === "Доступно") return row.statusTone === "available";
    if (filters.quick === "Спорные") return row.statusTone === "disputed";
    if (filters.quick === "В перемещении") return row.statusTone === "transit";
    if (filters.quick === "Ожидают проверки") return row.statusTone === "low";
    if (filters.quick === "Конфликты") return row.statusTone === "conflict";
    return true;
  }), [filters, rows]);

  useEffect(() => {
    if (visibleRows.length && !visibleRows.some((row) => getWarehouseRowKey(row) === selectedKey)) {
      setSelectedKey(getWarehouseRowKey(visibleRows[0]));
    }
  }, [selectedKey, visibleRows]);

  const scheduleAction = (state, callback) => {
    if (loading) return;
    setLoading(state);
    const timerId = window.setTimeout(() => {
      setLoading(null);
      callback();
    }, 3000);
    timersRef.current.push(timerId);
  };

  const closeModal = () => {
    if (loading) return;
    setModal(null);
    setAttentionId(null);
    setExportSuccess(false);
  };

  const openMovement = (item = selectedItem) => {
    if (!item) return;
    setSelectedKey(getWarehouseRowKey(item));
    setMovementForm({
      destinations: warehouseMovementDestinations,
      comment: "Распределение по заявке отделений.",
    });
    setModal("movement");
  };

  const confirmMovement = () => {
    if (!selectedItem) return;
    const movedQty = movementForm.destinations.reduce((sum, dest) => sum + Number(dest.qty || 0), 0);
    scheduleAction(
      {
        title: "Создаем перемещение",
        text: "Проверяем остатки и резервируем позиции",
      },
      () => {
        setRows((currentRows) => currentRows.map((row) => row.id === selectedItem.id && row.warehouse === selectedItem.warehouse ? {
          ...row,
          availableQty: Math.max(0, row.availableQty - movedQty),
          available: String(Math.max(0, row.availableQty - movedQty)),
          reserveQty: row.reserveQty + movedQty,
          reserve: String(row.reserveQty + movedQty),
          status: "В перемещении",
          statusTone: "transit",
        } : row));
        setRecentOps((currentOps) => [{
          time: "сейчас",
          text: "Создано перемещение",
          highlight: selectedItem.id,
          author: "Оператор",
          tone: "primary",
        }, ...currentOps]);
        setModal("success");
      }
    );
  };

  const updateFilter = (label, value) => {
    const map = {
      "Склад": "warehouse",
      "Категория": "category",
      "Статус": "status",
      "Поставщик": "supplier",
      "Партия": "batch",
      "Плановое помещение": "plannedRoom",
    };
    setFilters((current) => ({ ...current, [map[label]]: value }));
  };

  const resetFilters = () => {
    setFilters({
      warehouse: "Все склады",
      category: "Все категории",
      status: "Любой статус",
      supplier: "Все поставщики",
      batch: "Все партии",
      plannedRoom: "Все помещения",
      quick: "Все",
    });
  };

  const hasFilters = filters.warehouse !== "Все склады"
    || filters.category !== "Все категории"
    || filters.status !== "Любой статус"
    || filters.supplier !== "Все поставщики"
    || filters.batch !== "Все партии"
    || filters.plannedRoom !== "Все помещения"
    || filters.quick !== "Все";

  const openExport = () => {
    setModal("export");
    setExportSuccess(false);
    scheduleAction(
      {
        title: "Готовим экспорт",
        text: hasFilters ? "Формируем складской отчет по текущей выборке" : "Формируем складской отчет",
      },
      () => setExportSuccess(true)
    );
  };

  const openAttention = (id) => {
    setAttentionId(id);
    setModal("attention");
  };

  return (
    <div className="desktop-screen desktop-warehouse-screen">
      {/* Main content + right panel */}
      <div className="wh-layout">
        <div className="wh-main">
          {/* KPI Grid */}
          <div className="wh-kpi-grid">
            {warehouseKpiCards.map((card) => (
              <WarehouseKpiCard card={card} key={card.label} />
            ))}
          </div>

          {/* Action Bar */}
          <div className="wh-actions">
            <button type="button" className="wh-btn-primary" onClick={() => openMovement(selectedItem)}>
              <PlusCircleOutlined aria-hidden="true" />
              Создать перемещение
            </button>
            <button type="button" className="wh-btn-secondary" onClick={() => onNavigate?.("receipts")} disabled={Boolean(loading)}>
              <ImportOutlined aria-hidden="true" />
              Открыть поступления
            </button>
            <button type="button" className="wh-btn-secondary" onClick={openExport} disabled={Boolean(loading)}>
              <DownloadOutlined aria-hidden="true" />
              Экспорт остатков
            </button>
            <button type="button" className="wh-btn-secondary" onClick={() => setModal("history")} disabled={Boolean(loading)}>
              <HistoryOutlined aria-hidden="true" />
              История перемещений
            </button>
          </div>

          {/* Filter */}
          <section className="wh-filter-card">
            <div className="wh-filter-grid">
              {warehouseFilters.map((f) => (
                <label className="wh-filter-field" key={f.label}>
                  <span>{f.label}</span>
                  <select value={filters[{
                    "Склад": "warehouse",
                    "Категория": "category",
                    "Статус": "status",
                    "Поставщик": "supplier",
                    "Партия": "batch",
                    "Плановое помещение": "plannedRoom",
                  }[f.label]]} onChange={(event) => updateFilter(f.label, event.target.value)}>
                    {f.options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="wh-filter-pills-row">
              <div className="wh-filter-pills">
                {warehouseQuickFilters.map((qf) => (
                  <button
                    type="button"
                    className={`wh-filter-pill tone-${qf.tone}${filters.quick === qf.label ? " is-active" : ""}`}
                    key={qf.label}
                    onClick={() => setFilters((current) => ({ ...current, quick: qf.label }))}
                  >
                    {qf.label}
                  </button>
                ))}
              </div>
              <button type="button" className="wh-filter-reset" onClick={resetFilters}>
                Сбросить фильтры
              </button>
            </div>
          </section>

          {/* Table */}
          <section className="wh-table-card">
            <div className="wh-table-header">
              <h3>Складские остатки</h3>
              <div className="wh-table-header-right">
                <span className="wh-table-count">Показано {visibleRows.length} из {rows.length} позиций</span>
                <div className="wh-view-toggle">
                  <button type="button" className="is-active">
                    ≡
                  </button>
                  <button type="button">⊞</button>
                </div>
              </div>
            </div>
            <div className="wh-table-wrap">
              <table className="wh-table">
                <thead>
                  <tr>
                    <th className="wh-th-wide">Позиция</th>
                    <th>ID / артикул</th>
                    <th>Склад</th>
                    <th>Партия</th>
                    <th className="wh-th-center">Всего</th>
                    <th className="wh-th-center">Доступно</th>
                    <th className="wh-th-center">Резерв</th>
                    <th className="wh-th-center">Спорные</th>
                    <th>Статус</th>
                    <th className="wh-th-right">Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr
                      key={`${row.id}-${row.warehouse}-${row.batch}`}
                      className={getWarehouseRowKey(row) === selectedKey ? "wh-row-highlight" : ""}
                      onClick={() => setSelectedKey(getWarehouseRowKey(row))}
                    >
                      <td className="wh-td-name">
                        <div className="wh-item-cell">
                          <div className="wh-item-icon">
                            <span className="wh-icon-placeholder" aria-hidden="true" />
                          </div>
                          <span className={row.highlight ? "wh-name-accent" : "wh-name"}>
                            {row.name}
                          </span>
                        </div>
                      </td>
                      <td className="wh-td-id">{row.id}</td>
                      <td className="wh-td-warehouse">{row.warehouse}</td>
                      <td className="wh-td-batch">{row.batch}</td>
                      <td className="wh-td-num wh-td-center wh-td-bold">{row.total}</td>
                      <td className={`wh-td-num wh-td-center${row.available === "0" ? " wh-td-muted" : ""}`}>
                        {row.available}
                      </td>
                      <td className="wh-td-num wh-td-center wh-td-muted">{row.reserve}</td>
                      <td
                        className={`wh-td-num wh-td-center wh-td-bold${
                          row.statusTone === "disputed" ? " wh-td-disputed" : ""
                        }${row.statusTone === "conflict" ? " wh-td-conflict" : ""}`}
                      >
                        {row.disputed}
                      </td>
                      <td>
                        <WarehouseStatusPill tone={row.statusTone} />
                      </td>
                      <td className="wh-td-action">
                        <button
                          type="button"
                          className={`wh-row-btn${getWarehouseRowKey(row) === selectedKey ? " is-accent" : ""}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedKey(getWarehouseRowKey(row));
                            setModal("stock");
                          }}
                        >
                          Открыть
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Bottom Panels */}
          <div className="wh-bottom-panels">
            <WarehouseAttentionPanel onOpen={openAttention} />
            <WarehouseOpsPanel ops={recentOps} />
          </div>
        </div>

        {/* Right detail panel */}
        <WarehouseDetailPanel item={selectedItem} onOpenDetails={(item) => {
          setSelectedKey(getWarehouseRowKey(item));
          setModal("stock");
        }} onCreateMovement={openMovement} />
      </div>
      {modal === "stock" && selectedItem ? (
        <StockDetailsModal item={selectedItem} movements={recentOps} onClose={closeModal} onCreateMovement={openMovement} />
      ) : null}
      {modal === "movement" && selectedItem ? (
        <MovementFormModal
          form={movementForm}
          setForm={setMovementForm}
          item={selectedItem}
          onClose={closeModal}
          onSubmit={() => setModal("confirm")}
        />
      ) : null}
      {modal === "confirm" && selectedItem ? (
        <MovementConfirmModal
          form={movementForm}
          item={selectedItem}
          loading={loading}
          onBack={() => setModal("movement")}
          onClose={closeModal}
          onConfirm={confirmMovement}
        />
      ) : null}
      {modal === "success" && selectedItem ? (
        <MovementSuccessModal item={selectedItem} form={movementForm} onClose={closeModal} />
      ) : null}
      {modal === "attention" && attentionId ? (
        <AttentionDetailsModal detail={warehouseAttentionDetails[attentionId]} onClose={closeModal} />
      ) : null}
      {modal === "export" ? (
        <ExportStatusModal loading={loading} success={exportSuccess} hasFilters={hasFilters} onClose={closeModal} />
      ) : null}
      {modal === "history" ? (
        <MovementHistoryModal onClose={closeModal} />
      ) : null}
    </div>
  );
}
