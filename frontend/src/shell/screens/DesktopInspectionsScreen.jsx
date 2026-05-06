import { DesktopActions, DesktopBottomPanels, DesktopDataTable } from "../components/DesktopPanel.jsx";
import { DesktopFilterBar } from "../components/DesktopFilterBar.jsx";
import { DesktopStatsGrid } from "../components/DesktopStatCard.jsx";
import { inspectionsScreenData } from "../data/inspectionsScreenData.js";
import "../styles/desktopScreenCommon.css";
import "../styles/inspectionsScreen.css";

export function DesktopInspectionsScreen({ screen = inspectionsScreenData }) {
  return (
    <div className="desktop-screen desktop-inspections-screen">
      <DesktopActions actions={screen.actions} links={screen.actionLinks} />
      <DesktopStatsGrid stats={screen.stats} />
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
