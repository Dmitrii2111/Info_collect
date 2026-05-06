import { FileTextOutlined } from "@ant-design/icons";
import { DesktopActions, DesktopBottomPanels, DesktopDataTable } from "../components/DesktopPanel.jsx";
import { DesktopFilterBar } from "../components/DesktopFilterBar.jsx";
import { DesktopStatsGrid } from "../components/DesktopStatCard.jsx";
import { registryScreenData } from "../data/registryScreenData.js";
import "../styles/desktopScreenCommon.css";
import "../styles/registryScreen.css";

function RegistryStatusCard({ card }) {
  if (!card) {
    return null;
  }

  return (
    <section className="desktop-registry-status-card">
      <div className="desktop-registry-status-icon" aria-hidden="true">
        <FileTextOutlined />
      </div>
      <div className="desktop-registry-status-body">
        <h2>{card.title}</h2>
        <div className="desktop-registry-status-stats">
          {card.stats.map((item) => (
            <span key={item.label}>
              {item.label}: <strong>{item.value}</strong>
            </span>
          ))}
        </div>
      </div>
      <div className="desktop-registry-status-actions">
        {card.actions.map((action, index) => (
          <button className={index === 0 ? "is-warning" : ""} key={action} type="button">
            {action}
          </button>
        ))}
      </div>
    </section>
  );
}

export function DesktopRegistryScreen({ screen = registryScreenData }) {
  return (
    <div className="desktop-screen desktop-registry-screen">
      <DesktopActions actions={screen.actions} links={screen.actionLinks} />
      <DesktopStatsGrid stats={screen.stats} />
      <RegistryStatusCard card={screen.statusCard} />
      <DesktopFilterBar filters={screen.filters} quickFilters={screen.quickFilters} />
      <DesktopDataTable
        title={screen.primaryTitle}
        columns={screen.primaryColumns}
        rows={screen.primaryRows}
        statusColumnIndex={screen.statusColumnIndex}
      />
      <DesktopBottomPanels panels={screen.bottomPanels} />
    </div>
  );
}
