import { useState } from "react";
import { CheckCircleOutlined, ToolOutlined, WarningOutlined } from "@ant-design/icons";

const DEFAULT_SERVER = "http://192.168.1.10:8000";

export function DesktopLoginScreen({ onLogin }) {
  const [server, setServer] = useState(DEFAULT_SERVER);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState({
    status: "idle",
    text: "Сервер не проверен",
  });
  const [nextCheckSuccess, setNextCheckSuccess] = useState(true);

  const handleCheckConnection = () => {
    const isSuccess = nextCheckSuccess;
    setNextCheckSuccess((current) => !current);
    setConnectionStatus({
      status: isSuccess ? "success" : "error",
      text: isSuccess ? "Сервер доступен" : "Не удалось проверить подключение",
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!userName.trim() || !password.trim()) {
      setError("Введите пользователя и пароль или PIN.");
      return;
    }

    const now = new Date();
    onLogin?.({
      authenticated: true,
      server,
      lastLogin: now.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      user: {
        name: userName.trim(),
        role: "Администратор",
        initials: userName.trim().slice(0, 2).toUpperCase(),
        status: "В системе",
      },
    });
  };

  return (
    <div className="desktop-login-screen">
      <section className="desktop-login-card">
        <div className="desktop-login-brand">
          <span aria-hidden="true">
            <ToolOutlined />
          </span>
          <div>
            <strong>InfoCollect</strong>
            <p>Вход в рабочее место администратора</p>
          </div>
        </div>

        <form className="desktop-login-form" onSubmit={handleSubmit}>
          <label>
            <span>Сервер</span>
            <input value={server} onChange={(event) => setServer(event.target.value)} />
          </label>
          <label>
            <span>Пользователь</span>
            <input value={userName} onChange={(event) => {
              setUserName(event.target.value);
              setError("");
            }} />
          </label>
          <label>
            <span>Пароль или PIN</span>
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
            />
          </label>

          <div className={`desktop-login-status is-${connectionStatus.status}`}>
            {connectionStatus.status === "success" ? <CheckCircleOutlined aria-hidden="true" /> : <WarningOutlined aria-hidden="true" />}
            <span>{connectionStatus.text}</span>
          </div>
          {error ? <div className="desktop-login-error">{error}</div> : null}

          <div className="desktop-login-actions">
            <button className="desktop-login-primary" type="submit">Войти</button>
            <button className="desktop-login-secondary" type="button" onClick={handleCheckConnection}>
              Проверить подключение
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
