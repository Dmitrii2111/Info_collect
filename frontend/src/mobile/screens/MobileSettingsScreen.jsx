import { useMemo, useState } from "react";
import {
  ArrowLeftOutlined,
  DatabaseOutlined,
  InfoCircleOutlined,
  MobileOutlined,
  SyncOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";
import { MobileBottomSheet } from "../components/MobileBottomSheet.jsx";
import { MobileConfirmModal } from "../components/MobileConfirmModal.jsx";
import { MobileResultModal } from "../components/MobileResultModal.jsx";
import { mobileSettingsData } from "../data/mobileMockData.js";
import { getMobileDeviceLabel } from "../utils/mobileDevice.js";

const appInfoIcons = {
  device: MobileOutlined,
  info: InfoCircleOutlined,
  user: UserOutlined,
};

const photoQualityTones = {
  "Низкое": "low",
  "Среднее": "medium",
  "Высокое": "high",
};

function SettingsToggle({ item, checked, onChange }) {
  return (
    <button className="mobile-settings-toggle-row" type="button" onClick={onChange}>
      <div>
        <strong>{item.title}</strong>
        <span>{item.subtitle}</span>
      </div>
      <span className={`mobile-settings-switch${checked ? " is-on" : ""}`} aria-hidden="true">
        <i />
      </span>
    </button>
  );
}

export function MobileSettingsScreen({ activeNavKey, onBack, onOpenSync, onNavSelect }) {
  const data = mobileSettingsData;
  const initialToggles = useMemo(
    () => Object.fromEntries(data.modeToggles.map((item) => [item.key, item.enabled])),
    [data.modeToggles],
  );
  const [serverAddress, setServerAddress] = useState(data.server.address);
  const [toggles, setToggles] = useState(initialToggles);
  const [photoCompression, setPhotoCompression] = useState(data.photo.compressionEnabled);
  const [photoQuality, setPhotoQuality] = useState(data.photo.quality);
  const [result, setResult] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isServerEditOpen, setIsServerEditOpen] = useState(false);
  const [draftServerAddress, setDraftServerAddress] = useState(data.server.address);
  const [toggleResult, setToggleResult] = useState({
    serverCheck: true,
    serverSave: true,
    retry: true,
    refresh: true,
    clearCache: true,
  });

  const handleToggle = (key) => {
    setToggles((current) => ({ ...current, [key]: !current[key] }));
  };

  const showAlternatingResult = (key, successText, errorText, successTitle = "Готово", errorTitle = "Ошибка") => {
    const isSuccess = toggleResult[key];
    setToggleResult((current) => ({ ...current, [key]: !current[key] }));
    setResult({
      status: isSuccess ? "success" : "error",
      title: isSuccess ? successTitle : errorTitle,
      text: isSuccess ? successText : errorText,
    });
  };

  const handleConfirmAction = (key) => {
    setConfirmAction(null);
    if (key === "refresh") {
      showAlternatingResult("refresh", "Данные обновлены.", "Не удалось обновить данные.");
      return;
    }

    showAlternatingResult("clearCache", "Локальный кэш очищен.", "Не удалось очистить кэш.");
  };

  return (
    <div className="mobile-settings-screen">
      <header className="mobile-settings-header">
        <button type="button" aria-label="Назад" onClick={onBack}>
          <ArrowLeftOutlined aria-hidden="true" />
        </button>
        <h1>Настройки</h1>
        <button type="button" aria-label="Синхронизация" onClick={onOpenSync}>
          <SyncOutlined aria-hidden="true" />
        </button>
      </header>

      <main className="mobile-settings-content">
        <section className="mobile-card mobile-settings-card">
          <h2>
            <DatabaseOutlined aria-hidden="true" />
            Сервер
          </h2>
          <label className="mobile-settings-input">
            <span>Адрес сервера</span>
            <input value={serverAddress} onChange={(event) => setServerAddress(event.target.value)} />
          </label>
          <div className="mobile-settings-row">
            <span>Статус</span>
            <strong className="is-success">{data.server.status}</strong>
          </div>
          <div className="mobile-settings-row">
            <span>Последняя проверка</span>
            <strong>{data.server.lastCheck}</strong>
          </div>
          <div className="mobile-settings-actions is-two">
            <button
              type="button"
              onClick={() =>
                showAlternatingResult(
                  "serverCheck",
                  "Подключение успешно.",
                  "Ошибка подключения. Проверьте адрес сервера и сеть.",
                  "Сервер доступен",
                  "Сервер недоступен",
                )
              }
            >
              Проверить
            </button>
            <button type="button" onClick={() => {
              setDraftServerAddress(serverAddress);
              setIsServerEditOpen(true);
            }}>
              Изменить
            </button>
          </div>
        </section>

        <section className="mobile-card mobile-settings-card">
          <h2>Режим работы</h2>
          <div className="mobile-settings-toggle-list">
            {data.modeToggles.map((item) => (
              <SettingsToggle
                item={item}
                checked={Boolean(toggles[item.key])}
                key={item.key}
                onChange={() => handleToggle(item.key)}
              />
            ))}
          </div>
        </section>

        <section className="mobile-card mobile-settings-sync-card">
          <h2>Синхронизация</h2>
          <div className="mobile-settings-sync-stats">
            {data.syncStats.map((stat) => (
              <div className={`is-${stat.tone}`} key={stat.key}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
          <div className="mobile-settings-actions">
            <button type="button" onClick={onOpenSync}>
              Открыть синхронизацию
            </button>
            <button
              type="button"
              onClick={() =>
                showAlternatingResult("retry", "Повторная отправка выполнена.", "Ошибка повторной отправки.")
              }
            >
              Повторить отправку
            </button>
          </div>
        </section>

        <section className="mobile-card mobile-settings-card mobile-settings-photo-card">
          <h2>Фото</h2>
          <SettingsToggle
            item={{ title: "Сжатие фото", subtitle: "Уменьшать размер файлов перед отправкой" }}
            checked={photoCompression}
            onChange={() => setPhotoCompression((current) => !current)}
          />
          <div className="mobile-settings-segmented" role="group" aria-label="Качество фото">
            {data.photo.qualities.map((quality) => (
              <button
                className={`${quality === photoQuality ? "is-active" : ""} is-${photoQualityTones[quality]}`}
                type="button"
                key={quality}
                onClick={() => setPhotoQuality(quality)}
              >
                {quality}
              </button>
            ))}
          </div>
          <div className="mobile-settings-row">
            <span>Максимум фото</span>
            <strong>{data.photo.maxPhotos}</strong>
          </div>
        </section>

        <section className="mobile-card mobile-settings-card">
          <h2>Локальные данные</h2>
          {data.localData.map((item) => (
            <div className="mobile-settings-row" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
          <button type="button" onClick={() => setConfirmAction("refresh")}>
            Обновить данные
          </button>
          <button className="is-danger" type="button" onClick={() => setConfirmAction("clearCache")}>
            Очистить локальный кэш
          </button>
        </section>

        <section className="mobile-card mobile-settings-card">
          <h2>Устройство и приложение</h2>
          <div className="mobile-settings-info-list">
            {data.appInfo.map((item) => {
              const Icon = appInfoIcons[item.icon] ?? InfoCircleOutlined;

              return (
                <div key={item.label}>
                  <span>
                    <Icon aria-hidden="true" />
                  </span>
                  <div>
                    <small>{item.label}</small>
                    <strong>{item.label === "Устройство" ? getMobileDeviceLabel() : item.value}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />

      {isServerEditOpen ? (
        <MobileBottomSheet
          title="Изменить сервер"
          subtitle="Введите адрес локального сервера"
          mode="modal"
          onClose={() => setIsServerEditOpen(false)}
          footer={({ close }) => (
            <>
              <button className="mobile-secondary-button" type="button" onClick={() => close(() => setIsServerEditOpen(false))}>
                Отмена
              </button>
              <button
                className="mobile-primary-button"
                type="button"
                onClick={() =>
                  close(() => {
                    const isSuccess = toggleResult.serverSave;
                    setToggleResult((current) => ({ ...current, serverSave: !current.serverSave }));
                    setIsServerEditOpen(false);
                    if (isSuccess) {
                      setServerAddress(draftServerAddress);
                    }
                    setResult({
                      status: isSuccess ? "success" : "error",
                      title: isSuccess ? "Адрес изменен" : "Не удалось изменить адрес",
                      text: isSuccess ? "Новый адрес сервера сохранен." : "Проверьте формат адреса и повторите.",
                    });
                  })
                }
              >
                Сохранить
              </button>
            </>
          )}
        >
          <label className="mobile-settings-input">
            <span>Адрес сервера</span>
            <input value={draftServerAddress} onChange={(event) => setDraftServerAddress(event.target.value)} />
          </label>
        </MobileBottomSheet>
      ) : null}

      <MobileConfirmModal
        isOpen={Boolean(confirmAction)}
        title={confirmAction === "refresh" ? "Обновить данные" : "Очистить локальный кэш"}
        text={
          confirmAction === "refresh"
            ? "Загрузить свежие данные?"
            : "Очистить локальный кэш?"
        }
        confirmLabel={confirmAction === "refresh" ? "Обновить" : "Очистить"}
        tone={confirmAction === "clearCache" ? "danger" : "primary"}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => handleConfirmAction(confirmAction)}
      />

      <MobileResultModal
        isOpen={Boolean(result)}
        status={result?.status}
        title={result?.title}
        text={result?.text}
        onClose={() => setResult(null)}
      />
    </div>
  );
}
