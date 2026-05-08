import { useEffect, useMemo, useRef, useState } from "react";
import {
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  HistoryOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  CloseOutlined,
  CheckOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { DesktopModalShell } from "../components/DesktopModalShell.jsx";
import { receiptHistoryRows, receiptRows } from "../data/receiptsScreenData.js";
import "../styles/receiptsScreen.css";
import "../styles/desktopScreenCommon.css";

const EMPTY_FILTERS = {
  period: "Текущий месяц",
  supplier: "Все поставщики",
  warehouse: "Все склады",
  status: "Все статусы",
  batch: "",
  chip: "Все",
};

const ATTENTION_ITEMS = [
  {
    key: "rejected",
    text: "1 поступление отклонено",
    chip: "Отклонено",
    icon: <CloseOutlined />,
    cls: "rcp-attn-red",
    btnCls: "rcp-attn-btn-red",
  },
  {
    key: "disputed",
    text: "1 спорная партия",
    chip: "Спорные",
    icon: <QuestionCircleOutlined />,
    cls: "rcp-attn-purple",
    btnCls: "rcp-attn-btn-purple",
  },
  {
    key: "unsynced",
    text: "3 партии не синхронизированы",
    chip: "Не синхронизировано",
    icon: <SyncOutlined />,
    cls: "rcp-attn-amber",
    btnCls: "rcp-attn-btn-amber",
  },
];

function getStatusClass(status) {
  if (status === "Подтверждено") return "rcp-pill-green";
  if (status === "Отклонено") return "rcp-pill-red";
  if (status === "Спорная") return "rcp-pill-purple";
  return "rcp-pill-amber";
}

function getReceiptIssue(receipt) {
  if (!receipt) return null;
  if (receipt.status === "Отклонено") {
    return {
      title: "Причина",
      text: receipt.comment || "Поступление отклонено оператором.",
      action: "Проверьте документ, количество и серийные номера перед повторной отправкой.",
    };
  }
  if (receipt.status === "Спорная") {
    return {
      title: "Причина",
      text: receipt.comment || "Партия требует уточнения.",
      action: "Сверьте комплектацию и подтвердите данные поставщика.",
    };
  }
  if (receipt.sync !== "ОК") {
    return {
      title: "Синхронизация",
      text: receipt.sync === "Конфликт" ? "Есть конфликт синхронизации." : "Партия еще не отправлена на сервер.",
      action: "Проверьте очередь обмена и повторите синхронизацию после подключения backend/API.",
    };
  }
  if (receipt.status === "Ожидает проверки") {
    return {
      title: "Проверка",
      text: "Поступление ожидает проверки оператором.",
      action: "Откройте карточку или отправьте партию в очередь проверки.",
    };
  }
  return {
    title: "Статус",
    text: "Поступление принято без активных проблем.",
    action: "Дополнительных действий не требуется.",
  };
}

function formatFileSize(size) {
  if (!size) return "0 КБ";
  const mb = size / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} МБ`;
  return `${Math.max(1, Math.round(size / 1024))} КБ`;
}

function LoadingState({ title, text }) {
  return (
    <div className="rcp-modal-status">
      <div className="rcp-modal-spinner" />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function SuccessState({ title, text }) {
  return (
    <div className="rcp-modal-status rcp-modal-status-success">
      <CheckCircleOutlined />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function ReceiptForm({
  form,
  setForm,
  mode,
  fileInputRef,
  onFileSelect,
  onFileRemove,
}) {
  const readonlyCore = mode === "v2";
  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div className="rcp-modal-form">
      {mode === "create" ? (
        <div className="rcp-modal-note">
          <ExclamationCircleOutlined />
          <span>Новое поступление будет сохранено как черновик и попадет в очередь проверки.</span>
        </div>
      ) : null}
      {mode === "v2" ? (
        <div className="rcp-modal-note rcp-modal-note-success">
          <CheckCircleOutlined />
          <span>Подтверждено. После проверки можно изменить только документы и внутренний комментарий.</span>
        </div>
      ) : null}
      <section className="rcp-modal-card">
        <h3>Основные данные</h3>
        <div className="rcp-modal-grid">
          <label>
            <span>Позиция / оборудование</span>
            <input value={form.name} disabled={readonlyCore} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>
            <span>ID / артикул</span>
            <input value={form.article} disabled={readonlyCore} onChange={(event) => setForm({ ...form, article: event.target.value })} />
          </label>
          <label>
            <span>Категория</span>
            <input value={form.category} disabled={readonlyCore} onChange={(event) => setForm({ ...form, category: event.target.value })} />
          </label>
          <label>
            <span>Количество</span>
            <input type="number" min="1" value={form.qty} disabled={readonlyCore} onChange={(event) => setForm({ ...form, qty: Number(event.target.value) })} />
          </label>
          <label>
            <span>Партия</span>
            <input value={form.batch} disabled={readonlyCore} onChange={(event) => setForm({ ...form, batch: event.target.value })} />
          </label>
          <label>
            <span>Поставщик</span>
            <select value={form.supplier} disabled={readonlyCore} onChange={(event) => setForm({ ...form, supplier: event.target.value })}>
              <option>MedSupply GmbH</option>
              <option>MediTech Solutions</option>
              <option>Global Health Ltd</option>
              <option>CleanLab</option>
              <option>Hospital Systems</option>
            </select>
          </label>
          <label>
            <span>Склад</span>
            <select value={form.warehouse} disabled={readonlyCore} onChange={(event) => setForm({ ...form, warehouse: event.target.value })}>
              <option>Склад временного хранения</option>
              <option>Основной склад</option>
              <option>Склад №2</option>
              <option>Склад №3</option>
            </select>
          </label>
          <label>
            <span>Дата поступления</span>
            <input value={form.date} disabled={readonlyCore} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </label>
        </div>
      </section>
      <section className="rcp-modal-card">
        <h3>Документы</h3>
        <div className="rcp-modal-grid rcp-modal-grid-three">
          <label>
            <span>Номер документа</span>
            <input value={form.documentNumber} onChange={(event) => setForm({ ...form, documentNumber: event.target.value })} />
          </label>
          <label>
            <span>Тип документа</span>
            <select value={form.documentType} onChange={(event) => setForm({ ...form, documentType: event.target.value })}>
              <option>Накладная</option>
              <option>Акт приема-передачи</option>
              <option>Сертификат соответствия</option>
              <option>Счет-фактура</option>
            </select>
          </label>
          <label>
            <span>Файл документа</span>
            <input value={form.file} onChange={(event) => setForm({ ...form, file: event.target.value })} />
          </label>
        </div>
        {mode === "create" ? (
          <div className="rcp-pdf-upload">
            <div
              className="rcp-pdf-drop"
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <UploadOutlined />
              <div>
                <strong>Документ поступления</strong>
                <span>PDF до 10 МБ</span>
              </div>
              <button className="rcp-row-btn" type="button">Выбрать PDF</button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onFileSelect(file);
                event.target.value = "";
              }}
            />
            {form.uploadError ? <p className="rcp-upload-error">{form.uploadError}</p> : null}
            {form.uploadedDocument ? (
              <div className="rcp-selected-file">
                <div>
                  <strong>{form.uploadedDocument.name}</strong>
                  <span>{formatFileSize(form.uploadedDocument.size)}</span>
                </div>
                <span className="rcp-file-badge">Выбран</span>
                <button type="button" className="rcp-file-remove" onClick={onFileRemove}>Удалить</button>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
      <label className="rcp-comment-field">
        <span>Комментарий диспетчера</span>
        <textarea value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} />
      </label>
    </div>
  );
}

function ReceiptFormModal({
  mode,
  form,
  setForm,
  loading,
  success,
  onClose,
  onSubmit,
  fileInputRef,
  onFileSelect,
  onFileRemove,
}) {
  const isCreate = mode === "create";
  const isV2 = mode === "v2";
  return (
    <DesktopModalShell
      size="wide"
      title={isCreate ? "Создать поступление" : "Редактировать поступление"}
      subtitle={isCreate ? "Основные данные, документы и параметры проверки" : isV2 ? "Данные подтвержденной партии" : "Изменение данных входящей партии до проверки оператором"}
      onClose={onClose}
      closeDisabled={Boolean(loading)}
      footer={
        success ? (
          <button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={onClose}>Закрыть</button>
        ) : (
          <>
            <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose} disabled={Boolean(loading)}>Отмена</button>
            <button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={onSubmit} disabled={Boolean(loading)}>
              {isCreate ? "Создать поступление" : "Сохранить изменения"}
            </button>
          </>
        )
      }
    >
      {loading ? <LoadingState {...loading} /> : success ? (
        <SuccessState title={isCreate ? "Поступление создано" : "Изменения сохранены"} text={isCreate ? "Черновик добавлен в список поступлений." : "Данные поступления обновлены локально."} />
      ) : (
        <ReceiptForm
          form={form}
          setForm={setForm}
          mode={mode}
          fileInputRef={fileInputRef}
          onFileSelect={onFileSelect}
          onFileRemove={onFileRemove}
        />
      )}
    </DesktopModalShell>
  );
}

function ReceiptDetailsModal({ receipt, onClose, onEdit, onOpenDocument }) {
  return (
    <DesktopModalShell
      size="wide"
      title="Карточка поступления"
      subtitle="Просмотр партии, статуса проверки и связанных действий"
      onClose={onClose}
      footer={
        <>
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={() => onEdit(receipt)}>Редактировать</button>
          <button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={onClose}>Закрыть</button>
        </>
      }
    >
      <div className="rcp-details-modal">
        <section className="rcp-modal-hero">
          <div>
            <h3>{receipt.batch} • {receipt.name}</h3>
            <p>Создано диспетчером</p>
          </div>
          <span className={`rcp-pill ${receipt.statusCls}`}>{receipt.status}</span>
        </section>
        <section className="rcp-modal-grid-four">
          <div className="rcp-modal-stat"><span>ID</span><strong>{receipt.article}</strong></div>
          <div className="rcp-modal-stat"><span>Поставщик</span><strong>{receipt.supplier}</strong></div>
          <div className="rcp-modal-stat"><span>Количество</span><strong>{receipt.qty} шт.</strong></div>
          <div className="rcp-modal-stat"><span>Склад</span><strong>{receipt.warehouse}</strong></div>
        </section>
        <section className="rcp-modal-card">
          <h3>Данные поступления</h3>
          <div className="rcp-meta-grid">
            <div><span>Партия</span><strong>{receipt.batch}</strong></div>
            <div><span>Позиция</span><strong>{receipt.name}</strong></div>
            <div><span>ID / Артикул</span><strong>{receipt.article}</strong></div>
            <div><span>Категория</span><strong>{receipt.category}</strong></div>
            <div><span>Поставщик</span><strong>{receipt.supplier}</strong></div>
            <div><span>Дата поступления</span><strong>{receipt.date}</strong></div>
            <div><span>Документ</span><strong>{receipt.documentType} #{receipt.documentNumber}</strong></div>
            <div><span>Проверка</span><strong>{receipt.checker === "—" ? "ожидает оператора" : receipt.checker}</strong></div>
          </div>
        </section>
        <section className="rcp-modal-card">
          <h3>Документы и комментарий</h3>
          <div className="rcp-document-row">
            <div>
              <strong>{receipt.documentType} #{receipt.documentNumber}</strong>
              <span>{receipt.uploadedDocument ? `${receipt.uploadedDocument.name} • ${formatFileSize(receipt.uploadedDocument.size)}` : (receipt.file || "Документ не загружен")}</span>
            </div>
            {receipt.uploadedDocument?.objectUrl ? (
              <button type="button" className="rcp-row-btn" onClick={() => onOpenDocument(receipt)}>
                Посмотреть PDF
              </button>
            ) : (
              <span className="rcp-document-empty">Документ не загружен</span>
            )}
          </div>
          <blockquote>{receipt.comment}</blockquote>
        </section>
      </div>
    </DesktopModalShell>
  );
}

function SimpleStatusModal({ title, loading, success, onClose }) {
  return (
    <DesktopModalShell
      size="narrow"
      title={title}
      onClose={onClose}
      closeDisabled={Boolean(loading)}
      footer={success ? <button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={onClose}>Закрыть</button> : null}
    >
      {loading ? <LoadingState {...loading} /> : <SuccessState title="Готово" text="Действие будет подключено к backend/API позже." />}
    </DesktopModalShell>
  );
}

export function DesktopReceiptsScreen() {
  const [rows, setRows] = useState(receiptRows);
  const [selectedBatch, setSelectedBatch] = useState(receiptRows[0]?.batch);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [attentionKey, setAttentionKey] = useState(null);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(null);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState(receiptRows[0]);
  const timersRef = useRef([]);
  const fileInputRef = useRef(null);
  const objectUrlsRef = useRef(new Set());

  useEffect(() => () => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const selectedReceipt = useMemo(
    () => rows.find((row) => row.batch === selectedBatch) ?? null,
    [rows, selectedBatch]
  );

  const visibleRows = useMemo(() => rows.filter((row) => {
    if (filters.period !== "Все периоды" && row.period !== filters.period) return false;
    if (filters.supplier !== "Все поставщики" && row.supplier !== filters.supplier) return false;
    if (filters.warehouse !== "Все склады" && row.warehouse !== filters.warehouse) return false;
    if (filters.status !== "Все статусы" && row.status !== filters.status) return false;
    if (filters.batch && !row.batch.toLowerCase().includes(filters.batch.toLowerCase())) return false;
    if (filters.chip === "Ожидают проверки") return row.status === "Ожидает проверки";
    if (filters.chip === "Подтверждено") return row.status === "Подтверждено";
    if (filters.chip === "Отклонено") return row.status === "Отклонено";
    if (filters.chip === "Спорные") return row.status === "Спорная";
    if (filters.chip === "Не синхронизировано") return row.sync !== "ОК";
    return true;
  }), [filters, rows]);

  useEffect(() => {
    if (visibleRows.length && !visibleRows.some((row) => row.batch === selectedBatch)) {
      setSelectedBatch(visibleRows[0].batch);
    } else if (!visibleRows.length) {
      setSelectedBatch(null);
    }
  }, [selectedBatch, visibleRows]);

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
    if (modal === "create" && !success && form.uploadedDocument?.objectUrl) {
      URL.revokeObjectURL(form.uploadedDocument.objectUrl);
      objectUrlsRef.current.delete(form.uploadedDocument.objectUrl);
    }
    setModal(null);
    setSuccess(null);
  };

  const openCreate = () => {
    setForm({
      batch: `NEW-${rows.length + 1}`,
      date: "Сегодня 10:30",
      period: "Текущий месяц",
      name: "Монитор пациента",
      article: "EQ-201-05",
      category: "Медоборудование",
      warehouse: "Склад временного хранения",
      zone: "Основной терминал",
      qty: 30,
      supplier: "MedSupply GmbH",
      creator: "Иван Иванов (Диспетчер)",
      checker: "—",
      status: "Ожидает проверки",
      statusCls: "rcp-pill-amber",
      actionLabel: "Открыть",
      actionCls: "rcp-row-btn",
      documentNumber: "A-NEW",
      documentType: "Накладная",
      file: "",
      comment: "Новое поступление.",
      sync: "Не отправлено",
      editableMode: "standard",
      uploadedDocument: null,
      uploadError: "",
    });
    setModal("create");
  };

  const removeUploadedPdf = () => {
    if (form.uploadedDocument?.objectUrl) {
      URL.revokeObjectURL(form.uploadedDocument.objectUrl);
      objectUrlsRef.current.delete(form.uploadedDocument.objectUrl);
    }
    setForm({ ...form, uploadedDocument: null, uploadError: "", file: "" });
  };

  const handlePdfFile = (file) => {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      if (form.uploadedDocument?.objectUrl) {
        URL.revokeObjectURL(form.uploadedDocument.objectUrl);
        objectUrlsRef.current.delete(form.uploadedDocument.objectUrl);
      }
      setForm({ ...form, uploadedDocument: null, uploadError: "Можно загрузить только PDF-файл", file: "" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      if (form.uploadedDocument?.objectUrl) {
        URL.revokeObjectURL(form.uploadedDocument.objectUrl);
        objectUrlsRef.current.delete(form.uploadedDocument.objectUrl);
      }
      setForm({ ...form, uploadedDocument: null, uploadError: "Размер файла не должен превышать 10 МБ", file: "" });
      return;
    }
    if (form.uploadedDocument?.objectUrl) {
      URL.revokeObjectURL(form.uploadedDocument.objectUrl);
      objectUrlsRef.current.delete(form.uploadedDocument.objectUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    objectUrlsRef.current.add(objectUrl);
    setForm({
      ...form,
      file: `${file.name} • ${formatFileSize(file.size)}`,
      uploadedDocument: {
        file,
        objectUrl,
        name: file.name,
        size: file.size,
        type: file.type || "application/pdf",
      },
      uploadError: "",
    });
  };

  const openReceiptDocument = (receipt) => {
    if (receipt.uploadedDocument?.objectUrl) {
      window.open(receipt.uploadedDocument.objectUrl, "_blank", "noopener,noreferrer");
    }
  };

  const openEdit = (receipt = selectedReceipt) => {
    if (!receipt) return;
    setSelectedBatch(receipt.batch);
    setForm({ ...receipt });
    setModal(receipt.editableMode === "v2" ? "editV2" : "edit");
  };

  const submitCreate = () => {
    scheduleAction(
      { title: "Создаем поступление", text: "Сохраняем черновик поступления" },
      () => {
        const next = { ...form, statusCls: getStatusClass(form.status) };
        setRows((current) => [next, ...current]);
        setSelectedBatch(next.batch);
        setSuccess("create");
      }
    );
  };

  const submitEdit = () => {
    scheduleAction(
      { title: "Сохраняем изменения", text: "Обновляем данные поступления" },
      () => {
        setRows((current) => current.map((row) => row.batch === form.batch ? { ...form, statusCls: getStatusClass(form.status) } : row));
        setSelectedBatch(form.batch);
        setSuccess("edit");
      }
    );
  };

  const openStatusAction = (type) => {
    setModal(type);
    scheduleAction(
      type === "export"
        ? { title: "Готовим экспорт", text: "Формируем список поступлений" }
        : { title: "Подготавливаем импорт", text: "Заглушка до подключения backend/API" },
      () => setSuccess(type)
    );
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAttentionKey(null);
    setSelectedBatch(rows[0]?.batch ?? null);
  };

  const handleAttentionClick = (item) => {
    const nextFilters = { ...EMPTY_FILTERS, chip: item.chip };
    const matches = rows.filter((row) => {
      if (item.chip === "Отклонено") return row.status === "Отклонено";
      if (item.chip === "Спорные") return row.status === "Спорная";
      if (item.chip === "Не синхронизировано") return row.sync !== "ОК";
      return false;
    });

    setAttentionKey(item.key);
    setFilters(nextFilters);
    setSelectedBatch(matches[0]?.batch ?? null);
  };

  const stats = [
    { label: "Всего поступлений", value: rows.length, sub: "тек. месяц", cls: "rcp-stat-default" },
    { label: "Ожидают проверки", value: rows.filter((row) => row.status === "Ожидает проверки").length, icon: <ExclamationCircleOutlined />, cls: "rcp-stat-amber" },
    { label: "Подтверждено", value: rows.filter((row) => row.status === "Подтверждено").length, icon: <CheckCircleOutlined />, cls: "rcp-stat-green" },
    { label: "Отклонено", value: rows.filter((row) => row.status === "Отклонено").length, icon: <CloseCircleOutlined />, cls: "rcp-stat-red" },
    { label: "Спорные", value: rows.filter((row) => row.status === "Спорная").length, sub: "требуют внимания", cls: "rcp-stat-purple", info: true },
  ];

  return (
    <div className="rcp-screen">
      <div className="rcp-actions">
        <button className="rcp-btn-primary" type="button" onClick={openCreate}><PlusOutlined /><span>Создать поступление</span></button>
        <button className="rcp-btn-secondary" type="button" onClick={() => openStatusAction("import")}><UploadOutlined /><span>Импорт из реестра</span></button>
        <button className="rcp-btn-secondary" type="button" onClick={() => openStatusAction("export")}><DownloadOutlined /><span>Экспорт</span></button>
        <button className="rcp-btn-secondary" type="button" onClick={() => setModal("history")}><HistoryOutlined /><span>История проверок</span></button>
      </div>

      <div className="rcp-stats-grid">
        {stats.map((s) => (
          <div key={s.label} className={`rcp-stat-card ${s.cls}`}>
            {s.info ? <div className="rcp-stat-info-row"><span className="rcp-stat-label">{s.label}</span><QuestionCircleOutlined className="rcp-stat-info-icon" title="требуют решения" /></div> : <p className="rcp-stat-label">{s.label}</p>}
            <div className="rcp-stat-value-row">
              <span className="rcp-stat-value">{s.value}</span>
              {s.icon && <span className="rcp-stat-icon">{s.icon}</span>}
              {s.sub && <span className="rcp-stat-sub">{s.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="rcp-filters-card">
        <div className="rcp-filters-row">
          <label className="rcp-filter-field"><span className="rcp-filter-label">Период</span><select className="rcp-filter-select" value={filters.period} onChange={(event) => { setAttentionKey(null); setFilters({ ...filters, period: event.target.value }); }}><option>Все периоды</option><option>Текущий месяц</option><option>Прошлый месяц</option></select></label>
          <label className="rcp-filter-field"><span className="rcp-filter-label">Поставщик</span><select className="rcp-filter-select" value={filters.supplier} onChange={(event) => { setAttentionKey(null); setFilters({ ...filters, supplier: event.target.value }); }}><option>Все поставщики</option><option>MedSupply GmbH</option><option>ClimatePro</option><option>ЭлектроСнаб</option><option>TechVision</option><option>HealthLine</option><option>CleanLab</option><option>Hospital Systems</option></select></label>
          <label className="rcp-filter-field"><span className="rcp-filter-label">Склад</span><select className="rcp-filter-select" value={filters.warehouse} onChange={(event) => { setAttentionKey(null); setFilters({ ...filters, warehouse: event.target.value }); }}><option>Все склады</option><option>Склад временного хранения</option><option>Основной склад</option><option>Склад №2</option><option>Склад №3</option></select></label>
          <label className="rcp-filter-field"><span className="rcp-filter-label">Статус</span><select className="rcp-filter-select" value={filters.status} onChange={(event) => { setAttentionKey(null); setFilters({ ...filters, status: event.target.value }); }}><option>Все статусы</option><option>Ожидает проверки</option><option>Подтверждено</option><option>Отклонено</option><option>Спорная</option></select></label>
          <label className="rcp-filter-field"><span className="rcp-filter-label">Партия</span><input className="rcp-filter-input" type="text" placeholder="Номер..." value={filters.batch} onChange={(event) => { setAttentionKey(null); setFilters({ ...filters, batch: event.target.value }); }} /></label>
        </div>
        <div className="rcp-chips-row">
          <div className="rcp-chips">
            {["Все", "Ожидают проверки", "Подтверждено", "Отклонено", "Спорные", "Не синхронизировано"].map((chip) => (
              <button className={filters.chip === chip ? "rcp-chip rcp-chip-active" : "rcp-chip"} type="button" key={chip} onClick={() => { setAttentionKey(null); setFilters({ ...filters, chip }); }}>{chip}</button>
            ))}
          </div>
          <button className="rcp-reset-btn" type="button" onClick={resetFilters}><CloseCircleOutlined />Сбросить фильтры</button>
        </div>
      </div>

      <div className="rcp-main-layout">
        <div className="rcp-table-card">
          <div className="rcp-table-head-row">
            <h3 className="rcp-table-title">Список поступлений</h3>
            <span className="rcp-table-count">Показано {visibleRows.length} из {rows.length}</span>
          </div>
          <div className="rcp-table-wrap">
            <table className="rcp-table">
              <thead>
                <tr><th>Партия</th><th>Дата / Время</th><th>Позиция</th><th>ID / Артикул</th><th>Склад</th><th className="rcp-th-center">Кол-во</th><th>Поставщик</th><th>Создал</th><th>Проверил</th><th>Статус</th><th className="rcp-th-right">Действие</th></tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.batch} className={row.batch === selectedBatch ? "rcp-row-active" : ""} onClick={() => setSelectedBatch(row.batch)}>
                    <td className={`rcp-td-batch${row.batch === selectedBatch ? " rcp-td-batch-active" : ""}`}>{row.batch}</td>
                    <td className="rcp-td-date">{row.date}</td>
                    <td className="rcp-td-name">{row.name}</td>
                    <td className="rcp-td-article">{row.article}</td>
                    <td className="rcp-td-warehouse" title={row.warehouse}>{row.warehouse}</td>
                    <td className="rcp-td-qty">{row.qty} шт.</td>
                    <td className="rcp-td-supplier">{row.supplier}</td>
                    <td className="rcp-td-person">{row.creator}</td>
                    <td className="rcp-td-person">{row.checker}</td>
                    <td><span className={`rcp-pill ${row.statusCls}`}>{row.status}</span></td>
                    <td className="rcp-td-action"><button className={row.actionCls} type="button" onClick={(event) => { event.stopPropagation(); row.actionLabel === "Редактировать" || row.actionLabel === "Решить" ? openEdit(row) : setModal("details"); setSelectedBatch(row.batch); }}>{row.actionLabel}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rcp-detail-panel">
          {selectedReceipt ? (
            <>
              <div className="rcp-detail-header"><h3 className="rcp-detail-title">Детали поступления</h3><p className="rcp-detail-sub">{selectedReceipt.batch} • {selectedReceipt.name}</p></div>
              <div className="rcp-detail-body">
                <div className="rcp-detail-fields">
                  <div className="rcp-detail-row"><span className="rcp-detail-key">ID / артикул</span><span className="rcp-detail-val rcp-detail-mono">{selectedReceipt.article}</span></div>
                  <div className="rcp-detail-row"><span className="rcp-detail-key">Количество</span><span className="rcp-detail-val">{selectedReceipt.qty} шт.</span></div>
                  <div className="rcp-detail-row"><span className="rcp-detail-key">Поставщик</span><span className="rcp-detail-val">{selectedReceipt.supplier}</span></div>
                  <div className="rcp-detail-row"><span className="rcp-detail-key">Склад</span><span className="rcp-detail-val">{selectedReceipt.warehouse}</span></div>
                  <div className="rcp-detail-row"><span className="rcp-detail-key">Создал</span><span className="rcp-detail-val">{selectedReceipt.creator}</span></div>
                  <div className="rcp-detail-row"><span className="rcp-detail-key">Статус поступления</span><span className="rcp-detail-val rcp-detail-status-amber">{selectedReceipt.status}</span></div>
                  <div className="rcp-detail-row rcp-detail-row-last"><span className="rcp-detail-key">Проверка</span><span className="rcp-detail-val rcp-detail-italic">{selectedReceipt.checker === "—" ? "ожидает оператора" : selectedReceipt.checker}</span></div>
                </div>
                <div className={attentionKey ? "rcp-detail-issue rcp-detail-issue-active" : "rcp-detail-issue"}>
                  <span>{getReceiptIssue(selectedReceipt).title}</span>
                  <strong>{getReceiptIssue(selectedReceipt).text}</strong>
                  <p>{getReceiptIssue(selectedReceipt).action}</p>
                </div>
                <div className="rcp-detail-actions">
                  <button className="rcp-detail-btn-primary" type="button" onClick={() => setModal("details")}>Открыть карточку</button>
                  <button className="rcp-detail-btn-secondary" type="button" onClick={() => openEdit(selectedReceipt)}>Редактировать поступление</button>
                  <button className="rcp-detail-btn-outline" type="button" onClick={() => openStatusAction("send")}>Отправить на проверку</button>
                </div>
              </div>
            </>
          ) : <div className="rcp-detail-body">Нет поступлений в текущей выборке.</div>}
        </div>
      </div>

      <div className="rcp-bottom-panels">
        <div className="rcp-bottom-panel">
          <div className="rcp-bottom-panel-header"><ExclamationCircleOutlined className="rcp-bottom-panel-icon rcp-bottom-panel-icon-red" /><h3 className="rcp-bottom-panel-title">Требуют внимания</h3></div>
          <div className="rcp-attn-list">
            {ATTENTION_ITEMS.map((item) => (
              <button
                key={item.key}
                className={`rcp-attn-item ${item.cls} rcp-attn-action${attentionKey === item.key ? " is-active" : ""}`}
                type="button"
                onClick={() => handleAttentionClick(item)}
              >
                <span className="rcp-attn-left"><span className="rcp-attn-icon">{item.icon}</span><span className="rcp-attn-text">{item.text}</span></span>
                <span className={`rcp-attn-btn ${item.btnCls}`}>Перейти</span>
              </button>
            ))}
          </div>
        </div>
        <div className="rcp-bottom-panel">
          <div className="rcp-bottom-panel-header"><HistoryOutlined className="rcp-bottom-panel-icon rcp-bottom-panel-icon-primary" /><h3 className="rcp-bottom-panel-title">Последние проверки</h3></div>
          <div className="rcp-hist-list">
            {receiptHistoryRows.map((h, i) => (
              <div key={h.id} className={`rcp-hist-item${i < receiptHistoryRows.length - 1 ? " rcp-hist-item-line" : ""}`}><div className={`rcp-hist-dot rcp-hist-dot-${h.tone}`}><span className={`rcp-hist-dot-icon rcp-hist-icon-${h.tone}`}>{h.tone === "green" ? <CheckOutlined /> : <CloseOutlined />}</span></div><div className="rcp-hist-content"><p className="rcp-hist-time">{h.time}</p><p className="rcp-hist-text"><strong>{h.user}</strong> {h.action} <span className="rcp-hist-batch">{h.batch}</span> ({h.item})</p></div></div>
            ))}
          </div>
          <button className="rcp-hist-more-btn" type="button" onClick={() => setModal("history")}>Показать всю историю</button>
        </div>
      </div>

      {(modal === "create" || modal === "edit" || modal === "editV2") ? (
        <ReceiptFormModal
          mode={modal === "create" ? "create" : modal === "editV2" ? "v2" : "edit"}
          form={form}
          setForm={setForm}
          loading={loading}
          success={Boolean(success)}
          onClose={closeModal}
          onSubmit={modal === "create" ? submitCreate : submitEdit}
          fileInputRef={fileInputRef}
          onFileSelect={handlePdfFile}
          onFileRemove={removeUploadedPdf}
        />
      ) : null}
      {modal === "details" && selectedReceipt ? (
        <ReceiptDetailsModal
          receipt={selectedReceipt}
          onClose={closeModal}
          onEdit={openEdit}
          onOpenDocument={openReceiptDocument}
        />
      ) : null}
      {(modal === "export" || modal === "import" || modal === "send") ? <SimpleStatusModal title={modal === "export" ? "Экспорт" : "Статус действия"} loading={loading} success={Boolean(success)} onClose={closeModal} /> : null}
      {modal === "history" ? (
        <DesktopModalShell size="wide" title="История проверок" subtitle="Последние изменения статусов поступлений" onClose={closeModal} footer={<button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={closeModal}>Закрыть</button>}>
          <div className="rcp-modal-table-wrap"><table className="rcp-modal-table"><thead><tr><th>Время</th><th>Пользователь</th><th>Действие</th><th>Партия</th><th>Позиция</th></tr></thead><tbody>{receiptHistoryRows.map((h) => <tr key={h.id}><td>{h.time}</td><td>{h.user}</td><td>{h.action}</td><td><strong>{h.batch}</strong></td><td>{h.item}</td></tr>)}</tbody></table></div>
        </DesktopModalShell>
      ) : null}
    </div>
  );
}
