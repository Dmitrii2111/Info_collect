import {
  AppstoreOutlined,
  CloseOutlined,
  DatabaseOutlined,
  DiffOutlined,
  HomeOutlined,
  LogoutOutlined,
  ProfileOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  SyncOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { mobileDrawerData } from "../data/mobileMockData.js";

const drawerIcons = {
  dashboard: HomeOutlined,
  discrepancies: DiffOutlined,
  help: QuestionCircleOutlined,
  history: UnorderedListOutlined,
  inspections: ProfileOutlined,
  logout: LogoutOutlined,
  objects: AppstoreOutlined,
  profile: UserOutlined,
  settings: SettingOutlined,
  sync: SyncOutlined,
  warehouse: DatabaseOutlined,
};

function DrawerItem({ item, isActive, onSelect }) {
  const Icon = drawerIcons[item.icon] ?? AppstoreOutlined;

  return (
    <button
      className={`mobile-drawer-item${isActive ? " is-active" : ""}${item.tone ? ` is-${item.tone}` : ""}`}
      type="button"
      onClick={() => onSelect(item)}
    >
      <span>
        <Icon aria-hidden="true" />
        {item.label}
      </span>
      {item.badge ? <em>{item.badge}</em> : null}
    </button>
  );
}

export function MobileSideDrawer({ activeKey, onClose, onSelect }) {
  const data = mobileDrawerData;
  const [isClosing, setIsClosing] = useState(false);

  const close = (afterClose) => {
    if (isClosing) {
      return;
    }

    setIsClosing(true);
    window.setTimeout(() => {
      if (typeof afterClose === "function") {
        afterClose();
        return;
      }

      onClose();
    }, 220);
  };

  const handleSelect = (item) => {
    close(() => onSelect(item));
  };

  return (
    <div className={`mobile-drawer-overlay${isClosing ? " is-closing" : ""}`} role="presentation">
      <button className="mobile-drawer-backdrop" type="button" aria-label="Закрыть меню" onClick={() => close()} />
      <aside className="mobile-side-drawer" role="dialog" aria-modal="true" aria-label="Боковое меню">
        <header className="mobile-drawer-header">
          <div className="mobile-drawer-user">
            <div aria-hidden="true">{data.user.initials}</div>
            <div>
              <strong>{data.appName}</strong>
              <span>{data.user.name}</span>
            </div>
          </div>
          <button type="button" aria-label="Закрыть меню" onClick={() => close()}>
            <CloseOutlined aria-hidden="true" />
          </button>
          <div className="mobile-drawer-status">
            <span aria-hidden="true" />
            <strong>{data.user.status} • {data.user.role}</strong>
            <small>{data.user.sync}</small>
          </div>
        </header>

        <nav className="mobile-drawer-nav" aria-label="Основное меню">
          {data.mainItems.map((item) => (
            <DrawerItem item={item} isActive={item.key === activeKey} key={item.key} onSelect={handleSelect} />
          ))}
        </nav>

        <div className="mobile-drawer-secondary">
          {data.secondaryItems.map((item) => (
            <DrawerItem item={item} isActive={item.key === activeKey} key={item.key} onSelect={handleSelect} />
          ))}
        </div>

        <footer className="mobile-drawer-footer">{data.version}</footer>
      </aside>
    </div>
  );
}
