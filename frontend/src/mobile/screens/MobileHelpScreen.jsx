import { ArrowLeftOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { MobileBottomNav } from "../components/MobileBottomNav.jsx";

const helpItems = [
  "Войдите в систему или продолжите офлайн после первого входа.",
  "Откройте объекты, выберите корпус, этаж и зону.",
  "Продолжите обход из главного экрана, объектов или структуры.",
  "В помещении проверьте позиции и откройте карточку оборудования при необходимости.",
  "Расхождения сохраняются локально и доступны в отдельном разделе.",
  "Синхронизация отправит локальные изменения при доступном соединении.",
];

export function MobileHelpScreen({ activeNavKey, onBack, onNavSelect }) {
  return (
    <div className="mobile-help-screen">
      <header className="mobile-history-header">
        <button type="button" aria-label="Назад" onClick={onBack}>
          <ArrowLeftOutlined aria-hidden="true" />
        </button>
        <h1>Помощь</h1>
      </header>

      <main className="mobile-help-content">
        <section className="mobile-card mobile-help-card">
          <h2>Краткая инструкция</h2>
          <div>
            {helpItems.map((item) => (
              <p key={item}>
                <CheckCircleOutlined aria-hidden="true" />
                {item}
              </p>
            ))}
          </div>
        </section>
      </main>

      <MobileBottomNav activeKey={activeNavKey} onSelect={onNavSelect} />
    </div>
  );
}
