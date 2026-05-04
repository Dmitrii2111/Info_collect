import {
  CheckCircleOutlined,
  DownloadOutlined,
  FilterOutlined,
  MoreOutlined,
  PlusCircleOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { DESKTOP_SCREEN_DATA } from "./desktopScreenData.js";

const ACTION_ICONS = {
  create: PlusCircleOutlined,
  export: DownloadOutlined,
  filter: FilterOutlined,
};

function getActionIcon(label, index) {
  if (label.includes("Создать") || label.includes("Добавить") || label.includes("Импорт")) {
    return ACTION_ICONS.create;
  }
  if (label.includes("Экспорт")) {
    return ACTION_ICONS.export;
  }
  if (label.includes("Фильтр")) {
    return ACTION_ICONS.filter;
  }
  return index === 0 ? CheckCircleOutlined : MoreOutlined;
}

function Actions({ actions }) {
  return (
    <div className="desktop-screen-actions" aria-label="Действия раздела">
      {actions.map((action, index) => {
        const Icon = getActionIcon(action, index);
        return (
          <button
            className={`desktop-screen-action${index === 0 ? " is-primary" : ""}`}
            key={action}
            type="button"
          >
            <Icon aria-hidden="true" />
            <span>{action}</span>
          </button>
        );
      })}
    </div>
  );
}

function StatCard({ stat }) {
  return (
    <article className={`desktop-stat-card tone-${stat.tone}`}>
      <span>{stat.label}</span>
      <strong>{stat.value}</strong>
      <small>{stat.detail}</small>
    </article>
  );
}

function DataTable({ title, columns, rows }) {
  return (
    <section className="desktop-data-card desktop-data-card-main">
      <div className="desktop-data-card-header">
        <h2>{title}</h2>
        <button type="button">
          Открыть
          <RightOutlined aria-hidden="true" />
        </button>
      </div>

      <div className="desktop-table-wrap">
        <table className="desktop-data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join("-")}>
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`}>
                    {index === row.length - 1 ? <span className="desktop-status-pill">{cell}</span> : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SidePanel({ title, items }) {
  return (
    <section className="desktop-data-card desktop-side-panel">
      <div className="desktop-data-card-header">
        <h2>{title}</h2>
      </div>

      <div className="desktop-side-list">
        {items.map((item) => (
          <button key={item} type="button">
            <span>{item}</span>
            <RightOutlined aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}

export function DesktopScreen({ sectionKey }) {
  const screen = DESKTOP_SCREEN_DATA[sectionKey] ?? DESKTOP_SCREEN_DATA.registry;

  return (
    <div className="desktop-screen">
      <Actions actions={screen.actions} />

      <div className="desktop-stats-grid">
        {screen.stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <div className="desktop-screen-grid">
        <DataTable
          title={screen.primaryTitle}
          columns={screen.primaryColumns}
          rows={screen.primaryRows}
        />
        <SidePanel title={screen.secondaryTitle} items={screen.secondaryItems} />
      </div>
    </div>
  );
}
