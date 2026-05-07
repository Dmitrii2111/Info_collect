import {
  DownloadOutlined,
  WarningOutlined,
  SwapRightOutlined,
  LeftOutlined,
  RightOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import "../styles/discrepanciesScreen.css";

/* ── KPI Card ── */
function KpiCard({ label, value, valueTone, sub, subTone }) {
  return (
    <div className="disc-kpi-card">
      <p className="disc-kpi-label">{label}</p>
      <p className={`disc-kpi-value${valueTone ? ` ${valueTone}` : ""}`}>{value}</p>
      <div className={`disc-kpi-sub${subTone ? ` ${subTone}` : ""}`}>{sub}</div>
    </div>
  );
}

/* ── Type pill ── */
function TypePill({ type }) {
  const map = {
    "Конфликт": "disc-pill disc-pill-conflict",
    "Отсутствует": "disc-pill disc-pill-missing",
    "Без серийника": "disc-pill disc-pill-noserial",
    "ПНР": "disc-pill disc-pill-pnr",
    "Коммуникации": "disc-pill disc-pill-comm",
    "Повреждение": "disc-pill disc-pill-damage",
  };
  return <span className={map[type] || "disc-pill disc-pill-missing"}>{type}</span>;
}

/* ── Status pill ── */
function StatusPill({ status }) {
  const map = {
    "Новый": "disc-pill disc-pill-new",
    "В работе": "disc-pill disc-pill-inwork",
    "Разрешено": "disc-pill disc-pill-resolved",
  };
  return <span className={map[status] || "disc-pill disc-pill-new"}>{status}</span>;
}

/* ── Table row ── */
function DiscRow({ row, isSelected }) {
  const btnMap = {
    resolve: <button className="disc-btn-resolve">Решить</button>,
    open: <button className="disc-btn-open">Открыть</button>,
    check: <button className="disc-btn-open">Проверить</button>,
    details: <button className="disc-btn-open">Детали</button>,
    archive: <button className="disc-btn-archive">Архив</button>,
  };

  return (
    <tr className={isSelected ? "is-selected" : ""}>
      <td className="disc-td-time">{row.time}</td>
      <td className="disc-td-ins">{row.inspection}</td>
      <td className="disc-td-room">{row.room}</td>
      <td>
        <span className="disc-td-equip-name">{row.equipName}</span>
        <span className="disc-td-equip-id">{row.equipId}</span>
      </td>
      <td><TypePill type={row.type} /></td>
      <td><StatusPill status={row.status} /></td>
      <td style={{ textAlign: "right" }}>{btnMap[row.action] || btnMap.open}</td>
    </tr>
  );
}

/* ── Detail panel ── */
function DetailPanel({ item }) {
  return (
    <div className="disc-detail-panel">
      <div className="disc-detail-header">
        <div className="disc-detail-header-top">
          <h5>Детали расхождения</h5>
          <button className="disc-detail-close"><CloseOutlined /></button>
        </div>
        <div className="disc-detail-meta">
          <span className="disc-detail-meta-time">{item.time} • {item.inspection}</span>
          <TypePill type={item.type} />
        </div>
      </div>

      <div className="disc-detail-body">
        <div className="disc-detail-fields">
          <div>
            <span className="disc-detail-field-label">Помещение</span>
            <div className="disc-detail-field-val">{item.room}</div>
          </div>
          <div>
            <span className="disc-detail-field-label">Оборудование</span>
            <div className="disc-detail-field-val">{item.equipName}</div>
          </div>
          <div>
            <span className="disc-detail-field-label">Экземпляр</span>
            <div className="disc-detail-field-val">{item.equipId}</div>
          </div>
          <div>
            <span className="disc-detail-field-label">Оператор</span>
            <div className="disc-detail-field-val">{item.operator}</div>
          </div>
        </div>

        <div className="disc-compare-block">
          <div className="disc-compare-row">
            <div className="disc-compare-side">
              <span className="disc-compare-side-label">Ожидалось</span>
              <div className="disc-compare-box">
                <span className="disc-compare-sn">{item.expected}</span>
                <span className="disc-compare-hint">На месте по плану</span>
              </div>
            </div>
            <div className="disc-compare-arrow">
              <SwapRightOutlined />
            </div>
            <div className="disc-compare-side">
              <span className="disc-compare-side-label is-error">Найдено</span>
              <div className="disc-compare-box is-error">
                <span className="disc-compare-sn is-error">{item.found}</span>
                <span className="disc-compare-hint is-error">От оператора</span>
              </div>
            </div>
          </div>

          <div className="disc-comment-block">
            <span className="disc-comment-label">Комментарий оператора</span>
            <p className="disc-comment-text">"{item.comment}"</p>
          </div>
        </div>

        <div className="disc-resolution-field">
          <span className="disc-resolution-label">Комментарий решения</span>
          <textarea
            className="disc-resolution-textarea"
            rows={3}
            placeholder="Обязательно укажите причину выбора данных для разрешения конфликта..."
          />
        </div>
      </div>

      <div className="disc-detail-actions">
        <button className="disc-detail-btn-primary">Принять данные оператора</button>
        <button className="disc-detail-btn-secondary">Оставить плановые данные</button>
        <button className="disc-detail-btn-secondary">Назначить повторную проверку</button>
        <button className="disc-detail-btn-secondary">Открыть карточку оборудования</button>
        <button className="disc-detail-btn-danger">Игнорировать расхождение</button>
      </div>
    </div>
  );
}

/* ── Main screen ── */
const KPI_CARDS = [
  { label: "Всего расхождений", value: "42", sub: "+5 за сегодня" },
  { label: "Конфликты", value: "8", valueTone: "is-error", sub: "Критический статус", subTone: "is-error" },
  { label: "Отсутствует оборудование", value: "12", valueTone: "is-error", sub: "Требует списания?", subTone: "is-error" },
  { label: "Без серийного номера", value: "9", valueTone: "is-orange", sub: "Уточнить в реестре", subTone: "is-orange" },
  { label: "ПНР", value: "5", valueTone: "is-orange", sub: "Пуско-наладка", subTone: "is-orange" },
  { label: "Разрешено", value: "18", valueTone: "is-green", sub: "В архиве", subTone: "is-green" },
];

const FILTERS = [
  { key: "Инспекция", options: ["Все инспекции"] },
  { key: "Объект", options: ["Все объекты"] },
  { key: "Помещение", options: ["Все помещения"] },
  { key: "Оператор", options: ["Все операторы"] },
  { key: "Тип проблемы", options: ["Все типы"] },
  { key: "Статус", options: ["Все статусы"] },
  { key: "Период", options: ["Сегодня"] },
];

const CHIPS = ["Все", "Конфликты", "Отсутствует", "Без серийника", "ПНР", "Новые", "Разрешено"];

const ROWS = [
  {
    time: "09:39",
    inspection: "#INS-2024-001",
    room: "2.01.30 — Кабинет осмотра",
    equipName: "Система клапанная медицинская",
    equipId: "IC-00213",
    type: "Конфликт",
    status: "Новый",
    action: "resolve",
  },
  {
    time: "09:32",
    inspection: "#INS-2024-001",
    room: "2.01.30 — Кабинет осмотра",
    equipName: "Монитор пациента прикроватный",
    equipId: "IC-00215",
    type: "Отсутствует",
    status: "Новый",
    action: "open",
  },
  {
    time: "09:18",
    inspection: "#INS-2024-004",
    room: "3.14.04 — Операционная №2",
    equipName: "Светильник операционный бестеневой",
    equipId: "IC-00301",
    type: "Без серийника",
    status: "В работе",
    action: "check",
  },
  {
    time: "08:55",
    inspection: "#INS-2024-002",
    room: "1.05.12 — Холл 1 этажа",
    equipName: "Информационный терминал сенсорный",
    equipId: "IC-00109",
    type: "ПНР",
    status: "Новый",
    action: "details",
  },
  {
    time: "08:42",
    inspection: "#INS-2024-002",
    room: "4.02.01 — Серверная",
    equipName: "Коммутатор сетевой 48 портов",
    equipId: "IC-00442",
    type: "Коммуникации",
    status: "Новый",
    action: "details",
  },
  {
    time: "08:30",
    inspection: "#INS-2024-005",
    room: "0.01.10 — Склад А",
    equipName: "Холодильник фармацевтический",
    equipId: "IC-00055",
    type: "Повреждение",
    status: "В работе",
    action: "details",
  },
  {
    time: "08:15",
    inspection: "#INS-2024-001",
    room: "2.01.30 — Кабинет осмотра",
    equipName: "Пульсоксиметр портативный",
    equipId: "IC-00219",
    type: "Без серийника",
    status: "Разрешено",
    action: "archive",
  },
];

const SELECTED_DETAIL = {
  time: "09:39",
  inspection: "#INS-2024-001",
  room: "2.01.30 — Кабинет осмотра",
  equipName: "Система клапанная",
  equipId: "IC-00213",
  type: "Конфликт",
  operator: "Иван Иванов",
  expected: "SN-90831",
  found: "SN-90381",
  comment: "Серийный номер на корпусе отличается от указанного в плане. Проверил дважды.",
};

export function DesktopDiscrepanciesScreen() {
  return (
    <div className="desktop-screen" style={{ display: "grid", gap: "20px" }}>
      {/* Page header */}
      <div className="disc-page-header">
        <div className="disc-page-header-left">
          <h3>Расхождения</h3>
          <p>Проблемы, конфликты и расхождения, найденные во время инспекций</p>
        </div>
        <button className="disc-btn-export">
          <DownloadOutlined /> Экспорт отчёта
        </button>
      </div>

      {/* Alert */}
      <div className="disc-alert">
        <div className="disc-alert-left">
          <div className="disc-alert-icon">
            <WarningOutlined />
          </div>
          <div>
            <p className="disc-alert-title">Есть неразрешенные конфликты</p>
            <p className="disc-alert-sub">
              Завершение связанных инспекций невозможно, пока конфликты не будут обработаны.
            </p>
          </div>
        </div>
        <button className="disc-btn-alert">Показать конфликты</button>
      </div>

      {/* KPI row */}
      <div className="disc-kpi-grid">
        {KPI_CARDS.map((c) => (
          <KpiCard key={c.label} {...c} />
        ))}
      </div>

      {/* Filters */}
      <div className="disc-filter-card">
        <div className="disc-filter-grid">
          {FILTERS.map((f) => (
            <div key={f.key} className="disc-filter-field">
              <span className="disc-filter-field-label">{f.key}</span>
              <select>
                {f.options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="disc-filter-bottom">
          <div className="disc-chip-row">
            {CHIPS.map((c) => (
              <button key={c} className={`disc-chip${c === "Конфликты" ? " is-active" : ""}`}>
                {c}
              </button>
            ))}
          </div>
          <button className="disc-reset-btn">Сбросить фильтры</button>
        </div>
      </div>

      {/* Split: table + detail panel */}
      <div className="disc-split">
        {/* Table */}
        <div className="disc-table-card">
          <div className="disc-table-header">
            <h5>Список расхождений</h5>
            <span>Показано 7 из 42 записей</span>
          </div>

          <div className="disc-table-scroll">
            <table className="disc-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Время</th>
                  <th style={{ width: 130 }}>Инспекция</th>
                  <th style={{ width: 180 }}>Помещение</th>
                  <th>Оборудование</th>
                  <th style={{ width: 130 }}>Тип</th>
                  <th style={{ width: 100 }}>Статус</th>
                  <th style={{ width: 100, textAlign: "right" }}>Действие</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, i) => (
                  <DiscRow key={i} row={row} isSelected={i === 0} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="disc-table-footer">
            <span>Показано 7 из 42 записей</span>
            <div className="disc-pagination">
              <button className="disc-page-btn"><LeftOutlined style={{ fontSize: 10 }} /></button>
              <button className="disc-page-btn is-active">1</button>
              <button className="disc-page-btn">2</button>
              <button className="disc-page-btn">3</button>
              <span className="disc-page-dots">...</span>
              <button className="disc-page-btn"><RightOutlined style={{ fontSize: 10 }} /></button>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <DetailPanel item={SELECTED_DETAIL} />
      </div>
    </div>
  );
}
