import {
  ApartmentOutlined,
  PlusCircleOutlined,
  DownloadOutlined,
  DownOutlined,
  RightOutlined,
  BankOutlined,
  AppstoreOutlined,
  HomeOutlined,
  MinusOutlined,
  MoreOutlined,
  ExpandAltOutlined,
  ReloadOutlined,
  CheckSquareOutlined,
  SyncOutlined,
  CloseOutlined,
  WarningOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import "../styles/objectsScreen.css";

/* ─── Progress Bar ─── */
function ProgressBar({ pct }) {
  return (
    <div className="obj-progress-wrap">
      <div className="obj-progress-track">
        {pct > 0 && (
          <div className="obj-progress-fill" style={{ width: `${pct}%` }} />
        )}
      </div>
      <span className="obj-progress-label">{pct}%</span>
    </div>
  );
}

/* ─── Status Badge ─── */
function StatusBadge({ status }) {
  const cls =
    status === "В работе"
      ? "obj-badge obj-badge-blue"
      : status === "Требует внимания"
      ? "obj-badge obj-badge-error"
      : "obj-badge obj-badge-gray";
  return <span className={cls}>{status}</span>;
}

/* ─── Structure Table ─── */
function StructureTable() {
  return (
    <div className="obj-card obj-table-card">
      {/* Header */}
      <div className="obj-table-header">
        <h3 className="obj-table-title">Структура объектов</h3>
        <div className="obj-table-header-actions">
          <button className="obj-icon-btn" type="button">
            <ExpandAltOutlined />
          </button>
          <button className="obj-icon-btn" type="button">
            <ReloadOutlined />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="obj-table-scroll">
        <table className="obj-table">
          <thead>
            <tr className="obj-thead-row">
              <th className="obj-th obj-th-first">Структура</th>
              <th className="obj-th">Тип</th>
              <th className="obj-th">Помещения</th>
              <th className="obj-th">Позиции</th>
              <th className="obj-th">Прогресс</th>
              <th className="obj-th">Расхождения</th>
              <th className="obj-th">Статус</th>
              <th className="obj-th">Синхронизация</th>
              <th className="obj-th obj-th-last">Действие</th>
            </tr>
          </thead>
          <tbody>
            {/* Row 1 — Корпус А (level 0, active) */}
            <tr className="obj-tr obj-tr-active">
              <td className="obj-td obj-td-first obj-cell-l0-primary">
                <span className="obj-tree-cell">
                  <DownOutlined className="obj-tree-arrow" />
                  <BankOutlined className="obj-tree-icon obj-tree-icon-primary" />
                  <span className="obj-tree-name obj-tree-name-primary">Корпус А</span>
                </span>
              </td>
              <td className="obj-td obj-td-type">Объект</td>
              <td className="obj-td">58</td>
              <td className="obj-td">340</td>
              <td className="obj-td"><ProgressBar pct={72} /></td>
              <td className="obj-td obj-td-error-bold">10</td>
              <td className="obj-td"><StatusBadge status="В работе" /></td>
              <td className="obj-td obj-td-sync">Синхронизировано</td>
              <td className="obj-td obj-td-action">
                <button className="obj-more-btn" type="button"><MoreOutlined /></button>
              </td>
            </tr>

            {/* Row 2 — 2 этаж (level 1) */}
            <tr className="obj-tr obj-tr-default">
              <td className="obj-td obj-td-first obj-cell-l1">
                <span className="obj-tree-cell">
                  <DownOutlined className="obj-tree-arrow" />
                  <AppstoreOutlined className="obj-tree-icon obj-tree-icon-muted" />
                  <span className="obj-tree-name">2 этаж</span>
                </span>
              </td>
              <td className="obj-td obj-td-type">Этаж</td>
              <td className="obj-td">24</td>
              <td className="obj-td">128</td>
              <td className="obj-td"><ProgressBar pct={75} /></td>
              <td className="obj-td obj-td-error-bold">5</td>
              <td className="obj-td"><StatusBadge status="В работе" /></td>
              <td className="obj-td obj-td-sync obj-td-orange">12 в очереди</td>
              <td className="obj-td obj-td-action">
                <button className="obj-more-btn" type="button"><MoreOutlined /></button>
              </td>
            </tr>

            {/* Row 3 — 2.01.29 Кабинет врача (level 2) */}
            <tr className="obj-tr obj-tr-room">
              <td className="obj-td obj-td-first obj-cell-l2">
                <span className="obj-tree-cell">
                  <MinusOutlined className="obj-tree-arrow obj-tree-arrow-dim" />
                  <HomeOutlined className="obj-tree-icon obj-tree-icon-muted" />
                  <span className="obj-tree-name">2.01.29 — Кабинет врача</span>
                </span>
              </td>
              <td className="obj-td obj-td-type">Помещение</td>
              <td className="obj-td obj-td-dim">—</td>
              <td className="obj-td">8</td>
              <td className="obj-td"><ProgressBar pct={38} /></td>
              <td className="obj-td obj-td-error-bold">1</td>
              <td className="obj-td"><StatusBadge status="Требует внимания" /></td>
              <td className="obj-td obj-td-sync obj-td-sync-error">2 конфликта</td>
              <td className="obj-td obj-td-action">
                <button className="obj-more-btn" type="button"><MoreOutlined /></button>
              </td>
            </tr>

            {/* Row 4 — Корпус Б (level 0, collapsed) */}
            <tr className="obj-tr obj-tr-default">
              <td className="obj-td obj-td-first obj-cell-l0">
                <span className="obj-tree-cell">
                  <RightOutlined className="obj-tree-arrow" />
                  <BankOutlined className="obj-tree-icon obj-tree-icon-muted" />
                  <span className="obj-tree-name">Корпус Б</span>
                </span>
              </td>
              <td className="obj-td obj-td-type">Объект</td>
              <td className="obj-td">24</td>
              <td className="obj-td">96</td>
              <td className="obj-td"><ProgressBar pct={0} /></td>
              <td className="obj-td obj-td-zero">0</td>
              <td className="obj-td"><StatusBadge status="Не начато" /></td>
              <td className="obj-td obj-td-sync obj-td-dim">—</td>
              <td className="obj-td obj-td-action">
                <button className="obj-more-btn" type="button"><MoreOutlined /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Detail Panel ─── */
function DetailPanel() {
  return (
    <div className="obj-card obj-detail-card">
      {/* Header */}
      <div className="obj-detail-header">
        <div className="obj-detail-header-top">
          <div>
            <p className="obj-detail-sup">Детали объекта</p>
            <h3 className="obj-detail-title">Корпус А</h3>
          </div>
          <button className="obj-close-btn" type="button">
            <CloseOutlined />
          </button>
        </div>
        <div className="obj-detail-metrics">
          <div className="obj-detail-metric obj-detail-metric-primary">
            <p className="obj-detail-metric-label obj-detail-metric-label-primary">Прогресс</p>
            <p className="obj-detail-metric-value obj-detail-metric-value-primary">72.4%</p>
          </div>
          <div className="obj-detail-metric obj-detail-metric-error">
            <p className="obj-detail-metric-label obj-detail-metric-label-error">Расхождения</p>
            <p className="obj-detail-metric-value obj-detail-metric-value-error">10</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="obj-detail-body">
        <div className="obj-detail-fields">
          <div className="obj-detail-field">
            <p className="obj-field-label">Тип</p>
            <p className="obj-field-value">Медицинский центр</p>
          </div>
          <div className="obj-detail-field">
            <p className="obj-field-label">Этажность</p>
            <p className="obj-field-value">8 этажей</p>
          </div>
          <div className="obj-detail-field">
            <p className="obj-field-label">Оборудование</p>
            <p className="obj-field-value">340 единиц</p>
          </div>
          <div className="obj-detail-field">
            <p className="obj-field-label">Синхронизация</p>
            <p className="obj-field-value obj-field-value-primary">Сегодня, 09:42</p>
          </div>
        </div>

        <div className="obj-divider" />

        {/* Active Inspection */}
        <div>
          <div className="obj-inspection-header">
            <p className="obj-detail-sup">Активная инспекция</p>
            <span className="obj-badge-green">В процессе</span>
          </div>
          <div className="obj-inspection-card">
            <div className="obj-inspection-top">
              <div className="obj-inspection-icon">
                <CheckSquareOutlined />
              </div>
              <div>
                <p className="obj-inspection-id">#INS-2024-001</p>
                <p className="obj-inspection-sub">2 этаж • Приемное отделение</p>
              </div>
            </div>
            <div className="obj-inspection-progress">
              <div className="obj-inspection-progress-row">
                <span className="obj-inspection-actor">Иван Иванов</span>
                <span className="obj-inspection-pct">38%</span>
              </div>
              <div className="obj-progress-track obj-progress-track-lg">
                <div className="obj-progress-fill" style={{ width: "38%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Context Actions */}
        <div className="obj-context-actions">
          <button className="obj-btn-primary obj-btn-full" type="button">
            <ApartmentOutlined /> Открыть структуру
          </button>
          <div className="obj-context-grid">
            <button className="obj-btn-secondary obj-btn-sm-upper" type="button">Создать инспекцию</button>
            <button className="obj-btn-secondary obj-btn-sm-upper" type="button">Экспорт объекта</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Attention Panel ─── */
function AttentionPanel() {
  return (
    <div className="obj-card obj-attention-card">
      <div className="obj-attention-header">
        <WarningOutlined className="obj-attention-icon" />
        <h4 className="obj-attention-title">Требуют внимания</h4>
      </div>
      <ul className="obj-attention-list">
        <li className="obj-attention-item">
          <div className="obj-dot obj-dot-error" />
          <p className="obj-attention-text">
            10 расхождений в <strong className="obj-attention-strong">Корпус А</strong>
          </p>
        </li>
        <li className="obj-attention-item">
          <div className="obj-dot obj-dot-amber" />
          <p className="obj-attention-text">
            2 конфликта синхронизации в <strong className="obj-attention-strong">Склад временного хранения</strong>
          </p>
        </li>
        <li className="obj-attention-item">
          <div className="obj-dot obj-dot-outline" />
          <p className="obj-attention-text">6 помещений не начато</p>
        </li>
        <li className="obj-attention-item">
          <div className="obj-dot obj-dot-primary" />
          <p className="obj-attention-text">12 изменений ожидают отправки</p>
        </li>
      </ul>
    </div>
  );
}

/* ─── Recent Activity ─── */
function ActivityPanel() {
  return (
    <div className="obj-card obj-activity-card">
      <div className="obj-activity-header">
        <HistoryOutlined className="obj-activity-icon" />
        <h4 className="obj-activity-title">Последние действия</h4>
      </div>
      <div className="obj-activity-item">
        <div className="obj-activity-avatar">
          <SyncOutlined className="obj-activity-avatar-icon" />
        </div>
        <div>
          <p className="obj-activity-actor">Иван Иванов</p>
          <p className="obj-activity-action">Синхронизировал Корпус А</p>
          <p className="obj-activity-time">Сегодня, 09:42</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Screen ─── */
export function DesktopObjectsScreen() {
  return (
    <div className="obj-screen">
      <div className="obj-main-grid">
        {/* Center column — 8/12 */}
        <div className="obj-center-col">
          {/* Action Bar */}
          <div className="obj-action-bar">
            <div className="obj-action-group">
              <button className="obj-btn-primary obj-btn-action" type="button">
                <ApartmentOutlined /> Открыть структуру
              </button>
              <button className="obj-btn-secondary obj-btn-action" type="button">
                <PlusCircleOutlined /> Создать инспекцию
              </button>
              <button className="obj-btn-secondary obj-btn-action" type="button">
                <DownloadOutlined /> Экспорт структуры
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="obj-kpi-grid">
            <div className="obj-kpi-card">
              <p className="obj-kpi-label">Объектов</p>
              <div className="obj-kpi-row">
                <span className="obj-kpi-value">3</span>
                <span className="obj-kpi-badge-green">активные</span>
              </div>
            </div>
            <div className="obj-kpi-card">
              <p className="obj-kpi-label">Этажей</p>
              <span className="obj-kpi-value">18</span>
            </div>
            <div className="obj-kpi-card">
              <p className="obj-kpi-label">Помещений</p>
              <span className="obj-kpi-value">74</span>
            </div>
            <div className="obj-kpi-card obj-kpi-card-error">
              <p className="obj-kpi-label obj-kpi-label-error">Расхождения</p>
              <div className="obj-kpi-row">
                <span className="obj-kpi-value obj-kpi-value-error">10</span>
                <span className="obj-kpi-error-badge">внимание</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="obj-filters-card">
            <div className="obj-filters-selects">
              <select className="obj-select">
                <option>Объект (Все)</option>
                <option>Корпус А</option>
                <option>Корпус Б</option>
              </select>
              <select className="obj-select">
                <option>Этаж (Все)</option>
                <option>1 этаж</option>
                <option>2 этаж</option>
              </select>
              <select className="obj-select">
                <option>Статус (Любой)</option>
                <option>В работе</option>
                <option>Завершено</option>
              </select>
            </div>
            <div className="obj-quick-filters">
              <span className="obj-chip obj-chip-active">Все</span>
              <span className="obj-chip obj-chip-default">В работе</span>
              <span className="obj-chip obj-chip-default">Не начато</span>
              <span className="obj-chip obj-chip-default">Завершено</span>
              <span className="obj-chip obj-chip-error">С расхождениями</span>
            </div>
          </div>

          {/* Structure Table */}
          <StructureTable />
        </div>

        {/* Right column — 4/12 */}
        <div className="obj-right-col">
          <DetailPanel />
          <AttentionPanel />
          <ActivityPanel />
        </div>
      </div>
    </div>
  );
}
