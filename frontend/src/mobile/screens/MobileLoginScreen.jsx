import { CustomerServiceOutlined, InfoCircleOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { useState } from "react";
import { MobileBottomSheet } from "../components/MobileBottomSheet.jsx";
import { MobileResultModal } from "../components/MobileResultModal.jsx";
import { mobileLoginState } from "../data/mobileMockData.js";

export function MobileLoginScreen({ onLogin }) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [isNextCheckSuccess, setIsNextCheckSuccess] = useState(true);

  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin();
  };

  const handleConnectionCheck = () => {
    const isSuccess = isNextCheckSuccess;
    setIsNextCheckSuccess((current) => !current);
    setCheckResult({
      status: isSuccess ? "success" : "error",
      title: isSuccess ? "Подключение успешно" : "Ошибка подключения",
      text: isSuccess
        ? "Сервер доступен в текущей сети."
        : "Проверьте адрес сервера и подключение к общей сети.",
    });
  };

  return (
    <div className="mobile-login-screen">
      <header className="mobile-login-hero">
        <div className="mobile-login-brand">
          <SafetyCertificateOutlined aria-hidden="true" />
          <h1>InfoCollect</h1>
        </div>
        <p className="mobile-login-title">Проверка помещений и оборудования</p>
        <span>Локальная система сбора данных</span>
      </header>

      <main className="mobile-login-content">
        <section className="mobile-card mobile-login-card">
          <h2>Вход в систему</h2>
          <form className="mobile-form" onSubmit={handleSubmit}>
            <label>
              <span>Сервер</span>
              <input type="text" defaultValue={mobileLoginState.server} />
            </label>
            <div className="mobile-login-field-help">
              <span>
                <InfoCircleOutlined aria-hidden="true" />
                Сервер не проверен
              </span>
              <button type="button" onClick={handleConnectionCheck}>Проверить подключение</button>
            </div>

            <label>
              <span>Пользователь</span>
              <input type="text" placeholder="Введите логин" />
            </label>

            <label>
              <span>Пароль или PIN</span>
              <input type="password" placeholder="Введите пароль или PIN" />
            </label>

            <div className="mobile-login-actions">
              <button className="mobile-primary-button" type="submit">
                Войти
              </button>
              <button className="mobile-secondary-button" type="button" onClick={onLogin}>
                Продолжить офлайн
              </button>
              <p>Доступно только после первого успешного входа в сеть</p>
            </div>
          </form>
        </section>

        <section className="mobile-card mobile-status-card">
          <h3>Состояние подключения</h3>
          <div>
            <span>Сервер</span>
            <strong>{mobileLoginState.serverStatus}</strong>
          </div>
          <div>
            <span>Синхронизация</span>
            <strong>{mobileLoginState.syncStatus}</strong>
          </div>
          <div>
            <span>Локальные данные</span>
            <strong>{mobileLoginState.localDataStatus}</strong>
          </div>
        </section>

        <section className="mobile-card mobile-pwa-hint">
          <CustomerServiceOutlined aria-hidden="true" />
          <p>
            <strong>Работа на устройстве:</strong> Для удобства добавьте InfoCollect на главный
            экран через меню браузера.
          </p>
        </section>
      </main>

      <footer className="mobile-login-footer">
        <p>{mobileLoginState.appVersion}</p>
        <button type="button" onClick={() => setIsHelpOpen(true)}>
          <CustomerServiceOutlined aria-hidden="true" />
          Помощь с подключением
        </button>
      </footer>

      {isHelpOpen ? (
        <MobileBottomSheet
          title="Помощь с подключением"
          subtitle="Проверьте базовые условия перед входом"
          mode="sheet"
          onClose={() => setIsHelpOpen(false)}
          footer={({ close }) => (
            <button className="mobile-primary-button" type="button" onClick={() => close(() => setIsHelpOpen(false))}>
              Закрыть
            </button>
          )}
        >
          <ul className="mobile-help-list">
            <li>Проверьте адрес сервера в поле входа.</li>
            <li>Убедитесь, что устройство и сервер находятся в одной сети.</li>
            <li>Нажмите «Проверить подключение».</li>
            <li>Если ошибка повторяется, обратитесь к администратору.</li>
          </ul>
        </MobileBottomSheet>
      ) : null}

      <MobileResultModal
        isOpen={Boolean(checkResult)}
        status={checkResult?.status}
        title={checkResult?.title}
        text={checkResult?.text}
        onClose={() => setCheckResult(null)}
      />
    </div>
  );
}
