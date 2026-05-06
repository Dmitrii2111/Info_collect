import {
  ApartmentOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  InboxOutlined,
  SyncOutlined,
  WarningOutlined,
} from "@ant-design/icons";

const STAT_ICONS = {
  objects: ApartmentOutlined,
  inspections: AuditOutlined,
  rooms: DatabaseOutlined,
  warehouse: InboxOutlined,
  discrepancies: WarningOutlined,
  sync: SyncOutlined,
  registry: FileTextOutlined,
  default: CheckCircleOutlined,
};

export function DesktopStatsGrid({ stats = [] }) {
  if (stats.length === 0) {
    return null;
  }

  return (
    <div className={`desktop-stats-grid desktop-stats-grid-${stats.length}`}>
      {stats.map((stat) => (
        <DesktopStatCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
}

export function DesktopStatCard({ stat }) {
  const Icon = STAT_ICONS[stat.icon] ?? STAT_ICONS.default;

  return (
    <article className={`desktop-stat-card tone-${stat.tone}${stat.attention ? " is-attention" : ""}`}>
      {stat.icon ? (
        <div className="desktop-stat-icon" aria-hidden="true">
          <Icon />
        </div>
      ) : null}
      <span>{stat.label}</span>
      <strong>{stat.value}</strong>
      {stat.detail ? <small>{stat.detail}</small> : null}
    </article>
  );
}
