import { useState } from "react";
import {
  BellOutlined,
  CameraOutlined,
  CloudUploadOutlined,
  DatabaseOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  LogoutOutlined,
  PlayCircleOutlined,
  QuestionCircleOutlined,
  RightOutlined,
  SettingOutlined,
  SyncOutlined,
  UnorderedListOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";
import { MobileBottomSheet } from "../components/MobileBottomSheet.jsx";
import { MobileConfirmModal } from "../components/MobileConfirmModal.jsx";
import { MobileHeader } from "../components/MobileHeader.jsx";
import { MobileResultModal } from "../components/MobileResultModal.jsx";
import { mobileProfileData } from "../data/mobileMockData.js";
import { getMobileDeviceLabel } from "../utils/mobileDevice.js";

const settingIcons = {
  camera: CameraOutlined,
  help: QuestionCircleOutlined,
  history: UnorderedListOutlined,
  mode: SettingOutlined,
  notifications: BellOutlined,
  server: DatabaseOutlined,
};

const accountIcons = {
  logout: LogoutOutlined,
  switch: UserSwitchOutlined,
};

function ProfileMenuRow({ item, iconMap, onSelect }) {
  const Icon = iconMap[item.icon] ?? InfoCircleOutlined;

  return (
    <button className={`mobile-profile-menu-row is-${item.tone ?? "default"}`} type="button" onClick={onSelect}>
      <span>
        <Icon aria-hidden="true" />
      </span>
      <div>
        <strong>{item.title}</strong>
        {item.subtitle ? <small>{item.subtitle}</small> : null}
      </div>
      <RightOutlined aria-hidden="true" />
    </button>
  );
}

export function MobileProfileScreen({
  activeNavKey,
  onOpenMenu,
  onOpenHistory,
  onOpenSettings,
  onOpenSync,
  onContinueWalkthrough,
  onLogout,
  onNavSelect,
  profileData,
}) {
  const data = profileData ?? mobileProfileData;
  const [feedback, setFeedback] = useState("");
  const [result, setResult] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [infoSheet, setInfoSheet] = useState(null);

  const settingDetails = {
    server: {
      title: "Сервер",
      text: `Текущий адрес: http://192.168.1.10:8000. Статус подключения: ${data.user.status}.`,
      action: "Открыть настройки сервера",
      onAction: onOpenSettings,
    },
    photo: {
      title: "Фото",
      text: "Сжатие включено. Качество можно изменить в настройках фото, чтобы уменьшить размер отправки.",
      action: "Открыть настройки фото",
      onAction: onOpenSettings,
    },
    notifications: {
      title: "Уведомления",
      text: "Уведомления включены. Приложение покажет ошибки синхронизации и важные статусы обхода.",
    },
    help: {
      title: "Помощь",
      text: "Откройте объект, выберите зону, проверяйте помещения и отправляйте изменения через синхронизацию.",
    },
  };

  const handleProfileAction = (key) => {
    if (key === "logout" || key === "switchUser") {
      setConfirmAction(key);
      return;
    }

    setFeedback("Действие выполнено");
  };

  return (
    <div className="mobile-profile-screen">
      <MobileHeader
        title="Профиль"
        onMenu={onOpenMenu}
        onSync={onOpenSync}
      />

      <main className="mobile-profile-content">
        <section className="mobile-card mobile-profile-user-card">
          <div className="mobile-profile-user-head">
            <div className="mobile-profile-avatar" aria-hidden="true">
              {data.user.initials}
            </div>
            <div>
              <div>
                <h2>{data.user.name}</h2>
                <span>{data.user.status}</span>
              </div>
              <p>{data.user.role}</p>
            </div>
          </div>
          <div className="mobile-profile-device">
            <p>
              <SyncOutlined aria-hidden="true" />
              {data.user.lastSync}
            </p>
            <p>
              <InfoCircleOutlined aria-hidden="true" />
              {getMobileDeviceLabel()}
            </p>
          </div>
        </section>

        <section className="mobile-card mobile-profile-today">
          <header>
            <h3>Сегодня</h3>
          </header>
          <div className="mobile-profile-stat-grid">
            {data.today.stats.map((stat) => (
              <div className={`is-${stat.tone}`} key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
          <p>{data.today.current}</p>
          {data.today.canContinue ? (
            <button type="button" onClick={onContinueWalkthrough}>
              <PlayCircleOutlined aria-hidden="true" />
              Продолжить обход
            </button>
          ) : null}
        </section>

        <section className="mobile-card mobile-profile-sync-card">
          <h3>Синхронизация</h3>
          <div>
            <span>Статус</span>
            <strong>{data.sync.status}</strong>
          </div>
          <p className="is-primary">
            <CloudUploadOutlined aria-hidden="true" />
            {data.sync.pending}
          </p>
          <p className="is-warning">
            <ExclamationCircleOutlined aria-hidden="true" />
            {data.sync.conflicts}
          </p>
          <p className="is-error">
            <ExclamationCircleOutlined aria-hidden="true" />
            {data.sync.errors}
          </p>
          <button type="button" onClick={onOpenSync}>
            Открыть синхронизацию
          </button>
        </section>

        <section className="mobile-profile-section">
          <h3>Назначенные зоны</h3>
          <div className="mobile-card mobile-profile-zones">
            {data.zones.map((zone) => (
              <article className={`is-${zone.tone}`} key={zone.id}>
                <div>
                  <strong>{zone.title}</strong>
                  <span>{zone.subtitle}</span>
                </div>
                <em>{zone.status}</em>
                {zone.warning ? (
                  <p>
                    <ExclamationCircleOutlined aria-hidden="true" />
                    {zone.warning}
                  </p>
                ) : null}
                <div className="mobile-profile-zone-track" aria-hidden="true">
                  <span style={{ width: `${zone.progress}%` }} />
                </div>
                <small>{zone.progressLabel}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="mobile-profile-section">
          <h3>Настройки</h3>
          <div className="mobile-card mobile-profile-menu">
            {data.settings.map((item) => (
              <ProfileMenuRow
                item={item}
                iconMap={settingIcons}
                key={item.key}
                onSelect={() =>
                  item.key === "workMode"
                    ? onOpenSettings?.()
                    : item.key === "history"
                      ? onOpenHistory?.()
                    : setInfoSheet(settingDetails[item.key])
                }
              />
            ))}
          </div>
        </section>

        <section className="mobile-profile-section">
          <h3>Аккаунт</h3>
          <div className="mobile-card mobile-profile-menu">
            {data.account.map((item) => (
              <ProfileMenuRow
                item={item}
                iconMap={accountIcons}
                key={item.key}
                onSelect={() => handleProfileAction(item.key)}
              />
            ))}
          </div>
        </section>

        {feedback ? <div className="mobile-profile-feedback">{feedback}</div> : null}

        <footer className="mobile-profile-footer">{data.appVersion}</footer>
      </main>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />

      {infoSheet ? (
        <MobileBottomSheet
          title={infoSheet.title}
          mode="sheet"
          onClose={() => setInfoSheet(null)}
          footer={({ close }) => (
            <>
              {infoSheet.action ? (
                <button
                  className="mobile-primary-button"
                  type="button"
                  onClick={() => close(() => {
                    setInfoSheet(null);
                    infoSheet.onAction?.();
                  })}
                >
                  {infoSheet.action}
                </button>
              ) : null}
              <button className="mobile-secondary-button" type="button" onClick={() => close(() => setInfoSheet(null))}>
                Закрыть
              </button>
            </>
          )}
        >
          <p className="mobile-profile-sheet-text">{infoSheet.text}</p>
        </MobileBottomSheet>
      ) : null}

      <MobileConfirmModal
        isOpen={Boolean(confirmAction)}
        title={confirmAction === "switchUser" ? "Сменить пользователя" : "Выйти"}
        text={
          confirmAction === "switchUser"
            ? "Вы уверены, что хотите сменить пользователя?"
            : "Вы уверены, что хотите выйти?"
        }
        confirmLabel={confirmAction === "switchUser" ? "Сменить пользователя" : "Выйти"}
        tone={confirmAction === "logout" ? "danger" : "primary"}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          setConfirmAction(null);
          onLogout?.();
        }}
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
