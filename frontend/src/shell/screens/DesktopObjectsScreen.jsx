import { DesktopActions, DesktopPanel } from "../components/DesktopPanel.jsx";
import { DesktopFilterBar } from "../components/DesktopFilterBar.jsx";
import { DesktopStatsGrid } from "../components/DesktopStatCard.jsx";
import { DesktopTimeline } from "../components/DesktopTimeline.jsx";
import { objectsScreenData } from "../data/objectsScreenData.js";
import "../styles/desktopScreenCommon.css";
import "../styles/objectsScreen.css";

function ObjectsTreeTable({ title, columns = [], rows = [] }) {
  if (!title || columns.length === 0) {
    return null;
  }

  return (
    <DesktopPanel title={title} className="desktop-data-card-main">
      <div className="desktop-table-wrap">
        <table className="desktop-data-table desktop-tree-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className={`desktop-tree-level-${row.level}${row.active ? " is-active" : ""}`} key={row.name}>
                <td>
                  <span className="desktop-tree-name">
                    <span className="desktop-tree-marker" aria-hidden="true" />
                    {row.name}
                  </span>
                </td>
                <td>{row.type}</td>
                <td>{row.rooms}</td>
                <td>{row.equipment}</td>
                <td>
                  <div className="desktop-progress-meter is-compact">
                    <span style={{ width: `${row.progress}%` }} />
                  </div>
                </td>
                <td><span className={row.discrepancies > 0 ? "desktop-error-text" : ""}>{row.discrepancies}</span></td>
                <td><span className="desktop-status-pill">{row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DesktopPanel>
  );
}

function DetailPanel({ panel }) {
  if (!panel) {
    return null;
  }

  return (
    <section className="desktop-data-card desktop-detail-panel">
      <div className="desktop-detail-hero">
        <span>{panel.label}</span>
        <h2>{panel.title}</h2>
        <div className="desktop-detail-metrics">
          {panel.metrics.map((metric) => (
            <div className={metric.tone ? `tone-${metric.tone}` : ""} key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="desktop-detail-fields">
        {panel.fields.map((field) => (
          <div key={field.label}>
            <span>{field.label}</span>
            <strong>{field.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function ObjectAside({ screen }) {
  return (
    <div className="desktop-object-aside">
      <DetailPanel panel={screen.detailPanel} />
      {screen.attentionPanel ? (
        <DesktopPanel title={screen.attentionPanel.title} className="desktop-attention-panel">
          <div className="desktop-bottom-list">
            {screen.attentionPanel.items.map((item) => (
              <article className={`desktop-bottom-item tone-${item.tone ?? "red"}`} key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.meta}</span>
              </article>
            ))}
          </div>
        </DesktopPanel>
      ) : null}
      {screen.timeline ? <DesktopTimeline title={screen.timeline.title} items={screen.timeline.items} /> : null}
    </div>
  );
}

export function DesktopObjectsScreen({ screen = objectsScreenData }) {
  return (
    <div className="desktop-screen desktop-screen-objects">
      <DesktopActions actions={screen.actions} links={screen.actionLinks} />
      <DesktopStatsGrid stats={screen.stats} />
      <DesktopFilterBar filters={screen.filters} quickFilters={screen.quickFilters} />

      <div className="desktop-objects-grid">
        <ObjectsTreeTable title={screen.primaryTitle} columns={screen.primaryColumns} rows={screen.treeRows} />
        <ObjectAside screen={screen} />
      </div>
    </div>
  );
}
