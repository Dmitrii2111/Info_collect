import { useState } from "react";
import { Avatar, Dropdown } from "antd";
import {
  BellOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  ToolOutlined,
  UserOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import {
  DESKTOP_ADMIN_SECTIONS,
  DESKTOP_PRIMARY_SECTIONS,
  DESKTOP_SECTION_META,
} from "./desktopNavigation.js";
import { DesktopScreen } from "./DesktopScreen.jsx";
import { DesktopModalShell } from "./components/DesktopModalShell.jsx";

const PREVIEW_USER = {
  name: "Иван Иванов",
  role: "Администратор",
  initials: "ИИ",
};

function SidebarItem({ item, active, onSelect }) {
  const Icon = item.icon;

  return (
    <button
      className={`desktop-shell-nav-item${active ? " is-active" : ""}`}
      type="button"
      onClick={() => onSelect(item.key)}
    >
      <Icon aria-hidden="true" />
      <span>{item.label}</span>
    </button>
  );
}

function SidebarSection({ items, activeKey, onSelect }) {
  return (
    <nav className="desktop-shell-nav" aria-label="Разделы системы">
      {items.map((item) => (
        <SidebarItem
          key={item.key}
          item={item}
          active={item.key === activeKey}
          onSelect={onSelect}
        />
      ))}
    </nav>
  );
}

export function DesktopShell({ session, onLogout }) {
  const [activeSectionKey, setActiveSectionKey] = useState("dashboard");
  const [activeModal, setActiveModal] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const activeSection = DESKTOP_SECTION_META[activeSectionKey] ?? DESKTOP_SECTION_META.dashboard;
  const currentUser = session?.user ?? PREVIEW_USER;
  const currentServer = session?.server ?? "http://192.168.1.10:8000";

  const profileMenu = {
    items: [
      {
        key: "profile",
        icon: <UserOutlined />,
        label: "Профиль",
      },
      {
        key: "switchUser",
        icon: <UserSwitchOutlined />,
        label: "Сменить пользователя",
      },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Выйти",
        danger: true,
      },
    ],
    onClick: ({ key }) => {
      if (key === "profile") {
        setActiveModal("profile");
        return;
      }

      setConfirmAction(key);
    },
  };

  return (
    <div className="desktop-app-shell">
      <div className="desktop-shell-layout">
        <aside className="desktop-shell-sidebar">
          <div className="desktop-shell-brand">
            <div className="desktop-shell-brand-mark">
              <ToolOutlined aria-hidden="true" />
            </div>
            <div>
              <strong>INFOCOLLECT</strong>
              <span>MVP v0.1</span>
            </div>
          </div>

          <div className="desktop-shell-sidebar-scroll">
            <SidebarSection
              items={DESKTOP_PRIMARY_SECTIONS}
              activeKey={activeSectionKey}
              onSelect={setActiveSectionKey}
            />

            <div className="desktop-shell-nav-group-label">Администрирование</div>

            <SidebarSection
              items={DESKTOP_ADMIN_SECTIONS}
              activeKey={activeSectionKey}
              onSelect={setActiveSectionKey}
            />
          </div>

          <div className="desktop-shell-sidebar-footer">
            <div className="desktop-shell-sidebar-links">
              <button className="desktop-shell-sidebar-link" type="button" onClick={() => setActiveModal("help")}>
                <QuestionCircleOutlined aria-hidden="true" />
                Помощь
              </button>
              <button className="desktop-shell-sidebar-link is-danger" type="button" onClick={() => setConfirmAction("logout")}>
                <LogoutOutlined aria-hidden="true" />
                Выйти
              </button>
            </div>
            <div className="desktop-shell-profile-block">
              <div className="desktop-shell-profile-avatar" aria-hidden="true">
                {currentUser.initials}
              </div>
              <div className="desktop-shell-profile-info">
                <strong>{currentUser.name}</strong>
                <small>{currentUser.role}</small>
              </div>
            </div>
          </div>
        </aside>

        <div className="desktop-shell-main">
          <header className="desktop-shell-header">
            <div className="desktop-shell-title-block">
              <h1>{activeSection.title}</h1>
              <p>{activeSection.subtitle}</p>
            </div>
            <label className="desktop-shell-search">
              <SearchOutlined aria-hidden="true" />
              <input aria-label="Поиск по системе" placeholder="Поиск по системе..." type="search" />
            </label>

            <div className="desktop-shell-header-actions">
              <button className="desktop-shell-bell" type="button" aria-label="Уведомления">
                <BellOutlined aria-hidden="true" />
                <span className="desktop-shell-bell-dot" aria-hidden="true" />
              </button>

              <span className="desktop-shell-status">
                <span aria-hidden="true" />
                Сервер подключён
              </span>

              <div className="desktop-shell-header-sep" aria-hidden="true" />

              <Dropdown menu={profileMenu} trigger={["click"]}>
                <button className="desktop-shell-profile" type="button">
                  <div className="desktop-shell-profile-text">
                    <span className="desktop-shell-profile-name">{currentUser.name}</span>
                    <span className="desktop-shell-profile-role">{currentUser.role}</span>
                  </div>
                  <Avatar size={32} icon={<UserOutlined />} />
                </button>
              </Dropdown>
            </div>
          </header>

          <main className="desktop-shell-content">
            <DesktopScreen sectionKey={activeSection.key} onNavigate={setActiveSectionKey} />
          </main>
        </div>
      </div>

      {activeModal === "profile" ? (
        <DesktopModalShell
          title="Профиль"
          subtitle="Текущая desktop-сессия"
          size="narrow"
          onClose={() => setActiveModal(null)}
          footer={(
            <>
              <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={() => setConfirmAction("switchUser")}>
                <UserSwitchOutlined aria-hidden="true" />
                Сменить пользователя
              </button>
              <button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={() => setConfirmAction("logout")}>
                <LogoutOutlined aria-hidden="true" />
                Выйти
              </button>
            </>
          )}
        >
          <div className="desktop-profile-modal">
            <div className="desktop-profile-modal-avatar" aria-hidden="true">{currentUser.initials}</div>
            <div className="desktop-profile-modal-grid">
              <div><span>ФИО</span><strong>{currentUser.name}</strong></div>
              <div><span>Роль</span><strong>{currentUser.role}</strong></div>
              <div><span>Статус</span><strong>{currentUser.status ?? "В системе"}</strong></div>
              <div><span>Последний вход</span><strong>{session?.lastLogin ?? "Текущая сессия"}</strong></div>
              <div><span>Сервер</span><strong>{currentServer}</strong></div>
            </div>
          </div>
        </DesktopModalShell>
      ) : null}

      {activeModal === "help" ? (
        <DesktopModalShell
          title="Помощь"
          subtitle="Быстрая инструкция по рабочему месту"
          size="narrow"
          onClose={() => setActiveModal(null)}
          footer={(
            <button className="reg-modal-btn reg-modal-btn-primary" type="button" onClick={() => setActiveModal(null)}>
              Закрыть
            </button>
          )}
        >
          <ul className="desktop-help-list">
            <li>Выберите раздел в левом меню, чтобы открыть объекты, инспекции, склад, отчеты или синхронизацию.</li>
            <li>Используйте фильтры и поиск внутри разделов, чтобы сузить список записей.</li>
            <li>Открывайте карточки объектов, оборудования и складских позиций через строки таблиц и кнопки действий.</li>
            <li>При проблемах с синхронизацией откройте раздел “Синхронизация” и проверьте очередь отправки.</li>
            <li>При ошибке доступа обратитесь к администратору системы.</li>
          </ul>
        </DesktopModalShell>
      ) : null}

      {confirmAction ? (
        <DesktopModalShell
          title={confirmAction === "switchUser" ? "Сменить пользователя" : "Выйти"}
          subtitle={
            confirmAction === "switchUser"
              ? "Вы уверены, что хотите сменить пользователя?"
              : "Вы уверены, что хотите выйти?"
          }
          size="narrow"
          onClose={() => setConfirmAction(null)}
          footer={(
            <>
              <button className="reg-modal-btn reg-modal-btn-secondary" type="button" onClick={() => setConfirmAction(null)}>
                Отмена
              </button>
              <button
                className="reg-modal-btn reg-modal-btn-primary"
                type="button"
                onClick={() => {
                  setConfirmAction(null);
                  setActiveModal(null);
                  onLogout?.();
                }}
              >
                {confirmAction === "switchUser" ? <UserSwitchOutlined aria-hidden="true" /> : <LogoutOutlined aria-hidden="true" />}
                {confirmAction === "switchUser" ? "Сменить пользователя" : "Выйти"}
              </button>
            </>
          )}
        >
          <div className="desktop-confirm-inline">
            <SafetyCertificateOutlined aria-hidden="true" />
            <span>Текущая сессия будет завершена на этом рабочем месте.</span>
          </div>
        </DesktopModalShell>
      ) : null}
    </div>
  );
}
