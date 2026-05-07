import {
  CheckCircleOutlined,
  DownloadOutlined,
  FileTextOutlined,
  FilterOutlined,
  HistoryOutlined,
  MoreOutlined,
  PlusCircleOutlined,
  RightOutlined,
} from "@ant-design/icons";

const ACTION_ICONS = {
  create: PlusCircleOutlined,
  export: DownloadOutlined,
  filter: FilterOutlined,
  history: HistoryOutlined,
  file: FileTextOutlined,
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
  if (label.includes("История")) {
    return ACTION_ICONS.history;
  }
  if (label.includes("Шаблон")) {
    return ACTION_ICONS.file;
  }
  return index === 0 ? CheckCircleOutlined : MoreOutlined;
}

export function getDesktopStatusToneClass(value, fallback = "") {
  const status = String(value ?? "").toLowerCase();

  if (status.includes("ошиб") || status.includes("критич") || status.includes("расхожд")) {
    return "is-error";
  }
  if (
    status.includes("проверить") ||
    status.includes("ожида") ||
    status.includes("назнач") ||
    status.includes("приемк") ||
    status.includes("приёмк")
  ) {
    return "is-warning";
  }
  if (status.includes("готов") || status.includes("заверш") || status.includes("успеш") || status.includes("на месте")) {
    return "is-success";
  }
  if (status.includes("не начато") || status.includes("нет ") || status === "—") {
    return "is-muted";
  }

  return fallback;
}

export function DesktopActions({ actions = [], links = [] }) {
  if (actions.length === 0 && links.length === 0) {
    return null;
  }

  return (
    <div className="desktop-screen-actions" aria-label="Действия раздела">
      <div className="desktop-screen-actions-main">
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
      {links.length > 0 ? (
        <div className="desktop-screen-actions-links">
          {links.map((action, index) => {
            const Icon = getActionIcon(action, index);
            return (
              <button className="desktop-screen-link-action" key={action} type="button">
                <Icon aria-hidden="true" />
                <span>{action}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function DesktopPanel({ title, action, actionIcon = false, headerExtra, children, className = "" }) {
  if (!title) {
    return null;
  }

  return (
    <section className={`desktop-data-card${className ? ` ${className}` : ""}`}>
      <div className="desktop-data-card-header">
        <h2>{title}</h2>
        {headerExtra ?? null}
        {action ? (
          <button type="button">
            {action}
            {actionIcon ? <RightOutlined aria-hidden="true" /> : null}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function DesktopDataTable({ title, columns = [], rows = [], statusColumnIndex, enableSemanticColors = false }) {
  if (!title || columns.length === 0) {
    return null;
  }

  const pillIndex = statusColumnIndex ?? columns.length - 1;

  return (
    <DesktopPanel title={title} action="Открыть" actionIcon className="desktop-data-card-main">
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
                    {index === pillIndex ? (
                      <span className={`desktop-status-pill ${enableSemanticColors ? getDesktopStatusToneClass(cell) : ""}`.trim()}>{cell}</span>
                    ) : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DesktopPanel>
  );
}

export function DesktopSidePanel({ title, items = [] }) {
  if (!title || items.length === 0) {
    return null;
  }

  return (
    <DesktopPanel title={title} className="desktop-side-panel">
      <div className="desktop-side-list">
        {items.map((item) => (
          <button key={item} type="button">
            <span>{item}</span>
            <RightOutlined aria-hidden="true" />
          </button>
        ))}
      </div>
    </DesktopPanel>
  );
}

export function DesktopBottomPanels({ panels = [] }) {
  if (panels.length === 0) {
    return null;
  }

  return (
    <div className="desktop-bottom-panels">
      {panels.map((panel) => (
        <DesktopPanel
          title={panel.title}
          headerExtra={panel.summary ? <span>{panel.summary}</span> : null}
          className="desktop-bottom-panel"
          key={panel.title}
        >
          <div className="desktop-bottom-list">
            {panel.items.map((item) => (
              <article className={`desktop-bottom-item tone-${item.tone ?? "blue"}`} key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.meta}</span>
              </article>
            ))}
          </div>
        </DesktopPanel>
      ))}
    </div>
  );
}
