import { DESKTOP_SCREEN_DATA } from "./desktopScreenData.js";
import { DesktopActions, DesktopDataTable, DesktopSidePanel } from "./components/DesktopPanel.jsx";
import { DesktopStatsGrid } from "./components/DesktopStatCard.jsx";
import { DesktopDashboardScreen } from "./screens/DesktopDashboardScreen.jsx";
import { DesktopDiscrepanciesScreen } from "./screens/DesktopDiscrepanciesScreen.jsx";
import { DesktopHistoryScreen } from "./screens/DesktopHistoryScreen.jsx";
import { DesktopInspectionsScreen } from "./screens/DesktopInspectionsScreen.jsx";
import { DesktopObjectsScreen } from "./screens/DesktopObjectsScreen.jsx";
import { DesktopReceiptsScreen } from "./screens/DesktopReceiptsScreen.jsx";
import { DesktopRegistryScreen } from "./screens/DesktopRegistryScreen.jsx";
import { DesktopReportsScreen } from "./screens/DesktopReportsScreen.jsx";
import { DesktopSyncScreen } from "./screens/DesktopSyncScreen.jsx";
import { DesktopWarehouseScreen } from "./screens/DesktopWarehouseScreen.jsx";

function GenericDesktopScreen({ screen }) {
  if (!screen) return null;
  return (
    <div className="desktop-screen">
      <DesktopActions actions={screen.actions} links={screen.actionLinks} />
      <DesktopStatsGrid stats={screen.stats} />
      <div className="desktop-screen-grid">
        <DesktopDataTable
          title={screen.primaryTitle}
          columns={screen.primaryColumns}
          rows={screen.primaryRows}
          statusColumnIndex={screen.statusColumnIndex}
        />
        <DesktopSidePanel title={screen.secondaryTitle} items={screen.secondaryItems} />
      </div>
    </div>
  );
}

const SCREEN_COMPONENTS = {
  dashboard: DesktopDashboardScreen,
  registry: DesktopRegistryScreen,
  objects: DesktopObjectsScreen,
  inspections: DesktopInspectionsScreen,
  warehouse: DesktopWarehouseScreen,
  receipts: DesktopReceiptsScreen,
  discrepancies: DesktopDiscrepanciesScreen,
  sync: DesktopSyncScreen,
  history: DesktopHistoryScreen,
  reports: DesktopReportsScreen,
};

export function DesktopScreen({ sectionKey }) {
  const ScreenComponent = SCREEN_COMPONENTS[sectionKey];
  if (ScreenComponent) {
    return <ScreenComponent screen={DESKTOP_SCREEN_DATA[sectionKey]} />;
  }
  return <GenericDesktopScreen screen={DESKTOP_SCREEN_DATA[sectionKey]} />;
}
