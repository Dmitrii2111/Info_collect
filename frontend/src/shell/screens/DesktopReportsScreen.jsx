import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileTextOutlined,
  UnorderedListOutlined,
  SyncOutlined,
  SafetyOutlined,
  PlusOutlined,
  ReloadOutlined,
  ScheduleOutlined,
  SearchOutlined,
  MoreOutlined,
  LeftOutlined,
  RightOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  RedoOutlined,
  InboxOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { DesktopModalShell } from "../components/DesktopModalShell";
import {
  REPORT_HISTORY_ROWS,
  REPORT_KPI_CARDS,
  REPORT_SCHEDULED,
  REPORT_TEMPLATES,
  REPORT_TYPES,
} from "../data/reportsScreenData";
import "../styles/reportsScreen.css";
import "../styles/desktopScreenCommon.css";

const ICONS = {
  file: FileTextOutlined,
  list: UnorderedListOutlined,
  sync: SyncOutlined,
  safety: SafetyOutlined,
  clock: ClockCircleOutlined,
  inbox: InboxOutlined,
};

const DEFAULT_FILTERS = {
  search: "",
  type: "Все",
  author: "Все",
  status: "Все",
};

const PAGE_SIZE = 4;

function getUniqueValues(rows, key) {
  return [...new Set(rows.map((row) => row[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ru"));
}

function filterRows(rows, filters, keys = ["type", "author", "status"]) {
  const query = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    const matchesSearch = !query || [row.name, row.object, row.inspection, row.id].filter(Boolean).some((val) => val.toLowerCase().includes(query));
    return matchesSearch && keys.every((key) => filters[key] === "Все" || row[key] === filters[key]);
  });
}

function buildOptions(rows, filters, key) {
  const order = ["type", "author", "status"];
  const currentIndex = order.indexOf(key);
  const upstreamKeys = currentIndex > -1 ? order.slice(0, currentIndex) : [];
  return ["Все", ...getUniqueValues(filterRows(rows, filters, upstreamKeys), key)];
}

function KpiCard({ label, value, tone }) {
  return (
    <div className={`rp-kpi-card rp-kpi-${tone}`}>
      <span className="rp-kpi-label">{label}</span>
      <span className="rp-kpi-value">{value}</span>
    </div>
  );
}

function ReportTypeCard({ icon, iconTone, badge, badgeTone, title, desc, onCreate }) {
  const Icon = ICONS[icon] ?? FileTextOutlined;
  return (
    <div className="rp-type-card">
      <div className="rp-type-card-header">
        <div className={`rp-type-icon rp-icon-${iconTone}`}>
          <Icon />
        </div>
        <span className={`rp-format-badge rp-badge-${badgeTone}`}>{badge}</span>
      </div>
      <h4 className="rp-type-title">{title}</h4>
      <p className="rp-type-desc">{desc}</p>
      <button className="rp-type-btn" type="button" onClick={() => onCreate(title)}>Создать отчёт</button>
    </div>
  );
}

function ScheduledItem({ icon, tone, title, frequency }) {
  const Icon = ICONS[icon] ?? ScheduleOutlined;
  return (
    <div className="rp-scheduled-item">
      <span className={`rp-sched-icon rp-sched-${tone}`}><Icon /></span>
      <div>
        <p className="rp-sched-title">{title}</p>
        <p className="rp-sched-sub">{frequency}</p>
      </div>
    </div>
  );
}

function StatusPill({ status, tone }) {
  return (
    <span className={`rp-status-pill rp-status-${tone}`}>
      <span className="rp-status-dot" />
      {status}
    </span>
  );
}

function FormatBadge({ format, tone }) {
  return <span className={`rp-format-badge rp-badge-${tone}`}>{format}</span>;
}

function ReportOperationModal({ operation, report, onClose, onSuccess }) {
  const timerRef = useRef(null);
  const [phase, setPhase] = useState("loading");

  const copy = {
    generate: {
      title: "Формирование отчёта",
      loading: "Формируем отчёт",
      success: "Отчёт сформирован",
      error: "Ошибка формирования",
      action: "Сформировать повторно",
    },
    export: {
      title: "Экспорт отчёта",
      loading: "Готовим файл",
      success: "Экспорт готов",
      error: "Ошибка экспорта",
      action: "Повторить экспорт",
    },
    delete: {
      title: "Удаление отчёта",
      loading: "Удаляем отчёт",
      success: "Отчёт удалён",
      error: "Ошибка удаления",
      action: "Повторить удаление",
    },
    refresh: {
      title: "Обновление отчётов",
      loading: "Обновляем отчёты",
      success: "Отчёты обновлены",
      error: "Ошибка обновления",
      action: "Повторить обновление",
    },
  }[operation.kind];

  const startLoading = () => {
    window.clearTimeout(timerRef.current);
    setPhase("loading");
    timerRef.current = window.setTimeout(() => {
      const nextPhase = operation.forceError ? "error" : "success";
      setPhase(nextPhase);
      if (nextPhase === "success") {
        onSuccess?.(operation.kind);
      }
    }, 3000);
  };

  useEffect(() => {
    startLoading();
    return () => window.clearTimeout(timerRef.current);
  }, [operation.forceError, operation.kind]);

  return (
    <DesktopModalShell
      title={copy.title}
      subtitle={report ? `${report.name} · ${report.id}` : "Новый отчёт"}
      size="narrow"
      onClose={onClose}
      closeDisabled={phase === "loading"}
      footer={(
        <>
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose} disabled={phase === "loading"}>
            {phase === "success" ? "Закрыть" : "Отмена"}
          </button>
          {phase === "error" ? (
            <button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={startLoading}>
              <RedoOutlined /> {copy.action}
            </button>
          ) : null}
        </>
      )}
    >
      {phase === "loading" ? (
        <div className="reg-loading-card reg-loading-card-full">
          <LoadingOutlined aria-hidden="true" />
          <div>
            <strong>{copy.loading}</strong>
            <span>{operation.kind === "refresh" ? "Проверяем актуальные статусы" : "Mock operation, backend/API не вызывается."}</span>
          </div>
        </div>
      ) : phase === "success" ? (
        <div className="reg-success-card reg-success-card-full">
          <CheckCircleOutlined aria-hidden="true" />
          <div>
            <strong>{copy.success}</strong>
            <span>Состояние показано локально на frontend.</span>
          </div>
        </div>
      ) : (
        <div className="rp-modal-error-state">
          <ExclamationCircleOutlined />
          <div>
            <strong>{copy.error}</strong>
            <span>Симулирована ошибка формирования из design/state сценария.</span>
          </div>
        </div>
      )}
    </DesktopModalShell>
  );
}

function ReportsTemplatesModal({ onClose, onRunOperation, onCreateReport }) {
  const [selectedId, setSelectedId] = useState(REPORT_TEMPLATES[0]?.id ?? null);
  const selected = REPORT_TEMPLATES.find((item) => item.id === selectedId);

  return (
    <DesktopModalShell
      title="Шаблоны отчётов"
      subtitle="Выбор, редактирование и создание отчёта на основе шаблона"
      size="wide"
      onClose={onClose}
      footer={<button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose}>Закрыть</button>}
    >
      <div className="rp-modal-list">
        {REPORT_TEMPLATES.map((template) => (
          <button
            key={template.id}
            className={`rp-modal-row${template.id === selectedId ? " is-selected" : ""}`}
            type="button"
            onClick={() => setSelectedId(template.id)}
          >
            <span>
              <strong>{template.name}</strong>
              <small>{template.type} · {template.period}</small>
            </span>
            <span>{template.author}</span>
            <StatusPill status={template.status} tone={template.status === "Активен" ? "success" : "warning"} />
          </button>
        ))}
      </div>
      <div className="rp-modal-actions">
        <button className="rp-btn-secondary" type="button" onClick={() => onRunOperation("templateSave", selected)}>
          <CheckCircleOutlined /> Выбрать шаблон
        </button>
        <button className="rp-btn-secondary" type="button" onClick={() => onRunOperation("templateSave", selected)}>
          <EditOutlined /> Редактировать
        </button>
        <button className="rp-btn-secondary" type="button" onClick={() => onRunOperation("templateDelete", selected)}>
          <DeleteOutlined /> Удалить
        </button>
        <button className="rp-btn-primary" type="button" onClick={() => onCreateReport(selected)}>
          <CopyOutlined /> Создать на основе
        </button>
      </div>
    </DesktopModalShell>
  );
}

function ReportsScheduleModal({ onClose, onRunOperation }) {
  const [selectedId, setSelectedId] = useState(REPORT_SCHEDULED[0]?.id ?? null);
  const selected = REPORT_SCHEDULED.find((item) => item.id === selectedId);

  return (
    <DesktopModalShell
      title="Расписание отчётов"
      subtitle="Плановые отчёты, получатели и следующий запуск"
      size="wide"
      onClose={onClose}
      footer={<button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose}>Закрыть</button>}
    >
      <div className="rp-schedule-modal-grid">
        <div className="rp-modal-list">
          {REPORT_SCHEDULED.map((item) => (
            <button
              key={item.id}
              className={`rp-modal-row${item.id === selectedId ? " is-selected" : ""}`}
              type="button"
              onClick={() => setSelectedId(item.id)}
            >
              <span>
                <strong>{item.title}</strong>
                <small>{item.frequency} · {item.nextRun}</small>
              </span>
              <span>{item.recipients}</span>
              <StatusPill status={item.status} tone={item.status === "Активно" ? "success" : "warning"} />
            </button>
          ))}
        </div>
        <div className="rp-schedule-form">
          <label className="rp-field">
            <span className="rp-field-label">Отчёт</span>
            <select className="rp-select" defaultValue={selected?.report}>
              {REPORT_TYPES.map((type) => <option key={type.title}>{type.title}</option>)}
            </select>
          </label>
          <label className="rp-field">
            <span className="rp-field-label">Периодичность</span>
            <select className="rp-select" defaultValue={selected?.frequency}>
              <option>Ежедневно, 08:00</option>
              <option>Пн, Ср, Пт, 22:00</option>
              <option>1-е число месяца</option>
            </select>
          </label>
          <label className="rp-field">
            <span className="rp-field-label">Получатели</span>
            <input className="rp-search-input rp-schedule-input" defaultValue={selected?.recipients} />
          </label>
        </div>
      </div>
      <div className="rp-modal-actions">
        <button className="rp-btn-secondary" type="button" onClick={() => onRunOperation("scheduleSave", selected)}>
          <PlusOutlined /> Создать расписание
        </button>
        <button className="rp-btn-secondary" type="button" onClick={() => onRunOperation("scheduleSave", selected)}>
          <EditOutlined /> Изменить
        </button>
        <button className="rp-btn-secondary" type="button" onClick={() => onRunOperation("scheduleSave", selected)}>
          <ScheduleOutlined /> Отключить
        </button>
        <button className="rp-btn-primary" type="button" onClick={() => onRunOperation("scheduleDelete", selected)}>
          <DeleteOutlined /> Удалить
        </button>
      </div>
    </DesktopModalShell>
  );
}

function ReportPreviewModal({ report, onClose }) {
  return (
    <DesktopModalShell
      title="Предпросмотр отчёта"
      subtitle={`${report.name} · ${report.format}`}
      size="narrow"
      onClose={onClose}
      footer={<button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose}>Закрыть</button>}
    >
      <div className="rp-preview-modal">
        <FilePdfOutlined />
        <strong>{report.name}</strong>
        <span>{report.type} · {report.object}</span>
      </div>
    </DesktopModalShell>
  );
}

function SaveStateModal({ title, entity, onClose }) {
  const timerRef = useRef(null);
  const [phase, setPhase] = useState("loading");

  useEffect(() => {
    timerRef.current = window.setTimeout(() => setPhase("success"), 3000);
    return () => window.clearTimeout(timerRef.current);
  }, []);

  return (
    <DesktopModalShell
      title={title}
      subtitle={entity?.name ?? entity?.title ?? "Mock state"}
      size="narrow"
      onClose={onClose}
      closeDisabled={phase === "loading"}
      footer={<button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose} disabled={phase === "loading"}>Закрыть</button>}
    >
      {phase === "loading" ? (
        <div className="reg-loading-card reg-loading-card-full">
          <LoadingOutlined aria-hidden="true" />
          <div>
            <strong>Сохраняем изменения</strong>
            <span>Подготовка отчета занимает несколько секунд.</span>
          </div>
        </div>
      ) : (
        <div className="reg-success-card reg-success-card-full">
          <CheckCircleOutlined aria-hidden="true" />
          <div>
            <strong>Готово</strong>
            <span>Изменения применены к текущему состоянию.</span>
          </div>
        </div>
      )}
    </DesktopModalShell>
  );
}

export function DesktopReportsScreen() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedReportId, setSelectedReportId] = useState(REPORT_HISTORY_ROWS[0].id);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeModal, setActiveModal] = useState(null);
  const [operation, setOperation] = useState(null);
  const [formType, setFormType] = useState(REPORT_TYPES[0].title);
  const [formFormat, setFormFormat] = useState("PDF");
  const [updatedLabel, setUpdatedLabel] = useState("сегодня, 09:42");

  const options = useMemo(() => ({
    type: buildOptions(REPORT_HISTORY_ROWS, filters, "type"),
    author: buildOptions(REPORT_HISTORY_ROWS, filters, "author"),
    status: buildOptions(REPORT_HISTORY_ROWS, filters, "status"),
  }), [filters]);

  useEffect(() => {
    setFilters((prev) => {
      const next = { ...prev };
      let changed = false;
      ["type", "author", "status"].forEach((key) => {
        if (next[key] !== "Все" && !options[key].includes(next[key])) {
          next[key] = "Все";
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [options]);

  const filteredRows = useMemo(() => filterRows(REPORT_HISTORY_ROWS, filters), [filters]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const visibleRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selectedReport = filteredRows.find((row) => row.id === selectedReportId) ?? filteredRows[0] ?? null;

  useEffect(() => {
    if (!selectedReport || selectedReport.id !== selectedReportId) {
      setSelectedReportId(selectedReport?.id ?? null);
    }
  }, [selectedReport, selectedReportId]);

  const updateFilter = (key, value) => {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const startReportOperation = (kind, report = selectedReport, forceError = false) => {
    setOperation({ kind, report, forceError });
    setActiveModal("operation");
  };

  const handleOperationSuccess = (kind) => {
    if (kind !== "refresh") return;

    setUpdatedLabel(`сегодня, ${new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`);
  };

  const startSaveOperation = (kind, entity) => {
    const titles = {
      templateSave: "Сохранение шаблона",
      templateDelete: "Удаление шаблона",
      scheduleSave: "Сохранение расписания",
      scheduleDelete: "Удаление расписания",
    };
    setOperation({ kind, report: entity, title: titles[kind] });
    setActiveModal("saveState");
  };

  const closeModal = () => {
    setActiveModal(null);
    setOperation(null);
  };

  return (
    <div className="desktop-screen rp-screen">
      <div className="rp-header">
        <div>
          <h1 className="rp-header-title">Отчёты</h1>
          <p className="rp-header-sub">Формирование, скачивание и история отчётов по инспекциям</p>
        </div>
        <div className="rp-header-actions">
          <span className="rp-updated-label">Обновлено: {updatedLabel}</span>
          <button className="rp-btn-secondary" type="button" onClick={() => startReportOperation("refresh", null)}>
            <ReloadOutlined /> Обновить
          </button>
          <button className="rp-btn-secondary" type="button" onClick={() => setActiveModal("templates")}>
            <FileTextOutlined /> Шаблоны отчётов
          </button>
          <button className="rp-btn-primary" type="button" onClick={() => startReportOperation("generate", null)}>
            <PlusOutlined /> Сформировать отчёт
          </button>
        </div>
      </div>

      <div className="rp-kpi-grid">
        {REPORT_KPI_CARDS.map((card) => <KpiCard key={card.label} {...card} />)}
      </div>

      <h3 className="rp-section-title">Типы отчётов</h3>
      <div className="rp-top-grid">
        <div className="rp-top-left">
          <div className="rp-types-grid">
            {REPORT_TYPES.map((type) => (
              <ReportTypeCard key={type.title} {...type} onCreate={(title) => { setFormType(title); startReportOperation("generate", null); }} />
            ))}
          </div>

          <div className="rp-scheduled-block">
            <div className="rp-scheduled-header">
              <div className="rp-scheduled-header-left">
                <ScheduleOutlined className="rp-sched-heading-icon" />
                <h4 className="rp-scheduled-title">Запланированные отчёты</h4>
              </div>
              <button className="rp-link-btn" type="button" onClick={() => setActiveModal("schedule")}>Управление расписанием</button>
            </div>
            <div className="rp-scheduled-grid">
              {REPORT_SCHEDULED.map((item) => <ScheduledItem key={item.id} {...item} />)}
            </div>
          </div>
        </div>

        <div className="rp-top-right">
          <div className="rp-form-panel">
            <h3 className="rp-form-title">
              <FilePdfOutlined className="rp-form-title-icon" />
              Новый отчёт
            </h3>
            <div className="rp-form-fields">
              <div className="rp-field">
                <label className="rp-field-label">Тип отчёта</label>
                <select className="rp-select" value={formType} onChange={(event) => setFormType(event.target.value)}>
                  {REPORT_TYPES.map((type) => <option key={type.title}>{type.title}</option>)}
                </select>
              </div>
              <div className="rp-field-row">
                <div className="rp-field">
                  <label className="rp-field-label">Инспекция</label>
                  <select className="rp-select" defaultValue="#INS-2024-042">
                    <option>#INS-2024-042</option>
                    <option>#INS-2024-001</option>
                  </select>
                </div>
                <div className="rp-field">
                  <label className="rp-field-label">Объект</label>
                  <select className="rp-select" defaultValue="Цех №5">
                    <option>Цех №5</option>
                    <option>Корпус А</option>
                    <option>Склад Центр</option>
                  </select>
                </div>
              </div>
              <div className="rp-field-row">
                <div className="rp-field">
                  <label className="rp-field-label">Период</label>
                  <select className="rp-select" defaultValue="Сегодня">
                    <option>Сегодня</option>
                    <option>Последние 7 дней</option>
                    <option>За месяц</option>
                  </select>
                </div>
                <div className="rp-field">
                  <label className="rp-field-label">Формат</label>
                  <div className="rp-format-btns">
                    {["PDF", "XLS", "CSV"].map((format) => (
                      <button key={format} className={`rp-format-btn${formFormat === format ? " is-active" : ""}`} type="button" onClick={() => setFormFormat(format)}>
                        {format}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="rp-checkboxes">
                <label className="rp-checkbox-row"><input className="rp-checkbox" defaultChecked type="checkbox" /><span>Включить фотофиксацию</span></label>
                <label className="rp-checkbox-row"><input className="rp-checkbox" type="checkbox" /><span>История изменений</span></label>
                <label className="rp-checkbox-row"><input className="rp-checkbox" type="checkbox" /><span>Список расхождений</span></label>
              </div>
              <div className="rp-form-actions">
                <button className="rp-form-reset" type="button" onClick={() => { setFormType(REPORT_TYPES[0].title); setFormFormat("PDF"); }}>Сбросить</button>
                <button className="rp-form-submit" type="button" onClick={() => startReportOperation("generate", null, formType === "Журнал синхронизации")}>Сформировать</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rp-filter-panel">
        <div className="rp-search-wrap">
          <SearchOutlined className="rp-search-icon" />
          <input className="rp-search-input" placeholder="Поиск по названию или объекту..." type="text" value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} />
        </div>
        <select className="rp-filter-select" value={filters.type} onChange={(event) => updateFilter("type", event.target.value)}>
          {options.type.map((value) => <option key={value} value={value}>Тип: {value}</option>)}
        </select>
        <select className="rp-filter-select" value={filters.author} onChange={(event) => updateFilter("author", event.target.value)}>
          {options.author.map((value) => <option key={value} value={value}>Автор: {value}</option>)}
        </select>
        <div className="rp-filter-pills">
          {options.status.map((status) => (
            <button key={status} className={`rp-filter-pill${filters.status === status ? " is-active" : ""}`} type="button" onClick={() => updateFilter("status", status)}>
              {status === "Все" ? "Все" : status}
            </button>
          ))}
        </div>
      </div>

      <div className="rp-bottom-split">
        <div className="rp-table-card">
          <div className="rp-table-header">
            <h3 className="rp-table-title">История отчётов</h3>
          </div>
          <div className="rp-table-wrap">
            <table className="rp-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Название</th>
                  <th>Тип</th>
                  <th>Объект / инспекция</th>
                  <th className="rp-th-center">Формат</th>
                  <th className="rp-th-center">Статус</th>
                  <th>Автор</th>
                  <th className="rp-th-right">Действие</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length ? visibleRows.map((row) => (
                  <tr key={row.id} className={`${row.rowTone === "error" ? "rp-row-error" : ""}${selectedReport?.id === row.id ? " rp-row-selected" : ""}`} onClick={() => setSelectedReportId(row.id)}>
                    <td className="rp-td-date">{row.date}</td>
                    <td className="rp-td-name">{row.name}</td>
                    <td className="rp-td-muted">{row.type}</td>
                    <td>
                      <p className="rp-td-obj">{row.object}</p>
                      {row.inspection && <p className="rp-td-ins">{row.inspection}</p>}
                    </td>
                    <td className="rp-td-center"><FormatBadge format={row.format} tone={row.formatTone} /></td>
                    <td className="rp-td-center"><StatusPill status={row.status} tone={row.statusTone} /></td>
                    <td className="rp-td-muted">{row.author}</td>
                    <td className="rp-td-right">
                      <button className="rp-more-btn" type="button" onClick={(event) => { event.stopPropagation(); startReportOperation(row.status === "Ошибка" ? "generate" : "export", row, row.status === "Ошибка"); }}>
                        <MoreOutlined />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td className="rp-empty-cell" colSpan={8}>Отчёты по выбранным фильтрам не найдены</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="rp-table-footer">
            <span className="rp-table-count">Показано {visibleRows.length} из {filteredRows.length} отчётов</span>
            <div className="rp-pagination">
              <button className="rp-page-btn" type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}><LeftOutlined /></button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button key={page} className={`rp-page-btn${currentPage === page ? " is-active" : ""}`} type="button" onClick={() => setCurrentPage(page)}>{page}</button>
              ))}
              <button className="rp-page-btn" type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}><RightOutlined /></button>
            </div>
          </div>
        </div>

        <div className="rp-details-panel">
          <div className="rp-details-header">
            <div>
              <h3 className="rp-details-title">Детали отчёта</h3>
              <p className="rp-details-sub">Просмотр и экспорт</p>
            </div>
            {selectedReport ? <span className="rp-details-id">ID: {selectedReport.id.replace("RPT-", "")}</span> : null}
          </div>
          {selectedReport ? (
            <div className="rp-details-body">
              <div className="rp-preview-wrap">
                <div className="rp-preview-box">
                  <FilePdfOutlined className="rp-preview-icon" />
                  {selectedReport.status === "Ошибка" ? <ExclamationCircleOutlined className="rp-preview-error-icon" /> : null}
                </div>
              </div>

              <div className="rp-detail-rows">
                {[
                  ["Тип", selectedReport.type],
                  ["Инспекция", selectedReport.inspection ?? "—"],
                  ["Объект", selectedReport.object],
                  ["Размер", selectedReport.size],
                  ["Создан", selectedReport.date],
                  ["Статус", selectedReport.status],
                ].map(([label, val]) => (
                  <div key={label} className={`rp-detail-row${label === "Статус" && selectedReport.status === "Ошибка" ? " rp-detail-row-error" : ""}`}>
                    <span className="rp-detail-label">{label}</span>
                    <span className={`rp-detail-val${label === "Статус" && selectedReport.status === "Ошибка" ? " rp-detail-val-error" : ""}`}>{val}</span>
                  </div>
                ))}
              </div>

              {selectedReport.status === "Ошибка" ? (
                <div className="rp-error-block">
                  <div className="rp-error-block-header"><ExclamationCircleOutlined /><span>Ошибка формирования</span></div>
                  <p className="rp-error-block-text">{selectedReport.errorText}</p>
                  <button className="rp-retry-btn" type="button" onClick={() => startReportOperation("generate", selectedReport, true)}>
                    <RedoOutlined /> Повторить формирование
                  </button>
                </div>
              ) : null}

              <div className={`rp-std-actions${selectedReport.status === "Ошибка" ? " rp-std-actions-disabled" : ""}`}>
                <button className="rp-download-btn" type="button" disabled={selectedReport.status === "Ошибка"} onClick={() => startReportOperation("export", selectedReport)}>
                  <DownloadOutlined /> Скачать отчёт
                </button>
                <button className="rp-preview-btn" type="button" disabled={selectedReport.status === "Ошибка"} onClick={() => setActiveModal("preview")}>
                  <EyeOutlined /> Открыть предпросмотр
                </button>
              </div>
              <div className="rp-detail-secondary-actions">
                <button className="rp-btn-secondary" type="button" onClick={() => setActiveModal("templates")}>Открыть шаблон</button>
                <button className="rp-btn-secondary" type="button" onClick={() => setActiveModal("schedule")}>Настроить расписание</button>
                <button className="rp-btn-secondary rp-btn-danger" type="button" onClick={() => startReportOperation("delete", selectedReport)}>Удалить</button>
              </div>
            </div>
          ) : (
            <div className="rp-details-empty">Выберите отчёт из истории</div>
          )}
        </div>
      </div>

      {activeModal === "operation" ? <ReportOperationModal operation={operation} report={operation?.report} onClose={closeModal} onSuccess={handleOperationSuccess} /> : null}
      {activeModal === "templates" ? <ReportsTemplatesModal onClose={closeModal} onRunOperation={startSaveOperation} onCreateReport={(template) => startReportOperation("generate", template)} /> : null}
      {activeModal === "schedule" ? <ReportsScheduleModal onClose={closeModal} onRunOperation={startSaveOperation} /> : null}
      {activeModal === "preview" && selectedReport ? <ReportPreviewModal report={selectedReport} onClose={closeModal} /> : null}
      {activeModal === "saveState" ? <SaveStateModal title={operation?.title} entity={operation?.report} onClose={closeModal} /> : null}
    </div>
  );
}
