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
import { MobileHeader } from "../components/MobileHeader.jsx";
import { mobileProfileData } from "../data/mobileMockData.js";

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

export function MobileProfileScreen({ activeNavKey, onOpenMenu, onOpenHistory, onOpenSettings, onOpenSync, onNavSelect }) {
  const data = mobileProfileData;
  const [feedback, setFeedback] = useState("");

  const handleProfileAction = (key) => {
    if (key === "logout") {
      setFeedback("Выход доступен после подтверждения");
      return;
    }

    setFeedback(`${key === "switchUser" ? "Смена пользователя" : "Раздел"} отмечен локально`);
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
              {data.user.device}
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
          <button type="button" onClick={() => setFeedback("Обход выбран локально")}>
            <PlayCircleOutlined aria-hidden="true" />
            Продолжить обход
          </button>
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
          <button type="button" onClick={() => setFeedback("Повторная отправка отмечена локально")}>
            Повторить отправку
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
                ) : (
                  <>
                    <div className="mobile-profile-zone-track" aria-hidden="true">
                      <span style={{ width: `${zone.progress}%` }} />
                    </div>
                    <small>{zone.progressLabel}</small>
                  </>
                )}
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
                      : setFeedback(`${item.title}: раздел будет доступен позже`)
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
    </div>
  );
}
