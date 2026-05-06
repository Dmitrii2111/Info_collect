import { DESKTOP_SCREEN_DATA } from "./desktopScreenData.js";
import { DesktopActions, DesktopDataTable, DesktopSidePanel } from "./components/DesktopPanel.jsx";
import { DesktopStatsGrid } from "./components/DesktopStatCard.jsx";
import { DesktopDashboardScreen } from "./screens/DesktopDashboardScreen.jsx";
import { DesktopObjectsScreen } from "./screens/DesktopObjectsScreen.jsx";
import { DesktopRegistryScreen } from "./screens/DesktopRegistryScreen.jsx";

const SCREEN_COMPONENTS = {
  dashboard: DesktopDashboardScreen,
  registry: DesktopRegistryScreen,
  objects: DesktopObjectsScreen,
};

function GenericDesktopScreen({ screen }) {
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

export function DesktopScreen({ sectionKey }) {
  const screenKey = DESKTOP_SCREEN_DATA[sectionKey] ? sectionKey : "registry";
  const ScreenComponent = SCREEN_COMPONENTS[screenKey] ?? GenericDesktopScreen;

  return <ScreenComponent screen={DESKTOP_SCREEN_DATA[screenKey]} />;
}
