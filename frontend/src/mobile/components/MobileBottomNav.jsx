import {
  AppstoreOutlined,
  HomeFilled,
  ProfileOutlined,
  ShopOutlined,
  UserOutlined,
} from "@ant-design/icons";

const MOBILE_NAV_ITEMS = [
  { key: "dashboard", label: "Главная", icon: HomeFilled },
  { key: "objects", label: "Объекты", icon: AppstoreOutlined },
  { key: "inspections", label: "Инспекции", icon: ProfileOutlined },
  { key: "warehouse", label: "Склад", icon: ShopOutlined },
  { key: "profile", label: "Профиль", icon: UserOutlined },
];

export function MobileBottomNav({ activeKey = "dashboard", onSelect }) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Основная мобильная навигация">
      {MOBILE_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.key === activeKey;

        return (
          <button
            className={`mobile-bottom-nav-item${isActive ? " is-active" : ""}`}
            type="button"
            key={item.key}
            onClick={() => onSelect?.(item.key)}
          >
            <Icon aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
