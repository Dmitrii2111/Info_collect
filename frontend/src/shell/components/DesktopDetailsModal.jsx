import {
  ApartmentOutlined,
  AuditOutlined,
  CameraOutlined,
  CloudSyncOutlined,
  DatabaseOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  SwapRightOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { DesktopModalShell } from "./DesktopModalShell";

export function DesktopDetailsModal({ details, onClose }) {
  return (
    <DesktopModalShell
      onClose={onClose}
      size="xwide"
      headerClassName="reg-equipment-header"
      headerContent={(
        <div className="reg-equipment-title-wrap">
          <div className="reg-equipment-avatar">{details.initials}</div>
          <div>
            <h2 className="reg-modal-title" id="desktop-modal-title">{details.title}</h2>
            <p className="reg-modal-subtitle">{details.subtitle}</p>
          </div>
        </div>
      )}
      footer={(
        <>
          <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={onClose}>Закрыть</button>
          <button className="reg-modal-btn reg-modal-btn-primary" type="button">Открыть историю перемещений</button>
        </>
      )}
    >
      <div className="reg-equipment-status-row">
        <span className="reg-chip reg-chip-warning"><WarningOutlined aria-hidden="true" /> С расхождением</span>
        <span className="reg-chip reg-chip-primary"><AuditOutlined aria-hidden="true" /> В инспекции</span>
        <span className="reg-chip reg-chip-muted"><CloudSyncOutlined aria-hidden="true" /> 1 не отправлено</span>
      </div>

      <div className="reg-equipment-grid">
        <section className="reg-detail-card">
          <h3><EnvironmentOutlined aria-hidden="true" /> Местоположение</h3>
          <strong>2.01.29 — Кабинет врача</strong>
          <span>Корпус A • Этаж 2</span>
          <div className="reg-detail-two">
            <div><small>Кол-во по реестру</small><b>1 шт.</b></div>
            <div><small>Проверка</small><b>выполнена</b></div>
          </div>
        </section>

        <section className="reg-detail-card">
          <h3><DatabaseOutlined aria-hidden="true" /> Данные из реестра</h3>
          <dl className="reg-data-list">
            <div><dt>ID</dt><dd>EQ-201-02</dd></div>
            <div><dt>Наименование</dt><dd>Щит освещения ЩО-1</dd></div>
            <div><dt>Тип</dt><dd>Электрика</dd></div>
            <div><dt>Поставщик</dt><dd>ЭлектроСнаб</dd></div>
            <div><dt>Кол-во / Партия</dt><dd>1 (EL-22)</dd></div>
            <div><dt>Источник</dt><dd>Реестр оборудования</dd></div>
          </dl>
        </section>

        <section className="reg-detail-card reg-inspection-card">
          <h3><AuditOutlined aria-hidden="true" /> Инспекция</h3>
          <div className="reg-operator-row">
            <div className="reg-equipment-avatar reg-avatar-small">ИИ</div>
            <div><strong>Иван Иванов</strong><span>Оператор инспекции</span></div>
            <time>Сегодня, 09:31</time>
          </div>
          <div className="reg-photo-box">
            <CameraOutlined aria-hidden="true" />
            <span>Фотоматериалы</span>
            <strong>1 фото</strong>
          </div>
          <p className="reg-comment">"Отсутствует маркировка..."</p>
        </section>

        <section className="reg-detail-card reg-discrepancy-card">
          <div className="reg-discrepancy-head">
            <h3><ExclamationCircleOutlined aria-hidden="true" /> Критично</h3>
            <span>Статус: Новое</span>
          </div>
          <p>Маркировочная табличка повреждена или отсутствует на лицевой панели щита.</p>
          <div className="reg-detail-two">
            <div><small>Ожидалось:</small><b>SN-90831</b></div>
            <div><small>Найдено:</small><b>отсутствует</b></div>
          </div>
          <div className="reg-inline-actions">
            <button type="button">Открыть детали</button>
            <button type="button">Решить расхождение</button>
          </div>
        </section>

        <section className="reg-detail-card">
          <h3><ApartmentOutlined aria-hidden="true" /> Связанные данные</h3>
          <div className="reg-linked-list">
            <span>Помещение</span>
            <span>Инспекция</span>
            <span>Расхождение</span>
          </div>
        </section>

        <section className="reg-detail-card">
          <h3><SwapRightOutlined aria-hidden="true" /> Склад и перемещения</h3>
          <span>Текущий складской остаток: нет</span>
          <div className="reg-movement-row">
            <b>Склад Б</b>
            <SwapRightOutlined aria-hidden="true" />
            <b>2.01.29</b>
          </div>
          <small>Дата: вчера, 16:10</small>
        </section>

        <section className="reg-detail-card reg-sync-card">
          <h3><CloudSyncOutlined aria-hidden="true" /> Синхронизация</h3>
          <strong>1 изменение</strong>
          <span>Есть изменения в очереди на отправку</span>
          <small>Обновлено: 09:42 • В очереди</small>
        </section>
      </div>
    </DesktopModalShell>
  );
}
