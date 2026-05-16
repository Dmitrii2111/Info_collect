import { MenuOutlined, SyncOutlined } from "@ant-design/icons";

export function MobileHeader({ title, onMenu, onSync }) {
  return (
    <header className="mobile-header">
      <button className="mobile-icon-button" type="button" aria-label="Меню" onClick={onMenu}>
        <MenuOutlined aria-hidden="true" />
      </button>
      <h1>{title}</h1>
      <button
        className="mobile-icon-button"
        type="button"
        aria-label="Синхронизация"
        onClick={onSync}
      >
        <SyncOutlined aria-hidden="true" />
      </button>
    </header>
  );
}
