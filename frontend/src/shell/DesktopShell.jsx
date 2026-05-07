import { useState } from "react";
import { Avatar, Dropdown } from "antd";
import {
  BellOutlined,
  LogoutOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  ToolOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  DESKTOP_ADMIN_SECTIONS,
  DESKTOP_PRIMARY_SECTIONS,
  DESKTOP_SECTION_META,
} from "./desktopNavigation.js";
import { DesktopScreen } from "./DesktopScreen.jsx";
import { HistoryScreen } from "./HistoryScreen.jsx";

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

export function DesktopShell() {
  const [activeSectionKey, setActiveSectionKey] = useState("dashboard");
  const activeSection = DESKTOP_SECTION_META[activeSectionKey] ?? DESKTOP_SECTION_META.dashboard;

  const profileMenu = {
    items: [
      {
        key: "profile",
        icon: <UserOutlined />,
        label: "Профиль",
      },
    ],
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
              <button className="desktop-shell-sidebar-link" type="button">
                <QuestionCircleOutlined aria-hidden="true" />
                Помощь
              </button>
              <Dropdown menu={profileMenu} trigger={["click"]}>
                <button className="desktop-shell-sidebar-link is-danger" type="button">
                  <LogoutOutlined aria-hidden="true" />
                  Выйти
                </button>
              </Dropdown>
            </div>
            <div className="desktop-shell-profile-block">
              <div className="desktop-shell-profile-avatar" aria-hidden="true">
                {PREVIEW_USER.initials}
              </div>
              <div className="desktop-shell-profile-info">
                <strong>{PREVIEW_USER.name}</strong>
                <small>{PREVIEW_USER.role}</small>
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
                    <span className="desktop-shell-profile-name">{PREVIEW_USER.name}</span>
                    <span className="desktop-shell-profile-role">{PREVIEW_USER.role}</span>
                  </div>
                  <Avatar size={32} icon={<UserOutlined />} />
                </button>
              </Dropdown>
            </div>
          </header>

          <main className="desktop-shell-content">
            {activeSectionKey === "history" ? (
              <HistoryScreen />
            ) : (
              <DesktopScreen sectionKey={activeSection.key} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
