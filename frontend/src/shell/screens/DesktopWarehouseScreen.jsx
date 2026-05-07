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
  warehouseAttentionItems,
  warehouseDetailPanel,
  warehouseFilters,
  warehouseKpiCards,
  warehouseQuickFilters,
  warehouseRecentOps,
  warehouseTableRows,
} from "../data/warehouseScreenData.js";
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
  };
  return (
    <span className={`wh-status-pill tone-${tone}`}>{labels[tone] ?? tone}</span>
  );
}

function WarehouseAttentionPanel() {
  return (
    <section className="wh-panel">
      <div className="wh-panel-header">
        <h4>
          <WarningOutlined className="wh-panel-icon-disputed" aria-hidden="true" />
          Требуют внимания
        </h4>
      </div>
      <div className="wh-attention-list">
        {warehouseAttentionItems.map((item, i) => (
          <div className={`wh-attention-item tone-${item.tone}`} key={i}>
            <span>{item.text}</span>
            <RightOutlined aria-hidden="true" />
          </div>
        ))}
      </div>
    </section>
  );
}

function WarehouseOpsPanel() {
  return (
    <section className="wh-panel">
      <div className="wh-panel-header">
        <h4>
          <HistoryOutlined aria-hidden="true" />
          Последние складские операции
        </h4>
      </div>
      <div className="wh-ops-list">
        {warehouseRecentOps.map((op, i) => (
          <div className="wh-ops-item" key={i}>
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

function WarehouseDetailPanel() {
  const d = warehouseDetailPanel;
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
            <strong>{d.totalHere}</strong>
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
          {d.distribution.map((loc) => (
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
        <button type="button" className="wh-detail-btn-outline">
          Открыть карточку остатка
        </button>
        <button type="button" className="wh-detail-btn-primary">
          Создать перемещение
        </button>
        <button type="button" className="wh-detail-btn-disputed">
          Открыть расхождение
        </button>
      </div>
    </aside>
  );
}

export function DesktopWarehouseScreen() {
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
            <button type="button" className="wh-btn-primary">
              <PlusCircleOutlined aria-hidden="true" />
              Создать перемещение
            </button>
            <button type="button" className="wh-btn-secondary">
              <ImportOutlined aria-hidden="true" />
              Открыть поступления
            </button>
            <button type="button" className="wh-btn-secondary">
              <DownloadOutlined aria-hidden="true" />
              Экспорт остатков
            </button>
            <button type="button" className="wh-btn-secondary">
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
                  <select defaultValue={f.options[0]}>
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
                    className={`wh-filter-pill tone-${qf.tone}${qf.active ? " is-active" : ""}`}
                    key={qf.label}
                  >
                    {qf.label}
                  </button>
                ))}
              </div>
              <button type="button" className="wh-filter-reset">
                Сбросить фильтры
              </button>
            </div>
          </section>

          {/* Table */}
          <section className="wh-table-card">
            <div className="wh-table-header">
              <h3>Складские остатки</h3>
              <div className="wh-table-header-right">
                <span className="wh-table-count">Показано 4 из 128 позиций</span>
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
                  {warehouseTableRows.map((row, i) => (
                    <tr
                      key={i}
                      className={row.highlight ? "wh-row-highlight" : ""}
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
                          className={`wh-row-btn${row.highlight ? " is-accent" : ""}`}
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
            <WarehouseAttentionPanel />
            <WarehouseOpsPanel />
          </div>
        </div>

        {/* Right detail panel */}
        <WarehouseDetailPanel />
      </div>
    </div>
  );
}
