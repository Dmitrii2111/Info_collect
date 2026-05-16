import {
  ApartmentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusCircleOutlined,
  RightOutlined,
  ScanOutlined,
  SyncOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";
import { MobileHeader } from "../components/MobileHeader.jsx";
import { mobileDashboardData } from "../data/mobileMockData.js";

const quickActionIcons = {
  rooms: ApartmentOutlined,
  scan: ScanOutlined,
  discrepancies: WarningOutlined,
  sync: SyncOutlined,
};

const recentActionIcons = {
  success: CheckCircleOutlined,
  primary: PlusCircleOutlined,
  error: WarningOutlined,
};

export function MobileDashboardScreen({
  activeNavKey,
  onOpenDiscrepancies,
  onOpenSync,
  onNavSelect,
}) {
  const data = mobileDashboardData;
  const walk = data.currentWalkthrough;

  return (
    <div className="mobile-dashboard-screen">
      <MobileHeader title="InfoCollect" />

      <main className="mobile-dashboard-content">
        <section className="mobile-dashboard-intro">
          <h2>Проверка помещений и оборудования</h2>
          <div className="mobile-chip-row">
            <span className="mobile-chip is-success">
              <CheckCircleOutlined aria-hidden="true" />
              {data.syncSummary.status}
            </span>
            <span className="mobile-chip">
              <ClockCircleOutlined aria-hidden="true" />
              {data.syncSummary.pending}
            </span>
          </div>
          <div className="mobile-operator-card">
            <div className="mobile-avatar" aria-hidden="true">
              {data.operator.initials}
            </div>
            <div>
              <strong>{data.operator.name}</strong>
              <span>{data.operator.role}</span>
            </div>
          </div>
        </section>

        <section className="mobile-card mobile-current-card">
          <div className="mobile-current-accent" aria-hidden="true" />
          <div className="mobile-section-title-row">
            <h3>{walk.title}</h3>
            <ApartmentOutlined aria-hidden="true" />
          </div>
          <p>{walk.location}</p>
          <div className="mobile-progress-label">
            <span>
              {walk.checkedRooms} из {walk.totalRooms} помещений проверено
            </span>
            <strong>{walk.progress}%</strong>
          </div>
          <div className="mobile-progress-track" aria-hidden="true">
            <span style={{ width: `${walk.progress}%` }} />
          </div>
          <div className="mobile-stat-grid">
            <div>
              <strong>{walk.totalRooms}</strong>
              <span>помещения</span>
            </div>
            <div>
              <strong className="is-success">{walk.checkedRooms}</strong>
              <span>проверено</span>
            </div>
            <div className="is-error-soft">
              <strong className="is-error">{walk.discrepancies}</strong>
              <span>расхождений</span>
            </div>
            <div className="is-primary-soft">
              <strong>{walk.pendingChanges}</strong>
              <span>изменений</span>
            </div>
          </div>
          <button className="mobile-primary-button" type="button">
            Продолжить обход
            <RightOutlined aria-hidden="true" />
          </button>
        </section>

        <section className="mobile-dashboard-section">
          <h3>Мои зоны</h3>
          <div className="mobile-zone-list">
            {data.zones.map((zone) => (
              <article className={`mobile-zone-card is-${zone.tone}`} key={zone.title}>
                <div>
                  <strong>{zone.title}</strong>
                  <span>
                    <ApartmentOutlined aria-hidden="true" />
                    {zone.progress}
                  </span>
                </div>
                <em>{zone.status}</em>
              </article>
            ))}
          </div>
        </section>

        <section className="mobile-dashboard-section">
          <h3>Быстрые действия</h3>
          <div className="mobile-quick-actions">
            {data.quickActions.map((action) => {
              const Icon = quickActionIcons[action.key];

              return (
                <button
                  className={`is-${action.tone}`}
                  type="button"
                  key={action.key}
                  onClick={
                    action.key === "discrepancies"
                      ? onOpenDiscrepancies
                      : action.key === "sync"
                        ? onOpenSync
                        : undefined
                  }
                >
                  <Icon aria-hidden="true" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mobile-dashboard-section mobile-recent-section">
          <h3>Последние действия</h3>
          <ul className="mobile-recent-list">
            {data.recentActions.map((action) => {
              const Icon = recentActionIcons[action.tone];

              return (
                <li key={action.key} className={`is-${action.tone}`}>
                  <Icon aria-hidden="true" />
                  <span>{action.text}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />
    </div>
  );
}
