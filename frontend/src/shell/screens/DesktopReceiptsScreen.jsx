import { DesktopActions, DesktopBottomPanels, DesktopDataTable } from "../components/DesktopPanel.jsx";
import { DesktopFilterBar } from "../components/DesktopFilterBar.jsx";
import { DesktopStatsGrid } from "../components/DesktopStatCard.jsx";
import { receiptsScreenData } from "../data/receiptsScreenData.js";
import "../styles/desktopScreenCommon.css";
import "../styles/receiptsScreen.css";

export function DesktopReceiptsScreen({ screen = receiptsScreenData }) {
  return (
    <div className="desktop-screen desktop-receipts-screen">
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
