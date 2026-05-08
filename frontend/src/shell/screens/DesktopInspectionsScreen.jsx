import { useEffect, useMemo, useRef, useState } from "react";
import {
  PlusCircleOutlined,
  UserAddOutlined,
  DownloadOutlined,
  HistoryOutlined,
  ReloadOutlined,
  WarningOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { DesktopModalShell } from "../components/DesktopModalShell.jsx";
import {
  inspectionActivity,
  inspectionOperators,
  inspectionRoomEquipment,
  inspectionRows,
} from "../data/inspectionsScreenData.js";
import "../styles/inspectionsScreen.css";

function InspProgressBar({ pct, tone }) {
  const fillClass = tone === "success" ? "ins-pb-fill ins-pb-fill-success" : "ins-pb-fill";
  const trackClass = tone === "success" ? "ins-pb-track ins-pb-track-success" : "ins-pb-track";
  return (
    <div className="ins-pb-wrap">
      <div className={trackClass}>
        {pct > 0 && <div className={fillClass} style={{ width: `${pct}%` }} />}
      </div>
      <span className={tone === "success" ? "ins-pb-label ins-pb-label-success" : "ins-pb-label"}>
        {pct}%
      </span>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    "В работе": "ins-pill ins-pill-blue",
    "Ожидает назначения": "ins-pill ins-pill-amber",
    "Завершено": "ins-pill ins-pill-green",
    "Требует внимания": "ins-pill ins-pill-rose",
    "Отменена": "ins-pill ins-pill-gray",
  };
  return <span className={map[status] || "ins-pill ins-pill-gray"}>{status}</span>;
}

function OperatorCell({ initials, name, tone }) {
  if (!initials) return <span className="ins-no-operator">Не назначен</span>;
  const cls = tone === "primary" ? "ins-avatar ins-avatar-primary" : "ins-avatar ins-avatar-gray";
  return (
    <div className="ins-operator-cell">
      <div className={cls}>{initials}</div>
      <span className="ins-operator-name">{name}</span>
    </div>
  );
}

function SyncCell({ type, text }) {
  if (type === "pending") {
    return (
      <div className="ins-sync-cell">
        <ClockCircleOutlined className="ins-sync-icon ins-sync-icon-amber" />
        <span className="ins-sync-text ins-sync-text-amber">{text}</span>
      </div>
    );
  }
  if (type === "ok") {
    return (
      <div className="ins-sync-cell">
        <CheckCircleOutlined className="ins-sync-icon ins-sync-icon-green" />
        <span className="ins-sync-text ins-sync-text-green">ОК</span>
      </div>
    );
  }
  if (type === "error") {
    return (
      <div className="ins-sync-cell">
        <CloseCircleOutlined className="ins-sync-icon ins-sync-icon-rose" />
        <span className="ins-sync-text ins-sync-text-rose">Ошибка</span>
      </div>
    );
  }
  return <span className="ins-cell-dim">—</span>;
}

function getAction(row) {
  if (!row.operator?.initials) return { label: "Назначить", tone: "amber", modal: "assign" };
  return { label: "Открыть", tone: "primary", modal: "details" };
}

function LoadingState({ title, text }) {
  return (
    <div className="ins-modal-status">
      <div className="ins-modal-spinner" />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function SuccessState({ title, text }) {
  return (
    <div className="ins-modal-status ins-modal-status-success">
      <CheckCircleOutlined />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

const INSPECTION_HISTORY = [
  { id: "h-1", time: "Сегодня, 09:42", inspection: "#INS-2024-001", action: "Синхронизация завершена", user: "Иван Иванов", status: "ОК" },
  { id: "h-2", time: "Сегодня, 09:31", inspection: "#INS-2024-001", action: "Добавлено расхождение", user: "Иван Иванов", status: "В работе" },
  { id: "h-3", time: "Сегодня, 08:40", inspection: "#INS-2024-004", action: "Создана инспекция", user: "Диспетчер", status: "Назначена" },
  { id: "h-4", time: "Вчера, 17:24", inspection: "#INS-2024-003", action: "Инспекция завершена", user: "Пётр Смирнов", status: "Завершено" },
  { id: "h-5", time: "Вчера, 14:10", inspection: "#INS-2024-002", action: "Ожидает назначения", user: "Система", status: "Черновик" },
];

function getPeriod(row) {
  if (row.schedule?.startsWith("Сегодня")) return "Сегодня";
  if (row.schedule?.startsWith("Вчера")) return "Вчера";
  return "Неделя";
}

function matchesChip(row, chip) {
  if (chip === "Активные") return row.status === "В работе" || row.status === "Требует внимания";
  if (chip === "Ожидают назначения") return row.status === "Ожидает назначения";
  if (chip === "В работе") return row.status === "В работе";
  if (chip === "С расхождениями") return (row.discrepancies || 0) > 0;
  if (chip === "Завершено") return row.status === "Завершено";
  if (chip === "Без оператора") return !row.operator?.initials;
  return true;
}

function InspectionsTable({ rows, totalRows, selectedId, onSelect, onOpenDetails, onAssign }) {
  return (
    <div className="ins-table-card">
      <div className="ins-table-header">
        <h3 className="ins-table-title">Список инспекций</h3>
        <span className="ins-table-count">Показано: {rows.length} из {totalRows}</span>
      </div>
      <div className="ins-table-scroll">
        <table className="ins-table">
          <thead>
            <tr className="ins-thead-row">
              <th className="ins-th">Инспекция</th>
              <th className="ins-th">Объект / зона</th>
              <th className="ins-th">Оператор</th>
              <th className="ins-th">Помещения</th>
              <th className="ins-th">Позиции</th>
              <th className="ins-th">Прогресс</th>
              <th className="ins-th">Расхождения</th>
              <th className="ins-th">Синхронизация</th>
              <th className="ins-th">Статус</th>
              <th className="ins-th ins-th-right">Действие</th>
            </tr>
          </thead>
          <tbody className="ins-tbody">
            {rows.map((row) => {
              const action = getAction(row);
              return (
                <tr
                  key={row.id}
                  className={row.id === selectedId ? "ins-tr ins-tr-active" : "ins-tr ins-tr-default"}
                  onClick={() => onSelect(row)}
                >
                  <td className="ins-td">
                    <span className="ins-id">{row.id}</span>
                  </td>
                  <td className="ins-td">
                    <div className="ins-object-name">{row.object}</div>
                    <div className="ins-object-zone">{row.zone}</div>
                  </td>
                  <td className="ins-td">
                    <OperatorCell {...row.operator} />
                  </td>
                  <td className="ins-td">
                    <span className={row.operator.initials ? "ins-count" : "ins-count-dim"}>
                      {row.rooms}
                    </span>
                  </td>
                  <td className="ins-td">
                    <span className={row.operator.initials ? "ins-count" : "ins-count-dim"}>
                      {row.items}
                    </span>
                  </td>
                  <td className="ins-td">
                    {row.pct > 0 ? (
                      <InspProgressBar pct={row.pct} tone={row.pctTone} />
                    ) : (
                      <div className="ins-pb-empty" />
                    )}
                  </td>
                  <td className="ins-td ins-td-center">
                    {row.discrepancies === null ? (
                      <span className="ins-cell-dim">—</span>
                    ) : row.discrepancies === 0 ? (
                      <span className="ins-disc-zero">{row.discrepancies}</span>
                    ) : (
                      <span className="ins-disc-error">{row.discrepancies}</span>
                    )}
                  </td>
                  <td className="ins-td">
                    <SyncCell {...row.sync} />
                  </td>
                  <td className="ins-td">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="ins-td ins-td-right">
                    <button
                      className={
                        action.tone === "amber"
                          ? "ins-row-action ins-row-action-amber"
                          : "ins-row-action"
                      }
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (action.modal === "assign") onAssign(row);
                        else onOpenDetails(row);
                      }}
                    >
                      {action.label}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetailPanel({ inspection, onOpenDetails, onAssign, onCancel }) {
  if (!inspection) {
    return (
      <div className="ins-card ins-detail-card ins-detail-empty">
        <div className="ins-detail-head">
          <h3 className="ins-detail-title">Детали инспекции</h3>
        </div>
        <p>Нет инспекций в текущей выборке.</p>
      </div>
    );
  }

  return (
    <div className="ins-card ins-detail-card">
      <div className="ins-detail-head">
        <h3 className="ins-detail-title">Детали инспекции</h3>
        <span className="ins-detail-badge">{inspection.id}</span>
      </div>
      <div className="ins-detail-fields">
        <div className="ins-detail-field ins-detail-field-border">
          <p className="ins-field-label">Объект / Зона</p>
          <p className="ins-field-value">{inspection.object}, {inspection.zone}</p>
        </div>
        <div className="ins-detail-field ins-detail-field-border">
          <p className="ins-field-label">Оператор</p>
          {inspection.operator.initials ? (
            <div className="ins-operator-cell">
              <div className="ins-avatar ins-avatar-primary">{inspection.operator.initials}</div>
              <span className="ins-field-value">{inspection.operator.fullName}</span>
            </div>
          ) : (
            <p className="ins-field-value ins-field-value-amber">Не назначен</p>
          )}
        </div>
        <div className="ins-detail-grid ins-detail-field-border">
          <div>
            <p className="ins-field-label">Помещения</p>
            <p className="ins-field-value">{inspection.roomsDone} из {inspection.roomsTotal}</p>
          </div>
          <div>
            <p className="ins-field-label">Позиции</p>
            <p className="ins-field-value">{inspection.itemsDone} из {inspection.itemsTotal}</p>
          </div>
        </div>
        <div className="ins-detail-grid ins-detail-field-border">
          <div>
            <p className="ins-field-label">Расхождения</p>
            <p className="ins-field-value ins-field-value-rose">{inspection.discrepancies ?? "—"}</p>
          </div>
          <div>
            <p className="ins-field-label">Очередь</p>
            <p className="ins-field-value ins-field-value-amber">{inspection.sync.queue}</p>
          </div>
        </div>
        <div>
          <p className="ins-field-label">Последняя синхронизация</p>
          <p className="ins-field-value">{inspection.lastSync}</p>
        </div>
      </div>
      <div className="ins-detail-actions">
        <button className="ins-detail-btn ins-detail-btn-primary" type="button" onClick={() => onOpenDetails(inspection)}>
          Открыть инспекцию
        </button>
        <button className="ins-detail-btn ins-detail-btn-secondary" type="button" onClick={() => onAssign(inspection)}>
          Назначить другого оператора
        </button>
        <button className="ins-detail-btn ins-detail-btn-rose" type="button" onClick={() => onCancel(inspection)}>
          Отменить инспекцию
        </button>
        <button className="ins-detail-btn ins-detail-btn-blue" type="button" onClick={() => onOpenDetails(inspection)}>
          Открыть помещения
        </button>
      </div>
    </div>
  );
}

function AttentionWidget({ rows }) {
  const discrepancies = rows.reduce((sum, row) => sum + (row.discrepancies || 0), 0);
  const withoutOperator = rows.filter((row) => !row.operator?.initials).length;
  const syncErrors = rows.filter((row) => row.sync.type === "error").length;
  return (
    <div className="ins-alert-card">
      <div className="ins-alert-head">
        <h4 className="ins-alert-title">
          <WarningOutlined className="ins-alert-icon" />
          Внимание
        </h4>
        <span className="ins-alert-count">{discrepancies + withoutOperator + syncErrors}</span>
      </div>
      <div className="ins-alert-rows">
        <div className="ins-alert-row">
          <span>Расхождений:</span>
          <span className="ins-alert-val-rose">{discrepancies}</span>
        </div>
        <div className="ins-alert-row">
          <span>Без оператора:</span>
          <span className="ins-alert-val-amber">{withoutOperator}</span>
        </div>
        <div className="ins-alert-row">
          <span>Ошибок синхр.:</span>
          <span className="ins-alert-val-rose">{syncErrors}</span>
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ type }) {
  if (type === "sync") return <SyncOutlined style={{ fontSize: 12 }} />;
  if (type === "report") return <WarningOutlined style={{ fontSize: 12 }} />;
  return <PlusCircleOutlined style={{ fontSize: 12 }} />;
}

function ActivityPanel() {
  return (
    <div className="ins-card ins-activity-card">
      <h4 className="ins-activity-title">Последние действия</h4>
      <div className="ins-activity-list">
        {inspectionActivity.map((item) => (
          <div key={`${item.label}-${item.meta}`} className={item.last ? "ins-act-item" : "ins-act-item ins-act-item-line"}>
            <div className={item.cls}>
              <ActivityIcon type={item.icon} />
            </div>
            <div className="ins-act-body">
              <p className="ins-act-label">{item.label}</p>
              <p className="ins-act-meta">{item.meta}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateInspectionModal({ loading, success, form, setForm, onSubmit, onClose }) {
  const footer = success ? (
    <button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={onClose}>
      Закрыть
    </button>
  ) : (
    <>
      <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose} disabled={Boolean(loading)}>
        Отмена
      </button>
      <button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={onSubmit} disabled={Boolean(loading)}>
        Создать инспекцию
      </button>
    </>
  );

  return (
    <DesktopModalShell
      size="wide"
      title="Создать инспекцию"
      subtitle="Заполнение параметров нового обхода"
      onClose={onClose}
      closeDisabled={Boolean(loading)}
      footer={footer}
    >
      {loading ? <LoadingState {...loading} /> : success ? (
        <SuccessState title="Инспекция создана" text="Черновик добавлен в список инспекций." />
      ) : (
        <div className="ins-create-modal">
          <div className="ins-modal-note">
            <ExclamationCircleOutlined />
            <span>Новый черновик будет доступен оператору после синхронизации.</span>
          </div>
          <div className="ins-form-section">
            <h3>Основные данные</h3>
            <div className="ins-form-grid">
              <label>
                <span>ID инспекции</span>
                <input value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} />
              </label>
              <label>
                <span>Название</span>
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              </label>
              <label>
                <span>Объект</span>
                <select value={form.object} onChange={(event) => setForm({ ...form, object: event.target.value })}>
                  <option>Корпус А</option>
                  <option>Корпус Б</option>
                  <option>Склад временного хранения</option>
                </select>
              </label>
              <label>
                <span>Этаж</span>
                <select value={form.floor} onChange={(event) => setForm({ ...form, floor: event.target.value })}>
                  <option>1 этаж</option>
                  <option>2 этаж</option>
                  <option>3 этаж</option>
                </select>
              </label>
              <label>
                <span>Зона / отделение</span>
                <select value={form.zone} onChange={(event) => setForm({ ...form, zone: event.target.value })}>
                  <option>Приемное отделение</option>
                  <option>Диагностика</option>
                  <option>Офисная зона</option>
                  <option>Аптека</option>
                </select>
              </label>
              <label>
                <span>Тип инспекции</span>
                <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                  <option>Плановая</option>
                  <option>Внеплановая</option>
                </select>
              </label>
            </div>
          </div>
          <div className="ins-form-section">
            <h3>Назначение</h3>
            <div className="ins-form-grid ins-form-grid-two">
              <label>
                <span>Оператор</span>
                <select value={form.operatorId} onChange={(event) => setForm({ ...form, operatorId: event.target.value })}>
                  <option value="">Назначить позже</option>
                  {inspectionOperators.map((operator) => (
                    <option value={operator.id} key={operator.id}>{operator.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Приоритет</span>
                <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                  <option>Высокий</option>
                  <option>Средний</option>
                  <option>Низкий</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      )}
    </DesktopModalShell>
  );
}

function InspectionDetailsModal({ inspection, onClose, onOpenRoom, onAssign, onCancel }) {
  return (
    <DesktopModalShell
      size="xwide"
      title="Карточка инспекции"
      subtitle="Контроль прогресса, расхождений и синхронизации обхода"
      onClose={onClose}
      footer={
        <>
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={() => onAssign(inspection)}>
            Назначить другого оператора
          </button>
          <button className="reg-modal-btn reg-modal-btn-danger" type="button" onClick={() => onCancel(inspection)}>
            Отменить инспекцию
          </button>
          <button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={onClose}>
            Закрыть
          </button>
        </>
      }
    >
      <div className="ins-details-modal">
        <section className="ins-inspection-hero">
          <div>
            <h3>{inspection.id} — {inspection.title}</h3>
            <p>{inspection.object} • {inspection.floor}</p>
          </div>
          <div className="ins-hero-pills">
            <StatusPill status={inspection.status} />
            {inspection.discrepancies > 0 ? <span className="ins-pill ins-pill-rose">С расхождениями</span> : null}
            <span className="ins-pill ins-pill-amber">{inspection.sync.queue}</span>
          </div>
        </section>

        <section className="ins-modal-grid-four">
          <div className="ins-modal-stat"><span>Общий прогресс</span><strong>{inspection.pct}%</strong></div>
          <div className="ins-modal-stat"><span>Помещения</span><strong>{inspection.rooms}</strong></div>
          <div className="ins-modal-stat"><span>Позиции</span><strong>{inspection.items}</strong></div>
          <div className="ins-modal-stat"><span>Расхождения</span><strong>{inspection.discrepancies ?? "—"}</strong></div>
        </section>

        <section className="ins-modal-card">
          <h3>Данные инспекции</h3>
          <div className="ins-meta-grid">
            <div><span>ID инспекции</span><strong>{inspection.id}</strong></div>
            <div><span>Тип</span><strong>{inspection.type}</strong></div>
            <div><span>Корпус / этаж</span><strong>{inspection.object} • {inspection.floor}</strong></div>
            <div><span>Приоритет</span><strong>{inspection.priority}</strong></div>
            <div><span>Отделение</span><strong>{inspection.zone}</strong></div>
            <div><span>Создатель</span><strong>{inspection.createdBy}</strong></div>
            <div><span>Оператор</span><strong>{inspection.operator.fullName || "Не назначен"}</strong></div>
            <div><span>Расписание</span><strong>{inspection.schedule}</strong></div>
          </div>
        </section>

        <section className="ins-modal-card">
          <div className="ins-modal-card-head">
            <h3>Помещения инспекции</h3>
            <span>Все {inspection.roomsTotal} помещений</span>
          </div>
          <div className="ins-modal-table-wrap">
            <table className="ins-modal-table">
              <thead>
                <tr>
                  <th>Помещение</th>
                  <th>Позиции</th>
                  <th>Прогресс</th>
                  <th>Расхождения</th>
                  <th>Статус</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                {inspection.roomsList.map((room) => (
                  <tr key={room.id}>
                    <td><strong>{room.number} — {room.name}</strong><span>{room.location}</span></td>
                    <td>{room.items}</td>
                    <td><InspProgressBar pct={room.progress} tone={room.progress === 100 ? "success" : undefined} /></td>
                    <td className={room.discrepancies > 0 ? "ins-disc-error" : "ins-disc-zero"}>{room.discrepancies}</td>
                    <td>{room.status}</td>
                    <td><button type="button" className="ins-row-action" onClick={() => onOpenRoom(room)}>Открыть</button></td>
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

function RoomDetailsModal({ room, inspection, onClose }) {
  return (
    <DesktopModalShell
      size="xwide"
      title="Карточка помещения"
      subtitle="Оборудование, прогресс осмотра, расхождения и синхронизация"
      onClose={onClose}
      footer={<button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={onClose}>Закрыть</button>}
    >
      <div className="ins-details-modal">
        <section className="ins-inspection-hero">
          <div>
            <h3>{room.number} — {room.name}</h3>
            <p>{room.location}</p>
          </div>
          <div className="ins-hero-pills">
            <StatusPill status={room.status} />
            {room.discrepancies > 0 ? <span className="ins-pill ins-pill-rose">С расхождением</span> : null}
            <span className="ins-pill ins-pill-amber">{inspection.sync.queue}</span>
          </div>
        </section>
        <section className="ins-modal-grid-four">
          <div className="ins-modal-stat"><span>Позиции</span><strong>{room.items}</strong></div>
          <div className="ins-modal-stat"><span>Проверено</span><strong>{room.itemsDone} из {room.itemsTotal}</strong></div>
          <div className="ins-modal-stat"><span>Осталось</span><strong>{room.itemsTotal - room.itemsDone}</strong></div>
          <div className="ins-modal-stat"><span>Расхождения</span><strong>{room.discrepancies}</strong></div>
        </section>
        <section className="ins-modal-card">
          <h3>Данные помещения</h3>
          <div className="ins-meta-grid">
            <div><span>Номер помещения</span><strong>{room.number}</strong></div>
            <div><span>Наименование</span><strong>{room.name}</strong></div>
            <div><span>Корпус</span><strong>{inspection.object}</strong></div>
            <div><span>Этаж</span><strong>{inspection.floor}</strong></div>
            <div><span>Зона</span><strong>{inspection.zone}</strong></div>
            <div><span>Источник данных</span><strong>Реестр оборудования</strong></div>
          </div>
        </section>
        <section className="ins-modal-card">
          <div className="ins-modal-card-head">
            <h3>Оборудование помещения</h3>
            <span>Всего: {inspectionRoomEquipment.length} позиции</span>
          </div>
          <div className="ins-modal-table-wrap">
            <table className="ins-modal-table">
              <thead>
                <tr>
                  <th>ID / артикул</th>
                  <th>Позиция</th>
                  <th>Тип</th>
                  <th>Кол-во</th>
                  <th>Статус проверки</th>
                  <th>Расхождение</th>
                </tr>
              </thead>
              <tbody>
                {inspectionRoomEquipment.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.id}</strong></td>
                    <td>{item.name}</td>
                    <td>{item.type}</td>
                    <td>{item.qty}</td>
                    <td>{item.status}</td>
                    <td>{item.discrepancy}</td>
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

function AssignOperatorModal({ inspection, selectedOperatorId, setSelectedOperatorId, loading, onSubmit, onClose }) {
  const selectedOperator = inspectionOperators.find((operator) => operator.id === selectedOperatorId);
  return (
    <DesktopModalShell
      size="wide"
      title="Назначить другого оператора"
      subtitle="Выберите сотрудника, который будет выполнять обход на мобильном устройстве"
      onClose={onClose}
      closeDisabled={Boolean(loading)}
      footer={
        <>
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose} disabled={Boolean(loading)}>
            Отмена
          </button>
          <button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={onSubmit} disabled={Boolean(loading) || !selectedOperatorId}>
            Назначить оператора
          </button>
        </>
      }
    >
      {loading ? <LoadingState {...loading} /> : (
        <div className="ins-assign-modal">
          <section className="ins-modal-card ins-assign-summary">
            <div>
              <span className="ins-field-label">Инспекция</span>
              <strong>{inspection.id}</strong>
              <p>{inspection.object} • {inspection.floor} • {inspection.zone}</p>
            </div>
            <div><span>Прогресс</span><strong>{inspection.pct}%</strong></div>
            <div><span>Расхождения</span><strong>{inspection.discrepancies ?? 0}</strong></div>
            <div><span>Синхронизация</span><strong>{inspection.sync.queue}</strong></div>
          </section>
          {selectedOperator ? (
            <div className="ins-modal-note">
              <CheckCircleOutlined />
              <span>{selectedOperator.name} станет основным оператором инспекции. Доступ будет предоставлен после синхронизации данных.</span>
            </div>
          ) : null}
          <div className="ins-operator-list">
            {inspectionOperators.map((operator) => (
              <button
                className={operator.id === selectedOperatorId ? "ins-operator-option ins-operator-option-active" : "ins-operator-option"}
                key={operator.id}
                type="button"
                onClick={() => setSelectedOperatorId(operator.id)}
              >
                <div className={operator.tone === "primary" ? "ins-avatar ins-avatar-primary" : "ins-avatar ins-avatar-gray"}>{operator.initials}</div>
                <div>
                  <strong>{operator.name}</strong>
                  <span>{operator.role} • {operator.availability}</span>
                  <p>{operator.load}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </DesktopModalShell>
  );
}

function CancelInspectionModal({ inspection, reason, setReason, touched, setTouched, loading, onSubmit, onClose }) {
  const invalidReason = touched && reason.trim().length < 10;
  return (
    <DesktopModalShell
      size="wide"
      title="Отменить инспекцию?"
      subtitle="Это действие остановит обход и закроет доступ оператора к заполнению форм."
      onClose={onClose}
      closeDisabled={Boolean(loading)}
      footer={
        <>
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose} disabled={Boolean(loading)}>
            Отмена
          </button>
          <button className="reg-modal-btn reg-modal-btn-danger" type="button" onClick={onSubmit} disabled={Boolean(loading)}>
            Отменить инспекцию
          </button>
        </>
      }
    >
      {loading ? <LoadingState {...loading} /> : (
        <div className="ins-cancel-modal">
          <div className="ins-warning-hero">
            <WarningOutlined />
            <div>
              <strong>{inspection.id} • {inspection.object} • {inspection.floor} • {inspection.zone}</strong>
              <p>Прогресс {inspection.pct}% • {inspection.discrepancies ?? 0} расхождений • {inspection.sync.queue}</p>
            </div>
          </div>
          <section className="ins-modal-card">
            <h3>Что произойдет после отмены</h3>
            <ul className="ins-modal-list">
              <li>Инспекция будет немедленно остановлена и переведена в статус «Отменена».</li>
              <li>Доступ на мобильном устройстве будет закрыт, редактирование станет невозможным.</li>
              <li>Уже синхронизированные данные останутся в системе для отчетности.</li>
            </ul>
          </section>
          <label className="ins-reason-field">
            <span>Причина отмены</span>
            <textarea
              value={reason}
              onBlur={() => setTouched(true)}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Укажите причину отмены. Минимум 10 символов."
            />
          </label>
          {invalidReason ? <p className="ins-validation">Укажите причину отмены. Минимум 10 символов.</p> : null}
        </div>
      )}
    </DesktopModalShell>
  );
}

function ExportStatusModal({ loading, success, visibleCount, totalCount, hasFilters, onClose }) {
  return (
    <DesktopModalShell
      size="narrow"
      title="Экспорт"
      subtitle={hasFilters ? `Экспорт текущей выборки: ${visibleCount} из ${totalCount}` : "Экспорт списка инспекций"}
      onClose={onClose}
      closeDisabled={Boolean(loading)}
      footer={
        success ? (
          <button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={onClose}>
            Закрыть
          </button>
        ) : (
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" disabled={Boolean(loading)} onClick={onClose}>
            Отмена
          </button>
        )
      }
    >
      {loading ? (
        <LoadingState {...loading} />
      ) : (
        <SuccessState title="Экспорт готов" text="Файл будет сформирован backend после подключения API" />
      )}
    </DesktopModalShell>
  );
}

function InspectionHistoryModal({ onClose }) {
  return (
    <DesktopModalShell
      size="wide"
      title="История инспекций"
      subtitle="Последние действия по инспекциям"
      onClose={onClose}
      footer={<button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={onClose}>Закрыть</button>}
    >
      <div className="ins-modal-table-wrap">
        <table className="ins-modal-table">
          <thead>
            <tr>
              <th>Дата / время</th>
              <th>Инспекция</th>
              <th>Действие</th>
              <th>Пользователь</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {INSPECTION_HISTORY.map((item) => (
              <tr key={item.id}>
                <td>{item.time}</td>
                <td><strong>{item.inspection}</strong></td>
                <td>{item.action}</td>
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

export function DesktopInspectionsScreen() {
  const [rows, setRows] = useState(inspectionRows);
  const [selectedId, setSelectedId] = useState(inspectionRows[0]?.id);
  const [modal, setModal] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(null);
  const [success, setSuccess] = useState(null);
  const [assignOperatorId, setAssignOperatorId] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelTouched, setCancelTouched] = useState(false);
  const [filters, setFilters] = useState({
    object: "Все объекты",
    floor: "Все этажи",
    operator: "Все операторы",
    period: "Все периоды",
    chip: "Все",
  });
  const [createForm, setCreateForm] = useState({
    id: "#INS-2024-006",
    title: "Новый обход",
    object: "Корпус А",
    floor: "2 этаж",
    zone: "Приемное отделение",
    type: "Плановая",
    priority: "Средний",
    operatorId: "",
  });
  const timersRef = useRef([]);

  useEffect(() => () => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
  }, []);

  const selectedInspection = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId]
  );

  const visibleRows = useMemo(() => rows.filter((row) => {
    if (filters.object !== "Все объекты" && row.object !== filters.object) return false;
    if (filters.floor !== "Все этажи" && row.floor !== filters.floor) return false;
    if (filters.operator !== "Все операторы") {
      if (filters.operator === "Не назначен" && row.operator?.initials) return false;
      if (filters.operator !== "Не назначен" && row.operator?.fullName !== filters.operator && row.operator?.name !== filters.operator) return false;
    }
    if (filters.period !== "Все периоды" && getPeriod(row) !== filters.period) return false;
    return matchesChip(row, filters.chip);
  }), [filters, rows]);

  const hasFilters = filters.object !== "Все объекты"
    || filters.floor !== "Все этажи"
    || filters.operator !== "Все операторы"
    || filters.period !== "Все периоды"
    || filters.chip !== "Все";

  useEffect(() => {
    if (!visibleRows.length) {
      setSelectedId(null);
      return;
    }
    if (!visibleRows.some((row) => row.id === selectedId)) {
      setSelectedId(visibleRows[0].id);
    }
  }, [selectedId, visibleRows]);

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
    setSelectedRoom(null);
    setSuccess(null);
    setCancelReason("");
    setCancelTouched(false);
  };

  const openDetails = (inspection) => {
    if (!inspection) return;
    setSelectedId(inspection.id);
    setModal("details");
  };

  const selectInspection = (inspection) => {
    setSelectedId(inspection.id);
  };

  const openExport = () => {
    setModal("export");
    setSuccess(null);
    scheduleAction(
      {
        title: "Готовим экспорт",
        text: hasFilters ? "Формируем список инспекций по текущей выборке" : "Формируем список инспекций",
      },
      () => setSuccess("export")
    );
  };

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      object: "Все объекты",
      floor: "Все этажи",
      operator: "Все операторы",
      period: "Все периоды",
      chip: "Все",
    });
  };

  const openAssign = (inspection) => {
    if (!inspection) return;
    setSelectedId(inspection.id);
    setAssignOperatorId(inspection.operatorId || "smirnova");
    setModal("assign");
  };

  const openCancel = (inspection) => {
    if (!inspection) return;
    setSelectedId(inspection.id);
    setCancelReason("");
    setCancelTouched(false);
    setModal("cancel");
  };

  const submitCreate = () => {
    scheduleAction(
      {
        title: "Создаем инспекцию",
        text: "Подготавливаем задание для оператора",
      },
      () => {
        const operator = inspectionOperators.find((item) => item.id === createForm.operatorId);
        const nextRow = {
          id: createForm.id,
          title: createForm.zone,
          object: createForm.object,
          floor: createForm.floor,
          zone: createForm.zone,
          type: createForm.type,
          priority: createForm.priority,
          createdBy: "Диспетчер",
          schedule: "Сегодня, 15:00 — Завтра, 15:00",
          operatorId: operator?.id ?? null,
          operator: operator
            ? { initials: operator.initials, name: operator.name, fullName: operator.name, tone: operator.tone }
            : { initials: null },
          device: operator ? "Доступ после синхронизации" : "Не назначено",
          rooms: "0/12",
          roomsDone: 0,
          roomsTotal: 12,
          items: "0/48",
          itemsDone: 0,
          itemsTotal: 48,
          pct: 0,
          discrepancies: 0,
          sync: { type: "pending", text: "черновик", queue: "0 изменений" },
          status: operator ? "В работе" : "Ожидает назначения",
          rowCls: "ins-tr ins-tr-default",
          lastSync: "—",
          roomsList: [],
        };
        setRows((currentRows) => [nextRow, ...currentRows]);
        setSelectedId(nextRow.id);
        setSuccess("create");
      }
    );
  };

  const submitAssign = () => {
    const operator = inspectionOperators.find((item) => item.id === assignOperatorId);
    if (!operator || !selectedInspection) return;
    scheduleAction(
      {
        title: "Назначаем оператора",
        text: "Обновляем задание инспекции",
      },
      () => {
        setRows((currentRows) => currentRows.map((row) => row.id === selectedInspection.id ? {
          ...row,
          operatorId: operator.id,
          operator: {
            initials: operator.initials,
            name: operator.name,
            fullName: operator.name,
            tone: operator.tone,
          },
          status: row.status === "Ожидает назначения" ? "В работе" : row.status,
          device: "Доступ после синхронизации",
        } : row));
        closeModal();
      }
    );
  };

  const submitCancel = () => {
    setCancelTouched(true);
    if (cancelReason.trim().length < 10 || !selectedInspection) return;
    scheduleAction(
      {
        title: "Отменяем инспекцию",
        text: "Сохраняем причину отмены",
      },
      () => {
        setRows((currentRows) => currentRows.map((row) => row.id === selectedInspection.id ? {
          ...row,
          status: "Отменена",
          rowCls: "ins-tr ins-tr-default",
        } : row));
        closeModal();
      }
    );
  };

  return (
    <div className="ins-screen">
      <div className="ins-action-bar">
        <div className="ins-action-group">
          <button className="ins-btn-primary" type="button" onClick={() => setModal("create")} disabled={Boolean(loading)}>
            <PlusCircleOutlined /> Создать инспекцию
          </button>
          <button className="ins-btn-secondary" type="button" onClick={() => openAssign(selectedInspection)} disabled={Boolean(loading) || !selectedInspection}>
            <UserAddOutlined /> Назначить оператора
          </button>
        </div>
        <div className="ins-action-group">
          <button className="ins-btn-secondary" type="button" onClick={openExport} disabled={Boolean(loading)}>
            <DownloadOutlined /> Экспорт
          </button>
          <button className="ins-btn-secondary" type="button" onClick={() => setModal("history")} disabled={Boolean(loading)}>
            <HistoryOutlined /> История инспекций
          </button>
        </div>
      </div>

      <div className="ins-kpi-grid">
        <div className="ins-kpi-card">
          <p className="ins-kpi-label">Всего</p>
          <div className="ins-kpi-row">
            <span className="ins-kpi-value">{rows.length}</span>
            <span className="ins-kpi-sub">за месяц</span>
          </div>
        </div>
        <div className="ins-kpi-card ins-kpi-card-blue">
          <p className="ins-kpi-label ins-kpi-label-blue">Активные</p>
          <div className="ins-kpi-row">
            <span className="ins-kpi-value">{rows.filter((row) => row.status === "В работе").length}</span>
            <span className="ins-kpi-badge-blue">+12%</span>
          </div>
        </div>
        <div className="ins-kpi-card ins-kpi-card-amber">
          <p className="ins-kpi-label ins-kpi-label-amber">Ожидают</p>
          <span className="ins-kpi-value">{rows.filter((row) => row.status === "Ожидает назначения").length}</span>
        </div>
        <div className="ins-kpi-card ins-kpi-card-green">
          <p className="ins-kpi-label ins-kpi-label-green">Завершено</p>
          <span className="ins-kpi-value">{rows.filter((row) => row.status === "Завершено").length}</span>
        </div>
        <div className="ins-kpi-card ins-kpi-card-rose">
          <p className="ins-kpi-label ins-kpi-label-rose">С расхожд.</p>
          <span className="ins-kpi-value">{rows.filter((row) => row.discrepancies > 0).length}</span>
        </div>
        <div className="ins-kpi-card">
          <p className="ins-kpi-label">Синхронизация</p>
          <div className="ins-kpi-row">
            <span className="ins-kpi-value">{rows.filter((row) => row.sync.type === "pending" || row.sync.type === "error").length}</span>
            <span className="ins-kpi-sub">в оч.</span>
          </div>
        </div>
      </div>

      <div className="ins-content-grid">
        <div className="ins-main-col">
          <div className="ins-filters-card">
            <div className="ins-filters-selects">
              <div className="ins-filter-field">
                <span className="ins-filter-label">Объект</span>
                <select className="ins-select" value={filters.object} onChange={(event) => updateFilter("object", event.target.value)}>
                  <option>Все объекты</option>
                  <option>Корпус А</option>
                  <option>Корпус Б</option>
                  <option>Склад временного хранения</option>
                </select>
              </div>
              <div className="ins-filter-field">
                <span className="ins-filter-label">Этаж</span>
                <select className="ins-select" value={filters.floor} onChange={(event) => updateFilter("floor", event.target.value)}>
                  <option>Все этажи</option>
                  <option>1 этаж</option>
                  <option>2 этаж</option>
                </select>
              </div>
              <div className="ins-filter-field">
                <span className="ins-filter-label">Оператор</span>
                <select className="ins-select" value={filters.operator} onChange={(event) => updateFilter("operator", event.target.value)}>
                  <option>Все операторы</option>
                  <option>Иван Иванов</option>
                  <option>Анна Смирнова</option>
                  <option>Пётр Смирнов</option>
                  <option>Мария Кузнецова</option>
                  <option>Не назначен</option>
                </select>
              </div>
              <div className="ins-filter-field">
                <span className="ins-filter-label">Период</span>
                <select className="ins-select" value={filters.period} onChange={(event) => updateFilter("period", event.target.value)}>
                  <option>Все периоды</option>
                  <option>Сегодня</option>
                  <option>Вчера</option>
                  <option>Неделя</option>
                </select>
              </div>
            </div>
            <div className="ins-filter-chips-row">
              <div className="ins-filter-chips">
                {["Все", "Активные", "Ожидают назначения", "В работе", "С расхождениями", "Завершено", "Без оператора"].map((chip) => (
                  <button
                    className={filters.chip === chip ? "ins-chip ins-chip-active" : "ins-chip"}
                    type="button"
                    key={chip}
                    onClick={() => updateFilter("chip", chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <button className="ins-reset-btn" type="button" onClick={resetFilters}>
                <ReloadOutlined style={{ fontSize: 11 }} /> Сбросить
              </button>
            </div>
          </div>

          <InspectionsTable
            rows={visibleRows}
            totalRows={rows.length}
            selectedId={selectedId}
            onSelect={selectInspection}
            onOpenDetails={openDetails}
            onAssign={openAssign}
          />
        </div>

        <aside className="ins-right-col">
          <DetailPanel inspection={selectedInspection} onOpenDetails={openDetails} onAssign={openAssign} onCancel={openCancel} />
          <div className="ins-widgets">
            <AttentionWidget rows={rows} />
            <ActivityPanel />
          </div>
        </aside>
      </div>

      {modal === "create" ? (
        <CreateInspectionModal
          loading={loading}
          success={success === "create"}
          form={createForm}
          setForm={setCreateForm}
          onSubmit={submitCreate}
          onClose={closeModal}
        />
      ) : null}
      {modal === "export" ? (
        <ExportStatusModal
          loading={loading}
          success={success === "export"}
          visibleCount={visibleRows.length}
          totalCount={rows.length}
          hasFilters={hasFilters}
          onClose={closeModal}
        />
      ) : null}
      {modal === "history" ? (
        <InspectionHistoryModal onClose={closeModal} />
      ) : null}
      {modal === "details" && selectedInspection ? (
        <InspectionDetailsModal
          inspection={selectedInspection}
          onClose={closeModal}
          onOpenRoom={(room) => {
            setSelectedRoom(room);
            setModal("room");
          }}
          onAssign={openAssign}
          onCancel={openCancel}
        />
      ) : null}
      {modal === "room" && selectedRoom && selectedInspection ? (
        <RoomDetailsModal room={selectedRoom} inspection={selectedInspection} onClose={closeModal} />
      ) : null}
      {modal === "assign" && selectedInspection ? (
        <AssignOperatorModal
          inspection={selectedInspection}
          selectedOperatorId={assignOperatorId}
          setSelectedOperatorId={setAssignOperatorId}
          loading={loading}
          onSubmit={submitAssign}
          onClose={closeModal}
        />
      ) : null}
      {modal === "cancel" && selectedInspection ? (
        <CancelInspectionModal
          inspection={selectedInspection}
          reason={cancelReason}
          setReason={setCancelReason}
          touched={cancelTouched}
          setTouched={setCancelTouched}
          loading={loading}
          onSubmit={submitCancel}
          onClose={closeModal}
        />
      ) : null}
    </div>
  );
}
