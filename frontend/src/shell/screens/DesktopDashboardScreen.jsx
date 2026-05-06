import { DesktopActions, DesktopPanel } from "../components/DesktopPanel.jsx";
import { DesktopStatsGrid } from "../components/DesktopStatCard.jsx";
import { DesktopTimeline } from "../components/DesktopTimeline.jsx";
import { dashboardScreenData } from "../data/dashboardScreenData.js";
import "../styles/desktopScreenCommon.css";
import "../styles/dashboardScreen.css";

function DashboardProgressPanels({ panels = [] }) {
  if (panels.length === 0) {
    return null;
  }

  return (
    <div className="desktop-dashboard-panels">
      {panels.map((panel) => (
        <DesktopPanel title={panel.title} action={panel.action} className="desktop-progress-card" key={panel.title}>
          <div className="desktop-progress-list">
            {panel.rows.map((row) => (
              <article className={`desktop-progress-row tone-${row.tone ?? "blue"}`} key={row.title}>
                <div>
                  <strong>{row.title}</strong>
                  <span>{row.meta}</span>
                </div>
                {typeof row.progress === "number" ? (
                  <div className="desktop-progress-meter" aria-label={`${row.progress}%`}>
                    <span style={{ width: `${row.progress}%` }} />
                  </div>
                ) : null}
                <small>{row.status}</small>
              </article>
            ))}
          </div>
        </DesktopPanel>
      ))}
    </div>
  );
}

export function DesktopDashboardScreen({ screen = dashboardScreenData }) {
  return (
    <div className="desktop-screen">
      <DesktopActions actions={screen.actions} links={screen.actionLinks} />
      <DesktopStatsGrid stats={screen.stats} />

      <div className="desktop-screen-grid">
        <DashboardProgressPanels panels={screen.progressPanels} />
        {screen.timeline ? (
          <DesktopTimeline title={screen.timeline.title} items={screen.timeline.items} action={screen.timeline.action} />
        ) : null}
      </div>
    </div>
  );
}
