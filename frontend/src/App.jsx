import { ConfigProvider } from "antd";
import { DesktopShell } from "./shell/DesktopShell.jsx";

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#0037a8",
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
