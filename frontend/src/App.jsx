import { ConfigProvider } from "antd";
import { useEffect, useState } from "react";
import { MobileShell } from "./mobile/MobileShell.jsx";
import { clearDesktopSession, getDesktopSession, saveDesktopSession } from "./services/session/sessionService.js";
import { DesktopLoginScreen } from "./shell/screens/DesktopLoginScreen.jsx";
import { DesktopShell } from "./shell/DesktopShell.jsx";

const MOBILE_VIEWPORT_QUERY = "(max-width: 767px)";

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia(MOBILE_VIEWPORT_QUERY).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_VIEWPORT_QUERY);
    const handleChange = (event) => setIsMobile(event.matches);

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
}

function App() {
  const isMobile = useIsMobileViewport();
  const [desktopSession, setDesktopSession] = useState(() => getDesktopSession());

  const handleDesktopLogin = (session) => {
    setDesktopSession(session);
    saveDesktopSession(session);
  };

  const handleDesktopLogout = () => {
    setDesktopSession(null);
    clearDesktopSession();
  };

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
      {isMobile ? (
        <MobileShell />
      ) : desktopSession?.authenticated ? (
        <DesktopShell session={desktopSession} onLogout={handleDesktopLogout} />
      ) : (
        <DesktopLoginScreen onLogin={handleDesktopLogin} />
      )}
    </ConfigProvider>
  );
}

export default App;
