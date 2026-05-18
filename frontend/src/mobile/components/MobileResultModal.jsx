import { CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { MobileBottomSheet } from "./MobileBottomSheet.jsx";

const statusConfig = {
  success: {
    icon: CheckCircleOutlined,
    title: "Готово",
  },
  error: {
    icon: CloseCircleOutlined,
    title: "Ошибка",
  },
  info: {
    icon: InfoCircleOutlined,
    title: "Информация",
  },
};

export function MobileResultModal({ isOpen, status = "info", title, text, actions = [], onClose }) {
  if (!isOpen) {
    return null;
  }

  const config = statusConfig[status] ?? statusConfig.info;
  const Icon = config.icon;

  return (
    <MobileBottomSheet
      title={title ?? config.title}
      mode="modal"
      onClose={onClose}
      className={`mobile-result-sheet is-${status}`}
      footer={({ close }) => (
        <>
          {(actions.length > 0 ? actions : [{ label: "Закрыть", onClick: onClose }]).map((action) => (
            <button
              className={action.tone === "secondary" ? "mobile-secondary-button" : "mobile-primary-button"}
              type="button"
              key={action.label}
              onClick={() => close(action.onClick ?? onClose)}
            >
              {action.label}
            </button>
          ))}
        </>
      )}
    >
      <div className="mobile-result-body">
        <span className="mobile-result-icon" aria-hidden="true">
          <Icon />
        </span>
        {text ? <p>{text}</p> : null}
      </div>
    </MobileBottomSheet>
  );
}
