import { ConfigProvider } from "antd";
import { DesktopShell } from "./shell/DesktopShell.jsx";

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#00288e",
          borderRadius: 8,
          fontFamily: 'Inter, "Segoe UI", Tahoma, sans-serif',
        },
      }}
    >
      <DesktopShell />
    </ConfigProvider>
  );
}

export default App;
